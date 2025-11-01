import { renderHook, act } from '@testing-library/react-hooks';
import { useExamAutosave } from '../hooks/useExamAutosave';

// Mock the apiService
jest.mock('../services/api', () => ({
  __esModule: true,
  default: {
    saveAnswer: jest.fn(),
  },
}));

// Mock localforage
jest.mock('localforage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  keys: jest.fn(),
}));

describe('useExamAutosave', () => {
  const attemptId = 'attempt-123';
  const examId = 'exam-456';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useExamAutosave(attemptId, examId));
    
    expect(result.current.isSaving).toBe(false);
    expect(result.current.isSaved).toBe(false);
    expect(result.current.isOffline).toBe(false);
    expect(result.current.retryCount).toBe(0);
    expect(result.current.pendingAnswersCount).toBe(0);
  });
  
  it('should queue answers correctly', () => {
    const { result } = renderHook(() => useExamAutosave(attemptId, examId));
    
    act(() => {
      result.current.queueAnswer({
        attempt_id: attemptId,
        question_id: 'question-1',
        answer_text: 'Test answer',
      });
    });
    
    expect(result.current.pendingAnswersCount).toBe(1);
    expect(result.current.isSaving).toBe(true);
    expect(result.current.isSaved).toBe(false);
  });
  
  it('should handle online/offline status changes', () => {
    const { result } = renderHook(() => useExamAutosave(attemptId, examId));
    
    // Simulate going offline
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    expect(result.current.isOffline).toBe(true);
    
    // Simulate coming back online
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    expect(result.current.isOffline).toBe(false);
  });
});