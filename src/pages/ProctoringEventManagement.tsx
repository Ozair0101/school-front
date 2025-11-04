import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import apiService from '../services/api';
import type { ProctoringEvent, StudentAttempt } from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';

const ProctoringEventManagement: React.FC = () => {
  const queryClient = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ProctoringEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filters
  const [filterAttemptId, setFilterAttemptId] = useState<number | null>(null);
  const [filterEventType, setFilterEventType] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Fetch student attempts for filter
  const { data: attempts = [] } = useQuery<StudentAttempt[]>(
    'student-attempts',
    () => apiService.getStudentAttempts(),
    {
      enabled: false, // Only fetch when needed
    }
  );

  // Fetch proctoring events
  const { data: events = [], isLoading, error } = useQuery<ProctoringEvent[]>(
    ['proctoring-events', filterAttemptId, filterEventType, filterStartDate, filterEndDate],
    () => apiService.getProctoringEvents({
      attempt_id: filterAttemptId || undefined,
      event_type: filterEventType || undefined,
      start_date: filterStartDate || undefined,
      end_date: filterEndDate || undefined,
    }),
    {
      staleTime: 30 * 1000,
    }
  );

  // Update mutation
  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: Partial<ProctoringEvent> }) =>
      apiService.updateProctoringEvent(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['proctoring-events', filterAttemptId, filterEventType, filterStartDate, filterEndDate]);
        setShowEditModal(false);
        setSelectedEvent(null);
      },
      onError: (error: any) => {
        console.error('Failed to update event:', error);
        alert(error.response?.data?.message || 'Failed to update event');
      },
    }
  );

  // Delete mutation
  const deleteMutation = useMutation(
    (id: number) => apiService.deleteProctoringEvent(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['proctoring-events', filterAttemptId, filterEventType, filterStartDate, filterEndDate]);
        setShowDeleteModal(false);
        setSelectedEvent(null);
      },
      onError: (error: any) => {
        console.error('Failed to delete event:', error);
        alert(error.response?.data?.message || 'Failed to delete event');
      },
    }
  );

  const handleEdit = (event: ProctoringEvent) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleDelete = (event: ProctoringEvent) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  const handleViewDetails = async (event: ProctoringEvent) => {
    try {
      const fullEvent = await apiService.getProctoringEvent(event.id);
      setSelectedEvent(fullEvent);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Failed to load event details:', error);
      alert('Failed to load event details');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const data: Partial<ProctoringEvent> = {
      event_type: formData.get('event_type') as string,
      event_time: formData.get('event_time') as string || undefined,
      details: formData.get('details') ? JSON.parse(formData.get('details') as string) : undefined,
    };

    setIsSubmitting(true);
    updateMutation.mutate(
      { id: selectedEvent.id, data },
      { onSettled: () => setIsSubmitting(false) }
    );
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getEventTypeColor = (eventType: string) => {
    const colors: Record<string, string> = {
      tab_switch: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      face_lost: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      camera_off: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
      screenshot: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
      high_noise: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    };
    return colors[eventType] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200';
  };

  const getEventTypeLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      tab_switch: 'Tab Switch',
      face_lost: 'Face Lost',
      camera_off: 'Camera Off',
      screenshot: 'Screenshot',
      high_noise: 'High Noise',
    };
    return labels[eventType] || eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const eventTypes = ['tab_switch', 'face_lost', 'camera_off', 'screenshot', 'high_noise'];

  const stats = {
    total: events.length,
    tab_switch: events.filter(e => e.event_type === 'tab_switch').length,
    face_lost: events.filter(e => e.event_type === 'face_lost').length,
    camera_off: events.filter(e => e.event_type === 'camera_off').length,
    screenshot: events.filter(e => e.event_type === 'screenshot').length,
    high_noise: events.filter(e => e.event_type === 'high_noise').length,
    other: events.filter(e => !eventTypes.includes(e.event_type)).length,
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
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Events</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {(error as any)?.userMessage || 'Failed to load proctoring events'}
              </p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Proctoring Events</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Monitor and audit exam session events
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Attempt ID
                </label>
                <input
                  type="number"
                  placeholder="Attempt ID"
                  value={filterAttemptId || ''}
                  onChange={(e) => setFilterAttemptId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Event Type
                </label>
                <select
                  value={filterEventType}
                  onChange={(e) => setFilterEventType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {getEventTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tab Switch</div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.tab_switch}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Face Lost</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.face_lost}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Camera Off</div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.camera_off}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Screenshot</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.screenshot}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">High Noise</div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.high_noise}</div>
            </Card>
            <Card>
              <div className="text-sm text-gray-600 dark:text-gray-400">Other</div>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">{stats.other}</div>
            </Card>
          </div>

          {/* Events Table */}
          {events.length === 0 ? (
            <Card className="text-center p-12">
              <div className="text-gray-400 text-5xl mb-4">📹</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No events found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {filterAttemptId || filterEventType || filterStartDate || filterEndDate
                  ? 'No events match your filters.'
                  : 'No proctoring events have been recorded yet.'}
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden" padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Attempt
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Event Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Event Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Details
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Attempt #{event.attempt_id}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {event.attempt?.student?.full_name || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {event.attempt?.monthly_exam?.grade?.name} - {event.attempt?.monthly_exam?.section?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.event_type)}`}>
                            {getEventTypeLabel(event.event_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatDateTime(event.event_time)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate" title={event.details ? JSON.stringify(event.details) : undefined}>
                            {event.details ? JSON.stringify(event.details).substring(0, 50) + '...' : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(event)}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(event)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(event)}
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

          {/* Edit Modal */}
          <Modal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedEvent(null);
            }}
            title="Edit Proctoring Event"
            size="md"
          >
            {selectedEvent && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Type
                  </label>
                  <input
                    type="text"
                    name="event_type"
                    defaultValue={selectedEvent.event_type}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="e.g., tab_switch, face_lost, camera_off"
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Common types: tab_switch, face_lost, camera_off, screenshot, high_noise
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Time
                  </label>
                  <input
                    type="datetime-local"
                    name="event_time"
                    defaultValue={selectedEvent.event_time ? new Date(selectedEvent.event_time).toISOString().slice(0, 16) : ''}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Details (JSON)
                  </label>
                  <textarea
                    name="details"
                    defaultValue={selectedEvent.details ? JSON.stringify(selectedEvent.details, null, 2) : ''}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                    placeholder='{"key": "value"}'
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedEvent(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            )}
          </Modal>

          {/* Detail Modal */}
          <Modal
            isOpen={showDetailModal}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedEvent(null);
            }}
            title="Event Details"
            size="lg"
          >
            {selectedEvent && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Attempt ID
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedEvent.attempt_id}
                    </p>
                    {selectedEvent.attempt?.student && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Student: {selectedEvent.attempt.student.full_name}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Type
                    </label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(selectedEvent.event_type)}`}>
                      {getEventTypeLabel(selectedEvent.event_type)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Event Time
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDateTime(selectedEvent.event_time)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Created At
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {formatDateTime(selectedEvent.created_at)}
                    </p>
                  </div>
                </div>
                {selectedEvent.details && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Details
                    </label>
                    <pre className="text-xs text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg overflow-auto">
                      {JSON.stringify(selectedEvent.details, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="flex justify-end pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetailModal(false);
                      setSelectedEvent(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            title="Delete Event"
            size="sm"
          >
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this proctoring event? This action cannot be undone.
              </p>
              {selectedEvent && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Attempt:</strong> #{selectedEvent.attempt_id}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Type:</strong> {getEventTypeLabel(selectedEvent.event_type)}
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    <strong>Time:</strong> {formatDateTime(selectedEvent.event_time)}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedEvent) {
                      deleteMutation.mutate(selectedEvent.id);
                    }
                  }}
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

export default ProctoringEventManagement;

