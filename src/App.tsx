import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import ExamPage from './pages/ExamPage';
import ResultsPage from './pages/ResultsPage';
import AdminDashboard from './pages/AdminDashboard';
import ExamsList from './pages/ExamsList';
import ExamDetail from './pages/ExamDetail';
import ExamCanvas from './pages/ExamCanvas';
import TeacherMonitoring from './pages/Teacher/Monitoring';
import TeacherGradingQueue from './pages/Teacher/GradingQueue';
import './App.css';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/exams" element={<ExamsList />} />
            <Route path="/exam/:examId" element={<ExamDetail />} />
            <Route path="/exam/:examId/attempt/:attemptId" element={<ExamCanvas />} />
            <Route path="/exam/:examId" element={<ExamPage />} />
            <Route path="/results/:examId" element={<ResultsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/teacher/monitoring" element={<TeacherMonitoring />} />
            <Route path="/teacher/grading" element={<TeacherGradingQueue />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;