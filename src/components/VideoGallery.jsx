import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  X,
  Clock,
  Tag,
  Search,
  Film,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { videosApi } from '../services/api';
import './VideoGallery.css';

// Video Card Component with auto-playing preview
function VideoCard({ video, onSelect }) {
  const previewRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (previewRef.current) {
      previewRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (previewRef.current) {
      previewRef.current.pause();
      previewRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className={`video-card ${isHovered ? 'hovered' : ''}`}
      onClick={() => onSelect(video)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="video-thumbnail">
        <video
          ref={previewRef}
          src={video.videoUrl}
          muted
          loop
          playsInline
          preload="metadata"
          className="preview-video"
        />
        <div className="video-thumbnail-overlay">
          <Play className="play-icon" />
        </div>
        <div className="video-duration">
          <Clock size={12} />
          {video.duration}
        </div>
      </div>
      <div className="video-info">
        <h3>{video.title}</h3>
        <p>{video.description}</p>
        <div className="video-meta">
          <span className="video-category-badge">{video.category}</span>
          <div className="video-tags">
            {video.tags?.slice(0, 2).map(tag => (
              <span key={tag} className="video-tag">
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoGallery() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:00');
  const videoRef = useRef(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const data = await videosApi.getAll();
      setVideos(data);
    } catch (error) {
      console.error('Failed to load videos:', error);
      // Fallback data
      setVideos([
        {
          id: 1,
          title: "SmartCapture Demo",
          description: "AI-powered smart capture and data extraction demonstration showcasing automated document processing capabilities.",
          category: "AI & Automation",
          duration: "3:45",
          videoUrl: "/videos/SmartCapture.mp4",
          tags: ["AI", "Document Processing", "Automation", "OCR"]
        },
        {
          id: 2,
          title: "InsightIQ Analytics",
          description: "Comprehensive analytics dashboard demo featuring real-time insights and intelligent data visualization.",
          category: "Analytics & Insights",
          duration: "5:20",
          videoUrl: "/videos/InsightIQ.mp4",
          tags: ["Analytics", "Dashboard", "Data Visualization", "BI"]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...new Set(videos.map(v => v.category))];

  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'All' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setIsPlaying(false);
    setProgress(0);
  };

  const handleClosePlayer = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(formatTime(videoRef.current.duration));
    }
  };

  const handleProgressClick = (e) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      videoRef.current.currentTime = percent * videoRef.current.duration;
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    }
  };

  const playNextVideo = () => {
    const currentIndex = filteredVideos.findIndex(v => v.id === selectedVideo?.id);
    if (currentIndex < filteredVideos.length - 1) {
      handleVideoSelect(filteredVideos[currentIndex + 1]);
    }
  };

  const playPreviousVideo = () => {
    const currentIndex = filteredVideos.findIndex(v => v.id === selectedVideo?.id);
    if (currentIndex > 0) {
      handleVideoSelect(filteredVideos[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="video-gallery-loading">
        <Film className="loading-icon" size={48} />
        <p>Loading demo videos...</p>
      </div>
    );
  }

  return (
    <div className="video-gallery">
      {/* Search and Filter */}
      <div className="search-box">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="video-search-input"
            placeholder="Search videos by title, description, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="clear-btn"
              onClick={() => setSearchTerm('')}
            >
              ×
            </button>
          )}
        </div>
        <div className="video-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`video-category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {filteredVideos.map(video => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onSelect={handleVideoSelect}
          />
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="no-videos">
          <Film size={48} />
          <h3>No videos found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="video-player-overlay" onClick={handleClosePlayer}>
          <div className="video-player-modal" onClick={e => e.stopPropagation()}>
            <div className="video-player-header">
              <h3>{selectedVideo.title}</h3>
              <button className="close-player-btn" onClick={handleClosePlayer}>
                <X size={20} />
              </button>
            </div>
            
            <div className="video-player-container">
              <video
                ref={videoRef}
                src={selectedVideo.videoUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlay}
              />
              
              {/* Navigation Arrows */}
              {filteredVideos.findIndex(v => v.id === selectedVideo.id) > 0 && (
                <button className="nav-btn nav-prev" onClick={playPreviousVideo}>
                  <ChevronLeft size={32} />
                </button>
              )}
              {filteredVideos.findIndex(v => v.id === selectedVideo.id) < filteredVideos.length - 1 && (
                <button className="nav-btn nav-next" onClick={playNextVideo}>
                  <ChevronRight size={32} />
                </button>
              )}
              
              {/* Play Overlay */}
              {!isPlaying && (
                <div className="play-overlay" onClick={togglePlay}>
                  <Play size={64} />
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="video-controls-bar">
              <button className="control-btn" onClick={togglePlay}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <div className="progress-container" onClick={handleProgressClick}>
                <div className="progress-bar" style={{ width: `${progress}%` }} />
              </div>
              
              <span className="time-display">{currentTime} / {duration}</span>
              
              <button className="control-btn" onClick={toggleMute}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              
              <button className="control-btn" onClick={handleFullscreen}>
                <Maximize size={20} />
              </button>
            </div>

            <div className="video-player-info">
              <p>{selectedVideo.description}</p>
              <div className="video-player-tags">
                {selectedVideo.tags?.map(tag => (
                  <span key={tag} className="video-tag">
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoGallery;

