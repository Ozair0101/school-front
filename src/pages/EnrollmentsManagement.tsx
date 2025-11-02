import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { Enrollment, Student, Grade, Section } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useFormSubmission } from '../hooks/useFormSubmission';

const EnrollmentsManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedGradeId, setSelectedGradeId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form submission hooks
  const formSubmission = useFormSubmission({
    onSuccess: () => {
      queryClient.invalidateQueries('enrollments');
      setShowFormModal(false);
      setSelectedEnrollment(null);
    },
    successMessage: selectedEnrollment ? 'Enrollment updated successfully!' : 'Enrollment created successfully!',
    clearForm: () => {
      const form = document.getElementById('enrollment-form') as HTMLFormElement;
      if (form) form.reset();
    },
  });

  const deleteSubmission = useFormSubmission({
    onSuccess: () => {
      queryClient.invalidateQueries('enrollments');
      setShowDeleteModal(false);
      setSelectedEnrollment(null);
    },
    successMessage: 'Enrollment deleted successfully!',
  });

  // Fetch reference data
  const { data: students = [] } = useQuery<Student[]>('students', () => apiService.getStudents());
  const { data: grades = [] } = useQuery<Grade[]>('grades', () => apiService.getGrades());
  const { data: sections = [] } = useQuery<Section[]>('sections', () => apiService.getSections());

  // Fetch enrollments
  const { data: enrollments = [], isLoading, error } = useQuery<Enrollment[]>(
    'enrollments',
    () => apiService.getEnrollments(),
    {
      staleTime: 30 * 1000,
    }
  );

  // Get unique academic years
  const academicYears = [...new Set(enrollments.map(e => e.academic_year))].sort().reverse();

  // Filter enrollments
  const filteredEnrollments = enrollments.filter((enrollment) => {
    const matchesYear = !selectedAcademicYear || enrollment.academic_year === selectedAcademicYear;
    const matchesGrade = !selectedGradeId || enrollment.grade_id === selectedGradeId;
    const matchesSearch = !searchTerm || 
      enrollment.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student?.admission_no?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesYear && matchesGrade && matchesSearch;
  });

  // Get sections for selected grade
  const availableSections = selectedEnrollment?.grade_id 
    ? sections.filter(s => s.grade_id === selectedEnrollment.grade_id)
    : sections;

  // Create/Update mutation
  const saveMutation = useMutation(
    async (data: {
      student_id: number;
      grade_id: number;
      section_id: number;
      academic_year: string;
      roll_no: string;
      active?: boolean;
    }) => {
      if (selectedEnrollment) {
        return await apiService.updateEnrollment(selectedEnrollment.id, data);
      } else {
        return await apiService.createEnrollment(data);
      }
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    async (id: number) => {
      return await apiService.deleteEnrollment(id);
    }
  );

  const handleCreate = () => {
    setSelectedEnrollment(null);
    setShowFormModal(true);
  };

  const handleEdit = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowFormModal(true);
  };

  const handleDelete = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedEnrollment) {
      deleteSubmission.handleSubmit(
        () => deleteMutation.mutateAsync(selectedEnrollment.id),
        'Enrollment deleted successfully!',
        'Failed to delete enrollment'
      );
    }
  };

  const handleGradeChange = (gradeId: number) => {
    // Update grade and reset section
    const form = document.getElementById('enrollment-form') as HTMLFormElement;
    const sectionSelect = form?.querySelector('#section_id') as HTMLSelectElement;
    if (sectionSelect) {
      sectionSelect.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const studentId = parseInt(formData.get('student_id') as string);
    const gradeId = parseInt(formData.get('grade_id') as string);
    const sectionId = parseInt(formData.get('section_id') as string);
    const academicYear = formData.get('academic_year') as string;
    const rollNo = formData.get('roll_no') as string;
    const active = formData.get('active') === 'on';

    if (!studentId || !gradeId || !sectionId || !academicYear || !rollNo) {
      formSubmission.showToast('Please fill in all required fields', 'error');
      return;
    }

    await formSubmission.handleSubmit(
      () => saveMutation.mutateAsync({
        student_id: studentId,
        grade_id: gradeId,
        section_id: sectionId,
        academic_year: academicYear,
        roll_no: rollNo,
        active,
      }),
      selectedEnrollment ? 'Enrollment updated successfully!' : 'Enrollment created successfully!',
      selectedEnrollment ? 'Failed to update enrollment' : 'Failed to create enrollment'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading enrollments...</p>
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
              <p className="text-red-600 dark:text-red-400">Error loading enrollments. Please try again.</p>
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
                Enrollments Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage student placements per academic year
              </p>
            </div>
            <Button onClick={handleCreate} icon={<span>+</span>}>
              Add Enrollment
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Academic Year:
                </label>
                <select
                  value={selectedAcademicYear}
                  onChange={(e) => setSelectedAcademicYear(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Academic Years</option>
                  {academicYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Grade:
                </label>
                <select
                  value={selectedGradeId || ''}
                  onChange={(e) => setSelectedGradeId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                >
                  <option value="">All Grades</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name} (Level {grade.level})
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
                    placeholder="Search by student name or roll no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                  />
                  {(selectedAcademicYear || selectedGradeId || searchTerm) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedAcademicYear('');
                        setSelectedGradeId(null);
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Enrollments
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {enrollments.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Active Enrollments
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {enrollments.filter(e => e.active).length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Academic Years
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {academicYears.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Filtered Results
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredEnrollments.length}
              </div>
            </Card>
          </div>

          {/* Enrollments List */}
          {filteredEnrollments.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Enrollments Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || selectedAcademicYear || selectedGradeId
                  ? 'No enrollments match your search criteria. Try adjusting your filters.'
                  : 'Get started by creating your first enrollment'}
              </p>
              {!searchTerm && !selectedAcademicYear && !selectedGradeId && (
                <Button onClick={handleCreate} icon={<span>+</span>}>
                  Add Enrollment
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
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Academic Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Grade / Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredEnrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {enrollment.student 
                                ? `${enrollment.student.first_name} ${enrollment.student.last_name}`
                                : `Student ID: ${enrollment.student_id}`}
                            </div>
                            {enrollment.student?.admission_no && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Admission: {enrollment.student.admission_no}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {enrollment.academic_year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {enrollment.grade?.name || `Grade ${enrollment.grade_id}`}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {enrollment.section?.name || `Section ${enrollment.section_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {enrollment.roll_no}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            enrollment.active
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {enrollment.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(enrollment)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Edit enrollment"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(enrollment)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              aria-label="Delete enrollment"
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
          setSelectedEnrollment(null);
        }}
        title={selectedEnrollment ? 'Edit Enrollment' : 'Create Enrollment'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFormModal(false);
                setSelectedEnrollment(null);
              }}
              disabled={formSubmission.isLoading || saveMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.getElementById('enrollment-form') as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={formSubmission.isLoading || saveMutation.isLoading}
              loading={formSubmission.isLoading || saveMutation.isLoading}
            >
              {selectedEnrollment ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form id="enrollment-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="student_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Student <span className="text-red-500">*</span>
              </label>
              <select
                id="student_id"
                name="student_id"
                required
                defaultValue={selectedEnrollment?.student_id || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.admission_no})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="academic_year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Academic Year <span className="text-red-500">*</span>
              </label>
              <input
                id="academic_year"
                name="academic_year"
                type="text"
                required
                defaultValue={selectedEnrollment?.academic_year || new Date().getFullYear().toString()}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                placeholder="e.g., 2024-2025"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="grade_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Grade <span className="text-red-500">*</span>
              </label>
              <select
                id="grade_id"
                name="grade_id"
                required
                defaultValue={selectedEnrollment?.grade_id || ''}
                onChange={(e) => {
                  const gradeId = parseInt(e.target.value);
                  if (gradeId) handleGradeChange(gradeId);
                }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select a grade</option>
                {grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name} (Level {grade.level})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="section_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Section <span className="text-red-500">*</span>
              </label>
              <select
                id="section_id"
                name="section_id"
                required
                defaultValue={selectedEnrollment?.section_id || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select a section</option>
                {availableSections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </select>
              {selectedEnrollment?.grade_id && availableSections.length === 0 && (
                <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                  No sections available for this grade. Please create a section first.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="roll_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                id="roll_no"
                name="roll_no"
                type="text"
                required
                defaultValue={selectedEnrollment?.roll_no || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                placeholder="e.g., 001, A01"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  name="active"
                  defaultChecked={selectedEnrollment?.active !== false}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active Enrollment
                </span>
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedEnrollment(null);
        }}
        title="Delete Enrollment"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedEnrollment(null);
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
            Are you sure you want to delete this enrollment? This action cannot be undone.
          </p>
          {selectedEnrollment && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white mb-1">Enrollment:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedEnrollment.student 
                  ? `${selectedEnrollment.student.first_name} ${selectedEnrollment.student.last_name}`
                  : `Student ID: ${selectedEnrollment.student_id}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Academic Year: {selectedEnrollment.academic_year} | Roll No: {selectedEnrollment.roll_no}
              </p>
            </div>
          )}
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Warning: Deleting this enrollment may affect exam attempts and related data.
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

export default EnrollmentsManagement;

