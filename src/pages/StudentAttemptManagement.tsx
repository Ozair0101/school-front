import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { StudentAttempt, MonthlyExam, Student } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const StudentAttemptManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<StudentAttempt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [filterExamId, setFilterExamId] = useState<number | null>(null);
  const [filterStudentId, setFilterStudentId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  // Fetch exams for filter
  const { data: exams = [] } = useQuery<MonthlyExam[]>(
    'exams',
    () => apiService.getExams()
  );

  // Fetch students for filter
  const { data: students = [] } = useQuery<Student[]>(
    ['students', filterExamId],
    () => apiService.getStudents(),
    {
      enabled: false, // Only fetch when needed
    }
  );

  // Fetch student attempts
  const { data: attempts = [], isLoading, error } = useQuery<StudentAttempt[]>(
    ['student-attempts', filterExamId, filterStudentId, filterStatus],
    () => apiService.getStudentAttempts({
      monthly_exam_id: filterExamId || undefined,
      student_id: filterStudentId || undefined,
      status: filterStatus ? filterStatus as StudentAttempt['status'] : undefined,
    }),
    {
      staleTime: 30 * 1000,
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<StudentAttempt> }) =>
      apiService.updateStudentAttempt(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['student-attempts', filterExamId, filterStudentId, filterStatus]);
        setShowEditModal(false);
        setSelectedAttempt(null);
      },
      onError: (error: any) => {
        console.error('Failed to update attempt:', error);
        alert(error.response?.data?.message || 'Failed to update attempt');
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteStudentAttempt(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['student-attempts', filterExamId, filterStudentId, filterStatus]);
        setShowDeleteModal(false);
        setSelectedAttempt(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete attempt:', error);
        alert(error.response?.data?.message || 'Failed to delete attempt');
      },
    }
  );

  const handleEdit = (attempt: StudentAttempt) => {
    setSelectedAttempt(attempt);
    setShowEditModal(true);
  };

  const handleDelete = (attempt: StudentAttempt) => {
    setSelectedAttempt(attempt);
    setShowDeleteModal(true);
  };

  const handleViewDetails = async (attempt: StudentAttempt) => {
    try {
      const fullAttempt = await apiService.getStudentAttempt(attempt.id);
      setSelectedAttempt(fullAttempt);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load attempt details:', error);
      alert('Failed to load attempt details');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const data: Partial<StudentAttempt> = {
      status: formData.get('status') as StudentAttempt['status'],
      total_score: formData.get('total_score') ? parseFloat(formData.get('total_score') as string) : undefined,
      percent: formData.get('percent') ? parseFloat(formData.get('percent') as string) : undefined,
      finished_at: formData.get('finished_at') || undefined,
      duration_seconds: formData.get('duration_seconds') ? parseInt(formData.get('duration_seconds') as string) : undefined,
    };

    setIsSubmitting(true);
    updateMutation.mutate(
      { id: selectedAttempt.id, data },
      { onSettled: () => setIsSubmitting(false) }
    );
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: StudentAttempt['status']) => {
    const colors: Record<StudentAttempt['status'], string> = {
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
      submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      grading: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      graded: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      abandoned: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  };

  const getStatusLabel = (status: StudentAttempt['status']) => {
    const labels: Record<StudentAttempt['status'], string> = {
      in_progress: 'In Progress',
      submitted: 'Submitted',
      grading: 'Grading',
      graded: 'Graded',
      abandoned: 'Abandoned',
    };
    return labels[status] || status;
  };

  const stats = {
    total: attempts.length,
    in_progress: attempts.filter(a => a.status === 'in_progress').length,
    submitted: attempts.filter(a => a.status === 'submitted').length,
    grading: attempts.filter(a => a.status === 'grading').length,
    graded: attempts.filter(a => a.status === 'graded').length,
    abandoned: attempts.filter(a => a.status === 'abandoned').length,
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Attempts</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load student attempts'}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Student Attempts</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and manage student exam attempts
            </p>
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
                  Filter by Status
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="in_progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="grading">Grading</option>
                  <option value="graded">Graded</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Student
                </label>
                <input
                  type="number"
                  placeholder="Student ID"
                  value={filterStudentId || ''}
                  onChange={(e) => setFilterStudentId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.in_progress}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Submitted</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.submitted}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Grading</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.grading}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Graded</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.graded}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Abandoned</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.abandoned}</div>
            </Card>
          </div>

          {/* Attempts Table */}
          {attempts.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No attempts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filterExamId || filterStudentId || filterStatus
                  ? 'No attempts match your filters.'
                  : 'No student attempts have been recorded yet.'}
              </p>
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {attempts.map((attempt) => (
                      <tr key={attempt.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {attempt.student?.full_name || `Student #${attempt.student_id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {attempt.student_id}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {attempt.monthly_exam?.grade?.name || 'N/A'} - {attempt.monthly_exam?.section?.name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {attempt.monthly_exam?.month}/{attempt.monthly_exam?.year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(attempt.status)}`}>
                            {getStatusLabel(attempt.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDateTime(attempt.started_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDuration(attempt.duration_seconds)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {attempt.total_score !== null && attempt.total_score !== undefined ? (
                            <div className="text-sm text-gray-900 dark:text-white">
                              {attempt.total_score} / {attempt.monthly_exam?.grade?.name || 'N/A'}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                          {attempt.percent !== null && attempt.percent !== undefined && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              ({attempt.percent}%)
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(attempt)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(attempt)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(attempt)}
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

          {/* Edit Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedAttempt(null);
            }}
            title="Edit Student Attempt"
            size="md"
          >
            {selectedAttempt && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    defaultValue={selectedAttempt.status}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="in_progress">In Progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="grading">Grading</option>
                    <option value="graded">Graded</option>
                    <option value="abandoned">Abandoned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Total Score
                  </label>
                  <input
                    type="number"
                    name="total_score"
                    defaultValue={selectedAttempt.total_score || ''}
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
                    name="percent"
                    defaultValue={selectedAttempt.percent || ''}
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Finished At
                  </label>
                  <input
                    type="datetime-local"
                    name="finished_at"
                    defaultValue={selectedAttempt.finished_at ? new Date(selectedAttempt.finished_at).toISOString().slice(0, 16) : ''}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    name="duration_seconds"
                    defaultValue={selectedAttempt.duration_seconds || ''}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAttempt(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </Modal>

          {/* Detail Modal */}
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAttempt(null);
            }}
            title="Attempt Details"
            size="lg"
          >
            {selectedAttempt && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Student
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedAttempt.student?.full_name || `Student #${selectedAttempt.student_id}`}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Exam
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedAttempt.monthly_exam?.grade?.name} - {selectedAttempt.monthly_exam?.section?.name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedAttempt.status)}`}>
                      {getStatusLabel(selectedAttempt.status)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Attempt Token
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white font-mono text-xs break-all">
                      {selectedAttempt.attempt_token}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Started At
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDateTime(selectedAttempt.started_at)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Finished At
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDateTime(selectedAttempt.finished_at)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDuration(selectedAttempt.duration_seconds)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      IP Address
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedAttempt.ip_address || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Score
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedAttempt.total_score !== null && selectedAttempt.total_score !== undefined
                        ? selectedAttempt.total_score
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Percent
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedAttempt.percent !== null && selectedAttempt.percent !== undefined
                        ? `${selectedAttempt.percent}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                {selectedAttempt.device_info && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Device Info
                    </label>
                    <pre className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-auto">
                      {typeof selectedAttempt.device_info === 'string'
                        ? selectedAttempt.device_info
                        : JSON.stringify(selectedAttempt.device_info, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedAttempt(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Attempt"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this attempt? This action cannot be undone.
              </p>
              {selectedAttempt && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Student:</strong> {selectedAttempt.student?.full_name || `Student #${selectedAttempt.student_id}`}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Status:</strong> {getStatusLabel(selectedAttempt.status)}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Started:</strong> {formatDateTime(selectedAttempt.started_at)}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedAttempt) {
                      deleteMutation.mutate(selectedAttempt.id);
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

export default StudentAttemptManagement;

