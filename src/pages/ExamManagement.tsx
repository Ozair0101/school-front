import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { MonthlyExam } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import ExamForm from '../components/ExamForm';

const ExamManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<MonthlyExam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch exams
  const { data: exams = [], isLoading, error } = useQuery<MonthlyExam[]>(
    'exams',
    () => apiService.getExams(),
    {
      staleTime: 30 * 1000, // 30 seconds
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteExam(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('exams');
        setShowDeleteModal(false);
        setSelectedExam(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete exam:', error);
        alert(error.response?.data?.message || 'Failed to delete exam');
      },
    }
  );

  const handleCreate = () => {
    setSelectedExam(null);
    setShowFormModal(true);
  };

  const handleEdit = (exam: MonthlyExam) => {
    setSelectedExam(exam);
    setShowFormModal(true);
  };

  const handleDelete = (exam: MonthlyExam) => {
    setSelectedExam(exam);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedExam) {
      deleteMutation.mutate(selectedExam.id);
    }
  };

  const handleSave = async (examData: Partial<MonthlyExam>) => {
    setIsSubmitting(true);
    try {
      if (selectedExam) {
        // Update existing exam
        await apiService.updateExam(selectedExam.id, examData);
      } else {
        // Create new exam
        await apiService.createExam(examData);
      }
      
      queryClient.invalidateQueries('exams');
      setShowFormModal(false);
      setSelectedExam(null);
    } catch (error: any) {
      console.error('Failed to save exam:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors || 
                          'Failed to save exam';
      alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowFormModal(false);
    setSelectedExam(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
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

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Exams</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load exams'}
              </p>
              <Button onClick={() => navigate('/admin')}>
                Back to Dashboard
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
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Exam Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create, edit, and manage monthly exams
              </p>
            </div>
            <Button onClick={handleCreate} icon={<span>+</span>}>
              Create New Exam
            </Button>
          </div>

          {/* Exams Table */}
          {exams.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Exams Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first exam
              </p>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Create Exam
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Exam Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Grade/Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Settings
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {exams.map((exam) => (
                      <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {getMonthName(exam.month)} {exam.year} Exam
                            </div>
                            {exam.description && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {exam.description.substring(0, 60)}
                                {exam.description.length > 60 ? '...' : ''}
                              </div>
                            )}
                            {exam.online_enabled && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 mt-1">
                                Online Enabled
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {exam.grade?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {exam.section?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDate(exam.exam_date)}
                          </div>
                          {exam.start_time && exam.end_time && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {exam.start_time} - {exam.end_time}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white space-y-1">
                            {exam.duration_minutes && (
                              <div>Duration: {exam.duration_minutes} min</div>
                            )}
                            {exam.passing_percentage !== null && exam.passing_percentage !== undefined && (
                              <div>Pass: {exam.passing_percentage}%</div>
                            )}
                            {exam.access_code && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Code: {exam.access_code}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              aria-label="Manage questions"
                              title="Manage Questions"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(exam)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Edit exam"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(exam)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              aria-label="Delete exam"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={handleCancel}
        title={selectedExam ? 'Edit Exam' : 'Create New Exam'}
        size="xl"
      >
        <ExamForm
          exam={selectedExam}
          onSave={handleSave}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedExam(null);
        }}
        title="Delete Exam"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedExam(null);
              }}
              disabled={deleteMutation.isLoading}
            >
              Cancel
            </Button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteMutation.isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              Delete
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this exam?
          </p>
          {selectedExam && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white">
                {getMonthName(selectedExam.month)} {selectedExam.year} Exam
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {selectedExam.grade?.name} - {selectedExam.section?.name}
              </p>
            </div>
          )}
          <p className="text-sm text-red-600 dark:text-red-400">
            ⚠️ This action cannot be undone. All related data (attempts, answers, etc.) will also be deleted.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ExamManagement;

