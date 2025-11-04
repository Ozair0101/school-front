import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { MonthlyExam, ExamQuestion, BackendQuestion, QuestionBank } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const ExamQuestions: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<ExamQuestion | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch exam details
  const { data: exam } = useQuery<MonthlyExam>(
    ['exam', examId],
    () => apiService.getExam(examId!),
    { enabled: !!examId }
  );

  // Fetch exam questions
  const { data: examQuestions = [], isLoading: isLoadingQuestions } = useQuery<ExamQuestion[]>(
    ['exam-questions', examId],
    () => apiService.getExamQuestions(examId!),
    { enabled: !!examId }
  );

  // Fetch question banks
  const { data: questionBanks = [] } = useQuery<QuestionBank[]>(
    'question-banks',
    () => apiService.getQuestionBanks()
  );

  // Fetch available questions
  const { data: availableQuestions = [] } = useQuery<BackendQuestion[]>(
    ['questions', selectedBankId, filterType],
    () => apiService.getQuestions(selectedBankId || undefined),
    {
      enabled: showAddModal,
    }
  );

  // Add question mutation
  const addQuestionMutation = useMutation(
    (data: { question_id: number; marks?: number; sequence?: number; pool_tag?: string }) =>
      apiService.addExamQuestion(examId!, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-questions', examId]);
        setShowAddModal(false);
        setSelectedQuestions([]);
      },
    }
  );

  // Batch add questions mutation
  const batchAddMutation = useMutation(
    (questions: Array<{ question_id: number; marks?: number; sequence?: number; pool_tag?: string }>) =>
      apiService.addExamQuestions(examId!, questions),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-questions', examId]);
        setShowAddModal(false);
        setSelectedQuestions([]);
      },
    }
  );

  // Update question mutation
  const updateQuestionMutation = useMutation(
    ({ id, data }: { id: number; data: { marks?: number; sequence?: number; pool_tag?: string } }) =>
      apiService.updateExamQuestion(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-questions', examId]);
        setShowEditModal(false);
        setSelectedQuestion(null);
      },
    }
  );

  // Delete question mutation
  const deleteQuestionMutation = useMutation(
    (id: number) => apiService.deleteExamQuestion(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['exam-questions', examId]);
        setShowDeleteModal(false);
        setSelectedQuestion(null);
      },
    }
  );

  const handleAddQuestions = () => {
    setShowAddModal(true);
    setSelectedBankId(null);
    setSearchTerm('');
    setFilterType('all');
  };

  const handleEdit = (examQuestion: ExamQuestion) => {
    setSelectedQuestion(examQuestion);
    setShowEditModal(true);
  };

  const handleDelete = (examQuestion: ExamQuestion) => {
    setSelectedQuestion(examQuestion);
    setShowDeleteModal(true);
  };

  const handleConfirmAdd = () => {
    if (selectedQuestions.length === 0) {
      alert('Please select at least one question');
      return;
    }

    const questionsToAdd = selectedQuestions.map((questionId, index) => {
      const question = availableQuestions.find(q => q.id === questionId);
      return {
        question_id: questionId,
        marks: question?.default_marks,
        sequence: examQuestions.length + index + 1,
      };
    });

    if (questionsToAdd.length === 1) {
      addQuestionMutation.mutate(questionsToAdd[0]);
    } else {
      batchAddMutation.mutate(questionsToAdd);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedQuestion) {
      deleteQuestionMutation.mutate(selectedQuestion.id);
    }
  };

  const toggleQuestionSelection = (questionId: number) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const handleReorder = async (direction: 'up' | 'down', examQuestion: ExamQuestion) => {
    const currentIndex = examQuestions.findIndex(eq => eq.id === examQuestion.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= examQuestions.length) return;

    const newSequence = examQuestions[newIndex].sequence || newIndex + 1;
    const otherSequence = examQuestion.sequence || currentIndex + 1;

    // Swap sequences
    await Promise.all([
      apiService.updateExamQuestion(examQuestion.id, { sequence: newSequence }),
      apiService.updateExamQuestion(examQuestions[newIndex].id, { sequence: otherSequence }),
    ]);

    queryClient.invalidateQueries(['exam-questions', examId]);
  };

  const filteredAvailableQuestions = availableQuestions.filter(q => {
    const matchesSearch = !searchTerm || 
      q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.bank?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || q.type === filterType;
    return matchesSearch && matchesType;
  });

  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  };

  const getQuestionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      mcq: 'Multiple Choice',
      tf: 'True/False',
      numeric: 'Numeric',
      short: 'Short Answer',
      essay: 'Essay',
      file: 'File Upload',
    };
    return labels[type] || type;
  };

  if (!exam) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading exam...</p>
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
              <button
                onClick={() => navigate('/admin/exams')}
                className="text-primary hover:text-primary/80 mb-2 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Exams
              </button>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Exam Questions: {getMonthName(exam.month)} {exam.year}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {exam.grade?.name} - {exam.section?.name}
              </p>
            </div>
            <Button onClick={handleAddQuestions} icon={<span>+</span>}>
              Add Questions
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Questions
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {examQuestions.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Marks
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white break-words">
                {(examQuestions?.reduce((sum, eq) => {
                  const marks = Number(eq.marks || eq.question?.default_marks || 0);
                  return sum + (isNaN(marks) ? 0 : marks);
                }, 0) || 0).toFixed(2)}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Question Types
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(examQuestions.map(eq => eq.question?.type)).size}
              </div>
            </Card>
          </div>

          {/* Questions List */}
          {isLoadingQuestions ? (
            <Card className="text-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading questions...</p>
            </Card>
          ) : examQuestions.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">❓</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Questions Added
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by adding questions to this exam
              </p>
              <Button onClick={handleAddQuestions} icon={<span>+</span>}>
                Add Questions
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                  <colgroup>
                    <col className="w-16" />
                    <col className="w-auto" />
                    <col className="w-32" />
                    <col className="w-20" />
                    <col className="w-32" />
                    <col className="w-32" />
                  </colgroup>
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Seq
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Marks
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pool Tag
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {examQuestions.map((examQuestion, index) => (
                      <tr key={examQuestion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            <span className="inline-block max-w-full truncate" title={examQuestion.sequence ? examQuestion.sequence.toString() : `${index + 1}`}>
                              {examQuestion.sequence ? (
                                typeof examQuestion.sequence === 'number' 
                                  ? examQuestion.sequence.toString().replace(/\.?0+$/, '') // Remove trailing zeros
                                  : String(examQuestion.sequence).substring(0, 8) // Truncate long sequences
                              ) : (
                                index + 1
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 dark:text-white truncate pr-2" title={examQuestion.question?.prompt || 'Question not found'}>
                            {examQuestion.question?.prompt || 'Question not found'}
                          </div>
                          {examQuestion.question?.bank && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              Bank: {examQuestion.question.bank.name}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 truncate max-w-full">
                            {getQuestionTypeLabel(examQuestion.question?.type || 'unknown')}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {examQuestion.marks || examQuestion.question?.default_marks || 0}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate" title={examQuestion.pool_tag || undefined}>
                            {examQuestion.pool_tag || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleReorder('up', examQuestion)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move up"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleReorder('down', examQuestion)}
                              disabled={index === examQuestions.length - 1}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Move down"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(examQuestion)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Edit question"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(examQuestion)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              aria-label="Delete question"
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

      {/* Add Questions Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedQuestions([]);
          setSelectedBankId(null);
          setSearchTerm('');
          setFilterType('all');
        }}
        title="Add Questions to Exam"
        size="xl"
        footer={
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedQuestions.length} question{selectedQuestions.length !== 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedQuestions([]);
                }}
                disabled={addQuestionMutation.isLoading || batchAddMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmAdd}
                disabled={selectedQuestions.length === 0 || addQuestionMutation.isLoading || batchAddMutation.isLoading}
                loading={addQuestionMutation.isLoading || batchAddMutation.isLoading}
              >
                Add Selected Questions
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Question Bank
              </label>
              <select
                value={selectedBankId || ''}
                onChange={(e) => setSelectedBankId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Question Banks</option>
                {questionBanks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter by Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="mcq">Multiple Choice</option>
                <option value="tf">True/False</option>
                <option value="numeric">Numeric</option>
                <option value="short">Short Answer</option>
                <option value="essay">Essay</option>
                <option value="file">File Upload</option>
              </select>
            </div>
          </div>

          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
            />
          </div>

          {/* Questions List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredAvailableQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No questions found
              </div>
            ) : (
              filteredAvailableQuestions.map((question) => {
                const isSelected = selectedQuestions.includes(question.id);
                const isAlreadyAdded = examQuestions.some(eq => eq.question_id === question.id);
                
                return (
                  <div
                    key={question.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${isAlreadyAdded ? 'opacity-50' : ''}`}
                    onClick={() => !isAlreadyAdded && toggleQuestionSelection(question.id)}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleQuestionSelection(question.id)}
                        disabled={isAlreadyAdded}
                        className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                            {getQuestionTypeLabel(question.type)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {question.default_marks} marks
                          </span>
                          {isAlreadyAdded && (
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              (Already added)
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-900 dark:text-white">
                          {question.prompt.substring(0, 200)}
                          {question.prompt.length > 200 ? '...' : ''}
                        </p>
                        {question.bank && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Bank: {question.bank.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Question Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedQuestion(null);
        }}
        title="Edit Exam Question"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowEditModal(false);
                setSelectedQuestion(null);
              }}
              disabled={updateQuestionMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedQuestion) return;
                const marksInput = document.getElementById('edit-marks') as HTMLInputElement;
                const sequenceInput = document.getElementById('edit-sequence') as HTMLInputElement;
                const poolTagInput = document.getElementById('edit-pool-tag') as HTMLInputElement;
                
                updateQuestionMutation.mutate({
                  id: selectedQuestion.id,
                  data: {
                    marks: marksInput.value ? parseFloat(marksInput.value) : undefined,
                    sequence: sequenceInput.value ? parseInt(sequenceInput.value) : undefined,
                    pool_tag: poolTagInput.value || undefined,
                  },
                });
              }}
              disabled={updateQuestionMutation.isLoading}
              loading={updateQuestionMutation.isLoading}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        {selectedQuestion && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Question
              </label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm text-gray-900 dark:text-white">
                {selectedQuestion.question?.prompt || 'Question not found'}
              </div>
            </div>
            <div>
              <label htmlFor="edit-marks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Marks
              </label>
              <input
                id="edit-marks"
                type="number"
                defaultValue={selectedQuestion.marks || selectedQuestion.question?.default_marks || 0}
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="edit-sequence" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sequence
              </label>
              <input
                id="edit-sequence"
                type="number"
                defaultValue={selectedQuestion.sequence || ''}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="edit-pool-tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pool Tag (optional)
              </label>
              <input
                id="edit-pool-tag"
                type="text"
                defaultValue={selectedQuestion.pool_tag || ''}
                maxLength={255}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                placeholder="e.g., easy, medium, hard"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedQuestion(null);
        }}
        title="Remove Question from Exam"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedQuestion(null);
              }}
              disabled={deleteQuestionMutation.isLoading}
            >
              Cancel
            </Button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteQuestionMutation.isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {deleteQuestionMutation.isLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              Remove
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to remove this question from the exam?
          </p>
          {selectedQuestion?.question && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white mb-1">
                Question:
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedQuestion.question.prompt.substring(0, 200)}
                {selectedQuestion.question.prompt.length > 200 ? '...' : ''}
              </p>
            </div>
          )}
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ This will not delete the question from the question bank, only remove it from this exam.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ExamQuestions;

