# Points Ledger Consumer Starter

Copy this file into any app that needs to call the Points Ledger service. Replace
the placeholder values, keep the secret server-side only, and call the API only
from trusted app/server code.

Do not call point mutation endpoints directly from browser or mobile clients.

## Values You Need

Ask the Points Ledger service owner for:

```dotenv
POINTS_API_URL=https://points.example.com
POINTS_APP_ID=your_app_id
POINTS_APP_SECRET=replace_with_real_secret
```

The service deployment must also include your app ID in
`POINTS_ALLOWED_APP_IDS` and must set the matching secret as
`POINTS_APP_SECRET_<APP_ID>`, where non-alphanumeric characters become `_` and
the name is uppercase.

Examples:

```text
bozor -> POINTS_APP_SECRET_BOZOR
my-shop -> POINTS_APP_SECRET_MY_SHOP
```

## Responsibility Split

- Your app authenticates the end user.
- Your server decides when points should be awarded, deducted, reversed, or read.
- The Points Ledger API authenticates your server using HMAC request signing.
- The user's ledger identifier is their email address.
- Store point transaction IDs returned by the API when useful for audit,
  support, order history, cancellations, or refunds.

## Email Rule

Normalize emails before sending:

```ts
const ledgerEmail = user.email.trim().toLowerCase();
```

Do not apply Gmail-style alias removal, dot removal, provider-specific rules, or
domain rewrites unless the Points Ledger service explicitly adopts that rule.

## Authentication

Every request to protected endpoints must include:

```http
X-Points-App-Id: <POINTS_APP_ID>
X-Points-Timestamp: <ISO timestamp>
X-Points-Signature: sha256=<hex hmac>
```

Mutation requests must also include:

```http
Content-Type: application/json
Idempotency-Key: <stable source event key>
```

The signature payload is exactly:

```text
HTTP_METHOD_UPPERCASE
PATH_WITH_QUERY
X-Points-Timestamp
RAW_REQUEST_BODY
```

Important details:

- `PATH_WITH_QUERY` is only the path and query, for example
  `/v1/users/customer%40example.com/transactions?limit=25`.
- `RAW_REQUEST_BODY` is the exact JSON string sent on the wire.
- For `GET` requests, the raw body is an empty string.
- The timestamp must be current. The default service tolerance is 300 seconds.

## Idempotency

Every mutation must use a stable idempotency key derived from the business event.
Use the same key on retries.

Good:

```text
bozor:order:12345:reward-points
bozor:checkout:12345:redeem-points
bozor:order:12345:cancel-reward-points
admin:ticket-456:manual-adjustment
```

Bad:

```text
crypto.randomUUID()
```

Random keys are fine for unique objects, but not for retrying ledger mutations.
If a timeout happens and you generate a new key, the ledger cannot know it is the
same source event.

## TypeScript Server Helper

This helper uses only Node's built-in `crypto` and the global `fetch` available
in modern Node versions.

```ts
import crypto from "node:crypto";

type PointsMethod = "GET" | "POST";

type PointsConfig = {
  baseUrl: string;
  appId: string;
  secret: string;
};

type SignedRequest = {
  method: PointsMethod;
  path: string;
  body?: unknown;
  idempotencyKey?: string;
};

function normalizedLedgerEmail(email: string) {
  return email.trim().toLowerCase();
}

function jsonBody(body: unknown) {
  return body === undefined ? "" : JSON.stringify(body);
}

function pointsSignature(input: {
  method: PointsMethod;
  path: string;
  timestamp: string;
  rawBody: string;
  secret: string;
}) {
  const payload = [
    input.method.toUpperCase(),
    input.path,
    input.timestamp,
    input.rawBody,
  ].join("\n");

  return `sha256=${crypto
    .createHmac("sha256", input.secret)
    .update(payload)
    .digest("hex")}`;
}

function buildPointsRequest(config: PointsConfig, request: SignedRequest) {
  const timestamp = new Date().toISOString();
  const rawBody = jsonBody(request.body);

  return {
    url: `${config.baseUrl}${request.path}`,
    body: rawBody,
    headers: {
      "X-Points-App-Id": config.appId,
      "X-Points-Timestamp": timestamp,
      "X-Points-Signature": pointsSignature({
        method: request.method,
        path: request.path,
        timestamp,
        rawBody,
        secret: config.secret,
      }),
      ...(request.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
      ...(request.idempotencyKey
        ? { "Idempotency-Key": request.idempotencyKey }
        : {}),
    },
  };
}

async function callPointsApi<T>(
  config: PointsConfig,
  request: SignedRequest,
): Promise<T> {
  const signed = buildPointsRequest(config, request);
  const response = await fetch(signed.url, {
    method: request.method,
    headers: signed.headers,
    body: request.method === "GET" ? undefined : signed.body,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const code = payload?.error?.code ?? "points_api_error";
    const message = payload?.error?.message ?? `Points API failed: ${response.status}`;
    const error = new Error(message) as Error & {
      status?: number;
      code?: string;
      details?: unknown;
    };
    error.status = response.status;
    error.code = code;
    error.details = payload?.error?.details;
    throw error;
  }

  return payload as T;
}

const pointsConfig: PointsConfig = {
  baseUrl: process.env.POINTS_API_URL!,
  appId: process.env.POINTS_APP_ID!,
  secret: process.env.POINTS_APP_SECRET!,
};
```

### TypeScript Award Example

```ts
type PointsTransaction = {
  transaction_id: string;
  status: "completed" | "failed" | "reversed" | "pending";
  email: string;
  type: "award" | "deduct" | "reversal";
  amount: number;
  balance_before: number;
  balance_after: number;
  idempotency_key: string;
  source_event_id: string;
  reason: string;
  reversed_transaction_id: string | null;
  failure_code: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

async function awardPurchasePoints(userEmail: string, orderId: string) {
  return callPointsApi<PointsTransaction>(pointsConfig, {
    method: "POST",
    path: "/v1/transactions/award",
    idempotencyKey: `your-app:order:${orderId}:reward-points`,
    body: {
      email: normalizedLedgerEmail(userEmail),
      amount: 100,
      reason: "purchase_reward",
      source_event_id: `order:${orderId}`,
      metadata: {
        order_id: orderId,
      },
    },
  });
}
```

### TypeScript Deduct Example

```ts
async function deductCheckoutPoints(userEmail: string, checkoutId: string) {
  try {
    return await callPointsApi<PointsTransaction>(pointsConfig, {
      method: "POST",
      path: "/v1/transactions/deduct",
      idempotencyKey: `your-app:checkout:${checkoutId}:redeem-points`,
      body: {
        email: normalizedLedgerEmail(userEmail),
        amount: 50,
        reason: "checkout_redemption",
        source_event_id: `checkout:${checkoutId}`,
        metadata: {
          checkout_id: checkoutId,
        },
      },
    });
  } catch (error) {
    const pointsError = error as Error & { status?: number; code?: string };
    if (pointsError.status === 409 && pointsError.code === "insufficient_balance") {
      // Show an insufficient-points message or skip applying the discount.
      return null;
    }
    throw error;
  }
}
```

### TypeScript Balance Example

```ts
type PointsBalance = {
  email: string;
  balance: number;
  updated_at: string;
};

async function getPointsBalance(userEmail: string) {
  const encodedEmail = encodeURIComponent(normalizedLedgerEmail(userEmail));
  return callPointsApi<PointsBalance>(pointsConfig, {
    method: "GET",
    path: `/v1/users/${encodedEmail}/balance`,
  });
}
```

### TypeScript Transaction History Example

```ts
type PointsTransactionPage = {
  email: string;
  transactions: PointsTransaction[];
  next_cursor: string | null;
};

async function getPointsTransactions(userEmail: string, cursor?: string) {
  const encodedEmail = encodeURIComponent(normalizedLedgerEmail(userEmail));
  const query = new URLSearchParams({ limit: "50" });
  if (cursor) {
    query.set("cursor", cursor);
  }

  return callPointsApi<PointsTransactionPage>(pointsConfig, {
    method: "GET",
    path: `/v1/users/${encodedEmail}/transactions?${query.toString()}`,
  });
}
```

### TypeScript Reverse Example

Use reversal for cancellation/refund/undo flows. Do not manually subtract points
to undo a previous award if you have the original transaction ID.

```ts
async function reversePointsTransaction(
  originalTransactionId: string,
  orderId: string,
) {
  return callPointsApi<PointsTransaction>(pointsConfig, {
    method: "POST",
    path: "/v1/transactions/reverse",
    idempotencyKey: `your-app:order:${orderId}:reverse-points`,
    body: {
      transaction_id: originalTransactionId,
      reason: "order_cancelled",
      source_event_id: `order:${orderId}:cancelled`,
      metadata: {
        order_id: orderId,
      },
    },
  });
}
```

## Laravel/PHP Server Helper

Add env values to the consuming Laravel app:

```dotenv
POINTS_API_URL=https://points.example.com
POINTS_APP_ID=your_app_id
POINTS_APP_SECRET=replace_with_real_secret
```

Add service config:

```php
// config/services.php
'points' => [
    'url' => env('POINTS_API_URL'),
    'app_id' => env('POINTS_APP_ID'),
    'secret' => env('POINTS_APP_SECRET'),
],
```

Helper:

```php
<?php

use Illuminate\Support\Facades\Http;

function points_ledger_email(string $email): string
{
    return strtolower(trim($email));
}

function points_signature(
    string $method,
    string $path,
    string $timestamp,
    string $body,
    string $secret
): string {
    $payload = implode("\n", [
        strtoupper($method),
        $path,
        $timestamp,
        $body,
    ]);

    return 'sha256=' . hash_hmac('sha256', $payload, $secret);
}

function points_request(
    string $method,
    string $path,
    ?array $bodyArray = null,
    ?string $idempotencyKey = null
) {
    $baseUrl = rtrim(config('services.points.url'), '/');
    $appId = config('services.points.app_id');
    $secret = config('services.points.secret');
    $timestamp = now()->toJSON();
    $body = $bodyArray === null
        ? ''
        : json_encode($bodyArray, JSON_UNESCAPED_SLASHES);

    $headers = [
        'X-Points-App-Id' => $appId,
        'X-Points-Timestamp' => $timestamp,
        'X-Points-Signature' => points_signature(
            $method,
            $path,
            $timestamp,
            $body,
            $secret
        ),
    ];

    if ($bodyArray !== null) {
        $headers['Content-Type'] = 'application/json';
    }

    if ($idempotencyKey !== null) {
        $headers['Idempotency-Key'] = $idempotencyKey;
    }

    $request = Http::withHeaders($headers);

    if (strtoupper($method) === 'GET') {
        return $request->get($baseUrl . $path);
    }

    return $request
        ->withBody($body, 'application/json')
        ->send(strtoupper($method), $baseUrl . $path);
}
```

### Laravel Award Example

```php
$orderId = (string) $order->id;

$response = points_request(
    'POST',
    '/v1/transactions/award',
    [
        'email' => points_ledger_email($user->email),
        'amount' => 100,
        'reason' => 'purchase_reward',
        'source_event_id' => 'order:' . $orderId,
        'metadata' => [
            'order_id' => $orderId,
        ],
    ],
    'your-app:order:' . $orderId . ':reward-points'
);

if ($response->failed()) {
    throw new RuntimeException('Points API failed: ' . $response->body());
}

$transaction = $response->json();
```

### Laravel Deduct Example

```php
$checkoutId = (string) $checkout->id;

$response = points_request(
    'POST',
    '/v1/transactions/deduct',
    [
        'email' => points_ledger_email($user->email),
        'amount' => 50,
        'reason' => 'checkout_redemption',
        'source_event_id' => 'checkout:' . $checkoutId,
        'metadata' => [
            'checkout_id' => $checkoutId,
        ],
    ],
    'your-app:checkout:' . $checkoutId . ':redeem-points'
);

if ($response->status() === 409 && $response->json('error.code') === 'insufficient_balance') {
    // Show an insufficient-points message or continue without the discount.
} elseif ($response->failed()) {
    throw new RuntimeException('Points API failed: ' . $response->body());
}
```

### Laravel Balance Example

```php
$email = rawurlencode(points_ledger_email($user->email));
$response = points_request('GET', '/v1/users/' . $email . '/balance');

if ($response->failed()) {
    throw new RuntimeException('Points API failed: ' . $response->body());
}

$balance = $response->json();
```

## Endpoint Summary

### `GET /health`

Public process health. No HMAC required.

### `POST /v1/transactions/award`

Awards points.

```json
{
  "email": "customer@example.com",
  "amount": 100,
  "reason": "purchase_reward",
  "source_event_id": "order:12345",
  "metadata": {
    "order_id": "12345"
  }
}
```

### `POST /v1/transactions/deduct`

Deducts points. If negative balances are disabled and the user lacks points,
the API returns `409` with error code `insufficient_balance`.

```json
{
  "email": "customer@example.com",
  "amount": 50,
  "reason": "checkout_redemption",
  "source_event_id": "checkout:12345",
  "metadata": {
    "checkout_id": "12345"
  }
}
```

### `POST /v1/transactions/reverse`

Creates a reversal ledger entry for a previous completed transaction.

```json
{
  "transaction_id": "txn_...",
  "reason": "order_cancelled",
  "source_event_id": "order:12345:cancelled",
  "metadata": {
    "order_id": "12345"
  }
}
```

### `GET /v1/users/:email/balance`

Returns:

```json
{
  "email": "customer@example.com",
  "balance": 50,
  "updated_at": "2026-06-25T01:00:00.000Z"
}
```

Use URL encoding for the email path segment:

```text
/v1/users/customer%40example.com/balance
```

### `GET /v1/users/:email/transactions`

Query parameters:

```text
limit=50
cursor=<next_cursor from prior page>
```

Returns:

```json
{
  "email": "customer@example.com",
  "transactions": [],
  "next_cursor": null
}
```

## Transaction Response Shape

Mutation responses and transaction history entries use this shape:

```json
{
  "transaction_id": "txn_...",
  "status": "completed",
  "email": "customer@example.com",
  "type": "award",
  "amount": 100,
  "balance_before": 0,
  "balance_after": 100,
  "idempotency_key": "your-app:order:12345:reward-points",
  "source_event_id": "order:12345",
  "reason": "purchase_reward",
  "reversed_transaction_id": null,
  "failure_code": null,
  "metadata": {
    "order_id": "12345"
  },
  "created_at": "2026-06-25T01:00:00.000Z",
  "updated_at": "2026-06-25T01:00:00.000Z"
}
```

Statuses:

- `completed`: applied successfully.
- `failed`: terminal failure, such as insufficient balance.
- `reversed`: original transaction has been reversed by another ledger entry.
- `pending`: accepted but not terminal yet. This should not remain indefinitely.

## Error Shape

Errors use:

```json
{
  "error": {
    "code": "insufficient_balance",
    "message": "Insufficient balance.",
    "request_id": "req_...",
    "details": {
      "transaction_id": "txn_...",
      "balance": 25
    }
  }
}
```

Common error codes:

- `invalid_request`
- `unauthorized_app`
- `invalid_signature`
- `idempotency_conflict`
- `insufficient_balance`
- `transaction_not_found`
- `stale_transaction_recovery_failed`
- `internal_error`

## Retry Rules

- Retry network failures, timeouts, and `5xx` responses.
- Reuse the same idempotency key for the same source event.
- Do not retry validation errors until the request body is fixed.
- Treat a successful response for an existing idempotency key as the original
  result.
- If you receive `idempotency_conflict`, stop and inspect your key generation.
  The same key was reused for different transaction details.

## Where To Hook This In Your App

Typical award points triggers:

- order paid
- first listing created
- admin adjustment
- promotion grant

Typical deduct points triggers:

- checkout redemption
- paid feature use
- subscription/perk redemption

Typical reversal triggers:

- order cancelled after award
- refund issued
- accidental admin adjustment
- failed fulfillment after points were granted

Store these fields in your app when possible:

- source event ID, such as order ID or checkout ID
- idempotency key
- returned `transaction_id`
- returned `balance_after`
- error `request_id` when a call fails

## Pre-Launch Checklist For Each App

- `POINTS_API_URL`, `POINTS_APP_ID`, and `POINTS_APP_SECRET` are configured only
  on the server.
- No Points Ledger secret is exposed to browser/mobile code.
- Emails are trimmed and lowercased before sending.
- Every mutation uses a stable idempotency key from the source business event.
- Retries reuse the same idempotency key.
- Deduct flow handles `409 insufficient_balance`.
- Cancellation/refund flow uses `/v1/transactions/reverse` when reversing a
  known transaction.
- Logs avoid raw emails unless needed for support and allowed by your app's data
  policy.
- You have tested award, duplicate retry, deduct, insufficient balance, balance
  read, transaction history, and reversal against the target Points Ledger URL.
