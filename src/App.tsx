/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { runMigrationsAndInit } from './repository/AppInit';
import { Layout } from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import Rules from './pages/Rules';
import History from './pages/History';
import Analysis from './pages/Analysis';
import TradeForm from './pages/TradeForm';
import TradeDetail from './pages/TradeDetail';
import JournalList from './pages/JournalList';
import JournalDetail from './pages/JournalDetail';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        await runMigrationsAndInit();
        setIsReady(true);
      } catch (err: any) {
        console.error(err);
        setError("Failed to initialize or migrate data. Please check storage capacity or browser settings.");
      }
    };
    init();
  }, []);

  if (error) {
    return (
      <div className="flex app-viewport items-center justify-center bg-zinc-50 p-6 text-center">
        <div className="text-zinc-600">
          <p className="mb-4 text-rose-500 font-medium">Initialization Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex app-viewport items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/record" element={<TradeForm />} />
          <Route path="/detail/:id" element={<TradeDetail />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/history" element={<History />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/journals" element={<JournalList />} />
          <Route path="/journal/:dateParam" element={<JournalDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
