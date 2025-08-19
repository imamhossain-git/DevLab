import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import LabCatalog from './pages/LabCatalog';
import LabDetail from './pages/LabDetail';
import LabRunner from './pages/LabRunner';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import CreateLab from './pages/CreateLab';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading DevLab...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/labs" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/labs" />} />
        <Route path="/labs" element={user ? <LabCatalog /> : <Navigate to="/login" />} />
        <Route path="/labs/:slug" element={user ? <LabDetail /> : <Navigate to="/login" />} />
        <Route path="/runner/:attemptId" element={user ? <LabRunner /> : <Navigate to="/login" />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
        <Route 
          path="/admin" 
          element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/labs/create" 
          element={user?.role === 'admin' ? <CreateLab /> : <Navigate to="/" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;