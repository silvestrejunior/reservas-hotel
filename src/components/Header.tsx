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
    <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Busca Global */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por hóspede, quarto (ex: 104) ou placa..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-[#107c41] transition-all"
          />
        </div>
      </div>

      {/* Ações Rápidas & Data */}
      <div className="flex items-center gap-3">
        {/* Horário */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/80">
          <Clock className="w-3.5 h-3.5 text-[#107c41]" />
          <span className="font-medium capitalize">{currentDateText}</span>
        </div>

        {/* Botão Nova Reserva / Check-in */}
        <button
          onClick={onOpenNovaReserva}
          className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0e6d39] active:bg-[#0b5a2f] text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-xs hover:shadow transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Nova Reserva / Check-in</span>
        </button>
      </div>
    </header>
  );
};
