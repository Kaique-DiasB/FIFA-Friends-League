import React, { useRef } from 'react';
import { 
  Users, 
  Layers, 
  Award, 
  HelpCircle, 
  Copy, 
  Printer, 
  Download, 
  Upload, 
  RefreshCw,
  Trophy,
  Share2
} from 'lucide-react';
import { TournamentState } from '../types/tournament';

interface TournamentHeaderProps {
  state: TournamentState;
  onResetClick: () => void;
  onCopySummary: () => void;
  onExportJSON: () => void;
  onImportJSON: (data: TournamentState) => void;
  onPrint: () => void;
  onShareStandings: () => void;
}

export default function TournamentHeader({
  state,
  onResetClick,
  onCopySummary,
  onExportJSON,
  onImportJSON,
  onPrint,
  onShareStandings,
}: TournamentHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = state.config;

  const groupsLabel = config.hasGroupStage
    ? `${config.groupCount} ${config.groupCount === 1 ? 'grupo' : 'grupos'}`
    : 'Mata-mata';
  const groupsCaption = config.hasGroupStage
    ? (config.groupCount === 2 ? 'A e B' : 'Grupo A')
    : 'Sem fase de grupos';

  const qualifiedLabel = config.hasGroupStage ? `${config.qualifiersPerGroup} por grupo` : '—';
  const qualifiedCaption = config.hasGroupStage ? 'avançam para o mata-mata' : 'todos entram direto';

  const finalStage = config.stages.find(s => s.id === 'final');
  const finalFormatLabel = finalStage?.legs === 2 ? 'Ida e Volta' : 'Jogo Único';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (
          parsed &&
          Array.isArray(parsed.participants) &&
          Array.isArray(parsed.groupMatches)
        ) {
          onImportJSON(parsed as TournamentState);
        } else {
          alert('Erro: O arquivo JSON não possui o formato do campeonato.');
        }
            } catch {
        alert('Erro ao decodificar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <header className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Trophy className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-white sm:text-3xl">
              Campeonato de FIFA
            </h1>
            <p className="text-xs font-medium text-emerald-400 tracking-widest uppercase">
              FIFA Tournament Manager
            </p>
          </div>
        </div>

        {/* Global Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCopySummary}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-850 px-3 py-1.5 text-xs font-semibold text-zinc-200 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition"
            title="Copiar resumo textual do torneio"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Copiar Resumo</span>
          </button>
          
          <button
            onClick={onShareStandings}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20 hover:text-white transition"
            title="Gerar link de classificação compartilhável"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Compartilhar Tabela</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-850 px-3 py-1.5 text-xs font-semibold text-zinc-200 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition"
            title="Imprimir visualização atual"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Imprimir</span>
          </button>

          <button
            onClick={onExportJSON}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-850 px-3 py-1.5 text-xs font-semibold text-zinc-200 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition"
            title="Exportar dados atuais para arquivo JSON"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Exportar JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-850 px-3 py-1.5 text-xs font-semibold text-zinc-200 border border-zinc-700 hover:bg-zinc-800 hover:text-white transition"
            title="Importar dados de um arquivo JSON"
          >
            <Upload className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Importar JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={onResetClick}
            className="flex items-center gap-1.5 rounded-lg bg-red-650 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition shadow-lg shadow-red-950/20"
            title="Reiniciar campeonato"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reiniciar</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Participants */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-emerald-500/35">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Total Jogadores
            </span>
            <Users className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{state.participants.length}</span>
            <span className="text-xs font-medium text-zinc-500">participantes</span>
          </div>
        </div>

        {/* Total Groups */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-emerald-500/35">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Grupos
            </span>
            <Layers className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{groupsLabel}</span>
            <span className="text-xs font-medium text-zinc-500">{groupsCaption}</span>
          </div>
        </div>

        {/* Qualified Slots */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-emerald-500/35">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Classificados
            </span>
            <Award className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{qualifiedLabel}</span>
            <span className="text-xs font-medium text-zinc-500">{qualifiedCaption}</span>
          </div>
        </div>

        {/* Final Format */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 transition-all hover:border-emerald-500/35">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Formato Final
            </span>
            <HelpCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-black text-white uppercase tracking-tight">
              {finalFormatLabel}
            </span>
            <span className="text-xs font-medium text-zinc-500">com pênaltis</span>
          </div>
        </div>
      </div>
    </header>
  );
}
