'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import OnboardingWizard from '../../components/onboarding/OnboardingWizard';

export default function OnboardingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkExisting() {
      try {
        const res = await fetch('/api/tournament', { headers: { 'ngrok-skip-browser-warning': 'true' } });
        const data = await res.json();
        if (data.state) {
          router.replace('/');
          return;
        }
      } catch (err) {
        console.error('Failed to check existing tournament:', err);
      }
      setChecking(false);
    }
    checkExisting();
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <span className="text-sm font-bold uppercase tracking-wider">Verificando...</span>
        </div>
      </div>
    );
  }

  return <OnboardingWizard />;
}
