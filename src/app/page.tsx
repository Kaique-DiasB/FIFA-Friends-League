'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TournamentState, Match, Standing, StageDef, StageId } from '../types/tournament';
import {
  calculateStandings,
  generateSummaryText,
  resolveKnockoutSeedPool,
  advanceKnockoutStages,
  resolveStageOutcomes,
  migrateLegacyState,
  encodeState,
  getVisibleStages,
} from '../utils/tournamentHelpers';
import { useToast } from '../utils/useToast';
import TournamentHeader from '../components/TournamentHeader';
import ParticipantsEditor from '../components/ParticipantsEditor';
import GroupStage from '../components/GroupStage';
import StandingsTable from '../components/StandingsTable';
import KnockoutStagePanel from '../components/KnockoutStagePanel';
import ChampionCard from '../components/ChampionCard';
import ResetTournamentDialog from '../components/ResetTournamentDialog';
import KnockoutAndPodium from '../components/KnockoutAndPodium';

import {
  Users,
  Calendar,
  ListOrdered,
  GitCommit,
  GitMerge,
  Trophy,
  Award,
  Shuffle,
  LayoutGrid,
  LucideIcon,
} from 'lucide-react';

const STAGE_ICON: Record<StageId, LucideIcon> = {
  prelim: Shuffle,
  round_of_16: LayoutGrid,
  quarterfinals: GitCommit,
  semifinals: GitMerge,
  final: Trophy,
  third_place: Award,
};

type TabKey = 'participants' | 'groups' | 'standings' | 'bracket' | StageId;

// Re-derives knockoutMatches/championId from the current groupMatches — the single
// recomputation step every score edit (and the initial load) runs through.
function recomputeKnockout(state: TournamentState): TournamentState {
  const config = state.config;
  const groups: ('A' | 'B')[] = config.groupCount === 2 ? ['A', 'B'] : config.groupCount === 1 ? ['A'] : [];
  const standingsByGroup: Partial<Record<'A' | 'B', Standing[]>> = {};
  groups.forEach(g => {
    standingsByGroup[g] = calculateStandings(g, state.participants, state.groupMatches);
  });

  const pool = resolveKnockoutSeedPool(config, state.participants, state.groupMatches, standingsByGroup);
  const knockoutMatches = advanceKnockoutStages(config, pool, state.knockoutMatches);

  const finalStage = config.stages.find(s => s.id === 'final');
  const championId = finalStage
    ? resolveStageOutcomes(finalStage, knockoutMatches).winners[0] ?? null
    : null;

  return { ...state, knockoutMatches, championId };
}

function getPreviousBracketStage(config: TournamentState['config'], stageId: StageId): StageDef | null {
  const chain = getVisibleStages(config).filter(s => s.id !== 'third_place');
  if (stageId === 'third_place') {
    const finalIdx = chain.findIndex(s => s.id === 'final');
    return finalIdx > 0 ? chain[finalIdx - 1] : null;
  }
  const idx = chain.findIndex(s => s.id === stageId);
  return idx > 0 ? chain[idx - 1] : null;
}

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<TournamentState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('participants');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const { toastMessage, showToast } = useToast();

  // Load from API on mount (with localStorage fallback and migration); redirect to the
  // setup wizard when no championship exists anywhere yet.
  useEffect(() => {
    async function loadState() {
      try {
        const res = await fetch('/api/tournament', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const data = await res.json();

        let loadedState: TournamentState | null = data.state ? migrateLegacyState(data.state) : null;

        if (!loadedState) {
          const saved = localStorage.getItem('fifa_tournament_state');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && Array.isArray(parsed.participants) && Array.isArray(parsed.groupMatches)) {
                loadedState = migrateLegacyState(parsed);
                await fetch('/api/tournament/migrate', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true'
                  },
                  body: JSON.stringify({ state: loadedState }),
                });
              }
            } catch (err) {
              console.error('Failed to parse local storage fallback', err);
            }
          }
        }

        if (!loadedState) {
          router.replace('/onboarding');
          return;
        }

        loadedState = recomputeKnockout(loadedState);
        await fetch('/api/tournament', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ state: loadedState }),
        });

        setState(loadedState);
        setIsHydrated(true);
      } catch (err) {
        console.error('Error loading state from SQLite API:', err);
        const saved = localStorage.getItem('fifa_tournament_state');
        if (saved) {
          setState(recomputeKnockout(migrateLegacyState(JSON.parse(saved))));
          setIsHydrated(true);
        } else {
          router.replace('/onboarding');
        }
      }
    }

    loadState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to API (and backup to localStorage) on state change
  useEffect(() => {
    if (isHydrated && state) {
      localStorage.setItem('fifa_tournament_state', JSON.stringify(state));

      fetch('/api/tournament', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({ state }),
      }).catch(err => {
        console.error('Failed to auto-save state to SQLite:', err);
      });
    }
  }, [state, isHydrated]);

  const namesMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (state) {
      state.participants.forEach(p => {
        map[p.id] = p.name;
      });
    }
    return map;
  }, [state]);

  if (!isHydrated || !state) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <span className="text-sm font-bold uppercase tracking-wider">Carregando Campeonato...</span>
        </div>
      </div>
    );
  }

  const config = state.config;

  const handleUpdateName = (id: string, name: string) => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.map(p => (p.id === id ? { ...p, name } : p)),
      };
    });
  };

  const handleUpdateTeam = (id: string, team: string) => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.map(p => (p.id === id ? { ...p, team } : p)),
      };
    });
  };

  const handleRestoreDefaults = () => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.map(p => ({ ...p, name: `Jogador ${p.seed}`, team: '' })),
      };
    });
    showToast('Nomes restaurados para os padrões.');
  };

  const handleConfirmReset = async () => {
    try {
      await fetch('/api/tournament', { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete tournament state:', err);
    }
    localStorage.removeItem('fifa_tournament_state');
    router.push('/onboarding');
  };

  const handleCopySummary = () => {
    const text = generateSummaryText(state, namesMap);
    navigator.clipboard.writeText(text);
    showToast('Resumo copiado para a área de transferência!');
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `campeonato_fifa_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Arquivo JSON exportado com sucesso!');
  };

  const handleImportJSON = (importedState: TournamentState) => {
    setState(recomputeKnockout(migrateLegacyState(importedState)));
    setActiveTab('participants');
    showToast('Configurações importadas com sucesso!');
  };

  const handleShareStandings = () => {
    if (!state) return;
    const encoded = encodeState(state);
    const url = `${window.location.origin}/classificacao?state=${encoded}`;
    navigator.clipboard.writeText(url);
    showToast('Link de classificação copiado!');
  };

  const handleUpdateScores = (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => {
    setState(prev => {
      if (!prev) return null;

      const patchMatch = (m: Match): Match => {
        if (m.id !== matchId) return m;
        const completed = homeScore !== null && awayScore !== null;
        return {
          ...m,
          homeScore,
          awayScore,
          homePenalties: homePenalties !== undefined ? homePenalties : m.homePenalties,
          awayPenalties: awayPenalties !== undefined ? awayPenalties : m.awayPenalties,
          completed,
        };
      };

      const next: TournamentState = {
        ...prev,
        groupMatches: prev.groupMatches.map(patchMatch),
        knockoutMatches: prev.knockoutMatches.map(patchMatch),
      };

      return recomputeKnockout(next);
    });

    showToast('Placar atualizado com sucesso!');
  };

  const visibleStages = getVisibleStages(config);
  const activeStageDef = visibleStages.find(s => s.id === activeTab) ?? null;

  const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
    { key: 'participants', label: 'Participantes', icon: Users },
    ...(config.hasGroupStage
      ? [
          { key: 'groups' as TabKey, label: 'Fase de Grupos', icon: Calendar },
          { key: 'standings' as TabKey, label: 'Classificação FG', icon: ListOrdered },
        ]
      : []),
    ...visibleStages.map(s => ({ key: s.id as TabKey, label: s.label, icon: STAGE_ICON[s.id] })),
    { key: 'bracket', label: 'Chaveamento & Pódio', icon: Award },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-zinc-900 border border-emerald-500/30 px-4 py-3 text-sm font-bold text-emerald-400 shadow-2xl animate-fade-in">
          <Award className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Screen Layout */}
      <div className="print-hidden flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Header */}
        <TournamentHeader
          state={state}
          onResetClick={() => setIsResetOpen(true)}
          onCopySummary={handleCopySummary}
          onExportJSON={handleExportJSON}
          onImportJSON={handleImportJSON}
          onPrint={() => window.print()}
          onShareStandings={handleShareStandings}
        />

        {/* Tab Navigation */}
        <nav className="flex overflow-x-auto rounded-xl bg-zinc-900 p-1 border border-zinc-800 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Contents */}
        <main className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-5 md:p-6 backdrop-blur-md">
          {activeTab === 'participants' && (
            <ParticipantsEditor
              participants={state.participants}
              onUpdateName={handleUpdateName}
              onUpdateTeam={handleUpdateTeam}
              onRestoreDefaults={handleRestoreDefaults}
            />
          )}

          {activeTab === 'groups' && config.hasGroupStage && (
            <GroupStage
              groupMatches={state.groupMatches}
              participants={state.participants}
              namesMap={namesMap}
              onUpdateScores={handleUpdateScores}
            />
          )}

          {activeTab === 'standings' && config.hasGroupStage && (
            <StandingsTable
              participants={state.participants}
              groupMatches={state.groupMatches}
              namesMap={namesMap}
              qualifiersPerGroup={config.qualifiersPerGroup}
            />
          )}

          {activeStageDef && (
            <div className="space-y-6">
              {activeStageDef.id === 'final' && state.championId && (
                <ChampionCard championName={namesMap[state.championId] || state.championId} />
              )}
              {(() => {
                const stageMatches = state.knockoutMatches.filter(m => m.stage === activeStageDef.id);
                const previousStage = getPreviousBracketStage(config, activeStageDef.id);
                const locked = stageMatches.length === 0;

                let lockedMessage: string | undefined;
                let progress: { completed: number; total: number } | undefined;

                if (locked) {
                  if (previousStage) {
                    lockedMessage = `Esta fase será liberada assim que a fase "${previousStage.label}" for concluída.`;
                    const outcome = resolveStageOutcomes(previousStage, state.knockoutMatches);
                    progress = { completed: outcome.winners.length, total: previousStage.slotCount };
                  } else if (config.hasGroupStage) {
                    lockedMessage = 'Esta fase será liberada assim que a fase de grupos for concluída.';
                    progress = {
                      completed: state.groupMatches.filter(m => m.completed).length,
                      total: state.groupMatches.length,
                    };
                  }
                }

                return (
                  <KnockoutStagePanel
                    stageDef={activeStageDef}
                    matches={stageMatches}
                    namesMap={namesMap}
                    onUpdateScores={handleUpdateScores}
                    locked={locked}
                    lockedMessage={lockedMessage}
                    progress={progress}
                  />
                );
              })()}
            </div>
          )}

          {activeTab === 'bracket' && (
            <KnockoutAndPodium
              state={state}
              namesMap={namesMap}
              onUpdateScores={handleUpdateScores}
              readOnly={true}
            />
          )}
        </main>
      </div>

      {/* Print-Only Layout */}
      <PrintView state={state} namesMap={namesMap} />

      {/* Confirmation dialog for reset */}
      <ResetTournamentDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}

function PrintView({ state, namesMap }: { state: TournamentState; namesMap: Record<string, string> }) {
  const config = state.config;
  const groups: ('A' | 'B')[] = config.groupCount === 2 ? ['A', 'B'] : config.groupCount === 1 ? ['A'] : [];
  const stages = getVisibleStages(config);

  return (
    <div className="hidden print:block bg-white text-black p-8 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="text-center border-b border-gray-300 pb-4">
        <h1 className="text-3xl font-extrabold uppercase tracking-tight">Campeonato de FIFA</h1>
        <p className="text-sm text-gray-500 mt-1">Relatório Geral do Torneio • Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {state.championId && (
        <div className="border border-yellow-400 bg-yellow-50 p-6 rounded-lg text-center space-y-2">
          <h2 className="text-sm font-bold text-yellow-600 uppercase tracking-widest">Campeão</h2>
          <h1 className="text-3xl font-black text-gray-900 uppercase">{namesMap[state.championId] || state.championId}</h1>
        </div>
      )}

      {groups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">Tabela de Classificação</h2>
          <div className={`grid gap-8 ${groups.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {groups.map(g => (
              <div key={g}>
                <h3 className="font-bold text-sm text-gray-700 mb-2">Grupo {g}</h3>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b font-bold text-gray-600">
                      <th className="py-1">Pos</th>
                      <th className="py-1">Jogador</th>
                      <th className="py-1 text-center">PTS</th>
                      <th className="py-1 text-center">J</th>
                      <th className="py-1 text-center">V</th>
                      <th className="py-1 text-center">E</th>
                      <th className="py-1 text-center">D</th>
                      <th className="py-1 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculateStandings(g, state.participants, state.groupMatches).map((s, i) => (
                      <tr key={s.participantId} className="border-b">
                        <td className="py-1.5 font-bold">{i + 1}º</td>
                        <td className="py-1.5">{namesMap[s.participantId] || s.participantId}</td>
                        <td className="py-1.5 text-center font-bold">{s.points}</td>
                        <td className="py-1.5 text-center">{s.games}</td>
                        <td className="py-1.5 text-center">{s.wins}</td>
                        <td className="py-1.5 text-center">{s.draws}</td>
                        <td className="py-1.5 text-center">{s.losses}</td>
                        <td className="py-1.5 text-center">{s.goalDifference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 pt-4 border-t border-gray-300">
        <h2 className="text-lg font-bold border-b border-gray-300 pb-1">Fase Eliminatória</h2>
        <div className={`grid gap-8 ${stages.length >= 3 ? 'grid-cols-3' : stages.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {stages.map(stageDef => {
            const stageMatches = state.knockoutMatches.filter(m => m.stage === stageDef.id);
            const bySlot = new Map<number, Match[]>();
            stageMatches.forEach(m => {
              const list = bySlot.get(m.slot) ?? [];
              list.push(m);
              bySlot.set(m.slot, list);
            });
            const slots = Array.from(bySlot.keys()).sort((a, b) => a - b);

            return (
              <div key={stageDef.id} className="space-y-2">
                <h3 className="font-bold text-sm text-gray-700">{stageDef.label}</h3>
                {slots.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">Pendente.</p>
                ) : (
                  <div className="text-xs space-y-2">
                    {slots.map(slot => {
                      const legs = (bySlot.get(slot) ?? []).sort((a, b) => a.leg - b.leg);
                      return (
                        <div key={slot}>
                          {legs.map(m => (
                            <p key={m.id} className="ml-2">
                              {namesMap[m.homeId] || m.homeId} {m.completed ? `${m.homeScore} x ${m.awayScore}` : '-'} {namesMap[m.awayId] || m.awayId}
                              {m.completed && m.homeScore === m.awayScore && m.homePenalties != null && ` (Pênaltis: ${m.homePenalties} x ${m.awayPenalties})`}
                            </p>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
