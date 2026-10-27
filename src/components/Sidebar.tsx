import React from 'react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  ShoppingCart, 
  Sparkles, 
  BarChart3, 
  Users2, 
  ShieldCheck, 
  Hotel,
  Radio
} from 'lucide-react';

export type NavTab = 'dashboard' | 'calendario' | 'pos' | 'governanca' | 'financeiro' | 'rh';
export type UserRole = 'admin' | 'recepcao' | 'financeiro' | 'rh' | 'governanca';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  isRealtimeConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  onChangeRole,
  isRealtimeConnected
}) => {
  const menuItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string; restrictedTo?: UserRole[] }[] = [
    {
      id: 'dashboard',
      label: 'Visão Geral (UHs)',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'calendario',
      label: 'Mapa de Reservas',
      icon: <CalendarDays className="w-5 h-5" />,
    },
    {
      id: 'pos',
      label: 'PDV & Balcão',
      icon: <ShoppingCart className="w-5 h-5" />,
      badge: 'Estoque & Vales'
    },
    {
      id: 'governanca',
      label: 'Governança & Camareiras',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: 'financeiro',
      label: 'Financeiro & DRE',
      icon: <BarChart3 className="w-5 h-5" />,
      badge: 'DRE Real'
    },
    {
      id: 'rh',
      label: 'RH & Departamento Pessoal',
      icon: <Users2 className="w-5 h-5" />,
      badge: 'Restrito',
      restrictedTo: ['admin', 'rh']
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-xs z-30">
      <div>
        {/* Header / Logo */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0e6d39] to-[#107c41] flex items-center justify-center shadow-md shadow-emerald-700/20 text-white font-bold">
              <Hotel className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
                Hotel Tio Luiz
              </h1>
              <p className="text-[11px] text-[#107c41] font-bold tracking-tight">PMS & ERP Inteligente</p>
            </div>
          </div>
        </div>

        {/* Realtime Status */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRealtimeConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRealtimeConnected ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-600 font-medium text-[11px]">Supabase Realtime</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-[#107c41] font-bold border border-emerald-200">
            32 UHs Online
          </span>
        </div>

        {/* Menu Items */}
        <nav className="p-2 space-y-1 mt-1">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            const isRestricted = item.restrictedTo && !item.restrictedTo.includes(userRole);

            if (isRestricted) {
              return null; // Oculta telas confidenciais para quem não tem permissão
            }

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-[#107c41] border-l-4 border-[#107c41] shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#107c41]' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-100 text-[#107c41] border border-emerald-300/60'
                        : item.id === 'rh'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Switcher & User Info */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/70">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#107c41]" />
            Perfil em Uso:
          </span>
          <select
            value={userRole}
            onChange={(e) => onChangeRole(e.target.value as UserRole)}
            className="text-xs bg-white text-slate-700 border border-slate-200 rounded-md px-2 py-1 focus:ring-1 focus:ring-[#107c41] focus:border-[#107c41] outline-none cursor-pointer shadow-2xs font-medium"
          >
            <option value="admin">Administrador</option>
            <option value="recepcao">Recepção</option>
            <option value="rh">RH / Pessoal</option>
            <option value="financeiro">Financeiro</option>
            <option value="governanca">Camareira</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-200/50">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-xs text-[#107c41]">
            TL
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-slate-800 truncate">Hotel Tio Luiz</p>
            <p className="text-[10px] text-slate-500 font-medium capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
