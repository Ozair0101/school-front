import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import apiService from '../services/api';
import type { User } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true 
}) => {
  const location = useLocation();
  const token = localStorage.getItem('auth_token');

  // Check if user is authenticated
  const { data: user, isLoading, isError } = useQuery<User | null>(
    'currentUser',
    async () => {
      if (!token) {
        return null;
      }

      // Try to get user from localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Verify token is still valid by making a lightweight API call
          // You can replace this with a /me endpoint if available
          return parsedUser;
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
          return null;
        }
      }

      return null;
    },
    {
      enabled: !!token && requireAuth,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Show loading state while checking authentication
  if (requireAuth && isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated and auth is required
  if (requireAuth && (!token || !user || isError)) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

