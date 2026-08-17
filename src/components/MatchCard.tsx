import React from 'react';
import { Match } from '../types/tournament';
import { CheckCircle2, Clock, Trophy } from 'lucide-react';

interface MatchCardProps {
  match: Match;
  namesMap: Record<string, string>;
  onUpdateScores?: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
  showPenalties?: boolean;
  readOnly?: boolean;
  winnerId?: string | null;
  stageLabel?: string;
}

export default function MatchCard({
  match,
  namesMap,
  onUpdateScores,
  showPenalties = false,
  readOnly = false,
  winnerId,
  stageLabel,
}: MatchCardProps) {
  const homeName = namesMap[match.homeId] || match.homeId;
  const awayName = namesMap[match.awayId] || match.awayId;

  let showHomeTrophy = false;
  let showAwayTrophy = false;

  if (winnerId !== undefined) {
    if (winnerId !== null) {
      showHomeTrophy = match.homeId === winnerId;
      showAwayTrophy = match.awayId === winnerId;
    }
  } else {
    if (match.completed && match.homeScore !== null && match.homeScore !== undefined && match.awayScore !== null && match.awayScore !== undefined) {
      if (match.homeScore > match.awayScore) {
        showHomeTrophy = true;
      } else if (match.awayScore > match.homeScore) {
        showAwayTrophy = true;
      }
    }
  }

  const handleHomeScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const score = val === '' ? null : Math.max(0, parseInt(val, 10));
    if (val !== '' && isNaN(score as number)) return;
    if (onUpdateScores) {
      onUpdateScores(match.id, score, match.awayScore ?? null, match.homePenalties ?? null, match.awayPenalties ?? null);
    }
  };

  const handleAwayScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const score = val === '' ? null : Math.max(0, parseInt(val, 10));
    if (val !== '' && isNaN(score as number)) return;
    if (onUpdateScores) {
      onUpdateScores(match.id, match.homeScore ?? null, score, match.homePenalties ?? null, match.awayPenalties ?? null);
    }
  };

  const handleHomePenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const pen = val === '' ? null : Math.max(0, parseInt(val, 10));
    if (val !== '' && isNaN(pen as number)) return;
    if (onUpdateScores) {
      onUpdateScores(match.id, match.homeScore ?? null, match.awayScore ?? null, pen, match.awayPenalties ?? null);
    }
  };

  const handleAwayPenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const pen = val === '' ? null : Math.max(0, parseInt(val, 10));
    if (val !== '' && isNaN(pen as number)) return;
    if (onUpdateScores) {
      onUpdateScores(match.id, match.homeScore ?? null, match.awayScore ?? null, match.homePenalties ?? null, pen);
    }
  };

  // Block negative signs, periods, or exponent symbols in numeric inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '.', ',', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 bg-zinc-900/60 ${
      match.completed 
        ? 'border-emerald-500/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.05)]' 
        : 'border-zinc-800'
    }`}>
      {/* Header with Match ID / Status Badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          {match.groupId ? `Grupo ${match.groupId} • Rodada ${match.round}` : stageLabel || 'Fase Eliminatória'}
        </span>

        {match.completed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Finalizada
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
            <Clock className="h-3 w-3" />
            Pendente
          </span>
        )}
      </div>

      {/* Main Grid: Home Team vs Away Team */}
      <div className="grid grid-cols-9 items-center gap-2">
        {/* Home Name */}
        <div className="col-span-3 text-right flex items-center justify-end gap-1.5">
          {showHomeTrophy && (
            <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
          )}
          <span className="block truncate text-sm font-bold text-zinc-100" title={homeName}>
            {homeName}
          </span>
        </div>

        {/* Scores & Separator */}
        <div className="col-span-1 flex items-center justify-center">
          {readOnly ? (
            <div className="w-10 h-7 flex items-center justify-center rounded bg-zinc-950/85 border border-zinc-800 text-sm font-black text-white shadow-inner">
              {match.homeScore ?? '-'}
            </div>
          ) : (
            <input
              type="number"
              min="0"
              value={match.homeScore ?? ''}
              onChange={handleHomeScoreChange}
              onKeyDown={handleKeyDown}
              className="w-10 rounded bg-zinc-950 border border-zinc-850 py-1 text-center text-sm font-black text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition"
              placeholder="-"
            />
          )}
        </div>

        <div className="col-span-1 text-center font-bold text-zinc-600">×</div>

        <div className="col-span-1 flex items-center justify-center">
          {readOnly ? (
            <div className="w-10 h-7 flex items-center justify-center rounded bg-zinc-950/85 border border-zinc-800 text-sm font-black text-white shadow-inner">
              {match.awayScore ?? '-'}
            </div>
          ) : (
            <input
              type="number"
              min="0"
              value={match.awayScore ?? ''}
              onChange={handleAwayScoreChange}
              onKeyDown={handleKeyDown}
              className="w-10 rounded bg-zinc-950 border border-zinc-850 py-1 text-center text-sm font-black text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 outline-none transition"
              placeholder="-"
            />
          )}
        </div>

        {/* Away Name */}
        <div className="col-span-3 text-left flex items-center justify-start gap-1.5">
          <span className="block truncate text-sm font-bold text-zinc-100" title={awayName}>
            {awayName}
          </span>
          {showAwayTrophy && (
            <Trophy className="h-3.5 w-3.5 text-amber-500 fill-amber-500/10 shrink-0" />
          )}
        </div>
      </div>

      {/* Penalties block if tied and required */}
      {showPenalties && (
        <div className="mt-3 border-t border-dashed border-zinc-800 pt-3">
          <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-amber-500">
            Empate Detectado: Disputa de Pênaltis
          </p>
          <div className="flex justify-center items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">{homeName.slice(0, 3)}</span>
              {readOnly ? (
                <div className="w-8 h-6 flex items-center justify-center rounded bg-zinc-950/85 border border-amber-500/20 text-xs font-bold text-white shadow-inner">
                  {match.homePenalties ?? '-'}
                </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  value={match.homePenalties ?? ''}
                  onChange={handleHomePenChange}
                  onKeyDown={handleKeyDown}
                  className="w-8 rounded bg-zinc-950 border border-amber-500/30 py-0.5 text-center text-xs font-bold text-white focus:border-amber-500 outline-none transition"
                  placeholder="-"
                />
              )}
            </div>
            <span className="text-xs text-zinc-600 font-bold">x</span>
            <div className="flex items-center gap-1.5">
              {readOnly ? (
                <div className="w-8 h-6 flex items-center justify-center rounded bg-zinc-950/85 border border-amber-500/20 text-xs font-bold text-white shadow-inner">
                  {match.awayPenalties ?? '-'}
                </div>
              ) : (
                <input
                  type="number"
                  min="0"
                  value={match.awayPenalties ?? ''}
                  onChange={handleAwayPenChange}
                  onKeyDown={handleKeyDown}
                  className="w-8 rounded bg-zinc-950 border border-amber-500/30 py-0.5 text-center text-xs font-bold text-white focus:border-amber-500 outline-none transition"
                  placeholder="-"
                />
              )}
              <span className="text-[10px] font-bold text-zinc-500 uppercase">{awayName.slice(0, 3)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
