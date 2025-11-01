# API Integration Guide

This document explains how the React frontend integrates with the Laravel backend API for the online monthly exam system.

## Authentication

The frontend uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in all API requests via Axios interceptors.

```typescript
// In services/api.ts
const token = localStorage.getItem('auth_token');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

## Attempt Tokens

For security, all calls that modify attempt state must include an `attempt_token`. This token is provided when starting an exam attempt and must be included in the `X-Attempt-Token` header for protected endpoints.

```typescript
// In services/api.ts
if (this.attemptToken && this.requiresAttemptToken(config.url || '')) {
  config.headers['X-Attempt-Token'] = this.attemptToken;
}
```

## Core API Endpoints

### Start Exam Attempt
```
POST /api/monthly-exams/{examId}/start
```
Returns:
```json
{
  "attempt_id": "string",
  "attempt_token": "string",
  "questions": [...],
  "server_time": "2025-11-01T10:00:00Z",
  "exam_settings": {...}
}
```

### Save Answer
```
POST /api/student-attempts/{attemptId}/answer
```
Body:
```json
{
  "question_id": "string",
  "choice_id": "string (optional)",
  "answer_text": "string (optional)",
  "uploaded_file": "string (optional)"
}
```

### Submit Exam
```
POST /api/student-attempts/{attemptId}/submit
```
Returns:
```json
{
  "status": "submitted|queued_for_grading",
  "total_score": 85,
  "percent": 85
}
```

### Get Attempt Status
```
GET /api/student-attempts/{attemptId}/status
```
Returns:
```json
{
  "status": "string",
  "total_score": 85,
  "percent": 85,
  "results_url": "string (optional)"
}
```

### File Upload (Presigned URL)
```
POST /api/monthly-exams/{examId}/presign
```
Body:
```json
{
  "file_name": "string",
  "file_type": "string"
}
```
Returns:
```json
{
  "upload_url": "string",
  "file_path": "string"
}
```

## WebSocket Integration

Real-time monitoring is implemented using WebSocket connections:

```typescript
// In pages/Teacher/Monitoring.tsx
const newSocket = io('http://localhost:3000');
newSocket.on('exam_monitor', (data) => {
  // Handle monitoring events
});
```

WebSocket channel: `exam.{exam_id}.monitor`

Events:
- `attempt_started`
- `proctor_event`
- `attempt_updated`

## Error Handling

The API service includes error handling for common scenarios:

```typescript
// In services/api.ts
if (error.response?.status === 401) {
  // Handle unauthorized access
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
}
```

## Offline Support

The `useExamAutosave` hook handles offline scenarios by queuing answers in localStorage:

```typescript
// In hooks/useExamAutosave.ts
if (isOnline.current) {
  await apiService.saveAnswer(attemptId, answer);
} else {
  // Store in localStorage when offline
  await localforage.setItem(`pending_answer_${Date.now()}`, answerData);
}
```

## Rate Limiting and Retries

The autosave system implements exponential backoff for failed requests:

```typescript
// In hooks/useExamAutosave.ts
if (prev.retryCount < 3) {
  const timeoutId = setTimeout(() => {
    saveAnswerImmediately(answer);
  }, Math.pow(2, prev.retryCount) * 1000);
}
```

## Security Considerations

1. Attempt tokens are stored in memory with localStorage fallback
2. HTTPS is required for all API communications
3. File uploads use presigned URLs to avoid exposing backend credentials
4. Authentication tokens are automatically refreshed when expired