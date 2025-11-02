/**
 * useProctoring Hook
 * Manages proctoring events: tab visibility, camera capture, and event batching
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import apiService from '../services/api';
import type { ProctoringEvent } from '../services/api';

interface ProctoringConfig {
  attemptId: string;
  captureCamera?: boolean;
  batchInterval?: number; // milliseconds
  captureInterval?: number; // milliseconds for periodic captures
}

interface ProctoringState {
  isActive: boolean;
  tabSwitchCount: number;
  eventsQueued: number;
  cameraEnabled: boolean;
  lastCaptureTime: Date | null;
}

export const useProctoring = (config: ProctoringConfig) => {
  const {
    attemptId,
    captureCamera = false,
    batchInterval = 5000, // 5 seconds
    captureInterval = 30000, // 30 seconds
  } = config;

  const [state, setState] = useState<ProctoringState>({
    isActive: false,
    tabSwitchCount: 0,
    eventsQueued: 0,
    cameraEnabled: false,
    lastCaptureTime: null,
  });

  const eventQueue = useRef<Omit<ProctoringEvent, 'id'>[]>([]);
  const lastVisibleTime = useRef<Date>(new Date());
  const captureIntervalRef = useRef<number | null>(null);
  const batchIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Add event to queue
   */
  const queueEvent = useCallback((eventType: string, details?: any) => {
    const event: Omit<ProctoringEvent, 'id'> = {
      attempt_id: attemptId,
      event_type: eventType,
      event_time: new Date().toISOString(),
      details,
    };

    eventQueue.current.push(event);
    setState(prev => ({ ...prev, eventsQueued: prev.eventsQueued + 1 }));
  }, [attemptId]);

  /**
   * Send batched events
   */
  const sendBatchedEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;

    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];

    try {
      await apiService.sendProctoringEvents(eventsToSend);
      setState(prev => ({ 
        ...prev, 
        eventsQueued: eventQueue.current.length 
      }));
    } catch (error) {
      console.error('Failed to send proctoring events:', error);
      // Re-queue events on failure
      eventQueue.current = [...eventsToSend, ...eventQueue.current];
    }
  }, []);

  /**
   * Capture camera snapshot
   */
  const captureSnapshot = useCallback(async (): Promise<string | null> => {
    if (!captureCamera || !streamRef.current) return null;

    try {
      const video = document.createElement('video');
      video.srcObject = streamRef.current;
      video.play();

      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.currentTime = 0;
          resolve(null);
        };
      });

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      return dataUrl;
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
      return null;
    }
  }, [captureCamera]);

  /**
   * Request camera access
   */
  const enableCamera = useCallback(async (): Promise<boolean> => {
    if (!captureCamera) return false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      streamRef.current = stream;
      setState(prev => ({ ...prev, cameraEnabled: true }));

      // Start periodic captures
      captureIntervalRef.current = window.setInterval(async () => {
        const snapshot = await captureSnapshot();
        if (snapshot) {
          queueEvent('camera_snapshot', { image: snapshot });
        }
      }, captureInterval);

      return true;
    } catch (error) {
      console.error('Failed to enable camera:', error);
      return false;
    }
  }, [captureCamera, captureInterval, captureSnapshot, queueEvent]);

  /**
   * Disable camera
   */
  const disableCamera = useCallback(() => {
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState(prev => ({ ...prev, cameraEnabled: false }));
  }, []);

  /**
   * Handle tab visibility changes
   */
  useEffect(() => {
    if (!state.isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        queueEvent('tab_hidden', {
          hidden_at: new Date().toISOString(),
        });
      } else {
        const hiddenDuration = new Date().getTime() - lastVisibleTime.current.getTime();
        queueEvent('tab_visible', {
          visible_at: new Date().toISOString(),
          hidden_duration_ms: hiddenDuration,
        });

        setState(prev => ({
          ...prev,
          tabSwitchCount: prev.tabSwitchCount + 1,
        }));

        lastVisibleTime.current = new Date();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isActive, queueEvent]);

  /**
   * Batch sending interval
   */
  useEffect(() => {
    if (!state.isActive) return;

    batchIntervalRef.current = window.setInterval(() => {
      sendBatchedEvents();
    }, batchInterval);

    return () => {
      if (batchIntervalRef.current) {
        clearInterval(batchIntervalRef.current);
      }
    };
  }, [state.isActive, batchInterval, sendBatchedEvents]);

  /**
   * Start proctoring
   */
  const start = useCallback(async () => {
    setState(prev => ({ ...prev, isActive: true }));
    lastVisibleTime.current = new Date();

    if (captureCamera) {
      await enableCamera();
    }

    queueEvent('proctoring_started');
  }, [captureCamera, enableCamera, queueEvent]);

  /**
   * Stop proctoring
   */
  const stop = useCallback(async () => {
    // Send any remaining events
    await sendBatchedEvents();
    
    disableCamera();
    setState(prev => ({ ...prev, isActive: false }));
    
    queueEvent('proctoring_stopped');
  }, [sendBatchedEvents, disableCamera, queueEvent]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    ...state,
    start,
    stop,
    enableCamera,
    disableCamera,
    captureSnapshot,
    sendBatchedEvents,
  };
};

export default useProctoring;

