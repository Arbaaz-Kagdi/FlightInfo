import { Plane, MapPin, Clock, Calendar, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import './FlightDetails.css';

const FlightDetails = ({ flight }) => {
  const [altUnit, setAltUnit] = useState('m');
  const [speedUnit, setSpeedUnit] = useState('km/h');

  if (!flight) return null;

  // Extract relevant data from Aviation Stack response format
  // Note: the exact structure depends on the API, this assumes standard aviationstack flight structure
  const {
    flight_date,
    flight_status,
    departure,
    arrival,
    airline,
    flight: flightInfo,
    live,
    aircraft
  } = flight;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#10b981'; // green
      case 'scheduled': return '#3b82f6'; // blue
      case 'landed': return '#8b5cf6'; // purple
      case 'cancelled': return '#ef4444'; // red
      case 'incident': return '#f59e0b'; // orange
      case 'diverted': return '#f97316'; // orange
      default: return '#9ca3af'; // gray
    }
  };

  const getOffsetMs = (timeZone, dateString) => {
    if (!timeZone) return 0;
    try {
      const date = dateString ? new Date(dateString) : new Date();
      const tzStr = date.toLocaleString('en-US', { timeZone, hour12: false }).replace(' 24:', ' 00:');
      const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC', hour12: false }).replace(' 24:', ' 00:');
      return new Date(tzStr).getTime() - new Date(utcStr).getTime();
    } catch(e) {
      return 0;
    }
  };

  const getDerivedStatus = (flight) => {
    let status = flight?.flight_status?.toLowerCase();
    if (status === 'active' && flight?.arrival) {
      try {
        const arrTime = flight.arrival.actual || flight.arrival.estimated || flight.arrival.scheduled;
        if (arrTime) {
          const arr = new Date(arrTime);
          const arrTrueUtc = arr.getTime() - getOffsetMs(flight.arrival.timezone, arrTime);
          if (Date.now() >= arrTrueUtc) {
            return 'landed';
          }
        }
      } catch (e) {
        // ignore
      }
    }
    return status;
  };

  const displayStatus = getDerivedStatus(flight);
  const statusColor = getStatusColor(displayStatus);

  const getPlaneProgress = (flight, currentStatus) => {
    if (currentStatus === 'scheduled' || currentStatus === 'cancelled') return 0;
    if (currentStatus === 'landed') return 1;
    
    if (currentStatus === 'active' && flight?.departure && flight?.arrival) {
      try {
        const depTime = flight.departure.actual || flight.departure.scheduled;
        const arrTime = flight.arrival.estimated || flight.arrival.scheduled;
        
        if (depTime && arrTime) {
          const dep = new Date(depTime);
          const arr = new Date(arrTime);
          
          const depTrueUtc = dep.getTime() - getOffsetMs(flight.departure.timezone, depTime);
          const arrTrueUtc = arr.getTime() - getOffsetMs(flight.arrival.timezone, arrTime);
          
          const nowTrueUtc = Date.now();
          let totalMs = arrTrueUtc - depTrueUtc;
          if (totalMs < 0) totalMs += 24 * 60 * 60 * 1000;
          
          const elapsedMs = nowTrueUtc - depTrueUtc;
          if (totalMs > 0) {
            let p = elapsedMs / totalMs;
            if (p < 0) return 0.02; // Just departed
            if (p > 1) return 0.98; // Almost landed
            return p;
          }
        }
      } catch (e) {
        return 0.5;
      }
    }
    return 0.5;
  };

  const progress = getPlaneProgress(flight, displayStatus);
  
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrameId;
    const startTime = Date.now();
    const animate = () => {
      setTime((Date.now() - startTime) / 1000);
      animationFrameId = requestAnimationFrame(animate);
    };
    if (displayStatus === 'active') {
      animate();
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [displayStatus]);

  const numPoints = 60;
  const bgPoints = new Array(numPoints + 1);
  const activePoints = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const xNorm = i / numPoints;
    const X = 10 + xNorm * 80;
    const env = Math.sin(xNorm * Math.PI);
    const w = Math.sin(xNorm * Math.PI * 4 - time * 3);
    const Y = 25 - 15 * env * w;
    const pt = `${i === 0 ? 'M' : 'L'} ${X.toFixed(2)},${Y.toFixed(2)}`;
    
    bgPoints[i] = pt;
    if (xNorm <= progress) {
      activePoints.push(pt);
    }
  }
  
  const planeX = 10 + progress * 80;
  const planeEnv = Math.sin(progress * Math.PI);
  const planeWave = Math.sin(progress * Math.PI * 4 - time * 3);
  const planeY = 25 - 15 * planeEnv * planeWave;

  if (progress > 0 && progress < 1) {
    activePoints.push(`L ${planeX.toFixed(2)},${planeY.toFixed(2)}`);
  }

  const bgPathD = bgPoints.join(' ');
  const activePathD = activePoints.join(' ');

  const dYdx = -15 * (
    Math.PI * Math.cos(progress * Math.PI) * planeWave + 
    planeEnv * 4 * Math.PI * Math.cos(progress * Math.PI * 4 - time * 3)
  );
  // Add 45deg to compensate for Lucide Plane icon's native top-right diagonal orientation
  const rotation = 45 + Math.atan2(dYdx * 0.3, 80) * (180 / Math.PI);

  const calculateDuration = (depTime, arrTime, depZone, arrZone) => {
    if (!depTime || !arrTime) return '--';
    try {
      const dep = new Date(depTime);
      const arr = new Date(arrTime);
      
      const depTrueUtc = dep.getTime() - getOffsetMs(depZone, depTime);
      const arrTrueUtc = arr.getTime() - getOffsetMs(arrZone, arrTime);
      
      let diffMs = arrTrueUtc - depTrueUtc;
      // Handle edge cases where flights cross midnight or dates aren't aligned
      if (diffMs < 0) diffMs += 24 * 60 * 60 * 1000;
      if (isNaN(diffMs)) return '--';
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch (e) {
      return '--';
    }
  };

  const estimatedDuration = calculateDuration(
    departure?.scheduled,
    arrival?.estimated || arrival?.scheduled,
    departure?.timezone,
    arrival?.timezone
  );

  const formatTime = (timeString, timeZone) => {
    if (!timeString) return '--:--';
    try {
      // Aviation Stack API provides times in local time but appends a bogus +00:00 UTC offset
      // (e.g. "2026-04-26T20:45:00+00:00"). If we parse this with new Date(), it shifts the time.
      // Instead, we directly extract the literal HH:mm from the string.
      const timePart = timeString.split('T')[1];
      if (!timePart) return '--:--';
      
      const [hourStr, minuteStr] = timePart.split(':');
      let hour = parseInt(hourStr, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      
      hour = hour % 12;
      hour = hour ? hour : 12; // the hour '0' should be '12'
      
      return `${hour}:${minuteStr} ${ampm}`;
    } catch (e) {
      return '--:--';
    }
  };

  const getDisplayAltitude = (altMeters) => {
    if (!altMeters) return 'N/A';
    if (altUnit === 'ft') return `${Math.round(altMeters * 3.28084)} ft`;
    return `${Math.round(altMeters)} m`;
  };

  const getDisplaySpeed = (speedKmh) => {
    if (!speedKmh) return 'N/A';
    if (speedUnit === 'mph') return `${Math.round(speedKmh * 0.621371)} mph`;
    if (speedUnit === 'kt') return `${Math.round(speedKmh * 0.539957)} kt`;
    return `${Math.round(speedKmh)} km/h`;
  };

  const getDisplayVerticalSpeed = (speedMs) => {
    if (!speedMs) return 'N/A';
    if (altUnit === 'ft') {
      // 1 m/s = 196.85 ft/min
      return `${Math.round(speedMs * 196.85)} ft/min`;
    }
    return `${Math.round(speedMs)} m/s`;
  };

  return (
    <div className="flight-details-card glass-panel animate-fade-in">
      
      {/* Header section */}
      <div className="card-header">
        <div className="header-top">
          <div className="flight-identifiers">
            <span className="callsign">{flightInfo?.iata || flightInfo?.icao || 'UNKNOWN'}</span>
            {(flightInfo?.number) && <span className="flight-num-badge">{airline?.iata}{flightInfo.number}</span>}
            {aircraft?.iata && <span className="aircraft-badge">{aircraft.iata}</span>}
          </div>
          <div 
            className="status-badge" 
            style={{ backgroundColor: `${statusColor}20`, color: statusColor, borderColor: `${statusColor}40` }}
          >
            {displayStatus ? displayStatus.toUpperCase() : 'UNKNOWN'}
          </div>
        </div>
        <h2 className="airline-name">{airline?.name || 'Unknown Airline'}</h2>
      </div>

    {/* Flight Progress / Journey */}
    <div className="journey-section">
      <div className="location dep">
        <h3>{departure?.iata || '--'}</h3>
        <p className="airport-name">{departure?.airport || 'Origin'}</p>
        <span className="timezone-label">{departure?.timezone?.replace('_', ' ') || ''}</span>
      </div>

      <div className="flight-path">
        <svg className="curve-svg" viewBox="0 0 100 50" preserveAspectRatio="none">
          {/* Background track */}
          <path 
            d={bgPathD} 
            fill="none" 
            stroke="var(--glass-border, rgba(255,255,255,0.2))" 
            strokeWidth="2" 
            strokeDasharray="4 4" 
            vectorEffect="non-scaling-stroke" 
          />
          {/* Flown solid track */}
          {progress > 0 && (
            <path 
              d={activePathD} 
              fill="none" 
              stroke={statusColor} 
              strokeWidth="2" 
              vectorEffect="non-scaling-stroke" 
            />
          )}
        </svg>
        <div 
          className={`path-plane-wrapper ${displayStatus === 'active' ? 'active' : ''}`}
          style={{ 
            '--plane-x': `${planeX}%`, 
            '--plane-y': `${planeY * 2}%`,
            '--plane-rot': `${rotation}deg`,
            '--progress-t': progress,
            '--status-color': statusColor
          }}
        >
          <Plane className="path-plane" size={24} style={{ color: statusColor }} />
        </div>
      </div>

      <div className="location arr">
        <h3>{arrival?.iata || '--'}</h3>
        <p className="airport-name">{arrival?.airport || 'Destination'}</p>
        <span className="timezone-label">{arrival?.timezone?.replace('_', ' ') || ''}</span>
      </div>
    </div>

      {/* Time Grid */}
      <div className="time-grid">
        <div className="time-column">
          <div className="time-row">
            <span className="time-label">SCHEDULED</span>
            <span className="time-value">{formatTime(departure?.scheduled, departure?.timezone)}</span>
          </div>
          <div className="time-row">
            <span className="time-label">ACTUAL</span>
            <span className="time-value highlighted">{formatTime(departure?.actual || departure?.estimated, departure?.timezone)}</span>
          </div>
        </div>
        <div className="time-divider"></div>
        <div className="time-column">
          <div className="time-row">
            <span className="time-label">SCHEDULED</span>
            <span className="time-value">{formatTime(arrival?.scheduled, arrival?.timezone)}</span>
          </div>
          <div className="time-row">
            <span className="time-label">ESTIMATED</span>
            <span className="time-value highlighted" style={{ color: statusColor }}>
              {formatTime(arrival?.estimated || arrival?.actual, arrival?.timezone)}
            </span>
          </div>
        </div>
      </div>

      {/* More Information Section */}
      <div className="info-section">
        <div className="section-header">
          <Info size={16} />
          <h4>More {flightInfo?.iata || 'Flight'} Information</h4>
        </div>
        <div className="info-grid">
          <div className="info-box">
            <span className="info-label">AIRCRAFT TYPE</span>
            <span className="info-value">{aircraft?.iata || 'N/A'}</span>
          </div>
          <div className="info-box">
            <span className="info-label">REGISTRATION</span>
            <span className="info-value">{aircraft?.registration || 'N/A'}</span>
          </div>
          <div className="info-box">
            <span className="info-label">ESTIMATED FLIGHT TIME</span>
            <span className="info-value">{estimatedDuration}</span>
          </div>
        </div>
      </div>

      {/* Live Telemetry Section (If available) */}
      {(live?.altitude || live?.speed_horizontal || live?.direction) && (
        <div className="info-section telemetry-section">
          <div className="section-header">
            <Plane size={16} />
            <h4>Live Telemetry</h4>
          </div>
          <div className="info-grid telemetry-grid">
            <div className="info-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="info-label">ALTITUDE</span>
                <div className="unit-pills">
                  <button className={`unit-pill ${altUnit === 'm' ? 'active' : ''}`} onClick={() => setAltUnit('m')}>m</button>
                  <button className={`unit-pill ${altUnit === 'ft' ? 'active' : ''}`} onClick={() => setAltUnit('ft')}>ft</button>
                </div>
              </div>
              <span className="info-value">{getDisplayAltitude(live.altitude)}</span>
            </div>
            <div className="info-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="info-label">GROUND SPEED</span>
                <div className="unit-pills">
                  <button className={`unit-pill ${speedUnit === 'km/h' ? 'active' : ''}`} onClick={() => setSpeedUnit('km/h')}>km/h</button>
                  <button className={`unit-pill ${speedUnit === 'mph' ? 'active' : ''}`} onClick={() => setSpeedUnit('mph')}>mph</button>
                  <button className={`unit-pill ${speedUnit === 'kt' ? 'active' : ''}`} onClick={() => setSpeedUnit('kt')}>kt</button>
                </div>
              </div>
              <span className="info-value">{getDisplaySpeed(live.speed_horizontal)}</span>
            </div>
            <div className="info-box">
              <span className="info-label">TRACK</span>
              <span className="info-value">{live.direction ? `${Math.round(live.direction)}°` : 'N/A'}</span>
            </div>
            <div className="info-box">
              <span className="info-label">VERTICAL SPEED</span>
              <span className="info-value">{getDisplayVerticalSpeed(live.speed_vertical)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightDetails;
