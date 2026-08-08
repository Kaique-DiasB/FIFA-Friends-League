import React, { useState } from 'react';
import { Match } from '../types/tournament';
import MatchCard from './MatchCard';
import { getRoundBye } from '../utils/tournamentHelpers';
import { Coffee, Calendar } from 'lucide-react';

interface GroupStageProps {
  groupMatches: Match[];
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
  namesMap,
  onUpdateScores,
}: GroupStageProps) {
  const [activeRound, setActiveRound] = useState<number>(1);

  // Filter matches for the selected round
  const roundMatchesA = groupMatches.filter(
    m => m.groupId === 'A' && m.round === activeRound
  );
  const roundMatchesB = groupMatches.filter(
    m => m.groupId === 'B' && m.round === activeRound
  );

  // Get bye players
  const byePlayerIdA = getRoundBye('A', activeRound);
  const byePlayerIdB = getRoundBye('B', activeRound);

  const byeNameA = namesMap[byePlayerIdA] || byePlayerIdA;
  const byeNameB = namesMap[byePlayerIdB] || byePlayerIdB;

  return (
    <div className="space-y-6">
      {/* Round Switcher Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Fase de Grupos</h2>
          <p className="text-sm text-zinc-400">
            Acompanhe e preencha os resultados das 5 rodadas da fase de grupos.
          </p>
        </div>

        {/* Tabs for Rounds */}
        <div className="flex overflow-x-auto rounded-xl bg-zinc-950 p-1 border border-zinc-850">
          {[1, 2, 3, 4, 5].map(r => (
            <button
              key={r}
              onClick={() => setActiveRound(r)}
              className={`flex items-center gap-1 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeRound === r
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
      <div className="grid gap-6 md:grid-cols-2">
        {/* Group A Matches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="font-bold text-zinc-200">Jogos - Grupo A</h3>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Grupo A
            </span>
          </div>

          <div className="grid gap-3">
            {roundMatchesA.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                namesMap={namesMap}
                onUpdateScores={onUpdateScores}
              />
            ))}
          </div>

          {/* Bye Notification */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-850 bg-zinc-900/20 p-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Coffee className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Folga nesta Rodada
              </p>
              <p className="text-sm font-semibold text-zinc-200">{byeNameA}</p>
            </div>
          </div>
        </div>

        {/* Group B Matches */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <h3 className="font-bold text-zinc-200">Jogos - Grupo B</h3>
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
              Grupo B
            </span>
          </div>

          <div className="grid gap-3">
            {roundMatchesB.map(m => (
              <MatchCard
                key={m.id}
                match={m}
                namesMap={namesMap}
                onUpdateScores={onUpdateScores}
              />
            ))}
          </div>

          {/* Bye Notification */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-850 bg-zinc-900/20 p-3.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <Coffee className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Folga nesta Rodada
              </p>
              <p className="text-sm font-semibold text-zinc-200">{byeNameB}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
