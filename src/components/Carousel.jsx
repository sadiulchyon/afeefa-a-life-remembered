import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Carousel({ title, children, emptyMessage }) {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  const scroll = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const hasChildren = React.Children.count(children) > 0;

  return (
    <div className="carousel-section">
      <h2 className="section-heading">{title}</h2>
      {!hasChildren ? (
        <div className="carousel-empty">
          <p>{emptyMessage || 'Nothing here yet.'}</p>
        </div>
      ) : (
        <div className="carousel-wrapper">
          {showLeft && (
            <button
              className="carousel-arrow carousel-arrow-left"
              onClick={() => scroll('left')}
              aria-label="Scroll left"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div
            className="carousel-track"
            ref={scrollRef}
            onScroll={handleScroll}
          >
            {children}
          </div>

          {showRight && hasChildren && (
            <button
              className="carousel-arrow carousel-arrow-right"
              onClick={() => scroll('right')}
              aria-label="Scroll right"
            >
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
