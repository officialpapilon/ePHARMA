import { Check, Info, Warning, Close } from "@mui/icons-material";
import {
  Modal,
  Box,
  Typography,
  Button,
  Divider,
  IconButton,
  Slide,
  Fade,
  Grow,
  Zoom,
} from "@mui/material";
import type { ReactNode } from "react";

type Variant = "success" | "error" | "info" | "warning";

type SuccessModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
  showTotal?: boolean;
  totalAmount?: number;
  showPaymentInfo?: boolean;
  payment?: {
    amount: string | number;
    change?: number;
  };
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryButtonClick?: () => void;
  onSecondaryButtonClick?: () => void;
  showCloseButton?: boolean;
  size?: "sm" | "md" | "lg";
  animation?: "slide" | "fade" | "grow" | "zoom";
};

const variantStyles = {
    success: {
      bg: "#d1fae5", 
      text: "#065f46", 
      icon: <Check sx={{ fontSize: 60, color: "#065f46" }} />,
      headerBg: "#16a34a",
    },
    error: {
      bg: "#fee2e2", 
      text: "#991b1b", 
      icon: <Close sx={{ fontSize: 60, color: "#991b1b" }} />,
      headerBg: "#dc2626", 
    },
    info: {
      bg: "#dbeafe", 
      text: "#1e3a8a", 
      icon: <Info sx={{ fontSize: 60, color: "#1e3a8a" }} />,
      headerBg: "#2563eb", 
    },
    warning: {
      bg: "#fef3c7", 
      text: "#92400e", 
      icon: <Warning sx={{ fontSize: 60, color: "#92400e" }} />,
      headerBg: "#f59e0b", 
    },
  };
  

const sizeStyles = {
  sm: { width: 400 },
  md: { width: 500 },
  lg: { width: 600 },
};

const SuccessModal = ({
  open,
  onClose,
  title = "Success",
  message = "Operation completed successfully",
  variant = "success",
  icon,
  showTotal = false,
  totalAmount = 0,
  showPaymentInfo = false,
  payment = { amount: 0, change: 0 },
  primaryButtonText = "Continue",
  secondaryButtonText,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  showCloseButton = true,
  size = "md",
  animation = "fade",
}: SuccessModalProps) => {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const renderAnimation = (children: ReactNode) => {
    switch (animation) {
      case "slide":
        return (
          <Slide direction="up" in={open} mountOnEnter unmountOnExit>
            {children}
          </Slide>
        );
      case "grow":
        return (
          <Grow in={open} mountOnEnter unmountOnExit>
            {children}
          </Grow>
        );
      case "zoom":
        return (
          <Zoom in={open} mountOnEnter unmountOnExit>
            {children}
          </Zoom>
        );
      default:
        return (
          <Fade in={open} mountOnEnter unmountOnExit>
            {children}
          </Fade>
        );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="success-modal-title"
      aria-describedby="success-modal-description"
      closeAfterTransition
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      {renderAnimation(
        <Box
          sx={{
            ...sizeStyle,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              bgcolor: variantStyle.headerBg,
              color: "white",
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="h6" component="h2">
              {title}
            </Typography>
            {showCloseButton && (
              <IconButton
                edge="end"
                color="inherit"
                onClick={onClose}
                aria-label="close"
              >
                <Close />
              </IconButton>
            )}
          </Box>

          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                my: 2,
              }}
            >
              <Box
                sx={{
                  bgcolor: `${variantStyle.bg}`,
                  color: `${variantStyle.text}`,
                  width: 100, 
                  height: 100,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation:
                    variant === "success" && open
                      ? "scaleIn 0.3s ease-out"
                      : "none",
                  "@keyframes scaleIn": {
                    "0%": {
                      transform: "scale(0)",
                      opacity: 0,
                    },
                    "100%": {
                      transform: "scale(1)",
                      opacity: 1,
                    },
                  },
                }}
              >
                {icon || variantStyle.icon}
              </Box>
            </Box>

            <Typography
              variant="body1"
              align="center"
              sx={{ mb: 4, px: 2 }}
              color="text.secondary"
            >
              {message}
            </Typography>

            {showTotal && (
              <Box
                sx={{
                  bgcolor: "grey.100",
                  p: 2,
                  borderRadius: 1,
                  mb: 3,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1,
                  }}
                >
                  <Typography variant="body1">Total:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Tsh {totalAmount.toFixed(2)}
                  </Typography>
                </Box>

                {showPaymentInfo && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        py: 1,
                      }}
                    >
                      <Typography variant="body1">Paid:</Typography>
                      <Typography variant="body1">
                        Tsh {Number(payment.amount).toFixed(2)}
                      </Typography>
                    </Box>
                    {payment.change && payment.change > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          py: 1,
                        }}
                      >
                        <Typography variant="body1">Change:</Typography>
                        <Typography variant="body1">
                          Tsh {payment.change.toFixed(2)}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                gap: 2,
                mt: 3,
              }}
            >
              {secondaryButtonText && (
                <Button
                  variant="outlined"
                  onClick={onSecondaryButtonClick || onClose}
                  fullWidth={!primaryButtonText}
                >
                  {secondaryButtonText}
                </Button>
              )}
              {primaryButtonText && (
                <Button
                  variant="contained"
                  onClick={onPrimaryButtonClick || onClose}
                  fullWidth={!secondaryButtonText}
                  color={variant as "success" | "error" | "info" | "warning"}
                >
                  {primaryButtonText}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Modal>
  );
};

export default SuccessModal;