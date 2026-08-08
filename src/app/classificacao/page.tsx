'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TournamentState } from '../../types/tournament';
import { decodeState, generateDefaultState } from '../../utils/tournamentHelpers';
import StandingsTable from '../../components/StandingsTable';
import KnockoutAndPodium from '../../components/KnockoutAndPodium';
import { Trophy, ListOrdered, Award } from 'lucide-react';

function ClassificacaoContent() {
  const searchParams = useSearchParams();
  const stateParam = searchParams.get('state');
  
  const [state, setState] = useState<TournamentState | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<'standings' | 'bracket'>('standings');

  useEffect(() => {
    async function loadData() {
      let loadedState: TournamentState | null = null;
      
      // 1. Try decoding from URL query parameter
      if (stateParam) {
        loadedState = decodeState(stateParam);
      }
      
      // 2. Try fetching from server SQLite database
      if (!loadedState) {
        try {
          console.log("Iniciando busca da classificação no servidor...");
          const res = await fetch('/api/tournament', {
            headers: {
              'ngrok-skip-browser-warning': 'true'
            }
          });
          console.log("Resposta do servidor recebida com status:", res.status);
          const data = await res.json();
          console.log("Dados da classificação decodificados:", data);
          if (data && data.state) {
            loadedState = data.state;
          }
        } catch (err) {
          console.error('Failed to fetch state from SQLite API:', err);
        }
      }
      
      // 3. Fallback to localStorage if no state is retrieved yet
      if (!loadedState) {
        const saved = localStorage.getItem('fifa_tournament_state');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && Array.isArray(parsed.participants) && Array.isArray(parsed.groupMatches)) {
              loadedState = {
                ...parsed,
                qfMatches: Array.isArray(parsed.qfMatches) ? parsed.qfMatches : [],
                sfMatches: Array.isArray(parsed.sfMatches) ? parsed.sfMatches : [],
              };
            }
          } catch {
            // ignore
          }
        }
      }

      // 4. Default fallback
      if (!loadedState) {
        loadedState = generateDefaultState();
      }

      if (loadedState) {
        loadedState = {
          ...loadedState,
          qfMatches: Array.isArray(loadedState.qfMatches) ? loadedState.qfMatches : [],
          sfMatches: Array.isArray(loadedState.sfMatches) ? loadedState.sfMatches : [],
          thirdPlaceMatch: loadedState.thirdPlaceMatch || null,
        };
      }

      setState(loadedState);
      setIsHydrated(true);
    }

    loadData();
  }, [stateParam]);

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
          <span className="text-sm font-bold uppercase tracking-wider">Carregando classificação...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Simple Header */}
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white">
              Classificação do Campeonato
            </h1>
            <p className="text-xs font-medium text-emerald-400 tracking-widest uppercase">
              FIFA Tournament Standings
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex overflow-x-auto rounded-xl bg-zinc-900 p-1 border border-zinc-800 scrollbar-none">
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

        {/* Tab Content */}
        <main className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-5 md:p-6 backdrop-blur-md">
          {activeTab === 'standings' ? (
            <StandingsTable
              participants={state.participants}
              groupMatches={state.groupMatches}
              namesMap={namesMap}
            />
          ) : (
            <KnockoutAndPodium
              state={state}
              namesMap={namesMap}
              readOnly={true}
            />
          )}
        </main>
        
      </div>
    </div>
  );
}

export default function ClassificacaoPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
          <span className="text-sm font-bold uppercase tracking-wider">Carregando...</span>
        </div>
      </div>
    }>
      <ClassificacaoContent />
    </Suspense>
  );
}
