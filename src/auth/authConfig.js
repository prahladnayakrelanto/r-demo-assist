// Microsoft Authentication Library (MSAL) Configuration
// For Azure AD / Microsoft Entra ID authentication

export const msalConfig = {
  auth: {
    clientId: "44926941-a7b6-4daf-80c0-5aa20afa29bd", // Application (client) ID
    authority: "https://login.microsoftonline.com/e0d55dd0-7e8b-45fb-9c81-c4ad071c91dd", // Tenant ID
    redirectUri: window.location.origin, // Automatically uses current origin
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage", // Use sessionStorage for better security
    storeAuthStateInCookie: false,
  },
};

// Scopes for the access token
export const loginRequest = {
  scopes: ["User.Read", "openid", "profile", "email"],
};

// Allowed email domain - only @relanto.ai users can access
export const ALLOWED_DOMAIN = "relanto.ai";

// Check if email is from allowed domain
export const isAllowedDomain = (email) => {
  if (!email) return false;
  const domain = email.split("@")[1]?.toLowerCase();
  return domain === ALLOWED_DOMAIN;
};

// Get user display name from account
export const getUserDisplayName = (account) => {
  if (!account) return "User";
  return account.name || account.username?.split("@")[0] || "User";
};

// Get user email from account
export const getUserEmail = (account) => {
  if (!account) return null;
  return account.username || null;
};



