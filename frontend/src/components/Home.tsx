import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useTheme } from '@mui/material';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import Header from "./Header";
import pharmacyLogo from "../assets/background.jpg";
import axios from "axios";
import { API_BASE_URL } from "../../constants";
import type { PharmacySettings, Department } from "../types/settings";

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const handleButtonClick = (path: string) => {
    navigate(path);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const token = localStorage.getItem("token");

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/settings/pharmacy`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      setSettings(response.data);
      setError("");
    } catch (error) {
      setError("Failed to load settings. Please try again later.");
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const activeDepartments = settings?.departments
    ? settings.departments
        .filter((dept) => dept.isActive)
        .sort((a, b) => a.unit_code.localeCompare(b.unit_code))
    : [];

  return (
    <Box sx={{ minHeight: '100vh', background: theme.palette.background.default }}>
      <Header />
      <Container
        maxWidth="xl"
        sx={{
          pt: 8,
          height: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
        }}
      >
        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={6} sx={{ height: "80%" }}>
            <Grid
              item
              xs={12}
              md={5}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                pr: 4,
              }}
            >
              <Typography
                variant="h5"
                gutterBottom
                sx={{
                  mb: 3,
                  fontWeight: "bold",
                  color: theme.palette.primary.main,
                  textAlign: "left",
                  pl: 1,
                }}
              >
                Pharmacy Departments
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
                {activeDepartments.map((dept: Department) => (
                  <motion.div
                    key={dept.id}
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    style={{ width: "100%" }}
                  >
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleButtonClick(dept.dept_description)}
                      sx={{
                        height: "70px",
                        borderRadius: 1,
                        fontSize: "18px",
                        fontWeight: "600",
                        justifyContent: "flex-start",
                        pl: 3,
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.background.paper,
                        border: `2px solid ${theme.palette.divider}`,
                        boxShadow: theme.shadows[1],
                        textTransform: "none",
                        position: "relative",
                        overflow: "hidden",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: 0,
                          height: "100%",
                          width: "12px",
                          backgroundColor: theme.palette.primary.main,
                        },
                        "&:hover": {
                          backgroundColor: theme.palette.primary.main,
                          color: theme.palette.primary.contrastText,
                          transform: "translateX(5px)",
                          boxShadow: theme.shadows[4],
                          border: "none",
                          "&::before": {
                            backgroundColor: theme.palette.background.paper,
                          },
                        },
                        transition: "all 0.3s ease",
                      }}
                    >
                      {dept.dept_name}
                    </Button>
                  </motion.div>
                ))}
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={7}
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                pl: 6,
              }}
            >
              <Box sx={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}
                >
                  <Box sx={{ display: "flex", justifyContent: "center", width: "100%", mb: 3 }}>
                    <img
                      src={settings?.logo ? `${API_BASE_URL}/${settings.logo}` : pharmacyLogo}
                      alt="Pharmacy Logo"
                      style={{
                        width: "250px",
                        height: "250px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        boxShadow: theme.shadows[4],
                        border: `4px solid ${theme.palette.background.paper}`,
                      }}
                    />
                  </Box>
                  <Box sx={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Typography variant="h2" sx={{ fontWeight: "bold", mb: 1, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                      {settings?.pharmacy_name || "XYZ PHARMACY"}
                    </Typography>
                    <Typography variant="h5" sx={{ color: theme.palette.primary.main, mb: 3, fontWeight: "500", fontStyle: "italic" }}>
                      {settings?.pharmacy_tagline || "Caring for you, beyond prescriptions"}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, lineHeight: 1.8, fontSize: "1.1rem", mb: 4, maxWidth: "600px", mx: "auto" }}>
                      {settings?.pharmacy_description || "Our advanced pharmacy management system helps streamline operations, improve patient care, and enhance medication safety through innovative technology solutions."}
                    </Typography>
                    <Box sx={{ width: "100px", height: "4px", background: `linear-gradient(to right, ${theme.palette.primary.light}, ${theme.palette.primary.main})`, borderRadius: 2, mb: 4, mx: "auto" }} />
                  </Box>
                </motion.div>
              </Box>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  );
};

export default Dashboard;
