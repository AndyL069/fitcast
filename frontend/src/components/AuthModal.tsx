import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Shield, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'login'
}) => {
  const { login, register, authentikEnabled } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        if (!username.trim()) {
          throw new Error('Bitte gib deinen Namen an.');
        }
        await register(email, username, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentifizierung fehlgeschlagen');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 mb-4">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900">
          {tab === 'login' ? 'Willkommen zurück!' : 'Konto erstellen'}
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          {tab === 'login'
            ? 'Melde dich an, um auf deinen persönlichen Kleiderschrank zuzugreifen.'
            : 'Erstelle ein kostenloses Konto für deine individuelle Outfit-Auswahl.'}
        </p>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'login' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => { setTab('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === 'register' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Registrieren
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Dein Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="z.B. Alex"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              E-Mail-Adresse
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="name@beispiel.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Passwort
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/25 transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            <span>{loading ? 'Bitte warten...' : tab === 'login' ? 'Anmelden' : 'Registrieren & Loslegen'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Authentik SSO Option (Direct Native Anchor Link) */}
        {authentikEnabled && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="relative flex py-1 items-center mb-3">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="shrink mx-3 text-xs text-slate-400 font-semibold uppercase">oder</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <a
              href="/api/auth/authentik/login"
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 active:scale-98 transition-all duration-200 cursor-pointer select-none text-decoration-none"
            >
              <Shield className="w-4 h-4 shrink-0" />
              <span>Mit Authentik anmelden (SSO)</span>
            </a>
          </div>
        )}

      </div>
    </div>
  );
};
