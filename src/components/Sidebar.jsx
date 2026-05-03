import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plane, AlertTriangle } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ onSelectFlight }) => {
  const [trackedOpen, setTrackedOpen] = useState(true);
  const [disruptionsOpen, setDisruptionsOpen] = useState(false);

  const mostTracked = [
    { flight: 'AI2027', airline: 'Air India', route: 'BOM - FRA' },
    { flight: 'BA12', airline: 'British Airways', route: 'SIN - LHR' },
    { flight: 'EK1', airline: 'Emirates', route: 'DXB - LHR' },
    { flight: 'SQ322', airline: 'Singapore Airlines', route: 'SIN - LHR' },
    { flight: 'AF65', airline: 'Air France', route: 'LAX - CDG' }
  ];

  const disruptions = [
    { airport: 'JFK', issue: 'Heavy Snow', delay: 'Avg 45m delay' },
    { airport: 'LHR', issue: 'High Winds', delay: 'Avg 30m delay' },
    { airport: 'DXB', issue: 'Runway Maintenance', delay: 'Minor delays' },
    { airport: 'ORD', issue: 'Equipment Failure', delay: 'Avg 1h delay' }
  ];

  return (
    <aside className="sidebar animate-fade-in">
      <div className="accordion glass-panel">
        <div className="accordion-header" onClick={() => setTrackedOpen(!trackedOpen)}>
          <div className="accordion-title">
            <Plane size={18} />
            <span>Most Tracked Flights</span>
          </div>
          {trackedOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {trackedOpen && (
          <div className="accordion-content">
            <ul className="flight-list">
              {mostTracked.map((item, idx) => (
                <li key={idx} className="flight-item" onClick={() => onSelectFlight(item.flight)}>
                  <div className="flight-item-header">
                    <span className="flight-num">{item.flight}</span>
                    <span className="flight-airline">{item.airline}</span>
                  </div>
                  <div className="flight-route">{item.route}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="accordion glass-panel">
        <div className="accordion-header" onClick={() => setDisruptionsOpen(!disruptionsOpen)}>
          <div className="accordion-title" style={{ color: '#ef4444' }}>
            <AlertTriangle size={18} />
            <span style={{ color: 'var(--text-primary)' }}>Airport Disruptions</span>
          </div>
          {disruptionsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
        
        {disruptionsOpen && (
          <div className="accordion-content">
            <ul className="disruption-list">
              {disruptions.map((item, idx) => (
                <li key={idx} className="disruption-item">
                  <div className="disruption-airport">{item.airport}</div>
                  <div className="disruption-details">
                    <span className="disruption-issue">{item.issue}</span>
                    <span className="disruption-delay">{item.delay}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
