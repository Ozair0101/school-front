import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { MonthlyExam } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';

const ExamsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'in-progress' | 'completed'>('all');

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };

  // Fetch exams using React Query
  const { data: exams = [], isLoading, error } = useQuery<MonthlyExam[]>(
    'exams',
    () => apiService.getExams(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Filter exams based on search term and status using useMemo
  const filteredExams = useMemo(() => {
    if (!exams || exams.length === 0) return [];
    
    let result = [...exams];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(exam => {
        const examTitle = `${getMonthName(exam.month)} ${exam.year} Exam`;
        const description = exam.description?.toLowerCase() || '';
        const gradeName = exam.grade?.name?.toLowerCase() || '';
        const sectionName = exam.section?.name?.toLowerCase() || '';
        
        return examTitle.toLowerCase().includes(term) ||
               description.includes(term) ||
               gradeName.includes(term) ||
               sectionName.includes(term);
      });
    }
    
    // Apply status filter based on exam date
    if (filterStatus !== 'all') {
      const now = new Date();
      result = result.filter(exam => {
        const examDate = new Date(exam.exam_date);
        if (filterStatus === 'upcoming') {
          return examDate > now;
        } else if (filterStatus === 'completed') {
          return examDate < now;
        } else if (filterStatus === 'in-progress') {
          return exam.online_enabled && examDate <= now;
        }
        return true;
      });
    }
    
    return result;
  }, [exams, searchTerm, filterStatus]);

  const handleStartExam = (examId: string) => {
    navigate(`/exam/${examId}`);
  };

  const handleViewResults = (examId: string) => {
    navigate(`/results/${examId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = (error as any)?.userMessage || 
                         ((error as any)?.code === 'ECONNABORTED' || (error as any)?.message?.includes('timeout'))
                           ? 'The request timed out. The server may be slow or unresponsive.'
                           : ((error as any)?.code === 'ERR_NETWORK' || !(error as any)?.response)
                             ? 'Cannot connect to server. Please ensure the backend is running on http://localhost:8000'
                             : 'There was a problem loading your exams.';

    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <Card className="text-center p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Exams</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {errorMessage}
              </p>
              <ul className="text-left text-gray-600 dark:text-gray-400 mb-6 space-y-2 max-w-md mx-auto">
                <li>• Check if Laravel backend is running: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">php artisan serve</code></li>
                <li>• Verify database connection is working</li>
                <li>• Check if the API endpoint is accessible: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">http://localhost:8000/api/monthly-exams</code></li>
                {(error as any)?.code === 'ECONNABORTED' && (
                  <li>• The request timed out - this may indicate the server is overloaded or database queries are slow</li>
                )}
              </ul>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => window.location.reload()}>
                  Retry
                </Button>
                <Button variant="secondary" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="px-4 sm:px-6 lg:px-8">
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
              {filteredExams.map((exam) => {
                const examTitle = `${getMonthName(exam.month)} ${exam.year} Exam`;
                const examDate = new Date(exam.exam_date);
                const now = new Date();
                const isUpcoming = examDate > now;
                const isCompleted = examDate < now;
                const isInProgress = exam.online_enabled && examDate <= now && !isCompleted;
                const status = isUpcoming ? 'upcoming' : isInProgress ? 'in-progress' : 'completed';
                
                return (
                  <Card key={exam.id} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {examTitle}
                              </h2>
                              <p className="text-primary font-medium">
                                {exam.grade?.name} - {exam.section?.name}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {status === 'upcoming' && (
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                                  Upcoming
                                </span>
                              )}
                              {status === 'in-progress' && (
                                <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-medium">
                                  In Progress
                                </span>
                              )}
                              {status === 'completed' && (
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-full text-sm font-medium">
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {exam.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              {exam.description}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
                              <p className="font-medium">{exam.duration_minutes || 'N/A'} minutes</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Exam Date</p>
                              <p className="font-medium">
                                {examDate.toLocaleDateString()}
                              </p>
                            </div>
                            {exam.start_time && exam.end_time && (
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Time</p>
                                <p className="font-medium">
                                  {exam.start_time} - {exam.end_time}
                                </p>
                              </div>
                            )}
                            {exam.passing_percentage && (
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Passing %</p>
                                <p className="font-medium">{exam.passing_percentage}%</p>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3">
                            {status === 'upcoming' && exam.online_enabled && (
                              <Button onClick={() => handleStartExam(exam.id.toString())}>
                                Start Exam
                              </Button>
                            )}
                            {status === 'in-progress' && (
                              <Button onClick={() => handleStartExam(exam.id.toString())}>
                                Continue Exam
                              </Button>
                            )}
                            {status === 'completed' && (
                              <Button variant="secondary" onClick={() => handleViewResults(exam.id.toString())}>
                                View Results
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamsList;