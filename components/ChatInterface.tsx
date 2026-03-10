'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Send, Loader2, Volume2, User, Cpu, Zap, Brain, Save } from 'lucide-react';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'fast' | 'deep'>('fast');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleSendRef = useRef<((text: string) => Promise<void>) | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        if (handleSendRef.current) {
          handleSendRef.current(transcript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = useCallback(async (textToSend: string = input) => {
    if (!textToSend.trim()) return;

    const newMessages = [...messages, { role: 'user', content: textToSend } as Message];
    setMessages(newMessages);
    setInput('');
    setIsProcessing(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const modelName = mode === 'fast' ? 'gemini-3.1-flash-lite-preview' : 'gemini-3.1-pro-preview';
      const config: any = {
        systemInstruction: 'You are Nexus, an advanced AI voice assistant. You are helpful, concise, and speak in a slightly futuristic, professional tone.',
      };

      if (mode === 'deep') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      }

      const chat = ai.chats.create({
        model: modelName,
        config,
      });

      for (let i = 0; i < newMessages.length - 1; i++) {
        await chat.sendMessage({ message: newMessages[i].content });
      }

      const response = await chat.sendMessage({ message: textToSend });
      const reply = response.text || 'I am unable to process that request at this time.';
      
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      speak(reply);
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages([...newMessages, { role: 'assistant', content: 'Connection to core servers lost. Please check your API key.' }]);
    } finally {
      setIsProcessing(false);
    }
  }, [input, messages, mode]);

  useEffect(() => {
    handleSendRef.current = handleSend;
  }, [handleSend]);

  const saveChat = async () => {
    if (!user || messages.length === 0) return;
    setIsSaving(true);
    try {
      const title = messages[0].content.substring(0, 30) + (messages[0].content.length > 30 ? '...' : '');
      await addDoc(collection(db, 'chats'), {
        userId: user.uid,
        title,
        messages: JSON.stringify(messages),
        createdAt: serverTimestamp(),
      });
      alert('Chat saved successfully to Nexus Core.');
    } catch (error) {
      console.error('Error saving chat:', error);
      alert('Failed to save chat.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400 flex items-center space-x-3">
          <Volume2 className="w-6 h-6" />
          <span>Nexus Chat</span>
        </h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={saveChat}
            disabled={messages.length === 0 || isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 bg-cyan-950/30 border border-cyan-900/50 text-cyan-500 hover:text-cyan-300 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Save Chat History"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => setMode('fast')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${mode === 'fast' ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400' : 'text-cyan-700 hover:text-cyan-400'}`}
              title="Low latency, fast responses"
            >
              <Zap className="w-3 h-3" />
              <span className="hidden sm:inline">Fast Mode</span>
            </button>
            <button
              onClick={() => setMode('deep')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${mode === 'deep' ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400' : 'text-cyan-700 hover:text-cyan-400'}`}
              title="Complex reasoning, high thinking level"
            >
              <Brain className="w-3 h-3" />
              <span className="hidden sm:inline">Deep Think</span>
            </button>
          </div>
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan-950/30 border border-cyan-900/50 text-xs text-cyan-500 uppercase tracking-widest">
            <div className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-cyan-400 animate-pulse' : 'bg-cyan-700'}`} />
            <span>{isProcessing ? 'Processing' : 'Idle'}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        {/* Chat History */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-cyan-700 space-y-4">
              <Mic className="w-12 h-12 opacity-50" />
              <p className="text-sm uppercase tracking-widest text-center max-w-xs">Voice channel open. Awaiting user input.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-start space-x-4 ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                  msg.role === 'user' 
                    ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400' 
                    : 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                }`}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
                </div>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-mono leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-950/30 border border-cyan-900/50 text-cyan-100 rounded-tr-none'
                    : 'bg-black/50 border border-cyan-500/30 text-cyan-300 rounded-tl-none shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                }`}>
                  {msg.content}
                </div>
              </motion.div>
            ))
          )}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start space-x-4"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="max-w-[80%] p-4 rounded-2xl text-sm font-mono leading-relaxed bg-black/50 border border-cyan-500/30 text-cyan-300 rounded-tl-none shadow-[0_0_15px_rgba(6,182,212,0.1)] flex items-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="uppercase tracking-widest text-xs">Synthesizing response...</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-cyan-950/20 border-t border-cyan-900/50 flex items-center space-x-4">
          <button
            onClick={toggleListening}
            className={`p-4 rounded-full border transition-all duration-300 flex-shrink-0 ${
              isListening 
                ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse' 
                : 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400 hover:bg-cyan-800/50'
            }`}
          >
            {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a command or speak..."
              className="w-full bg-black/50 border border-cyan-900/50 rounded-xl px-4 py-4 text-cyan-100 placeholder-cyan-700/50 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 font-mono text-sm transition-all"
            />
          </div>

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="p-4 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
