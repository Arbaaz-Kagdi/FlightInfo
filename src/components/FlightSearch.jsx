import { useState } from 'react';
import { Plane, Search } from 'lucide-react';
import './FlightSearch.css';

const FlightSearch = ({ onSearch, isLoading }) => {
  const [flightNumber, setFlightNumber] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (flightNumber.trim() && !isLoading) {
      onSearch(flightNumber.trim());
    }
  };

  return (
    <div className="flight-search-container animate-fade-in">
      <div className="search-header">
        <Plane className="search-icon" size={32} />
        <h1>Track Your Flight</h1>
        <p>Enter a flight number to get real-time status and details.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group">
          <Search className="input-icon" size={20} />
          <input
            type="text"
            value={flightNumber}
            onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
            placeholder="e.g. AA123"
            className="flight-input"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className={`search-button ${isLoading ? 'loading' : ''}`}
            disabled={isLoading || !flightNumber.trim()}
          >
            {isLoading ? 'Searching...' : 'Search Flight'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FlightSearch;
