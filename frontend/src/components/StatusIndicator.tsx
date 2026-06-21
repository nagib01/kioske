// @ts-nocheck
import React, { useEffect, useState } from 'react';

export default function StatusIndicator() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    fetch('http://localhost:3001/status')
      .then(res => res.ok ? setOnline(true) : setOnline(false))
      .catch(() => setOnline(false));
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px' }}>
      <span style={{
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        backgroundColor: online ? '#22c55e' : '#ef4444',
        display: 'inline-block'
      }}></span>
      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
        {online ? 'Sistema Online' : 'Sistema Offline'}
      </span>
    </div>
  );
}