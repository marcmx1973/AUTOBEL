import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MasterDataPage from './pages/MasterDataPage';
import QuotationPage from './pages/QuotationPage';
import NewQuotePage from './pages/NewQuotePage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import LoadManagementPage from './pages/LoadManagementPage';
import Auth from './components/Auth';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/master-data" element={<MasterDataPage />} />
        <Route path="/quotation" element={<QuotationPage />} />
        <Route path="/new-quote" element={<NewQuotePage />} />
        <Route path="/weekly-review" element={<WeeklyReviewPage />} />
        <Route path="/load-management" element={<LoadManagementPage />} />
      </Routes>
    </div>
  );
}