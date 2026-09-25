import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h1 className="text-4xl font-bold mb-4">About ToolNova</h1>
          <p className="text-lg text-blue-100">
            ToolNova is your all-in-one platform for smart, fast, and privacy-first online tools.
          </p>
        </div>
      </section>

      {/* About Content */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-slate-900">Who We Are</h2>
            <p className="mb-4 text-gray-600 leading-relaxed">
              ToolNova is built to provide simple and efficient digital tools for everyday needs like document processing, formatting, converters, and utilities.
            </p>
            <p className="mb-4 text-gray-600 leading-relaxed">
              Our goal is to make tasks faster, easier, and accessible to everyone with rigorous privacy controls, client-side tools where practical, and zero persistent file retention.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-2 text-slate-900">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              To create a powerful platform where users can access multiple tools in one place with speed, simplicity, and reliability.
            </p>
          </div>

          {/* Image */}
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&q=80"
              alt="About ToolNova"
              className="rounded-2xl shadow-lg w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-white py-14 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8 text-slate-900">Meet the Creators</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            {/* Sameer */}
            <div className="bg-gray-50 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-blue-600 text-2xl font-bold mb-4">
                SR
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Sameer Rout</h3>
              <p className="text-blue-600 text-sm font-medium">Developer & Creator</p>
            </div>

            {/* Sampangi Sony */}
            <div className="bg-gray-50 p-6 rounded-2xl shadow-xs hover:shadow-md transition">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-purple-100 text-purple-600 text-2xl font-bold mb-4">
                SS
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Sampangi Sony</h3>
              <p className="text-purple-600 text-sm font-medium">Co-Creator</p>
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
