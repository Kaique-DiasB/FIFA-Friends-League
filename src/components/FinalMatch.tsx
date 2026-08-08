import React from 'react';
import { Match } from '../types/tournament';
import { checkSemifinalsComplete } from '../utils/tournamentHelpers';
import MatchCard from './MatchCard';
import { Lock, AlertCircle } from 'lucide-react';

interface FinalMatchProps {
  qfMatches: Match[];
  sfMatches: Match[];
  finalMatch: Match | null;
  namesMap: Record<string, string>;
  onUpdateScores: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
}

export default function FinalMatch({
  qfMatches,
  sfMatches,
  finalMatch,
  namesMap,
  onUpdateScores,
}: FinalMatchProps) {
  const sfComplete = checkSemifinalsComplete(sfMatches, qfMatches);

  if (!sfComplete) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-850 bg-zinc-900/20 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 shadow-inner">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-6 text-lg font-bold text-zinc-300">Grande Final Bloqueada</h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          A grande final e a definição do campeão estarão disponíveis após a conclusão de todas as partidas de ida e volta das semifinais.
        </p>
      </div>
    );
  }

  if (!finalMatch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <h3 className="mt-4 text-sm font-bold text-zinc-300">Erro de Configuração</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Partida da final não inicializada corretamente. Favor redefinir ou verificar o estado do campeonato.
        </p>
      </div>
    );
  }

  // Check if we need to show penalties for the final
  const isFinalTied =
    finalMatch.completed &&
    finalMatch.homeScore !== null &&
    finalMatch.awayScore !== null &&
    finalMatch.homeScore === finalMatch.awayScore;

  const showPenalties = isFinalTied;

  let winnerId: string | null = null;
  if (finalMatch.completed) {
    const hs = finalMatch.homeScore;
    const as = finalMatch.awayScore;
    const hp = finalMatch.homePenalties;
    const ap = finalMatch.awayPenalties;
    if (hs !== undefined && hs !== null && as !== undefined && as !== null) {
      if (hs > as) {
        winnerId = finalMatch.homeId;
      } else if (as > hs) {
        winnerId = finalMatch.awayId;
      } else if (hp !== undefined && hp !== null && ap !== undefined && ap !== null) {
        if (hp > ap) {
          winnerId = finalMatch.homeId;
        } else if (ap > hp) {
          winnerId = finalMatch.awayId;
        }
      }
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
          Grande Final
        </span>
        <h2 className="mt-2 text-2xl font-black text-white uppercase tracking-wide">Decisão do Campeonato</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Jogo único valendo o título de campeão do torneio. Em caso de empate no tempo normal, a decisão será nos pênaltis.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 shadow-2xl">
        <MatchCard
          match={finalMatch}
          namesMap={namesMap}
          onUpdateScores={onUpdateScores}
          showPenalties={showPenalties}
          winnerId={winnerId}
        />
        
        {/* Warning if penalties are tied */}
        {isFinalTied && 
         finalMatch.homePenalties !== null && 
         finalMatch.awayPenalties !== null && 
         finalMatch.homePenalties === finalMatch.awayPenalties && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-center text-xs font-bold text-red-400">
            A decisão por pênaltis não pode terminar empatada! Defina o vencedor do campeonato.
          </div>
        )}
      </div>
    </div>
  );
}
