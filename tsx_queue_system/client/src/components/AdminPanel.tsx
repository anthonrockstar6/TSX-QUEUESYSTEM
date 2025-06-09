import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminPanel: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        await axios.get('/check-session');
        setLoggedIn(true);
      } catch {
        setLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="admin-panel">
      {/* Admin functionalities here */}
    </div>
  );
};

export default AdminPanel;
