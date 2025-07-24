import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';
import HomeIcon from '@mui/icons-material/Home';
import ChangePassword from '../components/UserModal/ChangePassword';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
const Header: React.FC = () => {
  const { logout, user } = useAuth(); 
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.username || user?.full_name || 'Guest';

  return (
    <AppBar position="fixed" sx={{ 
      background: 'lightblue', 
      boxShadow: '3',
      zIndex: (theme) => theme.zIndex.drawer + 1 
    }}>
      <Toolbar>
      <IconButton
        edge="start"
        color="primary"
        aria-label="home"
        onClick={handleHome}
        sx={{ mr: 2 }}
      >
        <HomeIcon />
      </IconButton>
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'black' }}>
        {currentTime.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        })}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body1" sx={{ color: 'black', fontWeight: 'bold' }}>
        {currentTime.toLocaleTimeString('en-US', {
          hour12: false,
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
        })}
        </Typography>
        <Button
          sx={{ 
            textTransform: 'none', 
            color: 'black',
            fontWeight: 'bold'
          }}
          onClick={() => setOpenModal(true)}
        >
          Welcome, {displayName}
        </Button>
        <ChangePassword 
          open={openModal}
          onClose={() => setOpenModal(false)}
          userId={user?.id ? Number(user.id) : null}
          onPasswordChanged={() => {
            setOpenModal(false);
          }}
        />
        <Button
          sx={{ 
            minWidth: 0,
            color: 'black',
            fontWeight: 'bold',
            ml: 1
          }}
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
        </Button>
        <Button
          sx={{ 
            textTransform: 'none', 
            color: 'black',
            fontWeight: 'bold'
          }}
          onClick={handleLogout}
        >
          | Logout 
        </Button>
      </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;