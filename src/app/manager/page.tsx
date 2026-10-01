'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Container } from '@/components/common/Container';
import {
  ShieldCheck,
  Users,
  Activity,
  Calendar,
  Wrench,
  TrendingUp,
  FileText,
  Download,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  X,
  Clock,
  ArrowUpRight,
  Eye,
  Filter,
} from 'lucide-react';

interface OverviewData {
  cards: {
    totalVisitors: number;
    todayVisitors: number;
    thisMonthVisitors: number;
    thisYearVisitors: number;
    totalToolUses: number;
    mostUsedTool: {
      slug: string;
      name: string;
      count: number;
    };
  };
  todayBreakdown: {
    totalVisitors: number;
    uniqueVisitors: number;
    sessions: number;
    newVisitors: number;
    returningVisitors: number;
  };
  selectedRange: {
    startTime: number;
    endTime: number;
    filteredVisitors: number;
    filteredToolUses: number;
  };
}

interface TrendPoint {
  key: string;
  label: string;
  timestamp: number;
  visitors: number;
  pageViews: number;
  sessions: number;
}

interface ToolUsageItem {
  toolSlug: string;
  toolName: string;
  uses: number;
  percentage: number;
}

interface PageVisitItem {
  path: string;
  views: number;
  uniqueVisitors: number;
  percentage: number;
}

interface MonthlyItem {
  month: string;
  monthIndex: number;
  year: number;
  visitors: number;
}

interface YearlyItem {
  year: number;
  visitors: number;
  changePercent: number | null;
}

interface ActivityItem {
  id: string;
  toolSlug: string;
  toolName: string;
  eventType: string;
  description: string;
  timestamp: number;
}

interface IndividualToolData {
  toolSlug: string;
  toolName: string;
  totalUses: number;
  usesToday: number;
  usesThisWeek: number;
  usesThisMonth: number;
  usesThisYear: number;
  trend: { date: string; label: string; count: number }[];
}

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  // State management
  const [dateRange, setDateRange] = useState<string>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [trendInterval, setTrendInterval] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [toolLimit, setToolLimit] = useState<'top5' | 'top10' | 'all'>('top10');
  const [toolSort, setToolSort] = useState<'most' | 'least' | 'alpha'>('most');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Data states
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [tools, setTools] = useState<ToolUsageItem[]>([]);
  const [pages, setPages] = useState<PageVisitItem[]>([]);
  const [monthly, setMonthly] = useState<MonthlyItem[]>([]);
  const [yearly, setYearly] = useState<YearlyItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  // Individual tool modal
  const [activeToolSlug, setActiveToolSlug] = useState<string | null>(null);
  const [toolDetail, setToolDetail] = useState<IndividualToolData | null>(null);
  const [toolDetailLoading, setToolDetailLoading] = useState<boolean>(false);

  // Status flags
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const isAuthorized = Boolean(
    user &&
      (user.managerAccess === true ||
        (user.email &&
          ['sameerrout2004@gmail.com', 'sonysampangi9@gmail.com'].includes(
            user.email.toLowerCase().trim()
          )))
  );

  // Fetch all dashboard metrics
  const fetchDashboardData = useCallback(async () => {
    if (!isAuthorized) return;

    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
      range: dateRange,
      ...(customStart ? { start: customStart } : {}),
      ...(customEnd ? { end: customEnd } : {}),
    });

    try {
      const [
        resOverview,
        resTrend,
        resTools,
        resPages,
        resMonthly,
        resYearly,
        resActivity,
      ] = await Promise.all([
        fetch(`/api/manager/analytics/overview?${queryParams.toString()}`),
        fetch(`/api/manager/analytics/visitors?${queryParams.toString()}&interval=${trendInterval}`),
        fetch(`/api/manager/analytics/tools?${queryParams.toString()}&sort=${toolSort}`),
        fetch(`/api/manager/analytics/pages?${queryParams.toString()}`),
        fetch(`/api/manager/analytics/monthly?year=${selectedYear}`),
        fetch('/api/manager/analytics/yearly'),
        fetch('/api/manager/analytics/activity?limit=15'),
      ]);

      if (!resOverview.ok || !resTrend.ok || !resTools.ok) {
        if (resOverview.status === 403 || resOverview.status === 401) {
          setError('Unauthorized: Manager access restricted to authorized administrators.');
          setLoading(false);
          return;
        }
        throw new Error('Failed to load some analytics resources');
      }

      const [dataOverview, dataTrend, dataTools, dataPages, dataMonthly, dataYearly, dataActivity] =
        await Promise.all([
          resOverview.json(),
          resTrend.json(),
          resTools.json(),
          resPages.json(),
          resMonthly.json(),
          resYearly.json(),
          resActivity.json(),
        ]);

      if (dataOverview.success) setOverview(dataOverview.data);
      if (dataTrend.success) setTrend(dataTrend.data || []);
      if (dataTools.success) setTools(dataTools.data?.tools || []);
      if (dataPages.success) setPages(dataPages.data?.pages || []);
      if (dataMonthly.success) setMonthly(dataMonthly.data || []);
      if (dataYearly.success) setYearly(dataYearly.data || []);
      if (dataActivity.success) setActivity(dataActivity.data || []);
    } catch (err: any) {
      console.error('[Manager Dashboard] fetch error:', err);
      setError('Unable to load analytics data from server. Please check your connection and retry.');
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, dateRange, customStart, customEnd, trendInterval, toolSort, selectedYear]);

  // Load when parameters change
  useEffect(() => {
    if (!authLoading && isAuthorized) {
      fetchDashboardData();
    }
  }, [authLoading, isAuthorized, fetchDashboardData]);

  // Fetch individual tool details
  const openToolModal = async (slug: string) => {
    setActiveToolSlug(slug);
    setToolDetailLoading(true);
    try {
      const res = await fetch(`/api/manager/analytics/tools/${slug}?range=${dateRange}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success) setToolDetail(json.data);
      }
    } catch (e) {
      console.error('Failed to load tool detail:', e);
    } finally {
      setToolDetailLoading(false);
    }
  };

  // Export handler
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const queryParams = new URLSearchParams({
        range: dateRange,
        format,
        ...(customStart ? { start: customStart } : {}),
        ...(customEnd ? { end: customEnd } : {}),
      });

      const res = await fetch(`/api/manager/analytics/export?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `toolino-analytics-${dateRange}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to export analytics data. Please retry.');
    } finally {
      setExporting(false);
    }
  };

  // Filtered tools list for bar chart
  const displayedTools = useMemo(() => {
    if (toolLimit === 'top5') return tools.slice(0, 5);
    if (toolLimit === 'top10') return tools.slice(0, 10);
    return tools;
  }, [tools, toolLimit]);

  // Calculate SVG line chart coordinates
  const hasTrendData = useMemo(() => {
    return Boolean(trend && trend.some((p) => p.visitors > 0 || p.pageViews > 0));
  }, [trend]);

  const chartCoordinates = useMemo(() => {
    const width = 800;
    const height = 240;
    const paddingX = 40;
    const paddingY = 25;

    if (!trend || trend.length === 0 || !trend.some((p) => p.visitors > 0)) {
      return { path: '', areaPath: '', points: [], maxVal: 0, width, height, paddingX, paddingY };
    }

    const maxVal = Math.max(...trend.map((p) => p.visitors), 1);

    const usableWidth = width - paddingX * 2;
    const usableHeight = height - paddingY * 2;

    const points = trend.map((point, index) => {
      const x =
        trend.length === 1
          ? width / 2
          : paddingX + (index / (trend.length - 1)) * usableWidth;
      const y = height - paddingY - (point.visitors / maxVal) * usableHeight;
      return { x, y, point };
    });

    const path = points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');

    // Area closed path for gradient fill
    const areaPath =
      points.length > 0
        ? `${path} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
        : '';

    return { path, areaPath, points, maxVal, width, height, paddingX, paddingY };
  }, [trend]);

  // 1. Auth Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h1>
          <p className="text-sm text-slate-600 mb-6">
            The Toolino Manager dashboard is private. Please sign in with an authorized administrator account to continue.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition shadow-xs"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // 3. Authenticated but unauthorized (Role USER): Return 403 Forbidden
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100">
            403 Forbidden
          </span>
          <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-600 mb-4 leading-relaxed">
            You are logged in as <strong className="text-slate-800">{user.email}</strong> (Role: <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{user.role || 'USER'}</span>), but this account does not have Manager or Administrator permissions.
          </p>
          <p className="text-xs text-slate-500 mb-6">
            If you are an authorized team member, please contact the site owner or sign in with your developer account.
          </p>
          <div className="flex gap-3">
            <Link
              href="/"
              className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition"
            >
              Back to Home
            </Link>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Authorized Admin / Co-Developer View
  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      {/* Top Banner Header */}
      <section className="bg-white border-b border-slate-200 py-6 sticky top-[57px] z-30 shadow-2xs backdrop-blur-md bg-white/95">
        <Container size="xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  TOOLINO MANAGER
                </h1>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  {user.role}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Website Analytics &amp; Tool Usage Dashboard
              </p>
            </div>

            {/* Controls Bar: Date Range + Export + Refresh */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Date Range Selector */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs">
                <Calendar className="h-3.5 w-3.5 text-slate-500 ml-1.5" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent font-semibold text-slate-700 focus:outline-none cursor-pointer pr-1 py-1"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Custom Date Inputs if selected */}
              {dateRange === 'custom' && (
                <div className="flex items-center gap-1 text-xs">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-slate-700"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-1 text-xs bg-white text-slate-700"
                  />
                </div>
              )}

              {/* Export dropdown / buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Export Aggregated CSV"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition disabled:opacity-50 cursor-pointer"
                  title="Export Aggregated JSON"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>JSON</span>
                </button>
              </div>

              {/* Refresh button */}
              <button
                type="button"
                onClick={fetchDashboardData}
                disabled={loading}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer"
                title="Refresh Analytics"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Dashboard Canvas */}
      <Container size="xl" className="mt-8 space-y-8">
        {/* Error Notification with Retry */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-red-800">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <p className="text-xs sm:text-sm font-medium">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchDashboardData}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shrink-0 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* 1. Summary Cards Section */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Card 1: Total Visitors */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Total Visitors</span>
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {overview ? overview.cards.totalVisitors.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">All-time unique</p>
            </div>

            {/* Card 2: Today's Visitors */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Today</span>
                <Clock className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {overview ? overview.cards.todayVisitors.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Active today</p>
            </div>

            {/* Card 3: This Month's Visitors */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">This Month</span>
                <Calendar className="h-4 w-4 text-indigo-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {overview ? overview.cards.thisMonthVisitors.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Current calendar month</p>
            </div>

            {/* Card 4: This Year's Visitors */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">This Year</span>
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {overview ? overview.cards.thisYearVisitors.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Year-to-date</p>
            </div>

            {/* Card 5: Total Tool Uses */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Tool Uses</span>
                <Activity className="h-4 w-4 text-violet-600" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {overview ? overview.cards.totalToolUses.toLocaleString() : '—'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">In selected range</p>
            </div>

            {/* Card 6: Most Used Tool */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold truncate">Most Used Tool</span>
                <Wrench className="h-4 w-4 text-rose-600 shrink-0" />
              </div>
              <p className="text-base sm:text-lg font-bold text-slate-900 truncate leading-tight mt-1">
                {overview && overview.cards.mostUsedTool.count > 0
                  ? overview.cards.mostUsedTool.name
                  : 'No data yet'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {overview && overview.cards.mostUsedTool.count > 0
                  ? `${overview.cards.mostUsedTool.count.toLocaleString()} executions`
                  : 'No executions yet'}
              </p>
            </div>
          </div>
        </section>

        {/* 2. Visitor Growth Trend Line Graph */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Visitor Growth</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Daily and aggregate unique traffic trends over time
              </p>
            </div>

            {/* Interval Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTrendInterval(mode)}
                  className={`px-3 py-1 rounded-lg capitalize transition cursor-pointer ${
                    trendInterval === mode
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Interactive Chart */}
          <div className="relative w-full overflow-hidden">
            {!hasTrendData ? (
              <div className="py-16 text-center text-slate-400">
                <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No analytics data yet.</p>
                <p className="text-xs text-slate-400 mt-1">Traffic will plot in real time as actual visitors arrive.</p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartCoordinates.width} ${chartCoordinates.height}`}
                  className="w-full h-56 sm:h-64 select-none"
                >
                  <defs>
                    <linearGradient id="visitorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y =
                      chartCoordinates.height -
                      chartCoordinates.paddingY -
                      ratio * (chartCoordinates.height - chartCoordinates.paddingY * 2);
                    return (
                      <g key={ratio}>
                        <line
                          x1={chartCoordinates.paddingX}
                          y1={y}
                          x2={chartCoordinates.width - chartCoordinates.paddingX}
                          y2={y}
                          stroke="#f1f5f9"
                          strokeDasharray="4 4"
                        />
                        <text
                          x={chartCoordinates.paddingX - 8}
                          y={y + 3}
                          fontSize="9"
                          fill="#94a3b8"
                          textAnchor="end"
                        >
                          {Math.round(chartCoordinates.maxVal * ratio)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Area fill */}
                  {chartCoordinates.areaPath && (
                    <path d={chartCoordinates.areaPath} fill="url(#visitorGradient)" />
                  )}

                  {/* Line path */}
                  {chartCoordinates.path && (
                    <path
                      d={chartCoordinates.path}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}

                  {/* Data Points */}
                  {chartCoordinates.points.map((pt, idx) => (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth="2"
                        className="cursor-pointer transition-transform hover:scale-150"
                        onMouseEnter={() => setHoveredPoint(pt.point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  ))}
                </svg>

                {/* Hover Tooltip display */}
                {hoveredPoint && (
                  <div className="absolute top-2 right-4 bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-lg pointer-events-none animate-in fade-in duration-100">
                    <p className="font-bold text-slate-100">{hoveredPoint.label}</p>
                    <p className="text-blue-300">
                      Unique Visitors: <strong className="text-white">{hoveredPoint.visitors}</strong>
                    </p>
                    <p className="text-slate-400">
                      Page Views: {hoveredPoint.pageViews} | Sessions: {hoveredPoint.sessions}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 3. Today's Traffic Breakdown & Monthly/Yearly Stats */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Visitors Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Today&apos;s Traffic</h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Live Today
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Real-time activity observed during the current calendar day
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Total Page Views</span>
                  <span className="font-bold text-slate-900">
                    {overview ? overview.todayBreakdown.totalVisitors.toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Unique Visitors</span>
                  <span className="font-bold text-blue-600">
                    {overview ? overview.todayBreakdown.uniqueVisitors.toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Active Sessions</span>
                  <span className="font-bold text-slate-900">
                    {overview ? overview.todayBreakdown.sessions.toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">New Visitors</span>
                  <span className="font-bold text-emerald-600">
                    {overview ? overview.todayBreakdown.newVisitors.toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Returning Visitors</span>
                  <span className="font-bold text-indigo-600">
                    {overview ? overview.todayBreakdown.returningVisitors.toLocaleString() : 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
              * Distinguishes first-time device visits from returning visitors via privacy-safe anonymous session tokens.
            </div>
          </div>

          {/* Monthly Visitors */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Monthly Visitors</h3>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 cursor-pointer"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Monthly traffic progression for {selectedYear}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs max-h-64 overflow-y-auto pr-1">
              {monthly.map((m) => (
                <div
                  key={m.month}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50/70 border border-slate-100"
                >
                  <span className="text-slate-600 font-medium">{m.month.slice(0, 3)}</span>
                  <span className="font-bold text-slate-900">
                    {m.visitors > 0 ? m.visitors.toLocaleString() : '0'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Visitors & YoY Change */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Yearly Visitors</h3>
              <span className="text-xs text-slate-400 font-semibold">YoY Change</span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Historical yearly audience expansion
            </p>

            <div className="space-y-3">
              {yearly.map((y) => (
                <div
                  key={y.year}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{y.year}</p>
                    <p className="text-xs text-slate-500">{y.visitors.toLocaleString()} visitors</p>
                  </div>
                  <div>
                    {y.changePercent !== null ? (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          y.changePercent >= 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {y.changePercent >= 0 ? `+${y.changePercent}%` : `${y.changePercent}%`}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Baseline</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Tool Usage Analytics & Graph Section */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tool Usage Analytics</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Execution volume per tool. Click any tool to view granular drill-down metrics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Limit buttons */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                {(['top5', 'top10', 'all'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setToolLimit(l)}
                    className={`px-2.5 py-1 rounded-lg uppercase transition cursor-pointer ${
                      toolLimit === l ? 'bg-white text-blue-600 shadow-2xs' : 'hover:text-slate-900'
                    }`}
                  >
                    {l === 'all' ? 'All Tools' : l.replace('top', 'Top ')}
                  </button>
                ))}
              </div>

              {/* Sort Selector */}
              <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-xl text-xs text-slate-600">
                <Filter className="h-3 w-3 text-slate-400" />
                <select
                  value={toolSort}
                  onChange={(e) => setToolSort(e.target.value as any)}
                  className="bg-transparent font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="most">Most Used</option>
                  <option value="least">Least Used</option>
                  <option value="alpha">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual Horizontal Bar Chart */}
          <div className="space-y-3 mb-8">
            {displayedTools.length === 0 || displayedTools.every((t) => t.uses === 0) ? (
              <div className="py-12 text-center text-slate-400">
                <Wrench className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">No analytics data yet.</p>
                <p className="text-xs text-slate-400 mt-1">Tool usage rankings will appear here as actual visitors use tools.</p>
              </div>
            ) : (
              displayedTools.map((t) => {
                const maxUses = Math.max(...displayedTools.map((x) => x.uses), 1);
                const barWidth = Math.max((t.uses / maxUses) * 100, 3);

                return (
                  <div
                    key={t.toolSlug}
                    onClick={() => openToolModal(t.toolSlug)}
                    className="group cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition flex items-center gap-1.5">
                        {t.toolName}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition" />
                      </span>
                      <span className="font-bold text-slate-900">
                        {t.uses.toLocaleString()} uses{' '}
                        <span className="text-slate-400 font-normal">({t.percentage}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out group-hover:bg-blue-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detailed Table */}
          <div className="overflow-x-auto border-t border-slate-100 pt-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-semibold">Tool Name</th>
                  <th className="pb-3 font-semibold">Slug</th>
                  <th className="pb-3 font-semibold text-right">Executions</th>
                  <th className="pb-3 font-semibold text-right">Share</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedTools.length === 0 || displayedTools.every((t) => t.uses === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No analytics data yet.
                    </td>
                  </tr>
                ) : (
                  displayedTools.map((t) => (
                    <tr key={t.toolSlug} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 font-bold text-slate-900">{t.toolName}</td>
                      <td className="py-2.5 font-mono text-[11px] text-slate-500">{t.toolSlug}</td>
                      <td className="py-2.5 text-right font-semibold">{t.uses.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-medium text-slate-500">{t.percentage}%</td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => openToolModal(t.toolSlug)}
                          className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline text-[11px]"
                        >
                          Inspect Trends
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Most Visited Pages & Recent Activity Stream */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Visited Pages */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Most Visited Pages</h3>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Audience volume by internal route and clean tool URLs
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100">
                    <th className="pb-2.5 font-semibold">Page Route</th>
                    <th className="pb-2.5 font-semibold text-right">Views</th>
                    <th className="pb-2.5 font-semibold text-right">Unique</th>
                    <th className="pb-2.5 font-semibold text-right">Traffic %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pages.length === 0 || pages.every((p) => p.views === 0) ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">
                        No analytics data yet.
                      </td>
                    </tr>
                  ) : (
                    pages.slice(0, 8).map((p) => (
                      <tr key={p.path} className="hover:bg-slate-50/70 transition">
                        <td className="py-2 font-mono text-[11px] text-blue-600 truncate max-w-[180px]">
                          {p.path}
                        </td>
                        <td className="py-2 text-right font-semibold text-slate-900">
                          {p.views.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-slate-600 font-medium">
                          {p.uniqueVisitors.toLocaleString()}
                        </td>
                        <td className="py-2 text-right text-slate-500">{p.percentage}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Aggregated Activity Feed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Recent Activity</h3>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Anonymized live stream of recent tool executions
            </p>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activity.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No recent activity logged yet.
                </div>
              ) : (
                activity.map((act) => (
                  <div
                    key={act.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 truncate">
                        {act.description}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                      {new Date(act.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </Container>

      {/* Individual Tool Analytics Modal */}
      {activeToolSlug && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-xl relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setActiveToolSlug(null);
                setToolDetail(null);
              }}
              className="absolute top-5 right-5 p-1 text-slate-400 hover:text-slate-700 rounded-full transition"
            >
              <X className="h-5 w-5" />
            </button>

            {toolDetailLoading || !toolDetail ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Fetching tool analytics...</p>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                    Tool Analytics Drill-Down
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                    {toolDetail.toolName}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">/{toolDetail.toolSlug}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-medium">Today</p>
                    <p className="text-base font-bold text-slate-900">{toolDetail.usesToday}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-medium">This Week</p>
                    <p className="text-base font-bold text-slate-900">{toolDetail.usesThisWeek}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-medium">This Month</p>
                    <p className="text-base font-bold text-slate-900">{toolDetail.usesThisMonth}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <p className="text-[11px] text-slate-500 font-medium">Total</p>
                    <p className="text-base font-bold text-blue-600">{toolDetail.totalUses}</p>
                  </div>
                </div>

                {/* Mini trend chart */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Usage Trend (Recent Days)</h4>
                  <div className="h-28 flex items-end gap-1.5 pt-4 border-b border-slate-200">
                    {toolDetail.trend.slice(-14).map((pt) => {
                      const maxTrend = Math.max(...toolDetail.trend.map((x) => x.count), 1);
                      const heightPercent = Math.max((pt.count / maxTrend) * 100, 8);
                      return (
                        <div
                          key={pt.date}
                          className="flex-1 flex flex-col items-center justify-end h-full group relative"
                        >
                          <div
                            className="w-full bg-blue-600 rounded-t group-hover:bg-blue-700 transition"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <div className="absolute -top-7 hidden group-hover:block bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                            {pt.label}: {pt.count} uses
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveToolSlug(null);
                      setToolDetail(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
