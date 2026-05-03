import { useState } from 'react';
import axios from 'axios';
import FlightSearch from './components/FlightSearch';
import FlightDetails from './components/FlightDetails';
import LoadingSpinner from './components/LoadingSpinner';
import Sidebar from './components/Sidebar';
import { AlertCircle } from 'lucide-react';

const API_KEY = import.meta.env.VITE_AIRLABS_API_KEY;
const API_URL = 'https://airlabs.co/api/v9/flight';

function App() {
  const [flightData, setFlightData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (flightNumber) => {
    setLoading(true);
    setError(null);
    setFlightData(null);

    try {
      // Query AirLabs API
      const response = await axios.get(API_URL, {
        params: {
          api_key: API_KEY,
          flight_iata: flightNumber
        }
      });

      if (response.data && response.data.response) {
        const airlabsData = response.data.response;
        
        // Map AirLabs flat response to AviationStack nested structure expected by FlightDetails
        const mappedData = {
          flight_date: airlabsData.dep_time ? airlabsData.dep_time.split(' ')[0] : new Date().toISOString().split('T')[0],
          flight_status: airlabsData.status === 'en-route' ? 'active' : airlabsData.status || 'active',
          departure: {
            airport: airlabsData.dep_name || "Origin Airport",
            timezone: null, // FlightDetails expects UTC offset or parses the literal string
            iata: airlabsData.dep_iata,
            icao: airlabsData.dep_icao,
            terminal: airlabsData.dep_terminal,
            gate: airlabsData.dep_gate,
            // AirLabs returns "YYYY-MM-DD HH:mm". Append :00+00:00 to simulate the AviationStack bogus format that FlightDetails parses literally
            scheduled: airlabsData.dep_time ? airlabsData.dep_time.replace(' ', 'T') + ':00+00:00' : null,
            estimated: airlabsData.dep_estimated ? airlabsData.dep_estimated.replace(' ', 'T') + ':00+00:00' : null,
            actual: airlabsData.dep_actual ? airlabsData.dep_actual.replace(' ', 'T') + ':00+00:00' : null
          },
          arrival: {
            airport: airlabsData.arr_name || "Destination Airport",
            timezone: null,
            iata: airlabsData.arr_iata,
            icao: airlabsData.arr_icao,
            terminal: airlabsData.arr_terminal,
            gate: airlabsData.arr_gate,
            scheduled: airlabsData.arr_time ? airlabsData.arr_time.replace(' ', 'T') + ':00+00:00' : null,
            estimated: airlabsData.arr_estimated ? airlabsData.arr_estimated.replace(' ', 'T') + ':00+00:00' : null,
            actual: airlabsData.arr_actual ? airlabsData.arr_actual.replace(' ', 'T') + ':00+00:00' : null
          },
          airline: {
            name: airlabsData.airline_name || "Unknown Airline",
            iata: airlabsData.airline_iata,
            icao: airlabsData.airline_icao
          },
          flight: {
            number: airlabsData.flight_number,
            iata: airlabsData.flight_iata,
            icao: airlabsData.flight_icao,
          },
          aircraft: {
            registration: airlabsData.reg_number,
            iata: airlabsData.aircraft_icao,
          },
          live: {
            altitude: airlabsData.alt,
            direction: airlabsData.dir,
            speed_horizontal: airlabsData.speed,
            speed_vertical: airlabsData.v_speed
          }
        };

        setFlightData(mappedData);
      } else {
        setError('No active flights found with this number. Please check the flight number and try again.');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to fetch flight data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem 1rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <FlightSearch onSearch={handleSearch} isLoading={loading} />
      
      <div className="app-container">
        <Sidebar onSelectFlight={handleSearch} />
        
        <div className="main-content">
          {loading && <LoadingSpinner />}
          
          {error && (
            <div 
              className="animate-fade-in" 
              style={{ 
                maxWidth: '800px', 
                margin: '0 auto', 
                padding: '1rem', 
                backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                width: '100%'
              }}
            >
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          )}

          {flightData && !loading && (
            <FlightDetails flight={flightData} />
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
