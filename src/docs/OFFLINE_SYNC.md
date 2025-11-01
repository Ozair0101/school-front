# Offline Sync Mechanism

This document explains how the offline sync mechanism works in the online monthly exam system.

## Overview

The offline sync mechanism ensures that students can continue taking exams even when they lose internet connectivity. Answers are automatically saved and synchronized when the connection is restored.

## How It Works

### 1. Autosave Hook (`useExamAutosave`)

The `useExamAutosave` hook handles all answer saving operations:

```typescript
const { queueAnswer, saveAnswerImmediately } = useExamAutosave(attemptId, examId);
```

### 2. Online/Offline Detection

The hook listens for online/offline events:

```typescript
useEffect(() => {
  const handleOnline = () => {
    isOnline.current = true;
    syncOfflineAnswers();
  };

  const handleOffline = () => {
    isOnline.current = false;
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

### 3. Answer Queueing

When offline, answers are queued in memory:

```typescript
const queueAnswer = useCallback((answer: AttemptAnswer) => {
  pendingAnswers.current = [...pendingAnswers.current, answer];
}, []);
```

### 4. Periodic Autosave

When online, queued answers are saved periodically:

```typescript
useEffect(() => {
  const interval = setInterval(() => {
    if (pendingAnswers.current.length > 0 && isOnline.current) {
      // Save all pending answers
    }
  }, autosaveInterval);

  return () => clearInterval(interval);
}, [attemptId, autosaveInterval]);
```

### 5. Local Storage Fallback

If the browser loses connectivity completely, answers are stored in localStorage:

```typescript
if (isOnline.current) {
  await apiService.saveAnswer(attemptId, answer);
} else {
  // Store in localStorage when offline
  await localforage.setItem(`pending_answer_${Date.now()}`, answerData);
}
```

### 6. Sync When Online

When connectivity is restored, offline answers are synchronized:

```typescript
const syncOfflineAnswers = useCallback(async () => {
  if (!isOnline.current) return;

  try {
    const keys = await localforage.keys();
    const pendingKeys = keys.filter(key => key.startsWith('pending_answer_'));
    
    for (const key of pendingKeys) {
      try {
        const answerData = await localforage.getItem<any>(key);
        if (answerData && answerData.exam_id === examId) {
          await apiService.saveAnswer(attemptId, answerData);
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
```

## Retry Mechanism

Failed save operations are retried with exponential backoff:

```typescript
if (prev.retryCount < 3) {
  const timeoutId = setTimeout(() => {
    saveAnswerImmediately(answer);
  }, Math.pow(2, prev.retryCount) * 1000);
}
```

## Data Structure

Offline answers are stored with the following structure:

```typescript
{
  attempt_id: string;
  exam_id: string;
  question_id: string;
  choice_id?: string;
  answer_text?: string;
  uploaded_file?: string;
  timestamp: number;
}
```

## Conflict Resolution

In case of conflicts (e.g., if a student answers a question both online and offline):

1. The most recent answer is preserved
2. Timestamps are used to determine recency
3. Manual intervention may be required for critical conflicts

## Limitations

1. File uploads are not supported offline (requires active connection for presigned URLs)
2. Large numbers of offline answers may cause sync delays
3. Browser storage limits may affect the number of offline answers that can be stored

## Testing Offline Mode

To test offline functionality:

1. Open the exam in your browser
2. Open developer tools
3. Disable network connectivity in the Network tab
4. Answer questions and observe the offline indicator
5. Re-enable network connectivity
6. Verify that answers are synchronized

## Monitoring

The system provides visual indicators for sync status:

- Green checkmark: All changes saved
- Yellow dot: Offline mode
- Spinning icon: Saving in progress
- Retry counter: Number of failed attempts

## Performance Considerations

1. Batch saving is used to reduce API calls
2. LocalForage is used for efficient storage operations
3. Memory usage is minimized by clearing synced answers
4. Throttling prevents excessive API calls during sync

## Security

1. Offline data is stored in the browser's secure storage
2. Attempt tokens are required for all API operations
3. Data is encrypted at rest where possible
4. Session timeouts apply even to offline data