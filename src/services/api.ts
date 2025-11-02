import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import localforage from 'localforage';

// Define TypeScript interfaces for our data models
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin';
  grade?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  description: string;
  dueDate: string;
  duration: number; // in minutes
  totalQuestions: number;
  image?: string;
  status: 'upcoming' | 'in-progress' | 'completed';
  score?: number;
  maxScore: number;
  access_code?: string;
  online_enabled: boolean;
  start_time?: string;
  end_time?: string;
  passing_percentage?: number;
}

export interface Question {
  id: string;
  prompt: string;
  type: 'mcq' | 'tf' | 'numeric' | 'short' | 'essay' | 'file';
  default_marks: number;
  choices?: Choice[];
  metadata?: any;
}

export interface Choice {
  id: string;
  choice_text: string;
  is_correct: boolean;
  position?: number;
}

export interface StudentAttempt {
  id: string;
  monthly_exam_id: string;
  student_id: string;
  started_at?: string;
  finished_at?: string;
  duration_seconds?: number;
  status: 'in_progress' | 'submitted' | 'grading' | 'graded' | 'abandoned';
  total_score?: number;
  percent?: number;
  ip_address?: string;
  device_info?: string;
  attempt_token: string;
}

export interface AttemptAnswer {
  id?: string;
  attempt_id: string;
  question_id: string;
  choice_id?: string;
  answer_text?: string;
  uploaded_file?: string;
  marks_awarded?: number;
  auto_graded?: boolean;
  graded_by?: string;
  graded_at?: string;
  saved_at?: string;
}

export interface ProctoringEvent {
  id?: string;
  attempt_id: string;
  event_type: string;
  event_time: string;
  details?: any;
}

export interface ExamQuestion {
  id: string;
  monthly_exam_id: string;
  question_id: string;
  marks: number;
  sequence: number;
  pool_tag?: string;
  question: Question;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private attemptToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'http://localhost:8000/api', // Laravel backend URL
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token and attempt token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available (assuming it's stored in localStorage)
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add attempt token if available and endpoint requires it
        if (this.attemptToken && this.requiresAttemptToken(config.url || '')) {
          config.headers['X-Attempt-Token'] = this.attemptToken;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle errors
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Set the attempt token for subsequent requests
  setAttemptToken(token: string) {
    this.attemptToken = token;
  }

  // Clear the attempt token
  clearAttemptToken() {
    this.attemptToken = null;
  }

  // Check if endpoint requires attempt token
  private requiresAttemptToken(url: string): boolean {
    const protectedEndpoints = [
      '/attempts/',
      '/answer',
      '/submit',
      '/proctoring-events'
    ];
    
    return protectedEndpoints.some(endpoint => url.includes(endpoint));
  }

  // Authentication endpoints
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.axiosInstance.post('/login', { email, password });
    return response.data;
  }

  // Exam endpoints
  async getExams(): Promise<Exam[]> {
    const response = await this.axiosInstance.get('/monthly-exams');
    return response.data.data;
  }

  async getExam(id: string): Promise<Exam> {
    const response = await this.axiosInstance.get(`/monthly-exams/${id}`);
    return response.data.data;
  }

  // Start exam attempt
  async startAttempt(examId: string): Promise<{ 
    attempt_id: string; 
    attempt_token: string; 
    questions: ExamQuestion[]; 
    server_time: string; 
    exam_settings: any 
  }> {
    const response = await this.axiosInstance.post(`/monthly-exams/${examId}/start`, {});
    const data = response.data.data;
    
    // Set the attempt token for subsequent requests
    this.setAttemptToken(data.attempt_token);
    
    return data;
  }

  // Get exam questions
  async getExamQuestions(examId: string): Promise<ExamQuestion[]> {
    const response = await this.axiosInstance.get(`/monthly-exams/${examId}/questions`);
    return response.data.data;
  }

  // Save answer
  async saveAnswer(attemptId: string, answer: Omit<AttemptAnswer, 'id'>): Promise<AttemptAnswer> {
    const response = await this.axiosInstance.post(`/student-attempts/${attemptId}/answer`, answer);
    return response.data.data;
  }

  // Submit exam
  async submitAttempt(attemptId: string): Promise<{ 
    status: 'submitted' | 'queued_for_grading'; 
    total_score?: number; 
    percent?: number 
  }> {
    const response = await this.axiosInstance.post(`/student-attempts/${attemptId}/submit`);
    return response.data.data;
  }

  // Get attempt status
  async getAttemptStatus(attemptId: string): Promise<{ 
    status: string; 
    total_score?: number; 
    percent?: number; 
    results_url?: string 
  }> {
    const response = await this.axiosInstance.get(`/student-attempts/${attemptId}/status`);
    return response.data.data;
  }

  // Upload file presign
  async getPresignedUrl(examId: string, fileName: string, fileType: string): Promise<{ 
    upload_url: string; 
    file_path: string 
  }> {
    const response = await this.axiosInstance.post(`/monthly-exams/${examId}/presign`, { 
      file_name: fileName, 
      file_type: fileType 
    });
    return response.data.data;
  }

  // Upload file directly to storage
  async uploadFile(uploadUrl: string, file: File, fileType: string): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': fileType,
      },
    });
  }

  // Proctoring events
  async sendProctoringEvent(event: Omit<ProctoringEvent, 'id'>): Promise<ProctoringEvent> {
    const response = await this.axiosInstance.post('/proctoring-events', event);
    return response.data.data;
  }

  // Batch send proctoring events
  async sendProctoringEvents(events: Omit<ProctoringEvent, 'id'>[]): Promise<ProctoringEvent[]> {
    const response = await this.axiosInstance.post('/proctoring-events/batch', { events });
    return response.data.data;
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;