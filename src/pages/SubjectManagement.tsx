import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { Subject, School } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

interface SubjectFormData {
  school_id: number;
  name: string;
  code: string;
  default_max_marks: number;
  pass_marks: number;
}

const SubjectManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SubjectFormData>({
    school_id: 0,
    name: '',
    code: '',
    default_max_marks: 100,
    pass_marks: 50,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch schools
  const { data: schools = [] } = useQuery<School[]>(
    'schools',
    () => apiService.getSchools()
  );

  // Fetch subjects
  const { data: subjects = [], isLoading, error } = useQuery<Subject[]>(
    ['subjects', selectedSchoolId],
    () => apiService.getSubjects(selectedSchoolId || undefined),
    {
      staleTime: 30 * 1000,
    }
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: SubjectFormData) => {
      if (selectedSubject) {
        return apiService.updateSubject(selectedSubject.id, data);
      }
      return apiService.createSubject(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subjects', selectedSchoolId]);
        setShowFormModal(false);
        setSelectedSubject(null);
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
    (id: number) => apiService.deleteSubject(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['subjects', selectedSchoolId]);
        setShowDeleteModal(false);
        setSelectedSubject(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete subject:', error);
        alert(error.response?.data?.message || 'Failed to delete subject');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      school_id: selectedSchoolId || 0,
      name: '',
      code: '',
      default_max_marks: 100,
      pass_marks: 50,
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    setSelectedSubject(null);
    resetForm();
    if (selectedSchoolId) {
      setFormData(prev => ({ ...prev, school_id: selectedSchoolId }));
    }
    setShowFormModal(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      school_id: subject.school_id,
      name: subject.name,
      code: subject.code,
      default_max_marks: subject.default_max_marks,
      pass_marks: subject.pass_marks,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedSubject) {
      deleteMutation.mutate(selectedSubject.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.school_id) errors.school_id = 'School is required';
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.code.trim()) errors.code = 'Code is required';
    if (formData.default_max_marks <= 0) errors.default_max_marks = 'Default max marks must be greater than 0';
    if (formData.pass_marks < 0) errors.pass_marks = 'Pass marks cannot be negative';
    if (formData.pass_marks > formData.default_max_marks) {
      errors.pass_marks = 'Pass marks cannot exceed default max marks';
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
    setSelectedSubject(null);
    resetForm();
  };

  const filteredSubjects = selectedSchoolId
    ? subjects.filter(s => s.school_id === selectedSchoolId)
    : subjects;

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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Subjects</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load subjects'}
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subjects</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage subjects for your schools
                </p>
              </div>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Add Subject
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

          {/* Subjects Table */}
          {filteredSubjects.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No subjects found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedSchoolId ? 'No subjects found for the selected school.' : 'Get started by creating your first subject.'}
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
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Max Marks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Pass Marks
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSubjects.map((subject) => (
                      <tr key={subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {subject.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {subject.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {subject.school?.name || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {subject.default_max_marks}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {subject.pass_marks}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(subject)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(subject)}
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
            title={selectedSubject ? 'Edit Subject' : 'Create Subject'}
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
                  disabled={!!selectedSubject}
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
                  placeholder="e.g., Mathematics"
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., MATH"
                />
                {formErrors.code && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.code}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Max Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.default_max_marks}
                    onChange={(e) => setFormData({ ...formData, default_max_marks: Number(e.target.value) })}
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                      formErrors.default_max_marks ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    min="1"
                    step="0.01"
                  />
                  {formErrors.default_max_marks && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.default_max_marks}</p>
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
                    step="0.01"
                  />
                  {formErrors.pass_marks && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.pass_marks}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : selectedSubject ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Subject"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete <strong>{selectedSubject?.name}</strong>? This action cannot be undone.
              </p>
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

export default SubjectManagement;

