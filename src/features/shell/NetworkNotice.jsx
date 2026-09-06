import React, { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';

export default function NetworkNotice() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    let handle;
    let active = true;
    Network.getStatus().then((status) => {
      if (active) setOnline(status.connected);
    }).catch(() => {});
    Network.addListener('networkStatusChange', (status) => setOnline(status.connected)).then((listener) => {
      if (active) handle = listener;
      else listener.remove();
    }).catch(() => {});
    const browserOnline = () => setOnline(true);
    const browserOffline = () => setOnline(false);
    window.addEventListener('online', browserOnline);
    window.addEventListener('offline', browserOffline);
    return () => {
      active = false;
      handle?.remove();
      window.removeEventListener('online', browserOnline);
      window.removeEventListener('offline', browserOffline);
    };
  }, []);

  if (online) return null;
  return (
    <div role="status" className="network-notice">
      You are offline. Draft check-ins stay on this device; saving and AI readings need a connection.
    </div>
  );
}
