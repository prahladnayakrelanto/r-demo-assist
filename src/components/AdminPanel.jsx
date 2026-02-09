import React, { useState, useEffect } from 'react';
import {
  Settings,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Upload,
  FileText,
  Link,
  Tag,
  Layers,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  Presentation,
  LayoutGrid,
  RefreshCw,
  Loader
} from 'lucide-react';
import './AdminPanel.css';
import { acceleratorsApi, slideDecksApi } from '../services/api';

// Default accelerators (fallback)
const defaultAccelerators = [
  {
    id: 1,
    name: 'SalesAssist (2024)',
    link: 'http://13.233.75.226:5174/',
    description: 'Gen AI powered integration of existing workflows to deliver personalized recommendations and actionable insights',
    category: 'Sales & Revenue'
  },
  {
    id: 2,
    name: 'TrendAssist',
    link: 'https://demand-planning-ui-prod.aifirstlabs-relanto.com/',
    description: 'Demand planning with time series prediction using mobile data for accurate forecasting',
    category: 'Planning & Forecasting'
  },
  {
    id: 3,
    name: 'PartnerAssist',
    link: 'https://partner-finder-ui-prod.aifirstlabs-relanto.com/',
    description: 'Intelligent partner matching based on performance metrics and RFP analysis',
    category: 'Partnership & Collaboration'
  },
  {
    id: 4,
    name: 'LoanBook',
    link: 'https://loanbook-ui-prod.aifirstlabs-relanto.com/',
    description: 'Transform unstructured loan documents into structured insights with AI extraction',
    category: 'Document Intelligence'
  },
  {
    id: 5,
    name: 'Theatre Footfall',
    link: 'http://13.233.75.226:8088/',
    description: 'Time series analytics for footfall analysis and prediction to optimize operations',
    category: 'Analytics & Insights'
  },
  {
    id: 6,
    name: 'Cluster & Opportunity Visualization',
    link: 'http://13.233.75.226:3000/',
    description: 'Visual analytics for cluster identification and opportunity mapping',
    category: 'Analytics & Insights'
  },
  {
    id: 7,
    name: 'Anaplan Embedded Model',
    link: 'http://13.233.75.226:5000',
    description: 'Enterprise planning platform for intelligent forecasting and scenario analysis',
    category: 'Planning & Forecasting'
  },
  {
    id: 8,
    name: 'SalesAssist (New 2025)',
    link: 'https://salesone-ui-prod.aifirstlabs-relanto.com/',
    description: 'Next-gen revenue intelligence with real-time insights and smarter forecasting',
    category: 'Sales & Revenue'
  },
  {
    id: 9,
    name: 'FinAssist',
    link: 'https://fincopilot-ui-prod.aifirstlabs-relanto.com/',
    description: 'Gen-AI powered financial securities investment analysis for smarter decisions',
    category: 'Financial Services'
  },
  {
    id: 10,
    name: 'InfraAssist',
    link: 'https://infragpt-ui-prod.aifirstlabs-relanto.com/',
    description: 'AI-powered cloud infrastructure usage analytics and intelligent query system',
    category: 'Infrastructure & Cloud'
  },
  {
    id: 11,
    name: 'CaseAssist (Bank Balance)',
    link: 'https://caseassist-ui-prod.aifirstlabs-relanto.com/',
    description: 'Autonomous case resolution for bank balance queries with unified knowledge',
    category: 'Customer Support'
  },
  {
    id: 12,
    name: 'CaseAssist (Credit Card)',
    link: 'https://caseassist2.0-ui-prod.aifirstlabs-relanto.com/',
    description: 'Intelligent agent for credit card upgrade details and support automation',
    category: 'Customer Support'
  },
  {
    id: 13,
    name: 'LiveMeasure',
    link: 'https://livemeasure-ui-prod.aifirstlabs-relanto.com',
    description: 'GroundTruth verification and observability for AI model performance monitoring',
    category: 'Testing & Quality'
  }
];

// Default slide decks
const defaultSlideDecks = [
  {
    id: 1,
    title: 'Data & Analytics Case Studies',
    description: 'Comprehensive collection of Data & Analytics case studies showcasing AI-powered business intelligence, predictive analytics, demand forecasting, and data-driven decision making solutions for enterprises.',
    category: 'Analytics & Insights',
    slides: 16,
    slidesFolder: 'Repository-Data-and-Analytics--Case-Studies',
    fileUrl: '/presentations/Data-Analytics-Case-Studies.pptx',
    keywords: ['data', 'analytics', 'case study', 'business intelligence', 'BI', 'predictive analytics', 'forecasting']
  },
  {
    id: 2,
    title: 'AI Case Studies',
    description: 'Repository of AI implementation case studies covering machine learning, generative AI, natural language processing, computer vision, and intelligent automation solutions across various industries.',
    category: 'Enterprise Solutions',
    slides: 15,
    slidesFolder: 'Repository-AI-Case-Studies-1',
    fileUrl: '/presentations/AI-Case-Studies.pptx',
    keywords: ['AI', 'artificial intelligence', 'machine learning', 'ML', 'generative AI', 'GenAI', 'LLM']
  }
];

const categories = [
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

function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('accelerators');
  const [accelerators, setAccelerators] = useState([]);
  const [slideDecks, setSlideDecks] = useState([]);
  const [editingAccelerator, setEditingAccelerator] = useState(null);
  const [editingSlideDeck, setEditingSlideDeck] = useState(null);
  const [showAcceleratorForm, setShowAcceleratorForm] = useState(false);
  const [showSlideDeckForm, setShowSlideDeckForm] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load data from API on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [acceleratorsData, slideDecksData] = await Promise.all([
        acceleratorsApi.getAll(),
        slideDecksApi.getAll()
      ]);
      setAccelerators(acceleratorsData);
      setSlideDecks(slideDecksData);
    } catch (error) {
      console.error('Failed to load data from server:', error);
      showNotification('Failed to connect to server. Using cached data.', 'error');
      // Fallback to localStorage if server is not available
      const savedAccelerators = localStorage.getItem('accelerators');
      const savedSlideDecks = localStorage.getItem('slideDecks');
      setAccelerators(savedAccelerators ? JSON.parse(savedAccelerators) : defaultAccelerators);
      setSlideDecks(savedSlideDecks ? JSON.parse(savedSlideDecks) : defaultSlideDecks);
    } finally {
      setLoading(false);
    }
  };

  // Refresh data from server
  const refreshData = async () => {
    showNotification('Refreshing data...', 'success');
    await loadData();
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Accelerator CRUD operations
  const handleAddAccelerator = async (accelerator) => {
    try {
      const newAccelerator = await acceleratorsApi.create(accelerator);
      setAccelerators([...accelerators, newAccelerator]);
      setShowAcceleratorForm(false);
      showNotification('Accelerator added successfully!', 'success');
    } catch (error) {
      showNotification('Failed to add accelerator: ' + error.message, 'error');
    }
  };

  const handleUpdateAccelerator = async (updated) => {
    try {
      const updatedAccelerator = await acceleratorsApi.update(updated.id, updated);
      setAccelerators(accelerators.map(a => 
        a.id === updated.id ? updatedAccelerator : a
      ));
      setEditingAccelerator(null);
      showNotification('Accelerator updated successfully!', 'success');
    } catch (error) {
      showNotification('Failed to update accelerator: ' + error.message, 'error');
    }
  };

  const handleDeleteAccelerator = async (id) => {
    if (window.confirm('Are you sure you want to delete this accelerator?')) {
      try {
        await acceleratorsApi.delete(id);
        setAccelerators(accelerators.filter(a => a.id !== id));
        showNotification('Accelerator deleted successfully!', 'success');
      } catch (error) {
        showNotification('Failed to delete accelerator: ' + error.message, 'error');
      }
    }
  };

  const handleToggleAcceleratorVisibility = async (accelerator) => {
    try {
      const updated = { ...accelerator, hidden: !accelerator.hidden };
      const result = await acceleratorsApi.update(accelerator.id, updated);
      setAccelerators(accelerators.map(a => 
        a.id === accelerator.id ? result : a
      ));
      showNotification(
        `${accelerator.name} is now ${result.hidden ? 'hidden' : 'visible'}`, 
        'success'
      );
    } catch (error) {
      showNotification('Failed to update visibility: ' + error.message, 'error');
    }
  };

  // Slide Deck CRUD operations
  const handleAddSlideDeck = async (slideDeck) => {
    try {
      const newSlideDeck = await slideDecksApi.create(slideDeck);
      setSlideDecks([...slideDecks, newSlideDeck]);
      setShowSlideDeckForm(false);
      showNotification('Slide deck added successfully!', 'success');
    } catch (error) {
      showNotification('Failed to add slide deck: ' + error.message, 'error');
    }
  };

  const handleUpdateSlideDeck = async (updated) => {
    try {
      const updatedSlideDeck = await slideDecksApi.update(updated.id, updated);
      setSlideDecks(slideDecks.map(s => 
        s.id === updated.id ? updatedSlideDeck : s
      ));
      setEditingSlideDeck(null);
      showNotification('Slide deck updated successfully!', 'success');
    } catch (error) {
      showNotification('Failed to update slide deck: ' + error.message, 'error');
    }
  };

  const handleDeleteSlideDeck = async (id) => {
    if (window.confirm('Are you sure you want to delete this slide deck?')) {
      try {
        await slideDecksApi.delete(id);
        setSlideDecks(slideDecks.filter(s => s.id !== id));
        showNotification('Slide deck deleted successfully!', 'success');
      } catch (error) {
        showNotification('Failed to delete slide deck: ' + error.message, 'error');
      }
    }
  };

  const resetToDefaults = async () => {
    if (window.confirm('This will reload all data from the server. Are you sure?')) {
      await loadData();
      showNotification('Data refreshed from server', 'success');
    }
  };

  return (
    <div className="admin-overlay">
      <div className="admin-panel">
        {/* Header */}
        <div className="admin-header">
          <div className="admin-title">
            <Settings className="admin-icon" />
            <h2>Admin Panel</h2>
          </div>
          <button className="close-admin-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`admin-notification ${notification.type}`}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'accelerators' ? 'active' : ''}`}
            onClick={() => setActiveTab('accelerators')}
          >
            <LayoutGrid size={18} />
            Accelerators ({accelerators.length})
          </button>
          <button 
            className={`admin-tab ${activeTab === 'slidedecks' ? 'active' : ''}`}
            onClick={() => setActiveTab('slidedecks')}
          >
            <Presentation size={18} />
            Slide Decks ({slideDecks.length})
          </button>
        </div>

        {/* Content */}
        <div className="admin-content">
          {loading ? (
            <div className="admin-loading">
              <Loader className="spinner" size={40} />
              <p>Loading data from server...</p>
            </div>
          ) : activeTab === 'accelerators' ? (
            <AcceleratorsManager
              accelerators={accelerators}
              onAdd={handleAddAccelerator}
              onUpdate={handleUpdateAccelerator}
              onDelete={handleDeleteAccelerator}
              onToggleVisibility={handleToggleAcceleratorVisibility}
              editing={editingAccelerator}
              setEditing={setEditingAccelerator}
              showForm={showAcceleratorForm}
              setShowForm={setShowAcceleratorForm}
            />
          ) : activeTab === 'slidedecks' ? (
            <SlideDecksManager
              slideDecks={slideDecks}
              onAdd={handleAddSlideDeck}
              onUpdate={handleUpdateSlideDeck}
              onDelete={handleDeleteSlideDeck}
              editing={editingSlideDeck}
              setEditing={setEditingSlideDeck}
              showForm={showSlideDeckForm}
              setShowForm={setShowSlideDeckForm}
              onUpload={(result) => {
                setSlideDecks([...slideDecks, result.slideDeck]);
                showNotification(`Uploaded and processed: ${result.slideDeck.title} (${result.extraction.slideCount} slides)`, 'success');
              }}
              onRefresh={loadData}
            />
          ) : null}
        </div>

        {/* Footer */}
        <div className="admin-footer">
          <button className="reset-btn" onClick={refreshData}>
            <RefreshCw size={16} />
            Refresh Data
          </button>
          <span className="admin-hint">Data is stored on the server</span>
        </div>
      </div>
    </div>
  );
}

// Accelerators Manager Component
function AcceleratorsManager({ accelerators, onAdd, onUpdate, onDelete, onToggleVisibility, editing, setEditing, showForm, setShowForm }) {
  const visibleCount = accelerators.filter(a => !a.hidden).length;
  const hiddenCount = accelerators.filter(a => a.hidden).length;

  return (
    <div className="manager-section">
      <div className="manager-header">
        <div className="manager-header-info">
          <h3>Manage Accelerators</h3>
          <span className="visibility-stats">
            <Eye size={14} /> {visibleCount} visible
            {hiddenCount > 0 && <> • <EyeOff size={14} /> {hiddenCount} hidden</>}
          </span>
        </div>
        <button className="add-btn" onClick={() => setShowForm(true)}>
          <Plus size={18} />
          Add New
        </button>
      </div>

      {/* Add/Edit Form */}
      {(showForm || editing) && (
        <AcceleratorForm
          accelerator={editing}
          onSave={editing ? onUpdate : onAdd}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {/* List */}
      <div className="items-list">
        {accelerators.map(acc => (
          <div key={acc.id} className={`item-card ${acc.hidden ? 'item-hidden' : ''}`}>
            <div className="item-info">
              <div className="item-header-row">
                <h4>{acc.name}</h4>
                {acc.hidden && (
                  <span className="hidden-badge">
                    <EyeOff size={12} /> Hidden
                  </span>
                )}
              </div>
              <span className="item-category">{acc.category}</span>
              <p className="item-description">{acc.description}</p>
              <a href={acc.link} target="_blank" rel="noopener noreferrer" className="item-link">
                <ExternalLink size={14} />
                {acc.link}
              </a>
            </div>
            <div className="item-actions">
              <button 
                className={`visibility-btn ${acc.hidden ? 'hidden-state' : 'visible-state'}`}
                onClick={() => onToggleVisibility(acc)}
                title={acc.hidden ? 'Show accelerator' : 'Hide accelerator'}
              >
                {acc.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button className="edit-btn" onClick={() => setEditing(acc)}>
                <Edit2 size={16} />
              </button>
              <button className="delete-btn" onClick={() => onDelete(acc.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Accelerator Form Component
function AcceleratorForm({ accelerator, onSave, onCancel }) {
  const [form, setForm] = useState(accelerator || {
    name: '',
    link: '',
    description: '',
    category: categories[0]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.link || !form.description) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(form);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h4>{accelerator ? 'Edit Accelerator' : 'Add New Accelerator'}</h4>
      
      <div className="form-group">
        <label><Tag size={14} /> Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g., SalesAssist"
          required
        />
      </div>

      <div className="form-group">
        <label><Link size={14} /> URL *</label>
        <input
          type="url"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
          placeholder="https://example.com"
          required
        />
      </div>

      <div className="form-group">
        <label><FileText size={14} /> Description *</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe what this accelerator does..."
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label><Layers size={14} /> Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          <X size={16} /> Cancel
        </button>
        <button type="submit" className="save-btn">
          <Save size={16} /> {accelerator ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}

// Slide Decks Manager Component
function SlideDecksManager({ slideDecks, onAdd, onUpdate, onDelete, editing, setEditing, showForm, setShowForm, onUpload, onRefresh }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  return (
    <div className="manager-section">
      <div className="manager-header">
        <h3>Manage Slide Decks</h3>
        <div className="header-actions">
          <button className="upload-btn" onClick={() => setShowUploadForm(true)}>
            <Upload size={18} />
            Upload PPTX
          </button>
          <button className="add-btn" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Add Manual
          </button>
        </div>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <SlideDeckUploadForm
          onUpload={async (result) => {
            onUpload?.(result);
            setShowUploadForm(false);
          }}
          onCancel={() => setShowUploadForm(false)}
        />
      )}

      {/* Add/Edit Form */}
      {(showForm || editing) && (
        <SlideDeckForm
          slideDeck={editing}
          onSave={editing ? onUpdate : onAdd}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}

      {/* List */}
      <div className="items-list">
        {slideDecks.map(deck => (
          <div key={deck.id} className="item-card">
            <div className="item-info">
              <h4>{deck.title}</h4>
              <span className="item-category">{deck.category}</span>
              <p className="item-description">{deck.description}</p>
              <div className="deck-meta">
                <span><FileText size={14} /> {deck.slides} slides</span>
                <span><Layers size={14} /> {deck.slidesFolder}</span>
              </div>
              <div className="deck-keywords">
                {deck.keywords?.slice(0, 5).map((kw, i) => (
                  <span key={i} className="keyword">{kw}</span>
                ))}
              </div>
            </div>
            <div className="item-actions">
              <button className="edit-btn" onClick={() => setEditing(deck)}>
                <Edit2 size={16} />
              </button>
              <button className="delete-btn" onClick={() => onDelete(deck.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Slide Deck Upload Form Component
function SlideDeckUploadForm({ onUpload, onCancel }) {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState({
    title: '',
    description: '',
    category: categories[0],
    keywords: []
  });
  const [keywordInput, setKeywordInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.pptx')) {
        setError('Please select a .pptx file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      // Auto-fill title from filename
      if (!metadata.title) {
        setMetadata({
          ...metadata,
          title: selectedFile.name.replace('.pptx', '').replace(/-/g, ' ')
        });
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      if (!droppedFile.name.toLowerCase().endsWith('.pptx')) {
        setError('Please drop a .pptx file');
        return;
      }
      setFile(droppedFile);
      setError(null);
      if (!metadata.title) {
        setMetadata({
          ...metadata,
          title: droppedFile.name.replace('.pptx', '').replace(/-/g, ' ')
        });
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !metadata.keywords.includes(keywordInput.trim())) {
      setMetadata({ ...metadata, keywords: [...metadata.keywords, keywordInput.trim()] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw) => {
    setMetadata({ ...metadata, keywords: metadata.keywords.filter(k => k !== kw) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PPTX file');
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading file...');
    setError(null);

    try {
      setUploadProgress('Processing slides... This may take a minute.');
      const result = await slideDecksApi.upload(file, metadata);
      setUploadProgress('Upload complete!');
      onUpload(result);
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  return (
    <form className="admin-form upload-form" onSubmit={handleSubmit}>
      <h4><Upload size={18} /> Upload PowerPoint Presentation</h4>
      
      {error && (
        <div className="upload-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Drop Zone */}
      <div 
        className={`drop-zone ${file ? 'has-file' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => !uploading && document.getElementById('pptx-file-input').click()}
      >
        <input
          id="pptx-file-input"
          type="file"
          accept=".pptx"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: 'none' }}
        />
        {uploading ? (
          <>
            <Loader className="spinner" size={40} />
            <p>{uploadProgress}</p>
          </>
        ) : file ? (
          <>
            <Presentation size={40} />
            <p><strong>{file.name}</strong></p>
            <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            <button type="button" className="change-file-btn" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
              Change File
            </button>
          </>
        ) : (
          <>
            <Upload size={40} />
            <p><strong>Drop PPTX file here</strong></p>
            <p>or click to browse</p>
          </>
        )}
      </div>

      {/* Metadata Fields */}
      <div className="form-group">
        <label><Tag size={14} /> Title</label>
        <input
          type="text"
          value={metadata.title}
          onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
          placeholder="Presentation title (auto-filled from filename)"
          disabled={uploading}
        />
      </div>

      <div className="form-group">
        <label><FileText size={14} /> Description</label>
        <textarea
          value={metadata.description}
          onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
          placeholder="Describe the content of this slide deck..."
          rows={2}
          disabled={uploading}
        />
      </div>

      <div className="form-group">
        <label><Layers size={14} /> Category</label>
        <select
          value={metadata.category}
          onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
          disabled={uploading}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Tag size={14} /> Keywords (for search)</label>
        <div className="keyword-input-wrapper">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            placeholder="Type and press Enter"
            disabled={uploading}
          />
          <button type="button" onClick={addKeyword} disabled={uploading}>Add</button>
        </div>
        <div className="keywords-list">
          {metadata.keywords.map((kw, i) => (
            <span key={i} className="keyword-tag">
              {kw}
              <button type="button" onClick={() => removeKeyword(kw)} disabled={uploading}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel} disabled={uploading}>
          <X size={16} /> Cancel
        </button>
        <button type="submit" className="save-btn upload-submit-btn" disabled={!file || uploading}>
          {uploading ? (
            <><Loader className="spinner-small" size={16} /> Processing...</>
          ) : (
            <><Upload size={16} /> Upload & Process</>
          )}
        </button>
      </div>
    </form>
  );
}

// Slide Deck Form Component
function SlideDeckForm({ slideDeck, onSave, onCancel }) {
  const [form, setForm] = useState(slideDeck || {
    title: '',
    description: '',
    category: categories[0],
    slides: 10,
    slidesFolder: '',
    fileUrl: '',
    keywords: []
  });
  const [keywordInput, setKeywordInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.slidesFolder) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(form);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !form.keywords.includes(keywordInput.trim())) {
      setForm({ ...form, keywords: [...form.keywords, keywordInput.trim()] });
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw) => {
    setForm({ ...form, keywords: form.keywords.filter(k => k !== kw) });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <h4>{slideDeck ? 'Edit Slide Deck' : 'Add New Slide Deck'}</h4>
      
      <div className="form-group">
        <label><Tag size={14} /> Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g., AI Case Studies"
          required
        />
      </div>

      <div className="form-group">
        <label><FileText size={14} /> Description *</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe the content of this slide deck..."
          rows={3}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label><Layers size={14} /> Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label><FileText size={14} /> Number of Slides</label>
          <input
            type="number"
            value={form.slides}
            onChange={(e) => setForm({ ...form, slides: parseInt(e.target.value) || 0 })}
            min="1"
          />
        </div>
      </div>

      <div className="form-group">
        <label><Layers size={14} /> Slides Folder Name *</label>
        <input
          type="text"
          value={form.slidesFolder}
          onChange={(e) => setForm({ ...form, slidesFolder: e.target.value })}
          placeholder="e.g., Repository-AI-Case-Studies-1"
          required
        />
        <small>This is the folder name in public/presentations/slides/</small>
      </div>

      <div className="form-group">
        <label><Link size={14} /> PPTX File URL</label>
        <input
          type="text"
          value={form.fileUrl}
          onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
          placeholder="/presentations/My-Deck.pptx"
        />
      </div>

      <div className="form-group">
        <label><Tag size={14} /> Keywords (for search)</label>
        <div className="keyword-input-wrapper">
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            placeholder="Type and press Enter"
          />
          <button type="button" onClick={addKeyword}>Add</button>
        </div>
        <div className="keywords-list">
          {form.keywords.map((kw, i) => (
            <span key={i} className="keyword-tag">
              {kw}
              <button type="button" onClick={() => removeKeyword(kw)}>×</button>
            </span>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          <X size={16} /> Cancel
        </button>
        <button type="submit" className="save-btn">
          <Save size={16} /> {slideDeck ? 'Update' : 'Add'}
        </button>
      </div>
    </form>
  );
}

export default AdminPanel;

