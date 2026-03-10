'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Editor from '@monaco-editor/react';
import { Code, Play, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function CodeAssistant() {
  const [code, setCode] = useState<string>('// Enter your code here...\nfunction calculateTotal(items) {\n  let total = 0;\n  for (let i = 0; i <= items.length; i++) {\n    total += items[i].price;\n  }\n  return total;\n}');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following code for errors, bugs, or improvements. Provide a concise summary of the issues and suggest a corrected version.\n\nCode:\n${code}`,
      });
      setAnalysisResult(response.text || 'No issues found.');
    } catch (error) {
      console.error('Error analyzing code:', error);
      setAnalysisResult('Error analyzing code. Please check your API key and connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400 flex items-center space-x-3">
          <Code className="w-6 h-6" />
          <span>Code Analysis Module</span>
        </h2>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center space-x-2 px-6 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isAnalyzing ? 'Analyzing...' : 'Run Analysis'}</span>
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        {/* Editor Pane */}
        <div className="flex flex-col rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="bg-cyan-950/30 px-4 py-2 border-b border-cyan-900/50 flex items-center justify-between">
            <span className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Input Source</span>
            <span className="text-xs text-cyan-700 uppercase tracking-widest">JavaScript</span>
          </div>
          <div className="flex-1 p-2">
            <Editor
              height="100%"
              defaultLanguage="javascript"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: 'var(--font-mono)',
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
              }}
            />
          </div>
        </div>

        {/* Analysis Pane */}
        <div className="flex flex-col rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <div className="bg-cyan-950/30 px-4 py-2 border-b border-cyan-900/50 flex items-center justify-between">
            <span className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Analysis Output</span>
            {isAnalyzing && <span className="text-xs text-cyan-400 uppercase tracking-widest animate-pulse">Processing</span>}
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {!analysisResult && !isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-cyan-700 space-y-4">
                <CheckCircle2 className="w-12 h-12 opacity-50" />
                <p className="text-sm uppercase tracking-widest text-center max-w-xs">System ready. Awaiting code input for analysis.</p>
              </div>
            ) : isAnalyzing ? (
              <div className="h-full flex flex-col items-center justify-center text-cyan-500 space-y-6">
                <div className="relative">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-cyan-500/50 rounded-full w-16 h-16" />
                  <Loader2 className="w-16 h-16 opacity-20" />
                </div>
                <p className="text-sm uppercase tracking-widest animate-pulse">Scanning syntax tree...</p>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="prose prose-invert prose-cyan max-w-none text-sm font-mono"
              >
                <div className="whitespace-pre-wrap text-cyan-100 leading-relaxed">
                  {analysisResult}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
