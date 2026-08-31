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
  const [color, setColor] = useState('Neutral');
  const [fabric, setFabric] = useState('Baumwolle');
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
        console.error('AI Auto-tagging fehlgeschlagen, manuelle Eingabe aktiv', err);
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
      formData.append('name', name || `${color} ${category === 'top' ? 'Oberteil' : category === 'pants' ? 'Hose' : 'Schuhe'}`);
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
      alert('Kleidungsstück konnte nicht gespeichert werden.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreviewUrl(null);
    setName('');
    setColor('Neutral');
    setFabric('Baumwolle');
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
            <h3 className="text-lg font-bold text-slate-900">Kleidungsstück hinzufügen</h3>
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
                  alt="Vorschau"
                  className="w-full h-full object-contain"
                />
                {analyzing && (
                  <div className="absolute inset-0 bg-blue-900/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-sm font-semibold gap-2">
                    <Sparkles className="w-6 h-6 animate-spin text-amber-300" />
                    <span>KI-Vision scannt und verschlagwortet automatisch...</span>
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
                    Lade ein Foto von deinem Oberteil, deiner Hose oder Schuhen hoch
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    JPG, PNG, WEBP • KI erkennt automatisch Kategorie, Farbe und Wärmegrad
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Category Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kategorie
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'top' as CategoryType, label: 'Oberteil' },
                { id: 'jacket' as CategoryType, label: 'Jacke/Mantel' },
                { id: 'pants' as CategoryType, label: 'Hose' },
                { id: 'shoes' as CategoryType, label: 'Schuhe' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`py-2 px-3 rounded-xl text-sm font-bold capitalize transition-all duration-200 border ${
                    category === cat.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name / Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Titel / Bezeichnung
            </label>
            <input
              type="text"
              required
              placeholder="z.B. Dunkelblauer Merinowoll-Pullover"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Color & Fabric grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Hauptfarbe
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="z.B. Dunkelblau, Weiß, Schwarz"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Material / Stoff
              </label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="z.B. Wolle, Baumwolle, Denim"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Warmth Level Slider */}
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/60">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
                <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                <span>Wärmegrad: {warmthLevel} / 5</span>
              </div>
              <span className="text-xs font-semibold text-amber-800">
                {warmthLevel === 1 && 'Sehr leicht (Sommer-Top / Shorts)'}
                {warmthLevel === 2 && 'Leicht (T-Shirt / leichte Sneaker)'}
                {warmthLevel === 3 && 'Mäßig (Hemd / Jeans / Chino)'}
                {warmthLevel === 4 && 'Warm (Pullover / Stiefel / Jacke)'}
                {warmthLevel === 5 && 'Sehr warm / Winter (Mantel / Gefütterte Boots)'}
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
                Stil / Anlass
              </label>
              <select
                value={formality}
                onChange={(e) => setFormality(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="casual">Freizeit (Alltag)</option>
                <option value="smart_casual">Smart Casual (Büro / Ausgehen)</option>
                <option value="formal">Formell / Elegant</option>
                <option value="athletic">Sportlich / Aktiv</option>
                <option value="lounge">Homewear / Gemütlich</option>
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
                <span>Wasserdicht / Regenfest</span>
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
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting || (!file && !previewUrl)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-bold shadow-md shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Wird gespeichert...' : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Im Kleiderschrank speichern</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
