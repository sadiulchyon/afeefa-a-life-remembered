import React, { useState } from 'react';
import MemoryForm from './components/MemoryForm';
import MemoryFeed from './components/MemoryFeed';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleMemoryAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>In Loving Memory of Afeefa</h1>
        <div className="header-divider" />
        <p className="header-subtitle">
          For Ayaan and Alaa — so you may always know what an amazing person your mother was.
        </p>
        <p className="header-subtitle" style={{ marginTop: '0.5rem', fontSize: '0.88rem' }}>
          Please share a thought or a story.
        </p>
      </header>

      {/* ── Compact form ── */}
      <div className="form-wrapper">
        <MemoryForm onMemoryAdded={handleMemoryAdded} />
      </div>

      {/* ── Two-column feed ── */}
      <MemoryFeed refreshTrigger={refreshTrigger} />

      <footer style={{ textAlign: 'center', marginTop: '3rem', paddingBottom: '2rem', color: 'var(--color-text-muted)', fontSize: '0.82rem', letterSpacing: '0.02em' }}>
        <p>Created with love by those who knew her best.</p>
      </footer>
    </div>
  );
}

export default App;
