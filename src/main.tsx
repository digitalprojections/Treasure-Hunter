import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const DemoMode = lazy(() => import('./demo/DemoMode'));
const isDemo = new URLSearchParams(location.search).get('demo') === '1';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<div style={{background: '#06151e',color:'#f4deb2',padding:32}}>Preparing Treasure Hunter…</div>}>
      {isDemo ? <DemoMode /> : <App />}
    </Suspense>
  </StrictMode>,
);
