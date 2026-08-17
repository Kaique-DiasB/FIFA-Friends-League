import React from 'react';
import { Match, StageDef } from '../types/tournament';
import { getMatchWinner, getTwoLegAggregateResult } from '../utils/tournamentHelpers';
import MatchCard from './MatchCard';
import { Lock, Award, ShieldAlert } from 'lucide-react';

interface KnockoutStagePanelProps {
  stageDef: StageDef;
  matches: Match[];
  namesMap: Record<string, string>;
  onUpdateScores: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
  locked?: boolean;
  lockedMessage?: string;
  progress?: { completed: number; total: number };
}

export default function KnockoutStagePanel({
  stageDef,
  matches,
  namesMap,
  onUpdateScores,
  locked = false,
  lockedMessage,
  progress,
}: KnockoutStagePanelProps) {
  if (locked || matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-850 bg-zinc-900/20 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 shadow-inner">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-6 text-lg font-bold text-zinc-300">{stageDef.label} Bloqueada</h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          {lockedMessage || 'Esta fase será liberada assim que a fase anterior for concluída.'}
        </p>
        {progress && progress.total > 0 && (
          <div className="mt-6 w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs font-bold text-zinc-400">
              <span>Progresso</span>
              <span>{progress.completed} / {progress.total}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-950">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const bySlot = new Map<number, Match[]>();
  matches.forEach(m => {
    const list = bySlot.get(m.slot) ?? [];
    list.push(m);
    bySlot.set(m.slot, list);
  });
  const slots = Array.from(bySlot.keys()).sort((a, b) => a - b);
  const isSingleSlot = slots.length === 1;

  const renderSlot = (slot: number) => {
    const legs = (bySlot.get(slot) ?? []).sort((a, b) => a.leg - b.leg);

    if (stageDef.legs === 1) {
      const match = legs[0];
      const winnerId = getMatchWinner(match);
      const isTied = match.completed && match.homeScore !== null && match.homeScore !== undefined &&
        match.homeScore === match.awayScore;

      return (
        <div key={slot} className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 shadow-2xl">
          <MatchCard
            match={match}
            namesMap={namesMap}
            onUpdateScores={onUpdateScores}
            showPenalties={isTied}
            winnerId={winnerId}
            stageLabel={`${stageDef.label}${!isSingleSlot ? ` • Jogo ${slot}` : ''}`}
          />
          {isTied && match.homePenalties != null && match.awayPenalties != null && match.homePenalties === match.awayPenalties && (
            <div className="mt-4 rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-center text-xs font-bold text-red-400">
              A decisão por pênaltis não pode terminar empatada! Defina o vencedor.
            </div>
          )}
        </div>
      );
    }

    const [leg1, leg2] = legs;
    const result = getTwoLegAggregateResult(leg1, leg2, leg1.homeId, leg1.awayId);
    const nameHome = namesMap[leg1.homeId] || leg1.homeId;
    const nameAway = namesMap[leg1.awayId] || leg1.awayId;

    return (
      <div key={slot} className="flex flex-col rounded-2xl border border-zinc-850 bg-zinc-900/30 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
            {stageDef.label}{!isSingleSlot ? ` • Confronto ${slot}` : ''}
          </span>
          {result.winnerId && (
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              <Award className="h-3.5 w-3.5" />
              Classificado: {namesMap[result.winnerId] || result.winnerId}
            </span>
          )}
        </div>

        <div className="grid gap-4">
          <div>
            <p className="mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Jogo de Ida</p>
            <MatchCard match={leg1} namesMap={namesMap} onUpdateScores={onUpdateScores} winnerId={result.winnerId} />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Jogo de Volta (Mando Invertido)</p>
            <MatchCard
              match={leg2}
              namesMap={namesMap}
              onUpdateScores={onUpdateScores}
              showPenalties={result.isTied}
              winnerId={result.winnerId}
            />
          </div>
        </div>

        {leg1.completed && leg2.completed && (
          <div className="rounded-xl bg-zinc-950 p-4 border border-zinc-850 flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Placar Agregado</p>
              <div className="mt-1 flex items-center gap-2 text-sm font-black text-white">
                <span>{nameHome}</span>
                <span className="text-emerald-400">{result.team1Agg}</span>
                <span className="text-zinc-600">x</span>
                <span className="text-emerald-400">{result.team2Agg}</span>
                <span>{nameAway}</span>
              </div>
            </div>
            {result.isTied && (result.team1Pen == null || result.team2Pen == null) && (
              <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/5 px-2.5 py-1.5 rounded-lg border border-amber-500/20">
                <ShieldAlert className="h-4 w-4" />
                Insira o placar dos pênaltis acima!
              </span>
            )}
            {result.isTied && result.team1Pen != null && result.team2Pen != null && result.team1Pen === result.team2Pen && (
              <span className="text-xs font-bold text-red-400 bg-red-400/5 px-2.5 py-1.5 rounded-lg border border-red-400/20">
                Pênaltis empatados! Defina um vencedor.
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">{stageDef.label}</h2>
        <p className="text-sm text-zinc-400">
          {stageDef.legs === 2
            ? 'Confrontos de ida e volta. Em caso de empate no agregado, haverá disputa por pênaltis.'
            : 'Jogo único. Em caso de empate, a decisão será nos pênaltis.'}
        </p>
      </div>

      {isSingleSlot ? (
        <div className="max-w-2xl mx-auto">{renderSlot(slots[0])}</div>
      ) : (
        <div className={`grid gap-6 ${stageDef.legs === 2 ? 'lg:grid-cols-2' : 'md:grid-cols-2'}`}>
          {slots.map(renderSlot)}
        </div>
      )}
    </div>
  );
}
