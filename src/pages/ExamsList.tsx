import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { Exam } from '../services/api';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';

const ExamsList: React.FC = () => {
  const navigate = useNavigate();
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'in-progress' | 'completed'>('all');

  // Fetch exams using React Query
  const { data: exams = [], isLoading, error } = useQuery<Exam[]>(
    'exams',
    () => apiService.getExams(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Filter exams based on search term and status
  useEffect(() => {
    let result = [...exams];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(exam => 
        exam.title.toLowerCase().includes(term) || 
        exam.subject.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter(exam => exam.status === filterStatus);
    }
    
    setFilteredExams(result);
  }, [exams, searchTerm, filterStatus]);

  const handleStartExam = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  const handleViewResults = (examId: string) => {
    navigate(`/results/${examId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <Header />
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            <Card className="text-center p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Exams</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                There was a problem loading your exams. Please try again later.
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
      <Header />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Your Exams
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage your upcoming and past exams
            </p>
          </div>
          
          {/* Search and filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Exams list */}
          {filteredExams.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {searchTerm || filterStatus !== 'all' ? 'No exams found' : 'No exams available'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'There are currently no exams assigned to you'}
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredExams.map((exam) => (
                <Card key={exam.id} className="overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      {exam.image && (
                        <div className="flex-shrink-0">
                          <img 
                            src={exam.image} 
                            alt={exam.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                              {exam.title}
                            </h2>
                            <p className="text-primary font-medium">{exam.subject}</p>
                          </div>
                          <div className="flex gap-2">
                            {exam.status === 'upcoming' && (
                              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                                Upcoming
                              </span>
                            )}
                            {exam.status === 'in-progress' && (
                              <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                                In Progress
                              </span>
                            )}
                            {exam.status === 'completed' && (
                              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          {exam.description}
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                            <p className="font-medium">{exam.duration} minutes</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Questions</p>
                            <p className="font-medium">{exam.totalQuestions}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                            <p className="font-medium">
                              {new Date(exam.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          {exam.status === 'completed' && exam.score !== undefined && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                              <p className="font-medium">
                                {exam.score}/{exam.maxScore} ({Math.round((exam.score / exam.maxScore) * 100)}%)
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {exam.status === 'completed' && exam.score !== undefined && (
                          <div className="mb-4">
                            <ProgressBar 
                              progress={(exam.score / exam.maxScore) * 100} 
                              showPercentage 
                            />
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-3">
                          {exam.status === 'upcoming' && (
                            <Button onClick={() => handleStartExam(exam.id)}>
                              Start Exam
                            </Button>
                          )}
                          {exam.status === 'in-progress' && (
                            <Button onClick={() => handleStartExam(exam.id)}>
                              Continue Exam
                            </Button>
                          )}
                          {exam.status === 'completed' && (
                            <Button variant="secondary" onClick={() => handleViewResults(exam.id)}>
                              View Results
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ExamsList;