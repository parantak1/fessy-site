import React, { useState, useEffect } from 'react';
import UserReceiverPage from '../app/[username]/page';

export default function App() {
  const [username, setUsername] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.replace(/^\/+/, '');
      if (path) {
        const parts = path.split('/');
        const raw = parts[parts.length - 1];
        if (raw && raw !== 'index.html') {
          return decodeURIComponent(raw).replace(/^@/, '');
        }
      }
      try {
        const queryParam = new URLSearchParams(window.location.search).get('u');
        if (queryParam) return decodeURIComponent(queryParam).replace(/^@/, '');
      } catch {
        // ignore
      }
    }
    return 'jennywilson';
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.replace(/^\/+/, '');
      if (path) {
        const parts = path.split('/');
        const raw = parts[parts.length - 1];
        if (raw && raw !== 'index.html') {
          setUsername(decodeURIComponent(raw).replace(/^@/, ''));
        }
      }
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  return <UserReceiverPage params={{ username }} />;
}

