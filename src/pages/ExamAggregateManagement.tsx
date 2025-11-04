import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { ExamAggregate, MonthlyExam, Student } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const ExamAggregateManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAggregate, setSelectedAggregate] = useState<ExamAggregate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [filterExamId, setFilterExamId] = useState<number | null>(null);
  const [filterStudentId, setFilterStudentId] = useState<number | null>(null);
  const [filterPublished, setFilterPublished] = useState<string>('');

  // Fetch exams for filter
  const { data: exams = [] } = useQuery<MonthlyExam[]>(
    'exams',
    () => apiService.getExams()
  );

  // Fetch exam aggregates
  const { data: aggregates = [], isLoading, error } = useQuery<ExamAggregate[]>(
    ['exam-aggregates', filterExamId, filterStudentId, filterPublished],
    () => apiService.getExamAggregates({
      monthly_exam_id: filterExamId || undefined,
      student_id: filterStudentId || undefined,
      published: filterPublished !== '' ? filterPublished === 'true' : undefined,
    }),
    {
      staleTime: 30 * 1000,
    }
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: Partial<ExamAggregate>) => {
      if (selectedAggregate) {
        return apiService.updateExamAggregate(selectedAggregate.id, data);
      }
      return apiService.createExamAggregate(data as any);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-aggregates', filterExamId, filterStudentId, filterPublished]);
        setShowFormModal(false);
        setSelectedAggregate(null);
        resetForm();
      },
      onError: (error: any) => {
        const errors = error.response?.data?.errors || {};
        const message = error.response?.data?.message || 'Failed to save aggregate';
        if (Object.keys(errors).length > 0) {
          alert(JSON.stringify(errors));
        } else {
          alert(message);
        }
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteExamAggregate(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-aggregates', filterExamId, filterStudentId, filterPublished]);
        setShowDeleteModal(false);
        setSelectedAggregate(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete aggregate:', error);
        alert(error.response?.data?.message || 'Failed to delete aggregate');
      },
    }
  );

  const [formData, setFormData] = useState<Partial<ExamAggregate>>({
    monthly_exam_id: 0,
    student_id: 0,
    total_marks: undefined,
    percent: undefined,
    rank: undefined,
    published: false,
  });

  const resetForm = () => {
    setFormData({
      monthly_exam_id: filterExamId || 0,
      student_id: 0,
      total_marks: undefined,
      percent: undefined,
      rank: undefined,
      published: false,
    });
  };

  const handleCreate = () => {
    setSelectedAggregate(null);
    resetForm();
    setShowFormModal(true);
  };

  const handleEdit = (aggregate: ExamAggregate) => {
    setSelectedAggregate(aggregate);
    setFormData({
      monthly_exam_id: aggregate.monthly_exam_id,
      student_id: aggregate.student_id,
      total_marks: aggregate.total_marks,
      percent: aggregate.percent,
      rank: aggregate.rank,
      published: aggregate.published,
    });
    setShowFormModal(true);
  };

  const handleDelete = (aggregate: ExamAggregate) => {
    setSelectedAggregate(aggregate);
    setShowDeleteModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.monthly_exam_id) errors.monthly_exam_id = 'Exam is required';
    if (!formData.student_id) errors.student_id = 'Student is required';
    if (formData.percent !== undefined && (formData.percent < 0 || formData.percent > 100)) {
      errors.percent = 'Percent must be between 0 and 100';
    }
    if (formData.rank !== undefined && formData.rank < 1) {
      errors.rank = 'Rank must be at least 1';
    }

    if (Object.keys(errors).length > 0) {
      alert('Validation errors: ' + JSON.stringify(errors));
      return;
    }

    setIsSubmitting(true);
    saveMutation.mutate(formData, {
      onSettled: () => setIsSubmitting(false),
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const stats = {
    total: aggregates.length,
    published: aggregates.filter(a => a.published).length,
    unpublished: aggregates.filter(a => !a.published).length,
    withRank: aggregates.filter(a => a.rank !== null && a.rank !== undefined).length,
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Aggregates</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load exam aggregates'}
              </p>
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Exam Aggregates</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage exam results and rankings
                </p>
              </div>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Create Aggregate
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Exam
                </label>
                <select
                  value={filterExamId || ''}
                  onChange={(e) => setFilterExamId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Exams</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.grade?.name} - {exam.section?.name} ({exam.month}/{exam.year})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Student ID
                </label>
                <input
                  type="number"
                  placeholder="Student ID"
                  value={filterStudentId || ''}
                  onChange={(e) => setFilterStudentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Published Status
                </label>
                <select
                  value={filterPublished}
                  onChange={(e) => setFilterPublished(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Published</option>
                  <option value="false">Unpublished</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Published</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.published}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unpublished</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.unpublished}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">With Rank</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.withRank}</div>
            </Card>
          </div>

          {/* Aggregates Table */}
          {aggregates.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No aggregates found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {filterExamId || filterStudentId || filterPublished
                  ? 'No aggregates match your filters.'
                  : 'No exam aggregates have been created yet.'}
              </p>
              <Button onClick={handleCreate}>
                Create Aggregate
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Exam
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Percent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Published
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {aggregates.map((aggregate) => (
                      <tr key={aggregate.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {aggregate.student?.full_name || `Student #${aggregate.student_id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {aggregate.student_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {aggregate.monthly_exam?.grade?.name || 'N/A'} - {aggregate.monthly_exam?.section?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {aggregate.monthly_exam?.month}/{aggregate.monthly_exam?.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {aggregate.total_marks !== null && aggregate.total_marks !== undefined
                              ? aggregate.total_marks
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {aggregate.percent !== null && aggregate.percent !== undefined ? (
                            <div className="text-sm text-gray-900 dark:text-white">
                              {aggregate.percent}%
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {aggregate.rank !== null && aggregate.rank !== undefined ? (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              #{aggregate.rank}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            aggregate.published
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200'
                          }`}>
                            {aggregate.published ? 'Published' : 'Unpublished'}
                          </span>
                          {aggregate.published_at && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDateTime(aggregate.published_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(aggregate)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(aggregate)}
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
            onClose={() => {
              setShowFormModal(false);
              setSelectedAggregate(null);
              resetForm();
            }}
            title={selectedAggregate ? 'Edit Exam Aggregate' : 'Create Exam Aggregate'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Exam <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.monthly_exam_id || ''}
                  onChange={(e) => setFormData({ ...formData, monthly_exam_id: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={!!selectedAggregate}
                  required
                >
                  <option value="">Select Exam</option>
                  {exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.grade?.name} - {exam.section?.name} ({exam.month}/{exam.year})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Student ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.student_id || ''}
                  onChange={(e) => setFormData({ ...formData, student_id: Number(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={!!selectedAggregate}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Total Marks
                </label>
                <input
                  type="number"
                  value={formData.total_marks || ''}
                  onChange={(e) => setFormData({ ...formData, total_marks: e.target.value ? parseFloat(e.target.value) : undefined })}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Percent (%)
                </label>
                <input
                  type="number"
                  value={formData.percent || ''}
                  onChange={(e) => setFormData({ ...formData, percent: e.target.value ? parseFloat(e.target.value) : undefined })}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rank
                </label>
                <input
                  type="number"
                  value={formData.rank || ''}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value ? parseInt(e.target.value) : undefined })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.published || false}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Published
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowFormModal(false);
                    setSelectedAggregate(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : selectedAggregate ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Aggregate"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this exam aggregate? This action cannot be undone.
              </p>
              {selectedAggregate && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Student:</strong> {selectedAggregate.student?.full_name || `Student #${selectedAggregate.student_id}`}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Exam:</strong> {selectedAggregate.monthly_exam?.grade?.name} - {selectedAggregate.monthly_exam?.section?.name}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Marks:</strong> {selectedAggregate.total_marks !== null && selectedAggregate.total_marks !== undefined ? selectedAggregate.total_marks : 'N/A'}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Rank:</strong> {selectedAggregate.rank !== null && selectedAggregate.rank !== undefined ? `#${selectedAggregate.rank}` : 'N/A'}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedAggregate) {
                      deleteMutation.mutate(selectedAggregate.id);
                    }
                  }}
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

export default ExamAggregateManagement;

