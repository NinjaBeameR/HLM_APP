import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/Auth/AuthProvider';
import { HomePage } from './components/HomePage';
import { LoginForm } from './components/Auth/LoginForm';
import { LoadingSpinner } from './components/LoadingSpinner';
import { MasterPage } from './components/Master/MasterPage';
import { DailyEntry } from './components/Entry/DailyEntry';
import { SummaryDashboard } from './components/Summary/SummaryDashboard';
import { NavBar } from './components/NavBar';
import { PaymentScreen } from './components/Payments/PaymentScreen';
import { SplashScreen } from './components/SplashScreen';

type AppContentProps = {
  onNavigate: (page: string) => void;
};

const AppContent: React.FC<AppContentProps> = ({ onNavigate }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return <HomePage onNavigate={onNavigate} />;
};

// This is the ONLY place you should use useNavigate!
function AppRoutes() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigate = (page: string) => {
    if (page === 'master') navigate('/master');
    else if (page === 'entry') navigate('/entry');
    else if (page === 'summary') navigate('/summary');
    else if (page === 'payments') navigate('/payments');
  };

  return (
    <>
      {/* Only show NavBar if user is logged in */}
      {user && <NavBar />}
      <div className={user ? "pt-16" : ""}>
        <Routes>
          <Route path="/" element={<AppContent onNavigate={handleNavigate} />} />
          <Route path="/master" element={<MasterPage />} />
          <Route path="/entry" element={<DailyEntry />} />
          <Route path="/summary" element={<SummaryDashboard />} />
          <Route path="/payments" element={<PaymentScreen />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Theme persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <>
      {showSplash && (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      )}
      {!showSplash && (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </div>
      )}
    </>
  );
}
