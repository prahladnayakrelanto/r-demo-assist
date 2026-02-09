import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Shield, LogIn, AlertCircle, Loader, Building2 } from 'lucide-react';
import './LoginPage.css';

function LoginPage() {
  const { login, authError, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleLogin = async () => {
    setIsSigningIn(true);
    await login();
    setIsSigningIn(false);
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="login-bg-gradient"></div>
        <div className="login-bg-pattern"></div>
      </div>

      {/* Login Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <img 
            src="https://cdn.prod.website-files.com/667e468094796a0d45a94aa4/6687845edf77ac3cc383dad3_footer_logo.svg" 
            alt="Relanto Logo" 
            className="login-relanto-logo"
          />
          <h1 className="logo-text">AI First Lab</h1>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <span>Sign in to continue</span>
        </div>

        {/* Error Message */}
        {authError && (
          <div className="login-error">
            <AlertCircle size={18} />
            <span>{authError}</span>
          </div>
        )}

        {/* Login Button */}
        <button 
          className="microsoft-login-btn"
          onClick={handleLogin}
          disabled={isLoading || isSigningIn}
        >
          {isSigningIn ? (
            <>
              <Loader className="btn-spinner" size={20} />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="microsoft-icon" viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
              <span>Sign in with Microsoft</span>
            </>
          )}
        </button>

        {/* Domain Notice */}
        <div className="domain-notice">
          <Building2 size={16} />
          <span>Only <strong>@relanto.ai</strong> accounts can access this application</span>
        </div>

        {/* Security Notice */}
        <div className="security-notice">
          <Shield size={14} />
          <span>Protected by Microsoft Entra ID</span>
        </div>
      </div>

      {/* Footer */}
      <div className="login-footer">
        <p>© {new Date().getFullYear()} AI First Lab by Relanto</p>
      </div>
    </div>
  );
}

export default LoginPage;

