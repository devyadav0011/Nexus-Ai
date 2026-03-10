'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from '@/lib/firebase';
import { Fingerprint, ScanFace, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    await loginWithGoogle();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black text-cyan-400">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-cyan-400 font-mono">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center space-y-8 p-12 border border-cyan-500/30 rounded-3xl bg-cyan-950/10 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.15)]"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 border-dashed border-cyan-500/50 rounded-full"
            />
            <div className="p-8 bg-black rounded-full border border-cyan-500/30">
              <ScanFace className="w-16 h-16 text-cyan-400" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-widest uppercase">Nexus Core</h1>
            <p className="text-cyan-500/70 text-sm tracking-widest uppercase">Awaiting Authentication...</p>
          </div>

          <button
            onClick={login}
            className="group relative px-8 py-3 overflow-hidden rounded-full bg-cyan-950/50 border border-cyan-500/50 hover:bg-cyan-900/50 transition-all duration-300"
          >
            <div className="absolute inset-0 w-0 bg-cyan-500/20 transition-all duration-[250ms] ease-out group-hover:w-full" />
            <span className="relative flex items-center space-x-2 text-cyan-300 font-semibold tracking-wider uppercase text-sm">
              <Fingerprint className="w-4 h-4" />
              <span>Authenticate with Google</span>
            </span>
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
