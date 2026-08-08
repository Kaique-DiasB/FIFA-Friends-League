import React, { useMemo, useState } from 'react';
import { Match, Participant } from '../types/tournament';
import MatchCard from './MatchCard';
import { Coffee, Calendar } from 'lucide-react';

interface GroupStageProps {
  groupMatches: Match[];
  participants: Participant[];
  namesMap: Record<string, string>;
  onUpdateScores: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
}

export default function GroupStage({
  groupMatches,
  participants,
  namesMap,
  onUpdateScores,
}: GroupStageProps) {
  const groups = useMemo(
    () => Array.from(new Set(groupMatches.map(m => m.groupId).filter((g): g is 'A' | 'B' => !!g))).sort(),
    [groupMatches]
  );
  const rounds = useMemo(
    () => Array.from(new Set(groupMatches.map(m => m.round))).sort((a, b) => a - b),
    [groupMatches]
  );

  const [activeRound, setActiveRound] = useState<number>(rounds[0] ?? 1);
  const currentRound = rounds.includes(activeRound) ? activeRound : (rounds[0] ?? 1);

  const gridColsClass = groups.length >= 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';

  return (
    <div className="space-y-6">
      {/* Round Switcher Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Fase de Grupos</h2>
          <p className="text-sm text-zinc-400">
            Acompanhe e preencha os resultados das {rounds.length} rodadas da fase de grupos.
          </p>
        </div>

        {/* Tabs for Rounds */}
        <div className="flex overflow-x-auto rounded-xl bg-zinc-950 p-1 border border-zinc-850">
          {rounds.map(r => (
            <button
              key={r}
              onClick={() => setActiveRound(r)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                currentRound === r
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Rodada {r}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Groups Grid */}
      <div className={`grid gap-6 ${gridColsClass}`}>
        {groups.map(g => {
          const roundMatches = groupMatches.filter(m => m.groupId === g && m.round === currentRound);
          const groupParticipantIds = participants.filter(p => p.groupId === g).map(p => p.id);
          const playingIds = new Set(roundMatches.flatMap(m => [m.homeId, m.awayId]));
          const byeId = groupParticipantIds.find(id => !playingIds.has(id));
          const byeName = byeId ? (namesMap[byeId] || byeId) : null;

          return (
            <div key={g} className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="font-bold text-zinc-200">Jogos - Grupo {g}</h3>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Grupo {g}
                </span>
              </div>

              <div className="grid gap-3">
                {roundMatches.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    namesMap={namesMap}
                    onUpdateScores={onUpdateScores}
                  />
                ))}
              </div>

              {byeName && (
                <div className="flex items-center gap-3 rounded-lg border border-zinc-850 bg-zinc-900/20 p-3.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Coffee className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Folga nesta Rodada
                    </p>
                    <p className="text-sm font-semibold text-zinc-200">{byeName}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
