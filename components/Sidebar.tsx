import React from 'react';

interface SidebarProps {
    activeModule: string;
    setActiveModule: (m: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeModule, setActiveModule }) => {
    const modules = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'inventory', label: 'Inventory & Stock', icon: '📦' },
        { id: 'financials', label: 'Financials', icon: '💰' },
    ];

    return (
        <aside className="w-20 lg:w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed h-full z-10 transition-all duration-300">
            <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
                    N
                </div>
                <span className="hidden lg:block ml-3 font-bold text-white tracking-wide">NexRetail</span>
            </div>

            <nav className="flex-1 py-6 space-y-2 px-2 lg:px-4">
                {modules.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => setActiveModule(m.id)}
                        className={`w-full flex items-center justify-center lg:justify-start px-2 lg:px-4 py-3 rounded-lg transition-all duration-200 group ${
                            activeModule === m.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <span className="text-xl group-hover:scale-110 transition-transform">{m.icon}</span>
                        <span className="hidden lg:block ml-3 font-medium">{m.label}</span>
                    </button>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                    <img src="https://picsum.photos/40/40" alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                    <div className="hidden lg:block">
                        <p className="text-sm font-medium text-white">Prof. Admin</p>
                        <p className="text-xs text-slate-500">CTO & Lead Accountant</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;