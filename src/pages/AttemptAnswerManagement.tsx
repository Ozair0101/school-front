import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { AttemptAnswer, StudentAttempt, BackendQuestion } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const AttemptAnswerManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<AttemptAnswer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [filterAttemptId, setFilterAttemptId] = useState<number | null>(null);
  const [filterQuestionId, setFilterQuestionId] = useState<number | null>(null);
  const [filterGraded, setFilterGraded] = useState<string>('');
  const [filterAutoGraded, setFilterAutoGraded] = useState<string>('');

  // Fetch student attempts for filter
  const { data: attempts = [] } = useQuery<StudentAttempt[]>(
    'student-attempts',
    () => apiService.getStudentAttempts(),
    {
      enabled: false, // Only fetch when needed
    }
  );

  // Fetch attempt answers
  const { data: answers = [], isLoading, error } = useQuery<AttemptAnswer[]>(
    ['attempt-answers', filterAttemptId, filterQuestionId, filterGraded, filterAutoGraded],
    () => apiService.getAttemptAnswers({
      attempt_id: filterAttemptId || undefined,
      question_id: filterQuestionId || undefined,
      graded: filterGraded !== '' ? filterGraded === 'true' : undefined,
      auto_graded: filterAutoGraded !== '' ? filterAutoGraded === 'true' : undefined,
    }),
    {
      staleTime: 30 * 1000,
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<AttemptAnswer> }) =>
      apiService.updateAttemptAnswer(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['attempt-answers', filterAttemptId, filterQuestionId, filterGraded, filterAutoGraded]);
        setShowEditModal(false);
        setShowGradingModal(false);
        setSelectedAnswer(null);
      },
      onError: (error: any) => {
        console.error('Failed to update answer:', error);
        alert(error.response?.data?.message || 'Failed to update answer');
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteAttemptAnswer(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['attempt-answers', filterAttemptId, filterQuestionId, filterGraded, filterAutoGraded]);
        setShowDeleteModal(false);
        setSelectedAnswer(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete answer:', error);
        alert(error.response?.data?.message || 'Failed to delete answer');
      },
    }
  );

  const handleEdit = (answer: AttemptAnswer) => {
    setSelectedAnswer(answer);
    setShowEditModal(true);
  };

  const handleGrade = (answer: AttemptAnswer) => {
    setSelectedAnswer(answer);
    setShowGradingModal(true);
  };

  const handleDelete = (answer: AttemptAnswer) => {
    setSelectedAnswer(answer);
    setShowDeleteModal(true);
  };

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnswer) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const data: Partial<AttemptAnswer> = {
      choice_id: formData.get('choice_id') ? parseInt(formData.get('choice_id') as string) : null,
      answer_text: formData.get('answer_text') || null,
      uploaded_file: formData.get('uploaded_file') || null,
    };

    setIsSubmitting(true);
    updateMutation.mutate(
      { id: selectedAnswer.id, data },
      { onSettled: () => setIsSubmitting(false) }
    );
  };

  const handleSubmitGrading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnswer) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const data: Partial<AttemptAnswer> = {
      marks_awarded: formData.get('marks_awarded') ? parseFloat(formData.get('marks_awarded') as string) : null,
      auto_graded: formData.get('auto_graded') === 'true',
      graded_by: formData.get('graded_by') ? parseInt(formData.get('graded_by') as string) : null,
    };

    setIsSubmitting(true);
    updateMutation.mutate(
      { id: selectedAnswer.id, data },
      { onSettled: () => setIsSubmitting(false) }
    );
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const stats = {
    total: answers.length,
    graded: answers.filter(a => a.marks_awarded !== null && a.marks_awarded !== undefined).length,
    ungraded: answers.filter(a => a.marks_awarded === null || a.marks_awarded === undefined).length,
    autoGraded: answers.filter(a => a.auto_graded).length,
    manualGraded: answers.filter(a => !a.auto_graded && a.marks_awarded !== null && a.marks_awarded !== undefined).length,
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Answers</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load attempt answers'}
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Attempt Answers</h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and grade student answers per question
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Attempt ID
                </label>
                <input
                  type="number"
                  placeholder="Attempt ID"
                  value={filterAttemptId || ''}
                  onChange={(e) => setFilterAttemptId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Question ID
                </label>
                <input
                  type="number"
                  placeholder="Question ID"
                  value={filterQuestionId || ''}
                  onChange={(e) => setFilterQuestionId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Graded Status
                </label>
                <select
                  value={filterGraded}
                  onChange={(e) => setFilterGraded(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Graded</option>
                  <option value="false">Ungraded</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Auto Graded
                </label>
                <select
                  value={filterAutoGraded}
                  onChange={(e) => setFilterAutoGraded(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Auto Graded</option>
                  <option value="false">Manual Graded</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Graded</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.graded}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Ungraded</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.ungraded}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Auto Graded</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.autoGraded}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Manual Graded</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.manualGraded}</div>
            </Card>
          </div>

          {/* Answers Table */}
          {answers.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No answers found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filterAttemptId || filterQuestionId || filterGraded || filterAutoGraded
                  ? 'No answers match your filters.'
                  : 'No attempt answers have been recorded yet.'}
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Attempt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Answer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Grading
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Saved At
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {answers.map((answer) => (
                      <tr key={answer.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Attempt #{answer.attempt_id}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {answer.attempt?.student?.full_name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={answer.question?.prompt}>
                            {truncateText(answer.question?.prompt || 'Question not found', 50)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Type: {answer.question?.type?.toUpperCase() || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs">
                            {answer.choice_id ? (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                Choice #{answer.choice_id}
                              </span>
                            ) : answer.answer_text ? (
                              <span title={answer.answer_text}>{truncateText(answer.answer_text, 50)}</span>
                            ) : answer.uploaded_file ? (
                              <span className="inline-flex items-center px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
                                📎 File
                              </span>
                            ) : (
                              <span className="text-gray-400">No answer</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {answer.marks_awarded !== null && answer.marks_awarded !== undefined ? (
                            <div className="text-sm text-gray-900 dark:text-white">
                              {answer.marks_awarded} / {answer.question?.default_marks || 'N/A'}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            {answer.auto_graded ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                Auto
                              </span>
                            ) : answer.marks_awarded !== null && answer.marks_awarded !== undefined ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                                Manual
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                Ungraded
                              </span>
                            )}
                            {answer.graded_by_teacher && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                by {answer.graded_by_teacher.full_name || `Teacher #${answer.graded_by}`}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDateTime(answer.saved_at)}
                          </div>
                          {answer.graded_at && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Graded: {formatDateTime(answer.graded_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            {answer.marks_awarded === null || answer.marks_awarded === undefined ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGrade(answer)}
                              >
                                Grade
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGrade(answer)}
                              >
                                Re-grade
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(answer)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(answer)}
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
              setSelectedAnswer(null);
            }}
            title="Edit Answer"
            size="md"
          >
            {selectedAnswer && (
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Question
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white">
                    {selectedAnswer.question?.prompt || 'Question not found'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Answer Text
                  </label>
                  <textarea
                    name="answer_text"
                    defaultValue={selectedAnswer.answer_text || ''}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter answer text..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Choice ID (for MCQ/True False)
                  </label>
                  <input
                    type="number"
                    name="choice_id"
                    defaultValue={selectedAnswer.choice_id || ''}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Leave empty if not applicable"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Uploaded File Path
                  </label>
                  <input
                    type="text"
                    name="uploaded_file"
                    defaultValue={selectedAnswer.uploaded_file || ''}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="File path..."
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedAnswer(null);
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

          {/* Grading Modal */}
          <Modal
            isOpen={showGradingModal}
            onClose={() => {
              setShowGradingModal(false);
              setSelectedAnswer(null);
            }}
            title="Grade Answer"
            size="md"
          >
            {selectedAnswer && (
              <form onSubmit={handleSubmitGrading} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Question
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white">
                    {selectedAnswer.question?.prompt || 'Question not found'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Default Marks: {selectedAnswer.question?.default_marks || 'N/A'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Student Answer
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white">
                    {selectedAnswer.choice_id ? (
                      <span>Choice #{selectedAnswer.choice_id}</span>
                    ) : selectedAnswer.answer_text ? (
                      selectedAnswer.answer_text
                    ) : selectedAnswer.uploaded_file ? (
                      <span>File: {selectedAnswer.uploaded_file}</span>
                    ) : (
                      <span className="text-gray-400">No answer provided</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Marks Awarded
                  </label>
                  <input
                    type="number"
                    name="marks_awarded"
                    defaultValue={selectedAnswer.marks_awarded || ''}
                    step="0.01"
                    min="0"
                    max={selectedAnswer.question?.default_marks || 100}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder={`Max: ${selectedAnswer.question?.default_marks || 'N/A'}`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Grading Type
                  </label>
                  <select
                    name="auto_graded"
                    defaultValue={selectedAnswer.auto_graded ? 'true' : 'false'}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="false">Manual Grading</option>
                    <option value="true">Auto Grading</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Graded By (Teacher ID)
                  </label>
                  <input
                    type="number"
                    name="graded_by"
                    defaultValue={selectedAnswer.graded_by || ''}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Leave empty for system"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowGradingModal(false);
                      setSelectedAnswer(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Grade'}
                  </Button>
                </div>
              </form>
            )}
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Answer"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this answer? This action cannot be undone.
              </p>
              {selectedAnswer && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Attempt:</strong> #{selectedAnswer.attempt_id}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Question:</strong> {truncateText(selectedAnswer.question?.prompt || 'N/A', 50)}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Marks:</strong> {selectedAnswer.marks_awarded !== null && selectedAnswer.marks_awarded !== undefined ? selectedAnswer.marks_awarded : 'Not graded'}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedAnswer) {
                      deleteMutation.mutate(selectedAnswer.id);
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

export default AttemptAnswerManagement;

