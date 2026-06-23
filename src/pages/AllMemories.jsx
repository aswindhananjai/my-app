import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import FloatingActionButton from '../components/FloatingActionButton';
import '../styles/AllMemories.css';

const MEMORY_CATEGORIES = [
  {
    id: 'first',
    name: 'First',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
    color: '#C2487A',
    bg: '#FCE9F0'
  },
  {
    id: 'trip',
    name: 'Trip',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>,
    color: '#2D6FE0',
    bg: '#EAF1FC'
  },
  {
    id: 'gift',
    name: 'Gift',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.5 4.5 0 0 1 12 7.5a4.5 4.5 0 0 1 4.5-4.5 2.5 2.5 0 0 1 0 5" /></svg>,
    color: '#B5762A',
    bg: '#FBF0DF'
  },
  {
    id: 'moment',
    name: 'Moment',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>,
    color: '#4A5568',
    bg: '#E8EAF0'
  },
  {
    id: 'celebration',
    name: 'Celebration',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79" /><path d="M4 3h.01" /><path d="M22 8h.01" /><path d="M15 2h.01" /><path d="M22 20h.01" /><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17" /><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7" /><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z" /></svg>,
    color: '#7C3AED',
    bg: '#F3E8FF'
  },
  {
    id: 'special_day',
    name: 'Special Day',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    color: '#B7791F',
    bg: '#FFF8E0'
  },
  {
    id: 'date',
    name: 'Date',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h7.3" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /><path d="M16 14l-2 2.4c-.4.4-.7.9-.7 1.4a2.5 2.5 0 0 0 5 0c0-.5-.3-1-.7-1.4L16 14Z" /></svg>,
    color: '#E11D48',
    bg: '#FFE4E6'
  }
];

export default function AllMemories() {
  const navigate = useNavigate();
  const [memories, setMemories] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [activeYear, setActiveYear] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [handlePosition, setHandlePosition] = useState(0);
  const scrubberRef = useRef(null);

  const [draggedMemory, setDraggedMemory] = useState(null);
  const [touchDraggingId, setTouchDraggingId] = useState(null);
  const [hasDragged, setHasDragged] = useState(false);
  const touchTimerRef = useRef(null);

  useEffect(() => {
    loadMemories();
  }, []);

  // Restore scroll position after memories have loaded
  useEffect(() => {
    if (!loading && memories.length > 0 && scrollContainerRef.current) {
      const savedScrollPos = sessionStorage.getItem('all_memories_scroll_pos');
      if (savedScrollPos) {
        const parsed = parseInt(savedScrollPos, 10);
        if (!isNaN(parsed)) {
          scrollContainerRef.current.scrollTop = parsed;
          const timer = setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = parsed;
            }
          }, 100);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [loading, memories]);

  const loadMemories = async () => {
    try {
      setLoading(true);
      // Fetch active memories only (soft delete filter)
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false })
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setMemories(data || []);
    } catch (error) {
      console.error('Error loading memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    sessionStorage.setItem('all_memories_scroll_pos', '0');
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const saveOrderToDatabase = async (date) => {
    const sameDayMems = memories.filter(m => m.date === date);
    try {
      const updates = sameDayMems.map((m, idx) => ({
        id: m.id,
        sort_order: idx
      }));

      await Promise.all(updates.map(u => 
        supabase
          .from('memories')
          .update({ sort_order: u.sort_order })
          .eq('id', u.id)
      ));
    } catch (error) {
      console.error('Error saving reordered memories:', error);
    }
  };

  const handleDragOverCard = (e, targetMemory) => {
    e.preventDefault();
    if (!draggedMemory || draggedMemory.id === targetMemory.id) return;
    if (draggedMemory.date !== targetMemory.date) return;

    // Swap in local state
    setMemories(prev => {
      const idx1 = prev.findIndex(m => m.id === draggedMemory.id);
      const idx2 = prev.findIndex(m => m.id === targetMemory.id);
      if (idx1 === -1 || idx2 === -1) return prev;

      const newMems = [...prev];
      const temp = newMems[idx1];
      newMems[idx1] = newMems[idx2];
      newMems[idx2] = temp;
      return newMems;
    });
  };

  const handleCardDragEnd = async () => {
    if (draggedMemory) {
      await saveOrderToDatabase(draggedMemory.date);
    }
    setDraggedMemory(null);
  };

  // Global effect for touch reordering when touchDraggingId is active
  useEffect(() => {
    if (!touchDraggingId) return;

    const handleGlobalTouchMove = (e) => {
      if (e.cancelable) {
        e.preventDefault();
      }

      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (!element) return;

      const cardEl = element.closest('.memory-card');
      if (!cardEl) return;

      const targetId = cardEl.getAttribute('data-id');
      if (!targetId || targetId === touchDraggingId) return;

      const targetMemory = memories.find(m => m.id === targetId);
      const draggingMemoryObj = memories.find(m => m.id === touchDraggingId);
      if (!targetMemory || !draggingMemoryObj) return;

      if (draggingMemoryObj.date !== targetMemory.date) return;

      // Swap in local state
      setMemories(prev => {
        const idx1 = prev.findIndex(m => m.id === touchDraggingId);
        const idx2 = prev.findIndex(m => m.id === targetId);
        if (idx1 === -1 || idx2 === -1) return prev;

        const newMems = [...prev];
        const temp = newMems[idx1];
        newMems[idx1] = newMems[idx2];
        newMems[idx2] = temp;
        return newMems;
      });
    };

    const handleGlobalTouchEnd = async () => {
      const draggingMemoryObj = memories.find(m => m.id === touchDraggingId);
      if (draggingMemoryObj) {
        await saveOrderToDatabase(draggingMemoryObj.date);
      }
      setTouchDraggingId(null);
      setDraggedMemory(null);
    };

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [touchDraggingId, memories]);

  const handleTouchStartCard = (e, memory) => {
    setHasDragged(false);
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
    touchTimerRef.current = setTimeout(() => {
      setTouchDraggingId(memory.id);
      setDraggedMemory(memory);
      setHasDragged(true);
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 500);
  };

  const handleTouchMoveCardLocal = (e) => {
    if (!touchDraggingId) {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    }
  };

  const handleTouchEndCardLocal = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  const handleCardClick = (memory) => {
    if (hasDragged) {
      setHasDragged(false);
      return;
    }
    navigate(`/memory/${memory.id}`, { state: { from: '/memories' } });
  };

  // Group memories by year
  const groupedMemories = memories.reduce((acc, memory) => {
    const year = new Date(memory.date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(memory);
    return acc;
  }, {});

  // Filter memories by category
  const filteredMemories = filter === 'all'
    ? groupedMemories
    : Object.entries(groupedMemories).reduce((acc, [year, mems]) => {
        const filtered = mems.filter(m => {
          const categories = m.category ? m.category.split(',').filter(Boolean) : ['first'];
          return categories.includes(filter);
        });
        if (filtered.length > 0) {
          acc[year] = filtered;
        }
        return acc;
      }, {});

  const years = Object.keys(filteredMemories).sort((a, b) => b - a);
  const totalMemories = Object.values(filteredMemories).flat().length;
  const totalYears = years.length;

  // Get category styling
  const getCategoryStyle = (category) => {
    const cat = MEMORY_CATEGORIES.find(c => c.id === category);
    return cat || {
      id: category,
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>,
      name: category,
      color: '#2D6FE0',
      bg: '#EAF1FC'
    };
  };

  // Get current year for preview
  const getPreviewText = () => {
    if (!activeYear || years.length === 0) return '';
    return activeYear.toString();
  };

  // Handle year scrubber click
  const scrollToYear = (year) => {
    const element = document.getElementById(`year-${year}`);
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementTop = element.offsetTop;
      const offset = 120; // Account for sticky header

      container.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  };

  // Track active year on scroll and update handle position
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;

      const scrollTop = scrollContainerRef.current.scrollTop;
      sessionStorage.setItem('all_memories_scroll_pos', scrollTop.toString());

      if (isDragging) return;

      const scrollHeight = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight;
      let currentYear = null;
      let currentYearIndex = 0;

      years.forEach((year, index) => {
        const element = document.getElementById(`year-${year}`);
        if (element) {
          const elementTop = element.offsetTop - 150;
          if (scrollTop >= elementTop) {
            currentYear = year;
            currentYearIndex = index;
          }
        }
      });

      if (currentYear !== activeYear) {
        setActiveYear(currentYear);
      }

      // Update handle position based on scroll
      if (years.length > 1 && scrollHeight > 0) {
        const percentage = (currentYearIndex / (years.length - 1)) * 100;
        setHandlePosition(percentage);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Set initial active year
    }

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [years, activeYear, isDragging]);

  // Handle dragging
  const handleDragStart = (e) => {
    setIsDragging(true);
    setDragStartY(e.clientY || e.touches?.[0]?.clientY);
  };

  const handleDragMove = (e) => {
    if (!isDragging || !scrubberRef.current) return;

    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const scrubberRect = scrubberRef.current.getBoundingClientRect();
    const relativeY = clientY - scrubberRect.top;
    const percentage = Math.max(0, Math.min(100, (relativeY / scrubberRect.height) * 100));

    setHandlePosition(percentage);

    // Calculate which year this corresponds to
    const yearIndex = Math.round((percentage / 100) * (years.length - 1));
    const targetYear = years[yearIndex];

    if (targetYear && targetYear !== activeYear) {
      setActiveYear(targetYear);
      scrollToYear(targetYear);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove]);

  if (loading) {
    return (
      <div className="all-memories-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="all-memories-page">
      <div className="memories-scroll-container" ref={scrollContainerRef}>
        {/* Sticky Header */}
        <div className="memories-header">
          <div className="header-top">
            <button className="back-btn" onClick={() => navigate('/')}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div className="header-info">
              <h1 className="header-title">All memories</h1>
              <p className="header-subtitle">
                {totalMemories} moment{totalMemories !== 1 ? 's' : ''} · {totalYears} year{totalYears !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Filter Chips */}
          <div className="filter-chips">
            <button
              className={`filter-chip ${filter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              All
            </button>
            {MEMORY_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`filter-chip ${filter === cat.id ? 'active' : ''}`}
                onClick={() => handleFilterChange(cat.id)}
              >
                <span className="filter-icon">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Memory Groups by Year */}
        <div className="memories-content">
          {years.length === 0 ? (
            <div className="empty-state">
              <p>No memories found</p>
            </div>
          ) : (
            years.map(year => (
              <div key={year} id={`year-${year}`} className="year-group">
                <div className="year-header">
                  <span className="year-label">{year}</span>
                  <span className="year-count">{filteredMemories[year].length}</span>
                  <div className="year-divider"></div>
                </div>

                {filteredMemories[year].map(memory => {
                  const categoryIds = memory.category ? memory.category.split(',').filter(Boolean) : ['first'];
                  const categories = categoryIds.map(id => getCategoryStyle(id));
                  const displayCategory = categories.find(c => c.id !== 'first') || categories[0];
                  const memoryDate = new Date(memory.date);
                  const formattedDate = memoryDate.toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  const imageUrl = memory.image_url ? (
                    memory.image_url.startsWith('[')
                      ? JSON.parse(memory.image_url)[0]
                      : memory.image_url
                  ) : null;

                  return (
                    <div
                      key={memory.id}
                      data-id={memory.id}
                      className={`memory-card ${draggedMemory?.id === memory.id ? 'dragging' : ''} ${touchDraggingId === memory.id ? 'touch-dragging' : ''}`}
                      draggable={!touchDraggingId}
                      onDragStart={(e) => {
                        setDraggedMemory(memory);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => handleDragOverCard(e, memory)}
                      onDragEnd={handleCardDragEnd}
                      onTouchStart={(e) => handleTouchStartCard(e, memory)}
                      onTouchMove={handleTouchMoveCardLocal}
                      onTouchEnd={handleTouchEndCardLocal}
                      onClick={() => handleCardClick(memory)}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={memory.title}
                          className="memory-thumbnail"
                        />
                      ) : (
                        <div className="memory-thumbnail-placeholder" style={{ background: displayCategory.bg, color: displayCategory.color }}>
                          <span className="placeholder-icon">
                            {displayCategory.icon}
                          </span>
                        </div>
                      )}
                      <div className="memory-info">
                        <div className="memory-categories-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                          {categories.map(cat => (
                            <div key={cat.id} className="memory-category" style={{ color: cat.color, background: cat.bg, marginBottom: 0 }}>
                              <span className="category-icon">{cat.icon}</span>
                              <span>{cat.name}</span>
                            </div>
                          ))}
                        </div>
                        <h3 className="memory-title">{memory.title}</h3>
                        <p className="memory-meta">
                          {formattedDate} · by {memory.created_by}
                        </p>
                      </div>
                      <svg className="memory-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C7D6EE" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m9 6 6 6-6 6"></path>
                      </svg>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Year Scrubber - Clean minimal design */}
      {years.length > 1 && (
        <div className="year-scrubber" ref={scrubberRef}>
          {/* Draggable Handle */}
          <div
            className={`scrubber-handle ${isDragging ? 'dragging' : ''}`}
            style={{ top: `${handlePosition}%` }}
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 15l-6-6-6 6" />
            </svg>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>

            {/* Floating Preview - shows on drag or hover */}
            {(isDragging || isHovered) && (
              <div className="scrubber-preview">
                {getPreviewText()}
              </div>
            )}
          </div>
        </div>
      )}
      <FloatingActionButton className="all-memories-fab" />
    </div>
  );
}
