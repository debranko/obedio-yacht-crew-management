import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Camera, X, RotateCcw, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface CameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageDataUrl: string) => void;
}

type ErrorType = 'permission' | 'not-supported' | 'not-found' | 'other' | null;

export function CameraDialog({ open, onOpenChange, onCapture }: CameraDialogProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorType>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera when dialog opens
  useEffect(() => {
    if (open && !capturedImage && !error) {
      startCamera();
    }

    // Cleanup: stop camera when dialog closes
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open]);

  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('not-supported');
        setIsLoading(false);
        return;
      }

      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera by default
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      setError(null);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      setIsLoading(false);
      
      // Determine error type
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('permission');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('not-found');
      } else {
        setError('other');
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageDataUrl);

      // Stop camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setError(null);
    startCamera();
  };

  const retryCamera = () => {
    setError(null);
    startCamera();
  };

  const usePhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setError(null);
    onOpenChange(false);
  };

  const getErrorMessage = () => {
    switch (error) {
      case 'permission':
        return {
          title: 'Camera Permission Denied',
          message: 'Please allow camera access in your browser settings to take photos.',
          instructions: [
            'Click the camera icon in your browser address bar',
            'Select "Allow" for camera permissions',
            'Then click "Try Again" below'
          ]
        };
      case 'not-found':
        return {
          title: 'No Camera Found',
          message: 'No camera device was detected on your device.',
          instructions: [
            'Make sure your camera is connected',
            'Check if another application is using the camera',
            'Try refreshing the page'
          ]
        };
      case 'not-supported':
        return {
          title: 'Camera Not Supported',
          message: 'Your browser does not support camera access.',
          instructions: [
            'Try using a modern browser (Chrome, Firefox, Safari, Edge)',
            'Make sure you are on HTTPS or localhost',
            'Use the "Upload Photo" option instead'
          ]
        };
      case 'other':
        return {
          title: 'Camera Error',
          message: 'An unexpected error occurred while accessing the camera.',
          instructions: [
            'Try refreshing the page',
            'Check if another app is using the camera',
            'Use the "Upload Photo" option instead'
          ]
        };
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Take a Photo</DialogTitle>
          <DialogDescription>
            {error 
              ? 'Camera access issue - follow the instructions below'
              : capturedImage 
                ? 'Review your photo and choose to use it or retake'
                : 'Position yourself in the frame and click capture'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          {/* Loading State */}
          {isLoading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2 animate-pulse" />
                <p className="text-sm text-muted-foreground">Starting camera...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !capturedImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted p-6">
              <div className="text-center max-w-md">
                <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
                  <X className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="mb-2">{getErrorMessage()?.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {getErrorMessage()?.message}
                </p>
                <div className="bg-card border border-border rounded-lg p-4 mb-4">
                  <p className="text-xs mb-2">How to fix:</p>
                  <ul className="text-xs text-left space-y-1 text-muted-foreground">
                    {getErrorMessage()?.instructions.map((instruction, index) => (
                      <li key={index} className="flex gap-2">
                        <span className="text-primary">•</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Video preview */}
          {!capturedImage && !error && !isLoading && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Captured image preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <DialogFooter className="flex gap-2">
          {error && !capturedImage ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button onClick={retryCamera}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </>
          ) : !capturedImage ? (
            <>
              <Button variant="outline" onClick={handleClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={capturePhoto} disabled={isLoading || !!error}>
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={retakePhoto}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Retake
              </Button>
              <Button onClick={usePhoto}>
                Use This Photo
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
