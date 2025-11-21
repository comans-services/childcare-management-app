import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ChildcareMonitorIndex = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the rooms list page
    navigate('/childcare-monitor/rooms');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-care-green text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Childcare Room Monitor</h1>
        <p className="text-xl text-care-lightText">Loading rooms list...</p>
      </div>
    </div>
  );
};

export default ChildcareMonitorIndex;
