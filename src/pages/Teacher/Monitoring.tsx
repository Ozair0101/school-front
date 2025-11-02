import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import io from 'socket.io-client';
import apiService from '../../services/api';
import type { StudentAttempt } from '../../services/api';
import Card from '../../components/Card';
import Button from '../../components/Button';

interface MonitoringEvent {
  id: string;
  attempt_id: string;
  event_type: string;
  event_time: string;
  details?: any;
  student_name?: string;
  exam_title?: string;
}

const TeacherMonitoring: React.FC = () => {
  const [events, setEvents] = useState<MonitoringEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<MonitoringEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [selectedAttempt, setSelectedAttempt] = useState<StudentAttempt | null>(null);
  const [socket, setSocket] = useState<any>(null);

  // Fetch in-progress attempts using React Query
  const { data: attempts = [], isLoading, isError } = useQuery<StudentAttempt[]>(
    'inProgressAttempts',
    async () => {
      // In a real implementation, you would have an endpoint for this
      // For now, we'll simulate with a placeholder
      return [];
    },
    {
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 30 * 1000, // Refetch every 30 seconds
    }
  );

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io('http://localhost:3000'); // Adjust to your WebSocket server
    
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
    
    newSocket.on('exam_monitor', (data) => {
      // Handle incoming monitoring events
      const event: MonitoringEvent = {
        id: Date.now().toString(),
        attempt_id: data.attempt_id,
        event_type: data.event_type,
        event_time: new Date().toISOString(),
        details: data.details,
        student_name: data.student_name,
        exam_title: data.exam_title,
      };
      
      setEvents(prev => [event, ...prev].slice(0, 100)); // Keep only last 100 events
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, []);

  // Filter events based on search and type filters
  useEffect(() => {
    let result = [...events];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(event => 
        (event.student_name && event.student_name.toLowerCase().includes(term)) ||
        (event.exam_title && event.exam_title.toLowerCase().includes(term)) ||
        event.event_type.toLowerCase().includes(term)
      );
    }
    
    // Apply event type filter
    if (eventTypeFilter !== 'all') {
      result = result.filter(event => event.event_type === eventTypeFilter);
    }
    
    setFilteredEvents(result);
  }, [events, searchTerm, eventTypeFilter]);

  // Get unique event types for filter dropdown
  const eventTypes = Array.from(new Set(events.map(event => event.event_type)));

  // Handle attempt selection
  const handleSelectAttempt = (attempt: StudentAttempt) => {
    setSelectedAttempt(attempt);
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

  if (isError) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark py-8">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="text-center p-8">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Data</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                There was a problem loading monitoring data. Please try again later.
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
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
          {/* Page header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Exam Monitoring
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Monitor students taking exams in real-time
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  Live Monitoring
                </span>
              </div>
            </div>
          </div>
          
          {/* In-progress attempts */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Active Exams ({attempts.length})
            </h2>
            
            {attempts.length === 0 ? (
              <Card className="text-center p-12">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Active Exams
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  There are currently no students taking exams
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {attempts.map((attempt) => (
                  <Card key={attempt.id} className="hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">
                          Student Name
                        </h3>
                        <p className="text-primary">Exam Title</p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                        In Progress
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Started:</span>
                        <span className="font-medium">
                          {attempt.started_at 
                            ? new Date(attempt.started_at).toLocaleTimeString() 
                            : 'Just now'}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="font-medium">
                          {attempt.duration_seconds 
                            ? `${Math.floor(attempt.duration_seconds / 60)}m ${attempt.duration_seconds % 60}s`
                            : '0m 0s'}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => handleSelectAttempt(attempt)}
                    >
                      View Details
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {/* Monitoring events */}
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Recent Events
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                />
                <select
                  value={eventTypeFilter}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-gray-800 dark:text-white"
                >
                  <option value="all">All Events</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {filteredEvents.length === 0 ? (
              <Card className="text-center p-12">
                <div className="text-5xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Events Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || eventTypeFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria' 
                    : 'Monitoring events will appear here in real-time'}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`
                          w-10 h-10 rounded-full flex items-center justify-center
                          ${event.event_type === 'attempt_started' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                            event.event_type === 'proctor_event' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                            event.event_type === 'attempt_updated' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}
                        `}>
                          {event.event_type === 'attempt_started' ? '🚀' :
                           event.event_type === 'proctor_event' ? '👁️' :
                           event.event_type === 'attempt_updated' ? '🔄' : 'ℹ️'}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {event.student_name || 'Unknown Student'}
                          </h3>
                          <span className="text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-primary font-medium">
                            {event.exam_title || 'Unknown Exam'}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-2">
                          <span className="font-medium">{event.event_type}</span>
                          {event.details && (
                            <span>: {JSON.stringify(event.details)}</span>
                          )}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {new Date(event.event_time).toLocaleTimeString()}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(event.event_time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Attempt details modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Attempt Details
              </h2>
              <button 
                onClick={() => setSelectedAttempt(null)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Student</h3>
                  <p className="text-gray-700 dark:text-gray-300">Student Name</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Exam</h3>
                  <p className="text-gray-700 dark:text-gray-300">Exam Title</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Status</h3>
                  <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">
                    In Progress
                  </span>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Started</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {selectedAttempt.started_at 
                      ? new Date(selectedAttempt.started_at).toLocaleString()
                      : 'Just now'}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {/* Placeholder for activity log */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">
                      Student started the exam
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      2 minutes ago
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setSelectedAttempt(null)}>
                  Close
                </Button>
                <Button className="text-black">
                  View Proctoring Events
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TeacherMonitoring;