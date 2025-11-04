import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import type { TeacherSubject, Teacher, Subject, Grade, School } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

interface TeacherSubjectFormData {
  teacher_id: number;
  subject_id: number;
  grade_id: number;
}

const TeacherAssignmentManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherSubject | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TeacherSubjectFormData>({
    teacher_id: 0,
    subject_id: 0,
    grade_id: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch schools
  const { data: schools = [] } = useQuery<School[]>(
    'schools',
    () => apiService.getSchools()
  );

  // Fetch teachers
  const { data: teachers = [] } = useQuery<Teacher[]>(
    ['teachers', selectedSchoolId],
    () => apiService.getTeachers(selectedSchoolId || undefined),
    {
      enabled: !!selectedSchoolId || true,
    }
  );

  // Fetch subjects
  const { data: subjects = [] } = useQuery<Subject[]>(
    ['subjects', selectedSchoolId],
    () => apiService.getSubjects(selectedSchoolId || undefined)
  );

  // Fetch grades
  const { data: grades = [] } = useQuery<Grade[]>(
    ['grades', selectedSchoolId],
    () => apiService.getGrades(selectedSchoolId || undefined)
  );

  // Fetch teacher subjects
  const { data: teacherSubjects = [], isLoading, error } = useQuery<TeacherSubject[]>(
    'teacher-subjects',
    () => apiService.getTeacherSubjects(),
    {
      staleTime: 30 * 1000,
    }
  );

  // Filtered data based on selected school
  const filteredTeachers = useMemo(() => {
    if (!selectedSchoolId) return teachers;
    return teachers.filter(t => t.school_id === selectedSchoolId);
  }, [teachers, selectedSchoolId]);

  const filteredSubjects = useMemo(() => {
    if (!selectedSchoolId) return subjects;
    return subjects.filter(s => s.school_id === selectedSchoolId);
  }, [subjects, selectedSchoolId]);

  const filteredGrades = useMemo(() => {
    if (!selectedSchoolId) return grades;
    return grades.filter(g => g.school_id === selectedSchoolId);
  }, [grades, selectedSchoolId]);

  const filteredTeacherSubjects = useMemo(() => {
    if (!selectedSchoolId) return teacherSubjects;
    return teacherSubjects.filter(ts => {
      const teacher = teachers.find(t => t.id === ts.teacher_id);
      return teacher?.school_id === selectedSchoolId;
    });
  }, [teacherSubjects, teachers, selectedSchoolId]);

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: TeacherSubjectFormData) => {
      if (selectedAssignment) {
        return apiService.updateTeacherSubject(selectedAssignment.id, data);
      }
      return apiService.createTeacherSubject(data);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teacher-subjects');
        setShowFormModal(false);
        setSelectedAssignment(null);
        resetForm();
      },
      onError: (error: any) => {
        const errors = error.response?.data?.errors || {};
        const message = error.response?.data?.message;
        if (message) {
          setFormErrors({ _general: message });
        } else {
          setFormErrors(errors);
        }
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteTeacherSubject(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teacher-subjects');
        setShowDeleteModal(false);
        setSelectedAssignment(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete teacher assignment:', error);
        alert(error.response?.data?.message || 'Failed to delete teacher assignment');
      },
    }
  );

  const resetForm = () => {
    setFormData({
      teacher_id: 0,
      subject_id: 0,
      grade_id: 0,
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    setSelectedAssignment(null);
    resetForm();
    setShowFormModal(true);
  };

  const handleEdit = (assignment: TeacherSubject) => {
    setSelectedAssignment(assignment);
    setFormData({
      teacher_id: assignment.teacher_id,
      subject_id: assignment.subject_id,
      grade_id: assignment.grade_id,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const handleDelete = (assignment: TeacherSubject) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedAssignment) {
      deleteMutation.mutate(selectedAssignment.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: Record<string, string> = {};
    if (!formData.teacher_id) errors.teacher_id = 'Teacher is required';
    if (!formData.subject_id) errors.subject_id = 'Subject is required';
    if (!formData.grade_id) errors.grade_id = 'Grade is required';

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
    setSelectedAssignment(null);
    resetForm();
  };

  // Update form when school changes
  const handleSchoolChange = (schoolId: number | null) => {
    setSelectedSchoolId(schoolId);
    if (showFormModal && !selectedAssignment) {
      // Reset form when school changes during creation
      setFormData({
        teacher_id: 0,
        subject_id: 0,
        grade_id: 0,
      });
    }
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Teacher Assignments</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load teacher assignments'}
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
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Assignments</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Assign subjects to teachers for specific grades
                </p>
              </div>
              <Button onClick={handleCreate} icon={<span>+</span>}>
                Add Assignment
              </Button>
            </div>

            {/* School Filter */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by School
              </label>
              <select
                value={selectedSchoolId || ''}
                onChange={(e) => handleSchoolChange(e.target.value ? Number(e.target.value) : null)}
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

          {/* Teacher Subjects Table */}
          {filteredTeacherSubjects.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">👨‍🏫</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No assignments found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedSchoolId ? 'No assignments found for the selected school.' : 'Get started by creating your first teacher assignment.'}
              </p>
              <Button onClick={handleCreate}>
                Add Assignment
              </Button>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subject
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
                    {filteredTeacherSubjects.map((assignment) => {
                      const teacher = teachers.find(t => t.id === assignment.teacher_id);
                      const subject = subjects.find(s => s.id === assignment.subject_id);
                      const grade = grades.find(g => g.id === assignment.grade_id);
                      
                      return (
                        <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {assignment.teacher?.full_name || teacher?.full_name || 'N/A'}
                            </div>
                            {assignment.teacher?.email || teacher?.email ? (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {assignment.teacher?.email || teacher?.email}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {assignment.subject?.name || subject?.name || 'N/A'}
                            </div>
                            {assignment.subject?.code || subject?.code ? (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {assignment.subject?.code || subject?.code}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {assignment.grade?.name || grade?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {teacher?.school?.name || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(assignment)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(assignment)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Create/Edit Modal */}
          <Modal
            isOpen={showFormModal}
            onClose={handleCancel}
            title={selectedAssignment ? 'Edit Assignment' : 'Create Assignment'}
            size="md"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {formErrors._general && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{formErrors._general}</p>
                </div>
              )}

              {!selectedSchoolId && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    Please select a school from the filter above to see available teachers, subjects, and grades.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teacher <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.teacher_id || ''}
                  onChange={(e) => setFormData({ ...formData, teacher_id: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.teacher_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!selectedSchoolId && filteredTeachers.length === 0}
                >
                  <option value="">Select Teacher</option>
                  {filteredTeachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.email})
                    </option>
                  ))}
                </select>
                {formErrors.teacher_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.teacher_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.subject_id || ''}
                  onChange={(e) => setFormData({ ...formData, subject_id: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.subject_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!selectedSchoolId && filteredSubjects.length === 0}
                >
                  <option value="">Select Subject</option>
                  {filteredSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
                {formErrors.subject_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.subject_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grade <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grade_id || ''}
                  onChange={(e) => setFormData({ ...formData, grade_id: Number(e.target.value) })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent ${
                    formErrors.grade_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  disabled={!selectedSchoolId && filteredGrades.length === 0}
                >
                  <option value="">Select Grade</option>
                  {filteredGrades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
                {formErrors.grade_id && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.grade_id}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : selectedAssignment ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Assignment"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this assignment? This action cannot be undone.
              </p>
              {selectedAssignment && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Teacher:</strong> {selectedAssignment.teacher?.full_name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Subject:</strong> {selectedAssignment.subject?.name || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Grade:</strong> {selectedAssignment.grade?.name || 'N/A'}
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

export default TeacherAssignmentManagement;

