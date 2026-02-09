import React from 'react';
import { useAuth } from './auth/AuthProvider';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import './App.css';

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>Loading...</p>
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Show dashboard if authenticated
  return (
    <div className="App">
      <Dashboard />
    </div>
  );
}

export default App;








