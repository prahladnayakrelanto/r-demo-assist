import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, ACTIONS, EVENTS } from 'react-joyride';
import { HelpCircle } from 'lucide-react';
import './UserGuide.css';

const UserGuide = ({ isAdmin }) => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if user has seen the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      // Delay to let components render
      setTimeout(() => setRun(true), 1000);
    }
  }, []);

  const steps = [
    {
      target: 'body',
      content: (
        <div className="tour-content">
          <h3>👋 Welcome to R-AllAssist!</h3>
          <p>Let me give you a quick tour of the platform's features.</p>
          <p className="tour-hint">Click "Next" to continue or "Skip" to explore on your own.</p>
        </div>
      ),
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tab-navigation',
      content: (
        <div className="tour-content">
          <h3>📑 Navigation Tabs</h3>
          <p>Switch between different sections:</p>
          <ul>
            <li><strong>Accelerators</strong> - Browse AI solutions</li>
            <li><strong>Case Studies</strong> - Search presentations</li>
            <li><strong>Demo Videos</strong> - Watch feature demos</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.search-section',
      content: (
        <div className="tour-content">
          <h3>🔍 Search & Filter</h3>
          <p>Quickly find accelerators by typing keywords in the search box.</p>
          <p>Use category filters below to narrow down results.</p>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.categories-section',
      content: (
        <div className="tour-content">
          <h3>🏷️ Categories</h3>
          <p>Filter accelerators by category:</p>
          <ul>
            <li>Document Intelligence</li>
            <li>Analytics & Insights</li>
            <li>Process Automation</li>
            <li>And more...</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.playlist-btn',
      content: (
        <div className="tour-content">
          <h3>📋 Your Playlists</h3>
          <p>Create custom playlists to organize your favorite accelerators!</p>
          <ul>
            <li>Create a "CFO Dashboard" playlist</li>
            <li>Build a "Sales Tools" collection</li>
            <li>Organize by project or team</li>
          </ul>
        </div>
      ),
      placement: 'bottom',
    },
    {
      target: '.accelerator-card',
      content: (
        <div className="tour-content">
          <h3>🎯 Accelerator Cards</h3>
          <p>Each card shows an AI solution with:</p>
          <ul>
            <li>Title & description</li>
            <li>Category badge</li>
            <li>Quick actions (Hide, Add to Playlist)</li>
          </ul>
          <p className="tour-hint">Click any card to launch the accelerator!</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '.theme-toggle-btn',
      content: (
        <div className="tour-content">
          <h3>🌙 Theme Toggle</h3>
          <p>Switch between light and dark mode based on your preference.</p>
          <p>Your choice is saved automatically!</p>
        </div>
      ),
      placement: 'left',
    },
    ...(isAdmin ? [{
      target: '.admin-btn',
      content: (
        <div className="tour-content">
          <h3>⚙️ Admin Panel</h3>
          <p>As an admin, you can:</p>
          <ul>
            <li>Add new accelerators</li>
            <li>Edit existing solutions</li>
            <li>Manage visibility & order</li>
            <li>Upload case studies</li>
          </ul>
        </div>
      ),
      placement: 'left',
    }] : []),
    {
      target: 'body',
      content: (
        <div className="tour-content tour-final">
          <h3>🎉 You're all set!</h3>
          <p>You now know the basics of R-AllAssist.</p>
          <p>Click the <strong>Help</strong> button anytime to replay this tour.</p>
          <p className="tour-hint">Happy exploring!</p>
        </div>
      ),
      placement: 'center',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, action, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem('hasSeenTour', 'true');
    } else if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  };

  const startTour = () => {
    setStepIndex(0);
    setRun(true);
  };

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        spotlightClicks
        disableOverlayClose
        callback={handleJoyrideCallback}
        styles={{
          options: {
            arrowColor: '#ffffff',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.75)',
            primaryColor: '#FF3C00',
            spotlightShadow: '0 0 25px rgba(255, 60, 0, 0.5)',
            textColor: '#1e293b',
            width: 380,
            zIndex: 10000,
          },
          spotlight: {
            borderRadius: 12,
          },
          tooltip: {
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          tooltipTitle: {
            fontSize: 18,
            fontWeight: 700,
          },
          tooltipContent: {
            padding: '10px 0',
          },
          buttonNext: {
            backgroundColor: '#FF3C00',
            borderRadius: 8,
            padding: '10px 20px',
            fontWeight: 600,
            fontSize: 14,
          },
          buttonBack: {
            color: '#64748b',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#94a3b8',
          },
          buttonClose: {
            display: 'none',
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
      
      <button 
        className="help-tour-btn" 
        onClick={startTour}
        title="Start guided tour"
      >
        <HelpCircle size={20} />
        <span>Help</span>
      </button>
    </>
  );
};

export default UserGuide;

