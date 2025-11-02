import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Toast from '../components/Toast';
import apiService from '../services/api';
import type { User } from '../services/api';

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      const from = (location.state as any)?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [navigate, location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowToast(false);
    
    try {
      // Call backend login API
      const response = await apiService.login(formData.email, formData.password);
      
      if (response.token && response.user) {
        // Store auth token and user info
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect to the page user was trying to access, or admin dashboard
        const from = (location.state as any)?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message || 
                          'Invalid email or password. Please check your credentials.';
      setError(errorMessage);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background-dark dark:via-background-dark dark:to-background-dark flex items-center justify-center p-4">
      {/* Floating decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-yellow-200 rounded-full opacity-20 animate-float"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-pink-200 rounded-full opacity-20 animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-20 w-24 h-24 bg-green-200 rounded-full opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-18 h-18 bg-blue-200 rounded-full opacity-20 animate-float" style={{animationDelay: '0.5s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Mascot */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-4 bg-center bg-no-repeat bg-cover rounded-full animate-bounce-gentle" 
               style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCGiPiiShiYy-RarlQVNiansxKlZEWN9zaYFV1I74mypCsmJKg2E2xjIzhnf_megHiycKZSjL3FZce8NMJduVbWa7jz58ausHWsysfY6FStLInOgTfSioMvmElHF8Mj1UdZ1Ud9TbUeikimHBJQydU0i_-xmPcnhVk3IreTxgncT6cWIvT1xB_-5fjKgwKreb5drXCpFjakL1TvZ4tqjBbW0L54Toon1GQAKF8GZvSfR0_ngfkW68MAcsMxYftSGn_0IOa2RlCtkfU")'}}></div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to ExamPrep! 🌟
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Let's start your learning adventure!
          </p>
        </div>

        <Card className="mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email or Username 📧
              </label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-card-dark text-gray-900 dark:text-white"
                placeholder="dev@dev.com or developer"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password 🔒
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-card-dark text-gray-900 dark:text-white"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-6"
              icon={<span>🚀</span>}
            >
              Login to Continue
            </Button>
          </form>

          {/* Default credentials hint */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">
              Default Credentials:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>Email/Username:</strong> dev@dev.com or developer</p>
              <p><strong>Password:</strong> dev</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Toast Notification */}
      <Toast
        message={error || 'Invalid credentials. Please check your email and password.'}
        type="error"
        isVisible={showToast && !!error}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default LoginPage;
