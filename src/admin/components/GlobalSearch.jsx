import React, { useState, useEffect, useRef } from 'react';
import { useAdminData } from '../context/AdminDataContext';
import busIcon from '../../assets/bus_option_new.png';

export default function GlobalSearch({ setGlobalView }) {
  const { schedules } = useAdminData();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ places: [], routes: [], buses: [] });
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ places: [], routes: [], buses: [] });
      return;
    }

    const q = query.toLowerCase();
    const placesSet = new Set();
    const matchedRoutes = [];
    const matchedBuses = [];

    schedules.forEach(schedule => {
      // Check places
      if (schedule.source?.toLowerCase().includes(q)) placesSet.add(schedule.source);
      if (schedule.destination?.toLowerCase().includes(q)) placesSet.add(schedule.destination);

      // Check routes
      const sourceMatch = schedule.source?.toLowerCase();
      const destMatch = schedule.destination?.toLowerCase();
      const routeNumMatch = schedule.routeNumber?.toLowerCase();
      const viaMatch = schedule.via?.toLowerCase();

      if (sourceMatch === q || destMatch === q || routeNumMatch === q) {
        matchedRoutes.unshift(schedule); // Exact matches first
      } else if (
        sourceMatch?.startsWith(q) || destMatch?.startsWith(q) || routeNumMatch?.startsWith(q)
      ) {
        // Starts with goes after exact
        const exactIndex = matchedRoutes.findIndex(r => r.source?.toLowerCase() !== q && r.destination?.toLowerCase() !== q && r.routeNumber?.toLowerCase() !== q);
        if (exactIndex === -1) matchedRoutes.push(schedule);
        else matchedRoutes.splice(exactIndex, 0, schedule);
      } else if (
        sourceMatch?.includes(q) || destMatch?.includes(q) || routeNumMatch?.includes(q) || viaMatch?.includes(q)
      ) {
        matchedRoutes.push(schedule); // Includes goes last
      }

      // Check buses
      const times = schedule.departure_times || [];
      const busDetails = schedule.bus_details || {};
      
      times.forEach(time => {
        const details = busDetails[time] || {};
        const busNum = details.busNumber?.toLowerCase() || '';
        const operator = details.operatorName?.toLowerCase() || '';
        const busType = details.busType?.toLowerCase() || '';
        
        const isMatch = time.includes(q) || busNum.includes(q) || operator.includes(q) || busType.includes(q) || sourceMatch?.includes(q) || destMatch?.includes(q);
        
        if (isMatch) {
          const busItem = {
            id: `${schedule.id}_${time}`,
            routeId: schedule.id,
            source: schedule.source,
            destination: schedule.destination,
            time,
            busNumber: details.busNumber || 'N/A'
          };

          if (time === q || busNum === q) {
            matchedBuses.unshift(busItem);
          } else {
            matchedBuses.push(busItem);
          }
        }
      });
    });

    // Deduplicate routes by ID
    const uniqueRoutes = Array.from(new Map(matchedRoutes.map(item => [item.id, item])).values());

    // Sort places to prioritize exact matches
    const placesArray = Array.from(placesSet).sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      if (aLower === q) return -1;
      if (bLower === q) return 1;
      if (aLower.startsWith(q) && !bLower.startsWith(q)) return -1;
      if (!aLower.startsWith(q) && bLower.startsWith(q)) return 1;
      return 0;
    });

    setResults({
      places: placesArray.slice(0, 4),
      routes: uniqueRoutes.slice(0, 4),
      buses: matchedBuses.slice(0, 5)
    });
  }, [query, schedules]);

  const handleSelect = (view) => {
    setGlobalView(view);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="admin-input"
        style={{ 
          width: '100%', 
          paddingLeft: '44px', 
          backgroundColor: '#FFFFFF', 
          color: '#000000',
          border: 'none',
          height: '40px',
          borderRadius: '999px',
          fontSize: '0.95rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
        placeholder="Global Search..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        aria-label="Global Search"
      />
      <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#757575', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </div>

      {query && (
        <button 
          onClick={() => { setQuery(''); setIsOpen(false); }}
          style={{ 
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', 
            background: 'none', border: 'none', color: '#757575', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '50%'
          }}
          aria-label="Clear search"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}

      {isOpen && (
        <div className="admin-animate-fade" style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0, 
          backgroundColor: '#FFFFFF', 
          border: '1px solid var(--admin-border)',
          borderRadius: 'var(--admin-radius)', marginTop: '8px', 
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)', zIndex: 100,
          maxHeight: '400px', overflowY: 'auto',
          overflowX: 'hidden',
          color: '#000000'
        }}>
          {!query.trim() ? (
            <div style={{ padding: '12px 0' }}>
              <div style={{ padding: '4px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Quick Actions</div>
              <div className="admin-nav-item" style={{ padding: '10px 20px', borderRadius: 0, borderBottom: '1px solid var(--admin-bg-surface)', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => handleSelect('dashboard')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-secondary)" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                Dashboard Overview
              </div>
              <div className="admin-nav-item" style={{ padding: '10px 20px', borderRadius: 0, borderBottom: '1px solid var(--admin-bg-surface)', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => handleSelect('places')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-secondary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Manage Places
              </div>
              <div className="admin-nav-item" style={{ padding: '10px 20px', borderRadius: 0, borderBottom: '1px solid var(--admin-bg-surface)', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => handleSelect('routes')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-secondary)" strokeWidth="2"><path d="M3 18h18"/><path d="M3 12h18"/><path d="M3 6h18"/></svg>
                Manage Routes
              </div>
              <div className="admin-nav-item" style={{ padding: '10px 20px', borderRadius: 0, borderBottom: '1px solid var(--admin-bg-surface)', color: '#000', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => handleSelect('buses')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-secondary)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Manage Buses & Timings
              </div>
            </div>
          ) : results.places.length === 0 && results.routes.length === 0 && results.buses.length === 0 ? (
            <div style={{ padding: '32px 24px', color: 'var(--admin-text-secondary)', textAlign: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5, marginBottom: '12px' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <div style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>No results found</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>Try searching for a different place or route number.</div>
            </div>
          ) : (
            <div style={{ padding: '12px 0' }}>
              {results.places.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '4px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Places</div>
                  {results.places.map(p => (
                    <div key={p} className="admin-nav-item" style={{ padding: '10px 20px', borderRadius: 0, borderBottom: '1px solid var(--admin-bg-surface)', color: '#000', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => handleSelect('places')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-secondary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <span style={{ fontWeight: 600 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {results.routes.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '4px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Routes</div>
                  {results.routes.map(r => (
                    <div key={r.id} className="admin-nav-item" style={{ padding: '10px 20px', borderRadius: 0, borderBottom: '1px solid var(--admin-bg-surface)', color: '#000', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => handleSelect('routes')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-secondary)" strokeWidth="2"><path d="M3 18h18"/><path d="M3 12h18"/><path d="M3 6h18"/></svg>
                      <div>
                        {r.source} <span style={{ color: 'var(--admin-text-secondary)', margin: '0 4px' }}>➔</span> {r.destination} {r.routeNumber ? <span className="admin-badge admin-badge-success" style={{ marginLeft: '8px' }}>{r.routeNumber}</span> : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.buses.length > 0 && (
                <div>
                  <div style={{ padding: '4px 20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--admin-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Buses & Timings</div>
                  {results.buses.map(b => (
                    <div key={b.id} className="admin-nav-item" style={{ padding: '10px 20px', borderRadius: 0, borderBottom: '1px solid var(--admin-bg-surface)', color: '#000', display: 'flex', alignItems: 'center', gap: '12px' }} onClick={() => handleSelect('buses')}>
                      <img src={busIcon} alt="Bus" style={{ width: '14px', height: '14px', opacity: 0.6 }} /> 
                      <div>
                        <span style={{ fontWeight: 700, color: '#000' }}>{b.time}</span> <span style={{ margin: '0 8px', color: 'var(--admin-border)' }}>|</span> {b.source} <span style={{ color: 'var(--admin-text-secondary)' }}>➔</span> {b.destination} <span style={{ color: 'var(--admin-text-secondary)', marginLeft: '8px' }}>[{b.busNumber}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
