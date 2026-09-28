'use client';

import { useState, useEffect } from 'react';
import { BackgroundTree } from './components/BackgroundTree';
import { TreeCanvas } from './components/TreeCanvas';
import './components/GraphMenu.css';

export default function Page() {
  const [isStarted, setIsStarted] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Handle the start action with a slight delay for animation if desired
  const handleStart = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsStarted(true);
    }, 500); // Match CSS transition duration
  };

  if (isStarted) {
    return (
      <main className="editor-main">
        <TreeCanvas />
      </main>
    );
  }

  return (
    <main
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: isFading ? 0 : 1,
        transform: isFading ? 'scale(1.1)' : 'scale(1)',
        filter: isFading ? 'blur(10px)' : 'blur(0px)',
        transition: 'opacity 0.8s ease, transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), filter 0.8s ease'
      }}
    >

      {/* 1. The Interactive Background */}
      <BackgroundTree />

      {/* 2. The Glass Hero Card */}
      <div className="graph-menu" style={{ width: '400px', textAlign: 'center', padding: '40px', backgroundColor: '#ffffff', backdropFilter: 'none' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#111' }}>Glass Tree</h1>
        <p style={{ marginBottom: '2rem', color: '#444' }}>
          Understand. Adapt. Trust.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleStart}
            className="action-button"
            style={{ width: '100%', padding: '12px', fontSize: '1.1rem', backgroundColor: '#242424', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Start
          </button>
        </div>

        <div style={{ marginTop: '20px', fontSize: '0.8rem', color: '#666' }}>
          v1.0.0 • Open Source
        </div>
      </div>
    </main>
  );
}