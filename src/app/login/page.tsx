'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, AlertCircle, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await login(email, password);
      if (res.success) {
        router.push('/');
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 to-blue-400 p-4 relative">
      {/* Back to Home link */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-white/90 hover:text-white text-xs font-semibold bg-white/15 px-3.5 py-1.5 rounded-lg backdrop-blur-xs transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      {/* Login Card */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-sm sm:w-96">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/logo1.png"
            alt="Toolino Logo"
            width={56}
            height={56}
            className="h-14 w-auto object-contain hover:scale-105 transition"
            priority
          />
        </div>

        <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">
          Login to Toolino
        </h2>

        {errorMessage && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-4">
            <label className="block text-gray-600 text-xs font-semibold mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-gray-600 text-xs font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="h-4 w-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
              />
            </div>
          </div>

          {/* Forgot Password */}
          <div className="text-right mb-6">
            <a href="#" className="text-blue-600 text-xs hover:underline">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition text-sm shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>

          {/* Divider */}
          <div className="text-center my-6 text-gray-400 text-xs uppercase tracking-wider">
            or
          </div>

          {/* Signup */}
          <p className="text-center text-gray-600 text-xs">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
