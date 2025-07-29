import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { ArrowBack, Lock, Phone, CheckCircle, Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../../constants';

interface ForgotPasswordStep {
  label: string;
  description: string;
}

const steps: ForgotPasswordStep[] = [
  {
    label: 'Verify Identity',
    description: 'Enter your username and phone number',
  },
  {
    label: 'Enter Code',
    description: 'Enter the verification code sent to your phone',
  },
  {
    label: 'Reset Password',
    description: 'Enter your new password',
  },
];

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1: Identity verification
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Step 2: Token verification
  const [resetToken, setResetToken] = useState('');
  const [receivedToken, setReceivedToken] = useState('');

  // Step 3: Password reset
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleBack = () => {
    navigate('/login');
  };

  const handleRequestReset = async () => {
    if (!username || !phoneNumber) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          phone_number: phoneNumber,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReceivedToken(data.reset_token); // In production, this would be sent via SMS
        setSuccess('Verification code sent to your phone number');
        setActiveStep(1);
      } else {
        setError(data.message || 'Failed to send verification code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToken = async () => {
    if (!resetToken) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/verify-reset-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reset_token: resetToken,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setSuccess('Verification code is valid');
        setActiveStep(2);
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reset_token: resetToken,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'white', mb: 2 }}>
              Verify Your Identity
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Enter your username and phone number to receive a verification code.
            </Typography>
            
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.8)",
                    borderWidth: "1px",
                  },
                  "& input::placeholder": {
                    color: "rgba(255, 255, 255, 0.7)",
                    opacity: 1,
                  },
                },
                "& .MuiInputBase-input": {
                  color: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "rgba(0, 255, 255, 0.8)",
                  },
                },
              }}
            />
            
            <TextField
              fullWidth
              label="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              margin="normal"
              required
              placeholder="e.g., 1234567890"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.8)",
                    borderWidth: "1px",
                  },
                  "& input::placeholder": {
                    color: "rgba(255, 255, 255, 0.7)",
                    opacity: 1,
                  },
                },
                "& .MuiInputBase-input": {
                  color: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "rgba(0, 255, 255, 0.8)",
                  },
                },
              }}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleRequestReset}
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: "12px",
                background: "linear-gradient(45deg, #00c6c6 0%, #0082c8 100%)",
                color: "white",
                fontWeight: 500,
                fontSize: "1rem",
                textTransform: "none",
                boxShadow: "0 4px 20px rgba(0, 198, 198, 0.3)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(45deg, #00b4b4 0%, #0072b8 100%)",
                  boxShadow: "0 6px 24px rgba(0, 198, 198, 0.4)",
                },
                "&.Mui-disabled": {
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
              startIcon={loading ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : <Phone />}
            >
              {loading ? 'Sending Code...' : 'Send Verification Code'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'white', mb: 2 }}>
              Enter Verification Code
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Enter the 6-digit code sent to your phone number.
            </Typography>
            
            <TextField
              fullWidth
              label="Verification Code"
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
              margin="normal"
              required
              placeholder="Enter 6-digit code"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.8)",
                    borderWidth: "1px",
                  },
                  "& input::placeholder": {
                    color: "rgba(255, 255, 255, 0.7)",
                    opacity: 1,
                  },
                },
                "& .MuiInputBase-input": {
                  color: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "rgba(0, 255, 255, 0.8)",
                  },
                },
              }}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyToken}
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: "12px",
                background: "linear-gradient(45deg, #00c6c6 0%, #0082c8 100%)",
                color: "white",
                fontWeight: 500,
                fontSize: "1rem",
                textTransform: "none",
                boxShadow: "0 4px 20px rgba(0, 198, 198, 0.3)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(45deg, #00b4b4 0%, #0072b8 100%)",
                  boxShadow: "0 6px 24px rgba(0, 198, 198, 0.4)",
                },
                "&.Mui-disabled": {
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
              startIcon={loading ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : <CheckCircle />}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'white', mb: 2 }}>
              Set New Password
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
              Enter your new password. It must be at least 8 characters long.
            </Typography>
            
            <TextField
              fullWidth
              label="New Password"
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.8)",
                    borderWidth: "1px",
                  },
                  "& input::placeholder": {
                    color: "rgba(255, 255, 255, 0.7)",
                    opacity: 1,
                  },
                },
                "& .MuiInputBase-input": {
                  color: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "rgba(0, 255, 255, 0.8)",
                  },
                },
              }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: "rgba(255, 255, 255, 0.7)" }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "white",
                  "& fieldset": {
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  },
                  "&:hover fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.5)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "rgba(0, 255, 255, 0.8)",
                    borderWidth: "1px",
                  },
                  "& input::placeholder": {
                    color: "rgba(255, 255, 255, 0.7)",
                    opacity: 1,
                  },
                },
                "& .MuiInputBase-input": {
                  color: "white",
                },
                "& .MuiInputLabel-root": {
                  color: "rgba(255, 255, 255, 0.7)",
                  "&.Mui-focused": {
                    color: "rgba(0, 255, 255, 0.8)",
                  },
                },
              }}
            />
            
            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading}
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: "12px",
                background: "linear-gradient(45deg, #00c6c6 0%, #0082c8 100%)",
                color: "white",
                fontWeight: 500,
                fontSize: "1rem",
                textTransform: "none",
                boxShadow: "0 4px 20px rgba(0, 198, 198, 0.3)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "linear-gradient(45deg, #00b4b4 0%, #0072b8 100%)",
                  boxShadow: "0 6px 24px rgba(0, 198, 198, 0.4)",
                },
                "&.Mui-disabled": {
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "rgba(255, 255, 255, 0.5)",
                },
              }}
              startIcon={loading ? <CircularProgress size={20} sx={{ color: "inherit" }} /> : <Lock />}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #001f3f 0%, #003366 100%)",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: `
          linear-gradient(135deg, 
            rgba(255, 255, 255, 0.02) 25%, 
            transparent 25%, 
            transparent 50%, 
            rgba(255, 255, 255, 0.02) 50%, 
            rgba(255, 255, 255, 0.02) 75%, 
            transparent 75%, 
            transparent
          )`,
          backgroundSize: "40px 40px",
          opacity: 0.15,
          pointerEvents: "none",
        },
        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: `
          linear-gradient(135deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.03) 0.5%, 
            transparent 1%, 
            transparent 10%, 
            rgba(255, 255, 255, 0.03) 10.5%, 
            transparent 11%, 
            transparent 20%, 
            rgba(255, 255, 255, 0.03) 20.5%, 
            transparent 21%, 
            transparent 30%, 
            rgba(255, 255, 255, 0.03) 30.5%, 
            transparent 31%, 
            transparent 40%, 
            rgba(255, 255, 255, 0.03) 40.5%, 
            transparent 41%, 
            transparent 50%, 
            rgba(255, 255, 255, 0.03) 50.5%, 
            transparent 51%, 
            transparent 60%, 
            rgba(255, 255, 255, 0.03) 60.5%, 
            transparent 61%, 
            transparent 70%, 
            rgba(255, 255, 255, 0.03) 70.5%, 
            transparent 71%, 
            transparent 80%, 
            rgba(255, 255, 255, 0.03) 80.5%, 
            transparent 81%, 
            transparent 90%, 
            rgba(255, 255, 255, 0.03) 90.5%, 
            transparent 91%, 
            transparent
          )`,
          backgroundSize: "200px 200px",
          opacity: 0.1,
          pointerEvents: "none",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 500,
          padding: 4,
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 31, 63, 0.3)",
        }}
      >
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={handleBack}
            sx={{ 
              color: 'white', 
              mb: 2,
              "&:hover": {
                background: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Back to Login
          </Button>
          
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: "2.0rem",
              color: "white",
              textShadow: "0 0 8px rgba(0, 255, 255, 0.3)",
              letterSpacing: "1px",
              mb: 1,
            }}
          >
            Reset Password
          </Typography>
          
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Follow the steps below to reset your password
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Stepper 
            activeStep={activeStep} 
            sx={{ 
              mb: 3,
              "& .MuiStepLabel-root": {
                color: "rgba(255, 255, 255, 0.7)",
              },
              "& .MuiStepLabel-root.Mui-active": {
                color: "rgba(0, 255, 255, 0.8)",
              },
              "& .MuiStepLabel-root.Mui-completed": {
                color: "rgba(0, 255, 255, 0.8)",
              },
              "& .MuiStepIcon-root": {
                color: "rgba(255, 255, 255, 0.3)",
              },
              "& .MuiStepIcon-root.Mui-active": {
                color: "rgba(0, 255, 255, 0.8)",
              },
              "& .MuiStepIcon-root.Mui-completed": {
                color: "rgba(0, 255, 255, 0.8)",
              },
            }}
          >
            {steps.map((step) => (
              <Step key={step.label}>
                <StepLabel>{step.label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                borderRadius: "12px",
                background: "rgba(255, 0, 0, 0.2)",
                color: "white",
                border: "1px solid rgba(255, 0, 0, 0.3)",
                "& .MuiAlert-icon": {
                  color: "rgba(255, 255, 255, 0.8)",
                },
              }}
            >
              {error}
            </Alert>
          )}

          {success && (
            <Alert
              severity="success"
              sx={{
                mb: 2,
                borderRadius: "12px",
                background: "rgba(0, 255, 0, 0.2)",
                color: "white",
                border: "1px solid rgba(0, 255, 0, 0.3)",
                "& .MuiAlert-icon": {
                  color: "rgba(255, 255, 255, 0.8)",
                },
              }}
            >
              {success}
            </Alert>
          )}

          {renderStepContent()}
        </Box>

        {/* Development Mode: Show received token */}
        {process.env.NODE_ENV === 'development' && receivedToken && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.8)' }}>
              <strong>Development Mode:</strong> Token: {receivedToken}
            </Typography>
          </Box>
        )}

        <Typography
          variant="body2"
          sx={{
            mt: 4,
            textAlign: "center",
            color: "rgba(255, 255, 255, 0.5)",
            fontSize: "0.75rem",
            letterSpacing: "0.5px",
          }}
        >
          © {new Date().getFullYear()} PHARMA SYSTEM. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage; 