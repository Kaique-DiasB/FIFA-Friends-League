import React from 'react';
import { WizardParticipantInput } from '../../utils/tournamentHelpers';
import { User, Shirt, Minus, Plus } from 'lucide-react';

interface StepParticipantsProps {
  participantCount: number;
  onParticipantCountChange: (n: number) => void;
  entries: WizardParticipantInput[];
  onEntryChange: (index: number, field: 'name' | 'team', value: string) => void;
}

export const MIN_PARTICIPANTS = 2;
export const MAX_PARTICIPANTS = 24;

export default function StepParticipants({
  participantCount,
  onParticipantCountChange,
  entries,
  onEntryChange,
}: StepParticipantsProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-zinc-200 mb-2 text-center">
          Quantas pessoas vão jogar?
        </label>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onParticipantCountChange(participantCount - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-850 hover:text-white transition"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={MIN_PARTICIPANTS}
            max={MAX_PARTICIPANTS}
            value={participantCount}
            onChange={(e) => onParticipantCountChange(parseInt(e.target.value, 10) || MIN_PARTICIPANTS)}
            className="w-16 rounded-lg border border-zinc-800 bg-zinc-950 py-2 text-center text-lg font-black text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
          <button
            type="button"
            onClick={() => onParticipantCountChange(participantCount + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-850 hover:text-white transition"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-zinc-500">De {MIN_PARTICIPANTS} a {MAX_PARTICIPANTS} jogadores</p>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {entries.map((entry, i) => (
          <div key={i} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5">
            <span className="w-5 shrink-0 text-center text-xs font-bold text-zinc-500">{i + 1}</span>
            <div className="relative flex-1">
              <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                value={entry.name}
                onChange={(e) => onEntryChange(i, 'name', e.target.value)}
                placeholder={`Nome do jogador ${i + 1}`}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pl-8 pr-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              />
            </div>
            <div className="relative flex-1">
              <Shirt className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" />
              <input
                type="text"
                value={entry.team ?? ''}
                onChange={(e) => onEntryChange(i, 'team', e.target.value)}
                placeholder="Time (opcional)"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 pl-8 pr-2 text-sm text-zinc-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
