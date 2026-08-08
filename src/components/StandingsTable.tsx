import React from 'react';
import { Standing, Participant, Match } from '../types/tournament';
import { calculateStandings } from '../utils/tournamentHelpers';
import { Check } from 'lucide-react';

interface StandingsTableProps {
  participants: Participant[];
  groupMatches: Match[];
  namesMap: Record<string, string>;
  qualifiersPerGroup: number;
}

export default function StandingsTable({
  participants,
  groupMatches,
  namesMap,
  qualifiersPerGroup,
}: StandingsTableProps) {
  const groups = Array.from(
    new Set(groupMatches.map(m => m.groupId).filter((g): g is 'A' | 'B' => !!g))
  ).sort();

  const renderTable = (standings: Standing[], groupLabel: string) => {
    return (
      <div className="rounded-xl border border-zinc-850 bg-zinc-900/40 p-5">
        <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-400 text-xs font-bold">
              {groupLabel}
            </div>
            <h3 className="font-bold text-zinc-200">Classificação - Grupo {groupLabel}</h3>
          </div>
          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
            Fase de Grupos
          </span>
        </div>

        {/* Scroll Wrapper */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full min-w-[450px] lg:min-w-full border-collapse text-left text-sm text-zinc-400">
            <thead>
              <tr className="border-b border-zinc-850 text-xs font-bold uppercase tracking-wider text-zinc-500">
                <th className="py-3 pl-3"># Pos</th>
                <th className="py-3">Jogador</th>
                <th className="py-3 text-center text-emerald-400 font-extrabold">PTS</th>
                <th className="py-3 text-center">J</th>
                <th className="py-3 text-center">V</th>
                <th className="py-3 text-center">E</th>
                <th className="py-3 text-center">D</th>
                <th className="py-3 text-center">GP</th>
                <th className="py-3 text-center">GC</th>
                <th className="py-3 text-center">SG</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, index) => {
                const isQualified = index < qualifiersPerGroup;
                const name = namesMap[s.participantId] || s.participantId;

                return (
                  <tr
                    key={s.participantId}
                    className={`border-b border-zinc-850/50 transition-colors hover:bg-zinc-850/30 ${
                      isQualified
                        ? 'bg-emerald-500/[0.02] text-zinc-200'
                        : ''
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3.5 pl-3 font-bold">
                      <div className="flex items-center gap-2">
                        {/* Position badge */}
                        <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                          index === 0
                            ? 'bg-amber-500 text-black'
                            : index === 1
                            ? 'bg-zinc-350 text-black'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {index + 1}
                        </span>

                        {/* Qualified indicator */}
                        {isQualified && (
                          <span className="flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-400 border border-emerald-500/25">
                            <Check className="h-2 w-2" />
                            Classifica
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-3.5 font-bold text-zinc-200">
                      <span className="truncate max-w-[150px] block" title={name}>
                        {name}
                      </span>
                    </td>

                    {/* PTS */}
                    <td className="py-3.5 text-center text-sm font-black text-emerald-400">
                      {s.points}
                    </td>

                    {/* J */}
                    <td className="py-3.5 text-center font-medium text-zinc-300">
                      {s.games}
                    </td>

                    {/* V */}
                    <td className="py-3.5 text-center font-medium text-zinc-300">
                      {s.wins}
                    </td>

                    {/* E */}
                    <td className="py-3.5 text-center font-medium text-zinc-400">
                      {s.draws}
                    </td>

                    {/* D */}
                    <td className="py-3.5 text-center font-medium text-zinc-400">
                      {s.losses}
                    </td>

                    {/* GP */}
                    <td className="py-3.5 text-center font-medium text-zinc-300">
                      {s.goalsFor}
                    </td>

                    {/* GC */}
                    <td className="py-3.5 text-center font-medium text-zinc-400">
                      {s.goalsAgainst}
                    </td>

                    {/* SG */}
                    <td className={`py-3.5 text-center font-bold ${
                      s.goalDifference > 0
                        ? 'text-emerald-400'
                        : s.goalDifference < 0
                        ? 'text-red-400'
                        : 'text-zinc-400'
                    }`}>
                      {s.goalDifference > 0 ? `+${s.goalDifference}` : s.goalDifference}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Caption */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
          <div className="h-2 w-2 rounded-full bg-emerald-500/30"></div>
          <span>Os {qualifiersPerGroup} primeiros colocados avançam para o mata-mata.</span>
        </div>
      </div>
    );
  };

  const gridColsClass = groups.length >= 2 ? 'md:grid-cols-2' : 'md:grid-cols-1';

  return (
    <div className={`grid gap-6 ${gridColsClass}`}>
      {groups.map(g => (
        <React.Fragment key={g}>
          {renderTable(calculateStandings(g, participants, groupMatches), g)}
        </React.Fragment>
      ))}
    </div>
  );
}
