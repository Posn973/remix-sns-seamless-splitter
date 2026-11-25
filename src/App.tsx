import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { PWAStatusBanner } from './components/PWAStatusBanner';
import { GuideModal } from './components/GuideModal';
import { SettingsModal, getSavedSeamTrimPx } from './components/SettingsModal';
import { ImageUploader } from './components/ImageUploader';
import { StepSetup } from './components/StepSetup';
import { StepEdit } from './components/StepEdit';
import { StepPreview } from './components/StepPreview';
import {
  ImageMetadata,
  SplitConfig,
  SliceResult,
  OutputFormat,
  SplitCount,
  SplitDirection,
  AppStep,
} from './types';
import { analyzeAspectRatio, RatioAnalysis } from './utils/aspectRatio';
import { generateSlices, getDefaultSplitPositions } from './utils/imageSplitter';

export default function App() {
  // Step state: 'upload' | 'setup' | 'edit' | 'preview'
  const [currentStep, setCurrentStep] = useState<AppStep>('upload');

  // Track if user has gone through Step 3 (Edit) and finished
  const [hasEditedInStep3, setHasEditedInStep3] = useState<boolean>(false);

  // Image and analysis states
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);
  const [ratioAnalysis, setRatioAnalysis] = useState<RatioAnalysis | null>(null);

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Split Configuration State
  // Initial seamTrimPx is loaded from localStorage (default 12px)
  const [config, setConfig] = useState<SplitConfig>(() => ({
    count: 3,
    direction: 'vertical',
    positions: [1 / 3, 2 / 3],
    seamTrimPx: getSavedSeamTrimPx(),
  }));

  // Export settings
  const [format, setFormat] = useState<OutputFormat>('image/png');
  const [baseName, setBaseName] = useState<string>('sns_split');

  // Generated Slices Result
  const [slices, setSlices] = useState<SliceResult[]>([]);

  // Cached HTML Image element for slicing
  const cachedImgRef = useRef<HTMLImageElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const currentGenIdRef = useRef<number>(0);
  const activeSlicesRef = useRef<SliceResult[]>([]);

  // Keep activeSlicesRef synced
  useEffect(() => {
    activeSlicesRef.current = slices;
  }, [slices]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      activeSlicesRef.current.forEach((s) => {
        if (s.dataUrl && s.dataUrl.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(s.dataUrl);
          } catch (e) {
            // ignore
          }
        }
      });
    };
  }, []);

  // Handle image selected from Step 1
  const handleImageSelected = (dataUrl: string, file?: File) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      cachedImgRef.current = img;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const analysis = analyzeAspectRatio(w, h);

      // Split direction is unified to left-right ('vertical' cut lines)
      const unifiedDir: SplitDirection = 'vertical';

      const initialCount: SplitCount = 3;
      const initialPositions = getDefaultSplitPositions(initialCount);
      const savedTrim = getSavedSeamTrimPx();

      const meta: ImageMetadata = {
        file,
        name: file?.name || 'sample_image',
        url: dataUrl,
        width: w,
        height: h,
        aspectRatio: analysis.exactRatio,
        aspectRatioLabel: analysis.ratioString,
        isStandardRatio: !!analysis.matchedStandard,
        fileSize: file?.size,
        mimeType: file?.type || 'image/png',
      };

      setImageMetadata(meta);
      setRatioAnalysis(analysis);
      setBaseName(file ? file.name.replace(/\.[^/.]+$/, '') : 'sns_split');

      setConfig({
        count: initialCount,
        direction: unifiedDir,
        positions: initialPositions,
        seamTrimPx: savedTrim,
      });

      // Reset Step 3 pass flag for the new image and transition to Step 2
      setHasEditedInStep3(false);
      setCurrentStep('setup');
    };
    img.src = dataUrl;
  };

  // Re-generate slices when image, config or format changes
  const runSliceGeneration = useCallback(async () => {
    if (!cachedImgRef.current || !imageMetadata) return;
    const genId = ++currentGenIdRef.current;

    try {
      setIsGenerating(true);
      const results = await generateSlices(
        cachedImgRef.current,
        config,
        format,
        0.95,
        () => genId !== currentGenIdRef.current
      );

      if (genId === currentGenIdRef.current && results.length > 0) {
        // Revoke previous blob URLs
        activeSlicesRef.current.forEach((s) => {
          if (s.dataUrl && s.dataUrl.startsWith('blob:')) {
            try {
              URL.revokeObjectURL(s.dataUrl);
            } catch (e) {
              // ignore
            }
          }
        });
        setSlices(results);
      }
    } catch (err) {
      console.error('Error generating slices:', err);
    } finally {
      if (genId === currentGenIdRef.current) {
        setIsGenerating(false);
      }
    }
  }, [config, format, imageMetadata]);

  // Debounced slice generation on config change
  useEffect(() => {
    if (!cachedImgRef.current || !imageMetadata) return;

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      runSliceGeneration();
    }, 60);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [config, format, imageMetadata, runSliceGeneration]);

  // Reset entire image (Go back to Step 1)
  const handleResetImage = () => {
    activeSlicesRef.current.forEach((s) => {
      if (s.dataUrl && s.dataUrl.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(s.dataUrl);
        } catch (e) {
          // ignore
        }
      }
    });
    cachedImgRef.current = null;
    setImageMetadata(null);
    setRatioAnalysis(null);
    setSlices([]);
    setHasEditedInStep3(false);
    setCurrentStep('upload');
  };

  // Step 2 -> Step 3 (Edit)
  const handleGoToEdit = () => {
    setCurrentStep('edit');
  };

  // Step 3 (Finish Edit) -> Step 2 (with Next button enabled)
  const handleFinishEdit = () => {
    setHasEditedInStep3(true);
    setCurrentStep('setup');
  };

  // Step 2 -> Step 4 (Preview & Export)
  const handleGoToPreview = () => {
    setCurrentStep('preview');
  };

  // Step 4 -> Step 2 (Back)
  const handleGoBackToSetup = () => {
    setCurrentStep('setup');
  };

  // Settings seamTrim update
  const handleApplyTrim = (newTrimPx: number) => {
    setConfig((prev) => ({
      ...prev,
      seamTrimPx: newTrimPx,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white font-sans antialiased">
      {/* PWA Hash Update & Offline Banner */}
      <PWAStatusBanner />

      {/* Top Header (Persistent Red Image Change button is visible except during Step 3 Edit) */}
      <Header
        currentStep={currentStep}
        hasImage={!!imageMetadata}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetImage={imageMetadata ? handleResetImage : undefined}
        hideImageChangeBtn={currentStep === 'edit'}
      />

      {/* Guide Modal */}
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentSeamTrimPx={config.seamTrimPx}
        onApplyTrim={handleApplyTrim}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ========================================================================= */}
        {/* STEP 1: UPLOAD SCREEN (写真のドロップ、クリックして選択)                     */}
        {/* ========================================================================= */}
        {currentStep === 'upload' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center max-w-2xl mx-auto pt-2 pb-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
                1枚の写真をSNS向けに美しく分割
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                SNS Photo Splitter 後継モデル
              </h2>
              <p className="text-sm sm:text-base text-slate-400 mt-2">
                16:9や9:16の写真をきれいに2〜20分割（X最大20枚投稿対応）。12px隙間補正・精密5px微調整スライダーで、顔や文字を避けてシームレスなSNS投稿を作成できます。
              </p>
            </div>

            <ImageUploader onImageSelected={handleImageSelected} />
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: SETUP SCREEN (分割枚数 2〜20, 編集ボタン, 次へボタン)   */}
        {/* ========================================================================= */}
        {currentStep === 'setup' && imageMetadata && ratioAnalysis && (
          <StepSetup
            metadata={imageMetadata}
            ratioAnalysis={ratioAnalysis}
            config={config}
            hasEditedInStep3={hasEditedInStep3}
            onChangeConfig={setConfig}
            onGoToEdit={handleGoToEdit}
            onGoToPreview={handleGoToPreview}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {/* ========================================================================= */}
        {/* STEP 3: EDIT SCREEN (大画面編集・精密スライド・90°回転・編集完了)          */}
        {/* ========================================================================= */}
        {currentStep === 'edit' && imageMetadata && (
          <StepEdit
            metadata={imageMetadata}
            config={config}
            onChangeConfig={setConfig}
            onFinishEdit={handleFinishEdit}
          />
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PREVIEW & EXPORT SCREEN (大画面で確認, ZIP/個別保存, 各種タブ)   */}
        {/* ========================================================================= */}
        {currentStep === 'preview' && imageMetadata && (
          <StepPreview
            metadata={imageMetadata}
            slices={slices}
            config={config}
            format={format}
            baseName={baseName}
            onChangeFormat={setFormat}
            onChangeBaseName={setBaseName}
            onGoBackToSetup={handleGoBackToSetup}
          />
        )}
      </main>

      {/* Footer */}
      {currentStep !== 'edit' && (
        <footer className="w-full border-t border-slate-800/80 bg-slate-900/50 py-4 px-4 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>SNS Photo Splitter 後継モデル • 操作性特化ステップ分割</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="text-sky-400 hover:text-sky-300 transition-colors"
              >
                隙間補正設定 ({config.seamTrimPx}px)
              </button>
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors"
              >
                使い方ガイド
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

