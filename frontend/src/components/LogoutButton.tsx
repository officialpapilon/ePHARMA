import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();

  useEffect(() => {
    
    onLogout();
    // Redirect to home page
    navigate('/');
  }, [navigate, onLogout]);

  return null; 
};

export default Logout;
