import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { MonthlyExam, ExamSubject, Subject } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

interface ExamSubjectFormData {
  subject_id: number;
  max_marks: number;
  pass_marks: number;
}

const ExamSubjectsManagement: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExamSubject, setSelectedExamSubject] = useState<ExamSubject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ExamSubjectFormData>({
    subject_id: 0,
    max_marks: 100,
    pass_marks: 50,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch exam details
  const { data: exam } = useQuery<MonthlyExam>(
    ['exam', examId],
    () => apiService.getExam(examId!),
    { enabled: !!examId }
  );

  // Fetch exam subjects
  const { data: examSubjects = [], isLoading: isLoadingSubjects } = useQuery<ExamSubject[]>(
    ['exam-subjects', examId],
    () => apiService.getExamSubjects(examId!),
    { enabled: !!examId }
  );

  // Fetch available subjects
  const { data: subjects = [] } = useQuery<Subject[]>(
    'subjects',
    () => apiService.getSubjects()
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: ExamSubjectFormData) => {
      if (selectedExamSubject) {
        return apiService.updateExamSubject(selectedExamSubject.id, data);
      }
      return apiService.createExamSubject({
        monthly_exam_id: Number(examId!),
        ...data,
      });
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-subjects', examId]);
        setShowFormModal(false);
        setSelectedExamSubject(null);
        resetForm();
      },
      onError: (error: any) => {
        const errors = error.response?.data?.errors || {};
        const message = error.response?.data?.message;
        if (message) {
          setFormErrors({ _general: message });
        } else {
          setFormErrors(errors);
        }
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteExamSubject(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-subjects', examId]);
        setShowDeleteModal(false);
        setSelectedExamSubject(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete exam subject:', error);
        alert(error.response?.data?.message || 'Failed to delete exam subject');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      subject_id: 0,
      max_marks: 100,
      pass_marks: 50,
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    setSelectedExamSubject(null);
    resetForm();
    setShowFormModal(true);
  };

  const handleEdit = (examSubject: ExamSubject) => {
    setSelectedExamSubject(examSubject);
    setFormData({
      subject_id: examSubject.subject_id,
      max_marks: examSubject.max_marks,
      pass_marks: examSubject.pass_marks,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleDelete = (examSubject: ExamSubject) => {
    setSelectedExamSubject(examSubject);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedExamSubject) {
      deleteMutation.mutate(selectedExamSubject.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.subject_id) errors.subject_id = 'Subject is required';
    if (formData.max_marks <= 0) errors.max_marks = 'Max marks must be greater than 0';
    if (formData.pass_marks < 0) errors.pass_marks = 'Pass marks cannot be negative';
    if (formData.pass_marks > formData.max_marks) {
      errors.pass_marks = 'Pass marks cannot exceed max marks';
    }

    // Check if subject already exists in this exam
    if (!selectedExamSubject) {
      const existing = examSubjects.find(es => es.subject_id === formData.subject_id);
      if (existing) {
        errors.subject_id = 'This subject is already added to the exam';
      }
    } else {
      const existing = examSubjects.find(es => es.subject_id === formData.subject_id && es.id !== selectedExamSubject.id);
      if (existing) {
        errors.subject_id = 'This subject is already added to the exam';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    saveMutation.mutate(formData, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  const handleCancel = () => {
    setShowFormModal(false);
    setSelectedExamSubject(null);
    resetForm();
  };

  // Filter out already added subjects
  const availableSubjects = subjects.filter(subject => {
    if (selectedExamSubject) {
      return true; // Show all when editing
    }
    return !examSubjects.some(es => es.subject_id === subject.id);
  });

  // Calculate total marks
  const totalMarks = examSubjects.reduce((sum, es) => sum + es.max_marks, 0);

  if (isLoadingSubjects) {
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

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <button
                  onClick={() => navigate('/admin/exams')}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Exams
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Exam Subjects</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {exam ? `${exam.grade?.name || 'Grade'} - ${exam.section?.name || 'Section'} - ${new Date(exam.exam_date).toLocaleDateString()}` : 'Manage subjects for this exam'}
                </p>
              </div>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Add Subject
              </Button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Subjects
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {examSubjects.length}
                </div>
              </Card>
              <Card>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Total Marks
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalMarks}
                </div>
              </Card>
              <Card>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Average Pass Marks
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {examSubjects.length > 0
                    ? Math.round(examSubjects.reduce((sum, es) => sum + es.pass_marks, 0) / examSubjects.length)
                    : 0}
                </div>
              </Card>
            </div>
          </div>

          {/* Exam Subjects Table */}
          {examSubjects.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No subjects added
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by adding subjects to this exam.
              </p>
              <Button onClick={handleCreate}>
                Add Subject
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Max Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pass Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pass Percentage
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {examSubjects.map((examSubject) => {
                      const subject = subjects.find(s => s.id === examSubject.subject_id);
                      const passPercentage = examSubject.max_marks > 0
                        ? Math.round((examSubject.pass_marks / examSubject.max_marks) * 100)
                        : 0;
                      
                      return (
                        <tr key={examSubject.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {examSubject.subject?.name || subject?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {examSubject.subject?.code || subject?.code || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {examSubject.max_marks}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {examSubject.pass_marks}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {passPercentage}%
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(examSubject)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(examSubject)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showFormModal}
            onClose={handleCancel}
            title={selectedExamSubject ? 'Edit Exam Subject' : 'Add Subject to Exam'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors._general && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{formErrors._general}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.subject_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!!selectedExamSubject}
                >
                  <option value="">Select Subject</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {formErrors.subject_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.subject_id}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.max_marks}
                    onChange={(e) => {
                      const maxMarks = Number(e.target.value);
                      setFormData({
                        ...formData,
                        max_marks: maxMarks,
                        pass_marks: Math.min(formData.pass_marks, maxMarks),
                      });
                    }}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                      formErrors.max_marks ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    min="1"
                    step="1"
                  />
                  {formErrors.max_marks && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.max_marks}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pass Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.pass_marks}
                    onChange={(e) => setFormData({ ...formData, pass_marks: Number(e.target.value) })}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                      formErrors.pass_marks ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    min="0"
                    max={formData.max_marks}
                    step="1"
                  />
                  {formErrors.pass_marks && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.pass_marks}</p>
                  )}
                  {formData.max_marks > 0 && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Pass percentage: {Math.round((formData.pass_marks / formData.max_marks) * 100)}%
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : selectedExamSubject ? 'Update' : 'Add'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Exam Subject"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to remove <strong>{selectedExamSubject?.subject?.name || 'this subject'}</strong> from this exam? This action cannot be undone.
              </p>
              {selectedExamSubject && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Subject:</strong> {selectedExamSubject.subject?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Max Marks:</strong> {selectedExamSubject.max_marks}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Pass Marks:</strong> {selectedExamSubject.pass_marks}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  disabled={deleteMutation.isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default ExamSubjectsManagement;

