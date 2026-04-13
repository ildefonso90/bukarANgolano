import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import TccDetail from './pages/TccDetail';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import CheckoutMock from './pages/CheckoutMock';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/catalog" element={<Catalog />} />
              <Route path="/tcc/:id" element={<TccDetail />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/checkout-mock" element={<CheckoutMock />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
