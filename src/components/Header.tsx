import React from 'react';
import { Search, PlusCircle, UserCheck, Bell, Clock } from 'lucide-react';

interface HeaderProps {
  onOpenNovaReserva: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentDateText: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNovaReserva,
  searchTerm,
  onSearchChange,
  currentDateText,
}) => {
  return (
    <header className="h-16 px-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
      {/* Busca Global */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por hóspede, quarto (ex: 104) ou placa..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Ações Rápidas & Data */}
      <div className="flex items-center gap-4">
        {/* Horário */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{currentDateText}</span>
        </div>

        {/* Botão Nova Reserva / Check-in */}
        <button
          onClick={onOpenNovaReserva}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-lg shadow-blue-600/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova Reserva / Check-in</span>
        </button>
      </div>
    </header>
  );
};
