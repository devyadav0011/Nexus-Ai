'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { Image as ImageIcon, Video, Loader2, Play, Upload } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export default function NexusForge() {
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [imageSize, setImageSize] = useState('1K');
  const [sourceImage, setSourceImage] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setResultUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      let response;
      if (sourceImage) {
        // Edit image using Nano Banana 2
        const base64Data = sourceImage.split(',')[1];
        const mimeType = sourceImage.split(';')[0].split(':')[1];
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: {
            parts: [
              { inlineData: { data: base64Data, mimeType } },
              { text: prompt },
            ],
          },
        });
      } else {
        // Generate image using Nano Banana Pro
        response = await ai.models.generateContent({
          model: 'gemini-3-pro-image-preview',
          contents: { parts: [{ text: prompt }] },
          config: {
            imageConfig: {
              aspectRatio: aspectRatio as any,
              imageSize: imageSize as any,
            }
          }
        });
      }

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setResultUrl(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt && !sourceImage) return;
    setIsGenerating(true);
    setResultUrl(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      const config: any = {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio === '16:9' ? '16:9' : '9:16'
      };

      const params: any = {
        model: 'veo-3.1-fast-generate-preview',
        config
      };

      if (prompt) params.prompt = prompt;
      if (sourceImage) {
        const base64Data = sourceImage.split(',')[1];
        const mimeType = sourceImage.split(';')[0].split(':')[1];
        params.image = { imageBytes: base64Data, mimeType };
      }

      let operation = await ai.models.generateVideos(params);
      
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(downloadLink, {
          headers: { 'x-goog-api-key': process.env.NEXT_PUBLIC_GEMINI_API_KEY! }
        });
        const blob = await response.blob();
        setResultUrl(URL.createObjectURL(blob));
      }
    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4">
        <h2 className="text-2xl font-bold tracking-widest uppercase text-cyan-400 flex items-center space-x-3">
          <ImageIcon className="w-6 h-6" />
          <span>Nexus Forge</span>
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'image' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'text-cyan-700 hover:text-cyan-400'}`}
          >
            Image Gen
          </button>
          <button
            onClick={() => setActiveTab('video')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'video' ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300' : 'text-cyan-700 hover:text-cyan-400'}`}
          >
            Video Gen
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col space-y-6">
          <div className="space-y-2">
            <label className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to generate..."
              className="w-full h-32 bg-cyan-950/20 border border-cyan-900/50 rounded-xl p-4 text-cyan-100 placeholder-cyan-700/50 focus:outline-none focus:border-cyan-500/50 font-mono text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-xl p-3 text-cyan-300 focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
              >
                <option value="1:1">1:1 Square</option>
                <option value="16:9">16:9 Landscape</option>
                <option value="9:16">9:16 Portrait</option>
                <option value="4:3">4:3 Standard</option>
                <option value="3:4">3:4 Vertical</option>
              </select>
            </div>
            {activeTab === 'image' && (
              <div className="space-y-2">
                <label className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Resolution</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value)}
                  className="w-full bg-cyan-950/20 border border-cyan-900/50 rounded-xl p-3 text-cyan-300 focus:outline-none focus:border-cyan-500/50 font-mono text-sm"
                >
                  <option value="1K">1K Standard</option>
                  <option value="2K">2K High</option>
                  <option value="4K">4K Ultra</option>
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Source Image (Optional)</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full bg-cyan-950/20 border border-cyan-900/50 border-dashed rounded-xl p-4 flex items-center justify-center space-x-2 text-cyan-600 hover:text-cyan-400 hover:border-cyan-500/50 transition-all">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-mono">{sourceImage ? 'Image Loaded' : 'Upload Image'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={activeTab === 'image' ? handleGenerateImage : handleGenerateVideo}
            disabled={isGenerating || (!prompt && !sourceImage)}
            className="mt-auto w-full py-4 rounded-xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center justify-center space-x-2"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            <span>{isGenerating ? 'Generating...' : `Generate ${activeTab}`}</span>
          </button>
        </div>

        {/* Output */}
        <div className="p-6 rounded-2xl border border-cyan-900/50 bg-black/40 backdrop-blur-sm shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center overflow-hidden relative">
          {isGenerating ? (
            <div className="flex flex-col items-center space-y-4 text-cyan-500">
              <div className="relative">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-2 border-dashed border-cyan-500/50 rounded-full w-16 h-16" />
                <Loader2 className="w-16 h-16 opacity-20" />
              </div>
              <p className="text-sm uppercase tracking-widest animate-pulse font-mono">Synthesizing Media...</p>
            </div>
          ) : resultUrl ? (
            activeTab === 'image' ? (
              <img src={resultUrl} alt="Generated" className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.2)]" />
            ) : (
              <video src={resultUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-lg shadow-[0_0_30px_rgba(6,182,212,0.2)]" />
            )
          ) : (
            <div className="flex flex-col items-center text-cyan-700 space-y-4">
              {activeTab === 'image' ? <ImageIcon className="w-12 h-12 opacity-50" /> : <Video className="w-12 h-12 opacity-50" />}
              <p className="text-sm uppercase tracking-widest text-center max-w-xs font-mono">Output canvas ready.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
