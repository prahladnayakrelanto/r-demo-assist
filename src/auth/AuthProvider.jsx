import React, { createContext, useContext, useState, useEffect } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';
import { PublicClientApplication, EventType, InteractionStatus } from '@azure/msal-browser';
import { msalConfig, loginRequest, isAllowedDomain, getUserDisplayName, getUserEmail, ALLOWED_DOMAIN } from './authConfig';

// Initialize MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// Set up event callback for login
msalInstance.addEventCallback((event) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});

// Auth Context
const AuthContext = createContext(null);

// Custom hook to use auth
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Fetch user profile photo from Microsoft Graph
const fetchProfilePhoto = async (instance, account) => {
  try {
    // Get access token silently
    const tokenResponse = await instance.acquireTokenSilent({
      scopes: ['User.Read'],
      account: account,
    });

    // Fetch photo from Microsoft Graph
    const response = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
      headers: {
        Authorization: `Bearer ${tokenResponse.accessToken}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
    return null;
  } catch (error) {
    console.log('Could not fetch profile photo:', error.message);
    return null;
  }
};

// Inner provider that has access to MSAL hooks
function AuthProviderInner({ children }) {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      
      if (inProgress !== InteractionStatus.None) {
        return; // Wait for MSAL to finish
      }

      if (isAuthenticated && accounts.length > 0) {
        const account = accounts[0];
        const email = getUserEmail(account);
        
        // Check domain restriction
        if (isAllowedDomain(email)) {
          // Fetch profile photo
          const photoUrl = await fetchProfilePhoto(instance, account);
          
          setUser({
            name: getUserDisplayName(account),
            email: email,
            account: account,
            photo: photoUrl,
          });
          setIsAuthorized(true);
          setAuthError(null);
        } else {
          // User logged in but not from allowed domain
          setUser(null);
          setIsAuthorized(false);
          setAuthError(`Access denied. Only @${ALLOWED_DOMAIN} accounts are allowed.`);
          // Sign out the unauthorized user
          await instance.logoutPopup({ account });
        }
      } else {
        setUser(null);
        setIsAuthorized(false);
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [isAuthenticated, accounts, inProgress, instance]);

  const login = async () => {
    try {
      setAuthError(null);
      const response = await instance.loginPopup(loginRequest);
      
      if (response.account) {
        const email = getUserEmail(response.account);
        
        if (!isAllowedDomain(email)) {
          setAuthError(`Access denied. Only @${ALLOWED_DOMAIN} accounts are allowed.`);
          await instance.logoutPopup({ account: response.account });
          return false;
        }
        
        instance.setActiveAccount(response.account);
        return true;
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.errorCode !== 'user_cancelled') {
        setAuthError(error.message || 'Login failed. Please try again.');
      }
      return false;
    }
  };

  const logout = async () => {
    try {
      await instance.logoutPopup();
      setUser(null);
      setIsAuthorized(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: isAuthorized,
    isLoading: isLoading || inProgress !== InteractionStatus.None,
    authError,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Main Auth Provider wrapper
export function AuthProvider({ children }) {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthProviderInner>{children}</AuthProviderInner>
    </MsalProvider>
  );
}

export default AuthProvider;


