import React, { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  Users,
  FileText,
  DollarSign,
  BarChart3,
  Map,
  Settings,
  Shield,
  Cloud,
  CreditCard,
  Wallet,
  Activity,
  Search,
  ExternalLink,
  Database,
  TestTube,
  LayoutGrid,
  Presentation,
  Lock,
  LogOut,
  User,
  GripVertical,
  RotateCcw,
  Sun,
  Moon,
  EyeOff,
  Eye,
  ListPlus,
  FolderPlus,
  X,
  Check,
  Trash2,
  Edit2,
  Plus,
  List,
  PlayCircle
} from 'lucide-react';
import './Dashboard.css';
import PPTSearch from './PPTSearch';
import AdminPanel from './AdminPanel';
import VideoGallery from './VideoGallery';
import UserGuide from './UserGuide';
import { acceleratorsApi, userPreferencesApi } from '../services/api';
import { useAuth } from '../auth/AuthProvider';

// Icon mapping for dynamic rendering
const iconMap = {
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Activity,
  Map,
  Settings,
  BarChart3,
  Cloud,
  Wallet,
  CreditCard,
  Shield,
  Database,
  TestTube
};

// Category to icon mapping
const categoryIconMap = {
  'Sales & Revenue': DollarSign,
  'Planning & Forecasting': TrendingUp,
  'Partnership & Collaboration': Users,
  'Document Intelligence': FileText,
  'Analytics & Insights': Activity,
  'Financial Services': BarChart3,
  'Infrastructure & Cloud': Cloud,
  'Customer Support': Wallet,
  'Testing & Quality': Shield,
  'Enterprise Solutions': Database
};

const defaultAccelerators = [
  {
    id: 1,
    name: 'SalesAssist (2024)',
    link: 'http://13.233.75.226:5174/',
    description: 'Gen AI powered integration of existing workflows to deliver personalized recommendations and actionable insights',
    icon: DollarSign,
    category: 'Sales & Revenue'
  },
  {
    id: 2,
    name: 'TrendAssist',
    link: 'https://demand-planning-ui-prod.aifirstlabs-relanto.com/',
    description: 'Demand planning with time series prediction using mobile data for accurate forecasting',
    icon: TrendingUp,
    category: 'Planning & Forecasting'
  },
  {
    id: 3,
    name: 'PartnerAssist',
    link: 'https://partner-finder-ui-prod.aifirstlabs-relanto.com/',
    description: 'Intelligent partner matching based on performance metrics and RFP analysis',
    icon: Users,
    category: 'Partnership & Collaboration'
  },
  {
    id: 4,
    name: 'LoanBook',
    link: 'https://loanbook-ui-prod.aifirstlabs-relanto.com/',
    description: 'Transform unstructured loan documents into structured insights with AI extraction',
    icon: FileText,
    category: 'Document Intelligence'
  },
  {
    id: 5,
    name: 'Theatre Footfall',
    link: 'http://13.233.75.226:8088/',
    description: 'Time series analytics for footfall analysis and prediction to optimize operations',
    icon: Activity,
    category: 'Analytics & Insights'
  },
  {
    id: 6,
    name: 'Cluster & Opportunity Visualization',
    link: 'http://13.233.75.226:3000/',
    description: 'Visual analytics for cluster identification and opportunity mapping',
    icon: Map,
    category: 'Analytics & Insights'
  },
  {
    id: 7,
    name: 'Anaplan Embedded Model',
    link: 'http://13.233.75.226:5000',
    description: 'Enterprise planning platform for intelligent forecasting and scenario analysis',
    icon: Settings,
    category: 'Planning & Forecasting'
  },
  {
    id: 8,
    name: 'SalesAssist (New 2025)',
    link: 'https://salesone-ui-prod.aifirstlabs-relanto.com/',
    description: 'Next-gen revenue intelligence with real-time insights and smarter forecasting',
    icon: DollarSign,
    category: 'Sales & Revenue'
  },
  {
    id: 9,
    name: 'FinAssist',
    link: 'https://fincopilot-ui-prod.aifirstlabs-relanto.com/',
    description: 'Gen-AI powered financial securities investment analysis for smarter decisions',
    icon: BarChart3,
    category: 'Financial Services'
  },
  {
    id: 10,
    name: 'InfraAssist',
    link: 'https://infragpt-ui-prod.aifirstlabs-relanto.com/',
    description: 'AI-powered cloud infrastructure usage analytics and intelligent query system',
    icon: Cloud,
    category: 'Infrastructure & Cloud'
  },
  {
    id: 11,
    name: 'CaseAssist (Bank Balance)',
    link: 'https://caseassist-ui-prod.aifirstlabs-relanto.com/',
    description: 'Autonomous case resolution for bank balance queries with unified knowledge',
    icon: Wallet,
    category: 'Customer Support'
  },
  {
    id: 12,
    name: 'CaseAssist (Credit Card)',
    link: 'https://caseassist2.0-ui-prod.aifirstlabs-relanto.com/',
    description: 'Intelligent agent for credit card upgrade details and support automation',
    icon: CreditCard,
    category: 'Customer Support'
  },
  {
    id: 13,
    name: 'LiveMeasure',
    link: 'https://livemeasure-ui-prod.aifirstlabs-relanto.com',
    description: 'GroundTruth verification and observability for AI model performance monitoring',
    icon: Shield,
    category: 'Testing & Quality'
  }
];

const categories = [
  'All',
  'Sales & Revenue',
  'Financial Services',
  'Customer Support',
  'Analytics & Insights',
  'Planning & Forecasting',
  'Infrastructure & Cloud',
  'Document Intelligence',
  'Partnership & Collaboration',
  'Testing & Quality',
  'Enterprise Solutions'
];

// Admin users who can access the Admin panel
const ADMIN_USERS = [
  'prahlad.nayak@relanto.ai',
  'pooja.pura@relanto.ai',
  'ynayak@relanto.ai'
];

function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('accelerators');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredCard, setHoveredCard] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [accelerators, setAccelerators] = useState([]);
  const [theme, setTheme] = useState(() => {
    // Load theme from localStorage or default to 'dark'
    return localStorage.getItem('theme') || 'dark';
  });
  const [orderedAccelerators, setOrderedAccelerators] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [hasCustomOrder, setHasCustomOrder] = useState(false);
  const [userHiddenAccelerators, setUserHiddenAccelerators] = useState([]);
  const [acceleratorOrder, setAcceleratorOrder] = useState([]);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const dragNode = useRef(null);

  // Check if current user is an admin
  const isAdmin = user?.email && ADMIN_USERS.includes(user.email.toLowerCase());

  // ========== USER PREFERENCES (Backend Storage) ==========
  
  // Load all user preferences from backend
  const loadUserPreferences = async () => {
    if (!user?.email) {
      setUserHiddenAccelerators([]);
      setPlaylists([]);
      setAcceleratorOrder([]);
      setHasCustomOrder(false);
      setPreferencesLoaded(true);
      return;
    }
    
    try {
      const prefs = await userPreferencesApi.get(user.email);
      setUserHiddenAccelerators(prefs.hiddenAccelerators || []);
      setPlaylists(prefs.playlists || []);
      setAcceleratorOrder(prefs.acceleratorOrder || []);
      setHasCustomOrder((prefs.acceleratorOrder || []).length > 0);
      setPreferencesLoaded(true);
    } catch (error) {
      console.error('Failed to load user preferences:', error);
      setUserHiddenAccelerators([]);
      setPlaylists([]);
      setAcceleratorOrder([]);
      setHasCustomOrder(false);
      setPreferencesLoaded(true);
    }
  };

  // Hide an accelerator for the current user
  const hideAccelerator = async (e, acceleratorId) => {
    e.stopPropagation(); // Prevent card click
    if (!user?.email) return;
    
    const newHidden = [...userHiddenAccelerators, acceleratorId];
    setUserHiddenAccelerators(newHidden);
    
    try {
      await userPreferencesApi.hidden.update(user.email, newHidden);
    } catch (error) {
      console.error('Failed to hide accelerator:', error);
      // Revert on error
      setUserHiddenAccelerators(userHiddenAccelerators);
    }
  };

  // Reset all hidden accelerators for the current user
  const resetHiddenAccelerators = async () => {
    if (!user?.email) return;
    
    const prevHidden = [...userHiddenAccelerators];
    setUserHiddenAccelerators([]);
    
    try {
      await userPreferencesApi.hidden.update(user.email, []);
    } catch (error) {
      console.error('Failed to reset hidden accelerators:', error);
      setUserHiddenAccelerators(prevHidden);
    }
  };

  // ========== PLAYLIST MANAGEMENT (Backend Storage) ==========
  const [playlists, setPlaylists] = useState([]);
  const [showPlaylistManager, setShowPlaylistManager] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null); // null = show all
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(null); // accelerator id being added
  const [editingPlaylist, setEditingPlaylist] = useState(null);

  // Create a new playlist
  const createPlaylist = async (name) => {
    if (!user?.email) return null;
    
    try {
      const newPlaylist = await userPreferencesApi.playlists.create(user.email, name);
      setPlaylists([...playlists, newPlaylist]);
      return newPlaylist;
    } catch (error) {
      console.error('Failed to create playlist:', error);
      return null;
    }
  };

  // Update playlist name
  const updatePlaylistName = async (playlistId, newName) => {
    if (!user?.email) return;
    
    const prevPlaylists = [...playlists];
    setPlaylists(playlists.map(p => 
      p.id === playlistId ? { ...p, name: newName.trim() } : p
    ));
    
    try {
      await userPreferencesApi.playlists.update(user.email, playlistId, { name: newName.trim() });
    } catch (error) {
      console.error('Failed to update playlist:', error);
      setPlaylists(prevPlaylists);
    }
  };

  // Delete a playlist
  const deletePlaylist = async (playlistId) => {
    if (!user?.email) return;
    
    const prevPlaylists = [...playlists];
    setPlaylists(playlists.filter(p => p.id !== playlistId));
    if (selectedPlaylist === playlistId) {
      setSelectedPlaylist(null);
    }
    
    try {
      await userPreferencesApi.playlists.delete(user.email, playlistId);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      setPlaylists(prevPlaylists);
    }
  };

  // Toggle accelerator in playlist
  const toggleAcceleratorInPlaylist = async (playlistId, acceleratorId) => {
    if (!user?.email) return;
    
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    const isInPlaylist = playlist.acceleratorIds.includes(acceleratorId);
    const prevPlaylists = [...playlists];
    
    // Optimistic update
    setPlaylists(playlists.map(p => {
      if (p.id === playlistId) {
        return {
          ...p,
          acceleratorIds: isInPlaylist
            ? p.acceleratorIds.filter(id => id !== acceleratorId)
            : [...p.acceleratorIds, acceleratorId]
        };
      }
      return p;
    }));
    
    try {
      const updatedPlaylist = await userPreferencesApi.playlists.toggleAccelerator(
        user.email, 
        playlistId, 
        acceleratorId
      );
      // Update with server response
      setPlaylists(playlists.map(p => p.id === playlistId ? updatedPlaylist : p));
    } catch (error) {
      console.error('Failed to toggle accelerator in playlist:', error);
      setPlaylists(prevPlaylists);
    }
  };

  // Check if accelerator is in any playlist
  const getAcceleratorPlaylists = (acceleratorId) => {
    return playlists.filter(p => p.acceleratorIds.includes(acceleratorId));
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Load accelerators from API
  useEffect(() => {
    loadAccelerators();
  }, []);

  // Load user preferences when user changes
  useEffect(() => {
    loadUserPreferences();
  }, [user]);

  // Apply user's custom order when accelerators or preferences load
  useEffect(() => {
    if (accelerators.length > 0 && preferencesLoaded) {
      applyUserOrder();
    }
  }, [accelerators, acceleratorOrder, preferencesLoaded]);

  const loadAccelerators = async () => {
    try {
      const data = await acceleratorsApi.getAll();
      setAccelerators(data);
    } catch (error) {
      console.error('Failed to load accelerators from server:', error);
      // Fallback to default data
      setAccelerators(defaultAccelerators);
    }
  };

  // Apply user's saved order to accelerators
  const applyUserOrder = () => {
    if (!user?.email) {
      setOrderedAccelerators(accelerators);
      setHasCustomOrder(false);
      return;
    }

    if (acceleratorOrder.length > 0) {
      // Reorder accelerators based on saved order
      const ordered = [...accelerators].sort((a, b) => {
        const indexA = acceleratorOrder.indexOf(a.id);
        const indexB = acceleratorOrder.indexOf(b.id);
        // Put items not in saved order at the end
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
      setOrderedAccelerators(ordered);
      setHasCustomOrder(true);
    } else {
      setOrderedAccelerators(accelerators);
      setHasCustomOrder(false);
    }
  };

  // Save user's order preference
  const saveUserOrder = async (newOrder) => {
    if (!user?.email) return;
    
    const orderIds = newOrder.map(acc => acc.id);
    setAcceleratorOrder(orderIds);
    setHasCustomOrder(true);
    
    try {
      await userPreferencesApi.order.update(user.email, orderIds);
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  // Reset to default order
  const resetOrder = async () => {
    if (!user?.email) return;
    
    setAcceleratorOrder([]);
    setOrderedAccelerators(accelerators);
    setHasCustomOrder(false);
    
    try {
      await userPreferencesApi.order.update(user.email, []);
    } catch (error) {
      console.error('Failed to reset order:', error);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, index, accelerator) => {
    dragNode.current = e.target;
    setDraggedItem({ index, accelerator });
    
    // Add dragging class after a small delay
    setTimeout(() => {
      e.target.classList.add('dragging');
    }, 0);
    
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    if (draggedItem?.index !== index) {
      setDragOverItem(index);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e) => {
    // Only reset if leaving the card entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedItem && draggedItem.index !== dropIndex) {
      const newOrder = [...orderedAccelerators];
      const [draggedAcc] = newOrder.splice(draggedItem.index, 1);
      newOrder.splice(dropIndex, 0, draggedAcc);
      
      setOrderedAccelerators(newOrder);
      saveUserOrder(newOrder);
    }
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedItem(null);
    setDragOverItem(null);
  };

  // Refresh data when admin panel closes
  const handleAdminClose = () => {
    setShowAdmin(false);
    loadAccelerators();
  };

  const filteredAccelerators = orderedAccelerators.filter(acc => {
    // Hide hidden accelerators for everyone (manage visibility only in Admin Panel)
    if (acc.hidden) return false;
    
    // Hide user-hidden accelerators (personal preference stored in localStorage)
    if (userHiddenAccelerators.includes(acc.id)) return false;
    
    // Filter by selected playlist
    if (selectedPlaylist) {
      const playlist = playlists.find(p => p.id === selectedPlaylist);
      if (playlist && !playlist.acceleratorIds.includes(acc.id)) return false;
    }
    
    const matchesCategory = selectedCategory === 'All' || acc.category === selectedCategory;
    const matchesSearch = acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         acc.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Count of user-hidden accelerators (for showing reset button)
  const userHiddenCount = userHiddenAccelerators.length;
  
  // Get selected playlist name for display
  const selectedPlaylistName = selectedPlaylist 
    ? playlists.find(p => p.id === selectedPlaylist)?.name 
    : null;

  // Check if drag-drop should be enabled (only when showing all and no search)
  const canReorder = selectedCategory === 'All' && searchTerm === '';

  const handleCardClick = (link) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        {/* Left - Relanto Logo */}
        <div className="header-left">
          <img 
            src="https://cdn.prod.website-files.com/667e468094796a0d45a94aa4/6687845edf77ac3cc383dad3_footer_logo.svg" 
            alt="Relanto Logo" 
            className="relanto-logo"
          />
        </div>

        {/* Center - Spacer */}
        <div className="header-center"></div>

        {/* Right - User & Actions */}
        <div className="header-right">
          <div className="user-info">
            <div className="user-avatar">
              {user?.photo ? (
                <img src={user.photo} alt={user.name} className="user-photo" />
              ) : (
                <User size={18} />
              )}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-email">{user?.email || ''}</span>
            </div>
          </div>
          <button 
            className="playlist-btn" 
            onClick={() => setShowPlaylistManager(true)} 
            title="Manage Playlists"
          >
            <List size={18} />
            <span>Playlists</span>
            {playlists.length > 0 && <span className="playlist-count-badge">{playlists.length}</span>}
          </button>
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAdmin && (
            <button className="admin-btn" onClick={() => setShowAdmin(true)} title="Admin Panel">
              <Lock size={18} />
              <span>Admin</span>
            </button>
          )}
          <button className="logout-btn" onClick={logout} title="Sign Out">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'accelerators' ? 'active' : ''}`}
          onClick={() => setActiveTab('accelerators')}
        >
          <LayoutGrid size={20} />
          Accelerators
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ppt-search' ? 'active' : ''}`}
          onClick={() => setActiveTab('ppt-search')}
        >
          <Presentation size={20} />
          Case Studies
        </button>
        <button 
          className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          <PlayCircle size={20} />
          Demo Videos
        </button>
      </div>

      {activeTab === 'ppt-search' ? (
        <PPTSearch />
      ) : activeTab === 'videos' ? (
        <VideoGallery />
      ) : (
      <div className="accelerators-section">

        <div className="search-controls search-section">
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search accelerators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="reorder-controls">
            {canReorder && (
              <span className="reorder-hint">
                <GripVertical size={16} />
                Drag cards to reorder
              </span>
            )}
            {hasCustomOrder && (
              <button className="reset-order-btn" onClick={resetOrder} title="Reset to default order">
                <RotateCcw size={16} />
                Reset Order
              </button>
            )}
            {userHiddenCount > 0 && (
              <button className="reset-hidden-btn" onClick={resetHiddenAccelerators} title="Show all hidden accelerators">
                <Eye size={16} />
                Show Hidden ({userHiddenCount})
              </button>
            )}
          </div>
        </div>

        {/* Playlist Filter */}
        {playlists.length > 0 && (
          <div className="playlist-filter">
            <span className="filter-label">
              <List size={16} />
              Filter by Playlist:
            </span>
            <div className="playlist-tabs">
              <button
                className={`playlist-tab ${selectedPlaylist === null ? 'active' : ''}`}
                onClick={() => setSelectedPlaylist(null)}
              >
                All Accelerators
              </button>
              {playlists.map(playlist => (
                <button
                  key={playlist.id}
                  className={`playlist-tab ${selectedPlaylist === playlist.id ? 'active' : ''}`}
                  onClick={() => setSelectedPlaylist(playlist.id)}
                >
                  {playlist.name}
                  <span className="tab-count">{playlist.acceleratorIds.length}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="categories categories-section">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>


      <div className="accelerators-grid">
        {filteredAccelerators.map((accelerator, index) => {
          // Get icon from category mapping or use default
          const Icon = categoryIconMap[accelerator.category] || Database;
          const actualIndex = orderedAccelerators.findIndex(a => a.id === accelerator.id);
          const isDragOver = dragOverItem === actualIndex;
          
          return (
            <div
              key={accelerator.id}
              className={`accelerator-card ${hoveredCard === accelerator.id ? 'hovered' : ''} ${canReorder ? 'draggable' : ''} ${isDragOver ? 'drag-over' : ''}`}
              onMouseEnter={() => setHoveredCard(accelerator.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleCardClick(accelerator.link)}
              draggable={canReorder}
              onDragStart={(e) => canReorder && handleDragStart(e, actualIndex, accelerator)}
              onDragEnter={(e) => canReorder && handleDragEnter(e, actualIndex)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => canReorder && handleDrop(e, actualIndex)}
              onDragEnd={handleDragEnd}
            >
              {canReorder && (
                <div className="drag-handle" title="Drag to reorder">
                  <GripVertical size={14} />
                </div>
              )}
              <div className="card-action-buttons">
                <button 
                  className="add-to-playlist-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddToPlaylist(accelerator.id);
                  }}
                  title="Add to playlist"
                >
                  <ListPlus size={14} />
                  {getAcceleratorPlaylists(accelerator.id).length > 0 && (
                    <span className="in-playlist-badge">{getAcceleratorPlaylists(accelerator.id).length}</span>
                  )}
                </button>
                <button 
                  className="hide-card-btn" 
                  onClick={(e) => hideAccelerator(e, accelerator.id)}
                  title="Hide this accelerator"
                >
                  <EyeOff size={14} />
                </button>
              </div>
              <div className="card-header">
                <div className="icon-container">
                  <Icon className="card-icon" />
                </div>
                <span className="category-badge">
                  {accelerator.category}
                </span>
              </div>
              
              <h3 className="card-title">{accelerator.name}</h3>
              <p className="card-description">{accelerator.description}</p>
              
              <div className="card-footer">
                <span className="link-text">Open Accelerator</span>
                <ExternalLink className="external-icon" />
              </div>
            </div>
          );
        })}
      </div>

        {filteredAccelerators.length === 0 && (
          <div className="no-results">
            <Search size={48} />
            <h3>No accelerators found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
      )}

      {/* Admin Panel - Only for admin users */}
      {showAdmin && isAdmin && <AdminPanel onClose={handleAdminClose} />}

      {/* Playlist Manager Modal */}
      {showPlaylistManager && (
        <PlaylistManager
          playlists={playlists}
          accelerators={orderedAccelerators.filter(a => !a.hidden && !userHiddenAccelerators.includes(a.id))}
          onClose={() => {
            setShowPlaylistManager(false);
            setEditingPlaylist(null);
          }}
          onCreate={createPlaylist}
          onUpdate={updatePlaylistName}
          onDelete={deletePlaylist}
          onToggleAccelerator={toggleAcceleratorInPlaylist}
          editingPlaylist={editingPlaylist}
          setEditingPlaylist={setEditingPlaylist}
        />
      )}

      {/* Add to Playlist Popup */}
      {showAddToPlaylist && (
        <AddToPlaylistPopup
          acceleratorId={showAddToPlaylist}
          acceleratorName={orderedAccelerators.find(a => a.id === showAddToPlaylist)?.name}
          playlists={playlists}
          onClose={() => setShowAddToPlaylist(null)}
          onToggle={toggleAcceleratorInPlaylist}
          onCreate={createPlaylist}
        />
      )}

      {/* Interactive User Guide */}
      <UserGuide isAdmin={isAdmin} />
    </div>
  );
}

// Playlist Manager Modal Component
function PlaylistManager({ 
  playlists, 
  accelerators, 
  onClose, 
  onCreate, 
  onUpdate, 
  onDelete, 
  onToggleAccelerator,
  editingPlaylist,
  setEditingPlaylist 
}) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editName, setEditName] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(playlists[0]?.id || null);

  const selectedPlaylist = playlists.find(p => p.id === selectedPlaylistId);

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      const newPlaylist = onCreate(newPlaylistName);
      setNewPlaylistName('');
      setSelectedPlaylistId(newPlaylist.id);
    }
  };

  const handleStartEdit = (playlist) => {
    setEditingPlaylist(playlist.id);
    setEditName(playlist.name);
  };

  const handleSaveEdit = (playlistId) => {
    if (editName.trim()) {
      onUpdate(playlistId, editName);
    }
    setEditingPlaylist(null);
  };

  return (
    <div className="playlist-manager-overlay" onClick={onClose}>
      <div className="playlist-manager" onClick={e => e.stopPropagation()}>
        <div className="playlist-manager-header">
          <h2><List size={24} /> My Playlists</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="playlist-manager-content">
          {/* Left Panel - Playlist List */}
          <div className="playlist-list-panel">
            <div className="create-playlist-form">
              <input
                type="text"
                placeholder="New playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button onClick={handleCreate} disabled={!newPlaylistName.trim()}>
                <Plus size={18} />
              </button>
            </div>

            <div className="playlist-items">
              {playlists.length === 0 ? (
                <div className="no-playlists">
                  <FolderPlus size={32} />
                  <p>No playlists yet</p>
                  <span>Create your first playlist above</span>
                </div>
              ) : (
                playlists.map(playlist => (
                  <div 
                    key={playlist.id}
                    className={`playlist-item ${selectedPlaylistId === playlist.id ? 'active' : ''}`}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                  >
                    {editingPlaylist === playlist.id ? (
                      <div className="playlist-edit-form">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(playlist.id)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                        <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(playlist.id); }}>
                          <Check size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingPlaylist(null); }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="playlist-item-info">
                          <span className="playlist-name">{playlist.name}</span>
                          <span className="playlist-count">{playlist.acceleratorIds.length} accelerators</span>
                        </div>
                        <div className="playlist-item-actions">
                          <button onClick={(e) => { e.stopPropagation(); handleStartEdit(playlist); }} title="Edit name">
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              if (window.confirm(`Delete "${playlist.name}"?`)) {
                                onDelete(playlist.id);
                                if (selectedPlaylistId === playlist.id) {
                                  setSelectedPlaylistId(playlists.find(p => p.id !== playlist.id)?.id || null);
                                }
                              }
                            }} 
                            title="Delete playlist"
                            className="delete-btn"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Accelerator Selection */}
          <div className="accelerator-selection-panel">
            {selectedPlaylist ? (
              <>
                <h3>Select accelerators for "{selectedPlaylist.name}"</h3>
                <div className="accelerator-checklist">
                  {accelerators.map(acc => (
                    <label key={acc.id} className="accelerator-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPlaylist.acceleratorIds.includes(acc.id)}
                        onChange={() => onToggleAccelerator(selectedPlaylist.id, acc.id)}
                      />
                      <span className="checkbox-custom"></span>
                      <div className="accelerator-checkbox-info">
                        <span className="acc-name">{acc.name}</span>
                        <span className="acc-category">{acc.category}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-playlist-selected">
                <List size={48} />
                <p>Select a playlist to manage its accelerators</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add to Playlist Popup Component
function AddToPlaylistPopup({ acceleratorId, acceleratorName, playlists, onClose, onToggle, onCreate }) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = () => {
    if (newPlaylistName.trim()) {
      const newPlaylist = onCreate(newPlaylistName);
      onToggle(newPlaylist.id, acceleratorId);
      setNewPlaylistName('');
      setShowCreate(false);
    }
  };

  return (
    <div className="add-to-playlist-overlay" onClick={onClose}>
      <div className="add-to-playlist-popup" onClick={e => e.stopPropagation()}>
        <div className="popup-header">
          <h3>Add to Playlist</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <p className="popup-subtitle">"{acceleratorName}"</p>
        
        <div className="playlist-options">
          {playlists.length === 0 && !showCreate ? (
            <div className="no-playlists-message">
              <p>No playlists yet</p>
            </div>
          ) : (
            playlists.map(playlist => (
              <label key={playlist.id} className="playlist-option">
                <input
                  type="checkbox"
                  checked={playlist.acceleratorIds.includes(acceleratorId)}
                  onChange={() => onToggle(playlist.id, acceleratorId)}
                />
                <span className="checkbox-custom"></span>
                <span>{playlist.name}</span>
                <span className="count">({playlist.acceleratorIds.length})</span>
              </label>
            ))
          )}
        </div>

        {showCreate ? (
          <div className="create-new-playlist">
            <input
              type="text"
              placeholder="Playlist name..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
            <div className="create-actions">
              <button onClick={handleCreate} disabled={!newPlaylistName.trim()} className="save-btn">
                <Check size={14} /> Create
              </button>
              <button onClick={() => setShowCreate(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button className="create-playlist-btn" onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Create New Playlist
          </button>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

