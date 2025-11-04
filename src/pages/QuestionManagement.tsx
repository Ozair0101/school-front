import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { BackendQuestion, Choice, QuestionBank, Teacher } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

interface QuestionFormData {
  bank_id: number;
  author_id: number;
  type: 'mcq' | 'tf' | 'numeric' | 'short' | 'essay' | 'file';
  prompt: string;
  default_marks: number;
  metadata?: any;
  choices?: Array<{
    id?: number;
    choice_text: string;
    is_correct: boolean;
    position?: number;
  }>;
}

const QuestionManagement: React.FC = () => {
  const { bankId } = useParams<{ bankId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<BackendQuestion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<QuestionFormData>({
    bank_id: Number(bankId) || 0,
    author_id: 0,
    type: 'mcq',
    prompt: '',
    default_marks: 10,
    choices: [],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch question bank
  const { data: questionBank } = useQuery<QuestionBank>(
    ['question-bank', bankId],
    () => apiService.getQuestionBank(Number(bankId!)),
    { enabled: !!bankId }
  );

  // Fetch teachers
  const { data: teachers = [] } = useQuery<Teacher[]>(
    ['teachers', questionBank?.school_id],
    () => apiService.getTeachers(questionBank?.school_id || undefined)
  );

  // Fetch questions
  const { data: questions = [], isLoading, error } = useQuery<BackendQuestion[]>(
    ['questions', bankId, filterType],
    () => apiService.getQuestions(Number(bankId!), filterType || undefined),
    {
      enabled: !!bankId,
      staleTime: 30 * 1000,
    }
  );

  // Filter questions by search query
  const filteredQuestions = questions.filter((q) =>
    q.prompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: QuestionFormData) => {
      if (selectedQuestion) {
        return apiService.updateQuestion(selectedQuestion.id, data);
      }
      return apiService.createQuestion(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['questions', bankId]);
        setShowFormModal(false);
        setSelectedQuestion(null);
        resetForm();
      },
      onError: (error: any) => {
        const errors = error.response?.data?.errors || {};
        const message = error.response?.data?.message || 'Failed to save question';
        setFormErrors(errors);
        if (!Object.keys(errors).length) {
          alert(message);
        }
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteQuestion(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['questions', bankId]);
        setShowDeleteModal(false);
        setSelectedQuestion(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete question:', error);
        alert(error.response?.data?.message || 'Failed to delete question');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      bank_id: Number(bankId) || 0,
      author_id: 0,
      type: 'mcq',
      prompt: '',
      default_marks: 10,
      choices: [],
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    setSelectedQuestion(null);
    resetForm();
    if (questionBank?.school_id && teachers.length > 0) {
      setFormData(prev => ({
        ...prev,
        author_id: teachers[0].id,
      }));
    }
    setShowFormModal(true);
  };

  const handleEdit = (question: BackendQuestion) => {
    setSelectedQuestion(question);
    setFormData({
      bank_id: question.bank_id,
      author_id: question.author_id,
      type: question.type,
      prompt: question.prompt,
      default_marks: Number(question.default_marks),
      metadata: question.metadata,
      choices: question.choices?.map((c) => ({
        id: c.id,
        choice_text: c.choice_text,
        is_correct: c.is_correct,
        position: c.position,
      })) || [],
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleDelete = (question: BackendQuestion) => {
    setSelectedQuestion(question);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedQuestion) {
      deleteMutation.mutate(selectedQuestion.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const errors: Record<string, string> = {};
    if (!formData.bank_id) errors.bank_id = 'Question bank is required';
    if (!formData.author_id) errors.author_id = 'Author is required';
    if (!formData.prompt.trim()) errors.prompt = 'Prompt is required';
    if (!formData.default_marks || formData.default_marks <= 0) {
      errors.default_marks = 'Default marks must be greater than 0';
    }

    // Validate choices for MCQ and TF
    if (['mcq', 'tf'].includes(formData.type)) {
      if (!formData.choices || formData.choices.length === 0) {
        errors.choices = 'Choices are required for MCQ and True/False questions';
      } else if (formData.type === 'mcq') {
        const hasCorrect = formData.choices.some((c) => c.is_correct);
        if (!hasCorrect) {
          errors.choices = 'At least one correct answer is required for MCQ questions';
        }
      } else if (formData.type === 'tf') {
        const correctCount = formData.choices.filter((c) => c.is_correct).length;
        if (correctCount !== 1) {
          errors.choices = 'Exactly one correct answer is required for True/False questions';
        }
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

  const handleAddChoice = () => {
    setFormData({
      ...formData,
      choices: [
        ...(formData.choices || []),
        { choice_text: '', is_correct: false, position: (formData.choices?.length || 0) + 1 },
      ],
    });
  };

  const handleRemoveChoice = (index: number) => {
    setFormData({
      ...formData,
      choices: formData.choices?.filter((_, i) => i !== index) || [],
    });
  };

  const handleChoiceChange = (index: number, field: string, value: any) => {
    const newChoices = [...(formData.choices || [])];
    newChoices[index] = { ...newChoices[index], [field]: value };
    setFormData({ ...formData, choices: newChoices });
  };

  const handleTypeChange = (newType: QuestionFormData['type']) => {
    setFormData({
      ...formData,
      type: newType,
      choices: newType === 'mcq' || newType === 'tf' ? formData.choices || [] : [],
    });
  };

  // Auto-add choices for TF type
  useEffect(() => {
    if (formData.type === 'tf' && (!formData.choices || formData.choices.length === 0)) {
      setFormData({
        ...formData,
        choices: [
          { choice_text: 'True', is_correct: true, position: 1 },
          { choice_text: 'False', is_correct: false, position: 2 },
        ],
      });
    }
  }, [formData.type]);

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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Questions</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load questions'}
              </p>
              <Button onClick={() => navigate('/admin/question-banks')}>
                Back to Question Banks
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
                <button
                  onClick={() => navigate('/admin/question-banks')}
                  className="text-primary hover:text-primary/80 mb-2 flex items-center gap-2"
                >
                  ← Back to Question Banks
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {questionBank?.name || 'Questions'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage questions in this question bank
                </p>
              </div>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Add Question
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="w-full sm:w-48">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="mcq">MCQ</option>
                  <option value="tf">True/False</option>
                  <option value="numeric">Numeric</option>
                  <option value="short">Short Answer</option>
                  <option value="essay">Essay</option>
                  <option value="file">File Upload</option>
                </select>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {questions.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">MCQ</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {questions.filter((q) => q.type === 'mcq').length}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">True/False</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {questions.filter((q) => q.type === 'tf').length}
              </div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Other Types</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {questions.filter((q) => !['mcq', 'tf'].includes(q.type)).length}
              </div>
            </Card>
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">❓</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No questions found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || filterType
                  ? 'No questions match your filters.'
                  : 'Get started by adding your first question.'}
              </p>
              <Button onClick={handleCreate}>Add Question</Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 text-xs font-semibold rounded bg-primary/10 text-primary uppercase">
                          {question.type}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {question.default_marks} marks
                        </span>
                        {question.author && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            by {question.author.full_name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-900 dark:text-white mb-3">{question.prompt}</p>
                      {question.choices && question.choices.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {question.choices.map((choice, idx) => (
                            <div
                              key={choice.id || idx}
                              className={`text-sm p-2 rounded ${
                                choice.is_correct
                                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800'
                                  : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <span className="font-medium">{String.fromCharCode(65 + idx)}.</span>{' '}
                              {choice.choice_text}
                              {choice.is_correct && (
                                <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(question)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(question)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showFormModal}
            onClose={() => {
              setShowFormModal(false);
              setSelectedQuestion(null);
              resetForm();
            }}
            title={selectedQuestion ? 'Edit Question' : 'Create Question'}
            size="lg"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Question Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as QuestionFormData['type'])}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="mcq">Multiple Choice (MCQ)</option>
                  <option value="tf">True/False</option>
                  <option value="numeric">Numeric</option>
                  <option value="short">Short Answer</option>
                  <option value="essay">Essay</option>
                  <option value="file">File Upload</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prompt <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.prompt ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter the question prompt..."
                />
                {formErrors.prompt && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.prompt}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Default Marks <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.default_marks}
                  onChange={(e) =>
                    setFormData({ ...formData, default_marks: Number(e.target.value) })
                  }
                  min="0"
                  step="0.5"
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.default_marks ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {formErrors.default_marks && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.default_marks}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Author (Teacher) <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.author_id || ''}
                  onChange={(e) => setFormData({ ...formData, author_id: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.author_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.email})
                    </option>
                  ))}
                </select>
                {formErrors.author_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.author_id}</p>
                )}
              </div>

              {/* Choices Section */}
              {['mcq', 'tf'].includes(formData.type) && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Choices <span className="text-red-500">*</span>
                    </label>
                    {formData.type === 'mcq' && (
                      <Button type="button" variant="outline" size="sm" onClick={handleAddChoice}>
                        Add Choice
                      </Button>
                    )}
                  </div>
                  {formErrors.choices && (
                    <p className="mb-2 text-sm text-red-500">{formErrors.choices}</p>
                  )}
                  <div className="space-y-2">
                    {formData.choices?.map((choice, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={choice.choice_text}
                            onChange={(e) =>
                              handleChoiceChange(index, 'choice_text', e.target.value)
                            }
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder={`Choice ${index + 1}`}
                          />
                        </div>
                        <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                          <input
                            type="checkbox"
                            checked={choice.is_correct}
                            onChange={(e) =>
                              handleChoiceChange(index, 'is_correct', e.target.checked)
                            }
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Correct</span>
                        </label>
                        {formData.type === 'mcq' && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveChoice(index)}
                            className="text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {formData.type === 'mcq' && formData.choices && formData.choices.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Add at least 2 choices for MCQ questions
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowFormModal(false);
                    setSelectedQuestion(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : selectedQuestion ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Question"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this question? This action cannot be undone.
              </p>
              {selectedQuestion && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">
                    {selectedQuestion.prompt.substring(0, 100)}
                    {selectedQuestion.prompt.length > 100 ? '...' : ''}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Type: {selectedQuestion.type.toUpperCase()} | Marks: {selectedQuestion.default_marks}
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

export default QuestionManagement;

