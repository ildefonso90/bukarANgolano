import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';

// Main pages - eager load for stability
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import SearchPage from './pages/SearchPage';
import ContentDetail from './pages/ContentDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CheckoutMock from './pages/CheckoutMock';
import Upload from './pages/Upload';

// Lazy load Admin section
const AdminLayout = lazy(() => import('./Adminide/AdminLayout'));
const AdminDashboard = lazy(() => import('./Adminide/AdminDashboard'));
const ContentManagement = lazy(() => import('./Adminide/ContentManagement'));
const AdminUpload = lazy(() => import('./Adminide/AdminUpload'));
const AdminIA = lazy(() => import('./Adminide/AdminIA'));
const AdminAssistant = lazy(() => import('./Adminide/AdminAssistant'));
const AdminYouTubeCourse = lazy(() => import('./Adminide/AdminYouTubeCourse'));
const UserManagement = lazy(() => import('./Adminide/UserManagement'));
const AdminSettings = lazy(() => import('./Adminide/AdminSettings'));

function PublicLayout() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </>
  );
}

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-angola-black font-sans">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="w-8 h-8 text-angola-red animate-spin" />
          </div>
        }>
          <Routes>
            {/* Admin Routes with their own Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="upload" element={<AdminUpload />} />
              <Route path="ia" element={<AdminIA />} />
              <Route path="assistant" element={<AdminAssistant />} />
              <Route path="course-builder" element={<AdminYouTubeCourse />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* Public/App Routes with shared Layout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/busca/:query" element={<SearchPage />} />
              <Route path="/content/:id" element={<ContentDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/checkout-mock" element={<CheckoutMock />} />
              <Route path="/upload" element={<Upload />} />
            </Route>
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HelmetProvider>
  );
}
