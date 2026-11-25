import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, Image as ImageIcon, Sparkles, FileImage, Clipboard } from 'lucide-react';
import { SAMPLE_PRESETS, generateSampleImage } from '../utils/sampleImages';

interface ImageUploaderProps {
  onImageSelected: (dataUrl: string, file?: File) => void;
  isLoading?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelected,
  isLoading = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Global clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイル (PNG, JPG, WebP 等) を選択してください。');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        onImageSelected(event.target.result, file);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handlePresetSelect = async (presetId: string) => {
    setLoadingPreset(presetId);
    try {
      const dataUrl = await generateSampleImage(presetId);
      if (dataUrl) {
        onImageSelected(dataUrl);
      }
    } finally {
      setLoadingPreset(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Upload Zone */}
      <div
        id="image-drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 group overflow-hidden ${
          isDragOver
            ? 'border-sky-400 bg-sky-500/10 scale-[1.01] shadow-xl shadow-sky-500/20'
            : 'border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-900/90 shadow-lg'
        }`}
      >
        <input
          ref={fileInputRef}
          id="file-upload-input"
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif, image/avif, image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processFile(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:scale-110 group-hover:text-sky-300 transition-all duration-200 shadow-inner">
            <UploadCloud className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              写真をここにドロップ、またはクリックして選択
            </h2>
            <p className="text-sm text-slate-400">
              16:9（横長）や 9:16（縦長）など、あらゆるアスペクト比の写真に対応
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs text-slate-400">
            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/80 flex items-center gap-1">
              <FileImage className="w-3.5 h-3.5 text-sky-400" />
              PNG / JPG / WebP
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/80 flex items-center gap-1">
              <Clipboard className="w-3.5 h-3.5 text-indigo-400" />
              クリップボードから貼り付け (Ctrl+V) も可能
            </span>
          </div>
        </div>
      </div>

      {/* Instant Presets to Test with 1 Click */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-200">
              サンプル画像ですぐに試す (クリックで即ロード)
            </h3>
          </div>
          <span className="text-xs text-slate-400">16:9 &amp; 9:16 の分割テスト用</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              id={`sample-preset-${preset.id}`}
              disabled={isLoading || loadingPreset !== null}
              onClick={() => handlePresetSelect(preset.id)}
              className="p-3.5 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {preset.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {preset.width}×{preset.height}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-sky-400 transition-colors">
                  {preset.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {preset.description}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{loadingPreset === preset.id ? '生成中...' : 'この画像で試す'}</span>
                <span className="text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                  &rarr;
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
