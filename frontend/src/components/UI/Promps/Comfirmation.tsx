import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, Warning as WarningIcon } from "@mui/icons-material";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  severity?: "error" | "warning" | "info" | "success";
  confirmButtonColor?: "primary" | "secondary" | "error" | "warning" | "info" | "success";
  disableActionButtons?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  content,
  confirmText = "Confirm",
  cancelText = "Cancel",
  severity = "warning",
  confirmButtonColor = "primary",
  disableActionButtons = false,
}) => {
  const getSeverityColor = () => {
    switch (severity) {
      case "error":
        return "#f44336";
      case "warning":
        return "#ff9800";
      case "info":
        return "#2196f3";
      case "success":
        return "#4caf50";
      default:
        return "#ff9800";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        },
      }}
    >
      <DialogTitle
        id="confirmation-dialog-title"
        sx={{
          backgroundColor: `${getSeverityColor()}08`,
          borderBottom: `1px solid ${getSeverityColor()}20`,
          display: "flex",
          alignItems: "center",
          py: 2,
          pr: 6,
        }}
      >
        <WarningIcon
          sx={{
            color: getSeverityColor(),
            mr: 2,
            fontSize: 28,
          }}
        />
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 12,
            top: 12,
            color: "text.secondary",
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ py: 3 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <DialogContentText
            id="confirmation-dialog-description"
            sx={{
              color: "text.primary",
              fontSize: "1rem",
              lineHeight: 1.6,
            }}
          >
            {content}
          </DialogContentText>
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: `1px solid ${getSeverityColor()}20`,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "none",
            px: 3,
            py: 1,
            borderRadius: 1,
          }}
          disabled={disableActionButtons}
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmButtonColor}
          variant="contained"
          sx={{
            textTransform: "none",
            px: 3,
            py: 1,
            borderRadius: 1,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
            },
          }}
          disabled={disableActionButtons}
          autoFocus
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;