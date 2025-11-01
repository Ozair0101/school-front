import React, { useState, useRef, useEffect } from 'react';

interface ProctoringCaptureProps {
  onCapture?: (blob: Blob) => void;
  onEvent?: (eventType: string, details?: any) => void;
  captureInterval?: number; // in seconds, default 30
  showConsent?: boolean;
}

const ProctoringCapture: React.FC<ProctoringCaptureProps> = ({ 
  onCapture,
  onEvent,
  captureInterval = 30,
  showConsent = true
}) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [showCameraConsent, setShowCameraConsent] = useState<boolean>(showConsent);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [lastCaptureTime, setLastCaptureTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<any>(null);

  // Request camera permission
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setHasCameraPermission(true);
      setShowCameraConsent(false);
      
      // Start the video stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Notify parent of consent given
      onEvent?.('camera_consent_given');
    } catch (err) {
      console.error('Camera permission denied:', err);
      setError('Camera access denied. Please allow camera access to enable proctoring.');
      setHasCameraPermission(false);
      onEvent?.('camera_permission_denied');
    }
  };

  // Capture image from video stream
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
    
    const now = Date.now();
    if (now - lastCaptureTime < captureInterval * 1000) return;
    
    setIsCapturing(true);
    setLastCaptureTime(now);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      setIsCapturing(false);
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob and send to parent
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture?.(blob);
        onEvent?.('snapshot_captured', { 
          timestamp: new Date().toISOString(),
          size: blob.size 
        });
      }
      setIsCapturing(false);
    }, 'image/jpeg', 0.8);
  };

  // Start periodic capture
  const startPeriodicCapture = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
    }
    
    captureIntervalRef.current = setInterval(() => {
      if (hasCameraPermission && !isCapturing) {
        captureImage();
      }
    }, captureInterval * 1000);
  };

  // Stop all capture
  const stopCapture = () => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setHasCameraPermission(false);
  };

  // Initialize capture when permission is granted
  useEffect(() => {
    if (hasCameraPermission) {
      startPeriodicCapture();
    }
    
    return () => {
      stopCapture();
    };
  }, [hasCameraPermission, captureInterval]);

  // Handle visibility change (tab switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        onEvent?.('tab_hidden', { timestamp: new Date().toISOString() });
      } else {
        onEvent?.('tab_visible', { timestamp: new Date().toISOString() });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture();
    };
  }, []);

  if (showCameraConsent) {
    return (
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Proctoring Required</h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          This exam requires periodic camera snapshots for proctoring purposes. 
          Your images will be securely stored and only viewed by authorized proctors.
        </p>
        <button
          type="button"
          onClick={requestCameraPermission}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Allow Camera Access
        </button>
        {error && (
          <p className="mt-2 text-red-500 text-sm">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {hasCameraPermission && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-32 h-24 rounded-lg border-2 border-primary shadow-lg"
          />
          {isCapturing && (
            <div className="absolute inset-0 bg-primary/50 rounded-lg flex items-center justify-center">
              <div className="animate-ping h-4 w-4 rounded-full bg-white opacity-75"></div>
            </div>
          )}
          <div className="absolute top-1 right-1">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};

export default ProctoringCapture;