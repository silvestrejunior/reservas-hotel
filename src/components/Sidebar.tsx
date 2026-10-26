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
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Header / Logo */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white font-bold">
              <Hotel className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                Hotel Tio Luiz
              </h1>
              <p className="text-xs text-blue-400 font-medium">PMS & ERP Inteligente</p>
            </div>
          </div>
        </div>

        {/* Realtime Status */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isRealtimeConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="text-slate-400 font-medium">Supabase Realtime</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
            32 UHs Online
          </span>
        </div>

        {/* Menu Items */}
        <nav className="p-3 space-y-1 mt-2">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-blue-700/60 text-blue-100 border border-blue-400/30'
                        : item.id === 'rh'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
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
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Perfil em Uso:
          </span>
          <select
            value={userRole}
            onChange={(e) => onChangeRole(e.target.value as UserRole)}
            className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
          >
            <option value="admin">Administrador</option>
            <option value="recepcao">Recepção</option>
            <option value="rh">RH / Pessoal</option>
            <option value="financeiro">Financeiro</option>
            <option value="governanca">Camareira</option>
          </select>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
            TL
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">Hotel Tio Luiz</p>
            <p className="text-[11px] text-slate-400 capitalize">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
