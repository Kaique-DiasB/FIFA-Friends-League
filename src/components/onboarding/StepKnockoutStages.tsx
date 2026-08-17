import React from 'react';
import { WizardFormatInput, buildStageLadder } from '../../utils/tournamentHelpers';
import { Check } from 'lucide-react';

interface StepKnockoutStagesProps {
  participantCount: number;
  format: WizardFormatInput;
  onChangeFormat: (patch: Partial<WizardFormatInput>) => void;
}

export default function StepKnockoutStages({
  participantCount,
  format,
  onChangeFormat,
}: StepKnockoutStagesProps) {
  const knockoutEntrantCount = format.hasGroupStage
    ? format.qualifiersPerGroup * format.groupCount
    : participantCount;

  const ladder = buildStageLadder(knockoutEntrantCount);
  const preFinal = ladder[ladder.length - 2];
  const canHaveThirdPlace = !!preFinal && preFinal.slotCount === 2;

  return (
    <div className="space-y-6">
      {format.hasGroupStage && (
        <p className="text-center text-xs text-zinc-500">
          {knockoutEntrantCount} jogadores entram no mata-mata (os classificados da fase de grupos).
        </p>
      )}

      <div className="space-y-2">
        {ladder.map(stage => (
          <div
            key={stage.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold text-zinc-200">
              {stage.id === 'prelim' ? 'Rodada Preliminar (playoff)' : stage.label}
            </span>
            <span className="ml-auto text-xs text-zinc-500">
              {stage.slotCount} confronto{stage.slotCount > 1 ? 's' : ''}{stage.id !== 'prelim' && format.legs === 2 ? ' • ida e volta' : ''}
            </span>
          </div>
        ))}
      </div>

      {canHaveThirdPlace && (
        <label className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 cursor-pointer hover:border-zinc-700 transition">
          <input
            type="checkbox"
            checked={format.hasThirdPlace}
            onChange={(e) => onChangeFormat({ hasThirdPlace: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-emerald-500 focus:ring-emerald-500/40"
          />
          <span className="text-sm font-semibold text-zinc-200">Disputa de 3º lugar</span>
          <span className="ml-auto text-xs text-zinc-500">quem perde a semifinal decide o bronze</span>
        </label>
      )}
    </div>
  );
}
