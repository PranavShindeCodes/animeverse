import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home, Compass, AlertTriangle } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export const NotFound = () => {
  useDocumentTitle('404 — Void Dimension');

  return (
    <div className="container" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
      <div 
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid var(--border-accent)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          color: 'var(--accent-purple)',
          boxShadow: 'var(--shadow-glow)'
        }}
      >
        <Sparkles size={48} />
      </div>

      <div style={{ fontSize: '6rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.04em', background: 'var(--grad-cyber)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '1rem' }}>
        404
      </div>

      <h1 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Lost in the Void Realm...</h1>
      
      <p style={{ color: 'var(--text-muted)', maxWidth: '480px', margin: '0 auto 2.5rem auto', fontSize: '1.05rem', lineHeight: '1.6' }}>
        The anime episode, character, or page you were seeking has vanished into another dimension or never existed in this timeline.
      </p>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary btn-glow">
          <Home size={18} />
          <span>Back to Home</span>
        </Link>
        <Link to="/anime" className="btn btn-secondary">
          <Compass size={18} />
          <span>Browse Anime Catalog</span>
        </Link>
      </div>
    </div>
  );
};
