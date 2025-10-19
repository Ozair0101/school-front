import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    grade: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo purposes, always redirect to dashboard
    navigate('/dashboard');
    setLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                isLogin 
                  ? 'bg-white dark:bg-card-dark text-primary shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              Login 🚀
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                !isLogin 
                  ? 'bg-white dark:bg-card-dark text-primary shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-primary'
              }`}
            >
              Sign Up ✨
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Name 👋
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-card-dark text-gray-900 dark:text-white"
                  placeholder="Enter your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email 📧
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-card-dark text-gray-900 dark:text-white"
                placeholder="your.email@example.com"
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
                placeholder="Create a strong password"
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade 📚
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-card-dark text-gray-900 dark:text-white"
                >
                  <option value="">Select your grade</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-6"
              icon={<span>{isLogin ? '🚀' : '✨'}</span>}
            >
              {isLogin ? 'Login to Continue' : 'Create Account'}
            </Button>
          </form>
        </Card>

        {/* Demo buttons */}
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">Quick Demo Access:</p>
          <div className="flex gap-2 justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/dashboard')}
              icon={<span>👨‍🎓</span>}
            >
              Student Demo
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/admin')}
              icon={<span>👩‍🏫</span>}
            >
              Teacher Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
