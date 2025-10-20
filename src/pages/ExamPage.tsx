import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Button from '../components/Button';
import Card from '../components/Card';
import { mockUser, mockExams, mockQuestions } from '../utils/mockData';
import type { Question } from '../types';

const ExamPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [user] = useState(mockUser);
  const [exam] = useState(mockExams.find(e => e.id === examId));
  const [questions] = useState<Question[]>(mockQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(new Array(questions.length).fill(-1));
  const [timeRemaining, setTimeRemaining] = useState(exam?.duration ? exam.duration * 60 : 2700); // Convert minutes to seconds
  const [showResults, setShowResults] = useState(false);
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    if (!exam) {
      navigate('/dashboard');
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam]);

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitExam = () => {
    const correctAnswers = questions.reduce((count, question, index) => {
      return count + (selectedAnswers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    
    const score = correctAnswers;
    const percentage = Math.round((score / questions.length) * 100);
    
    // In a real app, this would be saved to the backend
    navigate(`/results/${examId}?score=${score}&total=${questions.length}&percentage=${percentage}`);
  };

  const handleStartExam = () => {
    setExamStarted(true);
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  if (!exam) {
    return <div>Exam not found</div>;
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header user={user} />
        <main className="flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full text-center">
            <div className="mb-6">
              <img 
                alt="Exam Preview" 
                className="w-32 h-32 mx-auto mb-4 rounded-lg bg-cover bg-center"
                src={exam.image}
              />
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {exam.title} 📚
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-4">
                {exam.subject} • {exam.duration} minutes • {exam.totalQuestions} questions
              </p>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2">Exam Instructions:</h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
                <li>• Read each question carefully</li>
                <li>• Select the best answer</li>
                <li>• You can navigate between questions</li>
                <li>• Time will be tracked automatically</li>
                <li>• Submit when you're done</li>
              </ul>
            </div>

            <Button
              onClick={handleStartExam}
              className="w-full"
              icon={<span>🚀</span>}
            >
              Start Exam
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Header 
        user={user} 
        showTimer 
        timeRemaining={timeRemaining}
        onHelp={() => alert('Click on the answer you think is correct!')}
      />
      
      <main className="flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl mx-auto">
          {/* Progress Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</p>
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>
            
            <div className="relative character-path h-16 flex items-center">
              <div className="absolute w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-1 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div 
                className="absolute left-0 transition-all duration-500" 
                style={{ transform: `translateX(${progress}%)` }}
              >
                <div className="relative">
                  <img 
                    alt="Friendly Character" 
                    className="h-16 w-16 p-1 bg-background-light dark:bg-background-dark rounded-full border-4 border-primary shadow-lg" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCFy_WQo3hWu38sjPvqBBTPazfn500YAO6fr0rkZM5jBW_eu-hVXL92q5t4QkvCt4m5CUx6iD9pri-em1s9fwlRwGe7v4EsnpvHOqeYpMhM6K3sA_bWWllhMiJuTh-DbgTJuSZtUWJtdLW7nn4sIxdjfCXAGUMJ8JoRCHG256pBOF0WudwIdeDyRcBkaKuuZffdOd2uxSWIq4LJ-lgN_evmK8i5-RMxHYVxM7-2msZhyHZpIxnwqk8KHQIUjphMy6nWXcBkJ8ll0wI"
                  />
                  <div className="absolute -top-1 -right-1 bg-yellow-400 text-white text-xs font-bold rounded-full size-6 flex items-center justify-center border-2 border-white dark:border-background-dark">
                    {currentQuestionIndex + 1}
                  </div>
                </div>
              </div>
              
              <div className="absolute right-0 translate-x-1/2">
                <span className="material-symbols-outlined text-5xl text-yellow-500">
                  flag
                </span>
              </div>
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-8">
            <div className="flex items-start gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex-grow">
                {currentQuestion.question}
              </h2>
              <button className="flex items-center justify-center size-10 rounded-full bg-primary/10 dark:bg-primary/20 text-primary hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
                <span className="material-symbols-outlined">volume_up</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <label 
                  key={index}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-primary bg-primary/10 dark:bg-primary/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary'
                  }`}
                >
                  <input 
                    type="radio"
                    name="answer"
                    checked={selectedAnswers[currentQuestionIndex] === index}
                    onChange={() => handleAnswerSelect(index)}
                    className="appearance-none size-6 rounded-full border-2 border-gray-300 dark:border-gray-600 checked:bg-primary checked:border-primary focus:ring-primary/50 focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-light dark:focus:ring-offset-background-dark transition-all"
                  />
                  <span className="text-base font-medium text-gray-800 dark:text-gray-200">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            
            <div className="mt-8 flex justify-between">
              <Button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                variant="secondary"
                icon={<span>←</span>}
              >
                Previous
              </Button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={handleSubmitExam}
                  disabled={selectedAnswers[currentQuestionIndex] === -1}
                  icon={<span>Submit</span>}
                >
                  Submit Exam
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQuestionIndex] === -1}
                  icon={<span>→</span>}
                >
                  Next
                </Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ExamPage;
