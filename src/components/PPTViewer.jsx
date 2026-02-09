import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Grid3X3,
  RotateCcw,
  FileText,
  FileDown,
  Presentation
} from 'lucide-react';
import './PPTViewer.css';

function PPTViewer({ presentation, onClose, initialSlide = 0 }) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [slideImages, setSlideImages] = useState([]);
  const [loadedImages, setLoadedImages] = useState({});
  const viewerRef = useRef(null);
  const slideRef = useRef(null);

  // Generate slide paths based on presentation folder
  useEffect(() => {
    if (presentation) {
      const folderName = presentation.slidesFolder || 
        presentation.title.replace(/[&\s]+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      
      // Generate slide paths - assuming slides are named slide_001.png, slide_002.png, etc.
      const slideCount = presentation.slides || 20; // Default to 20 if not specified
      const slides = [];
      
      for (let i = 1; i <= slideCount; i++) {
        slides.push({
          index: i,
          path: `/presentations/slides/${folderName}/slide_${String(i).padStart(3, '0')}.png`,
          thumbnail: `/presentations/slides/${folderName}/slide_${String(i).padStart(3, '0')}.png`
        });
      }
      
      setSlideImages(slides);
      // Use initialSlide if provided and valid
      const startSlide = initialSlide >= 0 && initialSlide < slideCount ? initialSlide : 0;
      setCurrentSlide(startSlide);
      setIsLoading(false);
    }
  }, [presentation, initialSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        setZoom(1);
      } else if (e.key === 'f') {
        toggleFullscreen();
      } else if (e.key === 'g') {
        setShowThumbnails(!showThumbnails);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, slideImages.length, isFullscreen, showThumbnails]);

  const nextSlide = useCallback(() => {
    if (currentSlide < slideImages.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide, slideImages.length]);

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setShowThumbnails(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      viewerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleImageLoad = (index) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }));
  };

  const handleImageError = (index) => {
    setLoadedImages(prev => ({ ...prev, [index]: 'error' }));
  };

  const downloadCurrentSlide = () => {
    if (presentation && currentSlide >= 0) {
      const folderName = presentation.slidesFolder || 
        presentation.title.replace(/[&\s]+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
      
      // Download as PPTX slide
      const slidePptxPath = `/presentations/slides/${folderName}/slide_${String(currentSlide + 1).padStart(3, '0')}.pptx`;
      
      const link = document.createElement('a');
      link.href = slidePptxPath;
      link.download = `${presentation.title}_Slide_${currentSlide + 1}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const downloadEntireDeck = () => {
    // Download the original PPTX file
    const link = document.createElement('a');
    link.href = presentation.fileUrl;
    link.download = `${presentation.title}.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!presentation) return null;

  return (
    <div className={`ppt-viewer-overlay ${isFullscreen ? 'fullscreen' : ''}`} ref={viewerRef}>
      <div className="ppt-viewer-container">
        {/* Header */}
        <div className="viewer-header">
          <div className="header-left">
            <FileText size={24} className="header-icon" />
            <div className="header-info">
              <h2>{presentation.title}</h2>
              <span className="slide-counter">
                Slide {currentSlide + 1} of {slideImages.length}
              </span>
            </div>
          </div>
          
          <div className="header-controls">
            {/* Zoom Controls */}
            <div className="zoom-controls">
              <button onClick={handleZoomOut} title="Zoom Out (-)">
                <ZoomOut size={18} />
              </button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button onClick={handleZoomIn} title="Zoom In (+)">
                <ZoomIn size={18} />
              </button>
              <button onClick={() => setZoom(1)} title="Reset Zoom (0)">
                <RotateCcw size={18} />
              </button>
            </div>

            {/* View Controls */}
            <div className="view-controls">
              <button 
                onClick={() => setShowThumbnails(!showThumbnails)}
                className={showThumbnails ? 'active' : ''}
                title="Thumbnail Grid (G)"
              >
                <Grid3X3 size={18} />
              </button>
              <button onClick={toggleFullscreen} title="Fullscreen (F)">
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            {/* Download Controls */}
            <div className="download-controls">
              <button onClick={downloadCurrentSlide} className="download-slide-btn" title="Download Current Slide as PPTX">
                <FileDown size={16} />
                <span>This Slide (.pptx)</span>
              </button>
              <button onClick={downloadEntireDeck} className="download-deck-btn" title="Download Full Deck">
                <Download size={16} />
                <span>Full Deck</span>
              </button>
            </div>

            <button className="close-btn" onClick={onClose} title="Close (Esc)">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="viewer-content">
          {/* Navigation Arrow - Left */}
          <button 
            className={`nav-arrow nav-prev ${currentSlide === 0 ? 'disabled' : ''}`}
            onClick={prevSlide}
            disabled={currentSlide === 0}
          >
            <ChevronLeft size={40} />
          </button>

          {/* Slide Display */}
          {showThumbnails ? (
            <div className="thumbnails-grid">
              {slideImages.map((slide, index) => (
                <div 
                  key={index}
                  className={`thumbnail-item ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                >
                  <div className="thumbnail-wrapper">
                    {loadedImages[index] === 'error' ? (
                      <div className="slide-placeholder">
                        <FileText size={32} />
                        <span>Slide {index + 1}</span>
                      </div>
                    ) : (
                      <img 
                        src={slide.thumbnail} 
                        alt={`Slide ${index + 1}`}
                        onLoad={() => handleImageLoad(index)}
                        onError={() => handleImageError(index)}
                      />
                    )}
                  </div>
                  <span className="thumbnail-number">{index + 1}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="slide-container" ref={slideRef}>
              <div 
                className="slide-wrapper"
                style={{ transform: `scale(${zoom})` }}
              >
                {loadedImages[currentSlide] === 'error' ? (
                  <div className="slide-placeholder large">
                    <FileText size={64} />
                    <h3>Slide {currentSlide + 1}</h3>
                    <p>{presentation.title}</p>
                    <span className="placeholder-hint">
                      Run the extraction script to generate slide images
                    </span>
                  </div>
                ) : (
                  <>
                    {!loadedImages[currentSlide] && (
                      <div className="slide-loading">
                        <div className="loading-spinner"></div>
                        <span>Loading slide...</span>
                      </div>
                    )}
                    <img 
                      src={slideImages[currentSlide]?.path}
                      alt={`Slide ${currentSlide + 1}`}
                      className={loadedImages[currentSlide] ? 'loaded' : 'loading'}
                      onLoad={() => handleImageLoad(currentSlide)}
                      onError={() => handleImageError(currentSlide)}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigation Arrow - Right */}
          <button 
            className={`nav-arrow nav-next ${currentSlide === slideImages.length - 1 ? 'disabled' : ''}`}
            onClick={nextSlide}
            disabled={currentSlide === slideImages.length - 1}
          >
            <ChevronRight size={40} />
          </button>
        </div>

        {/* Footer with slide navigation */}
        <div className="viewer-footer">
          <div className="slide-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${((currentSlide + 1) / slideImages.length) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="slide-dots">
            {slideImages.slice(
              Math.max(0, currentSlide - 5),
              Math.min(slideImages.length, currentSlide + 6)
            ).map((_, idx) => {
              const actualIndex = Math.max(0, currentSlide - 5) + idx;
              return (
                <button
                  key={actualIndex}
                  className={`slide-dot ${currentSlide === actualIndex ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(actualIndex)}
                  title={`Slide ${actualIndex + 1}`}
                />
              );
            })}
          </div>

          <div className="keyboard-hints">
            <span>← → Navigate</span>
            <span>+/- Zoom</span>
            <span>F Fullscreen</span>
            <span>G Grid</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PPTViewer;

