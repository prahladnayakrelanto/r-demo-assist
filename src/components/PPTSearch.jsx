import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Download,
  FileText,
  Sparkles,
  TrendingUp,
  Brain,
  Clock,
  CheckCircle,
  Eye,
  Layers
} from 'lucide-react';
import './PPTSearch.css';
import PPTViewer from './PPTViewer';
import { slideDecksApi } from '../services/api';

// Default PPT Library - Case Studies
const defaultPptLibrary = [
  {
    id: 1,
    title: 'Data & Analytics Case Studies',
    description: 'Comprehensive collection of Data & Analytics case studies showcasing AI-powered business intelligence, predictive analytics, demand forecasting, and data-driven decision making solutions for enterprises.',
    keywords: ['data', 'analytics', 'case study', 'business intelligence', 'BI', 'predictive analytics', 'forecasting', 'demand planning', 'data science', 'visualization', 'insights', 'dashboards', 'KPIs', 'metrics', 'reporting'],
    category: 'Analytics & Insights',
    slides: 16,
    author: 'AI First Lab',
    date: '2025-01-06',
    fileUrl: '/presentations/Data-Analytics-Case-Studies.pptx',
    slidesFolder: 'Repository-Data-and-Analytics--Case-Studies'
  },
  {
    id: 2,
    title: 'AI Case Studies',
    description: 'Repository of AI implementation case studies covering machine learning, generative AI, natural language processing, computer vision, and intelligent automation solutions across various industries.',
    keywords: ['AI', 'artificial intelligence', 'machine learning', 'ML', 'generative AI', 'GenAI', 'LLM', 'NLP', 'natural language processing', 'automation', 'deep learning', 'neural networks', 'case study', 'enterprise AI'],
    category: 'Enterprise Solutions',
    slides: 15,
    author: 'AI First Lab',
    date: '2025-01-06',
    fileUrl: '/presentations/AI-Case-Studies.pptx',
    slidesFolder: 'Repository-AI-Case-Studies-1'
  }
];

// Category to icon mapping
const categoryIconMap = {
  'Analytics & Insights': TrendingUp,
  'Enterprise Solutions': Brain,
  'Sales & Revenue': TrendingUp,
  'Financial Services': TrendingUp,
  'Infrastructure & Cloud': Brain,
  'Document Intelligence': FileText,
  'Customer Support': Brain,
  'Planning & Forecasting': TrendingUp,
  'Partnership & Collaboration': Brain,
  'Testing & Quality': Brain
};

// Search through slide content and find matching slides
const searchSlideContent = (slideContent, searchQuery) => {
  if (!searchQuery.trim() || !slideContent) return [];
  
  const query = searchQuery.toLowerCase();
  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  
  const matchingSlides = [];
  
  slideContent.slides?.forEach(slide => {
    const content = slide.content.toLowerCase();
    let matches = false;
    let matchScore = 0;
    
    // Check for full query match
    if (content.includes(query)) {
      matches = true;
      matchScore += 50;
    }
    
    // Check for individual word matches
    queryWords.forEach(word => {
      if (content.includes(word)) {
        matches = true;
        matchScore += 10;
      }
    });
    
    if (matches) {
      // Extract a snippet around the match
      const queryIndex = content.indexOf(query) !== -1 ? content.indexOf(query) : content.indexOf(queryWords[0] || '');
      const start = Math.max(0, queryIndex - 50);
      const end = Math.min(content.length, queryIndex + 150);
      let snippet = slide.content.substring(start, end);
      if (start > 0) snippet = '...' + snippet;
      if (end < content.length) snippet = snippet + '...';
      
      matchingSlides.push({
        slideNumber: slide.slideNumber,
        snippet: snippet,
        score: matchScore
      });
    }
  });
  
  return matchingSlides.sort((a, b) => b.score - a.score);
};

// Natural language search scoring function
const calculateRelevanceScore = (ppt, searchQuery, slideContent) => {
  if (!searchQuery.trim()) return { score: 0, matchingSlides: [] };
  
  const query = searchQuery.toLowerCase();
  const queryWords = query.split(/\s+/).filter(w => w.length > 2);
  
  let score = 0;
  
  // Title matching (highest weight)
  if (ppt.title.toLowerCase().includes(query)) {
    score += 50;
  }
  queryWords.forEach(word => {
    if (ppt.title.toLowerCase().includes(word)) {
      score += 15;
    }
  });
  
  // Description matching (medium weight)
  if (ppt.description.toLowerCase().includes(query)) {
    score += 30;
  }
  queryWords.forEach(word => {
    if (ppt.description.toLowerCase().includes(word)) {
      score += 8;
    }
  });
  
  // Keywords matching (high weight)
  ppt.keywords.forEach(keyword => {
    if (query.includes(keyword.toLowerCase())) {
      score += 25;
    }
    queryWords.forEach(word => {
      if (keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())) {
        score += 12;
      }
    });
  });
  
  // Category matching
  if (ppt.category.toLowerCase().includes(query)) {
    score += 20;
  }
  queryWords.forEach(word => {
    if (ppt.category.toLowerCase().includes(word)) {
      score += 10;
    }
  });
  
  // Search slide content
  const matchingSlides = searchSlideContent(slideContent, searchQuery);
  if (matchingSlides.length > 0) {
    // Add score based on number of matching slides and their scores
    score += matchingSlides.length * 20;
    score += matchingSlides.reduce((acc, s) => acc + s.score, 0);
    }
  
  return { score, matchingSlides };
};

function PPTSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedPresentation, setSelectedPresentation] = useState(null);
  const [initialSlide, setInitialSlide] = useState(0);
  const [slideContents, setSlideContents] = useState({});
  const [contentLoaded, setContentLoaded] = useState(false);
  const [pptLibrary, setPptLibrary] = useState([]);

  // Load slide decks from API
  useEffect(() => {
    loadSlideDecks();
  }, []);

  const loadSlideDecks = async () => {
    try {
      const data = await slideDecksApi.getAll();
      setPptLibrary(data);
    } catch (error) {
      console.error('Failed to load slide decks from server:', error);
      // Fallback to default data
      setPptLibrary(defaultPptLibrary);
    }
  };

  // Load slide content on component mount or when pptLibrary changes
  useEffect(() => {
    const loadSlideContent = async () => {
      if (pptLibrary.length === 0) return;
      
      const contents = {};
      for (const ppt of pptLibrary) {
        try {
          const response = await fetch(`/presentations/slides/${ppt.slidesFolder}/content.json`);
          if (response.ok) {
            contents[ppt.id] = await response.json();
          }
        } catch (error) {
          console.log(`Could not load content for ${ppt.title}`);
        }
      }
      setSlideContents(contents);
      setContentLoaded(true);
    };
    loadSlideContent();
  }, [pptLibrary]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return pptLibrary.map(ppt => ({ ...ppt, relevanceScore: 0, matchingSlides: [] }));
    }
    
    const scored = pptLibrary.map(ppt => {
      const { score, matchingSlides } = calculateRelevanceScore(
        ppt, 
        searchQuery, 
        slideContents[ppt.id]
      );
      return {
      ...ppt,
        relevanceScore: score,
        matchingSlides
      };
    });
    
    return scored
      .filter(ppt => ppt.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [searchQuery, slideContents]);

  const handleSearch = (e) => {
    setIsSearching(true);
    setSearchQuery(e.target.value);
    // Simulate search delay for UX
    setTimeout(() => setIsSearching(false), 300);
  };

  const handleDownload = (ppt, e) => {
    e.stopPropagation();
    setDownloadingId(ppt.id);
    
    // Download the file
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = ppt.fileUrl;
      link.download = `${ppt.title}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadingId(null);
    }, 500);
  };

  const handleViewPresentation = (ppt, e, slideNumber = 0) => {
    e.stopPropagation();
    setSelectedPresentation(ppt);
    setInitialSlide(slideNumber);
  };

  const handleCloseViewer = () => {
    setSelectedPresentation(null);
    setInitialSlide(0);
  };

  return (
    <div className="ppt-search-container">
      <div className="search-box">
        <div className="search-input-wrapper">
          <Search className={`search-icon ${isSearching ? 'searching' : ''}`} />
          <input
            type="text"
            className="ppt-search-input"
            placeholder="Search slide content... Try: 'cloud migration', 'Snowflake', 'partner incentives'"
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchQuery && (
            <button 
              className="clear-btn"
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
        <div className="search-hints">
          <span className="hint-label">Try:</span>
          <button className="hint-btn" onClick={() => setSearchQuery('cloud migration')}>Cloud Migration</button>
          <button className="hint-btn" onClick={() => setSearchQuery('Snowflake')}>Snowflake</button>
          <button className="hint-btn" onClick={() => setSearchQuery('sales forecasting')}>Sales Forecasting</button>
          <button className="hint-btn" onClick={() => setSearchQuery('data quality')}>Data Quality</button>
          <button className="hint-btn" onClick={() => setSearchQuery('Cisco')}>Cisco</button>
          <button className="hint-btn" onClick={() => setSearchQuery('partner')}>Partner</button>
        </div>
      </div>

      <div className="results-info">
        {searchQuery ? (
          <span>
            <CheckCircle className="check-icon" />
            Found <strong>{searchResults.length}</strong> relevant presentations
          </span>
        ) : (
          <span>
            <FileText className="file-icon" />
            Showing all <strong>{pptLibrary.length}</strong> presentations
          </span>
        )}
      </div>

      <div className="ppt-results-grid">
        {(searchQuery ? searchResults : pptLibrary).map((ppt) => {
          const Icon = categoryIconMap[ppt.category] || Brain;
          return (
            <div 
              key={ppt.id} 
              className={`ppt-card ${ppt.relevanceScore > 30 ? 'high-match' : ''}`}
            >
              {ppt.relevanceScore > 30 && (
                <div className="match-badge">
                  <Sparkles size={12} /> Best Match
                </div>
              )}
              
              <div className="ppt-card-header">
                <div className="ppt-icon-container">
                  <Icon className="ppt-icon" />
                </div>
                <span className="ppt-category">{ppt.category}</span>
              </div>
              
              <h3 className="ppt-title">{ppt.title}</h3>
              <p className="ppt-description">{ppt.description}</p>
              
              <div className="ppt-meta">
                <div className="meta-item">
                  <FileText size={14} />
                  <span>{ppt.slides} slides</span>
                </div>
                <div className="meta-item author">
                  <span>By {ppt.author}</span>
                </div>
              </div>
              
              <div className="ppt-keywords">
                {ppt.keywords.slice(0, 4).map((keyword, idx) => (
                  <span key={idx} className="keyword-tag">{keyword}</span>
                ))}
              </div>

              {/* Matching Slides Section */}
              {ppt.matchingSlides && ppt.matchingSlides.length > 0 && (
                <div className="matching-slides">
                  <div className="matching-slides-header">
                    <Layers size={14} />
                    <span>Found in {ppt.matchingSlides.length} slide{ppt.matchingSlides.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="matching-slides-list">
                    {ppt.matchingSlides.slice(0, 3).map((match, idx) => (
                      <div 
                        key={idx} 
                        className="matching-slide-item"
                        onClick={(e) => handleViewPresentation(ppt, e, match.slideNumber - 1)}
                      >
                        <span className="slide-num">Slide {match.slideNumber}</span>
                        <span className="slide-snippet">{match.snippet}</span>
                      </div>
                    ))}
                    {ppt.matchingSlides.length > 3 && (
                      <div className="more-matches">
                        +{ppt.matchingSlides.length - 3} more matches
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="ppt-footer">
                <div className="ppt-info">
                  <Clock size={14} />
                  <span>{new Date(ppt.date).toLocaleDateString()}</span>
                </div>
                <div className="ppt-actions">
                  <button 
                    className="view-btn"
                    onClick={(e) => handleViewPresentation(ppt, e)}
                    title="View Presentation"
                  >
                    <Eye size={16} />
                    <span>View</span>
                  </button>
                <button 
                  className={`download-btn ${downloadingId === ppt.id ? 'downloading' : ''}`}
                    onClick={(e) => handleDownload(ppt, e)}
                  disabled={downloadingId === ppt.id}
                    title="Download Full Deck"
                >
                  {downloadingId === ppt.id ? (
                    <>
                      <span className="spinner"></span>
                        <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                        <span>Download</span>
                    </>
                  )}
                </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {searchQuery && searchResults.length === 0 && (
        <div className="no-results">
          <Search size={48} />
          <h3>No presentations found</h3>
          <p>Try different keywords or browse all presentations</p>
          <button className="browse-all-btn" onClick={() => setSearchQuery('')}>
            Browse All PPTs
          </button>
        </div>
      )}

      {/* PPT Viewer Modal */}
      {selectedPresentation && (
        <PPTViewer 
          presentation={selectedPresentation}
          onClose={handleCloseViewer}
          initialSlide={initialSlide}
        />
      )}
    </div>
  );
}

export default PPTSearch;

