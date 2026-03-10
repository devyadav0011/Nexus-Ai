'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Play, Loader2, Volume2, FileAudio } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';

export default function NexusAudio() {
  const [activeTab, setActiveTab] = useState<'tts' | 'transcribe'>('tts');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleGenerateSpeech = async () => {
    if (!textInput.trim()) return;
    setIsProcessing(true);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: textInput }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        setAudioUrl(`data:audio/wav;base64,${base64Audio}`);
      }
    } catch (error) {
      console.error('Error generating speech:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleTranscribe(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleTranscribe = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setTranscription(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/webm',
                  data: base64Data,
                },
              },
              { text: 'Transcribe this audio accurately.' },
            ],
          },
        });

        setTranscription(response.text || 'No transcription available.');
      };
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setTranscription('Error processing audio data.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400 flex items-center space-x-3">
          <FileAudio className="w-6 h-6" />
          <span>Nexus Audio</span>
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('tts')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'tts' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'text-cyan-700 hover:text-cyan-400'}`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Speech Synthesis</span>
          </button>
          <button
            onClick={() => setActiveTab('transcribe')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'transcribe' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'text-cyan-700 hover:text-cyan-400'}`}
          >
            <Mic className="w-4 h-4" />
            <span>Transcription</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col space-y-6">
          {activeTab === 'tts' ? (
            <>
              <div className="space-y-2 flex-1">
                <label className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Text Input</label>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter text to synthesize..."
                  className="w-full h-full min-h-[200px] bg-cyan-950/20 border border-cyan-900/50 rounded-xl p-4 text-cyan-100 placeholder-cyan-700/50 focus:outline-none focus:border-cyan-500/50 font-mono text-sm resize-none"
                />
              </div>
              <button
                onClick={handleGenerateSpeech}
                disabled={isProcessing || !textInput.trim()}
                className="w-full py-4 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center space-x-2"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                <span>{isProcessing ? 'Synthesizing...' : 'Generate Speech'}</span>
              </button>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-8">
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold tracking-widest uppercase text-cyan-400">Audio Capture</h3>
                <p className="text-sm text-cyan-600 font-mono">Record audio for AI transcription</p>
              </div>
              
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isRecording 
                    ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.4)]' 
                    : 'bg-cyan-950/50 border-cyan-500/50 text-cyan-400 hover:bg-cyan-900/50 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isRecording && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full border border-red-500/50"
                  />
                )}
                {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
              </button>
              
              <p className="text-xs uppercase tracking-widest font-bold text-cyan-500">
                {isRecording ? 'Recording in progress...' : 'Click to start recording'}
              </p>
            </div>
          )}
        </div>

        {/* Output */}
        <div className="p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden relative">
          <h3 className="text-xs font-bold tracking-widest uppercase text-cyan-500 mb-4 border-b border-cyan-900/50 pb-2">Output Buffer</h3>
          
          <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto">
            {isProcessing ? (
              <div className="flex flex-col items-center space-y-4 text-cyan-500">
                <div className="relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-cyan-500/50 rounded-full w-16 h-16" />
                  <Loader2 className="w-16 h-16 opacity-20" />
                </div>
                <p className="text-sm uppercase tracking-widest animate-pulse font-mono">Processing Audio Data...</p>
              </div>
            ) : activeTab === 'tts' && audioUrl ? (
              <div className="w-full space-y-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  <Volume2 className="w-10 h-10" />
                </div>
                <audio src={audioUrl} controls className="w-full max-w-md" autoPlay />
              </div>
            ) : activeTab === 'transcribe' && transcription ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-full p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/50 text-cyan-100 font-mono text-sm leading-relaxed overflow-y-auto"
              >
                {transcription}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-cyan-700 space-y-4">
                <FileAudio className="w-12 h-12 opacity-50" />
                <p className="text-sm uppercase tracking-widest text-center max-w-xs font-mono">Awaiting audio processing task.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
