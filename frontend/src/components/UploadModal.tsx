import React, { useState, useRef } from 'react';
import { X, Upload, Sparkles, Flame, Check, Shield } from 'lucide-react';
import { CategoryType, ClothingItem } from '../types';
import { api } from '../services/api';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: (item: ClothingItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onItemAdded
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [category, setCategory] = useState<CategoryType>('top');
  const [name, setName] = useState('');
  const [color, setColor] = useState('neutral');
  const [fabric, setFabric] = useState('cotton');
  const [warmthLevel, setWarmthLevel] = useState(3);
  const [formality, setFormality] = useState('casual');
  const [waterproof, setWaterproof] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));

      // Trigger AI Analysis
      try {
        setAnalyzing(true);
        const analysis = await api.analyzePhoto(selectedFile);
        if (analysis.category) setCategory(analysis.category as CategoryType);
        if (analysis.name) setName(analysis.name);
        if (analysis.color) setColor(analysis.color);
        if (analysis.fabric) setFabric(analysis.fabric);
        if (analysis.warmth_level) setWarmthLevel(analysis.warmth_level);
        if (analysis.formality) setFormality(analysis.formality);
        if (analysis.waterproof !== undefined) setWaterproof(analysis.waterproof);
      } catch (err) {
        console.error('AI Auto-tag failed, falling back to manual entry', err);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !previewUrl) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      if (file) formData.append('image', file);
      formData.append('category', category);
      formData.append('name', name || `${color} ${category}`);
      formData.append('color', color);
      formData.append('fabric', fabric);
      formData.append('warmth_level', String(warmthLevel));
      formData.append('formality', formality);
      formData.append('waterproof', String(waterproof));

      const newItem = await api.uploadItem(formData);
      onItemAdded(newItem);
      handleClose();
    } catch (err) {
      console.error(err);
      alert('Failed to save clothing item.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setName('');
    setColor('neutral');
    setFabric('cotton');
    setWarmthLevel(3);
    setWaterproof(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Add Clothing Item</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Photo Dropzone / Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 overflow-hidden ${
              previewUrl
                ? 'border-blue-300 bg-slate-50'
                : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {previewUrl ? (
              <div className="relative aspect-video max-h-48 mx-auto rounded-xl overflow-hidden shadow-xs">
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="w-full h-full object-contain"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-sm font-semibold gap-2">
                    <Sparkles className="w-6 h-6 animate-spin text-amber-300" />
                    <span>AI Vision scanning & auto-tagging...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 flex flex-col items-center gap-2 text-slate-500">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Upload a photo of your top, pants, or shoes
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    JPG, PNG, WEBP • Multimodal AI will auto-detect category and warmth
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['top', 'pants', 'shoes'] as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-sm font-bold capitalize transition-all duration-200 border ${
                    category === cat
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Name / Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Item Title / Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Navy Cable Knit Sweater"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Color & Fabric grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Color
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Navy, Black, White"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Fabric Material
              </label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. Wool, Cotton, Denim"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Warmth Level Slider */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Warmth Level: {warmthLevel} / 5</span>
              </div>
              <span className="text-xs font-semibold text-amber-800">
                {warmthLevel === 1 && 'Ultra Light (Summer tank / shorts)'}
                {warmthLevel === 2 && 'Light (T-shirt / light sneakers)'}
                {warmthLevel === 3 && 'Medium (Shirt / Jeans / Chinos)'}
                {warmthLevel === 4 && 'Warm (Sweater / Boots / Jacket)'}
                {warmthLevel === 5 && 'Heavy Winter (Parka / Insulated boots)'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={warmthLevel}
              onChange={(e) => setWarmthLevel(Number(e.target.value))}
              className="w-full accent-amber-600 h-2 bg-amber-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Formality & Waterproof */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Formality Style
              </label>
              <select
                value={formality}
                onChange={(e) => setFormality(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="casual">Casual (Daily)</option>
                <option value="smart_casual">Smart Casual (Office / Dinner)</option>
                <option value="formal">Formal / Elegant</option>
                <option value="athletic">Athletic / Workout</option>
                <option value="lounge">Loungewear / Cozy</option>
              </select>
            </div>

            <div className="pt-5 sm:pt-0 flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={waterproof}
                  onChange={(e) => setWaterproof(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Waterproof / Rain-resistant</span>
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (!file && !previewUrl)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold shadow-md shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving...' : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save to Closet</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
