import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { School } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const SchoolsManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch schools
  const { data: schools = [], isLoading, error } = useQuery<School[]>(
    'schools',
    () => apiService.getSchools(),
    {
      staleTime: 30 * 1000,
    }
  );

  // Filter schools by search term
  const filteredSchools = schools.filter((school) =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (school.address && school.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Create/Update mutation
  const saveMutation = useMutation(
    (data: { name: string; address?: string }) => {
      if (selectedSchool) {
        return apiService.updateSchool(selectedSchool.id, data);
      } else {
        return apiService.createSchool(data);
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schools');
        setShowFormModal(false);
        setSelectedSchool(null);
      },
      onError: (error: any) => {
        console.error('Failed to save school:', error);
        const errorMessage = error.response?.data?.message || 
                            error.response?.data?.errors || 
                            'Failed to save school';
        alert(typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage));
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteSchool(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('schools');
        setShowDeleteModal(false);
        setSelectedSchool(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete school:', error);
        alert(error.response?.data?.message || 'Failed to delete school');
      },
    }
  );

  const handleCreate = () => {
    setSelectedSchool(null);
    setShowFormModal(true);
  };

  const handleEdit = (school: School) => {
    setSelectedSchool(school);
    setShowFormModal(true);
  };

  const handleDelete = (school: School) => {
    setSelectedSchool(school);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (selectedSchool) {
      deleteMutation.mutate(selectedSchool.id);
    }
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const address = formData.get('address') as string;

    if (!name) {
      alert('Please fill in the school name');
      return;
    }

    saveMutation.mutate({ name, address: address || undefined });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading schools...</p>
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
              <p className="text-red-600 dark:text-red-400">Error loading schools. Please try again.</p>
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
                Schools Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage schools and institutions
              </p>
            </div>
            <Button onClick={handleCreate} icon={<span>+</span>}>
              Add School
            </Button>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Search:
              </label>
              <input
                type="text"
                placeholder="Search by name or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 max-w-md px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              />
              {searchTerm && (
                <Button
                  variant="secondary"
                  onClick={() => setSearchTerm('')}
                >
                  Clear
                </Button>
              )}
            </div>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Total Schools
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {schools.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Filtered Results
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredSchools.length}
              </div>
            </Card>
            <Card>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                With Address
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {schools.filter(s => s.address).length}
              </div>
            </Card>
          </div>

          {/* Schools List */}
          {filteredSchools.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-5xl mb-4">🏫</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No Schools Found' : 'No Schools Found'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchTerm
                  ? 'No schools match your search criteria. Try a different search term.'
                  : 'Get started by creating your first school'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreate} icon={<span>+</span>}>
                  Add School
                </Button>
              )}
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        School Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSchools.map((school) => (
                      <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {school.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ID: {school.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {school.address || (
                              <span className="text-gray-400 italic">No address provided</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(school)}
                              className="text-primary hover:text-primary/80 transition-colors"
                              aria-label="Edit school"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(school)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                              aria-label="Delete school"
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
          setSelectedSchool(null);
        }}
        title={selectedSchool ? 'Edit School' : 'Create School'}
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowFormModal(false);
                setSelectedSchool(null);
              }}
              disabled={saveMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={(e) => {
                const form = document.getElementById('school-form') as HTMLFormElement;
                if (form) {
                  form.requestSubmit();
                }
              }}
              disabled={saveMutation.isLoading}
              loading={saveMutation.isLoading}
            >
              {selectedSchool ? 'Update' : 'Create'}
            </Button>
          </div>
        }
      >
        <form id="school-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={selectedSchool?.name || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
              placeholder="e.g., Springfield High School"
            />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              rows={3}
              defaultValue={selectedSchool?.address || ''}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white resize-none"
              placeholder="e.g., 123 Main Street, Springfield, State 12345"
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedSchool(null);
        }}
        title="Delete School"
        size="md"
        footer={
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedSchool(null);
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
            Are you sure you want to delete this school? This action cannot be undone.
          </p>
          {selectedSchool && (
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="font-medium text-gray-900 dark:text-white mb-1">School:</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {selectedSchool.name}
              </p>
              {selectedSchool.address && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {selectedSchool.address}
                </p>
              )}
            </div>
          )}
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            ⚠️ Warning: Deleting this school will also delete all associated grades, sections, and may affect existing enrollments, exams, and other related data.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default SchoolsManagement;

