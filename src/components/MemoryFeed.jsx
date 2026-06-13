import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Trash2, Edit2, ChevronUp, ChevronDown } from 'lucide-react';

function MemoryCard({ memory, canManage, isAdmin, onEdit, onDelete, onMoveUp, onMoveDown, showMoveUp, showMoveDown, editingId, editContent, setEditContent, onSaveEdit, onCancelEdit }) {
  const imageFiles = memory.files ? memory.files.filter(f => f.type === 'image') : [];

  if (editingId === memory.id) {
    return (
      <div className="card memory-card">
        <div className="memory-meta">
          <div>
            <span className="memory-author">{memory.author}</span>
            <span className="memory-date">Editing…</span>
          </div>
        </div>
        <div className="memory-edit-form">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button onClick={onCancelEdit} className="btn" style={{ padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
              Cancel
            </button>
            <button onClick={() => onSaveEdit(memory.id)} className="btn btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card memory-card">
      {/* ── Header ── */}
      <div className="memory-meta">
        <div>
          <span className="memory-author">{memory.author}</span>
          <span className="memory-date">
            {memory.createdAt
              ? formatDistanceToNow(memory.createdAt.toDate(), { addSuffix: true })
              : 'Just now'}
          </span>
        </div>
        {canManage && (
          <div className="memory-actions">
            {isAdmin && (
              <>
                {showMoveUp && (
                  <button className="memory-action-btn edit" onClick={onMoveUp} title="Move up">
                    <ChevronUp size={14} />
                  </button>
                )}
                {showMoveDown && (
                  <button className="memory-action-btn edit" onClick={onMoveDown} title="Move down">
                    <ChevronDown size={14} />
                  </button>
                )}
              </>
            )}
            <button className="memory-action-btn edit" onClick={() => onEdit(memory)} title="Edit">
              <Edit2 size={14} />
            </button>
            <button className="memory-action-btn delete" onClick={() => onDelete(memory.id)} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {memory.content && (
        <div className="memory-content">{memory.content}</div>
      )}

      {/* ── Photos ── */}
      {imageFiles.length > 0 && (
        <div className="memory-attachments">
          {imageFiles.length === 1 ? (
            <img
              src={imageFiles[0].url}
              alt={`Shared by ${memory.author}`}
              className="attachment-image"
            />
          ) : (
            <div className="photo-grid">
              {imageFiles.map((file, index) => (
                <img
                  key={index}
                  src={file.url}
                  alt={`Shared by ${memory.author}`}
                  className="attachment-image"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


export default function MemoryFeed({ refreshTrigger }) {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [myMemories, setMyMemories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    setMyMemories(JSON.parse(localStorage.getItem('myMemories') || '[]'));
  }, [memories]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'afeefa') {
      setIsAdmin(true);
    }
  }, []);

  // ── Firestore listener ──
  useEffect(() => {
    setLoading(true);
    try {
      const q = query(collection(db, 'memories'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const memoriesData = [];
        querySnapshot.forEach((d) => {
          memoriesData.push({ id: d.id, ...d.data() });
        });
        // Sort by custom order if it exists, otherwise by createdAt desc
        memoriesData.sort((a, b) => {
          const orderA = a.order ?? Infinity;
          const orderB = b.order ?? Infinity;
          if (orderA !== Infinity && orderB !== Infinity) return orderA - orderB;
          if (orderA !== Infinity) return -1;
          if (orderB !== Infinity) return 1;
          const timeA = a.createdAt?.toDate?.()?.getTime() ?? 0;
          const timeB = b.createdAt?.toDate?.()?.getTime() ?? 0;
          return timeB - timeA;
        });
        setMemories(memoriesData);
        setLoading(false);
      }, (err) => {
        console.error("Firebase fetch error:", err);
        setError("Could not load memories.");
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      console.error("Setup error:", err);
      setError("Waiting for Firebase configuration.");
      setLoading(false);
    }
  }, [refreshTrigger]);

  // ── Actions ──
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this memory?")) {
      try { await deleteDoc(doc(db, 'memories', id)); }
      catch (err) { alert("Failed to delete memory."); }
    }
  };

  const handleEditClick = (memory) => {
    setEditingId(memory.id);
    setEditContent(memory.content);
  };

  const handleSaveEdit = async (id) => {
    try { await updateDoc(doc(db, 'memories', id), { content: editContent }); setEditingId(null); }
    catch (err) { alert("Failed to update memory."); }
  };

  const handleCancelEdit = () => { setEditingId(null); setEditContent(''); };

  // ── Admin reorder within a column ──
  const handleSwap = async (list, indexA, indexB) => {
    if (indexB < 0 || indexB >= list.length) return;
    const batch = writeBatch(db);
    const newList = [...list];
    [newList[indexA], newList[indexB]] = [newList[indexB], newList[indexA]];
    // Re-index the full memories list with the swap applied
    const fullReordered = [...memories];
    // Find and swap in the full list
    const idA = list[indexA].id;
    const idB = list[indexB].id;
    const fullIdxA = fullReordered.findIndex(m => m.id === idA);
    const fullIdxB = fullReordered.findIndex(m => m.id === idB);
    [fullReordered[fullIdxA], fullReordered[fullIdxB]] = [fullReordered[fullIdxB], fullReordered[fullIdxA]];
    fullReordered.forEach((m, i) => {
      batch.update(doc(db, 'memories', m.id), { order: i });
    });
    try { await batch.commit(); }
    catch (err) { alert("Failed to reorder."); }
  };

  // ── Split memories into two columns (alternating) ──
  const leftColumn = memories.filter((_, i) => i % 2 === 0);
  const rightColumn = memories.filter((_, i) => i % 2 === 1);

  // ── Render a card ──
  const renderCard = (memory, column, colIndex) => {
    const canManage = isAdmin || myMemories.includes(memory.id);
    return (
      <MemoryCard
        key={memory.id}
        memory={memory}
        canManage={canManage}
        isAdmin={isAdmin}
        onEdit={handleEditClick}
        onDelete={handleDelete}
        onMoveUp={() => handleSwap(column, colIndex, colIndex - 1)}
        onMoveDown={() => handleSwap(column, colIndex, colIndex + 1)}
        showMoveUp={colIndex > 0}
        showMoveDown={colIndex < column.length - 1}
        editingId={editingId}
        editContent={editContent}
        setEditContent={setEditContent}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
      />
    );
  };

  // ── Loading / Error / Empty ──
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
        <Loader2 size={24} style={{ animation: 'spin 2s linear infinite', margin: '0 auto 0.75rem auto' }} />
        <p style={{ fontSize: '0.85rem' }}>Loading memories…</p>
      </div>
    );
  }

  if (error && memories.length === 0) {
    return (
      <div className="card text-center" style={{ backgroundColor: 'var(--color-surface)' }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{error}</p>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="card text-center" style={{ padding: '3rem 2rem' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-text-secondary)', marginBottom: '0.5rem', fontWeight: 400 }}>
          No memories shared yet.
        </h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 0 }}>
          Be the first to share a story about Afeefa.
        </p>
      </div>
    );
  }

  return (
    <div className="memory-feed">
      {isAdmin && (
        <div style={{ padding: '0.6rem 1rem', marginBottom: '1.5rem', backgroundColor: 'rgba(168,145,122,0.1)', border: '1px solid rgba(168,145,122,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--color-accent)' }}>
          Admin mode — use ▲ ▼ arrows to reorder memories
        </div>
      )}

      <h2 className="section-heading">Shared Memories</h2>

      <div className="dual-columns">
        <div className="memory-column">
          {leftColumn.map((m, i) => renderCard(m, leftColumn, i))}
        </div>
        <div className="memory-column">
          {rightColumn.map((m, i) => renderCard(m, rightColumn, i))}
        </div>
      </div>
    </div>
  );
}
