import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { Teacher, School } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useFormSubmission } from '../hooks/useFormSubmission';

const TeachersManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form submission hooks
  const formSubmission = useFormSubmission({
    onSuccess: () => {
      queryClient.invalidateQueries('teachers');
      setShowFormModal(false);
      setSelectedTeacher(null);
    },
    successMessage: selectedTeacher ? 'Teacher updated successfully!' : 'Teacher created successfully!',
    clearForm: () => {
      const form = document.getElementById('teacher-form') as HTMLFormElement;
      if (form) form.reset();
    },
  });

  const deleteSubmission = useFormSubmission({
    onSuccess: () => {
      queryClient.invalidateQueries('teachers');
      setShowDeleteModal(false);
      setSelectedTeacher(null);
    },
    successMessage: 'Teacher deleted successfully!',
  });

  // Fetch schools for filter and form
  const { data: schools = [] } = useQuery<School[]>('schools', () => apiService.getSchools());

  // Fetch teachers
  const { data: teachers = [], isLoading, error } = useQuery<Teacher[]>(
    'teachers',
    () => apiService.getTeachers(),
    {
      staleTime: 30 * 1000,
    }
  );

  // Filter teachers
  const filteredTeachers = teachers.filter((teacher) => {
    const matchesSchool = !selectedSchoolId || teacher.school_id === selectedSchoolId;
    const matchesSearch = !searchTerm || 
      teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.phone && teacher.phone.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSchool && matchesSearch;
  });

  // Create/Update mutation
  const saveMutation = useMutation(
    async (data: { school_id: number; full_name: string; email: string; phone?: string }) => {
      if (selectedTeacher) {
        return await apiService.updateTeacher(selectedTeacher.id, data);
      } else {
        return await apiService.createTeacher(data);
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    async (id: number) => {
      return await apiService.deleteTeacher(id);
    }
  );

  const handleCreate = () => {
    setSelectedTeacher(null);
    setShowFormModal(true);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowFormModal(true);
  };

  const handleDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedTeacher) {
      deleteSubmission.handleSubmit(
        () => deleteMutation.mutateAsync(selectedTeacher.id),
        'Teacher deleted successfully!',
        'Failed to delete teacher'
      );
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolId = parseInt(formData.get('school_id') as string);
    const fullName = formData.get('full_name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!schoolId || !fullName || !email) {
      formSubmission.showToast('Please fill in all required fields', 'error');
      return;
    }

    await formSubmission.handleSubmit(
      () => saveMutation.mutateAsync({ 
        school_id: schoolId, 
        full_name: fullName, 
        email,
        phone: phone || undefined
      }),
      selectedTeacher ? 'Teacher updated successfully!' : 'Teacher created successfully!',
      selectedTeacher ? 'Failed to update teacher' : 'Failed to create teacher'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading teachers...</p>
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
              <p className="text-red-600 dark:text-red-400">Error loading teachers. Please try again.</p>
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
                Teachers Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage teachers and staff members
              </p>
            </div>
            <Button onClick={handleCreate} icon={<span>+</span>}>
              Add Teacher
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by School:
                </label>
                <select
                  value={selectedSchoolId || ''}
                  onChange={(e) => setSelectedSchoolId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Schools</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Search:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                  />
                  {(selectedSchoolId || searchTerm) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedSchoolId(null);
                        setSearchTerm('');
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Teachers
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {teachers.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Filtered Results
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredTeachers.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Schools
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(teachers.map(t => t.school_id)).size}
              </div>
            </Card>
          </div>

          {/* Teachers List */}
          {filteredTeachers.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">👨‍🏫</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Teachers Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || selectedSchoolId
                  ? 'No teachers match your search criteria. Try adjusting your filters.'
                  : 'Get started by creating your first teacher'}
              </p>
              {!searchTerm && !selectedSchoolId && (
                <Button onClick={handleCreate} icon={<span>+</span>}>
                  Add Teacher
                </Button>
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Contact
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
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {teacher.full_name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {teacher.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {teacher.email}
                          </div>
                          {teacher.phone && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {teacher.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {teacher.school?.name || `School ID: ${teacher.school_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(teacher)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Edit teacher"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(teacher)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              aria-label="Delete teacher"
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
          setSelectedTeacher(null);
        }}
        title={selectedTeacher ? 'Edit Teacher' : 'Create Teacher'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFormModal(false);
                setSelectedTeacher(null);
              }}
              disabled={formSubmission.isLoading || saveMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.getElementById('teacher-form') as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={formSubmission.isLoading || saveMutation.isLoading}
              loading={formSubmission.isLoading || saveMutation.isLoading}
            >
              {selectedTeacher ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form id="teacher-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="school_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              School <span className="text-red-500">*</span>
            </label>
            <select
              id="school_id"
              name="school_id"
              required
              defaultValue={selectedTeacher?.school_id || ''}
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
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={selectedTeacher?.full_name || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              placeholder="e.g., John Doe"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={selectedTeacher?.email || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              placeholder="e.g., john.doe@school.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              defaultValue={selectedTeacher?.phone || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              placeholder="e.g., +1234567890"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedTeacher(null);
        }}
        title="Delete Teacher"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedTeacher(null);
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
            Are you sure you want to delete this teacher? This action cannot be undone.
          </p>
          {selectedTeacher && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white mb-1">Teacher:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedTeacher.full_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedTeacher.email}
              </p>
            </div>
          )}
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Warning: Deleting this teacher may affect existing question banks, questions, and teaching assignments.
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

export default TeachersManagement;

