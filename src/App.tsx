import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import StudentDashboard from './pages/StudentDashboard';
import ResultsPage from './pages/ResultsPage';
import AdminDashboard from './pages/AdminDashboard';
import ExamsList from './pages/ExamsList';
import ExamDetail from './pages/ExamDetail';
import ExamCanvas from './pages/ExamCanvas';
import ExamManagement from './pages/ExamManagement';
import ExamQuestions from './pages/ExamQuestions';
import GradesManagement from './pages/GradesManagement';
import SectionsManagement from './pages/SectionsManagement';
import SchoolsManagement from './pages/SchoolsManagement';
import TeacherMonitoring from './pages/Teacher/Monitoring';
import TeacherGradingQueue from './pages/Teacher/GradingQueue';
import './App.css';

// Create a client
const queryClient = new QueryClient();

// Create router with routes
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <Layout />,
    children: [
      {
        path: '/dashboard',
        element: <StudentDashboard />,
      },
      {
        path: '/exams',
        element: <ExamsList />,
      },
      {
        path: '/exam/:examId/attempt/:attemptId',
        element: <ExamCanvas />,
      },
      {
        path: '/exam/:examId',
        element: <ExamDetail />,
      },
      {
        path: '/results/:examId',
        element: <ResultsPage />,
      },
      {
        path: '/admin',
        element: <AdminDashboard />,
      },
      {
        path: '/admin/exams',
        element: <ExamManagement />,
      },
      {
        path: '/admin/exams/:examId/questions',
        element: <ExamQuestions />,
      },
      {
        path: '/admin/grades',
        element: <GradesManagement />,
      },
      {
        path: '/admin/sections',
        element: <SectionsManagement />,
      },
      {
        path: '/admin/schools',
        element: <SchoolsManagement />,
      },
      {
        path: '/teacher/monitoring',
        element: <TeacherMonitoring />,
      },
      {
        path: '/teacher/grading',
        element: <TeacherGradingQueue />,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-200">
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  );
}

export default App;