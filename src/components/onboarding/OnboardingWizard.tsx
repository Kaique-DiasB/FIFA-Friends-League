'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  WizardFormatInput,
  WizardParticipantInput,
  generateParticipants,
  generateChampionshipConfig,
  buildInitialTournamentState,
} from '../../utils/tournamentHelpers';
import { useToast } from '../../utils/useToast';
import WizardShell from './WizardShell';
import StepParticipants, { MIN_PARTICIPANTS, MAX_PARTICIPANTS } from './StepParticipants';
import StepFormat, { fastPreset, completePreset } from './StepFormat';
import StepKnockoutStages from './StepKnockoutStages';
import StepReview from './StepReview';

const STEP_COPY = [
  {
    title: 'Quem vai jogar?',
    description: 'Cadastre os participantes e, se quiser, o time de cada um.',
  },
  {
    title: 'Como você quer jogar?',
    description: 'Escolha um estilo pronto ou personalize do seu jeito.',
  },
  {
    title: 'Confira as fases do mata-mata',
    description: 'Geradas automaticamente a partir da quantidade de jogadores.',
  },
  {
    title: 'Tudo pronto?',
    description: 'Confira as escolhas antes de criar o campeonato.',
  },
];

function makeEmptyEntries(count: number): WizardParticipantInput[] {
  return Array.from({ length: count }, () => ({ name: '', team: '' }));
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { toastMessage, showToast } = useToast();

  const [step, setStep] = useState(0);
  const [participantCount, setParticipantCount] = useState(8);
  const [entries, setEntries] = useState<WizardParticipantInput[]>(() => makeEmptyEntries(8));
  const [preset, setPreset] = useState<'fast' | 'complete' | null>('fast');
  const [format, setFormat] = useState<WizardFormatInput>(fastPreset());
  const [submitting, setSubmitting] = useState(false);

  const handleParticipantCountChange = (n: number) => {
    const clamped = Math.min(MAX_PARTICIPANTS, Math.max(MIN_PARTICIPANTS, n || MIN_PARTICIPANTS));
    setParticipantCount(clamped);
    setEntries(prev => {
      const next = [...prev];
      while (next.length < clamped) next.push({ name: '', team: '' });
      next.length = clamped;
      return next;
    });
    if (preset === 'complete') {
      setFormat(completePreset(clamped));
    }
  };

  const handleEntryChange = (index: number, field: 'name' | 'team', value: string) => {
    setEntries(prev => prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)));
  };

  const handleSelectPreset = (p: 'fast' | 'complete') => {
    setPreset(p);
    setFormat(p === 'fast' ? fastPreset() : completePreset(participantCount));
  };

  const handleChangeFormat = (patch: Partial<WizardFormatInput>) => {
    setPreset(null);
    setFormat(prev => ({ ...prev, ...patch }));
  };

  const canProceedFromParticipants = entries.every(e => e.name.trim().length > 0);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const participants = generateParticipants(entries, format.hasGroupStage ? format.groupCount : 0);
      const config = generateChampionshipConfig(participantCount, format);
      const state = buildInitialTournamentState(config, participants);

      const res = await fetch('/api/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) throw new Error('Falha ao salvar o campeonato');

      localStorage.setItem('fifa_tournament_state', JSON.stringify(state));
      router.push('/');
    } catch (err) {
      console.error('Failed to create tournament:', err);
      showToast('Erro ao criar o campeonato. Tente novamente.');
      setSubmitting(false);
    }
  };

  const copy = STEP_COPY[step];

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-zinc-900 border border-red-500/30 px-4 py-3 text-sm font-bold text-red-400 shadow-2xl animate-fade-in">
          <span>{toastMessage}</span>
        </div>
      )}

      <WizardShell
        step={step}
        totalSteps={STEP_COPY.length}
        title={copy.title}
        description={copy.description}
        onBack={step > 0 ? () => setStep(s => s - 1) : undefined}
        onNext={step < 3 ? () => setStep(s => s + 1) : handleConfirm}
        nextLabel={step < 3 ? 'Avançar' : 'Criar campeonato'}
        nextDisabled={step === 0 && !canProceedFromParticipants}
        submitting={submitting}
      >
        {step === 0 && (
          <StepParticipants
            participantCount={participantCount}
            onParticipantCountChange={handleParticipantCountChange}
            entries={entries}
            onEntryChange={handleEntryChange}
          />
        )}
        {step === 1 && (
          <StepFormat
            participantCount={participantCount}
            format={format}
            preset={preset}
            onSelectPreset={handleSelectPreset}
            onChangeFormat={handleChangeFormat}
          />
        )}
        {step === 2 && (
          <StepKnockoutStages
            participantCount={participantCount}
            format={format}
            onChangeFormat={handleChangeFormat}
          />
        )}
        {step === 3 && (
          <StepReview participantCount={participantCount} entries={entries} format={format} />
        )}
      </WizardShell>
    </>
  );
}
