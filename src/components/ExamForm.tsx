import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import apiService from '../services/api';
import type { MonthlyExam, School, Grade, Section } from '../services/api';
import Button from './Button';
import Card from './Card';

interface ExamFormProps {
  exam?: MonthlyExam | null;
  onSave: (examData: Partial<MonthlyExam>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ExamForm: React.FC<ExamFormProps> = ({
  exam,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = !!exam;

  // Form state
  const [formData, setFormData] = useState<Partial<MonthlyExam>>({
    school_id: exam?.school_id || 0,
    grade_id: exam?.grade_id || 0,
    section_id: exam?.section_id || 0,
    month: exam?.month || new Date().getMonth() + 1,
    year: exam?.year || new Date().getFullYear(),
    exam_date: exam?.exam_date || new Date().toISOString().split('T')[0],
    description: exam?.description || '',
    online_enabled: exam?.online_enabled ?? false,
    start_time: exam?.start_time || '',
    end_time: exam?.end_time || '',
    duration_minutes: exam?.duration_minutes || 60,
    allow_multiple_attempts: exam?.allow_multiple_attempts ?? false,
    max_attempts: exam?.max_attempts || 1,
    shuffle_questions: exam?.shuffle_questions ?? false,
    shuffle_choices: exam?.shuffle_choices ?? false,
    negative_marking: exam?.negative_marking || 0,
    passing_percentage: exam?.passing_percentage || 0,
    access_code: exam?.access_code || '',
    random_pool: exam?.random_pool ?? false,
    show_answers_after: exam?.show_answers_after ?? false,
    auto_publish_results: exam?.auto_publish_results ?? false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch reference data
  const { data: schools = [] } = useQuery<School[]>(
    'schools',
    () => apiService.getSchools(),
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: grades = [] } = useQuery<Grade[]>(
    ['grades', formData.school_id],
    () => apiService.getGrades(formData.school_id),
    {
      enabled: !!formData.school_id && formData.school_id > 0,
      staleTime: 5 * 60 * 1000,
    }
  );

  const { data: sections = [] } = useQuery<Section[]>(
    ['sections', formData.grade_id],
    () => apiService.getSections(formData.grade_id),
    {
      enabled: !!formData.grade_id && formData.grade_id > 0,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Reset grades and sections when school/grade changes
  useEffect(() => {
    if (!formData.school_id) {
      setFormData(prev => ({ ...prev, grade_id: 0, section_id: 0 }));
    }
  }, [formData.school_id]);

  useEffect(() => {
    if (!formData.grade_id) {
      setFormData(prev => ({ ...prev, section_id: 0 }));
    }
  }, [formData.grade_id]);

  const handleChange = (field: keyof MonthlyExam, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.school_id || formData.school_id === 0) {
      newErrors.school_id = 'School is required';
    }
    if (!formData.grade_id || formData.grade_id === 0) {
      newErrors.grade_id = 'Grade is required';
    }
    if (!formData.section_id || formData.section_id === 0) {
      newErrors.section_id = 'Section is required';
    }
    if (!formData.month || formData.month < 1 || formData.month > 12) {
      newErrors.month = 'Month must be between 1 and 12';
    }
    if (!formData.year || formData.year < 2000 || formData.year > 2100) {
      newErrors.year = 'Year is required';
    }
    if (!formData.exam_date) {
      newErrors.exam_date = 'Exam date is required';
    }
    if (formData.online_enabled && !formData.duration_minutes) {
      newErrors.duration_minutes = 'Duration is required for online exams';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    try {
      await onSave(formData);
    } catch (error) {
      console.error('Failed to save exam:', error);
    }
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Basic Information
        </h3>

        {/* School */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            School *
          </label>
          <select
            value={formData.school_id || ''}
            onChange={(e) => handleChange('school_id', parseInt(e.target.value))}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white ${
              errors.school_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            required
          >
            <option value="">Select School</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
          {errors.school_id && (
            <p className="mt-1 text-sm text-red-500">{errors.school_id}</p>
          )}
        </div>

        {/* Grade */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Grade *
          </label>
          <select
            value={formData.grade_id || ''}
            onChange={(e) => handleChange('grade_id', parseInt(e.target.value))}
            disabled={!formData.school_id || formData.school_id === 0}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white ${
              errors.grade_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } ${!formData.school_id ? 'opacity-50 cursor-not-allowed' : ''}`}
            required
          >
            <option value="">Select Grade</option>
            {grades.map((grade) => (
              <option key={grade.id} value={grade.id}>
                {grade.name}
              </option>
            ))}
          </select>
          {errors.grade_id && (
            <p className="mt-1 text-sm text-red-500">{errors.grade_id}</p>
          )}
        </div>

        {/* Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Section *
          </label>
          <select
            value={formData.section_id || ''}
            onChange={(e) => handleChange('section_id', parseInt(e.target.value))}
            disabled={!formData.grade_id || formData.grade_id === 0}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white ${
              errors.section_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } ${!formData.grade_id ? 'opacity-50 cursor-not-allowed' : ''}`}
            required
          >
            <option value="">Select Section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
          {errors.section_id && (
            <p className="mt-1 text-sm text-red-500">{errors.section_id}</p>
          )}
        </div>

        {/* Month and Year */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Month *
            </label>
            <select
              value={formData.month || ''}
              onChange={(e) => handleChange('month', parseInt(e.target.value))}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white ${
                errors.month ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            {errors.month && (
              <p className="mt-1 text-sm text-red-500">{errors.month}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Year *
            </label>
            <input
              type="number"
              value={formData.year || ''}
              onChange={(e) => handleChange('year', parseInt(e.target.value))}
              min="2000"
              max="2100"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white ${
                errors.year ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              required
            />
            {errors.year && (
              <p className="mt-1 text-sm text-red-500">{errors.year}</p>
            )}
          </div>
        </div>

        {/* Exam Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Exam Date *
          </label>
          <input
            type="date"
            value={formData.exam_date || ''}
            onChange={(e) => handleChange('exam_date', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white ${
              errors.exam_date ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            required
          />
          {errors.exam_date && (
            <p className="mt-1 text-sm text-red-500">{errors.exam_date}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
            placeholder="Enter exam description..."
          />
        </div>
      </div>

      {/* Online Exam Settings */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Online Exam Settings
        </h3>

        {/* Online Enabled */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="online_enabled"
            checked={formData.online_enabled || false}
            onChange={(e) => handleChange('online_enabled', e.target.checked)}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
          />
          <label htmlFor="online_enabled" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Online Exam
          </label>
        </div>

        {formData.online_enabled && (
          <>
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Duration (minutes) *
              </label>
              <input
                type="number"
                value={formData.duration_minutes || ''}
                onChange={(e) => handleChange('duration_minutes', parseInt(e.target.value))}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white ${
                  errors.duration_minutes ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required={formData.online_enabled}
              />
              {errors.duration_minutes && (
                <p className="mt-1 text-sm text-red-500">{errors.duration_minutes}</p>
              )}
            </div>

            {/* Start Time and End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.start_time || ''}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.end_time || ''}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Access Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Code (optional)
              </label>
              <input
                type="text"
                value={formData.access_code || ''}
                onChange={(e) => handleChange('access_code', e.target.value)}
                maxLength={50}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                placeholder="Enter access code if required"
              />
            </div>

            {/* Passing Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Passing Percentage (%)
              </label>
              <input
                type="number"
                value={formData.passing_percentage || ''}
                onChange={(e) => handleChange('passing_percentage', parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              />
            </div>
          </>
        )}
      </div>

      {/* Advanced Settings */}
      {formData.online_enabled && (
        <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Advanced Settings
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Allow Multiple Attempts */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="allow_multiple_attempts"
                checked={formData.allow_multiple_attempts || false}
                onChange={(e) => handleChange('allow_multiple_attempts', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
              />
              <label htmlFor="allow_multiple_attempts" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Allow Multiple Attempts
              </label>
            </div>

            {/* Shuffle Questions */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="shuffle_questions"
                checked={formData.shuffle_questions || false}
                onChange={(e) => handleChange('shuffle_questions', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
              />
              <label htmlFor="shuffle_questions" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Shuffle Questions
              </label>
            </div>

            {/* Shuffle Choices */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="shuffle_choices"
                checked={formData.shuffle_choices || false}
                onChange={(e) => handleChange('shuffle_choices', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
              />
              <label htmlFor="shuffle_choices" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Shuffle Choices
              </label>
            </div>

            {/* Random Pool */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="random_pool"
                checked={formData.random_pool || false}
                onChange={(e) => handleChange('random_pool', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
              />
              <label htmlFor="random_pool" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Random Question Pool
              </label>
            </div>

            {/* Show Answers After */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show_answers_after"
                checked={formData.show_answers_after || false}
                onChange={(e) => handleChange('show_answers_after', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
              />
              <label htmlFor="show_answers_after" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Answers After
              </label>
            </div>

            {/* Auto Publish Results */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_publish_results"
                checked={formData.auto_publish_results || false}
                onChange={(e) => handleChange('auto_publish_results', e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary/50"
              />
              <label htmlFor="auto_publish_results" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Auto Publish Results
              </label>
            </div>
          </div>

          {/* Max Attempts */}
          {formData.allow_multiple_attempts && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Attempts
              </label>
              <input
                type="number"
                value={formData.max_attempts || 1}
                onChange={(e) => handleChange('max_attempts', parseInt(e.target.value))}
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {/* Negative Marking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Negative Marking (points deducted per wrong answer)
            </label>
            <input
              type="number"
              value={formData.negative_marking || ''}
              onChange={(e) => handleChange('negative_marking', parseFloat(e.target.value))}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading} loading={isLoading}>
          {isEditing ? 'Update Exam' : 'Create Exam'}
        </Button>
      </div>
    </form>
  );
};

export default ExamForm;

