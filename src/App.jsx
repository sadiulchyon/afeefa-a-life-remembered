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
        <h2 style={{ fontSize: '1.2rem', fontWeight: 300, color: 'var(--color-accent)', marginTop: '0.25rem', marginBottom: '1.5rem', letterSpacing: '0.05em', lineHeight: '1.5' }}>
          যে গেছে ছায়াপ্রাণ বনবীথিতলে <br />
          যে গেছে অশ্রুময় বন-অন্তরালে
        </h2>
        <div className="header-divider" />
        <p className="header-subtitle">
          For Ayaan and Alaa — so you may always know what a brilliant, kind, and beautiful soul your mother was.
        </p>
      </header>

      {/* ── Compact form ── */}
      <div className="form-wrapper">
        <MemoryForm onMemoryAdded={handleMemoryAdded} />
      </div>

      {/* ── Two-column feed ── */}
      <MemoryFeed refreshTrigger={refreshTrigger} />

    </div>
  );
}

export default App;
