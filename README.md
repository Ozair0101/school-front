# Online Monthly Exam System - React Frontend

This is a React frontend implementation for an online monthly exam system that works with a Laravel backend. The system supports both student and teacher/admin flows with features like real-time monitoring, proctoring, offline support, and accessibility.

## Features Implemented

### Student Flow
- Exam list with filtering and search
- Exam detail view with access code support
- Exam canvas with:
  - Question navigation
  - Timer with warnings
  - Progress tracking
  - Autosave functionality
  - Offline support
  - Proctoring capture
  - Review modal
  - Question types: MCQ, True/False, Numeric, Short Answer, Essay, File Upload

### Teacher/Admin Flow
- Real-time monitoring dashboard
- Grading queue for manual grading
- Proctoring events viewer

### Technical Features
- TypeScript for type safety
- React Query for server state management
- Axios for HTTP requests with interceptors
- WebSocket/Socket.IO for real-time updates
- LocalForage for offline storage
- Tailwind CSS for styling
- Responsive design
- Accessibility support
- Security features (attempt tokens)

## Folder Structure

```
src/
├── components/
│   ├── QuestionCard/
│   │   ├── index.tsx
│   │   ├── MCQQuestionCard.tsx
│   │   ├── TFQuestionCard.tsx
│   │   ├── NumericQuestionCard.tsx
│   │   ├── ShortQuestionCard.tsx
│   │   ├── EssayQuestionCard.tsx
│   │   └── FileQuestionCard.tsx
│   ├── Timer.tsx
│   ├── ProgressBar.tsx
│   ├── ProctoringCapture.tsx
│   └── ...
├── hooks/
│   ├── useExamAutosave.ts
│   └── useServerTimeSync.ts
├── pages/
│   ├── ExamsList.tsx
│   ├── ExamDetail.tsx
│   ├── ExamCanvas.tsx
│   ├── Teacher/
│   │   ├── Monitoring.tsx
│   │   └── GradingQueue.tsx
│   └── ...
├── services/
│   └── api.ts
├── tests/
│   ├── Timer.test.tsx
│   └── useExamAutosave.test.ts
└── types/
    └── index.ts
```

## Key Components

### API Service (`services/api.ts`)
- Axios instance with interceptors for authentication and attempt tokens
- Methods for all backend endpoints
- Type definitions for data models

### Custom Hooks
- `useExamAutosave`: Handles autosave with debounce, offline queue, and retries
- `useServerTimeSync`: Synchronizes client time with server

### Question Components (`components/QuestionCard/`)
- Support for all question types (MCQ, TF, Numeric, Short, Essay, File)
- Review mode with explanations
- Keyboard navigation support

### Core Pages
- `ExamsList`: Lists available exams with filtering
- `ExamDetail`: Shows exam information and start button
- `ExamCanvas`: Main exam interface with timer, progress, and questions
- `Teacher/Monitoring`: Real-time monitoring of in-progress attempts
- `Teacher/GradingQueue`: Manual grading interface

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Testing

```bash
npm run test
```

## API Integration

The frontend integrates with the Laravel backend through the following key endpoints:

- `POST /api/exams/{id}/start` - Start exam attempt
- `POST /api/attempts/{id}/answer` - Save answer
- `POST /api/attempts/{id}/submit` - Submit exam
- `GET /api/attempts/{id}/status` - Get attempt status
- `POST /api/exams/{id}/presign` - Get presigned URL for file uploads
- WebSocket channel `exam.{exam_id}.monitor` - Real-time events

## Security

- All calls that modify attempt state include attempt_token
- Tokens are stored in memory with localStorage fallback
- HTTPS is used for all communications

## Offline Support

- Answers are autosaved every 10 seconds (configurable)
- Offline answers are queued in localStorage
- Sync happens when connection returns

## Proctoring

- Visibility/tab events are captured and logged
- Webcam snapshots (optional) with user consent
- Events sent via API or WebSocket in batches

## Accessibility

- Keyboard navigation support
- ARIA attributes
- Focus management
- Proper contrast ratios
- Clear error messages