'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Activity, Loader2, Radio } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';

export default function NexusLive() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const connectLive = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Nexus, an advanced AI voice assistant. Speak concisely and professionally.",
        },
        callbacks: {
          onopen: async () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              mediaStreamRef.current = stream;
              
              const source = audioContextRef.current!.createMediaStreamSource(stream);
              const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
              
              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }
                
                const buffer = new ArrayBuffer(pcm16.length * 2);
                const view = new DataView(buffer);
                for (let i = 0; i < pcm16.length; i++) {
                  view.setInt16(i * 2, pcm16[i], true);
                }
                
                const base64Data = btoa(String.fromCharCode(...new Uint8Array(buffer)));
                
                sessionPromise.then((session) => {
                  session.sendRealtimeInput({
                    media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                  });
                });
              };
              
              source.connect(processor);
              processor.connect(audioContextRef.current!.destination);
            } catch (err) {
              console.error("Microphone access denied", err);
              setError("Microphone access denied.");
              disconnectLive();
            }
          },
          onmessage: async (message: any) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const binaryString = atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768.0;
              }
              
              const audioBuffer = audioContextRef.current!.createBuffer(1, float32.length, 24000);
              audioBuffer.getChannelData(0).set(float32);
              
              const source = audioContextRef.current!.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContextRef.current!.destination);
              source.start();
            }
          },
          onerror: (err) => {
            console.error("Live API Error", err);
            setError("Connection error occurred.");
            disconnectLive();
          },
          onclose: () => {
            disconnectLive();
          }
        }
      });
      
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to connect", err);
      setError("Failed to establish connection.");
      setIsConnecting(false);
    }
  };

  const disconnectLive = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => {
      disconnectLive();
    };
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400 flex items-center space-x-3">
          <Radio className="w-6 h-6" />
          <span>Nexus Live Comms</span>
        </h2>
        <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-900/50 text-xs text-cyan-500 uppercase tracking-widest">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : isConnecting ? 'bg-yellow-400 animate-pulse' : 'bg-red-500'}`} />
          <span>{isConnected ? 'Connected' : isConnecting ? 'Connecting' : 'Offline'}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
          {/* Outer Ring */}
          <motion.div
            animate={{ rotate: isConnected ? 360 : 0 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className={`absolute inset-0 border-2 border-dashed rounded-full ${isConnected ? 'border-emerald-500/50' : 'border-cyan-900/50'}`}
          />
          
          {/* Inner Core */}
          <motion.div
            animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className={`w-32 h-32 rounded-full blur-xl absolute ${isConnected ? 'bg-emerald-500/20' : 'bg-cyan-900/20'}`}
          />
          
          <button
            onClick={isConnected ? disconnectLive : connectLive}
            disabled={isConnecting}
            className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
              isConnected 
                ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 hover:bg-emerald-900/50' 
                : 'bg-cyan-950/50 border-cyan-500 text-cyan-400 hover:bg-cyan-900/50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isConnecting ? <Loader2 className="w-8 h-8 animate-spin" /> : isConnected ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
        </div>

        <div className="text-center space-y-4 max-w-md">
          <h3 className="text-xl font-bold tracking-widest uppercase text-cyan-300">
            {isConnected ? 'Real-time Audio Link Active' : 'Establish Audio Link'}
          </h3>
          <p className="text-sm text-cyan-600 font-mono leading-relaxed">
            {isConnected 
              ? 'Speak naturally. Nexus is listening and will respond in real-time with ultra-low latency.' 
              : 'Connect to the Nexus Live API for continuous, conversational voice interaction.'}
          </p>
          {error && (
            <p className="text-xs text-red-400 font-mono mt-4 p-2 bg-red-950/30 border border-red-500/30 rounded-lg">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
