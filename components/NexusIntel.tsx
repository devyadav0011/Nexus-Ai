'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, MapPin, Loader2, Globe, Database } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import Markdown from 'react-markdown';

export default function NexusIntel() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'maps'>('search');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setResult(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      let response;
      if (mode === 'search') {
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: query,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
      } else {
        // Get user location for maps grounding if possible
        let latLng = undefined;
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          latLng = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (e) {
          console.warn("Geolocation not available", e);
        }

        const config: any = {
          tools: [{ googleMaps: {} }],
        };
        if (latLng) {
          config.toolConfig = {
            retrievalConfig: { latLng }
          };
        }

        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: query,
          config,
        });
      }

      setResult(response.text || 'No data retrieved.');
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedSources = chunks.map((chunk: any) => {
          if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri, type: 'web' };
          if (chunk.maps) return { title: chunk.maps.title || 'Map Location', uri: chunk.maps.uri, type: 'map' };
          return null;
        }).filter(Boolean);
        setSources(extractedSources);
      }
    } catch (error) {
      console.error('Error in Nexus Intel:', error);
      setResult('Error accessing global intelligence network.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400 flex items-center space-x-3">
          <Database className="w-6 h-6" />
          <span>Nexus Intel</span>
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setMode('search')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${mode === 'search' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'text-cyan-700 hover:text-cyan-400'}`}
          >
            <Globe className="w-4 h-4" />
            <span>Global Search</span>
          </button>
          <button
            onClick={() => setMode('maps')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${mode === 'maps' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'text-cyan-700 hover:text-cyan-400'}`}
          >
            <MapPin className="w-4 h-4" />
            <span>Geospatial Data</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-6">
        {/* Search Bar */}
        <div className="p-4 bg-cyan-950/20 border border-cyan-900/50 rounded-2xl flex items-center space-x-4 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={mode === 'search' ? "Query global database..." : "Query geospatial coordinates..."}
              className="w-full bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-4 text-cyan-100 placeholder-cyan-700/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 font-mono text-sm transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!query.trim() || isSearching}
            className="p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
          <div className="lg:col-span-2 p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-y-auto">
            <h3 className="text-xs font-bold tracking-widest uppercase text-cyan-500 mb-4 border-b border-cyan-900/50 pb-2">Analysis Report</h3>
            {isSearching ? (
              <div className="h-full flex flex-col items-center justify-center text-cyan-500 space-y-4">
                <div className="relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-cyan-500/50 rounded-full w-12 h-12" />
                  <Loader2 className="w-12 h-12 opacity-20" />
                </div>
                <p className="text-sm uppercase tracking-widest animate-pulse font-mono">Retrieving Data...</p>
              </div>
            ) : result ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-invert prose-cyan max-w-none text-sm font-mono text-cyan-100 leading-relaxed"
              >
                <div className="markdown-body">
                  <Markdown>{result}</Markdown>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-cyan-700 space-y-4">
                <Database className="w-12 h-12 opacity-50" />
                <p className="text-sm uppercase tracking-widest text-center max-w-xs font-mono">Awaiting query input.</p>
              </div>
            )}
          </div>

          {/* Sources Panel */}
          <div className="p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-y-auto flex flex-col">
            <h3 className="text-xs font-bold tracking-widest uppercase text-cyan-500 mb-4 border-b border-cyan-900/50 pb-2">Data Sources</h3>
            {sources.length > 0 ? (
              <div className="space-y-4">
                {sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 rounded-xl bg-cyan-950/30 border border-cyan-900/50 hover:bg-cyan-900/50 hover:border-cyan-500/50 transition-all group"
                  >
                    <div className="flex items-start space-x-3">
                      {src.type === 'map' ? <MapPin className="w-4 h-4 text-emerald-400 mt-0.5" /> : <Globe className="w-4 h-4 text-cyan-400 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-cyan-300 font-bold truncate">{src.title}</p>
                        <p className="text-xs text-cyan-600 truncate mt-1">{src.uri}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-cyan-700 space-y-4">
                <Globe className="w-8 h-8 opacity-50" />
                <p className="text-xs uppercase tracking-widest text-center font-mono">No sources linked.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
