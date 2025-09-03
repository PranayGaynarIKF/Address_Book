import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Smartphone } from 'lucide-react';
import { authAPI } from '../services/api';
import { LoginDto } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state?.from?.pathname]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>();

  const onSubmit = async (data: LoginDto) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Attempting login with:', { email: data.email, passwordLength: data.password.length });
      
      const response = await authAPI.login(data);
      console.log('✅ Login response:', response.data);
      
      // Store the access token
      login(response.data.access_token);
      
      // Redirect to the page they were trying to access, or dashboard
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
      
      // Show success message
      console.log('✅ Login successful, redirecting to:', from);
    } catch (err: any) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response?.data);
      console.error('❌ Error status:', err.response?.status);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.status === 401) {
        errorMessage = 'Invalid email or password.';
      } else if (err.response?.status === 0) {
        errorMessage = 'Cannot connect to server. Please check if backend is running.';
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to Google OAuth
    window.location.href = '/auth/google/login';
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-purple-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <div className="max-w-md w-full space-y-8 animate-fade-in-up relative z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary-600 via-primary-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl mb-6 animate-float relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-purple-600 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-500 to-purple-600 rounded-3xl"></div>
            <img src="/ikf-logo.svg" alt="IKF Logo" className="w-14 h-14 relative z-10 group-hover:scale-110 transition-transform duration-300" />
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          </div>
          <h2 className="text-3xl font-bold gradient-text mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-600">
            Sign in to your IKF PhoneBook account
          </p>
        </div>

        {/* Login Form */}
        <div className="card p-8 animate-scale-in relative group" style={{ animationDelay: '200ms' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50/50 to-purple-50/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform -skew-y-1"></div>
          <div className="relative z-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address',
                      },
                    })}
                    type="email"
                    id="email"
                    className="input-enhanced pl-10 group-hover:border-primary-500 group-hover:shadow-lg group-hover:shadow-primary-500/25 transition-all duration-300"
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 animate-fade-in-up">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="input-enhanced pl-10 pr-10 group-hover:border-primary-500 group-hover:shadow-lg group-hover:shadow-primary-500/25 transition-all duration-300"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 animate-fade-in-up">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-fade-in-up">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full group disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 group-hover:opacity-0 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </div>
              </button>

              {/* Forgot Password Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => alert('Forgot password functionality coming soon!')}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200 hover:underline"
                >
                  Forgot your password?
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full btn-secondary group"
        >
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-yellow-500 rounded-full mr-3"></div>
            Sign in with Google
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </button>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="text-center p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary-500/20 group">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-primary-600 transition-colors duration-300">Secure & Encrypted</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary-500/20 group">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors duration-300">Mobile Friendly</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-white/60 backdrop-blur-md border border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary-500/20 group">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">Privacy First</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <p>
            Don't have an account?{' '}
            <Link 
              to="/register" 
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
