import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowOnlineToast(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 4000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: '#cf1010', color: 'white', padding: '12px 20px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px', zIndex: 9999, fontWeight: 'bold',
          boxShadow: '0 6px 20px rgba(207, 16, 16, 0.3)', fontSize: '14px', width: 'max-content',
          maxWidth: '90%', textAlign: 'center'
        }}>
          <WifiOff size={20} style={{ flexShrink: 0 }} />
          <span>Sin conexión a Internet. Usando modo offline.</span>
        </div>
      )}
      
      {showOnlineToast && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: '#10b981', color: 'white', padding: '12px 20px', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px', zIndex: 9999, fontWeight: 'bold',
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)', fontSize: '14px', width: 'max-content',
          maxWidth: '90%', textAlign: 'center'
        }}>
          <Wifi size={20} style={{ flexShrink: 0 }} />
          <span>Conexión recuperada.</span>
        </div>
      )}
    </>
  );
}
