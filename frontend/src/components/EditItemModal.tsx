import React, { useState, useEffect } from 'react';
import { X, Flame, ShieldCheck, Save, Shirt } from 'lucide-react';
import { ClothingItem, CategoryType } from '../types';
import { api } from '../services/api';

interface EditItemModalProps {
  item: ClothingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onItemUpdated: (updated: ClothingItem) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  item,
  isOpen,
  onClose,
  onItemUpdated,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('top');
  const [color, setColor] = useState('');
  const [pattern, setPattern] = useState('einfarbig');
  const [fabric, setFabric] = useState('Baumwolle');
  const [warmthLevel, setWarmthLevel] = useState<number>(3);
  const [formality, setFormality] = useState<string>('casual');
  const [waterproof, setWaterproof] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setColor(item.color);
      setPattern(item.pattern || 'einfarbig');
      setFabric(item.fabric || 'Baumwolle');
      setWarmthLevel(item.warmth_level);
      setFormality(item.formality || 'casual');
      setWaterproof(item.waterproof);
      setError(null);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Bitte gib dem Kleidungsstück einen Namen.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const updated = await api.updateItem(item.id, {
        name: name.trim(),
        category,
        color: color.trim(),
        pattern,
        fabric: fabric.trim(),
        warmth_level: warmthLevel,
        formality,
        waterproof,
      });
      onItemUpdated(updated);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Kleidungsstück bearbeiten</h3>
              <p className="text-xs text-slate-500">Passe Details und Eigenschaften deines Kleidungsstücks an</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Image preview & Category */}
          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-white"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80';
              }}
            />
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategorie</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'top', label: 'Oberteil' },
                  { id: 'pants', label: 'Hose' },
                  { id: 'shoes', label: 'Schuhe' }
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id as CategoryType)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all ${
                      category === c.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Bezeichnung</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Dunkelblauer Wollpullover"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Color & Fabric */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Farbe</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="z.B. Dunkelblau, Weiß"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Material / Stoff</label>
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="z.B. Baumwolle, Denim"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Formality / Vibe */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Anlass / Stil (Vibe)</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {[
                { id: 'casual', label: 'Freizeit' },
                { id: 'smart_casual', label: 'Smart' },
                { id: 'formal', label: 'Formell' },
                { id: 'athletic', label: 'Sport' },
                { id: 'lounge', label: 'Home' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormality(f.id)}
                  className={`py-1.5 px-2 text-xs font-bold rounded-lg border transition-all text-center truncate ${
                    formality === f.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Warmth Level Slider */}
          <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800">Wärmegrad ({warmthLevel}/5)</span>
              <span className="text-xs text-amber-700 font-semibold">
                {warmthLevel === 1 && 'Sehr leicht (Sommer/Shorts)'}
                {warmthLevel === 2 && 'Leicht (T-Shirt/Hemd)'}
                {warmthLevel === 3 && 'Mittel (Sweatshirt/Chino)'}
                {warmthLevel === 4 && 'Warm (Wollpullover/Jacke)'}
                {warmthLevel === 5 && 'Sehr warm (Wintermantel/Stiefel)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setWarmthLevel(lvl)}
                  className={`flex-1 py-1.5 flex items-center justify-center rounded-xl border transition-all ${
                    warmthLevel >= lvl
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-300 border-slate-200 hover:text-amber-400'
                  }`}
                >
                  <Flame className="w-4 h-4 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Waterproof Toggle */}
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className={`p-1.5 rounded-lg ${waterproof ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">Wetterfest / Wasserabweisend</p>
                <p className="text-[11px] text-slate-500">Wichtig für Regentage und Schlechtwetter-Empfehlungen</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={waterproof}
              onChange={(e) => setWaterproof(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded-md focus:ring-blue-500 cursor-pointer"
            />
          </label>

          {/* Save / Cancel actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Speichert...' : 'Änderungen speichern'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
