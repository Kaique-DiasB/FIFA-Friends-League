import React from 'react';
import { Match, Standing } from '../types/tournament';
import { checkGroupStageComplete, getQuarterfinalWinner } from '../utils/tournamentHelpers';
import MatchCard from './MatchCard';
import { Lock, Award, ShieldAlert } from 'lucide-react';

interface QuarterfinalsBracketProps {
  groupMatches: Match[];
  qfMatches: Match[];
  standingsA: Standing[];
  standingsB: Standing[];
  namesMap: Record<string, string>;
  onUpdateScores: (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => void;
}

export default function QuarterfinalsBracket({
  groupMatches,
  qfMatches,
  standingsA,
  standingsB,
  namesMap,
  onUpdateScores,
}: QuarterfinalsBracketProps) {
  const groupStageComplete = checkGroupStageComplete(groupMatches);

  if (!groupStageComplete) {
    const totalGroupMatches = groupMatches.filter(m => m.stage === 'groups').length;
    const completedGroupMatches = groupMatches.filter(m => m.stage === 'groups' && m.completed).length;

    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-850 bg-zinc-900/20 p-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-600 shadow-inner">
          <Lock className="h-7 w-7" />
        </div>
        <h3 className="mt-6 text-lg font-bold text-zinc-300">Quartas de Final Bloqueadas</h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          As quartas de final serão liberadas assim que todos os confrontos da fase de grupos forem concluídos.
        </p>
        
        {/* Progress bar */}
        <div className="mt-6 w-full max-w-xs space-y-2">
          <div className="flex justify-between text-xs font-bold text-zinc-400">
            <span>Progresso da Fase de Grupos</span>
            <span>{completedGroupMatches} / {totalGroupMatches}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-950">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500" 
              style={{ width: `${(completedGroupMatches / totalGroupMatches) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Retrieve match objects
  const qf1 = qfMatches.find(m => m.id === 'qf1')!;
  const qf2 = qfMatches.find(m => m.id === 'qf2')!;
  const qf3 = qfMatches.find(m => m.id === 'qf3')!;
  const qf4 = qfMatches.find(m => m.id === 'qf4')!;

  if (!qf1 || !qf2 || !qf3 || !qf4) {
    return (
      <div className="text-center py-12 text-zinc-500">
        Gerando confrontos das Quartas de Final...
      </div>
    );
  }

  const renderQFCard = (match: Match, title: string, subtitle: string) => {
    const winnerId = getQuarterfinalWinner(match);
    const isTied = match.completed && match.homeScore !== null && match.awayScore !== null && match.homeScore === match.awayScore;

    return (
      <div className="flex flex-col rounded-2xl border border-zinc-850 bg-zinc-900/30 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">{title}</span>
            <h3 className="font-extrabold text-white text-sm">
              {subtitle}
            </h3>
          </div>
          {winnerId && (
            <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
              <Award className="h-3.5 w-3.5" />
              Avançou: {namesMap[winnerId]}
            </span>
          )}
        </div>

        <MatchCard
          match={match}
          namesMap={namesMap}
          onUpdateScores={onUpdateScores}
          showPenalties={isTied}
          winnerId={winnerId}
        />

        {isTied && (match.homePenalties === null || match.homePenalties === undefined || match.awayPenalties === null || match.awayPenalties === undefined) && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 bg-amber-500/5 px-2.5 py-2 rounded-lg border border-amber-500/20 justify-center">
            <ShieldAlert className="h-4 w-4" />
            Empate! Insira os pênaltis para definir o classificado.
          </div>
        )}

        {isTied && match.homePenalties !== null && match.awayPenalties !== null && match.homePenalties === match.awayPenalties && (
          <div className="text-xs font-bold text-red-400 bg-red-400/5 px-2.5 py-2 rounded-lg border border-red-400/20 text-center">
            Decisão por pênaltis empatada! Defina o classificado.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Quartas de Final</h2>
        <p className="text-sm text-zinc-400">
          Jogos eliminatórios de confronto único. Em caso de empate no tempo normal, a decisão será nos pênaltis.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {renderQFCard(qf1, 'Jogo 1', '1º Grupo A × 4º Grupo B')}
        {renderQFCard(qf2, 'Jogo 2', '2º Grupo B × 3º Grupo A')}
        {renderQFCard(qf3, 'Jogo 3', '2º Grupo A × 3º Grupo B')}
        {renderQFCard(qf4, 'Jogo 4', '1º Grupo B × 4º Grupo A')}
      </div>
    </div>
  );
}
