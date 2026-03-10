'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Power, Volume2, Wifi, Bluetooth, Monitor, HardDrive, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function SystemControl({ accessLevel, setAccessLevel }: { accessLevel: 'limited' | 'full', setAccessLevel: (level: 'limited' | 'full') => void }) {
  const [power, setPower] = useState(true);
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [volume, setVolume] = useState(75);

  return (
    <div className="h-full flex flex-col space-y-8 p-8">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400">System Control</h2>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-cyan-600 uppercase tracking-widest">Access Level:</span>
          <button
            onClick={() => setAccessLevel(accessLevel === 'limited' ? 'full' : 'limited')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-300 ${
              accessLevel === 'full' 
                ? 'bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30' 
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30'
            }`}
          >
            {accessLevel === 'full' ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            <span className="text-sm font-bold uppercase tracking-wider">{accessLevel}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ControlCard 
          icon={<Power />} 
          title="Main Power" 
          active={power} 
          onClick={() => setPower(!power)} 
          disabled={accessLevel === 'limited'}
        />
        <ControlCard 
          icon={<Wifi />} 
          title="Network" 
          active={wifi} 
          onClick={() => setWifi(!wifi)} 
          disabled={accessLevel === 'limited'}
        />
        <ControlCard 
          icon={<Bluetooth />} 
          title="Bluetooth" 
          active={bluetooth} 
          onClick={() => setBluetooth(!bluetooth)} 
          disabled={accessLevel === 'limited'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm space-y-6">
          <div className="flex items-center space-x-3 text-cyan-400">
            <Volume2 className="w-5 h-5" />
            <h3 className="font-bold tracking-widest uppercase">Audio Output</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-cyan-600 uppercase tracking-widest">
              <span>0%</span>
              <span>{volume}%</span>
              <span>100%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={volume}
              onChange={(e) => setVolume(parseInt(e.target.value))}
              disabled={accessLevel === 'limited'}
              className="w-full h-2 bg-cyan-950 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm space-y-4">
          <div className="flex items-center space-x-3 text-cyan-400">
            <HardDrive className="w-5 h-5" />
            <h3 className="font-bold tracking-widest uppercase">Storage Array</h3>
          </div>
          <div className="space-y-4">
            <StorageBar label="OS (C:)" used={45} total={500} />
            <StorageBar label="DATA (D:)" used={820} total={2000} />
          </div>
        </div>
      </div>

      {accessLevel === 'limited' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-auto p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-400 flex items-center space-x-3"
        >
          <ShieldAlert className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">System controls are locked in Limited Access mode. Toggle Full Access to modify hardware states.</p>
        </motion.div>
      )}
    </div>
  );
}

function ControlCard({ icon, title, active, onClick, disabled }: { icon: React.ReactNode, title: string, active: boolean, onClick: () => void, disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative p-6 rounded-2xl border transition-all duration-300 flex flex-col items-center justify-center space-y-4 group overflow-hidden ${
        disabled ? 'opacity-50 cursor-not-allowed border-cyan-900/30 bg-black/20 text-cyan-700' :
        active ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'border-cyan-900/50 bg-black/40 text-cyan-600 hover:bg-cyan-900/20 hover:text-cyan-400'
      }`}
    >
      <div className={`p-4 rounded-full ${active ? 'bg-cyan-500/20' : 'bg-black/50'}`}>
        {icon}
      </div>
      <span className="font-bold tracking-widest uppercase text-sm">{title}</span>
      <span className={`text-xs uppercase tracking-widest ${active ? 'text-cyan-400' : 'text-cyan-700'}`}>
        {active ? 'Online' : 'Offline'}
      </span>
    </button>
  );
}

function StorageBar({ label, used, total }: { label: string, used: number, total: number }) {
  const percentage = (used / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-cyan-500 uppercase tracking-widest">
        <span>{label}</span>
        <span>{used}GB / {total}GB</span>
      </div>
      <div className="h-2 w-full bg-cyan-950 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full ${percentage > 80 ? 'bg-red-500' : 'bg-cyan-500'}`}
        />
      </div>
    </div>
  );
}
