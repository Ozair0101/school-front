import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import apiService from '../services/api';
import type { Enrollment, Grade } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';

const GradeStudents: React.FC = () => {
  const { gradeId } = useParams<{ gradeId: string }>();
  const navigate = useNavigate();
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch grade details
  const { data: grade, isLoading: gradeLoading } = useQuery<Grade>(
    ['grade', gradeId],
    () => apiService.getGrade(parseInt(gradeId!)),
    {
      enabled: !!gradeId,
    }
  );

  // Fetch enrollments for this grade
  const { data: enrollments = [], isLoading: enrollmentsLoading, error } = useQuery<Enrollment[]>(
    ['enrollments', gradeId],
    () => apiService.getEnrollments(),
    {
      staleTime: 30 * 1000,
    }
  );

  // Filter enrollments by grade_id
  const gradeEnrollments = enrollments.filter(
    (enrollment) => enrollment.grade_id === parseInt(gradeId || '0')
  );

  // Get unique academic years from enrollments
  const academicYears = [...new Set(gradeEnrollments.map(e => e.academic_year))].sort().reverse();

  // Filter by academic year and search term
  const filteredEnrollments = gradeEnrollments.filter((enrollment) => {
    const matchesYear = !selectedAcademicYear || enrollment.academic_year === selectedAcademicYear;
    const matchesSearch = !searchTerm || 
      enrollment.student?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enrollment.student?.admission_no?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesYear && matchesSearch;
  });

  const isLoading = gradeLoading || enrollmentsLoading;

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

  if (!grade) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <p className="text-gray-600 dark:text-gray-400">Grade not found.</p>
              <Button onClick={() => navigate('/admin/grades')} className="mt-4">
                Back to Grades
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => navigate('/admin/grades')}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Back to grades"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Students in {grade.name}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Level {grade.level} • {grade.school?.name || `School ID: ${grade.school_id}`}
              </p>
            </div>
            <Button onClick={() => navigate('/admin/grades')} variant="secondary">
              Back to Grades
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {(selectedAcademicYear || searchTerm) && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSelectedAcademicYear('');
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
                {gradeEnrollments.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Active Enrollments
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {gradeEnrollments.filter(e => e.active).length}
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

          {/* Students List */}
          {filteredEnrollments.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">👥</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Students Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm || selectedAcademicYear
                  ? 'No students match your search criteria. Try adjusting your filters.'
                  : `No students are currently enrolled in ${grade.name}.`}
              </p>
              <Button onClick={() => navigate('/admin/enrollments')}>
                Add Enrollment
              </Button>
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
                        Academic Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Roll No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
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
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {enrollment.student?.admission_no || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {enrollment.academic_year}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GradeStudents;

