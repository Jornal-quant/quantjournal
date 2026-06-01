import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from '@/components/ScrollToTop';
import AdminGate from '@/components/AdminGate';

import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

import PublicLayout from './components/layout/PublicLayout';
import Home from './pages/Home';
import ArticlePage from './pages/ArticlePage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import AssetPageView from './pages/AssetPageView';
import AssetsIndex from './pages/AssetsIndex';
import Metodologia from './pages/Metodologia';
import ChartsPage from './pages/ChartsPage';

// Carregados sob demanda (reduz o bundle inicial).
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const MarketChat = lazy(() => import('./pages/MarketChat'));

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={(
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--background))' }}>
        <div className="w-8 h-8 border-4 border-foreground/10 border-t-white/60 rounded-full animate-spin"></div>
      </div>
    )}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public pages with layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/artigo/:id" element={<ArticlePage />} />
        <Route path="/categoria/:category" element={<CategoryPage />} />
        <Route path="/busca" element={<SearchPage />} />
        <Route path="/ativos" element={<AssetsIndex />} />
        <Route path="/ativo/:slug" element={<AssetPageView />} />
        <Route path="/chat" element={<MarketChat />} />
        <Route path="/graficos" element={<ChartsPage />} />
        <Route path="/metodologia" element={<Metodologia />} />
      </Route>

      {/* Admin — protegido por login validado no servidor (AdminGate) */}
      <Route path="/admin" element={<AdminGate><AdminDashboard /></AdminGate>} />

      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App