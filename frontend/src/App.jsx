import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Shield, Container, Search, Database, Layers, Radio } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import ContainerDetails from './pages/ContainerDetails';
import SearchBar from './components/SearchBar';
import * as api from './services/api';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export default function App() {
  const [activeContainerId, setActiveContainerId] = useState('CNT-1001');
  const [view, setView] = useState('details'); // 'dashboard' or 'details'
  const [containersList, setContainersList] = useState([]);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  const fetchContainerIndex = async () => {
    try {
      const res = await api.getContainers();
      setContainersList(res.data || []);
    } catch (e) {
      console.error('Error loading container index:', e);
    }
  };

  useEffect(() => {
    fetchContainerIndex();

    // Socket.IO real-time connection
    const newSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.IO Connected to backend server:', newSocket.id);
      setSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket.IO Disconnected');
      setSocketConnected(false);
    });

    newSocket.on('eventAppended', () => {
      fetchContainerIndex();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleSelectContainer = (id) => {
    setActiveContainerId(id);
    setView('details');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div
            onClick={() => setView('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="p-2 bg-blue-600/10 border border-blue-500/30 rounded-xl text-blue-400 group-hover:border-blue-500 transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight font-mono text-white flex items-center gap-2">
                AuditTrail <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 font-semibold uppercase">CQRS + ES</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Event-Sourced Inventory & Logistics Ledger
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setView('dashboard')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  view === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Dashboard Index
              </button>
              <button
                onClick={() => setView('details')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  view === 'details'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Audit Stream
              </button>
            </nav>

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden md:inline">{socketConnected ? 'Live Socket.IO' : 'Connecting'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <SearchBar
          onSearch={handleSelectContainer}
          containers={containersList}
          currentSelectedId={activeContainerId}
        />

        {view === 'dashboard' ? (
          <Dashboard onSelectContainer={handleSelectContainer} />
        ) : (
          <ContainerDetails
            containerId={activeContainerId}
            onBack={() => setView('dashboard')}
            socket={socket}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AuditTrail Enterprise Audit Platform • Event Sourcing & CQRS Engine</span>
          <span>SHA-256 Hash Chained Immutable Ledger</span>
        </div>
      </footer>
    </div>
  );
}
