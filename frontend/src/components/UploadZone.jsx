import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';

export default function UploadZone({ acceptType = 'image/*', onFileSelected, file }) {
  const { language } = useAnalysisStore();
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  const clearFile = (e) => {
    e.stopPropagation();
    onFileSelected(null);
  };

  const isPDF = acceptType.includes('pdf');

  return (
    <div 
      className="glass"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={onButtonClick}
      style={{
        border: dragActive ? '2px dashed var(--color-primary)' : '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-2xl) var(--space-xl)',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all var(--transition-normal)',
        background: dragActive ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-secondary)',
        position: 'relative'
      }}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept={acceptType} 
        onChange={handleChange}
        style={{ display: 'none' }}
      />

      {file ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-sm)'
        }}>
          {isPDF ? (
            <FileText size={48} color="var(--color-primary)" />
          ) : (
            <ImageIcon size={48} color="var(--color-primary)" />
          )}
          <span style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
            {file.name}
          </span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </span>
          <button 
            onClick={clearFile}
            className="btn btn-secondary"
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-sm)',
              marginTop: 'var(--space-sm)'
            }}
          >
            <X size={12} />
            <span style={{ marginLeft: '4px' }}>
              {language === 'en' ? 'Remove' : 'हटाएं'}
            </span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-md)'
        }}>
          <UploadCloud size={48} color="var(--text-muted)" className="pulse-glow" style={{ borderRadius: 'var(--radius-full)' }} />
          <div>
            <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
              {language === 'en' ? 'Drag & drop your file here' : 'अपनी फ़ाइल यहाँ खींचें और छोड़ें'}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {language === 'en' 
                ? `or click to browse from device (Max 10MB, ${isPDF ? 'PDF' : 'Images'})`
                : `या डिवाइस से ब्राउज़ करने के लिए क्लिक करें (अधिकतम 10MB, ${isPDF ? 'PDF' : 'छवियां'})`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
