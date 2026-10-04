import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useRemoteSession } from '../context/RemoteSessionContext';
import {
  Smartphone,
  X,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Wifi,
  WifiOff
} from 'lucide-react';

const PROD_FRONTEND_URL = 'https://animeversee-chi.vercel.app';

const getFrontendBaseUrl = () => {
  if (import.meta.env.VITE_FRONTEND_URL) {
    return import.meta.env.VITE_FRONTEND_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1')) {
    return window.location.origin.replace(/\/$/, '');
  }
  return PROD_FRONTEND_URL;
};

export const RemoteModal = () => {
  const { sessionId, isRemoteConnected, isModalOpen, closeModal, isSocketConnected } = useRemoteSession();
  const [copied, setCopied] = useState(false);

  if (!isModalOpen) return null;

  const frontendBase = getFrontendBaseUrl();
  const remoteUrl = sessionId ? `${frontendBase}/remote/${sessionId}` : '';

  const handleCopyUrl = async () => {
    if (!remoteUrl) return;
    try {
      await navigator.clipboard.writeText(remoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="mobile-menu-overlay" onClick={closeModal} style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="remote-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-accent)',
          borderRadius: '24px',
          padding: '2rem',
          maxWidth: '440px',
          width: '90%',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(139, 92, 246, 0.3)',
          textAlign: 'center',
          position: 'relative',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="btn-icon"
          onClick={closeModal}
          style={{ position: 'absolute', top: '1rem', right: '1rem' }}
          aria-label="Close Remote Modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '16px', background: 'var(--grad-primary)', color: '#ffffff', marginBottom: '1rem', boxShadow: '0 0 20px var(--accent-purple-glow)' }}>
          <Smartphone size={26} />
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.35rem' }}>
          AirConsole Remote Control
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
          Scan this QR code with your phone to control this player in real time.
        </p>

        {/* QR Code Container */}
        <div
          style={{
            background: '#ffffff',
            padding: '1.25rem',
            borderRadius: '18px',
            display: 'inline-block',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
            marginBottom: '1.5rem'
          }}
        >
          {remoteUrl ? (
            <QRCodeSVG
              value={remoteUrl}
              size={190}
              level="M"
              includeMargin={false}
            />
          ) : (
            <div style={{ width: '190px', height: '190px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
              Generating session...
            </div>
          )}
        </div>

        {/* Session Code Badge */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
            Session Code
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple)', letterSpacing: '0.12em' }}>
            {sessionId || '••••••'}
          </div>
        </div>

        {/* Real-time Connection Status Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.45rem 1rem',
            borderRadius: '20px',
            background: isRemoteConnected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(251, 191, 36, 0.15)',
            border: `1px solid ${isRemoteConnected ? 'rgba(16, 185, 129, 0.4)' : 'rgba(251, 191, 36, 0.4)'}`,
            marginBottom: '1.5rem'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isRemoteConnected ? '#10b981' : '#fbbf24',
              boxShadow: isRemoteConnected ? '0 0 10px #10b981' : '0 0 8px #fbbf24',
              animation: isRemoteConnected ? 'none' : 'pulseGlow 1.5s infinite'
            }}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isRemoteConnected ? '#6ee7b7' : '#fcd34d' }}>
            {isRemoteConnected ? '● Phone Connected' : '○ Waiting for phone...'}
          </span>
        </div>

        {/* Link / Copy Action */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopyUrl}
            style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
            disabled={!remoteUrl}
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Link Copied!' : 'Copy Remote Link'}</span>
          </button>

          <a
            href={remoteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.6rem 1rem' }}
            title="Open remote in a new tab for local testing"
          >
            <ExternalLink size={14} />
            <span>Open Tab</span>
          </a>
        </div>
      </div>
    </div>
  );
};
