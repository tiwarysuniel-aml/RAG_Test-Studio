import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Settings, Activity, History, FileText } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';

const Layout = () => {
  const { document } = useDocument();
  const location = useLocation();

  const navItems = [
    { to: "/dashboard", icon: <Activity size={18} />, label: "Dashboard" },
    { to: "/document", icon: <FileText size={18} />, label: "Document" },
    { to: "/history", icon: <History size={18} />, label: "History" },
    { to: "/settings", icon: <Settings size={18} />, label: "Settings" }
  ];

  const currentRouteName = navItems.find(item => location.pathname.startsWith(item.to))?.label || 'Overview';

  return (
    <div className="flex h-screen bg-[#050811] text-slate-200 font-sans">
      <aside className="w-64 bg-[#080d19] border-r border-[#151d30] flex flex-col shrink-0 shadow-xl z-20">
        <div className="h-16 flex items-center px-5 border-b border-transparent">
          <h1 className="text-lg font-bold text-blue-500">
            RAG Studio
          </h1>
        </div>

        <div className="px-5 mb-6 mt-6">
          <div className="text-[11px] font-bold text-slate-500 tracking-wider mb-2 uppercase">Active Document</div>
          <div className="bg-[#101726] border border-[#1a233a] rounded-lg p-3 text-sm text-slate-300 truncate shadow-sm">
            {document ? document.name : "No document loaded"}
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({isActive}) => 
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive ? 'bg-[#0e8bf0] text-white font-medium shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-[#101726]'
                }`
              }
            >
              {item.icon}
              <span className="text-sm tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      
      <main className="flex-1 flex flex-col overflow-hidden bg-[#050811]">
        <header className="h-16 border-b border-[#151d30] flex items-center px-8 bg-[#050811] shrink-0">
          <h2 className="text-lg font-semibold text-white">{currentRouteName}</h2>
        </header>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
