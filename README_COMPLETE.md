# Complete React Frontend for Online Exam System

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run E2E tests
npm run test:e2e
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── QuestionCard/   # Question type components (MCQ, TF, etc.)
│   ├── Timer.tsx       # Server-synced timer with warnings
│   ├── ProgressBar.tsx # Progress indicator
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useExamAutosave.ts    # Autosave with offline support
│   ├── useServerTimeSync.ts  # Server time synchronization
│   └── useProctoring.ts      # Proctoring event management
├── pages/              # Route pages
│   ├── ExamsList.tsx         # Student exam list
│   ├── ExamDetail.tsx        # Exam details and start
│   ├── ExamCanvas.tsx        # Main exam interface
│   ├── ResultsPage.tsx       # View results
│   └── Teacher/              # Teacher/admin pages
├── services/           # API and external services
│   ├── api.ts         # Axios-based API client
│   ├── websocket.ts   # WebSocket for real-time updates
│   └── offlineQueue.ts # Offline request queue
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## ✨ Key Features

### Student Flow
- ✅ Exam list with filtering
- ✅ Exam detail with access code
- ✅ Start exam with attempt token
- ✅ Question canvas with autosave
- ✅ Timer with warnings
- ✅ Progress tracking
- ✅ Review before submit
- ✅ Results view

### Teacher/Admin Flow
- ✅ Live monitoring dashboard
- ✅ Grading queue
- ✅ Proctoring events viewer
- ✅ Real-time updates via WebSocket

### Security
- ✅ Attempt token validation
- ✅ Secure token storage
- ✅ HTTPS enforcement
- ✅ Token refresh on start

### Offline Support
- ✅ Autosave queueing in IndexedDB
- ✅ Sync when connection returns
- ✅ Visual sync status
- ✅ Retry with exponential backoff

### Proctoring
- ✅ Tab visibility detection
- ✅ Camera snapshot (optional)
- ✅ Event batching
- ✅ Real-time event sending

### Accessibility
- ✅ Keyboard navigation
- ✅ ARIA attributes
- ✅ Focus management
- ✅ Screen reader support
- ✅ High contrast mode

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
VITE_AUTOSAVE_INTERVAL=10000
```

### API Integration

See `docs/API_INTEGRATION.md` for detailed API integration guide.

## 🧪 Testing

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

### Accessibility Testing
```bash
npm run test:a11y
```

## 📚 Documentation

- [API Integration Guide](./docs/API_INTEGRATION.md)
- [Offline Sync Documentation](./docs/OFFLINE_SYNC.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

## 🛠️ Development

### Adding a New Question Type

1. Create component in `src/components/QuestionCard/`
2. Add to `QuestionCard/index.tsx`
3. Update types in `src/types/index.ts`
4. Add tests

### Adding a New Hook

1. Create hook in `src/hooks/`
2. Export from `src/hooks/index.ts`
3. Add tests in `src/tests/hooks/`

## 🚢 Deployment

See `docs/DEPLOYMENT.md` for production deployment instructions.

## 📝 License

[Your License Here]

