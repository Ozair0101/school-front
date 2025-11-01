import { useState, useEffect, useCallback, useRef } from 'react';
import localforage from 'localforage';
import apiService from '../services/api';
import type { AttemptAnswer } from '../services/api';

interface AutosaveState {
  isSaving: boolean;
  isSaved: boolean;
  isOffline: boolean;
  retryCount: number;
  lastSavedAt?: Date;
}

export const useExamAutosave = (
  attemptId: string,
  examId: string,
  autosaveInterval: number = 10000 // 10 seconds default
) => {
  const [autosaveState, setAutosaveState] = useState<AutosaveState>({
    isSaving: false,
    isSaved: false,
    isOffline: false,
    retryCount: 0,
  });

  const pendingAnswers = useRef<AttemptAnswer[]>([]);
  const retryTimeouts = useRef<Map<string, any>>(new Map());
  const isOnline = useRef<boolean>(navigator.onLine);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      isOnline.current = true;
      setAutosaveState(prev => ({ ...prev, isOffline: false }));
      syncOfflineAnswers();
    };

    const handleOffline = () => {
      isOnline.current = false;
      setAutosaveState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save answer to queue
  const queueAnswer = useCallback((answer: AttemptAnswer) => {
    // Add to pending answers
    pendingAnswers.current = [...pendingAnswers.current, answer];
    
    // Update UI state
    setAutosaveState(prev => ({
      ...prev,
      isSaving: true,
      isSaved: false,
    }));
  }, []);

  // Save answer immediately (bypass queue)
  const saveAnswerImmediately = useCallback(async (answer: AttemptAnswer) => {
    setAutosaveState(prev => ({
      ...prev,
      isSaving: true,
      isSaved: false,
    }));

    try {
      if (isOnline.current) {
        await apiService.saveAnswer(attemptId, answer);
        setAutosaveState(prev => ({
          ...prev,
          isSaving: false,
          isSaved: true,
          lastSavedAt: new Date(),
          retryCount: 0,
        }));
      } else {
        // Store in localStorage when offline
        await localforage.setItem(`pending_answer_${Date.now()}`, {
          ...answer,
          attempt_id: attemptId,
          exam_id: examId,
          timestamp: Date.now(),
        });
        
        setAutosaveState(prev => ({
          ...prev,
          isSaving: false,
          isSaved: true,
          isOffline: true,
          lastSavedAt: new Date(),
        }));
      }
    } catch (error) {
      console.error('Failed to save answer:', error);
      setAutosaveState(prev => ({
        ...prev,
        isSaving: false,
        isSaved: false,
        retryCount: prev.retryCount + 1,
      }));
      
      // Retry with exponential backoff
      setAutosaveState(current => {
        if (current.retryCount < 3) {
          const timeoutId = setTimeout(() => {
            saveAnswerImmediately(answer);
          }, Math.pow(2, current.retryCount) * 1000);
          
          retryTimeouts.current.set(answer.question_id, timeoutId);
        }
        return current;
      });
    }
  }, [attemptId, examId]);

  // Sync offline answers when coming back online
  const syncOfflineAnswers = useCallback(async () => {
    if (!isOnline.current) return;

    try {
      const keys = await localforage.keys();
      const pendingKeys = keys.filter(key => key.startsWith('pending_answer_'));
      
      if (pendingKeys.length === 0) return;

      for (const key of pendingKeys) {
        try {
          const answerData = await localforage.getItem<any>(key);
          if (answerData && answerData.exam_id === examId) {
            await apiService.saveAnswer(attemptId, {
              attempt_id: attemptId,
              question_id: answerData.question_id,
              choice_id: answerData.choice_id,
              answer_text: answerData.answer_text,
              uploaded_file: answerData.uploaded_file,
            });
            
            await localforage.removeItem(key);
          }
        } catch (error) {
          console.error(`Failed to sync answer ${key}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to sync offline answers:', error);
    }
  }, [attemptId, examId]);

  // Autosave from queue at intervals
  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingAnswers.current.length > 0 && isOnline.current) {
        const answersToSave = [...pendingAnswers.current];
        pendingAnswers.current = [];
        
        setAutosaveState(prev => ({
          ...prev,
          isSaving: true,
          isSaved: false,
        }));

        // Save all pending answers
        answersToSave.forEach(async (answer) => {
          try {
            await apiService.saveAnswer(attemptId, answer);
          } catch (error) {
            console.error('Failed to autosave answer:', error);
            // Re-add to queue for retry
            pendingAnswers.current = [...pendingAnswers.current, answer];
          }
        });

        setAutosaveState(prev => ({
          ...prev,
          isSaving: false,
          isSaved: true,
          lastSavedAt: new Date(),
        }));
      }
    }, autosaveInterval);

    return () => {
      clearInterval(interval);
      
      // Clear any retry timeouts
      retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
      retryTimeouts.current.clear();
    };
  }, [attemptId, autosaveInterval]);

  return {
    ...autosaveState,
    queueAnswer,
    saveAnswerImmediately,
    pendingAnswersCount: pendingAnswers.current.length,
  };
};

export default useExamAutosave;