import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { QuestionBank, School, Teacher } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

interface QuestionBankFormData {
  school_id: number;
  name: string;
  created_by: number;
}

const QuestionBankManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<QuestionBank | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [formData, setFormData] = useState<QuestionBankFormData>({
    school_id: 0,
    name: '',
    created_by: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch schools
  const { data: schools = [] } = useQuery<School[]>(
    'schools',
    () => apiService.getSchools()
  );

  // Fetch teachers
  const { data: teachers = [] } = useQuery<Teacher[]>(
    ['teachers', selectedSchoolId],
    () => apiService.getTeachers(selectedSchoolId || undefined)
  );

  // Fetch question banks
  const { data: questionBanks = [], isLoading, error } = useQuery<QuestionBank[]>(
    ['question-banks', selectedSchoolId],
    () => apiService.getQuestionBanks(selectedSchoolId || undefined),
    {
      staleTime: 30 * 1000,
    }
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: QuestionBankFormData) => {
      if (selectedBank) {
        return apiService.updateQuestionBank(selectedBank.id, data);
      }
      return apiService.createQuestionBank(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['question-banks', selectedSchoolId]);
        setShowFormModal(false);
        setSelectedBank(null);
        resetForm();
      },
      onError: (error: any) => {
        const errors = error.response?.data?.errors || {};
        setFormErrors(errors);
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteQuestionBank(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['question-banks', selectedSchoolId]);
        setShowDeleteModal(false);
        setSelectedBank(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete question bank:', error);
        alert(error.response?.data?.message || 'Failed to delete question bank');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      school_id: selectedSchoolId || 0,
      name: '',
      created_by: 0,
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    setSelectedBank(null);
    resetForm();
    if (selectedSchoolId) {
      setFormData(prev => ({ ...prev, school_id: selectedSchoolId }));
    }
    setShowFormModal(true);
  };

  const handleEdit = (bank: QuestionBank) => {
    setSelectedBank(bank);
    setFormData({
      school_id: bank.school_id,
      name: bank.name,
      created_by: bank.created_by,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleDelete = (bank: QuestionBank) => {
    setSelectedBank(bank);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedBank) {
      deleteMutation.mutate(selectedBank.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.school_id) errors.school_id = 'School is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.created_by) errors.created_by = 'Teacher is required';

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
    setSelectedBank(null);
    resetForm();
  };

  const filteredBanks = selectedSchoolId
    ? questionBanks.filter(b => b.school_id === selectedSchoolId)
    : questionBanks;

  const filteredTeachers = selectedSchoolId
    ? teachers.filter(t => t.school_id === selectedSchoolId)
    : teachers;

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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Question Banks</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load question banks'}
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
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Question Banks</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Organize questions into reusable question banks
                </p>
              </div>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Create Bank
              </Button>
            </div>

            {/* School Filter */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by School
              </label>
              <select
                value={selectedSchoolId || ''}
                onChange={(e) => setSelectedSchoolId(e.target.value ? Number(e.target.value) : null)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question Banks Table */}
          {filteredBanks.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No question banks found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedSchoolId ? 'No question banks found for the selected school.' : 'Get started by creating your first question bank.'}
              </p>
              <Button onClick={handleCreate}>
                Create Bank
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredBanks.map((bank) => (
                      <tr key={bank.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {bank.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {bank.school?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {bank.creator?.full_name || 'N/A'}
                          </div>
                          {bank.creator?.email && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {bank.creator.email}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {bank.questions_count || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/question-banks/${bank.id}/questions`)}
                            >
                              Manage Questions
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(bank)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(bank)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showFormModal}
            onClose={handleCancel}
            title={selectedBank ? 'Edit Question Bank' : 'Create Question Bank'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  School <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.school_id || ''}
                  onChange={(e) => setFormData({ ...formData, school_id: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.school_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!!selectedBank}
                >
                  <option value="">Select School</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
                {formErrors.school_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.school_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., Mathematics Grade 10"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Created By (Teacher) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.created_by || ''}
                  onChange={(e) => setFormData({ ...formData, created_by: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.created_by ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!formData.school_id && filteredTeachers.length === 0}
                >
                  <option value="">Select Teacher</option>
                  {filteredTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.email})
                    </option>
                  ))}
                </select>
                {formErrors.created_by && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.created_by}</p>
                )}
                {!formData.school_id && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Please select a school first
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : selectedBank ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Question Bank"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <strong>{selectedBank?.name}</strong>? This will also delete all questions in this bank. This action cannot be undone.
              </p>
              {selectedBank && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>School:</strong> {selectedBank.school?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Questions:</strong> {selectedBank.questions_count || 0}
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

export default QuestionBankManagement;

