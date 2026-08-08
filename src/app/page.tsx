'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TournamentState } from '../types/tournament';
import {
  generateDefaultState,
  calculateStandings,
  generateSummaryText,
  checkGroupStageComplete,
  initializeQuarterfinals,
  checkQuarterfinalsComplete,
  getQuarterfinalWinner,
  initializeSemifinals,
  checkSemifinalsComplete,
  getSemifinalResult,
  getThirdPlaceWinner,
  encodeState,
} from '../utils/tournamentHelpers';
import TournamentHeader from '../components/TournamentHeader';
import ParticipantsEditor from '../components/ParticipantsEditor';
import GroupStage from '../components/GroupStage';
import StandingsTable from '../components/StandingsTable';
import QuarterfinalsBracket from '../components/QuarterfinalsBracket';
import SemifinalsBracket from '../components/SemifinalsBracket';
import FinalMatch from '../components/FinalMatch';
import ThirdPlaceMatch from '../components/ThirdPlaceMatch';
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
  Award
} from 'lucide-react';

export default function Home() {
  const [state, setState] = useState<TournamentState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'participants' | 'groups' | 'standings' | 'qf' | 'semis' | 'third_place' | 'final' | 'bracket'>('participants');
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load from API on mount (with localStorage fallback and migration)
  useEffect(() => {
    async function loadState() {
      try {
        console.log("Carregando dados do campeonato do servidor SQLite...");
        const res = await fetch('/api/tournament', {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        const data = await res.json();
        
        let loadedState: TournamentState | null = data.state;
        
        // If server is empty, check localStorage to migrate
        if (!loadedState) {
          console.log("Banco de dados SQLite vazio. Verificando localStorage para migração...");
          const saved = localStorage.getItem('fifa_tournament_state');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              if (parsed && Array.isArray(parsed.participants) && Array.isArray(parsed.groupMatches)) {
                loadedState = {
                  ...parsed,
                  qfMatches: Array.isArray(parsed.qfMatches) ? parsed.qfMatches : [],
                  sfMatches: Array.isArray(parsed.sfMatches) ? parsed.sfMatches : [],
                  thirdPlaceMatch: parsed.thirdPlaceMatch || null,
                };
                
                console.log("Migrando dados anteriores para o SQLite...");
                // Migrate to SQLite database on the server
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
        
        if (loadedState) {
          loadedState = {
            ...loadedState,
            qfMatches: Array.isArray(loadedState.qfMatches) ? loadedState.qfMatches : [],
            sfMatches: Array.isArray(loadedState.sfMatches) ? loadedState.sfMatches : [],
            thirdPlaceMatch: loadedState.thirdPlaceMatch || null,
          };
        }
        
        // If still no state (fresh project), generate default and save to SQLite
        if (!loadedState) {
          console.log("Nenhum dado encontrado localmente. Inicializando campeonato novo...");
          loadedState = generateDefaultState();
          await fetch('/api/tournament', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ state: loadedState }),
          });
        }
        
        // Auto-initialize QF if group matches are complete but QF is empty
        if (checkGroupStageComplete(loadedState.groupMatches) && (!loadedState.qfMatches || loadedState.qfMatches.length === 0)) {
          console.log("Fase de grupos completa! Inicializando Quartas de Final...");
          const standingsA = calculateStandings('A', loadedState.participants, loadedState.groupMatches);
          const standingsB = calculateStandings('B', loadedState.participants, loadedState.groupMatches);
          loadedState.qfMatches = initializeQuarterfinals(standingsA, standingsB);
          
          // Save the auto-initialized QF back to server
          await fetch('/api/tournament', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify({ state: loadedState }),
          });
        }
        
        console.log("Dados carregados com sucesso.");
        setState(loadedState);
        setIsHydrated(true);
      } catch (err) {
        console.error('Error loading state from SQLite API:', err);
        // Fallback to local storage if API is completely unreachable
        const saved = localStorage.getItem('fifa_tournament_state') || JSON.stringify(generateDefaultState());
        setState(JSON.parse(saved));
        setIsHydrated(true);
      }
    }
    
    loadState();
  }, []);

  // Save to API (and backup to localStorage) on state change
  useEffect(() => {
    if (isHydrated && state) {
      // 1. Local backup
      localStorage.setItem('fifa_tournament_state', JSON.stringify(state));
      
      // 2. Server save
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

  // Toast helper
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => (prev === message ? null : prev));
    }, 3000);
  };

  // Names map for fast lookup
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

  // Update participant name
  const handleUpdateName = (id: string, name: string) => {
    setState(prev => {
      if (!prev) return null;
      return {
        ...prev,
        participants: prev.participants.map(p => (p.id === id ? { ...p, name } : p)),
      };
    });
  };

  // Restore default participant names
  const handleRestoreDefaults = () => {
    setState(prev => {
      if (!prev) return null;
      const defaultNames = [
        'Participante A1', 'Participante A2', 'Participante A3', 'Participante A4', 'Participante A5',
        'Participante B1', 'Participante B2', 'Participante B3', 'Participante B4', 'Participante B5'
      ];
      return {
        ...prev,
        participants: prev.participants.map((p, i) => ({ ...p, name: defaultNames[i] })),
      };
    });
    showToast('Nomes restaurados para os padrões.');
  };

  // Reset entire tournament
  const handleConfirmReset = () => {
    setState(generateDefaultState());
    setActiveTab('participants');
    showToast('Campeonato reiniciado com sucesso.');
  };

  // Copy Summary text
  const handleCopySummary = () => {
    const text = generateSummaryText(state, namesMap);
    navigator.clipboard.writeText(text);
    showToast('Resumo copiado para a área de transferência!');
  };

  // Export JSON
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

  // Import JSON
  const handleImportJSON = (importedState: TournamentState) => {
    setState(importedState);
    setActiveTab('participants');
    showToast('Configurações importadas com sucesso!');
  };

  // Share standings link
  const handleShareStandings = () => {
    if (!state) return;
    const encoded = encodeState(state);
    const url = `${window.location.origin}/classificacao?state=${encoded}`;
    navigator.clipboard.writeText(url);
    showToast('Link de classificação copiado!');
  };

  // Update scores and recalculate brackets
  const handleUpdateScores = (
    matchId: string,
    homeScore: number | null,
    awayScore: number | null,
    homePenalties?: number | null,
    awayPenalties?: number | null
  ) => {
    setState(prev => {
      if (!prev) return null;

      // Update Group stage match
      const nextGroupMatches = prev.groupMatches.map(m => {
        if (m.id === matchId) {
          const completed = homeScore !== null && awayScore !== null;
          return { ...m, homeScore, awayScore, completed };
        }
        return m;
      });

      // Update Quarterfinals match
      let nextQfMatches = prev.qfMatches || [];
      if (nextQfMatches.some(m => m.id === matchId)) {
        nextQfMatches = nextQfMatches.map(m => {
          if (m.id === matchId) {
            const completed = homeScore !== null && awayScore !== null;
            return {
              ...m,
              homeScore,
              awayScore,
              homePenalties: homePenalties !== undefined ? homePenalties : m.homePenalties,
              awayPenalties: awayPenalties !== undefined ? awayPenalties : m.awayPenalties,
              completed,
            };
          }
          return m;
        });
      }

      // Update Semifinals match
      let nextSfMatches = prev.sfMatches || [];
      if (nextSfMatches.some(m => m.id === matchId)) {
        nextSfMatches = nextSfMatches.map(m => {
          if (m.id === matchId) {
            const completed = homeScore !== null && awayScore !== null;
            return {
              ...m,
              homeScore,
              awayScore,
              homePenalties: homePenalties !== undefined ? homePenalties : m.homePenalties,
              awayPenalties: awayPenalties !== undefined ? awayPenalties : m.awayPenalties,
              completed,
            };
          }
          return m;
        });
      }

      // Update Final match
      let nextFinalMatch = prev.finalMatch;
      if (nextFinalMatch && nextFinalMatch.id === matchId) {
        const completed = homeScore !== null && awayScore !== null;
        nextFinalMatch = {
          ...nextFinalMatch,
          homeScore,
          awayScore,
          homePenalties: homePenalties !== undefined ? homePenalties : nextFinalMatch.homePenalties,
          awayPenalties: awayPenalties !== undefined ? awayPenalties : nextFinalMatch.awayPenalties,
          completed,
        };
      }

      // Update Third Place match
      let nextThirdPlaceMatch = prev.thirdPlaceMatch;
      if (nextThirdPlaceMatch && nextThirdPlaceMatch.id === matchId) {
        const completed = homeScore !== null && awayScore !== null;
        nextThirdPlaceMatch = {
          ...nextThirdPlaceMatch,
          homeScore,
          awayScore,
          homePenalties: homePenalties !== undefined ? homePenalties : nextThirdPlaceMatch.homePenalties,
          awayPenalties: awayPenalties !== undefined ? awayPenalties : nextThirdPlaceMatch.awayPenalties,
          completed,
        };
      }

      // Recalculate standings and stages
      const standingsA = calculateStandings('A', prev.participants, nextGroupMatches);
      const standingsB = calculateStandings('B', prev.participants, nextGroupMatches);
      const groupComplete = checkGroupStageComplete(nextGroupMatches);

      // Quarterfinals generation check
      if (groupComplete) {
        if (nextQfMatches.length === 0) {
          nextQfMatches = initializeQuarterfinals(standingsA, standingsB);
        } else {
          // Update host/guest IDs in case names or standings changed but keep scores
          const qfFixtures = initializeQuarterfinals(standingsA, standingsB);
          nextQfMatches = nextQfMatches.map((m, idx) => {
            const fixture = qfFixtures[idx];
            if (fixture) {
              return { ...m, homeId: fixture.homeId, awayId: fixture.awayId };
            }
            return m;
          });
        }
      } else {
        // Clear if group stage was modified to be incomplete
        nextQfMatches = [];
        nextSfMatches = [];
        nextFinalMatch = null;
        nextThirdPlaceMatch = null;
      }

      // Semifinals generation check
      const qfComplete = checkQuarterfinalsComplete(nextQfMatches);
      if (groupComplete && qfComplete) {
        if (nextSfMatches.length === 0) {
          nextSfMatches = initializeSemifinals(nextQfMatches);
        } else {
          // Update host/guest IDs based on QF winners, keeping scores
          const sfFixtures = initializeSemifinals(nextQfMatches);
          nextSfMatches = nextSfMatches.map((m, idx) => {
            const fixture = sfFixtures[idx];
            if (fixture) {
              return { ...m, homeId: fixture.homeId, awayId: fixture.awayId };
            }
            return m;
          });
        }
      } else {
        nextSfMatches = [];
        nextFinalMatch = null;
        nextThirdPlaceMatch = null;
      }

      // Final generation check
      const sfComplete = checkSemifinalsComplete(nextSfMatches, nextQfMatches);
      if (groupComplete && qfComplete && sfComplete) {
        const qf1Match = nextQfMatches.find(m => m.id === 'qf1')!;
        const qf2Match = nextQfMatches.find(m => m.id === 'qf2')!;
        const qf3Match = nextQfMatches.find(m => m.id === 'qf3')!;
        const qf4Match = nextQfMatches.find(m => m.id === 'qf4')!;

        const w1 = getQuarterfinalWinner(qf1Match)!;
        const w2 = getQuarterfinalWinner(qf2Match)!;
        const w3 = getQuarterfinalWinner(qf3Match)!;
        const w4 = getQuarterfinalWinner(qf4Match)!;

        const sf1Ida = nextSfMatches.find(m => m.id === 'sf1_ida')!;
        const sf1Volta = nextSfMatches.find(m => m.id === 'sf1_volta')!;
        const sf2Ida = nextSfMatches.find(m => m.id === 'sf2_ida')!;
        const sf2Volta = nextSfMatches.find(m => m.id === 'sf2_volta')!;

        const res1 = getSemifinalResult(sf1Ida, sf1Volta, w1, w3);
        const res2 = getSemifinalResult(sf2Ida, sf2Volta, w4, w2);

        if (res1.winnerId && res2.winnerId) {
          if (!nextFinalMatch) {
            nextFinalMatch = {
              id: 'final',
              stage: 'final',
              round: 1,
              homeId: res1.winnerId,
              awayId: res2.winnerId,
              completed: false,
            };
          } else {
            nextFinalMatch = {
              ...nextFinalMatch,
              homeId: res1.winnerId,
              awayId: res2.winnerId,
            };
          }

          // Losers from Semifinals play in third place match
          const l1 = res1.winnerId === w1 ? w3 : w1;
          const l2 = res2.winnerId === w4 ? w2 : w4;
          if (!nextThirdPlaceMatch) {
            nextThirdPlaceMatch = {
              id: 'third_place',
              stage: 'third_place',
              round: 1,
              homeId: l1,
              awayId: l2,
              completed: false,
            };
          } else {
            nextThirdPlaceMatch = {
              ...nextThirdPlaceMatch,
              homeId: l1,
              awayId: l2,
            };
          }
        }
      } else {
        nextFinalMatch = null;
        nextThirdPlaceMatch = null;
      }

      // Champion calculation check
      let championId: string | null = null;
      if (groupComplete && qfComplete && sfComplete && nextFinalMatch && nextFinalMatch.completed) {
        const hs = nextFinalMatch.homeScore ?? 0;
        const as = nextFinalMatch.awayScore ?? 0;
        if (hs > as) {
          championId = nextFinalMatch.homeId;
        } else if (as > hs) {
          championId = nextFinalMatch.awayId;
        } else {
          // Tied, check penalties
          const hp = nextFinalMatch.homePenalties;
          const ap = nextFinalMatch.awayPenalties;
          if (hp !== null && hp !== undefined && ap !== null && ap !== undefined) {
            if (hp > ap) {
              championId = nextFinalMatch.homeId;
            } else if (ap > hp) {
              championId = nextFinalMatch.awayId;
            }
          }
        }
      }

      return {
        ...prev,
        groupMatches: nextGroupMatches,
        qfMatches: nextQfMatches,
        sfMatches: nextSfMatches,
        finalMatch: nextFinalMatch,
        thirdPlaceMatch: nextThirdPlaceMatch,
        championId,
      };
    });

    showToast('Placar atualizado com sucesso!');
  };

  const standingsA = calculateStandings('A', state.participants, state.groupMatches);
  const standingsB = calculateStandings('B', state.participants, state.groupMatches);

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
          <button
            onClick={() => setActiveTab('participants')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === 'participants'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Participantes</span>
          </button>
          
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === 'groups'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Fase de Grupos</span>
          </button>

          <button
            onClick={() => setActiveTab('standings')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === 'standings'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <ListOrdered className="h-4 w-4" />
            <span>Classificação FG</span>
          </button>

          <button
            onClick={() => setActiveTab('qf')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === 'qf'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <GitCommit className="h-4 w-4" />
            <span>Quartas</span>
          </button>

          <button
            onClick={() => setActiveTab('semis')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === 'semis'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <GitMerge className="h-4 w-4" />
            <span>Semifinais</span>
          </button>

          <button
            onClick={() => setActiveTab('third_place')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === 'third_place'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>3º Lugar</span>
          </button>

          <button
            onClick={() => setActiveTab('final')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === 'final'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Final</span>
          </button>

          <button
            onClick={() => setActiveTab('bracket')}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${
              activeTab === 'bracket'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Chaveamento & Pódio</span>
          </button>
        </nav>

        {/* Tab Contents */}
        <main className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-5 md:p-6 backdrop-blur-md">
          {activeTab === 'participants' && (
            <ParticipantsEditor
              participants={state.participants}
              onUpdateName={handleUpdateName}
              onRestoreDefaults={handleRestoreDefaults}
            />
          )}

          {activeTab === 'groups' && (
            <GroupStage
              groupMatches={state.groupMatches}
              namesMap={namesMap}
              onUpdateScores={handleUpdateScores}
            />
          )}

          {activeTab === 'standings' && (
            <StandingsTable
              participants={state.participants}
              groupMatches={state.groupMatches}
              namesMap={namesMap}
            />
          )}

          {activeTab === 'qf' && (
            <QuarterfinalsBracket
              groupMatches={state.groupMatches}
              qfMatches={state.qfMatches || []}
              standingsA={standingsA}
              standingsB={standingsB}
              namesMap={namesMap}
              onUpdateScores={handleUpdateScores}
            />
          )}

          {activeTab === 'semis' && (
            <SemifinalsBracket
              qfMatches={state.qfMatches || []}
              sfMatches={state.sfMatches}
              namesMap={namesMap}
              onUpdateScores={handleUpdateScores}
            />
          )}

          {activeTab === 'third_place' && (
            <ThirdPlaceMatch
              qfMatches={state.qfMatches || []}
              sfMatches={state.sfMatches}
              thirdPlaceMatch={state.thirdPlaceMatch}
              namesMap={namesMap}
              onUpdateScores={handleUpdateScores}
            />
          )}

          {activeTab === 'final' && (
            <div className="space-y-6">
              {state.championId && (
                <ChampionCard championName={namesMap[state.championId] || state.championId} />
              )}
              <FinalMatch
                qfMatches={state.qfMatches || []}
                sfMatches={state.sfMatches}
                finalMatch={state.finalMatch}
                namesMap={namesMap}
                onUpdateScores={handleUpdateScores}
              />
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
      <div className="hidden print:block bg-white text-black p-8 max-w-4xl mx-auto space-y-8 font-sans">
        <div className="text-center border-b border-gray-300 pb-4">
          <h1 className="text-3xl font-extrabold uppercase tracking-tight">Campeonato de FIFA</h1>
          <p className="text-sm text-gray-500 mt-1">Relatório Geral do Torneio • Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        {/* Print Champion */}
        {state.championId && (
          <div className="border border-yellow-400 bg-yellow-50 p-6 rounded-lg text-center space-y-2">
            <h2 className="text-sm font-bold text-yellow-600 uppercase tracking-widest">Campeão</h2>
            <h1 className="text-3xl font-black text-gray-900 uppercase">{namesMap[state.championId] || state.championId}</h1>
          </div>
        )}

        {/* Print Standings */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">Tabela de Classificação</h2>
          <div className="grid grid-cols-2 gap-8">
            {/* Group A */}
            <div>
              <h3 className="font-bold text-sm text-gray-700 mb-2">Grupo A</h3>
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
                  {standingsA.map((s, i) => (
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

            {/* Group B */}
            <div>
              <h3 className="font-bold text-sm text-gray-700 mb-2">Grupo B</h3>
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
                  {standingsB.map((s, i) => (
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
          </div>
        </div>

        {/* Print Playoff Results */}
        <div className="space-y-4 pt-4 border-t border-gray-300">
          <h2 className="text-lg font-bold border-b border-gray-300 pb-1">Fase Eliminatória</h2>
          
          <div className="space-y-6">
            {/* Quartas de Final print */}
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-gray-700">Quartas de Final</h3>
              {state.qfMatches && state.qfMatches.length === 4 ? (
                <div className="grid grid-cols-2 gap-4 text-xs">
                  {state.qfMatches.map((m, idx) => (
                    <div key={m.id}>
                      <span className="font-semibold text-gray-600">Jogo {idx + 1}: </span>
                      <span>
                        {namesMap[m.homeId] || m.homeId} {m.homeScore !== null ? m.homeScore : '-'} x {m.awayScore !== null ? m.awayScore : '-'} {namesMap[m.awayId] || m.awayId}
                        {m.homePenalties !== null && ` (Pênaltis: ${m.homePenalties} x ${m.awayPenalties})`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">Quartas de final pendentes.</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-8 pt-2 border-t border-dashed border-gray-200">
              {/* Semifinals print */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-700">Semifinais</h3>
                {state.sfMatches && state.sfMatches.length === 4 ? (
                  <div className="text-xs space-y-3">
                    <div>
                      <p className="font-semibold text-gray-600">Semifinal 1:</p>
                      <p className="ml-2">
                        Ida: {namesMap[state.sfMatches[0].homeId] || state.sfMatches[0].homeId} {state.sfMatches[0].homeScore} x {state.sfMatches[0].awayScore} {namesMap[state.sfMatches[0].awayId] || state.sfMatches[0].awayId}
                      </p>
                      <p className="ml-2">
                        Volta: {namesMap[state.sfMatches[1].homeId] || state.sfMatches[1].homeId} {state.sfMatches[1].homeScore} x {state.sfMatches[1].awayScore} {namesMap[state.sfMatches[1].awayId] || state.sfMatches[1].awayId}
                        {state.sfMatches[1].homePenalties !== null && ` (Pênaltis: ${state.sfMatches[1].homePenalties} x ${state.sfMatches[1].awayPenalties})`}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-600">Semifinal 2:</p>
                      <p className="ml-2">
                        Ida: {namesMap[state.sfMatches[2].homeId] || state.sfMatches[2].homeId} {state.sfMatches[2].homeScore} x {state.sfMatches[2].awayScore} {namesMap[state.sfMatches[2].awayId] || state.sfMatches[2].awayId}
                      </p>
                      <p className="ml-2">
                        Volta: {namesMap[state.sfMatches[3].homeId] || state.sfMatches[3].homeId} {state.sfMatches[3].homeScore} x {state.sfMatches[3].awayScore} {namesMap[state.sfMatches[3].awayId] || state.sfMatches[3].awayId}
                        {state.sfMatches[3].homePenalties !== null && ` (Pênaltis: ${state.sfMatches[3].homePenalties} x ${state.sfMatches[3].awayPenalties})`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Semifinais pendentes.</p>
                )}
              </div>

              {/* Third Place print */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-700">Disputa de 3º Lugar</h3>
                {state.thirdPlaceMatch ? (
                  <div className="text-xs">
                    <p className="font-semibold text-gray-600">Confronto único:</p>
                    <p className="ml-2 text-sm font-bold mt-1">
                      {namesMap[state.thirdPlaceMatch.homeId] || state.thirdPlaceMatch.homeId} {state.thirdPlaceMatch.homeScore !== null ? state.thirdPlaceMatch.homeScore : '-'} x {state.thirdPlaceMatch.awayScore !== null ? state.thirdPlaceMatch.awayScore : '-'} {namesMap[state.thirdPlaceMatch.awayId] || state.thirdPlaceMatch.awayId}
                      {state.thirdPlaceMatch.homePenalties !== null && ` (Pênaltis: ${state.thirdPlaceMatch.homePenalties} x ${state.thirdPlaceMatch.awayPenalties})`}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Disputa pendente.</p>
                )}
              </div>

              {/* Final print */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-gray-700">Grande Final</h3>
                {state.finalMatch ? (
                  <div className="text-xs">
                    <p className="font-semibold text-gray-600">Confronto único:</p>
                    <p className="ml-2 text-sm font-bold mt-1">
                      {namesMap[state.finalMatch.homeId] || state.finalMatch.homeId} {state.finalMatch.homeScore !== null ? state.finalMatch.homeScore : '-'} x {state.finalMatch.awayScore !== null ? state.finalMatch.awayScore : '-'} {namesMap[state.finalMatch.awayId] || state.finalMatch.awayId}
                      {state.finalMatch.homePenalties !== null && ` (Pênaltis: ${state.finalMatch.homePenalties} x ${state.finalMatch.awayPenalties})`}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Final pendente.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog for reset */}
      <ResetTournamentDialog
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
