'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Code, Cpu, Eye, MessageSquare, Settings, ShieldAlert, ShieldCheck, Image as ImageIcon, Globe, FileAudio, Radio, LogOut } from 'lucide-react';
import AssistantCore from './AssistantCore';
import VisionModule from './VisionModule';
import CodeAssistant from './CodeAssistant';
import SystemControl from './SystemControl';
import ChatInterface from './ChatInterface';
import NexusForge from './NexusForge';
import NexusIntel from './NexusIntel';
import NexusAudio from './NexusAudio';
import NexusLive from './NexusLive';
import { useAuth } from '@/components/AuthProvider';

import { ErrorBoundary } from './ErrorBoundary';

type Module = 'core' | 'chat' | 'live' | 'vision' | 'forge' | 'intel' | 'audio' | 'code' | 'system';

export default function Dashboard() {
  const [activeModule, setActiveModule] = useState<Module>('core');
  const [accessLevel, setAccessLevel] = useState<'limited' | 'full'>('limited');
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] text-cyan-50 font-mono flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-cyan-900/50 bg-black/50 backdrop-blur-md z-10">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest uppercase text-cyan-400">Nexus OS v3.0</h1>
            <p className="text-xs text-cyan-600 tracking-widest uppercase">Admin: {user?.displayName || user?.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${accessLevel === 'full' ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'} text-xs tracking-wider uppercase`}>
            {accessLevel === 'full' ? <ShieldAlert className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            <span>{accessLevel === 'full' ? 'Full Access' : 'Limited Access'}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-cyan-600">
            <Activity className="w-3 h-3 animate-pulse" />
            <span>Sys: Online</span>
          </div>
          <button onClick={logout} className="p-2 rounded-full hover:bg-red-500/20 text-red-400 transition-all" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-16 flex flex-col items-center py-6 space-y-4 border-r border-cyan-900/50 bg-black/30 backdrop-blur-md z-10 overflow-y-auto">
          <NavButton icon={<Activity />} active={activeModule === 'core'} onClick={() => setActiveModule('core')} tooltip="Core Status" />
          <NavButton icon={<MessageSquare />} active={activeModule === 'chat'} onClick={() => setActiveModule('chat')} tooltip="Nexus Chat" />
          <NavButton icon={<Radio />} active={activeModule === 'live'} onClick={() => setActiveModule('live')} tooltip="Nexus Live" />
          <NavButton icon={<Eye />} active={activeModule === 'vision'} onClick={() => setActiveModule('vision')} tooltip="Nexus Vision" />
          <NavButton icon={<ImageIcon />} active={activeModule === 'forge'} onClick={() => setActiveModule('forge')} tooltip="Nexus Forge" />
          <NavButton icon={<Globe />} active={activeModule === 'intel'} onClick={() => setActiveModule('intel')} tooltip="Nexus Intel" />
          <NavButton icon={<FileAudio />} active={activeModule === 'audio'} onClick={() => setActiveModule('audio')} tooltip="Nexus Audio" />
          <NavButton icon={<Code />} active={activeModule === 'code'} onClick={() => setActiveModule('code')} tooltip="Code Assistant" />
          <NavButton icon={<Settings />} active={activeModule === 'system'} onClick={() => setActiveModule('system')} tooltip="System Control" />
        </nav>

        {/* Module Content */}
        <main className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-black to-black">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#083344_1px,transparent_1px),linear-gradient(to_bottom,#083344_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
          
          <div className="relative h-full p-6 overflow-y-auto">
            <ErrorBoundary>
              {activeModule === 'core' && <AssistantCore />}
              {activeModule === 'chat' && <ChatInterface />}
              {activeModule === 'live' && <NexusLive />}
              {activeModule === 'vision' && <VisionModule />}
              {activeModule === 'forge' && <NexusForge />}
              {activeModule === 'intel' && <NexusIntel />}
              {activeModule === 'audio' && <NexusAudio />}
              {activeModule === 'code' && <CodeAssistant />}
              {activeModule === 'system' && <SystemControl accessLevel={accessLevel} setAccessLevel={setAccessLevel} />}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavButton({ icon, active, onClick, tooltip }: { icon: React.ReactNode, active: boolean, onClick: () => void, tooltip: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-3 rounded-xl transition-all duration-300 group ${active ? 'bg-cyan-500/20 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'text-cyan-700 hover:text-cyan-400 hover:bg-cyan-900/30'}`}
      title={tooltip}
    >
      {icon}
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute inset-0 border border-cyan-400 rounded-xl"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}
