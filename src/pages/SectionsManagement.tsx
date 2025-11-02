import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { Section, Grade } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useFormSubmission } from '../hooks/useFormSubmission';

const SectionsManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);

  // Form submission hooks
  const formSubmission = useFormSubmission({
    onSuccess: () => {
      queryClient.invalidateQueries(['sections', selectedGradeId]);
      setShowFormModal(false);
      setSelectedSection(null);
    },
    successMessage: selectedSection ? 'Section updated successfully!' : 'Section created successfully!',
    clearForm: () => {
      const form = document.getElementById('section-form') as HTMLFormElement;
      if (form) form.reset();
    },
  });

  const deleteSubmission = useFormSubmission({
    onSuccess: () => {
      queryClient.invalidateQueries(['sections', selectedGradeId]);
      setShowDeleteModal(false);
      setSelectedSection(null);
    },
    successMessage: 'Section deleted successfully!',
  });

  // Fetch grades for filter and form
  const { data: grades = [] } = useQuery<Grade[]>(
    'grades',
    () => apiService.getGrades()
  );

  // Fetch sections
  const { data: sections = [], isLoading, error } = useQuery<Section[]>(
    ['sections', selectedGradeId],
    () => apiService.getSections(selectedGradeId || undefined),
    {
      staleTime: 30 * 1000,
    }
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    async (data: { grade_id: number; name: string }) => {
      if (selectedSection) {
        return await apiService.updateSection(selectedSection.id, data);
      } else {
        return await apiService.createSection(data);
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    async (id: number) => {
      return await apiService.deleteSection(id);
    }
  );

  const handleCreate = () => {
    setSelectedSection(null);
    setShowFormModal(true);
  };

  const handleEdit = (section: Section) => {
    setSelectedSection(section);
    setShowFormModal(true);
  };

  const handleDelete = (section: Section) => {
    setSelectedSection(section);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedSection) {
      deleteSubmission.handleSubmit(
        () => deleteMutation.mutateAsync(selectedSection.id),
        'Section deleted successfully!',
        'Failed to delete section'
      );
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const gradeId = parseInt(formData.get('grade_id') as string);
    const name = formData.get('name') as string;

    if (!gradeId || !name) {
      formSubmission.showToast('Please fill in all required fields', 'error');
      return;
    }

    await formSubmission.handleSubmit(
      () => saveMutation.mutateAsync({ grade_id: gradeId, name }),
      selectedSection ? 'Section updated successfully!' : 'Section created successfully!',
      selectedSection ? 'Failed to update section' : 'Failed to create section'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading sections...</p>
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
              <p className="text-red-600 dark:text-red-400">Error loading sections. Please try again.</p>
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
                Sections Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage sections for each grade
              </p>
            </div>
            <Button onClick={handleCreate} icon={<span>+</span>}>
              Add Section
            </Button>
          </div>

          {/* Filter */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Grade:
              </label>
              <select
                value={selectedGradeId || ''}
                onChange={(e) => setSelectedGradeId(e.target.value ? parseInt(e.target.value) : null)}
                className="flex-1 max-w-xs px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              >
                <option value="">All Grades</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name} (Level {grade.level})
                  </option>
                ))}
              </select>
              {selectedGradeId && (
                <Button
                  variant="secondary"
                  onClick={() => setSelectedGradeId(null)}
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
                Total Sections
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {sections.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Grades
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(sections.map(s => s.grade_id)).size}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Avg Sections per Grade
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {sections.length > 0 && new Set(sections.map(s => s.grade_id)).size > 0
                  ? (sections.length / new Set(sections.map(s => s.grade_id)).size).toFixed(1)
                  : '0'}
              </div>
            </Card>
          </div>

          {/* Sections List */}
          {sections.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">📋</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Sections Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedGradeId
                  ? 'No sections found for the selected grade. Create a new section to get started.'
                  : 'Get started by creating your first section'}
              </p>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Add Section
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Section Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Grade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {sections.map((section) => (
                      <tr key={section.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {section.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {section.grade?.name || `Grade ID: ${section.grade_id}`}
                          </div>
                          {section.grade && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Level {section.grade.level}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {section.grade?.school?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(section)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Edit section"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(section)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              aria-label="Delete section"
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
          setSelectedSection(null);
        }}
        title={selectedSection ? 'Edit Section' : 'Create Section'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFormModal(false);
                setSelectedSection(null);
              }}
              disabled={formSubmission.isLoading || saveMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.getElementById('section-form') as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={formSubmission.isLoading || saveMutation.isLoading}
              loading={formSubmission.isLoading || saveMutation.isLoading}
            >
              {selectedSection ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form id="section-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="grade_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Grade <span className="text-red-500">*</span>
            </label>
            <select
              id="grade_id"
              name="grade_id"
              required
              defaultValue={selectedSection?.grade_id || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name} (Level {grade.level}) - {grade.school?.name || `School ${grade.school_id}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Section Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={selectedSection?.name || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              placeholder="e.g., Section A, Blue Section"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSection(null);
        }}
        title="Delete Section"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedSection(null);
              }}
              disabled={deleteSubmission.isLoading || deleteMutation.isLoading}
            >
              Cancel
            </Button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteSubmission.isLoading || deleteMutation.isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {(deleteSubmission.isLoading || deleteMutation.isLoading) && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              )}
              Delete
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to delete this section? This action cannot be undone.
          </p>
          {selectedSection && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white mb-1">Section:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedSection.name}
              </p>
              {selectedSection.grade && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Grade: {selectedSection.grade.name} (Level {selectedSection.grade.level})
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Warning: Deleting this section may affect existing enrollments and exams.
          </p>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <Toast
        message={formSubmission.toast.message}
        type={formSubmission.toast.type}
        isVisible={formSubmission.toast.isVisible}
        onClose={formSubmission.hideToast}
      />
      <Toast
        message={deleteSubmission.toast.message}
        type={deleteSubmission.toast.type}
        isVisible={deleteSubmission.toast.isVisible}
        onClose={deleteSubmission.hideToast}
      />
    </div>
  );
};

export default SectionsManagement;

