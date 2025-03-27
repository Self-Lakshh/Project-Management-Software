import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<'landing' | 'signin' | 'signup'>('landing');

  if (loading) {
    return (
      <div className="h-screen w-screen bg-background flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-pastel-lilac" />
        <span className="font-outfit text-sm font-semibold tracking-wider text-graphite">COMPILING PMS WORKSPACE...</span>
      </div>
    );
  }

  if (user) {
    return (
      <SocketProvider>
        <Dashboard />
      </SocketProvider>
    );
  }

  if (authView === 'signin' || authView === 'signup') {
    return (
      <AuthPage 
        initialView={authView} 
        onBack={() => setAuthView('landing')} 
      />
    );
  }

  return (
    <LandingPage 
      onStart={(view) => setAuthView(view)} 
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
