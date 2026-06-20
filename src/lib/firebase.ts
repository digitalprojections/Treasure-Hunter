/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyC-wY-hPtDQ4ikIihoQwCVRIT7j_lbbncI",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "big-genre-172004.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "big-genre-172004",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "big-genre-172004.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "926254455801",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:926254455801:web:6e72c5dc6b62125ef37b28",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
