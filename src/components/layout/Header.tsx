'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User, ChevronDown, Menu, X } from 'lucide-react';

export function Header() {
  const { user, isLoading, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-xs">
      <div className="w-full px-6 py-3 flex justify-between items-center max-w-7xl mx-auto">
        {/* Logo Left Edge */}
        <Link href="/" className="flex items-center gap-3 cursor-pointer group">
          <Image
            src="/logo1.png"
            alt="ToolNova Logo"
            width={48}
            height={48}
            className="h-12 w-12 object-contain group-hover:scale-110 transition duration-300"
            priority
          />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">
            Tool<span className="text-blue-600">Nova</span>
          </span>
        </Link>

        {/* Desktop Navigation - Strictly Home, About, and Login/Signup or User Profile */}
        <nav className="hidden md:flex items-center gap-6 text-slate-600 font-medium text-sm">
          <Link href="/" className="hover:text-blue-600 transition">
            Home
          </Link>
          <Link href="/about" className="hover:text-blue-600 transition">
            About
          </Link>

          {/* Auth State */}
          {isLoading ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/70 py-1 pl-1.5 pr-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer"
                aria-label="User menu"
              >
                {/* User Avatar Image or Generated Avatar */}
                {user.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profile_image}
                    alt={user.name}
                    className="h-7 w-7 rounded-full object-cover shadow-2xs"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="max-w-[120px] truncate">{user.name}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setDropdownOpen(false);
                        await logout();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 ml-2">
              <Link
                href="/login"
                className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-xs font-semibold"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs font-semibold shadow-xs"
              >
                Sign Up
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-3">
          {user && (
            <div className="flex items-center gap-2">
              {user.profile_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.profile_image}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-1.5 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-3 shadow-md">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-blue-600 py-1"
          >
            Home
          </Link>
          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-sm font-medium text-slate-700 hover:text-blue-600 py-1"
          >
            About
          </Link>

          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <div className="space-y-3">
                <div className="text-xs text-slate-500">
                  Logged in as <span className="font-semibold text-slate-800">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-red-50 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Log Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 border border-blue-600 text-blue-600 rounded-lg text-xs font-semibold"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
