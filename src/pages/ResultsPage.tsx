import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import ScoreBadge from '../components/ScoreBadge';
import ProgressBar from '../components/ProgressBar';
import ConfettiEffect from '../components/ConfettiEffect';
import { mockExams } from '../utils/mockData';

const ResultsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const exam = mockExams.find(e => e.id === examId);
  const score = parseInt(searchParams.get('score') || '0');
  const total = parseInt(searchParams.get('total') || '1');
  const percentage = parseInt(searchParams.get('percentage') || '0');

  useEffect(() => {
    if (percentage >= 80) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  }, [percentage]);

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { message: "Outstanding! 🌟", color: "text-green-600 dark:text-green-400" };
    if (percentage >= 80) return { message: "Excellent work! 🎉", color: "text-blue-600 dark:text-blue-400" };
    if (percentage >= 70) return { message: "Great job! 👍", color: "text-yellow-600 dark:text-yellow-400" };
    if (percentage >= 60) return { message: "Good effort! 💪", color: "text-orange-600 dark:text-orange-400" };
    return { message: "Keep practicing! 📚", color: "text-red-600 dark:text-red-400" };
  };

  const getScoreEmoji = () => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🥇';
    if (percentage >= 70) return '🥈';
    if (percentage >= 60) return '🥉';
    return '📚';
  };

  const performance = getPerformanceMessage();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleRetakeExam = () => {
    navigate(`/exam/${examId}`);
  };

  if (!exam) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <Card className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Exam not found
          </h1>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark relative overflow-hidden">
      <ConfettiEffect active={showConfetti} />
      
      <main className="flex items-center justify-center p-4 min-h-screen">
        <div className="w-full max-w-lg mx-auto text-center z-10">
          {/* Mascot */}
          <div className="mb-6">
            <div className="w-48 h-48 mx-auto bg-center bg-no-repeat bg-cover rounded-full animate-bounce-gentle" 
                 style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD0glcgWsxhIlmkVr7duML6SGKfG_zUGFRAAZTyf6dU6qoLj6E4HvFlwV7XTIPUOaKBsHknozAUu4xXxJFJ3TzIWpzEFnS2mb07K3NMMAvSAv_NE24xy62Tqubw_X2Riul36j04NBbzjxCa6SdC3Bo4ybthoZf9OOQfQmq9Dpxto2J_5LPRNJkK3L5Ts3QiO_fbbm6XlHxCwaoFXM_Wnhvp0Av2bIvjSkeELVXS41So4nNgjCXLfUyJeFvjIiA4uxqg6CABze7WA7E")'}}></div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-text-light dark:text-text-dark mb-2">
            Well done, Aisha! 🎊
          </h1>
          <p className="text-lg text-text-light/80 dark:text-text-dark/80 mb-8">
            You've successfully completed the {exam.title}. Let's see how you did!
          </p>

          {/* Performance Message */}
          <div className={`text-2xl font-bold mb-8 ${performance.color} animate-pulse-soft`}>
            {performance.message}
          </div>

          {/* Score Card */}
          <Card className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark/20 rounded-lg">
                <span className="text-sm text-text-light/70 dark:text-text-dark/70 mb-1">Your Score</span>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-primary">{score}</span>
                  <span className="text-2xl font-semibold text-text-light/50 dark:text-text-dark/50">
                    / {total}
                  </span>
                </div>
                <div className="flex items-center text-success-light dark:text-success-dark">
                  <span className="text-lg mr-1">{getScoreEmoji()}</span>
                  <span className="text-sm font-medium">{percentage}%</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark/20 rounded-lg">
                <span className="text-sm text-text-light/70 dark:text-text-dark/70 mb-1">Performance</span>
                <div className="text-4xl font-extrabold text-text-light dark:text-text-dark mb-2">
                  {percentage}%
                </div>
                <ProgressBar 
                  progress={percentage} 
                  color={percentage >= 80 ? 'success' : percentage >= 60 ? 'warning' : 'error'}
                  animated
                />
              </div>
            </div>
          </Card>

          {/* Detailed Results */}
          <Card className="mb-8">
            <h3 className="text-lg font-bold text-text-light dark:text-text-dark mb-4">
              Exam Details 📊
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-lg text-green-600 dark:text-green-400">{score}</div>
                <div className="text-gray-600 dark:text-gray-400">Correct</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-bold text-lg text-red-600 dark:text-red-400">{total - score}</div>
                <div className="text-gray-600 dark:text-gray-400">Incorrect</div>
              </div>
            </div>
          </Card>

          {/* Achievement Badge */}
          {percentage >= 80 && (
            <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800">
              <div className="text-center">
                <div className="text-5xl mb-3 animate-wiggle">🏆</div>
                <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-400 mb-2">
                  Achievement Unlocked!
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  {percentage >= 90 ? "Perfect Score Master!" : "High Scorer!"}
                </p>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleBackToDashboard}
              variant="secondary"
              icon={<span>🏠</span>}
            >
              Back to Dashboard
            </Button>
            {percentage < 70 && (
              <Button
                onClick={handleRetakeExam}
                icon={<span>🔄</span>}
              >
                Try Again
              </Button>
            )}
          </div>

          {/* Encouragement Message */}
          <div className="mt-8 p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-primary font-medium">
              {percentage >= 80 
                ? "🌟 Amazing work! You're on fire! Keep up the excellent progress!" 
                : percentage >= 60 
                  ? "💪 Good effort! Practice makes perfect. You're getting better every day!" 
                  : "📚 Don't worry! Every expert was once a beginner. Keep learning and growing!"
              }
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResultsPage;
