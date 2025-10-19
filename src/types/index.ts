export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  grade?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  duration: number; // in minutes
  totalQuestions: number;
  image?: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  score?: number;
  maxScore: number;
}

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  image?: string;
}

export interface ExamResult {
  examId: string;
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number;
  completedAt: string;
  answers: { questionId: string; selectedAnswer: number; isCorrect: boolean }[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'score' | 'streak' | 'completion' | 'speed';
}
