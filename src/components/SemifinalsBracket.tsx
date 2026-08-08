import React from 'react';
import { Match } from '../types/tournament';
import { 
  getSemifinalResult, 
  checkQuarterfinalsComplete, 
  getQuarterfinalWinner 
} from '../utils/tournamentHelpers';
import MatchCard from './MatchCard';
import { Lock, Award, ShieldAlert } from 'lucide-react';

interface SemifinalsBracketProps {
  qfMatches: Match[];
  sfMatches: Match[];
  namesMap: Record<string, string>;
  onUpdateScores: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
}

export default function SemifinalsBracket({
  qfMatches,
  sfMatches,
  namesMap,
  onUpdateScores,
}: SemifinalsBracketProps) {
  const qfComplete = checkQuarterfinalsComplete(qfMatches);

  if (!qfComplete) {
    const totalQFMatches = 4;
    const completedQFMatches = qfMatches.filter(m => m.completed).length;

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-850 bg-zinc-900/20 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 shadow-inner">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-6 text-lg font-bold text-zinc-300">Semifinais Bloqueadas</h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          As semifinais serão liberadas assim que todos os confrontos das quartas de final forem concluídos.
        </p>
        
        {/* Progress bar */}
        <div className="mt-6 w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs font-bold text-zinc-400">
            <span>Progresso das Quartas de Final</span>
            <span>{completedQFMatches} / {totalQFMatches}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-950">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${(completedQFMatches / totalQFMatches) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Retrieve QF matches
  const qf1Match = qfMatches.find(m => m.id === 'qf1')!;
  const qf2Match = qfMatches.find(m => m.id === 'qf2')!;
  const qf3Match = qfMatches.find(m => m.id === 'qf3')!;
  const qf4Match = qfMatches.find(m => m.id === 'qf4')!;

  const w1 = getQuarterfinalWinner(qf1Match) || 'Vencedor QF1';
  const w2 = getQuarterfinalWinner(qf2Match) || 'Vencedor QF2';
  const w3 = getQuarterfinalWinner(qf3Match) || 'Vencedor QF3';
  const w4 = getQuarterfinalWinner(qf4Match) || 'Vencedor QF4';

  // Retrieve SF matches
  const sf1Ida = sfMatches.find(m => m.id === 'sf1_ida')!;
  const sf1Volta = sfMatches.find(m => m.id === 'sf1_volta')!;
  const sf2Ida = sfMatches.find(m => m.id === 'sf2_ida')!;
  const sf2Volta = sfMatches.find(m => m.id === 'sf2_volta')!;

  if (!sf1Ida || !sf1Volta || !sf2Ida || !sf2Volta) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Gerando confrontos das Semifinais...
      </div>
    );
  }

  const res1 = getSemifinalResult(sf1Ida, sf1Volta, w1, w3);
  const res2 = getSemifinalResult(sf2Ida, sf2Volta, w4, w2);

  const nameW1 = namesMap[w1] || w1;
  const nameW2 = namesMap[w2] || w2;
  const nameW3 = namesMap[w3] || w3;
  const nameW4 = namesMap[w4] || w4;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Semifinais</h2>
        <p className="text-sm text-zinc-400">
          Jogos eliminatórios de ida e volta. Não há critério de gols fora de casa. Em caso de empate no agregado, haverá disputa por pênaltis.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Semifinal 1 Card */}
        <div className="flex flex-col rounded-2xl border border-zinc-850 bg-zinc-900/30 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Semifinal 1</span>
              <h3 className="font-extrabold text-white text-sm">
                Vencedor QF1 × Vencedor QF3
              </h3>
            </div>
            {res1.winnerId && (
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <Award className="h-3.5 w-3.5" />
                Classificado: {namesMap[res1.winnerId] || res1.winnerId}
              </span>
            )}
          </div>

          <div className="grid gap-4">
            <div>
              <p className="mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Jogo de Ida</p>
              <MatchCard
                match={sf1Ida}
                namesMap={namesMap}
                onUpdateScores={onUpdateScores}
                winnerId={res1.winnerId}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Jogo de Volta (Mando Invertido)</p>
              <MatchCard
                match={sf1Volta}
                namesMap={namesMap}
                onUpdateScores={onUpdateScores}
                showPenalties={res1.isTied}
                winnerId={res1.winnerId}
              />
            </div>
          </div>

          {/* Aggregate Display */}
          {sf1Ida.completed && sf1Volta.completed && (
            <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-850 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Placar Agregado</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-black text-white">
                  <span>{nameW1}</span>
                  <span className="text-emerald-400">{res1.team1Agg}</span>
                  <span className="text-zinc-600">x</span>
                  <span className="text-emerald-400">{res1.team2Agg}</span>
                  <span>{nameW3}</span>
                </div>
              </div>
              {res1.isTied && (res1.team1Pen === null || res1.team1Pen === undefined || res1.team2Pen === null || res1.team2Pen === undefined) && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                  <ShieldAlert className="h-4 w-4" />
                  Insira o placar dos pênaltis acima!
                </span>
              )}
              {res1.isTied && res1.team1Pen !== null && res1.team2Pen !== null && res1.team1Pen === res1.team2Pen && (
                <span className="text-xs font-bold text-red-400 bg-red-400/5 px-2.5 py-1.5 rounded-lg border border-red-400/20">
                  Pênaltis empatados! Defina um vencedor.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Semifinal 2 Card */}
        <div className="flex flex-col rounded-2xl border border-zinc-850 bg-zinc-900/30 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Semifinal 2</span>
              <h3 className="font-extrabold text-white text-sm">
                Vencedor QF4 × Vencedor QF2
              </h3>
            </div>
            {res2.winnerId && (
              <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                <Award className="h-3.5 w-3.5" />
                Classificado: {namesMap[res2.winnerId] || res2.winnerId}
              </span>
            )}
          </div>

          <div className="grid gap-4">
            <div>
              <p className="mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Jogo de Ida</p>
              <MatchCard
                match={sf2Ida}
                namesMap={namesMap}
                onUpdateScores={onUpdateScores}
                winnerId={res2.winnerId}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Jogo de Volta (Mando Invertido)</p>
              <MatchCard
                match={sf2Volta}
                namesMap={namesMap}
                onUpdateScores={onUpdateScores}
                showPenalties={res2.isTied}
                winnerId={res2.winnerId}
              />
            </div>
          </div>

          {/* Aggregate Display */}
          {sf2Ida.completed && sf2Volta.completed && (
            <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-850 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Placar Agregado</p>
                <div className="mt-1 flex items-center gap-2 text-sm font-black text-white">
                  <span>{nameW4}</span>
                  <span className="text-emerald-400">{res2.team1Agg}</span>
                  <span className="text-zinc-600">x</span>
                  <span className="text-emerald-400">{res2.team2Agg}</span>
                  <span>{nameW2}</span>
                </div>
              </div>
              {res2.isTied && (res2.team1Pen === null || res2.team1Pen === undefined || res2.team2Pen === null || res2.team2Pen === undefined) && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                  <ShieldAlert className="h-4 w-4" />
                  Insira o placar dos pênaltis acima!
                </span>
              )}
              {res2.isTied && res2.team1Pen !== null && res2.team2Pen !== null && res2.team1Pen === res2.team2Pen && (
                <span className="text-xs font-bold text-red-400 bg-red-400/5 px-2.5 py-1.5 rounded-lg border border-red-400/20">
                  Pênaltis empatados! Defina um vencedor.
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
