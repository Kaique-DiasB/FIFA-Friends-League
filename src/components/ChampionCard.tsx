import React from 'react';
import { Trophy, Award, Sparkles } from 'lucide-react';

interface ChampionCardProps {
  championName: string;
}

export default function ChampionCard({ championName }: ChampionCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/35 bg-gradient-to-b from-amber-500/10 to-zinc-950 p-8 text-center shadow-2xl animate-fade-in my-6 max-w-2xl mx-auto">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15),transparent_60%)]"></div>

      {/* Confetti or Stars Decorative Icons */}
      <div className="absolute top-4 left-4 text-amber-400/40 animate-pulse">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="absolute bottom-4 right-4 text-amber-400/40 animate-pulse delay-100">
        <Sparkles className="h-5 w-5" />
      </div>

      {/* Trophy Visual */}
      <div className="flex justify-center">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-amber-500/15 text-amber-400 ring-4 ring-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
          <Trophy className="h-12 w-12" />
        </div>
      </div>

      {/* Header */}
      <h2 className="mt-6 text-xs font-black uppercase tracking-widest text-amber-400">
        Campeão do Campeonato de FIFA
      </h2>

      {/* Winner Name */}
      <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl uppercase drop-shadow-md">
        {championName}
      </h1>

      {/* Description */}
      <p className="mx-auto mt-3 max-w-md text-xs text-zinc-400">
        Parabéns ao grande vencedor do torneio! A glória máxima do FIFA foi alcançada através de esforço, tática e gols decisivos.
      </p>

      {/* Footer decoration */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-amber-500/70">
        <Award className="h-4 w-4" />
        <span>CONQUISTA DESBLOQUEADA</span>
        <Award className="h-4 w-4" />
      </div>
    </div>
  );
}
