import React from 'react';
import { Match } from '../types/tournament';
import { checkSemifinalsComplete } from '../utils/tournamentHelpers';
import MatchCard from './MatchCard';
import { Lock, AlertCircle } from 'lucide-react';

interface ThirdPlaceMatchProps {
  qfMatches: Match[];
  sfMatches: Match[];
  thirdPlaceMatch: Match | null;
  namesMap: Record<string, string>;
  onUpdateScores: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
}

export default function ThirdPlaceMatch({
  qfMatches,
  sfMatches,
  thirdPlaceMatch,
  namesMap,
  onUpdateScores,
}: ThirdPlaceMatchProps) {
  const sfComplete = checkSemifinalsComplete(sfMatches, qfMatches);

  if (!sfComplete) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-850 bg-zinc-900/20 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 shadow-inner">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-6 text-lg font-bold text-zinc-300">Disputa de 3º Lugar Bloqueada</h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          A disputa de 3º lugar estará disponível após a conclusão de todas as partidas de ida e volta das semifinais.
        </p>
      </div>
    );
  }

  if (!thirdPlaceMatch) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.02] p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <h3 className="mt-4 text-sm font-bold text-zinc-300">Erro de Configuração</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Partida de 3º lugar não inicializada.
        </p>
      </div>
    );
  }

  const isTied =
    thirdPlaceMatch.completed &&
    thirdPlaceMatch.homeScore !== null &&
    thirdPlaceMatch.awayScore !== null &&
    thirdPlaceMatch.homeScore === thirdPlaceMatch.awayScore;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20 uppercase tracking-widest">
          3º Lugar
        </span>
        <h2 className="mt-2 text-2xl font-black text-white uppercase tracking-wide">Decisão do Terceiro Lugar</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Jogo único para definir quem fica com a medalha de bronze. Em caso de empate no tempo normal, a decisão será nos pênaltis.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 shadow-2xl">
        <MatchCard
          match={thirdPlaceMatch}
          namesMap={namesMap}
          onUpdateScores={onUpdateScores}
          showPenalties={isTied}
        />
        
        {isTied && 
         thirdPlaceMatch.homePenalties !== null && 
         thirdPlaceMatch.awayPenalties !== null && 
         thirdPlaceMatch.homePenalties === thirdPlaceMatch.awayPenalties && (
          <div className="mt-4 rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-center text-xs font-bold text-red-400">
            A decisão por pênaltis não pode terminar empatada! Defina o vencedor do 3º lugar.
          </div>
        )}
      </div>
    </div>
  );
}
