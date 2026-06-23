import { useNavigate } from 'react-router-dom';
import '../styles/FloatingActionButton.css';

export default function FloatingActionButton({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button className={`fab ${className}`} onClick={() => navigate('/add')}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
    </button>
  );
}
