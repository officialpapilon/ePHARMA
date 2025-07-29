import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../../contexts/AuthContext";

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password, "1");
      navigate("/");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Invalid credentials. Please try again.";
      setError(errorMessage);
      setLoading(false);
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
        <Box sx={{ textAlign: "center", mb: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  mt: 2,
                  fontWeight: 800,
                  fontSize: "2.0rem",
                  color: "white",
                  textShadow: "0 0 8px rgba(0, 255, 255, 0.3)",
                  letterSpacing: "1px",
                }}
              >
                Login
              </Typography>
            </Box>

            <form onSubmit={handleLogin}>
              <TextField
                variant="outlined"
                fullWidth
                margin="normal"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
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
                }}
              />

              <TextField
                type={showPassword ? "text" : "password"}
                variant="outlined"
                fullWidth
                margin="normal"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
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
                }}
              />

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mt: 2,
                    borderRadius: "12px",
                    background: "rgba(255, 0, 0, 0.2)",
                    color: "white",
                    border: "1px solid rgba(255, 0, 0, 0.3)",
                  }}
                >
                  {error}
                </Alert>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                fullWidth
                sx={{
                  mt: 3,
                  py: 1.5,
                  borderRadius: "12px",
                  background:
                    "linear-gradient(45deg, #00c6c6 0%, #0082c8 100%)",
                  color: "white",
                  fontWeight: 500,
                  fontSize: "1rem",
                  textTransform: "none",
                  boxShadow: "0 4px 20px rgba(0, 198, 198, 0.3)",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background:
                      "linear-gradient(45deg, #00b4b4 0%, #0072b8 100%)",
                    boxShadow: "0 6px 24px rgba(0, 198, 198, 0.4)",
                  },
                  "&.Mui-disabled": {
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "rgba(255, 255, 255, 0.5)",
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "inherit" }} />
                ) : (
                  "SIGN IN"
                )}
              </Button>

              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.7)",
                  cursor: "pointer",
                  "& a": {
                    color: "rgba(0, 255, 255, 0.8)",
                    textDecoration: "none",
                    fontWeight: 500,
                    cursor: "pointer",
                    "&:hover": {
                      color: "white",
                      textShadow: "0 0 8px rgba(0, 255, 255, 0.5)",
                    },
                  },
                }}
                onClick={() => navigate('/forgot-password')}
              >
                Forgot password?
              </Typography>
            </form>

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

export default LoginPage;
