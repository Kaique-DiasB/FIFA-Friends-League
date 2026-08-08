import React from 'react';
import {
  WizardFormatInput,
  WizardParticipantInput,
  generateChampionshipConfig,
  getVisibleStages,
} from '../../utils/tournamentHelpers';

interface StepReviewProps {
  participantCount: number;
  entries: WizardParticipantInput[];
  format: WizardFormatInput;
}

export default function StepReview({ participantCount, entries, format }: StepReviewProps) {
  const config = generateChampionshipConfig(participantCount, format);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
          Participantes ({participantCount})
        </h3>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          {entries.map((e, i) => (
            <li key={i} className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-zinc-200">
              <span className="font-semibold">{e.name || `Jogador ${i + 1}`}</span>
              {e.team && <span className="text-zinc-500"> — {e.team}</span>}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Formato</h3>
        <ul className="space-y-1.5 text-sm text-zinc-200">
          <li className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2">
            {config.hasGroupStage
              ? `Fase de grupos: ${config.groupCount} grupo${config.groupCount > 1 ? 's' : ''}, ${config.qualifiersPerGroup} classificado${config.qualifiersPerGroup > 1 ? 's' : ''} por grupo`
              : 'Sem fase de grupos — direto no mata-mata'}
          </li>
          {getVisibleStages(config).map(stage => (
            <li key={stage.id} className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3 py-2 flex justify-between">
              <span>{stage.id === 'prelim' ? 'Rodada Preliminar' : stage.label}</span>
              <span className="text-zinc-500">{stage.legs === 2 ? 'ida e volta' : 'jogo único'}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
