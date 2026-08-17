'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

interface WizardShellProps {
  step: number;
  totalSteps: number;
  title: string;
  description?: string;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  submitting?: boolean;
  children: React.ReactNode;
}

export default function WizardShell({
  step,
  totalSteps,
  title,
  description,
  onBack,
  onNext,
  nextLabel = 'Avançar',
  nextDisabled,
  submitting,
  children,
}: WizardShellProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Bem-vindo ao seu campeonato de FIFA!
          </h1>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Step dots */}
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-emerald-500' : i < step ? 'w-4 bg-emerald-500/50' : 'w-4 bg-zinc-800'
                }`}
              />
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-zinc-400">{description}</p>}
          </div>

          <div>{children}</div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-850">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                disabled={submitting}
                className="flex items-center gap-1 rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-850 hover:text-white transition disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>
            ) : (
              <span />
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled || submitting}
                className="flex items-center gap-1 rounded-xl bg-emerald-500 px-5 py-2 text-sm font-bold text-black hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
              >
                {submitting ? 'Criando...' : nextLabel} <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
