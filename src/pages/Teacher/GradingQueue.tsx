import React, { useState } from 'react';
import { useQuery } from 'react-query';
import apiService from '../../services/api';
import type { StudentAttempt, AttemptAnswer } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';
import ProgressBar from '../../components/ProgressBar';

interface GradingItem {
  attempt: StudentAttempt;
  answers: AttemptAnswer[];
  student_name: string;
  exam_title: string;
}

const TeacherGradingQueue: React.FC = () => {
  const [gradingItems, setGradingItems] = useState<GradingItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GradingItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'student' | 'exam'>('date');
  const [selectedItem, setSelectedItem] = useState<GradingItem | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});

  // Fetch grading queue using React Query
  const { data: items = [], isLoading, isError, refetch } = useQuery<GradingItem[]>(
    'gradingQueue',
    async () => {
      // In a real implementation, you would fetch from an endpoint
      // For now, we'll simulate with a placeholder
      return [];
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Filter and sort items
  React.useEffect(() => {
    let result = [...items];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.student_name.toLowerCase().includes(term) ||
        item.exam_title.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.attempt.finished_at || '').getTime() - new Date(a.attempt.finished_at || '').getTime();
        case 'student':
          return a.student_name.localeCompare(b.student_name);
        case 'exam':
          return a.exam_title.localeCompare(b.exam_title);
        default:
          return 0;
      }
    });
    
    setFilteredItems(result);
  }, [items, searchTerm, sortBy]);

  // Handle grade change
  const handleGradeChange = (answerId: string, marks: number) => {
    setGrades(prev => ({
      ...prev,
      [answerId]: marks
    }));
  };

  // Submit grades
  const handleSubmitGrades = async () => {
    if (!selectedItem) return;
    
    try {
      // Update grades for each answer
      for (const answer of selectedItem.answers) {
        if (grades[answer.id!]) {
          // In a real implementation, you would call an API endpoint to update the grade
          // await apiService.updateAttemptAnswer(answer.id!, {
          //   marks_awarded: grades[answer.id!],
          //   auto_graded: false,
          //   graded_by: 'teacher_id', // Current teacher ID
          //   graded_at: new Date().toISOString(),
          // });
        }
      }
      
      // Mark attempt as graded
      // await apiService.updateStudentAttempt(selectedItem.attempt.id, {
      //   status: 'graded',
      //   total_score: Object.values(grades).reduce((sum, grade) => sum + grade, 0),
      // });
      
      // Refresh the queue
      refetch();
      
      // Close the grading modal
      setSelectedItem(null);
      setGrades({});
    } catch (err) {
      console.error('Failed to submit grades:', err);
      // Show error message to user
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Data</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                There was a problem loading the grading queue. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
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
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Grading Queue
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Review and grade student exam submissions
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-4 py-2 rounded-lg">
                <span className="font-bold">{filteredItems.length}</span> items need grading
              </div>
            </div>
          </div>
          
          {/* Search and filters */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search by student or exam..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                >
                  <option value="date">Sort by Date</option>
                  <option value="student">Sort by Student</option>
                  <option value="exam">Sort by Exam</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Grading queue */}
          {filteredItems.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                All Caught Up!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                There are no submissions waiting for your review
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {filteredItems.map((item) => (
                <Card key={item.attempt.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          {item.student_name}
                        </h3>
                        <span className="text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-primary font-medium">
                          {item.exam_title}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span>
                          Submitted: {new Date(item.attempt.finished_at || '').toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          Duration: {item.attempt.duration_seconds 
                            ? `${Math.floor(item.attempt.duration_seconds / 60)}m ${item.attempt.duration_seconds % 60}s`
                            : 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Progress:
                        </span>
                        <ProgressBar 
                          progress={75} // Placeholder, should be calculated
                          className="flex-1 max-w-xs"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          12/16 answered
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        onClick={() => setSelectedItem(item)}
                      >
                        Grade Now
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Grading modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Grade Submission
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {selectedItem.student_name} - {selectedItem.exam_title}
                </p>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Essay Questions</h3>
                
                <div className="space-y-6">
                  {selectedItem.answers
                    .filter(answer => answer.question_id) // Filter for essay/file questions
                    .map((answer) => (
                      <div key={answer.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            Question Prompt
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {/* Question prompt would go here */}
                            Explain the process of photosynthesis in detail.
                          </p>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                            Student Response
                          </h4>
                          <div className="p-3 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {answer.answer_text || 'No response provided'}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Marks Awarded (out of 10)
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="0"
                              max={10}
                              value={grades[answer.id!] || ''}
                              onChange={(e) => handleGradeChange(answer.id!, parseFloat(e.target.value) || 0)}
                              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                            />
                            <span className="text-gray-600 dark:text-gray-400">
                              / 10
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setSelectedItem(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitGrades} className="text-black">
                  Submit Grades
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeacherGradingQueue;