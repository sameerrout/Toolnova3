'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side quick validations
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await signup(name, email, password, confirmPassword);
      if (res.success) {
        router.push('/');
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 flex items-center justify-center min-h-screen py-12 px-4 relative">
      {/* Back to Home link */}
      <Link
        href="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 text-xs font-semibold bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-2xs transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Home</span>
      </Link>

      <div className="text-center w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <Image
            src="/logo1.png"
            alt="ToolNova Logo"
            width={64}
            height={64}
            className="h-16 w-auto object-contain hover:scale-105 transition"
            priority
          />
        </div>

        <h1 className="text-3xl font-semibold mb-6 text-gray-800 tracking-tight">
          Create new account
        </h1>

        {/* Social Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-6 text-xs font-semibold">
          <button
            type="button"
            className="flex items-center gap-2 border border-blue-400 bg-white px-4 py-2 rounded-lg hover:bg-blue-50 transition text-blue-600 shadow-2xs cursor-pointer"
          >
            <span>Facebook</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 border border-blue-400 bg-white px-4 py-2 rounded-lg hover:bg-blue-50 transition text-blue-600 shadow-2xs cursor-pointer"
          >
            <span>Google</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 border border-blue-400 bg-white px-4 py-2 rounded-lg hover:bg-blue-50 transition text-blue-600 shadow-2xs cursor-pointer"
          >
            <span>Instagram</span>
          </button>

          <button
            type="button"
            className="flex items-center gap-2 border border-blue-400 bg-white px-4 py-2 rounded-lg hover:bg-blue-50 transition text-blue-600 shadow-2xs cursor-pointer"
          >
            <span>X (Twitter)</span>
          </button>
        </div>

        {/* Form Card */}
        <div className="w-full bg-white p-8 rounded-2xl shadow-md border border-slate-200/60">
          {errorMessage && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 text-left">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Name */}
            <div className="relative">
              <User className="h-5 w-5 absolute left-3.5 top-3.5 text-blue-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg py-3 pl-11 pr-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="h-5 w-5 absolute left-3.5 top-3.5 text-blue-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg py-3 pl-11 pr-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="h-5 w-5 absolute left-3.5 top-3.5 text-blue-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (at least 8 characters)"
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg py-3 pl-11 pr-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
              />
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <Lock className="h-5 w-5 absolute left-3.5 top-3.5 text-blue-400" />
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                disabled={isSubmitting}
                className="w-full border border-slate-200 rounded-lg py-3 pl-11 pr-3 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition disabled:opacity-60"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full text-sm shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Sign up</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-gray-600 text-xs">
            Already member?{' '}
            <Link
              href="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>

          {/* Terms */}
          <p className="text-[11px] text-gray-500 mt-4 max-w-xs mx-auto leading-normal">
            By creating an account, you agree to ToolNova{' '}
            <span className="text-blue-600">Terms of Service</span> and{' '}
            <span className="text-blue-600">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
