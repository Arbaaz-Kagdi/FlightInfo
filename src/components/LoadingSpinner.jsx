import { Plane } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loader-container animate-fade-in">
      <div className="radar-spinner">
        <div className="radar-sweep"></div>
        <Plane className="radar-plane" size={24} />
      </div>
      <p className="loading-text">Locating flight...</p>
    </div>
  );
};

export default LoadingSpinner;
