'use client';

import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { motion } from 'motion/react';
import { Camera, Eye, Activity, AlertTriangle, CheckCircle2, Loader2, Music, Image as ImageIcon, Video, Upload } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function VisionModule() {
  const [activeTab, setActiveTab] = useState<'webcam' | 'video'>('webcam');
  const webcamRef = useRef<Webcam>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{ emotion?: string, gesture?: string, action?: string, summary?: string } | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    return imageSrc;
  }, [webcamRef]);

  const handleAnalyzeWebcam = async () => {
    const imageSrc = capture();
    if (!imageSrc) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const base64Data = imageSrc.split(',')[1];
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Data,
              },
            },
            {
              text: 'Analyze the person in this image. Return a JSON object with three keys: "emotion" (e.g., happy, sad, angry, neutral, focused), "gesture" (e.g., none, thumbs up, peace sign, pointing, open palm), and "action" (a short sentence describing what the system should do based on the emotion, e.g., "Playing calm music to soothe anger" or "Showing favorite pictures to cheer up"). Do not include markdown formatting, just the raw JSON.',
            },
          ],
        },
      });

      const text = response.text || '{}';
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const result = JSON.parse(cleanedText);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing vision:', error);
      setAnalysisResult({ emotion: 'Error', gesture: 'Error', action: 'Failed to analyze visual input.' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!videoFile) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(videoFile);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        const mimeType = videoFile.type;

        const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-pro-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
              {
                text: 'Analyze this video. Provide a detailed summary of the events, key objects, and any notable actions or emotions observed.',
              },
            ],
          },
        });

        setAnalysisResult({ summary: response.text || 'No summary available.' });
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error('Error analyzing video:', error);
      setAnalysisResult({ summary: 'Error processing video data.' });
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400 flex items-center space-x-3">
          <Eye className="w-6 h-6" />
          <span>Nexus Vision</span>
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('webcam')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'webcam' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'text-cyan-700 hover:text-cyan-400'}`}
          >
            <Camera className="w-4 h-4" />
            <span>Live Analysis</span>
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'video' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'text-cyan-700 hover:text-cyan-400'}`}
          >
            <Video className="w-4 h-4" />
            <span>Video Intel</span>
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Feed */}
        <div className="relative rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm overflow-hidden flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {activeTab === 'webcam' ? (
            <>
              <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/50 border border-cyan-900/50 text-xs text-cyan-500 uppercase tracking-widest">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span>Live Feed</span>
              </div>
              
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                className="w-full h-full object-cover opacity-80"
              />

              {isAnalyzing && (
                <motion.div 
                  initial={{ top: 0 }}
                  animate={{ top: '100%' }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_20px_rgba(103,232,249,1)] z-20"
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
              <div className="relative w-full max-w-md">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-full bg-cyan-950/20 border border-cyan-900/50 border-dashed rounded-xl p-12 flex flex-col items-center justify-center space-y-4 text-cyan-600 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm font-mono uppercase tracking-widest">{videoFile ? videoFile.name : 'Upload Video File'}</span>
                </div>
              </div>
              {videoFile && (
                <video src={URL.createObjectURL(videoFile)} controls className="w-full max-w-md rounded-lg border border-cyan-900/50" />
              )}
            </div>
          )}
        </div>

        {/* Analysis Results */}
        <div className="flex flex-col space-y-6">
          <div className="p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b border-cyan-900/50 pb-2">
              <h3 className="text-sm font-bold tracking-widest uppercase text-cyan-500">Telemetry & Analysis</h3>
              <button
                onClick={activeTab === 'webcam' ? handleAnalyzeWebcam : handleAnalyzeVideo}
                disabled={isAnalyzing || (activeTab === 'video' && !videoFile)}
                className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs font-bold"
              >
                {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
                <span>{isAnalyzing ? 'Scanning...' : 'Analyze'}</span>
              </button>
            </div>
            
            {analysisResult ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 flex-1 overflow-y-auto"
              >
                {activeTab === 'webcam' && analysisResult.emotion ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-900/50 flex flex-col items-center justify-center space-y-2">
                        <span className="text-xs text-cyan-600 uppercase tracking-widest">Detected Emotion</span>
                        <span className="text-xl font-bold text-cyan-300 uppercase tracking-wider">{analysisResult.emotion}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-900/50 flex flex-col items-center justify-center space-y-2">
                        <span className="text-xs text-cyan-600 uppercase tracking-widest">Hand Gesture</span>
                        <span className="text-xl font-bold text-cyan-300 uppercase tracking-wider">{analysisResult.gesture}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-start space-x-4">
                      <Activity className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                      <div>
                        <span className="text-xs text-cyan-500 uppercase tracking-widest block mb-1">System Action</span>
                        <p className="text-sm text-cyan-100 leading-relaxed font-mono">{analysisResult.action}</p>
                      </div>
                    </div>

                    {(analysisResult.emotion.toLowerCase().includes('sad') || analysisResult.emotion.toLowerCase().includes('angry')) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-auto p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center space-x-4"
                      >
                        <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                          {analysisResult.emotion.toLowerCase().includes('sad') ? <ImageIcon className="w-6 h-6" /> : <Music className="w-6 h-6" />}
                        </div>
                        <div>
                          <span className="text-xs text-emerald-500 uppercase tracking-widest block mb-1">Executing Countermeasure</span>
                          <p className="text-sm text-emerald-300 font-bold">
                            {analysisResult.emotion.toLowerCase().includes('sad') ? 'Displaying favorite memories...' : 'Playing calming frequencies...'}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-900/50 text-cyan-100 font-mono text-sm leading-relaxed">
                    {analysisResult.summary}
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-cyan-700 space-y-4">
                <Activity className="w-12 h-12 opacity-50" />
                <p className="text-sm uppercase tracking-widest text-center max-w-xs">Awaiting visual input for biometric analysis.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
