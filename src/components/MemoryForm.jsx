import React, { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { X, Image as ImageIcon, Loader2 } from 'lucide-react';

export default function MemoryForm({ onMemoryAdded }) {
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Optional: Add file size or type validation here
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && files.length === 0) {
      setError('Please add a memory or upload a file.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 1. Upload files if any
      const uploadedFiles = [];
      for (const file of files) {
        const fileRef = ref(storage, `memories/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`);
        
        const uploadTask = uploadBytesResumable(fileRef, file);
        
        await new Promise((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(Math.round(progress));
            }, 
            (error) => {
              reject(error);
            }, 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              uploadedFiles.push({
                name: file.name,
                url: downloadURL,
                type: file.type.startsWith('image/') ? 'image' : 'document'
              });
              resolve();
            }
          );
        });
      }

      // 2. Save memory to Firestore
      const docRef = await addDoc(collection(db, 'memories'), {
        author: author.trim() || 'Anonymous',
        content: content.trim(),
        files: uploadedFiles,
        createdAt: serverTimestamp(),
      });
      
      // Save ownership to localStorage so they can delete it later
      const myMemories = JSON.parse(localStorage.getItem('myMemories') || '[]');
      myMemories.push(docRef.id);
      localStorage.setItem('myMemories', JSON.stringify(myMemories));

      // 3. Reset form
      setAuthor('');
      setContent('');
      setFiles([]);
      setUploadProgress(0);
      if (onMemoryAdded) onMemoryAdded();
      
    } catch (err) {
      console.error("Error adding document: ", err);
      // Since Firebase config is likely missing initially, we show a helpful error
      setError(`Failed: ${err.message || "Unknown error occurred"}`);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="card">
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.3rem', fontWeight: 400, marginBottom: '1.25rem', textAlign: 'center', letterSpacing: '0.02em' }}>
        Share a Memory
      </h2>
      
      {error && (
        <div style={{ backgroundColor: 'rgba(220, 53, 69, 0.1)', border: '1px solid rgba(220, 53, 69, 0.2)', color: '#ff6b6b', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="author">Your Name (or a nickname)</label>
          <input
            id="author"
            type="text"
            className="form-input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g., A close friend, or your real name"
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="content">Your Memory</label>
          <div style={{ position: 'relative' }}>
            <textarea
              id="content"
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share a story, a thought, or just something you'll miss..."
              disabled={isSubmitting}
              style={{ marginBottom: '0.5rem', paddingBottom: '3rem' }}
            />
            
            <div style={{ position: 'absolute', bottom: '1.25rem', left: '1rem', display: 'flex', alignItems: 'center' }}>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-accent)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                title="Add Photos"
              >
                <ImageIcon size={22} />
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Add Photos</span>
              </button>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {files.length > 0 && (
            <div className="selected-files">
              {files.map((file, index) => (
                <div key={index} className="selected-file-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                    <ImageIcon size={16} />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                      {file.name}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="remove-file-btn" 
                    onClick={() => removeFile(index)}
                    disabled={isSubmitting}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 2s linear infinite' }} />
                {files.length > 0 ? `Uploading (${uploadProgress}%)...` : 'Posting...'}
              </>
            ) : (
              'Post Memory'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
