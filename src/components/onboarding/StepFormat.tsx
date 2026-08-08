import React from 'react';
import { WizardFormatInput } from '../../utils/tournamentHelpers';
import { Zap, ListChecks, Check } from 'lucide-react';

interface StepFormatProps {
  participantCount: number;
  format: WizardFormatInput;
  preset: 'fast' | 'complete' | null;
  onSelectPreset: (preset: 'fast' | 'complete') => void;
  onChangeFormat: (patch: Partial<WizardFormatInput>) => void;
}

export function fastPreset(): WizardFormatInput {
  return { hasGroupStage: false, groupCount: 0, qualifiersPerGroup: 0, legs: 1, hasThirdPlace: false };
}

export function completePreset(participantCount: number): WizardFormatInput {
  const groupCount: 0 | 1 | 2 = participantCount >= 6 ? 2 : participantCount >= 3 ? 1 : 0;
  const hasGroupStage = groupCount > 0;
  const perGroup = hasGroupStage ? Math.floor(participantCount / groupCount) : participantCount;
  const qualifiersPerGroup = hasGroupStage ? Math.max(2, Math.floor(perGroup / 2)) : 0;
  return { hasGroupStage, groupCount, qualifiersPerGroup, legs: 2, hasThirdPlace: true };
}

export default function StepFormat({
  participantCount,
  format,
  preset,
  onSelectPreset,
  onChangeFormat,
}: StepFormatProps) {
  const canHaveTwoGroups = participantCount >= 4;
  const maxQualifiers = format.groupCount === 2 ? Math.floor(participantCount / 2) : participantCount;

  const handleGroupCountChange = (groupCount: 0 | 1 | 2) => {
    if (groupCount === 0) {
      onChangeFormat({ hasGroupStage: false, groupCount: 0, qualifiersPerGroup: 0 });
      return;
    }
    const perGroup = groupCount === 2 ? Math.floor(participantCount / 2) : participantCount;
    onChangeFormat({
      hasGroupStage: true,
      groupCount,
      qualifiersPerGroup: Math.min(format.qualifiersPerGroup || 2, perGroup) || Math.min(2, perGroup),
    });
  };

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelectPreset('fast')}
          className={`text-left rounded-xl border p-4 transition ${
            preset === 'fast' ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">Rápido</span>
            {preset === 'fast' && <Check className="h-3.5 w-3.5 text-emerald-400 ml-auto" />}
          </div>
          <p className="text-xs text-zinc-400">Direto no mata-mata, jogo único, sem disputa de 3º lugar.</p>
        </button>

        <button
          type="button"
          onClick={() => onSelectPreset('complete')}
          className={`text-left rounded-xl border p-4 transition ${
            preset === 'complete' ? 'border-emerald-500 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <ListChecks className="h-4 w-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">Completo</span>
            {preset === 'complete' && <Check className="h-3.5 w-3.5 text-emerald-400 ml-auto" />}
          </div>
          <p className="text-xs text-zinc-400">Fase de grupos, ida e volta no mata-mata e disputa de 3º lugar.</p>
        </button>
      </div>

      {/* Advanced options */}
      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Personalizar</p>

        <div>
          <p className="text-sm font-semibold text-zinc-200 mb-2">Fase de grupos</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleGroupCountChange(0)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                !format.hasGroupStage ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              Sem fase de grupos
            </button>
            <button
              type="button"
              onClick={() => handleGroupCountChange(1)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                format.hasGroupStage && format.groupCount === 1 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              1 grupo
            </button>
            <button
              type="button"
              disabled={!canHaveTwoGroups}
              onClick={() => handleGroupCountChange(2)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition disabled:opacity-30 disabled:cursor-not-allowed ${
                format.hasGroupStage && format.groupCount === 2 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              2 grupos (A e B)
            </button>
          </div>
        </div>

        {format.hasGroupStage && (
          <div>
            <p className="text-sm font-semibold text-zinc-200 mb-2">Classificados por grupo</p>
            <input
              type="number"
              min={1}
              max={maxQualifiers}
              value={format.qualifiersPerGroup}
              onChange={(e) => {
                const val = Math.min(maxQualifiers, Math.max(1, parseInt(e.target.value, 10) || 1));
                onChangeFormat({ qualifiersPerGroup: val });
              }}
              className="w-20 rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 text-center text-sm font-bold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
            />
            <span className="ml-2 text-xs text-zinc-500">avançam para o mata-mata (máx. {maxQualifiers})</span>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-zinc-200 mb-2">Mata-mata</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChangeFormat({ legs: 1 })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                format.legs === 1 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              Jogo único
            </button>
            <button
              type="button"
              onClick={() => onChangeFormat({ legs: 2 })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition ${
                format.legs === 2 ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              Ida e volta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
