import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import apiService from '../services/api';
import type { ExamQuestion, AttemptAnswer } from '../services/api';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import Timer from '../components/Timer';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import ProctoringCapture from '../components/ProctoringCapture';
import { useExamAutosave } from '../hooks/useExamAutosave';

interface AnswerState {
  [questionId: string]: any;
}

const ExamCanvas: React.FC = () => {
  const { examId, attemptId } = useParams<{ examId: string; attemptId: string }>();
  const navigate = useNavigate();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [proctoringEvents, setProctoringEvents] = useState<any[]>([]);
  const [timeUp, setTimeUp] = useState(false);

  // Fetch exam questions using React Query
  const { data: examQuestions = [], isLoading, isError } = useQuery<ExamQuestion[]>(
    ['examQuestions', examId],
    () => apiService.getExamQuestions(examId!),
    {
      enabled: !!examId,
      staleTime: 0, // Always fetch fresh data
    }
  );

  // Initialize autosave hook
  const { 
    isSaving, 
    isSaved, 
    isOffline, 
    retryCount, 
    queueAnswer, 
    saveAnswerImmediately 
  } = useExamAutosave(attemptId!, examId!);

  // Handle answer changes
  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    
    // Queue answer for autosave
    const attemptAnswer: Omit<AttemptAnswer, 'id'> = {
      attempt_id: attemptId!,
      question_id: questionId,
      // Map answer based on question type
      ...(typeof answer === 'string' ? { answer_text: answer } : {}),
      ...(typeof answer === 'boolean' ? { answer_text: answer.toString() } : {}),
      ...(typeof answer === 'number' ? { answer_text: answer.toString() } : {}),
      ...(typeof answer === 'object' && answer?.id ? { choice_id: answer.id } : {}),
      ...(typeof answer === 'string' && answer.startsWith('http') ? { uploaded_file: answer } : {}),
    };
    
    queueAnswer(attemptAnswer);
  }, [attemptId, queueAnswer]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    setTimeUp(true);
    handleSubmitExam();
  }, []);

  // Handle warnings
  const handleTimeWarning = useCallback((timeLeft: number) => {
    // Send proctoring event for time warnings
    const event = {
      attempt_id: attemptId,
      event_type: 'time_warning',
      event_time: new Date().toISOString(),
      details: { time_left: timeLeft }
    };
    
    setProctoringEvents(prev => [...prev, event]);
  }, [attemptId]);

  // Handle proctoring events
  const handleProctoringEvent = useCallback((eventType: string, details?: any) => {
    if (!attemptId) return;
    
    const event = {
      attempt_id: attemptId,
      event_type: eventType,
      event_time: new Date().toISOString(),
      details
    };
    
    setProctoringEvents(prev => [...prev, event]);
    
    // Send event to backend (batched)
    if (attemptId) {
      apiService.sendProctoringEvent(event).catch(console.error);
    }
  }, [attemptId]);

  // Handle image capture
  const handleImageCapture = useCallback((blob: Blob) => {
    // In a real implementation, you would upload the image and send the path
    // For now, we'll just log the event
    console.log('Captured image blob:', blob);
    handleProctoringEvent('snapshot_captured', { size: blob.size });
  }, [handleProctoringEvent]);

  // Submit exam
  const handleSubmitExam = useCallback(async () => {
    if (!attemptId) return;
    
    try {
      // Save any pending answers before submitting
      // This would be handled by the autosave hook in a real implementation
      
      const result = await apiService.submitAttempt(attemptId);
      
      // Navigate to results page
      navigate(`/results/${examId}/attempt/${attemptId}`);
    } catch (err) {
      console.error('Failed to submit exam:', err);
      // Show error message to user
    }
  }, [attemptId, examId, navigate]);

  // Handle tab switch
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleProctoringEvent('tab_hidden');
      } else {
        handleProctoringEvent('tab_visible');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleProctoringEvent]);

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < examQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Calculate progress
  const answeredCount = Object.keys(answers).length;
  const progress = examQuestions.length > 0 
    ? (answeredCount / examQuestions.length) * 100 
    : 0;

  // Get current question
  const currentQuestion = examQuestions[currentQuestionIndex]?.question;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header />
        <main className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </main>
      </div>
    );
  }

  if (isError || !examQuestions.length) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Exam</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                There was a problem loading the exam questions. Please try again.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <Header 
        showTimer 
        timeRemaining={examQuestions.length * 60} // Placeholder, should come from backend
        onHelp={() => alert('Need help with the exam?')}
      />
      
      {/* Proctoring capture component */}
      <ProctoringCapture 
        onCapture={handleImageCapture}
        onEvent={handleProctoringEvent}
      />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress and navigation */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Question {currentQuestionIndex + 1} of {examQuestions.length}</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <ProgressBar progress={progress} showPercentage animated />
              </div>
              <div className="flex-shrink-0">
                <Timer 
                  initialTime={examQuestions.length * 60} // Placeholder
                  onTimeUp={handleTimeUp}
                  onWarning={handleTimeWarning}
                />
              </div>
            </div>
            
            {/* Question navigation dots */}
            <div className="flex flex-wrap gap-2 justify-center">
              {examQuestions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
                    ${index === currentQuestionIndex 
                      ? 'bg-primary text-white' 
                      : answers[examQuestions[index].question.id] 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
          
          {/* Autosave indicator */}
          <div className="mb-6 flex justify-end">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm">
              {isSaving && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary"></div>
                  <span className="text-primary">Saving...</span>
                </>
              )}
              {isSaved && !isSaving && (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-green-600 dark:text-green-400">All changes saved</span>
                </>
              )}
              {isOffline && (
                <>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-yellow-600 dark:text-yellow-400">Offline mode</span>
                </>
              )}
              {retryCount > 0 && (
                <span className="text-orange-600 dark:text-orange-400">
                  Retrying... ({retryCount})
                </span>
              )}
            </div>
          </div>
          
          {/* Question card */}
          {currentQuestion && (
            <Card className="mb-8">
              <QuestionCard
                question={currentQuestion}
                selectedAnswer={answers[currentQuestion.id]}
                onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
              />
              
              {/* Navigation buttons */}
              <div className="mt-8 flex flex-wrap gap-3 justify-between">
                <div>
                  <Button
                    onClick={goToPreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="secondary"
                  >
                    ← Previous
                  </Button>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    variant="secondary"
                  >
                    Review All
                  </Button>
                  
                  {currentQuestionIndex === examQuestions.length - 1 ? (
                    <Button
                      onClick={handleSubmitExam}
                      className="text-black"
                    >
                      Submit Exam
                    </Button>
                  ) : (
                    <Button
                      onClick={goToNextQuestion}
                      className="text-black"
                    >
                      Next →
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
      
      {/* Review modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Answers</h2>
              <button 
                onClick={() => setShowReviewModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Progress</h3>
                  <p className="text-3xl font-bold text-primary">{answeredCount}/{examQuestions.length}</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    {Math.round(progress)}% complete
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Time Remaining</h3>
                  <Timer 
                    initialTime={examQuestions.length * 60} // Placeholder
                    onTimeUp={handleTimeUp}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Questions Overview</h3>
                <div className="space-y-3">
                  {examQuestions.map((eq, index) => {
                    const isAnswered = !!answers[eq.question.id];
                    return (
                      <div 
                        key={eq.question.id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors
                          ${index === currentQuestionIndex 
                            ? 'bg-primary/10 dark:bg-primary/20 border border-primary' 
                            : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                        onClick={() => {
                          setCurrentQuestionIndex(index);
                          setShowReviewModal(false);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                            ${index === currentQuestionIndex 
                              ? 'bg-primary text-white' 
                              : isAnswered 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                            }
                          `}>
                            {index + 1}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {eq.question.prompt.substring(0, 50)}...
                          </span>
                        </div>
                        <div>
                          {isAnswered ? (
                            <span className="text-green-600 dark:text-green-400 text-sm">Answered</span>
                          ) : (
                            <span className="text-yellow-600 dark:text-yellow-400 text-sm">Not answered</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
                  Continue Exam
                </Button>
                <Button onClick={handleSubmitExam} className="text-black">
                  Submit Exam
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ExamCanvas;