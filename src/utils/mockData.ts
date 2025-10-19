import { User, Exam, Question, Achievement } from '../types';

export const mockUser: User = {
  id: '1',
  name: 'Aisha',
  email: 'aisha@example.com',
  role: 'student',
  grade: '10A'
};

export const mockExams: Exam[] = [
  {
    id: '1',
    title: 'Geometry Exam',
    subject: 'Math',
    description: 'Test your knowledge of shapes, angles, and spatial reasoning',
    dueDate: '2024-05-15T10:00:00Z',
    duration: 45,
    totalQuestions: 20,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdia3eIyNhhEj3xWv_BxrXULWu9O8x1YjEoKskHx-JJArmE8YA1uyGtjDe5voKQAmo559vMIazLn7UmihILthgbI0nszj-bKZE4dw1je5cXsMdQylE3B2qAbI2LrTFenAP_CbIhDSDpCq3KYMiFLBcwkG29PeQJ8bnqJFTWxDZciDq1wpLFhCnfwNvUabQBvIjh4CQj7rthW4vjJBFFEhR_4-6S4lICyJ4lPuw4-pcCq-HMkj5xOtco85vG_djYRfAZ9koINRNDzk',
    status: 'upcoming',
    maxScore: 20
  },
  {
    id: '2',
    title: 'Biology Exam',
    subject: 'Science',
    description: 'Explore the wonders of living organisms and their processes',
    dueDate: '2024-05-22T14:00:00Z',
    duration: 60,
    totalQuestions: 25,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFxZfHbe_6pBolvZ38NttQY1Ke_SJGXA8FmHkqj9986qh0c41D0_-Q1zL0fp0qsEKy0q0vUSiGMrEyFHCt2pLASSYWkpFX_6SRcyO6gKYeu4OqATAiKjoIaAUgp1A1qBfxPC17OX81jJufZCI83Bz6ihQG93q3JCRnpNUOIKqBZJik3zqn74x8GVPGgQf4Rxz_fDp4IQylBZevo5IL95Fd_eMpEeZEY2AXArKZd3Cm9Dj-0_hnDQKOEXNeL1ekLrDTZLUPBoXf-6M',
    status: 'upcoming',
    maxScore: 25
  },
  {
    id: '3',
    title: 'Algebra Exam',
    subject: 'Math',
    description: 'Master equations, variables, and mathematical expressions',
    dueDate: '2024-04-15T10:00:00Z',
    duration: 50,
    totalQuestions: 22,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDKaiDwPk_U8zHyM5VM_UFU_2SwVpPXxPKnYQk83-IBR9OYw3tMadn92Mr1yHFM_2ifjVvPUOOt20WHTh0jSWOhvINEB21h6NNk0JbvGdqrvx870EuJW4VQk_cdeMEAJ4rRWU6ImA2kbbR1J56_gRZg1EAfyLO_RdfDvp-E-BcfsLxx3uW0Sm_-YsRPosBBcP5Uz3MUH-XRzXuTPcRL1DmOUMmGjH5Ps6BJ67vahF5y_1kkPDpnwCXYCB3ENcO9sr5eTJ40rR_LEJw',
    status: 'completed',
    score: 18,
    maxScore: 22
  },
  {
    id: '4',
    title: 'Chemistry Exam',
    subject: 'Science',
    description: 'Discover the elements and chemical reactions',
    dueDate: '2024-04-22T14:00:00Z',
    duration: 55,
    totalQuestions: 24,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYDacQ8Jvw8NHlr-4EVOq7oEAsXSGSelRY5TftndhwgK7JihdfOT5nXwwxImoBTbZ-cS_LYYT4xB1ddapZrB2Peww2gobk3GrYGAtSEhD_PGC8X09V42P7TuEcf2uZeSEpnN28KtGYBbPxNd-wA7foicDUzRG9UCKTxna5n5ba87r175u1HRf3dv5S358iIhW00OmTTqUJVJnJMgOkizhB7fYwXdksgoNDpeNnmZn3XvI7UYNVv2ohEW390cnniLOslU-k7KsbOB8',
    status: 'completed',
    score: 21,
    maxScore: 24
  }
];

export const mockQuestions: Question[] = [
  {
    id: '1',
    question: 'What is the capital of Afghanistan?',
    options: ['Kabul', 'Herat', 'Mazar-i-Sharif', 'Kandahar'],
    correctAnswer: 0,
    explanation: 'Kabul has been the capital of Afghanistan since 1776.'
  },
  {
    id: '2',
    question: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 1,
    explanation: 'Mars is called the Red Planet because of the iron oxide on its surface.'
  },
  {
    id: '3',
    question: 'What is 15 + 27?',
    options: ['40', '42', '41', '43'],
    correctAnswer: 1,
    explanation: '15 + 27 = 42'
  },
  {
    id: '4',
    question: 'Which animal is known as the King of the Jungle?',
    options: ['Tiger', 'Lion', 'Elephant', 'Leopard'],
    correctAnswer: 1,
    explanation: 'The lion is often called the King of the Jungle, though they actually live in grasslands.'
  }
];

export const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'First Exam',
    description: 'Completed your first exam!',
    icon: '🎓',
    unlockedAt: '2024-04-15T10:30:00Z',
    category: 'completion'
  },
  {
    id: '2',
    title: 'High Scorer',
    description: 'Scored 90% or higher on an exam',
    icon: '🏆',
    unlockedAt: '2024-04-22T14:30:00Z',
    category: 'score'
  },
  {
    id: '3',
    title: 'Speed Demon',
    description: 'Completed an exam in half the time',
    icon: '⚡',
    unlockedAt: '2024-04-15T10:15:00Z',
    category: 'speed'
  }
];
