import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';

/**
 * Uses the browser BarcodeDetector API when it is available. USB scanners and
 * browsers without camera-barcode support can always use the manual field.
 */
export default function BarcodeScannerDialog({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const activeRef = useRef(false);
  const detectorRef = useRef(null);
  const [manualValue, setManualValue] = useState('');
  const [cameraError, setCameraError] = useState('');
  const supportsCameraScan = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  const stopCamera = () => {
    activeRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => stopCamera(), []);

  const submitValue = (value) => {
    const barcode = value.trim();
    if (!barcode) return;
    stopCamera();
    onDetected(barcode);
    onClose();
  };

  const scanFrame = async () => {
    if (!activeRef.current || !detectorRef.current || !videoRef.current) return;
    try {
      const results = await detectorRef.current.detect(videoRef.current);
      if (results[0]?.rawValue) {
        submitValue(results[0].rawValue);
        return;
      }
    } catch {
      // A frame can be unavailable while the camera is starting; keep scanning.
    }
    if (activeRef.current) animationRef.current = requestAnimationFrame(scanFrame);
  };

  const startCamera = async () => {
    setCameraError('');
    if (!supportsCameraScan) {
      setCameraError('Camera barcode detection is not supported by this browser. Use Chrome/Edge or enter the barcode manually.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      detectorRef.current = new window.BarcodeDetector({
        formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'],
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      activeRef.current = true;
      scanFrame();
    } catch (error) {
      stopCamera();
      setCameraError(error?.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access or enter the barcode manually.'
        : 'Unable to start the camera. Enter the barcode manually or use a USB scanner.');
    }
  };

  const close = () => {
    stopCamera();
    setCameraError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Scan Barcode</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography color="text.secondary">
            Use a camera, a USB barcode scanner, or enter the barcode manually.
          </Typography>
          {cameraError && <Alert severity="warning">{cameraError}</Alert>}
          <Box sx={{ bgcolor: '#0f172a', borderRadius: 2, overflow: 'hidden', minHeight: 180 }}>
            <video ref={videoRef} muted playsInline style={{ display: 'block', width: '100%', maxHeight: 300, objectFit: 'cover' }} />
          </Box>
          <Button variant="outlined" startIcon={<CameraAltIcon />} onClick={startCamera}>
            Start camera scanner
          </Button>
          <TextField
            autoFocus
            label="Barcode value"
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && submitValue(manualValue)}
            helperText="USB barcode scanners enter the value here automatically. Press Enter to search."
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" onClick={() => submitValue(manualValue)}>Find product</Button>
      </DialogActions>
    </Dialog>
  );
}
