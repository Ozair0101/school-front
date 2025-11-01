import React, { useState, useRef } from 'react';
import type { Question } from '../../services/api';
import apiService from '../../services/api';

interface FileQuestionCardProps {
  question: Question;
  selectedValue?: string; // File path
  onValueChange: (filePath: string) => void;
  isReviewMode?: boolean;
  showExplanation?: boolean;
}

const FileQuestionCard: React.FC<FileQuestionCardProps> = ({ 
  question, 
  selectedValue, 
  onValueChange,
  isReviewMode = false,
  showExplanation = false
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(selectedValue || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReviewMode) return;
    
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    if (isReviewMode) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Get presigned URL
      const { upload_url, file_path } = await apiService.getPresignedUrl(
        question.id, 
        file.name, 
        file.type
      );
      
      // Upload file directly to storage
      await apiService.uploadFile(upload_url, file, file.type);
      
      // Update state
      setUploadedFilePath(file_path);
      onValueChange(file_path);
      
      // Reset
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemove = () => {
    if (isReviewMode) return;
    
    setUploadedFilePath(null);
    setFile(null);
    onValueChange('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-lg font-medium text-gray-900 dark:text-white">
        {question.prompt}
      </div>
      
      {!uploadedFilePath && !isReviewMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {question.metadata?.allowed_file_types 
                    ? `Supported formats: ${question.metadata.allowed_file_types.join(', ')}`
                    : 'Any file type'}
                </p>
                {question.metadata?.max_file_size && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Max file size: {question.metadata.max_file_size} MB
                  </p>
                )}
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isUploading}
                accept={question.metadata?.allowed_file_types?.map((type: string) => `.${type}`).join(',')}
              />
            </label>
          </div>
          
          {file && (
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <svg className="w-8 h-8 text-gray-500 dark:text-gray-400 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19V8a1 1 0 0 0-1-1h-4v6h6ZM4 19V4a1 1 0 0 1 1-1h4v16H5Z"/>
                </svg>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-red-500 hover:text-red-700"
                disabled={isUploading}
              >
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 10V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6m-8 0V7m0 3 3-3m-3 3L7 7"/>
                </svg>
              </button>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isUploading}
            className={`
              w-full py-3 px-4 rounded-lg font-medium transition-colors
              ${!file || isUploading
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/90"
              }
            `}
          >
            {isUploading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading... {uploadProgress}%
              </div>
            ) : (
              "Upload File"
            )}
          </button>
        </div>
      )}
      
      {(uploadedFilePath || isReviewMode) && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-green-500 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19V8a1 1 0 0 0-1-1h-4v6h6ZM4 19V4a1 1 0 0 1 1-1h4v16H5Z"/>
            </svg>
            <div className="flex-1">
              <p className="font-medium text-green-800 dark:text-green-200">
                {uploadedFilePath ? "File uploaded successfully!" : "File submitted"}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {uploadedFilePath || selectedValue}
              </p>
            </div>
            {!isReviewMode && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 10V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6m-8 0V7m0 3 3-3m-3 3L7 7"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
      
      {isReviewMode && showExplanation && question.metadata?.explanation && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">Grading criteria:</h4>
          <p className="text-blue-700 dark:text-blue-300">{question.metadata.explanation}</p>
        </div>
      )}
    </div>
  );
};

export default FileQuestionCard;