import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import logo from '../assets/branding/logo-primary.svg';

interface AuthPageProps {
  initialView: 'signin' | 'signup';
  onBack: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialView, onBack }) => {
  const { signIn, signUp } = useAuth();
  const [view, setView] = useState<'signin' | 'signup'>(initialView);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (view === 'signup') {
        if (!name) {
          throw new Error('Name is required');
        }
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-charcoal font-sans flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-pastel-lavender/35 blur-[80px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[300px] h-[300px] rounded-full bg-pastel-sky/35 blur-[80px] -z-10" />

      {/* Back button */}
      <button 
        onClick={onBack}
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-semibold text-graphite hover:text-charcoal transition-smooth"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-xl border border-pastel-lilac/30 relative"
      >
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="PMS Logo" className="h-10 mb-4" />
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-pastel-lilac/30 rounded-full text-[10px] font-bold text-graphite">
            <Sparkles className="w-3 h-3 text-charcoal" />
            <span>SECURE GATEWAY</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-pastel-rose/40 border border-pastel-rose/60 rounded-xl flex gap-2.5 items-start text-xs font-medium text-charcoal">
            <AlertCircle className="w-4 h-4 text-charcoal shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {view === 'signup' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-graphite">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name" 
                className="w-full px-4 py-3 rounded-xl border border-pastel-lilac/30 bg-background-cream/45 focus:outline-none focus:border-pastel-lilac/80 text-sm"
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-graphite">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="w-full px-4 py-3 rounded-xl border border-pastel-lilac/30 bg-background-cream/45 focus:outline-none focus:border-pastel-lilac/80 text-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-graphite">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-4 py-3 rounded-xl border border-pastel-lilac/30 bg-background-cream/45 focus:outline-none focus:border-pastel-lilac/80 text-sm"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 py-3 bg-charcoal text-background hover:bg-charcoal/90 rounded-xl font-bold text-sm shadow-md transition-smooth flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              view === 'signup' ? 'Create Account' : 'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-pastel-lilac/15 text-center text-xs text-graphite">
          {view === 'signup' ? (
            <>
              Already have an account?{' '}
              <button 
                onClick={() => { setView('signin'); setError(null); }} 
                className="font-bold text-charcoal underline hover:text-charcoal/80"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              New to PMS?{' '}
              <button 
                onClick={() => { setView('signup'); setError(null); }} 
                className="font-bold text-charcoal underline hover:text-charcoal/80"
              >
                Create an account
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};
