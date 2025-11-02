import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import apiService from '../services/api';
import type { Exam } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

const ExamDetail: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [error, setError] = useState('');

  // Fetch exam details using React Query
  const { data: exam, isLoading, isError } = useQuery<Exam>(
    ['exam', examId],
    () => apiService.getExam(examId!),
    {
      enabled: !!examId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const handleStartExam = async () => {
    if (!examId) return;
    
    try {
      // If exam requires access code, validate it
      if (exam?.access_code && accessCode !== exam.access_code) {
        setError('Invalid access code');
        return;
      }
      
      // Start the exam attempt
      const attemptData = await apiService.startAttempt(examId);
      
      // Navigate to exam canvas
      navigate(`/exam/${examId}/attempt/${attemptData.attempt_id}`);
    } catch (err) {
      console.error('Failed to start exam:', err);
      setError('Failed to start exam. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (isError || !exam) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Exam Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The exam you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => navigate('/exams')}>
                Back to Exams
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="overflow-hidden">
            {exam.image && (
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${exam.image})` }}>
                <div className="h-full w-full bg-gradient-to-t from-black/70 to-transparent"></div>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {exam.title}
                  </h1>
                  <p className="text-primary font-medium text-lg">{exam.subject}</p>
                </div>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {exam.status === 'upcoming' ? 'Upcoming' : 
                   exam.status === 'in-progress' ? 'In Progress' : 'Completed'}
                </span>
              </div>
              
              <div className="prose prose-gray dark:prose-invert max-w-none mb-8">
                <p className="text-gray-700 dark:text-gray-300">
                  {exam.description}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Exam Details</h3>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                      <span className="font-medium">{exam.duration} minutes</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Questions:</span>
                      <span className="font-medium">{exam.totalQuestions}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Due Date:</span>
                      <span className="font-medium">
                        {new Date(exam.dueDate).toLocaleDateString()}
                      </span>
                    </li>
                    {exam.passing_percentage && (
                      <li className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Passing Score:</span>
                        <span className="font-medium">{exam.passing_percentage}%</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Important Rules</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>You have {exam.duration} minutes to complete the exam</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>All questions must be answered before submitting</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Do not refresh or close the browser during the exam</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      <span>Proctoring is enabled for this exam</span>
                    </li>
                  </ul>
                </div>
              </div>
              
              {exam.access_code && !showAccessCodeInput && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="text-yellow-800 dark:text-yellow-200 font-medium">
                      This exam requires an access code
                    </span>
                  </div>
                </div>
              )}
              
              {showAccessCodeInput && (
                <div className="mb-6">
                  <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Enter Access Code
                  </label>
                  <input
                    type="text"
                    id="accessCode"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                    placeholder="Enter the access code provided by your instructor"
                  />
                  {error && (
                    <p className="mt-2 text-red-500 text-sm">{error}</p>
                  )}
                </div>
              )}
              
              {error && !showAccessCodeInput && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3">
                {exam.access_code ? (
                  showAccessCodeInput ? (
                    <Button onClick={handleStartExam} className="text-black">
                      Start Exam
                    </Button>
                  ) : (
                    <Button onClick={() => setShowAccessCodeInput(true)} className="text-black">
                      Enter Access Code
                    </Button>
                  )
                ) : (
                  <Button onClick={handleStartExam} className="text-black">
                    Start Exam
                  </Button>
                )}
                
                <Button variant="secondary" onClick={() => navigate('/exams')}>
                  Back to Exams
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;