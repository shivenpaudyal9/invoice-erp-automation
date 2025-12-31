import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Upload, History, LogOut, User, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: FileText, label: 'Invoices' },
    { path: '/upload', icon: Upload, label: 'Upload' },
    { path: '/audit', icon: History, label: 'Audit Log' },
  ];

  return (
    <div className="min-h-screen relative z-10">
      {/* Cyber Header */}
      <header className="glass-card rounded-none border-t-0 border-x-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <Cpu className="h-8 w-8 text-cyber-cyan cyber-glow" />
                  <div className="absolute inset-0 bg-cyber-cyan opacity-50 blur-md group-hover:opacity-75 transition-opacity" />
                </div>
                <span className="text-xl font-orbitron font-bold text-white tracking-wider">
                  INVOICE<span className="text-cyber-cyan">AI</span>
                </span>
              </Link>

              <nav className="flex space-x-2">
                {navItems.map(({ path, icon: Icon, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-rajdhani font-semibold tracking-wide transition-all duration-300 ${
                      location.pathname === path
                        ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
                        : 'text-gray-300 hover:bg-white/5 hover:text-cyber-cyan border border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-300 font-rajdhani">
                <div className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
                <User className="h-4 w-4 text-cyber-cyan" />
                <span>{user?.username || user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-300 hover:text-cyber-pink hover:bg-cyber-pink/10 rounded-lg transition-all duration-300 font-rajdhani border border-transparent hover:border-cyber-pink/50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="glass-card rounded-none border-b-0 border-x-0 mt-auto py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-xs text-gray-500 font-rajdhani">
            <span>Powered by AI Document Intelligence</span>
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-pulse" />
              <span>System Online</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
