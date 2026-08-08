import React from 'react';
import { Participant } from '../types/tournament';
import { User, Shirt, RefreshCcw } from 'lucide-react';

interface ParticipantsEditorProps {
  participants: Participant[];
  onUpdateName: (id: string, name: string) => void;
  onUpdateTeam: (id: string, team: string) => void;
  onRestoreDefaults: () => void;
}

export default function ParticipantsEditor({
  participants,
  onUpdateName,
  onUpdateTeam,
  onRestoreDefaults,
}: ParticipantsEditorProps) {
  const groups = Array.from(
    new Set(participants.map(p => p.groupId).filter((g): g is 'A' | 'B' => !!g))
  ).sort();

  const renderGroup = (groupLabel: string | null, group: Participant[]) => (
    <div key={groupLabel ?? 'none'} className="rounded-xl border border-zinc-850 bg-zinc-900/40 p-5">
      {groupLabel && (
        <div className="mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
            {groupLabel}
          </div>
          <h3 className="font-bold text-zinc-200">Grupo {groupLabel}</h3>
        </div>
      )}
      <div className="space-y-3">
        {group.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3">
            <span className="w-8 text-center text-xs font-bold text-zinc-500">
              {groupLabel ? `${groupLabel}${i + 1}` : p.seed}
            </span>
            <div className="relative flex-1">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
              <input
                type="text"
                value={p.name}
                onChange={(e) => onUpdateName(p.id, e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                placeholder={`Participante ${i + 1}`}
              />
            </div>
            <div className="relative flex-1">
              <Shirt className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
              <input
                type="text"
                value={p.team ?? ''}
                onChange={(e) => onUpdateTeam(p.id, e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-4 text-sm text-zinc-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all font-medium"
                placeholder="Time"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Editar Participantes</h2>
          <p className="text-sm text-zinc-400">
            Ajuste os nomes e times dos jogadores. As alterações serão refletidas em todas as rodadas e classificações.
          </p>
        </div>
        <button
          onClick={onRestoreDefaults}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
        >
          <RefreshCcw className="h-3.5 w-3.5 text-emerald-500" />
          <span>Restaurar nomes padrão</span>
        </button>
      </div>

      <div className={`grid gap-6 ${groups.length >= 2 ? 'md:grid-cols-2' : ''}`}>
        {groups.length > 0
          ? groups.map(g => renderGroup(g, participants.filter(p => p.groupId === g)))
          : renderGroup(null, [...participants].sort((a, b) => a.seed - b.seed))}
      </div>
    </div>
  );
}
