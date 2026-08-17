'use client';

import { useState } from 'react';

export function useToast() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 3000);
  };

  return { toastMessage, showToast };
}
