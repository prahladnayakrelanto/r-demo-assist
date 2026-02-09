// API Configuration
// Auto-detect production vs development
const getApiUrl = () => {
  // If explicitly set via environment variable, use that
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (non-localhost), use the same origin with /api path
  // Nginx proxies /api to the backend
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return `${window.location.origin}/api`;
  }
  
  // Default for local development
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiUrl();

// Helper function for API calls
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
}

// ============================================
// ACCELERATORS API
// ============================================

export const acceleratorsApi = {
  // Get all accelerators
  getAll: () => fetchApi('/accelerators'),
  
  // Get single accelerator
  getById: (id) => fetchApi(`/accelerators/${id}`),
  
  // Create accelerator
  create: (data) => fetchApi('/accelerators', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update accelerator
  update: (id, data) => fetchApi(`/accelerators/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete accelerator
  delete: (id) => fetchApi(`/accelerators/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// SLIDE DECKS API
// ============================================

export const slideDecksApi = {
  // Get all slide decks
  getAll: () => fetchApi('/slidedecks'),
  
  // Get single slide deck
  getById: (id) => fetchApi(`/slidedecks/${id}`),
  
  // Create slide deck
  create: (data) => fetchApi('/slidedecks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update slide deck
  update: (id, data) => fetchApi(`/slidedecks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete slide deck
  delete: (id) => fetchApi(`/slidedecks/${id}`, {
    method: 'DELETE',
  }),
  
  // Upload PPTX file and create slide deck
  upload: async (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('pptx', file);
    
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    if (metadata.category) formData.append('category', metadata.category);
    if (metadata.keywords) formData.append('keywords', JSON.stringify(metadata.keywords));
    
    const response = await fetch(`${API_BASE_URL}/slidedecks/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, let browser set it with boundary
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || `Upload failed: ${response.status}`);
    }
    
    return response.json();
  },
  
  // Re-extract slides from existing deck
  reExtract: (id) => fetchApi(`/slidedecks/${id}/extract`, {
    method: 'POST',
  }),
};

// ============================================
// VIDEOS API
// ============================================

export const videosApi = {
  // Get all videos
  getAll: () => fetchApi('/videos'),
  
  // Get single video
  getById: (id) => fetchApi(`/videos/${id}`),
  
  // Create video
  create: (data) => fetchApi('/videos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update video
  update: (id, data) => fetchApi(`/videos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete video
  delete: (id) => fetchApi(`/videos/${id}`, {
    method: 'DELETE',
  }),
};

// ============================================
// USER PREFERENCES API
// ============================================

export const userPreferencesApi = {
  // Get user preferences
  get: (email) => fetchApi(`/user-preferences/${encodeURIComponent(email)}`),
  
  // Update all user preferences
  update: (email, data) => fetchApi(`/user-preferences/${encodeURIComponent(email)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Partial update of preferences
  patch: (email, data) => fetchApi(`/user-preferences/${encodeURIComponent(email)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  
  // Playlist operations
  playlists: {
    create: (email, name) => fetchApi(`/user-preferences/${encodeURIComponent(email)}/playlists`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),
    
    update: (email, playlistId, data) => fetchApi(`/user-preferences/${encodeURIComponent(email)}/playlists/${playlistId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    
    delete: (email, playlistId) => fetchApi(`/user-preferences/${encodeURIComponent(email)}/playlists/${playlistId}`, {
      method: 'DELETE',
    }),
    
    toggleAccelerator: (email, playlistId, acceleratorId) => 
      fetchApi(`/user-preferences/${encodeURIComponent(email)}/playlists/${playlistId}/toggle/${acceleratorId}`, {
        method: 'POST',
      }),
  },
  
  // Hidden accelerators operations
  hidden: {
    update: (email, hiddenAccelerators) => fetchApi(`/user-preferences/${encodeURIComponent(email)}/hidden`, {
      method: 'PUT',
      body: JSON.stringify({ hiddenAccelerators }),
    }),
  },
  
  // Accelerator order operations
  order: {
    update: (email, acceleratorOrder) => fetchApi(`/user-preferences/${encodeURIComponent(email)}/order`, {
      method: 'PUT',
      body: JSON.stringify({ acceleratorOrder }),
    }),
  },
};

export default {
  accelerators: acceleratorsApi,
  slideDecks: slideDecksApi,
  videos: videosApi,
  userPreferences: userPreferencesApi,
};

