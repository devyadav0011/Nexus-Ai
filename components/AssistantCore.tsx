'use client';

import { motion } from 'motion/react';

export default function AssistantCore() {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12">
      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border border-cyan-500/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border-2 border-dashed border-cyan-400/40 rounded-full"
        />
        
        {/* Inner Core */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="w-32 h-32 bg-cyan-500/20 rounded-full blur-xl absolute"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-24 h-24 bg-cyan-400/40 rounded-full blur-md absolute"
        />
        <div className="w-16 h-16 bg-cyan-300 rounded-full shadow-[0_0_50px_rgba(103,232,249,0.8)] z-10" />
      </div>

      <div className="text-center space-y-4 max-w-lg">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400">Nexus Core Online</h2>
        <p className="text-cyan-600/80 text-sm leading-relaxed">
          All systems nominal. Neural pathways active. Awaiting voice, visual, or manual input.
        </p>
        
        <div className="grid grid-cols-3 gap-4 pt-8">
          <StatusCard label="CPU" value="12%" />
          <StatusCard label="MEM" value="4.2GB" />
          <StatusCard label="NET" value="1.2ms" />
        </div>
      </div>
    </div>
  );
}

function StatusCard({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-4 border border-cyan-900/50 rounded-xl bg-black/40 backdrop-blur-sm flex flex-col items-center">
      <span className="text-cyan-700 text-xs tracking-widest uppercase mb-1">{label}</span>
      <span className="text-cyan-300 font-bold">{value}</span>
    </div>
  );
}
