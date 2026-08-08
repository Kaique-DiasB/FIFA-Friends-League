import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ResetTournamentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetTournamentDialog({
  isOpen,
  onClose,
  onConfirm,
}: ResetTournamentDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Reiniciar Campeonato</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Tem certeza que deseja apagar todos os dados do campeonato?
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 text-sm text-zinc-400 bg-zinc-950/50 p-3 rounded-lg border border-zinc-850">
          Esta ação é irreversível e irá redefinir:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Todos os nomes de participantes para os padrões.</li>
            <li>Todos os placares e status de partidas para pendentes.</li>
            <li>A tabela de classificação e fases finais.</li>
          </ul>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-700 bg-transparent px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-850 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 active:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
          >
            Confirmar e Reiniciar
          </button>
        </div>
      </div>
    </div>
  );
}
