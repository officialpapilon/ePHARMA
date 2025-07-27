import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
  Chip,
  Button,
  Grid,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  AccountCircle,
  Settings,
  Logout,
  LightMode,
  DarkMode,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useThemeContext } from '../../../contexts/ThemeContext';
import ChangePasswordModal from '../../UserModal/ChangePassword';
import Modal from '../../common/Modal/Modal';
import { useNotification } from '../../../hooks/useNotification';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  showMenuButton = false,
  title,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { showSuccess } = useNotification();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Remove branches state and useEffect

  // Get branch info from localStorage (set at login)
  const branchName = localStorage.getItem('branch_name');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleProfile = () => {
    setShowProfileModal(true);
    handleProfileMenuClose();
  };

  const displayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Guest';

  const userInitials = user?.first_name && user?.last_name
    ? `${user.first_name[0]}${user.last_name[0]}`
    : user?.username?.[0]?.toUpperCase() || 'G';

  return (
    <>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${theme.palette.divider}`,
          color: theme.palette.text.primary,
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {showMenuButton && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={onMenuClick}
                sx={{
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <IconButton
              color="inherit"
              onClick={() => navigate('/')}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <Home />
            </IconButton>

            {title && (
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </Box>

            <Chip
              label={currentTime.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
              variant="outlined"
              size="small"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 600,
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
              }}
            />

            <IconButton
              onClick={toggleTheme}
              color="inherit"
              title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              {mode === 'light' ? <DarkMode /> : <LightMode />}
            </IconButton>

            <IconButton
              color="inherit"
              sx={{
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
              }}
            >
              <Notifications />
            </IconButton>

            {/* User Profile */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'right' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {displayName}
                </Typography>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 500 }}>
                  {user?.position || 'User'}
                </Typography>
              </Box>

              <IconButton
                onClick={handleProfileMenuOpen}
                sx={{
                  p: 0,
                  '&:hover': {
                    '& .MuiAvatar-root': {
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: theme.palette.primary.main,
                    color: theme.palette.primary.contrastText,
                    fontWeight: 600,
                    transition: 'transform 0.2s ease',
                  }}
                >
                  {userInitials}
                </Avatar>
              </IconButton>
            </Box>
          </Box>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            PaperProps={{
              elevation: 8,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                mt: 1.5,
                minWidth: 200,
                borderRadius: 2,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {user?.email}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleProfile}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { setShowChangePasswordModal(true); handleProfileMenuClose(); }}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText>Change Password</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: theme.palette.error.main }} />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      {/* Profile Modal */}
      <Modal
        open={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="User Profile"
        maxWidth="sm"
        actions={
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setShowProfileModal(false)}>
              Close
            </Button>
          </Box>
        }
      >
        {user && (
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                      fontWeight: 600,
                      fontSize: '2rem',
                    }}
                  >
                    {userInitials}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {displayName}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {user.position || 'User'}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">First Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.first_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Last Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.last_name || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Username</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.username}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Email</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.email || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Position</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.position || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">User ID</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.id}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Phone Number</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.phone_number || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">Address</Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.address || 'N/A'}</Typography>
              </Grid>
            </Grid>
            {/* Branches Section */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Branch: {branchName}
              </Typography>
              {/* If user has multiple belonged_branches, show their IDs */}
              {user.belonged_branches && user.belonged_branches.length > 1 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Other Branch IDs:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{user.belonged_branches.join(', ')}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        )}
      </Modal>
      
      {/* Use the existing ChangePasswordModal component */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        userId={user?.id || null}
        onPasswordChanged={() => {
          showSuccess('Password changed successfully!');
        }}
      />
    </>
  );
};

export default Header;