import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ContentDetail from './pages/ContentDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CheckoutMock from './pages/CheckoutMock';
import Upload from './pages/Upload';
import AdminLayout from './Adminide/AdminLayout';
import AdminDashboard from './Adminide/AdminDashboard';
import ContentManagement from './Adminide/ContentManagement';
import UserManagement from './Adminide/UserManagement';
import AdminSettings from './Adminide/AdminSettings';
import { AlertCircle, Loader2 } from 'lucide-react';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-angola-red animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white text-angola-black font-sans">
        <Routes>
          {/* Admin Routes with their own Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="content" element={<ContentManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Public/App Routes with standard Layout (Navbar) */}
          <Route
            path="*"
            element={
              <>
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/catalog" element={<Catalog />} />
                    <Route path="/content/:id" element={<ContentDetail />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/checkout-mock" element={<CheckoutMock />} />
                    <Route path="/upload" element={<Upload />} />
                  </Routes>
                </main>
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
