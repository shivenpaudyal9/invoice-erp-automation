import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Cpu, Loader2, UserPlus, Shield, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Password mismatch detected');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, username, password);
      toast.success('Account created successfully');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      <div className="glass-card max-w-md w-full mx-4 p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Cpu className="h-16 w-16 text-cyber-cyan" />
              <div className="absolute inset-0 bg-cyber-cyan opacity-50 blur-xl animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-orbitron font-bold text-white tracking-wider">
            INVOICE<span className="text-cyber-cyan">AI</span>
          </h1>
          <p className="mt-2 text-sm text-gray-400 font-rajdhani">
            Create New Operator Account
          </p>
        </div>

        {/* Features */}
        <div className="flex justify-center space-x-6 mb-8">
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Zap className="h-4 w-4 text-cyber-cyan" />
            <span>AI Powered</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-400">
            <Shield className="h-4 w-4 text-cyber-green" />
            <span>Encrypted</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-rajdhani font-semibold text-gray-300 mb-2">
              EMAIL ADDRESS
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="cyber-input"
              placeholder="user@domain.com"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-rajdhani font-semibold text-gray-300 mb-2">
              OPERATOR ID
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="cyber-input"
              placeholder="Your display name"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-rajdhani font-semibold text-gray-300 mb-2">
              PASSWORD
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="cyber-input"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-rajdhani font-semibold text-gray-300 mb-2">
              CONFIRM PASSWORD
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="cyber-input"
              placeholder="Repeat password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="cyber-btn cyber-btn-primary w-full"
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>CREATING ACCOUNT...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>REGISTER OPERATOR</span>
              </span>
            )}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-400 font-rajdhani">
              Already registered?{' '}
              <Link to="/login" className="text-cyber-cyan hover:text-cyber-pink transition-colors font-semibold">
                Sign In
              </Link>
            </p>
          </div>
        </form>

        {/* Decorative corner elements */}
        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-cyber-cyan" />
        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-cyber-cyan" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyber-cyan" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyber-cyan" />
      </div>
    </div>
  );
}
