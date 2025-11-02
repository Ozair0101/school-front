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

// Backend model interfaces
export interface School {
  id: number;
  name: string;
  address?: string;
}

export interface Grade {
  id: number;
  school_id: number;
  name: string;
  level: number;
  school?: School;
  sections?: Section[];
  created_at?: string;
  updated_at?: string;
}

export interface Section {
  id: number;
  grade_id: number;
  name: string;
  grade?: Grade;
  created_at?: string;
  updated_at?: string;
}

export interface MonthlyExam {
  id: number;
  school_id: number;
  grade_id: number;
  section_id: number;
  month: number;
  year: number;
  exam_date: string;
  description?: string;
  online_enabled: boolean;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  allow_multiple_attempts?: boolean;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_choices?: boolean;
  negative_marking?: number;
  passing_percentage?: number;
  access_code?: string;
  random_pool?: boolean;
  show_answers_after?: boolean;
  auto_publish_results?: boolean;
  school?: School;
  grade?: Grade;
  section?: Section;
  created_at?: string;
  updated_at?: string;
}

// Frontend-friendly Exam interface (for backwards compatibility)
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

export interface QuestionBank {
  id: number;
  school_id: number;
  name: string;
  created_by: number;
  school?: School;
}

export interface ExamQuestion {
  id: number;
  monthly_exam_id: number;
  question_id: number;
  marks?: number;
  sequence?: number;
  pool_tag?: string;
  question?: Question;
  monthly_exam?: MonthlyExam;
  created_at?: string;
  updated_at?: string;
}

export interface BackendQuestion {
  id: number;
  bank_id: number;
  author_id: number;
  type: 'mcq' | 'tf' | 'numeric' | 'short' | 'essay' | 'file';
  prompt: string;
  default_marks: number;
  metadata?: any;
  bank?: QuestionBank;
  author?: any;
  choices?: Choice[];
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private attemptToken: string | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: 'http://localhost:8000/api', // Laravel backend URL
      timeout: 30000, // Increased to 30 seconds for better reliability
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

        // Increase timeout for certain endpoints that might take longer
        if (config.url?.includes('/monthly-exams') && config.method === 'get') {
          config.timeout = 60000; // 60 seconds for fetching exams
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
        // Handle timeout errors specifically
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.error('Request timeout:', error.config?.url);
          // Enhance error with more context
          error.userMessage = 'The request took too long. Please check your connection and try again.';
        }

        // Handle network errors (server not reachable)
        if (error.code === 'ERR_NETWORK' || !error.response) {
          console.error('Network error:', error);
          error.userMessage = 'Cannot connect to server. Please ensure the backend is running.';
        }

        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }

        if (error.response?.status === 500) {
          error.userMessage = 'Server error. Please try again later.';
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

  // Exam endpoints - CRUD operations
  async getExams(): Promise<MonthlyExam[]> {
    try {
      const response = await this.axiosInstance.get('/monthly-exams', {
        timeout: 60000, // 60 seconds for this specific request
      });
      return response.data.data || [];
    } catch (error: any) {
      console.error('Error fetching exams:', error);
      
      // Handle timeout errors gracefully
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('Request timeout. The server may be slow or unresponsive.');
        // Return empty array on timeout to prevent UI crash
        return [];
      }

      // Handle network errors
      if (error.code === 'ERR_NETWORK' || !error.response) {
        console.warn('Network error. Please check if the backend server is running.');
        return [];
      }

      // Return empty array if database is not set up
      if (error.response?.status === 500) {
        console.warn('Database connection error. Please ensure the database is set up and running.');
        return [];
      }
      
      throw error;
    }
  }

  async getExam(id: string | number): Promise<MonthlyExam> {
    const response = await this.axiosInstance.get(`/monthly-exams/${id}`);
    return response.data.data;
  }

  async createExam(examData: Partial<MonthlyExam>): Promise<MonthlyExam> {
    const response = await this.axiosInstance.post('/monthly-exams', examData);
    return response.data.data;
  }

  async updateExam(id: string | number, examData: Partial<MonthlyExam>): Promise<MonthlyExam> {
    const response = await this.axiosInstance.put(`/monthly-exams/${id}`, examData);
    return response.data.data;
  }

  async deleteExam(id: string | number): Promise<void> {
    await this.axiosInstance.delete(`/monthly-exams/${id}`);
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

  // Reference data endpoints for forms
  async getSchools(): Promise<School[]> {
    const response = await this.axiosInstance.get('/schools');
    return response.data.data || [];
  }

  // School CRUD operations
  async getSchool(id: number): Promise<School> {
    const response = await this.axiosInstance.get(`/schools/${id}`);
    return response.data.data;
  }

  async createSchool(schoolData: {
    name: string;
    address?: string;
  }): Promise<School> {
    const response = await this.axiosInstance.post('/schools', schoolData);
    return response.data.data;
  }

  async updateSchool(id: number, schoolData: {
    name?: string;
    address?: string;
  }): Promise<School> {
    const response = await this.axiosInstance.put(`/schools/${id}`, schoolData);
    return response.data.data;
  }

  async deleteSchool(id: number): Promise<void> {
    await this.axiosInstance.delete(`/schools/${id}`);
  }

  async getGrades(schoolId?: number): Promise<Grade[]> {
    const url = schoolId ? `/grades?school_id=${schoolId}` : '/grades';
    const response = await this.axiosInstance.get(url);
    return response.data.data || [];
  }

  async getSections(gradeId?: number): Promise<Section[]> {
    const url = gradeId ? `/sections?grade_id=${gradeId}` : '/sections';
    const response = await this.axiosInstance.get(url);
    return response.data.data || [];
  }

  // Grade CRUD operations
  async getGrade(id: number): Promise<Grade> {
    const response = await this.axiosInstance.get(`/grades/${id}`);
    return response.data.data;
  }

  async createGrade(gradeData: {
    school_id: number;
    name: string;
    level: number;
  }): Promise<Grade> {
    const response = await this.axiosInstance.post('/grades', gradeData);
    return response.data.data;
  }

  async updateGrade(id: number, gradeData: {
    school_id?: number;
    name?: string;
    level?: number;
  }): Promise<Grade> {
    const response = await this.axiosInstance.put(`/grades/${id}`, gradeData);
    return response.data.data;
  }

  async deleteGrade(id: number): Promise<void> {
    await this.axiosInstance.delete(`/grades/${id}`);
  }

  // Section CRUD operations
  async getSection(id: number): Promise<Section> {
    const response = await this.axiosInstance.get(`/sections/${id}`);
    return response.data.data;
  }

  async createSection(sectionData: {
    grade_id: number;
    name: string;
  }): Promise<Section> {
    const response = await this.axiosInstance.post('/sections', sectionData);
    return response.data.data;
  }

  async updateSection(id: number, sectionData: {
    grade_id?: number;
    name?: string;
  }): Promise<Section> {
    const response = await this.axiosInstance.put(`/sections/${id}`, sectionData);
    return response.data.data;
  }

  async deleteSection(id: number): Promise<void> {
    await this.axiosInstance.delete(`/sections/${id}`);
  }

  // Question Bank endpoints
  async getQuestionBanks(): Promise<QuestionBank[]> {
    const response = await this.axiosInstance.get('/question-banks');
    return response.data.data || [];
  }

  // Question endpoints
  async getQuestions(bankId?: number): Promise<BackendQuestion[]> {
    const url = bankId ? `/questions?bank_id=${bankId}` : '/questions';
    const response = await this.axiosInstance.get(url);
    return response.data.data || [];
  }

  async getQuestion(id: string | number): Promise<BackendQuestion> {
    const response = await this.axiosInstance.get(`/questions/${id}`);
    return response.data.data;
  }

  // Exam Question endpoints
  async getExamQuestions(examId: string | number): Promise<ExamQuestion[]> {
    const response = await this.axiosInstance.get(`/exam-questions?monthly_exam_id=${examId}`);
    return response.data.data || [];
  }

  async addExamQuestion(examId: string | number, examQuestionData: {
    question_id: number;
    marks?: number;
    sequence?: number;
    pool_tag?: string;
  }): Promise<ExamQuestion> {
    const response = await this.axiosInstance.post('/exam-questions', {
      monthly_exam_id: examId,
      ...examQuestionData,
    });
    return response.data.data;
  }

  async updateExamQuestion(examQuestionId: number, examQuestionData: {
    marks?: number;
    sequence?: number;
    pool_tag?: string;
  }): Promise<ExamQuestion> {
    const response = await this.axiosInstance.put(`/exam-questions/${examQuestionId}`, examQuestionData);
    return response.data.data;
  }

  async deleteExamQuestion(examQuestionId: number): Promise<void> {
    await this.axiosInstance.delete(`/exam-questions/${examQuestionId}`);
  }

  // Batch operations
  async addExamQuestions(examId: string | number, examQuestions: Array<{
    question_id: number;
    marks?: number;
    sequence?: number;
    pool_tag?: string;
  }>): Promise<ExamQuestion[]> {
    const response = await this.axiosInstance.post('/exam-questions/batch', {
      monthly_exam_id: examId,
      questions: examQuestions,
    });
    return response.data.data || [];
  }
}

// Create a singleton instance
const apiService = new ApiService();

export default apiService;