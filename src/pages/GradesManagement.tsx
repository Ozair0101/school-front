import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { Grade, School } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const GradesManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);

  // Fetch schools for filter and form
  const { data: schools = [] } = useQuery<School[]>('schools', () => apiService.getSchools());

  // Fetch grades
  const { data: grades = [], isLoading, error } = useQuery<Grade[]>(
    ['grades', selectedSchoolId],
    () => apiService.getGrades(selectedSchoolId || undefined),
    {
      staleTime: 30 * 1000,
    }
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: { school_id: number; name: string; level: number }) => {
      if (selectedGrade) {
        return apiService.updateGrade(selectedGrade.id, data);
      } else {
        return apiService.createGrade(data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['grades', selectedSchoolId]);
        setShowFormModal(false);
        setSelectedGrade(null);
      },
      onError: (error: any) => {
        console.error('Failed to save grade:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors || 
                            'Failed to save grade';
        alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteGrade(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['grades', selectedSchoolId]);
        setShowDeleteModal(false);
        setSelectedGrade(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete grade:', error);
        alert(error.response?.data?.message || 'Failed to delete grade');
      },
    }
  );

  const handleCreate = () => {
    setSelectedGrade(null);
    setShowFormModal(true);
  };

  const handleEdit = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowFormModal(true);
  };

  const handleDelete = (grade: Grade) => {
    setSelectedGrade(grade);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedGrade) {
      deleteMutation.mutate(selectedGrade.id);
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolId = parseInt(formData.get('school_id') as string);
    const name = formData.get('name') as string;
    const level = parseInt(formData.get('level') as string);

    if (!schoolId || !name || !level) {
      alert('Please fill in all required fields');
      return;
    }

    saveMutation.mutate({ school_id: schoolId, name, level });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading grades...</p>
            </Card>
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
              <p className="text-red-600 dark:text-red-400">Error loading grades. Please try again.</p>
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
                Grades Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage grades and academic levels
              </p>
            </div>
            <Button onClick={handleCreate} icon={<span>+</span>}>
              Add Grade
            </Button>
          </div>

          {/* Filter */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by School:
              </label>
              <select
                value={selectedSchoolId || ''}
                onChange={(e) => setSelectedSchoolId(e.target.value ? parseInt(e.target.value) : null)}
                className="flex-1 max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              {selectedSchoolId && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedSchoolId(null)}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Grades
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {grades.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Schools
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(grades.map(g => g.school_id)).size}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Average Level
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {grades.length > 0
                  ? (grades.reduce((sum, g) => sum + g.level, 0) / grades.length).toFixed(1)
                  : '0'}
              </div>
            </Card>
          </div>

          {/* Grades List */}
          {grades.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">📚</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Grades Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedSchoolId
                  ? 'No grades found for the selected school. Create a new grade to get started.'
                  : 'Get started by creating your first grade'}
              </p>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Add Grade
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
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sections
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {grades.map((grade) => (
                      <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {grade.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {grade.school?.name || `School ID: ${grade.school_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {grade.level}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {grade.sections?.length || 0} section{grade.sections?.length !== 1 ? 's' : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(grade)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Edit grade"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(grade)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              aria-label="Delete grade"
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
        onClose={() => {
          setShowFormModal(false);
          setSelectedGrade(null);
        }}
        title={selectedGrade ? 'Edit Grade' : 'Create Grade'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFormModal(false);
                setSelectedGrade(null);
              }}
              disabled={saveMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                const form = document.getElementById('grade-form') as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={saveMutation.isLoading}
              loading={saveMutation.isLoading}
            >
              {selectedGrade ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form id="grade-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="school_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              School <span className="text-red-500">*</span>
            </label>
            <select
              id="school_id"
              name="school_id"
              required
              defaultValue={selectedGrade?.school_id || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grade Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={selectedGrade?.name || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              placeholder="e.g., Grade 1, Class 5"
            />
          </div>
          <div>
            <label htmlFor="level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level <span className="text-red-500">*</span>
            </label>
            <input
              id="level"
              name="level"
              type="number"
              required
              min="1"
              defaultValue={selectedGrade?.level || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              placeholder="e.g., 1, 2, 3"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Numeric level for ordering grades (1 = first grade, 2 = second grade, etc.)
            </p>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGrade(null);
        }}
        title="Delete Grade"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedGrade(null);
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
            Are you sure you want to delete this grade? This action cannot be undone.
          </p>
          {selectedGrade && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white mb-1">Grade:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedGrade.name} (Level {selectedGrade.level})
              </p>
              {selectedGrade.school && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  School: {selectedGrade.school.name}
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Warning: Deleting this grade will also delete all associated sections and may affect existing enrollments and exams.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default GradesManagement;

