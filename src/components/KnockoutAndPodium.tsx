import React from 'react';
import { Match, TournamentState } from '../types/tournament';
import { 
  calculateLeaderboard, 
  getSemifinalResult, 
  getQuarterfinalWinner,
  checkQuarterfinalsComplete,
  checkSemifinalsComplete,
  getThirdPlaceWinner
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

export default function KnockoutAndPodium({
  state,
  namesMap,
  onUpdateScores,
  readOnly = false,
}: KnockoutAndPodiumProps) {
  const leaderboard = calculateLeaderboard(state);

  // Retrieve matches
  const qf1 = state.qfMatches?.find(m => m.id === 'qf1');
  const qf2 = state.qfMatches?.find(m => m.id === 'qf2');
  const qf3 = state.qfMatches?.find(m => m.id === 'qf3');
  const qf4 = state.qfMatches?.find(m => m.id === 'qf4');

  const sf1Ida = state.sfMatches?.find(m => m.id === 'sf1_ida');
  const sf1Volta = state.sfMatches?.find(m => m.id === 'sf1_volta');
  const sf2Ida = state.sfMatches?.find(m => m.id === 'sf2_ida');
  const sf2Volta = state.sfMatches?.find(m => m.id === 'sf2_volta');

  const finalMatch = state.finalMatch;

  // Semifinal results calculation helper
  const w1 = qf1 ? getQuarterfinalWinner(qf1) || 'Vencedor QF1' : 'Vencedor QF1';
  const w2 = qf2 ? getQuarterfinalWinner(qf2) || 'Vencedor QF2' : 'Vencedor QF2';
  const w3 = qf3 ? getQuarterfinalWinner(qf3) || 'Vencedor QF3' : 'Vencedor QF3';
  const w4 = qf4 ? getQuarterfinalWinner(qf4) || 'Vencedor QF4' : 'Vencedor QF4';

  const res1 = sf1Ida && sf1Volta ? getSemifinalResult(sf1Ida, sf1Volta, w1, w3) : null;
  const res2 = sf2Ida && sf2Volta ? getSemifinalResult(sf2Ida, sf2Volta, w4, w2) : null;

  // Determine podium names
  const championId = state.championId;
  const championName = championId ? namesMap[championId] : 'A definir';

  let runnerUpName = 'A definir';
  if (finalMatch && finalMatch.completed && championId) {
    const runnerUpId = championId === finalMatch.homeId ? finalMatch.awayId : finalMatch.homeId;
    runnerUpName = namesMap[runnerUpId] || runnerUpId;
  }

  // 3rd place is determined by third-place match
  let thirdPlaceName = 'A definir';
  const thirdPlaceMatch = state.thirdPlaceMatch;
  const thirdPlaceWinnerId = getThirdPlaceWinner(thirdPlaceMatch);
  const thirdPlaceTied = thirdPlaceMatch?.completed && thirdPlaceMatch.homeScore !== null && thirdPlaceMatch.awayScore !== null && thirdPlaceMatch.homeScore === thirdPlaceMatch.awayScore;

  if (thirdPlaceMatch && thirdPlaceMatch.completed && thirdPlaceWinnerId) {
    thirdPlaceName = namesMap[thirdPlaceWinnerId] || thirdPlaceWinnerId;
  } else {
    const hasSemisCompleted = sf1Ida && sf1Volta && sf2Ida && sf2Volta && sf1Ida.completed && sf1Volta.completed && sf2Ida.completed && sf2Volta.completed;
    if (hasSemisCompleted && leaderboard.length >= 3) {
      const thirdEntry = leaderboard.find(e => e.stage === 'semifinalist');
      if (thirdEntry) {
        thirdPlaceName = namesMap[thirdEntry.participantId] || thirdEntry.participantId;
      }
    }
  }

  // QF Ties for Penalties
  const qf1Tied = qf1?.completed && qf1.homeScore !== null && qf1.awayScore !== null && qf1.homeScore === qf1.awayScore;
  const qf2Tied = qf2?.completed && qf2.homeScore !== null && qf2.awayScore !== null && qf2.homeScore === qf2.awayScore;
  const qf3Tied = qf3?.completed && qf3.homeScore !== null && qf3.awayScore !== null && qf3.homeScore === qf3.awayScore;
  const qf4Tied = qf4?.completed && qf4.homeScore !== null && qf4.awayScore !== null && qf4.homeScore === qf4.awayScore;

  // Final Tie
  const finalTied = finalMatch?.completed && finalMatch.homeScore !== null && finalMatch.awayScore !== null && finalMatch.homeScore === finalMatch.awayScore;

  // Stage badges translator
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'champion':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20 uppercase tracking-wider">
            🏆 Campeão
          </span>
        );
      case 'finalist':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-zinc-400/10 px-2 py-0.5 text-[10px] font-bold text-zinc-300 border border-zinc-400/20 uppercase tracking-wider">
            🥈 Vice-Campeão
          </span>
        );
      case 'third_place':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-600/10 px-2 py-0.5 text-[10px] font-bold text-amber-500 border border-amber-600/20 uppercase tracking-wider">
            🥉 3º Colocado
          </span>
        );
      case 'fourth_place':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-zinc-500/10 px-2 py-0.5 text-[10px] font-bold text-zinc-400 border border-zinc-500/20 uppercase tracking-wider">
            4º Colocado
          </span>
        );
      case 'semifinalist':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
            Semifinal
          </span>
        );
      case 'quarterfinalist':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20 uppercase tracking-wider">
            Quartas
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Fase de Grupos
          </span>
        );
    }
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
                Classificação Geral (1º a 10º)
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
                        <td className="py-2.5 px-2">{getStageBadge(entry.stage)}</td>
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
          <div className="min-w-[800px] lg:min-w-0 grid grid-cols-3 gap-6 items-center py-4 relative">
            
            {/* Column 1: Quarterfinals */}
            <div className="space-y-6">
              <div className="text-center border-b border-zinc-850 pb-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Quartas de Final</span>
              </div>
              
              {/* QF1 */}
              <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-2.5 space-y-2">
                <div className="text-center border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-emerald-400">Jogo 1</span>
                </div>
                {qf1 ? (
                  <MatchCard 
                    match={qf1} 
                    namesMap={namesMap} 
                    onUpdateScores={onUpdateScores}
                    readOnly={readOnly}
                    showPenalties={qf1Tied}
                    winnerId={getQuarterfinalWinner(qf1)}
                  />
                ) : (
                  <div className="text-center py-4 text-zinc-600 text-xs">Pendente</div>
                )}
              </div>

              {/* QF3 */}
              <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-2.5 space-y-2">
                <div className="text-center border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-emerald-400">Jogo 3</span>
                </div>
                {qf3 ? (
                  <MatchCard 
                    match={qf3} 
                    namesMap={namesMap} 
                    onUpdateScores={onUpdateScores}
                    readOnly={readOnly}
                    showPenalties={qf3Tied}
                    winnerId={getQuarterfinalWinner(qf3)}
                  />
                ) : (
                  <div className="text-center py-4 text-zinc-600 text-xs">Pendente</div>
                )}
              </div>

              {/* QF4 */}
              <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-2.5 space-y-2">
                <div className="text-center border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-emerald-400">Jogo 4</span>
                </div>
                {qf4 ? (
                  <MatchCard 
                    match={qf4} 
                    namesMap={namesMap} 
                    onUpdateScores={onUpdateScores}
                    readOnly={readOnly}
                    showPenalties={qf4Tied}
                    winnerId={getQuarterfinalWinner(qf4)}
                  />
                ) : (
                  <div className="text-center py-4 text-zinc-600 text-xs">Pendente</div>
                )}
              </div>

              {/* QF2 */}
              <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-2.5 space-y-2">
                <div className="text-center border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-emerald-400">Jogo 2</span>
                </div>
                {qf2 ? (
                  <MatchCard 
                    match={qf2} 
                    namesMap={namesMap} 
                    onUpdateScores={onUpdateScores}
                    readOnly={readOnly}
                    showPenalties={qf2Tied}
                    winnerId={getQuarterfinalWinner(qf2)}
                  />
                ) : (
                  <div className="text-center py-4 text-zinc-600 text-xs">Pendente</div>
                )}
              </div>

            </div>

            {/* Column 2: Semifinals */}
            <div className="space-y-12">
              <div className="text-center border-b border-zinc-850 pb-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Semifinais</span>
              </div>
              
              {/* SF1 (QF1 winner vs QF3 winner) */}
              <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-emerald-400">Semifinal 1</span>
                  {res1?.winnerId && (
                    <span className="text-[8px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/20">
                      Classificado
                    </span>
                  )}
                </div>
                
                {sf1Ida && sf1Volta && res1 ? (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Jogo de Ida</p>
                      <MatchCard 
                        match={sf1Ida} 
                        namesMap={namesMap} 
                        onUpdateScores={onUpdateScores}
                        readOnly={readOnly}
                        winnerId={res1.winnerId}
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Jogo de Volta</p>
                      <MatchCard 
                        match={sf1Volta} 
                        namesMap={namesMap} 
                        onUpdateScores={onUpdateScores}
                        readOnly={readOnly}
                        showPenalties={res1.isTied}
                        winnerId={res1.winnerId}
                      />
                    </div>
                    {sf1Ida.completed && sf1Volta.completed && (
                      <div className="text-center text-[10px] font-black text-white bg-zinc-950 p-1.5 rounded border border-zinc-850 flex justify-between px-3">
                        <span className="text-zinc-500 uppercase tracking-wider">Agregado</span>
                        <span>{res1.team1Agg} × {res1.team2Agg}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-600 text-xs border border-dashed border-zinc-900 rounded-lg">
                    Aguardando Quartas de Final
                  </div>
                )}
              </div>

              {/* SF2 (QF4 winner vs QF2 winner) */}
              <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-emerald-400">Semifinal 2</span>
                  {res2?.winnerId && (
                    <span className="text-[8px] font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded text-emerald-400 border border-emerald-500/20">
                      Classificado
                    </span>
                  )}
                </div>
                
                {sf2Ida && sf2Volta && res2 ? (
                  <div className="space-y-3">
                    <div>
                      <p className="mb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Jogo de Ida</p>
                      <MatchCard 
                        match={sf2Ida} 
                        namesMap={namesMap} 
                        onUpdateScores={onUpdateScores}
                        readOnly={readOnly}
                        winnerId={res2.winnerId}
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[9px] font-bold text-zinc-500 uppercase tracking-wide">Jogo de Volta</p>
                      <MatchCard 
                        match={sf2Volta} 
                        namesMap={namesMap} 
                        onUpdateScores={onUpdateScores}
                        readOnly={readOnly}
                        showPenalties={res2.isTied}
                        winnerId={res2.winnerId}
                      />
                    </div>
                    {sf2Ida.completed && sf2Volta.completed && (
                      <div className="text-center text-[10px] font-black text-white bg-zinc-950 p-1.5 rounded border border-zinc-850 flex justify-between px-3">
                        <span className="text-zinc-500 uppercase tracking-wider">Agregado</span>
                        <span>{res2.team1Agg} × {res2.team2Agg}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-600 text-xs border border-dashed border-zinc-900 rounded-lg">
                    Aguardando Quartas de Final
                  </div>
                )}
              </div>

            </div>

            {/* Column 3: Finais */}
            <div className="space-y-6">
              <div className="text-center border-b border-zinc-850 pb-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Grande Final</span>
              </div>
              
              {/* Jogo do Título */}
              <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-amber-500">Jogo do Título</span>
                  {championId && (
                    <span className="text-[8px] font-black uppercase bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/20">
                      Encerrado
                    </span>
                  )}
                </div>

                {finalMatch ? (
                  <div className="space-y-3">
                    <MatchCard 
                      match={finalMatch} 
                      namesMap={namesMap} 
                      onUpdateScores={onUpdateScores}
                      readOnly={readOnly}
                      showPenalties={finalTied}
                      winnerId={championId}
                    />

                    {championId && (
                      <div className="rounded-lg bg-amber-500/10 p-3 border border-amber-500/20 flex flex-col items-center justify-center text-center">
                        <Trophy className="h-6 w-6 text-amber-400 mb-1 animate-pulse" />
                        <span className="text-[10px] font-extrabold uppercase text-amber-400">Grande Campeão</span>
                        <span className="text-sm font-black text-white mt-0.5">{namesMap[championId]}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-zinc-600 text-xs border border-dashed border-zinc-900 rounded-lg">
                    Aguardando Semifinais
                  </div>
                )}
              </div>

              {/* Decisão do 3º Lugar */}
              <div className="rounded-xl border border-zinc-850/80 bg-zinc-950/20 p-3 space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-1">
                  <span className="text-[9px] font-black uppercase text-amber-500/80">Decisão do 3º Lugar</span>
                  {thirdPlaceMatch?.completed && (
                    <span className="text-[8px] font-black uppercase bg-amber-500/10 px-1.5 py-0.5 rounded text-amber-400 border border-amber-500/20">
                      Encerrado
                    </span>
                  )}
                </div>

                {thirdPlaceMatch ? (
                  <div className="space-y-3">
                    <MatchCard 
                      match={thirdPlaceMatch} 
                      namesMap={namesMap} 
                      onUpdateScores={onUpdateScores}
                      readOnly={readOnly}
                      showPenalties={thirdPlaceTied}
                      winnerId={thirdPlaceWinnerId}
                    />

                    {thirdPlaceWinnerId && (
                      <div className="rounded-lg bg-amber-600/10 p-2 border border-amber-600/20 flex flex-col items-center justify-center text-center">
                        <Medal className="h-5 w-5 text-amber-500 mb-0.5" />
                        <span className="text-[9px] font-extrabold uppercase text-amber-500">Medalha de Bronze (3º)</span>
                        <span className="text-xs font-black text-white mt-0.5">{namesMap[thirdPlaceWinnerId]}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-600 text-xs border border-dashed border-zinc-900 rounded-lg">
                    Aguardando Semifinais
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
