import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ExamCard from '../components/ExamCard';
import Card from '../components/Card';
import ScoreBadge from '../components/ScoreBadge';
import ProgressBar from '../components/ProgressBar';
import { mockUser, mockExams, mockAchievements } from '../utils/mockData';

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user] = useState(mockUser);
  const [exams] = useState(mockExams);
  const [achievements] = useState(mockAchievements);

  const upcomingExams = exams.filter(exam => exam.status === 'upcoming');
  const completedExams = exams.filter(exam => exam.status === 'completed');
  const averageScore = completedExams.length > 0 
    ? Math.round(completedExams.reduce((sum, exam) => sum + (exam.score! / exam.maxScore) * 100, 0) / completedExams.length)
    : 0;

  const handleStartExam = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  const handleViewResults = (examId: string) => {
    navigate(`/results/${examId}`);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="px-4 sm:px-6 lg:px-20 xl:px-40">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome back, {user.name}! 👋
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                You have {upcomingExams.length} exam{upcomingExams.length !== 1 ? 's' : ''} coming up. Good luck! 🌟
              </p>
            </div>
            <div className="hidden md:block animate-float">
              <img 
                alt="Friendly Mascot" 
                className="w-40 h-auto" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGiPiiShiYy-RarlQVNiansxKlZEWN9zaYFV1I74mypCsmJKg2E2xjIzhnf_megHiycKZSjL3FZce8NMJduVbWa7jz58ausHWsysfY6FStLInOgTfSioMvmElHF8Mj1UdZ1Ud9TbUeikimHBJQydU0i_-xmPcnhVk3IreTxgncT6cWIvT1xB_-5fjKgwKreb5drXCpFjakL1TvZ4tqjBbW0L54Toon1GQAKF8GZvSfR0_ngfkW68MAcsMxYftSGn_0IOa2RlCtkfU"
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Overall Progress</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{averageScore}%</p>
                </div>
                <div className="text-3xl">📈</div>
              </div>
              <ProgressBar progress={averageScore} className="mt-4" animated />
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Exams Completed</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{completedExams.length}</p>
                </div>
                <div className="text-3xl">✅</div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {completedExams.length} of {exams.length} total
              </p>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Achievements</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{achievements.length}</p>
                </div>
                <div className="text-3xl">🏆</div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Keep up the great work!
              </p>
            </Card>
          </div>

          <div className="space-y-12">
            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white px-2 mb-6 flex items-center gap-2">
                  Upcoming Exams 📚
                  <span className="text-lg">({upcomingExams.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingExams.map(exam => (
                    <ExamCard
                      key={exam.id}
                      exam={exam}
                      onStartExam={handleStartExam}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recent Results */}
            {completedExams.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white px-2 mb-6 flex items-center gap-2">
                  Recent Results 🎯
                </h2>
                <div className="space-y-4">
                  {completedExams.slice(0, 3).map(exam => (
                    <Card key={exam.id} hover className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {exam.image && (
                          <div 
                            className="w-16 h-16 rounded-lg bg-cover bg-center hidden sm:block"
                            style={{ backgroundImage: `url(${exam.image})` }}
                          />
                        )}
                        <div>
                          <p className="text-sm font-medium text-primary">{exam.subject}</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100">{exam.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Completed: {new Date(exam.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <ScoreBadge 
                          score={exam.score!} 
                          maxScore={exam.maxScore}
                          animated
                        />
                        <button
                          onClick={() => handleViewResults(exam.id)}
                          className="text-primary hover:text-primary/80 font-medium text-sm"
                        >
                          View Details →
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white px-2 mb-6 flex items-center gap-2">
                Your Achievements 🏆
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {achievements.map(achievement => (
                  <Card key={achievement.id} className="text-center">
                    <div className="text-4xl mb-3 animate-bounce-gentle">{achievement.icon}</div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                      {achievement.description}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
