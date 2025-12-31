import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import InvoiceList from './components/InvoiceList';
import InvoiceUpload from './components/InvoiceUpload';
import InvoiceReview from './components/InvoiceReview';
import AuditLog from './components/AuditLog';
import CyberBackground from './components/CyberBackground';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  return (
    <div className="relative min-h-screen">
      <CyberBackground />
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <InvoiceList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Layout>
                <InvoiceUpload />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <InvoiceReview />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute>
              <Layout>
                <AuditLog />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(10, 10, 30, 0.9)',
                color: '#fff',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                backdropFilter: 'blur(10px)',
                fontFamily: 'Rajdhani, sans-serif',
              },
              success: {
                iconTheme: {
                  primary: '#00ff88',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff0066',
                  secondary: '#fff',
                },
              },
            }}
          />
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
