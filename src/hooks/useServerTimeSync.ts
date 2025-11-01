import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';

interface TimeSyncState {
  serverTime: Date | null;
  offset: number; // milliseconds
  isSyncing: boolean;
  lastSyncedAt: Date | null;
}

export const useServerTimeSync = () => {
  const [timeSyncState, setTimeSyncState] = useState<TimeSyncState>({
    serverTime: null,
    offset: 0,
    isSyncing: false,
    lastSyncedAt: null,
  });

  const syncTime = useCallback(async () => {
    setTimeSyncState(prev => ({ ...prev, isSyncing: true }));

    try {
      // For now, we'll use client time since there's no specific time endpoint
      // In a real implementation, you would call an endpoint that returns server time
      const serverTime = new Date();
      
      // Calculate offset
      const clientTime = new Date();
      const offset = serverTime.getTime() - clientTime.getTime();
      
      setTimeSyncState({
        serverTime,
        offset,
        isSyncing: false,
        lastSyncedAt: new Date(),
      });
    } catch (error) {
      console.error('Failed to sync time with server:', error);
      setTimeSyncState(prev => ({ ...prev, isSyncing: false }));
    }
  }, []);

  // Sync time on mount and periodically
  useEffect(() => {
    syncTime();
    
    // Sync every 5 minutes
    const interval = setInterval(syncTime, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [syncTime]);

  // Get adjusted time based on offset
  const getAdjustedTime = useCallback((): Date => {
    const now = new Date();
    return new Date(now.getTime() + timeSyncState.offset);
  }, [timeSyncState.offset]);

  return {
    ...timeSyncState,
    syncTime,
    getAdjustedTime,
  };
};

export default useServerTimeSync;