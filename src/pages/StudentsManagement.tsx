import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { Student, School } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { useFormSubmission } from '../hooks/useFormSubmission';

const StudentsManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form submission hooks
  const formSubmission = useFormSubmission({
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      setShowFormModal(false);
      setSelectedStudent(null);
    },
    successMessage: selectedStudent ? 'Student updated successfully!' : 'Student created successfully!',
    clearForm: () => {
      const form = document.getElementById('student-form') as HTMLFormElement;
      if (form) form.reset();
    },
  });

  const deleteSubmission = useFormSubmission({
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      setShowDeleteModal(false);
      setSelectedStudent(null);
    },
    successMessage: 'Student deleted successfully!',
  });

  // Fetch schools for filter and form
  const { data: schools = [] } = useQuery<School[]>('schools', () => apiService.getSchools());

  // Fetch students
  const { data: students = [], isLoading, error } = useQuery<Student[]>(
    'students',
    () => apiService.getStudents(),
    {
      staleTime: 30 * 1000,
    }
  );

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSchool = !selectedSchoolId || student.school_id === selectedSchoolId;
    const matchesSearch = !searchTerm || 
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSchool && matchesSearch;
  });

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: {
      school_id: number;
      admission_no: string;
      first_name: string;
      last_name: string;
      dob?: string;
      gender?: 'male' | 'female' | 'other';
      contact?: {
        phone?: string;
        email?: string;
        address?: string;
      };
    }) => {
      if (selectedStudent) {
        return apiService.updateStudent(selectedStudent.id, data);
      } else {
        return apiService.createStudent(data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('students');
        setShowFormModal(false);
        setSelectedStudent(null);
      },
      onError: (error: any) => {
        console.error('Failed to save student:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors || 
                            'Failed to save student';
        alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteStudent(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('students');
        setShowDeleteModal(false);
        setSelectedStudent(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete student:', error);
        alert(error.response?.data?.message || 'Failed to delete student');
      },
    }
  );

  const handleCreate = () => {
    setSelectedStudent(null);
    setShowFormModal(true);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setShowFormModal(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedStudent) {
      deleteSubmission.handleSubmit(
        () => deleteMutation.mutateAsync(selectedStudent.id),
        'Student deleted successfully!',
        'Failed to delete student'
      );
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolId = parseInt(formData.get('school_id') as string);
    const admissionNo = formData.get('admission_no') as string;
    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const dob = formData.get('dob') as string;
    const gender = formData.get('gender') as 'male' | 'female' | 'other' | '';
    const contactPhone = formData.get('contact_phone') as string;
    const contactEmail = formData.get('contact_email') as string;
    const contactAddress = formData.get('contact_address') as string;

    if (!schoolId || !admissionNo || !firstName || !lastName) {
      formSubmission.showToast('Please fill in all required fields', 'error');
      return;
    }

    const contact: { phone?: string; email?: string; address?: string } = {};
    if (contactPhone) contact.phone = contactPhone;
    if (contactEmail) contact.email = contactEmail;
    if (contactAddress) contact.address = contactAddress;

    await formSubmission.handleSubmit(
      () => saveMutation.mutateAsync({
        school_id: schoolId,
        admission_no: admissionNo,
        first_name: firstName,
        last_name: lastName,
        dob: dob || undefined,
        gender: gender || undefined,
        contact: Object.keys(contact).length > 0 ? contact : undefined,
      }),
      selectedStudent ? 'Student updated successfully!' : 'Student created successfully!',
      selectedStudent ? 'Failed to update student' : 'Failed to create student'
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getContactInfo = (student: Student | null | undefined) => {
    if (!student || !student.contact) return null;
    if (typeof student.contact === 'string') {
      try {
        const parsed = JSON.parse(student.contact);
        return parsed;
      } catch {
        return null;
      }
    }
    return student.contact;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading students...</p>
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
              <p className="text-red-600 dark:text-red-400">Error loading students. Please try again.</p>
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
                Students Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage students and enrollments
              </p>
            </div>
            <Button onClick={handleCreate} icon={<span>+</span>}>
              Add Student
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
                    placeholder="Search by name or admission no..."
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Students
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {students.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Filtered Results
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredStudents.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Schools
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(students.map(s => s.school_id)).size}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                With Contact Info
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {students.filter(s => s.contact).length}
              </div>
            </Card>
          </div>

          {/* Students List */}
          {filteredStudents.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">👨‍🎓</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Students Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || selectedSchoolId
                  ? 'No students match your search criteria. Try adjusting your filters.'
                  : 'Get started by creating your first student'}
              </p>
              {!searchTerm && !selectedSchoolId && (
                <Button onClick={handleCreate} icon={<span>+</span>}>
                  Add Student
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
                        Admission No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Details
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
                    {filteredStudents.map((student) => {
                      const contact = getContactInfo(student);
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {student.first_name} {student.last_name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ID: {student.id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {student.admission_no}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white space-y-0.5">
                              {student.dob && (
                                <div className="text-xs">
                                  DOB: {formatDate(student.dob)}
                                </div>
                              )}
                              {student.gender && (
                                <div className="text-xs capitalize">
                                  {student.gender}
                                </div>
                              )}
                              {contact?.phone && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  📞 {contact.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {student.school?.name || `School ID: ${student.school_id}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleEdit(student)}
                                className="text-primary hover:text-primary/80 transition-colors"
                                aria-label="Edit student"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(student)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                aria-label="Delete student"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
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
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setSelectedStudent(null);
        }}
        title={selectedStudent ? 'Edit Student' : 'Create Student'}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFormModal(false);
                setSelectedStudent(null);
              }}
              disabled={formSubmission.isLoading || saveMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const form = document.getElementById('student-form') as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={formSubmission.isLoading || saveMutation.isLoading}
              loading={formSubmission.isLoading || saveMutation.isLoading}
            >
              {selectedStudent ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form id="student-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="school_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                School <span className="text-red-500">*</span>
              </label>
              <select
                id="school_id"
                name="school_id"
                required
                defaultValue={selectedStudent?.school_id || ''}
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
              <label htmlFor="admission_no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Admission Number <span className="text-red-500">*</span>
              </label>
              <input
                id="admission_no"
                name="admission_no"
                type="text"
                required
                defaultValue={selectedStudent?.admission_no || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                placeholder="e.g., ADM001"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                defaultValue={selectedStudent?.first_name || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                placeholder="First name"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                defaultValue={selectedStudent?.last_name || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                placeholder="Last name"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date of Birth
              </label>
              <input
                id="dob"
                name="dob"
                type="date"
                defaultValue={selectedStudent?.dob ? selectedStudent.dob.split('T')[0] : ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue={selectedStudent?.gender || ''}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Contact Information (Optional)</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="contact_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone
                </label>
                <input
                  id="contact_phone"
                  name="contact_phone"
                  type="tel"
                  defaultValue={(() => {
                    const contact = getContactInfo(selectedStudent);
                    return contact?.phone || '';
                  })()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., +1234567890"
                />
              </div>
              <div>
                <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  defaultValue={(() => {
                    const contact = getContactInfo(selectedStudent);
                    return contact?.email || '';
                  })()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., student@example.com"
                />
              </div>
              <div>
                <label htmlFor="contact_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  id="contact_address"
                  name="contact_address"
                  rows={2}
                  defaultValue={(() => {
                    const contact = getContactInfo(selectedStudent);
                    return contact?.address || '';
                  })()}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white resize-none"
                  placeholder="e.g., 123 Main Street, City, State"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedStudent(null);
        }}
        title="Delete Student"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedStudent(null);
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
            Are you sure you want to delete this student? This action cannot be undone.
          </p>
          {selectedStudent && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white mb-1">Student:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedStudent.first_name} {selectedStudent.last_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Admission No: {selectedStudent.admission_no}
              </p>
            </div>
          )}
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Warning: Deleting this student will also delete all associated enrollments, exam attempts, and related data.
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

export default StudentsManagement;

