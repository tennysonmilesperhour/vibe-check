import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { isNativeApp } from '@/lib/native'

document.documentElement.classList.toggle('native-app', isNativeApp)

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Offline shell could not be registered:', error);
    });
  });
}
