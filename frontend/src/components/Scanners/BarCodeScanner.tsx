import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import Webcam from "react-webcam";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

const BarcodeScanner = ({ onScan, onClose }) => {
  const webcamRef = useRef(null);
  const [error, setError] = useState(null);
  const codeReader = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    codeReader.current = new BrowserMultiFormatReader();

    const captureBarcode = async () => {
      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        const result = await codeReader.current.decodeFromImage(
          undefined,
          imageSrc
        );
        if (result) {
          onScan(result.getText());
          clearInterval(intervalRef.current);
          onClose();
        }
      } catch (err) {}
    };

    intervalRef.current = setInterval(captureBarcode, 500);

    return () => {
      clearInterval(intervalRef.current);
      codeReader.current.reset();
    };
  }, [onScan, onClose]);

  return (
    <Modal open onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: 500,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          outline: "none",
        }}
      >
        {error ? (
          <div className="text-red-500 mb-4 text-center">
            {error}
            <Button
              variant="contained"
              onClick={onClose}
              sx={{ mt: 2 }}
              fullWidth
            >
              Close
            </Button>
          </div>
        ) : (
          <>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/png"
              videoConstraints={{
                facingMode: "environment",
              }}
              style={{ width: "100%", borderRadius: 8 }}
            />
            <Button
              variant="contained"
              onClick={onClose}
              sx={{ mt: 2 }}
              fullWidth
            >
              Close Scanner
            </Button>
          </>
        )}
      </Box>
    </Modal>
  );
};

export default BarcodeScanner;
