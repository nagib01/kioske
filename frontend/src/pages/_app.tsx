import AuthGuard from "../components/AuthGuard";
import { ToastProvider } from "../components/Toast";
import { StudentAuthProvider } from "../contexts/StudentAuthContext";
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useEffect } from 'react';
import "../styles/global.css";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const hostname = window.location.hostname;
      const shouldUnregister = hostname === 'localhost' || hostname === '127.0.0.1' || window.location.search.includes('disable_sw=1') || process.env.NEXT_PUBLIC_DISABLE_SW === 'true';
      if (shouldUnregister && 'serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
          for (const reg of regs) reg.unregister();
        }).catch(() => {});
      }
    } catch (e) {}
  }, []);
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <ToastProvider>
        <StudentAuthProvider>
          <AuthGuard>
            <Component {...pageProps} />
          </AuthGuard>
        </StudentAuthProvider>
      </ToastProvider>
    </>
  );
}