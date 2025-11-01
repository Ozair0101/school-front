import type { Exam, Question, Choice, StudentAttempt, AttemptAnswer } from '../services/api';

// Sample exam data for local development
export const sampleExams: Exam[] = [
  {
    id: '1',
    title: 'Mathematics Midterm Exam',
    subject: 'Mathematics',
    description: 'Comprehensive midterm exam covering algebra, geometry, and trigonometry',
    dueDate: '2025-11-15T10:00:00Z',
    duration: 90,
    totalQuestions: 25,
    image: 'https://images.unsplash.com/photo-1560346418-93a8d5d6c8d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    status: 'upcoming',
    maxScore: 100,
    access_code: 'MATH2025',
    online_enabled: true,
    passing_percentage: 60,
  },
  {
    id: '2',
    title: 'Biology Final Exam',
    subject: 'Biology',
    description: 'Final exam covering cellular biology, genetics, and ecology',
    dueDate: '2025-11-20T14:00:00Z',
    duration: 120,
    totalQuestions: 40,
    image: 'https://images.unsplash.com/photo-1552674605-db0b3b7b6c00?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    status: 'in-progress',
    maxScore: 100,
    online_enabled: true,
    passing_percentage: 70,
  },
  {
    id: '3',
    title: 'History Quiz 1',
    subject: 'History',
    description: 'Quiz on ancient civilizations',
    dueDate: '2025-10-30T09:00:00Z',
    duration: 30,
    totalQuestions: 10,
    image: 'https://images.unsplash.com/photo-1560346418-93a8d5d6c8d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    status: 'completed',
    score: 85,
    maxScore: 100,
    online_enabled: true,
    passing_percentage: 60,
  },
];

// Sample questions for the exams
export const sampleQuestions: Question[] = [
  {
    id: 'q1',
    prompt: 'What is the value of π (pi) rounded to two decimal places?',
    type: 'numeric',
    default_marks: 2,
    metadata: {
      correct_answer: 3.14,
      explanation: 'Pi is a mathematical constant representing the ratio of a circle\'s circumference to its diameter.',
    },
  },
  {
    id: 'q2',
    prompt: 'Which of the following is a prime number?',
    type: 'mcq',
    default_marks: 1,
    choices: [
      {
        id: 'c1',
        choice_text: '4',
        is_correct: false,
      },
      {
        id: 'c2',
        choice_text: '9',
        is_correct: false,
      },
      {
        id: 'c3',
        choice_text: '11',
        is_correct: true,
      },
      {
        id: 'c4',
        choice_text: '15',
        is_correct: false,
      },
    ],
    metadata: {
      explanation: 'A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.',
    },
  },
  {
    id: 'q3',
    prompt: 'Water boils at 100°C at sea level.',
    type: 'tf',
    default_marks: 1,
    metadata: {
      correct_answer: true,
      explanation: 'This is a fundamental property of water at standard atmospheric pressure.',
    },
  },
  {
    id: 'q4',
    prompt: 'What is the capital of France?',
    type: 'short',
    default_marks: 1,
    metadata: {
      correct_answer: 'Paris',
      explanation: 'Paris is the capital and largest city of France.',
    },
  },
  {
    id: 'q5',
    prompt: 'Explain the process of photosynthesis in plants.',
    type: 'essay',
    default_marks: 10,
    metadata: {
      explanation: 'Photosynthesis is the process by which plants convert light energy into chemical energy, using carbon dioxide and water to produce glucose and oxygen.',
    },
  },
  {
    id: 'q6',
    prompt: 'Upload a diagram showing the water cycle.',
    type: 'file',
    default_marks: 5,
    metadata: {
      allowed_file_types: ['jpg', 'png', 'pdf'],
      max_file_size: 5,
      explanation: 'The diagram should clearly show evaporation, condensation, and precipitation.',
    },
  },
];

// Sample student attempts
export const sampleAttempts: StudentAttempt[] = [
  {
    id: 'a1',
    monthly_exam_id: '1',
    student_id: 's1',
    started_at: '2025-11-01T09:00:00Z',
    status: 'in_progress',
    attempt_token: 'token_12345',
  },
  {
    id: 'a2',
    monthly_exam_id: '3',
    student_id: 's1',
    started_at: '2025-10-30T08:30:00Z',
    finished_at: '2025-10-30T09:05:00Z',
    duration_seconds: 35 * 60,
    status: 'graded',
    total_score: 85,
    percent: 85,
    attempt_token: 'token_67890',
  },
];

// Sample attempt answers
export const sampleAnswers: AttemptAnswer[] = [
  {
    attempt_id: 'a1',
    question_id: 'q1',
    answer_text: '3.14',
    saved_at: '2025-11-01T09:05:00Z',
  },
  {
    attempt_id: 'a1',
    question_id: 'q2',
    choice_id: 'c3',
    saved_at: '2025-11-01T09:07:00Z',
  },
  {
    attempt_id: 'a2',
    question_id: 'q1',
    answer_text: '3.14',
    marks_awarded: 2,
    auto_graded: true,
    saved_at: '2025-10-30T08:35:00Z',
  },
  {
    attempt_id: 'a2',
    question_id: 'q5',
    answer_text: 'Photosynthesis is the process where plants convert sunlight into energy. They take in carbon dioxide and water, and produce glucose and oxygen.',
    marks_awarded: 8,
    auto_graded: false,
    graded_by: 't1',
    graded_at: '2025-10-30T10:00:00Z',
    saved_at: '2025-10-30T09:00:00Z',
  },
];

// Export all sample data
export const sampleData = {
  exams: sampleExams,
  questions: sampleQuestions,
  attempts: sampleAttempts,
  answers: sampleAnswers,
};