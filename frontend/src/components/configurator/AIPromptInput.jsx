// frontend/src/components/configurator/AIPromptInput.jsx
import { useState, useRef } from 'react';
import { Sparkles, Loader2, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import generateDesign, { analyzeBeadImage } from '../../services/aiGeneratorService';
import useConfiguratorStore from '../../stores/configuratorStore';

const QUICK_THEMES = [
  {
    label: 'Luxury',
    prompt: 'Luxury black bracelet with gold spacers and elegant faceted charms',
  },
  {
    label: 'Minimal',
    prompt: 'Minimal silver bracelet with clean round beads, no charms',
  },
  {
    label: 'Ocean',
    prompt: 'Ocean inspired bracelet with blue and teal crystal beads',
  },
  {
    label: 'Elegant',
    prompt: 'Elegant rose gold bracelet with pearl beads and a delicate charm',
  },
  {
    label: 'Crystal',
    prompt: 'Sparkling crystal faceted bracelet with silver chain',
  },
];

const AIPromptInput = () => {
  const [prompt,          setPrompt]          = useState('');
  const [loading,         setLoading]         = useState(false);
  const [analyzing,       setAnalyzing]       = useState(false);
  const [previewUrl,      setPreviewUrl]      = useState(null);
  const [previewFile,     setPreviewFile]     = useState(null);

  const fileInputRef = useRef(null);

  const {
    category,
    setIsGenerating,
    setSelectedBeads,
    setSelectedChain,
    setSelectedCharms,
    setSelectedColor,
    setSelectedMaterial,
    setTotalPrice,
  } = useConfiguratorStore();

  const applyTheme = (themePrompt) => {
    setPrompt(themePrompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please describe your bracelet first.');
      return;
    }

    setLoading(true);
    setIsGenerating(true);

    try {
      const result = await generateDesign(prompt, category?.id ?? null);

      setSelectedBeads(result.beads ?? []);
      setSelectedChain(result.chain ?? null);
      setSelectedCharms(result.charms ?? []);
      setSelectedColor(result.color ?? null);
      setSelectedMaterial(result.material ?? null);
      setTotalPrice(parseFloat(result.total_price ?? 0));

      toast.success('Design generated! Review in the sidebar.');
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? 'Please log in to use AI generation.'
          : err.response?.data?.error ?? err.message ?? 'Generation failed.';
      toast.error(msg);
      console.error('AI generate error:', err);
    } finally {
      setLoading(false);
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  // ── Image analysis ──────────────────────────────────────────────────────────

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    // Reset the input so the same file can be re-selected
    e.target.value = '';
  };

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
  };

  const handleAnalyze = async () => {
    if (!previewFile) return;

    setAnalyzing(true);
    setIsGenerating(true);

    try {
      const result = await analyzeBeadImage(previewFile);

      setSelectedBeads(result.beads ?? []);
      if (result.color) setSelectedColor(result.color);

      const styleLabel = result.detected_style === 'faceted' ? 'crystal/faceted' : 'round/matte';
      toast.success(
        `Matched ${result.beads?.length ?? 0} ${styleLabel} beads from your photo!`,
        { duration: 4000 }
      );
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? 'Please log in to use image analysis.'
          : err.response?.data?.error ?? 'Image analysis failed.';
      toast.error(msg);
      console.error('Image analyze error:', err);
    } finally {
      setAnalyzing(false);
      setIsGenerating(false);
    }
  };

  const busy = loading || analyzing;

  return (
    <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-3">
      <div className="max-w-4xl mx-auto">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <span className="text-xs font-semibold text-neutral-700 uppercase tracking-widest">
            AI Design Generator
          </span>
          <span className="text-xs text-neutral-400 hidden sm:inline">
            — describe your bracelet or upload a reference photo
          </span>
        </div>

        <div className="flex gap-2">
          {/* Textarea */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your bracelet… e.g. Luxury black bracelet with gold spacers"
            rows={2}
            disabled={busy}
            className="flex-1 resize-none rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent disabled:opacity-50 disabled:bg-neutral-50 transition-colors"
          />

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={busy || !prompt.trim()}
            className="flex-shrink-0 inline-flex flex-col items-center justify-center gap-1 px-4 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>

        {/* Photo Analysis row */}
        <div className="flex items-center gap-2 mt-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!previewUrl ? (
            /* Upload trigger */
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-neutral-200 text-xs text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 bg-neutral-50 hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Camera className="w-3.5 h-3.5" />
              Match from photo
            </button>
          ) : (
            /* Preview + Analyze */
            <div className="flex items-center gap-2">
              {/* Thumbnail */}
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="reference"
                  className="w-9 h-9 rounded-lg object-cover border border-neutral-200"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-neutral-900 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  title="Remove photo"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-300 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Camera className="w-3 h-3" />
                    Analyze &amp; Match
                  </>
                )}
              </button>

              <span className="text-xs text-neutral-400">
                AI will pick matching beads from this photo
              </span>
            </div>
          )}

          {/* Divider + quick themes */}
          {!previewUrl && (
            <>
              <span className="text-neutral-200 text-xs">|</span>
              <span className="text-xs text-neutral-400">Quick:</span>
              {QUICK_THEMES.map((theme) => (
                <button
                  key={theme.label}
                  onClick={() => applyTheme(theme.prompt)}
                  disabled={busy}
                  className="px-2.5 py-0.5 rounded-full text-xs border border-neutral-200 text-neutral-600 hover:border-neutral-500 hover:text-neutral-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-neutral-50 hover:bg-white"
                >
                  {theme.label}
                </button>
              ))}
              <span className="text-xs text-neutral-300 ml-1 hidden sm:inline">
                · Ctrl+Enter to generate
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPromptInput;
