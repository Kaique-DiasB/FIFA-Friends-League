import React from 'react';
import { Match, StageDef, TournamentState } from '../types/tournament';
import {
  calculateLeaderboard,
  resolveStageOutcomes,
  getMatchWinner,
  getTwoLegAggregateResult,
  getVisibleStages,
} from '../utils/tournamentHelpers';
import MatchCard from './MatchCard';
import { Trophy, Medal, Award, Star } from 'lucide-react';

interface KnockoutAndPodiumProps {
  state: TournamentState;
  namesMap: Record<string, string>;
  onUpdateScores?: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
  readOnly?: boolean;
}

const GRID_COLS_CLASS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
};

function getStageBadgeClass(label: string): string {
  if (label === 'Campeão') return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  if (label === 'Vice-campeão' || label === 'Finalista') return 'bg-zinc-400/10 text-zinc-300 border-zinc-400/20';
  if (label === '3º Lugar') return 'bg-amber-600/10 text-amber-500 border-amber-600/20';
  if (label === '4º Lugar') return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  if (label.startsWith('Avançou')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (label.startsWith('Eliminado')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  return 'bg-zinc-800 text-zinc-500 border-zinc-800';
}

export default function KnockoutAndPodium({
  state,
  namesMap,
  onUpdateScores,
  readOnly = false,
}: KnockoutAndPodiumProps) {
  const leaderboard = calculateLeaderboard(state);
  const config = state.config;
  const allStages = getVisibleStages(config);
  const bracketStages = allStages.filter(s => s.id !== 'third_place');
  const finalStage = allStages.find(s => s.id === 'final') ?? null;
  const thirdPlaceStage = allStages.find(s => s.id === 'third_place') ?? null;

  const championId = state.championId;
  const championName = championId ? (namesMap[championId] || championId) : 'A definir';

  const finalOutcome = finalStage ? resolveStageOutcomes(finalStage, state.knockoutMatches) : { winners: [], losers: [] };
  const runnerUpId = finalOutcome.losers[0] ?? null;
  const runnerUpName = runnerUpId ? (namesMap[runnerUpId] || runnerUpId) : 'A definir';

  const thirdOutcome = thirdPlaceStage ? resolveStageOutcomes(thirdPlaceStage, state.knockoutMatches) : { winners: [], losers: [] };
  const thirdPlaceWinnerId = thirdOutcome.winners[0] ?? null;
  const thirdPlaceName = thirdPlaceWinnerId ? (namesMap[thirdPlaceWinnerId] || thirdPlaceWinnerId) : 'A definir';

  const renderCompactSlot = (stageDef: StageDef, slot: number, legs: Match[]) => {
    if (stageDef.legs === 1) {
      const match = legs[0];
      if (!match) return <div className="text-center py-4 text-zinc-600 text-xs">Pendente</div>;
      const winnerId = getMatchWinner(match);
      const isTied = match.completed && match.homeScore != null && match.homeScore === match.awayScore;
      return (
        <MatchCard
          match={match}
          namesMap={namesMap}
          onUpdateScores={onUpdateScores}
          readOnly={readOnly}
          showPenalties={isTied}
          winnerId={winnerId}
        />
      );
    }

    const [leg1, leg2] = legs;
    if (!leg1 || !leg2) return <div className="text-center py-4 text-zinc-600 text-xs">Pendente</div>;
    const result = getTwoLegAggregateResult(leg1, leg2, leg1.homeId, leg1.awayId);
    return (
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Jogo de Ida</p>
          <MatchCard match={leg1} namesMap={namesMap} onUpdateScores={onUpdateScores} readOnly={readOnly} winnerId={result.winnerId} />
        </div>
        <div>
          <p className="mb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Jogo de Volta</p>
          <MatchCard
            match={leg2}
            namesMap={namesMap}
            onUpdateScores={onUpdateScores}
            readOnly={readOnly}
            showPenalties={result.isTied}
            winnerId={result.winnerId}
          />
        </div>
        {leg1.completed && leg2.completed && (
          <div className="text-center text-[10px] font-black text-white bg-zinc-950 p-1.5 rounded border border-zinc-850 flex justify-between px-3">
            <span className="text-zinc-500 uppercase tracking-wider">Agregado</span>
            <span>{result.team1Agg} × {result.team2Agg}</span>
          </div>
        )}
      </div>
    );
  };

  const renderStageColumn = (stageDef: StageDef, stageIndex: number) => {
    const matches = state.knockoutMatches.filter(m => m.stage === stageDef.id);
    const bySlot = new Map<number, Match[]>();
    matches.forEach(m => {
      const list = bySlot.get(m.slot) ?? [];
      list.push(m);
      bySlot.set(m.slot, list);
    });
    const slotCount = stageDef.slotCount;
    const previousStage = bracketStages[stageIndex - 1];

    return (
      <div key={stageDef.id} className={stageDef.legs === 2 ? 'space-y-12' : 'space-y-6'}>
        <div className="text-center border-b border-zinc-850 pb-2 mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{stageDef.label}</span>
        </div>

        {Array.from({ length: slotCount }, (_, i) => i + 1).map(slot => {
          const legs = (bySlot.get(slot) ?? []).sort((a, b) => a.leg - b.leg);
          const hasMatches = legs.length > 0;

          return (
            <div key={slot} className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-2.5 space-y-2">
              {slotCount > 1 && (
                <div className="text-center border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-emerald-400">Jogo {slot}</span>
                </div>
              )}
              {hasMatches ? (
                renderCompactSlot(stageDef, slot, legs)
              ) : (
                <div className="text-center py-8 text-zinc-600 text-xs border border-dashed border-zinc-900 rounded-lg">
                  {previousStage ? `Aguardando ${previousStage.label}` : 'Pendente'}
                </div>
              )}
            </div>
          );
        })}

        {stageDef.id === 'final' && thirdPlaceStage && (
          <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-3 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
              <span className="text-[9px] font-black uppercase text-amber-500/80">Decisão do 3º Lugar</span>
              {thirdOutcome.winners[0] && (
                <span className="text-[8px] font-black uppercase bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/20">
                  Encerrado
                </span>
              )}
            </div>
            {(() => {
              const tpMatches = state.knockoutMatches.filter(m => m.stage === 'third_place');
              if (tpMatches.length === 0) {
                return (
                  <div className="text-center py-8 text-zinc-600 text-xs border border-dashed border-zinc-900 rounded-lg">
                    {previousStage ? `Aguardando ${previousStage.label}` : 'Pendente'}
                  </div>
                );
              }
              return (
                <div className="space-y-3">
                  {renderCompactSlot(thirdPlaceStage, 1, tpMatches)}
                  {thirdPlaceWinnerId && (
                    <div className="rounded-lg bg-amber-600/10 p-2 border border-amber-600/20 flex flex-col items-center justify-center text-center">
                      <Medal className="h-5 w-5 text-amber-500 mb-0.5" />
                      <span className="text-[9px] font-extrabold uppercase text-amber-500">Medalha de Bronze (3º)</span>
                      <span className="text-xs font-black text-white mt-0.5">{namesMap[thirdPlaceWinnerId]}</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {stageDef.id === 'final' && championId && (
          <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20 flex flex-col items-center justify-center text-center">
            <Trophy className="h-6 w-6 text-amber-400 mb-1 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase text-amber-400">Grande Campeão</span>
            <span className="text-sm font-black text-white mt-0.5">{namesMap[championId]}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-10">

      {/* Podium and General Leaderboard Section */}
      <div className="grid gap-8 lg:grid-cols-5">

        {/* Visual 3D Podium Pedestal (2 columns weight) */}
        <div className="lg:col-span-2 flex flex-col justify-between rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6">
          <div className="text-center border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center justify-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" />
              Pódio do Torneio
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase">Posições Finais Consolidadas</p>
          </div>

          {/* Pedestals */}
          <div className="flex items-end justify-center gap-3 pt-10 pb-4">

            {/* 2nd Place */}
            <div className="flex flex-col items-center w-28 sm:w-32">
              <div className="mb-5 text-center">
                <span className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">2º Lugar</span>
                <div className="mt-0.5 truncate text-xs font-bold text-zinc-300 max-w-[95px]" title={runnerUpName}>
                  {runnerUpName}
                </div>
              </div>
              <div className="w-full h-32 rounded-t-xl bg-gradient-to-t from-zinc-900/60 to-zinc-800/40 border-t border-x border-zinc-700/30 flex flex-col items-center justify-center shadow-lg relative">
                <div className="absolute -top-3 bg-zinc-700 text-zinc-100 rounded-full p-1 border border-zinc-650 shadow-md">
                  <Medal className="h-3.5 w-3.5 text-zinc-300" />
                </div>
                <span className="text-3xl font-black text-zinc-500 mt-2">2</span>
              </div>
            </div>

            {/* 1st Place (Champion) */}
            <div className="flex flex-col items-center w-32 sm:w-36">
              <div className="mb-6 text-center">
                <span className="text-[9px] font-extrabold uppercase text-amber-400 tracking-widest">Campeão</span>
                <div className="mt-0.5 truncate text-sm font-black text-white max-w-[110px]" title={championName}>
                  {championName}
                </div>
              </div>
              <div className="w-full h-40 rounded-t-xl bg-gradient-to-t from-zinc-900/60 to-amber-500/10 border-t border-x border-amber-500/20 flex flex-col items-center justify-center shadow-2xl relative">
                <div className={`absolute -top-5 bg-amber-500 text-black rounded-full p-1.5 border border-amber-400 shadow-lg ${championId ? 'animate-bounce' : ''}`}>
                  <Trophy className="h-4 w-4 text-zinc-950" />
                </div>
                <span className="text-4xl font-black text-amber-500 mt-2">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center w-28 sm:w-32">
              <div className="mb-5 text-center">
                <span className="text-[9px] font-extrabold uppercase text-amber-700 tracking-wider">3º Lugar</span>
                <div className="mt-0.5 truncate text-xs font-bold text-zinc-300 max-w-[95px]" title={thirdPlaceName}>
                  {thirdPlaceName}
                </div>
              </div>
              <div className="w-full h-24 rounded-t-xl bg-gradient-to-t from-zinc-900/60 to-amber-700/10 border-t border-x border-amber-700/20 flex flex-col items-center justify-center shadow-lg relative">
                <div className="absolute -top-3 bg-amber-800 text-white rounded-full p-1 border border-amber-700 shadow-md">
                  <Medal className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <span className="text-2xl font-black text-amber-700 mt-2">3</span>
              </div>
            </div>

          </div>
        </div>

        {/* General Leaderboard Table (3 columns weight) */}
        <div className="lg:col-span-3 rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-zinc-800 pb-3 mb-4">
              <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center gap-2">
                <Star className="h-4 w-4 text-emerald-400" />
                Classificação Geral (1º a {leaderboard.length}º)
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase">Classificação geral calculada dinamicamente</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-extrabold uppercase tracking-wider">
                    <th className="py-2.5 px-2">#</th>
                    <th className="py-2.5 px-2">Jogador</th>
                    <th className="py-2.5 px-2">Fase Máxima</th>
                    <th className="py-2.5 px-2 text-center">PTS</th>
                    <th className="py-2.5 px-2 text-center">SG</th>
                    <th className="py-2.5 px-2 text-center">GP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/50">
                  {leaderboard.map((entry) => {
                    const name = namesMap[entry.participantId] || entry.participantId;
                    const isPodium = entry.rank <= 3;
                    return (
                      <tr
                        key={entry.participantId}
                        className={`hover:bg-zinc-850/20 transition duration-150 ${
                          isPodium ? 'font-bold text-white' : 'text-zinc-400'
                        }`}
                      >
                        <td className="py-2.5 px-2 font-black">
                          {entry.rank === 1 && <span className="text-amber-500">1º</span>}
                          {entry.rank === 2 && <span className="text-zinc-300">2º</span>}
                          {entry.rank === 3 && <span className="text-amber-600">3º</span>}
                          {entry.rank > 3 && <span>{entry.rank}º</span>}
                        </td>
                        <td className="py-2.5 px-2 font-semibold">{name}</td>
                        <td className="py-2.5 px-2">
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider ${getStageBadgeClass(entry.stageLabel)}`}>
                            {entry.stageLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold">{entry.points}</td>
                        <td className={`py-2.5 px-2 text-center font-bold ${
                          entry.goalDifference > 0
                            ? 'text-emerald-500'
                            : entry.goalDifference < 0
                              ? 'text-red-500'
                              : 'text-zinc-500'
                        }`}>
                          {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
                        </td>
                        <td className="py-2.5 px-2 text-center">{entry.goalsFor}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Visual Bracket Section */}
      {bracketStages.length > 0 && (
        <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 space-y-6">
          <div className="border-b border-zinc-800 pb-3 text-center sm:text-left">
            <h3 className="text-sm font-black uppercase text-white tracking-widest flex items-center justify-center sm:justify-start gap-2">
              <Award className="h-4 w-4 text-emerald-400" />
              Chaveamento Completo do Torneio
            </h3>
            <p className="text-[10px] text-zinc-500 mt-1 uppercase">Acompanhe o caminho rumo ao título de campeão</p>
          </div>

          {/* Tree container with horizontal scroll support */}
          <div className="overflow-x-auto pb-4 scrollbar-thin">
            <div className={`min-w-[800px] lg:min-w-0 grid ${GRID_COLS_CLASS[bracketStages.length] || 'grid-cols-1'} gap-6 items-center py-4 relative`}>
              {bracketStages.map((stageDef, idx) => renderStageColumn(stageDef, idx))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
