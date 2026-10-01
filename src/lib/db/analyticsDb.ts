import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';

export interface VisitorRecord {
  id: string;
  anonymous_id: string;
  first_seen_at: number;
  last_seen_at: number;
  created_at: number;
}

export interface SessionRecord {
  id: string;
  anonymous_visitor_id: string;
  started_at: number;
  last_activity_at: number;
}

export interface PageViewRecord {
  id: string;
  session_id: string;
  anonymous_visitor_id: string;
  path: string;
  timestamp: number;
}

export type ToolEventType = 'tool_opened' | 'tool_started' | 'tool_completed' | 'tool_failed';

export interface ToolEventRecord {
  id: string;
  session_id: string;
  anonymous_visitor_id: string;
  tool_slug: string;
  event_type: ToolEventType;
  timestamp: number;
}

export interface AdminAuditRecord {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  details?: string;
  timestamp: number;
}

interface AnalyticsDatabaseSchema {
  visitors: VisitorRecord[];
  sessions: SessionRecord[];
  page_views: PageViewRecord[];
  tool_events: ToolEventRecord[];
  audit_logs: AdminAuditRecord[];
}

function getAnalyticsFilePath(): string {
  if (process.env.TOOLINO_ANALYTICS_FILE) {
    return process.env.TOOLINO_ANALYTICS_FILE;
  }
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const dataDir = isServerless
    ? path.join(os.tmpdir(), 'toolnova_data')
    : path.join(process.cwd(), 'data');
  return path.join(dataDir, 'toolnova_analytics.json');
}

// Map of known tool slugs to friendly display names
const KNOWN_TOOLS: Record<string, string> = {
  'image-to-pdf': 'Image to PDF',
  'merge-pdf': 'Merge PDF',
  'split-pdf': 'Split PDF',
  'compress-pdf': 'Compress PDF',
  'edit-pdf': 'Edit PDF',
  'pdf-to-image': 'PDF to Image',
  'image-compressor': 'Image Compressor',
  'image-resizer': 'Image Resizer',
  'background-remover': 'Background Remover',
  'image-converter': 'Image Converter',
  'passport-photo-maker': 'Passport Photo Maker',
  'image-to-text': 'Image to Text (OCR)',
  'word-counter': 'Word Counter',
  'json-formatter': 'JSON Formatter',
  'age-calculator': 'Age Calculator',
  'percentage-calculator': 'Percentage Calculator',
  'emi-calculator': 'EMI Calculator',
  'discount-calculator': 'Discount Calculator',
  'pdf-summarizer': 'PDF Summarizer',
  'gst-calculator': 'GST Calculator',
};

export function getToolDisplayName(slug: string): string {
  if (KNOWN_TOOLS[slug]) return KNOWN_TOOLS[slug];
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

class AnalyticsDatabase {
  private inMemoryData: AnalyticsDatabaseSchema | null = null;
  private isLoaded = false;

  private ensureDb(): AnalyticsDatabaseSchema {
    if (this.isLoaded && this.inMemoryData) {
      return this.inMemoryData;
    }

    const filePath = getAnalyticsFilePath();
    const dataDir = path.dirname(filePath);

    try {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (!fs.existsSync(filePath)) {
        const initial: AnalyticsDatabaseSchema = {
          visitors: [],
          sessions: [],
          page_views: [],
          tool_events: [],
          audit_logs: [],
        };
        fs.writeFileSync(filePath, JSON.stringify(initial, null, 2), 'utf-8');
        this.inMemoryData = initial;
        this.isLoaded = true;
        return initial;
      }

      const raw = fs.readFileSync(filePath, 'utf-8');
      this.inMemoryData = JSON.parse(raw);
      this.isLoaded = true;
      return this.inMemoryData!;
    } catch {
      const fallback: AnalyticsDatabaseSchema = {
        visitors: [],
        sessions: [],
        page_views: [],
        tool_events: [],
        audit_logs: [],
      };
      this.inMemoryData = fallback;
      this.isLoaded = true;
      return fallback;
    }
  }

  private save(): void {
    if (!this.inMemoryData) return;
    try {
      const filePath = getAnalyticsFilePath();
      const dataDir = path.dirname(filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(this.inMemoryData, null, 2), 'utf-8');
    } catch (err) {
      console.error('[AnalyticsDatabase] Failed to write analytics file:', err);
    }
  }

  /**
   * Resets all analytics data to zero (empty state)
   */
  public clearAllData(): void {
    const empty: AnalyticsDatabaseSchema = {
      visitors: [],
      sessions: [],
      page_views: [],
      tool_events: [],
      audit_logs: [],
    };
    this.inMemoryData = empty;
    this.isLoaded = true;
    this.save();
  }

  /**
   * Force re-reads the analytics database file from disk
   */
  public reload(): void {
    this.isLoaded = false;
    this.inMemoryData = null;
    this.ensureDb();
  }

  /**
   * Records or updates a visitor touch. Deduplicates by anonymousId.
   */
  public async trackVisitorTouch(
    anonymousId: string,
    sessionId: string,
    timestamp = Date.now()
  ): Promise<{ isNew: boolean; visitor: VisitorRecord; session: SessionRecord }> {
    const db = this.ensureDb();
    let isNew = false;

    // 1. Visitor tracking
    let visitor = db.visitors.find((v) => v.anonymous_id === anonymousId);
    if (!visitor) {
      isNew = true;
      visitor = {
        id: crypto.randomUUID(),
        anonymous_id: anonymousId,
        first_seen_at: timestamp,
        last_seen_at: timestamp,
        created_at: timestamp,
      };
      db.visitors.push(visitor);
    } else {
      visitor.last_seen_at = timestamp;
    }

    // 2. Session tracking
    let session = db.sessions.find((s) => s.id === sessionId);
    if (!session) {
      session = {
        id: sessionId,
        anonymous_visitor_id: anonymousId,
        started_at: timestamp,
        last_activity_at: timestamp,
      };
      db.sessions.push(session);
    } else {
      session.last_activity_at = timestamp;
    }

    this.save();
    return { isNew, visitor, session };
  }

  /**
   * Tracks a PageView event
   */
  public async trackPageView(params: {
    anonymousId: string;
    sessionId: string;
    path: string;
    timestamp?: number;
  }): Promise<PageViewRecord> {
    const db = this.ensureDb();
    const timestamp = params.timestamp || Date.now();

    await this.trackVisitorTouch(params.anonymousId, params.sessionId, timestamp);

    // Sanitize path (strip query params, trailing slashes except root)
    let cleanPath = params.path.split('?')[0].split('#')[0].trim();
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }

    const pageView: PageViewRecord = {
      id: crypto.randomUUID(),
      session_id: params.sessionId,
      anonymous_visitor_id: params.anonymousId,
      path: cleanPath || '/',
      timestamp,
    };

    db.page_views.push(pageView);
    this.save();
    return pageView;
  }

  /**
   * Tracks a Tool Event (opened, started, completed, failed)
   * Strictly ignores file contents or sensitive inputs
   */
  public async trackToolEvent(params: {
    anonymousId: string;
    sessionId: string;
    toolSlug: string;
    eventType: ToolEventType;
    timestamp?: number;
  }): Promise<ToolEventRecord> {
    const db = this.ensureDb();
    const timestamp = params.timestamp || Date.now();

    await this.trackVisitorTouch(params.anonymousId, params.sessionId, timestamp);

    const event: ToolEventRecord = {
      id: crypto.randomUUID(),
      session_id: params.sessionId,
      anonymous_visitor_id: params.anonymousId,
      tool_slug: params.toolSlug.trim().toLowerCase(),
      event_type: params.eventType,
      timestamp,
    };

    db.tool_events.push(event);
    this.save();
    return event;
  }

  /**
   * Logs an administrative action in the audit trail
   */
  public async logAdminAction(params: {
    adminId: string;
    adminEmail: string;
    action: string;
    details?: string;
  }): Promise<AdminAuditRecord> {
    const db = this.ensureDb();
    const record: AdminAuditRecord = {
      id: crypto.randomUUID(),
      admin_id: params.adminId,
      admin_email: params.adminEmail,
      action: params.action,
      details: params.details,
      timestamp: Date.now(),
    };

    db.audit_logs.push(record);
    this.save();
    return record;
  }

  public async getAuditLogs(limit = 50): Promise<AdminAuditRecord[]> {
    const db = this.ensureDb();
    return [...db.audit_logs].sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * Helper to parse date range parameters into millisecond timestamps
   */
  public parseDateRange(
    range?: string,
    customStart?: string,
    customEnd?: string
  ): { startTime: number; endTime: number } {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000 - 1;

    if (customStart && customEnd) {
      const s = new Date(customStart).getTime();
      const e = new Date(customEnd).getTime() + 86400000 - 1;
      if (!isNaN(s) && !isNaN(e) && s <= e) {
        return { startTime: s, endTime: e };
      }
    }

    switch (range) {
      case 'today':
        return { startTime: startOfToday, endTime: endOfToday };
      case 'yesterday': {
        const startYesterday = startOfToday - 86400000;
        return { startTime: startYesterday, endTime: startOfToday - 1 };
      }
      case '7d': {
        const start7d = startOfToday - 6 * 86400000;
        return { startTime: start7d, endTime: endOfToday };
      }
      case 'this_month': {
        const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        return { startTime: startMonth, endTime: endOfToday };
      }
      case 'last_month': {
        const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
        return { startTime: startLastMonth, endTime: endLastMonth };
      }
      case 'this_year': {
        const startYear = new Date(now.getFullYear(), 0, 1).getTime();
        return { startTime: startYear, endTime: endOfToday };
      }
      case '30d':
      default: {
        const start30d = startOfToday - 29 * 86400000;
        return { startTime: start30d, endTime: endOfToday };
      }
    }
  }

  /**
   * Top-level overview summary cards & today's traffic stats
   */
  public getOverview(range?: string, customStart?: string, customEnd?: string) {
    const db = this.ensureDb();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const endOfToday = startOfToday + 86400000 - 1;

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const { startTime, endTime } = this.parseDateRange(range, customStart, customEnd);

    // 1. Standard global cards (all-time and fixed brackets)
    const totalVisitors = db.visitors.length;

    // Today's visitors (unique visitors active today)
    const todayUniqueVisitorsSet = new Set<string>();
    let todayNewVisitors = 0;
    let todayReturningVisitors = 0;

    db.visitors.forEach((v) => {
      if (v.last_seen_at >= startOfToday && v.last_seen_at <= endOfToday) {
        todayUniqueVisitorsSet.add(v.anonymous_id);
        if (v.first_seen_at >= startOfToday) {
          todayNewVisitors++;
        } else {
          todayReturningVisitors++;
        }
      }
    });

    // Month's visitors
    const monthVisitorsSet = new Set<string>();
    db.visitors.forEach((v) => {
      if (v.last_seen_at >= startOfMonth) {
        monthVisitorsSet.add(v.anonymous_id);
      }
    });

    // Year's visitors
    const yearVisitorsSet = new Set<string>();
    db.visitors.forEach((v) => {
      if (v.last_seen_at >= startOfYear) {
        yearVisitorsSet.add(v.anonymous_id);
      }
    });

    // Today's Sessions & Page Views
    const todaySessions = db.sessions.filter(
      (s) => s.started_at >= startOfToday && s.started_at <= endOfToday
    ).length;

    const todayPageViews = db.page_views.filter(
      (p) => p.timestamp >= startOfToday && p.timestamp <= endOfToday
    ).length;

    // Filtered range metrics
    const filteredVisitorsSet = new Set<string>();
    db.visitors.forEach((v) => {
      if (v.last_seen_at >= startTime && v.last_seen_at <= endTime) {
        filteredVisitorsSet.add(v.anonymous_id);
      }
    });

    const filteredEvents = db.tool_events.filter(
      (e) => e.timestamp >= startTime && e.timestamp <= endTime
    );
    const totalToolUses = filteredEvents.length;

    // Most used tool calculation within filtered range
    const toolCounts: Record<string, number> = {};
    filteredEvents.forEach((e) => {
      toolCounts[e.tool_slug] = (toolCounts[e.tool_slug] || 0) + 1;
    });

    let mostUsedToolSlug = '';
    let mostUsedToolCount = 0;
    Object.entries(toolCounts).forEach(([slug, count]) => {
      if (count > mostUsedToolCount) {
        mostUsedToolCount = count;
        mostUsedToolSlug = slug;
      }
    });

    return {
      cards: {
        totalVisitors,
        todayVisitors: todayUniqueVisitorsSet.size,
        thisMonthVisitors: monthVisitorsSet.size,
        thisYearVisitors: yearVisitorsSet.size,
        totalToolUses,
        mostUsedTool: {
          slug: mostUsedToolSlug || 'none',
          name: mostUsedToolSlug ? getToolDisplayName(mostUsedToolSlug) : 'No data yet',
          count: mostUsedToolCount,
        },
      },
      todayBreakdown: {
        totalVisitors: todayPageViews || todayUniqueVisitorsSet.size,
        uniqueVisitors: todayUniqueVisitorsSet.size,
        sessions: todaySessions,
        newVisitors: todayNewVisitors,
        returningVisitors: todayReturningVisitors,
      },
      selectedRange: {
        startTime,
        endTime,
        filteredVisitors: filteredVisitorsSet.size,
        filteredToolUses: totalToolUses,
      },
    };
  }

  /**
   * Time series visitor growth trend (Daily, Weekly, Monthly, Yearly)
   */
  public getVisitorTrend(
    range?: string,
    interval: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'daily',
    customStart?: string,
    customEnd?: string
  ) {
    const db = this.ensureDb();
    const { startTime, endTime } = this.parseDateRange(range, customStart, customEnd);

    // Grouping by interval key
    const buckets: Record<
      string,
      {
        key: string;
        label: string;
        timestamp: number;
        visitorSet: Set<string>;
        pageViews: number;
        sessionsSet: Set<string>;
      }
    > = {};

    // Helper to format bucket keys
    function getBucketKey(ts: number): { key: string; label: string } {
      const d = new Date(ts);
      if (interval === 'monthly') {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return { key, label };
      }
      if (interval === 'yearly') {
        const key = `${d.getFullYear()}`;
        return { key, label: key };
      }
      if (interval === 'weekly') {
        // Find Monday of the week
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const key = `${monday.getFullYear()}-W${Math.ceil(monday.getDate() / 7)}`;
        const label = `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        return { key, label };
      }
      // Daily
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return { key, label };
    }

    // 1. Initialize empty timeline for uniform charts
    const oneDay = 86400000;
    if (interval === 'daily') {
      for (let t = startTime; t <= endTime; t += oneDay) {
        const { key, label } = getBucketKey(t);
        if (!buckets[key]) {
          buckets[key] = {
            key,
            label,
            timestamp: t,
            visitorSet: new Set<string>(),
            pageViews: 0,
            sessionsSet: new Set<string>(),
          };
        }
      }
    }

    // 2. Populate page views
    db.page_views.forEach((pv) => {
      if (pv.timestamp >= startTime && pv.timestamp <= endTime) {
        const { key, label } = getBucketKey(pv.timestamp);
        if (!buckets[key]) {
          buckets[key] = {
            key,
            label,
            timestamp: pv.timestamp,
            visitorSet: new Set<string>(),
            pageViews: 0,
            sessionsSet: new Set<string>(),
          };
        }
        buckets[key].pageViews++;
        buckets[key].visitorSet.add(pv.anonymous_visitor_id);
        buckets[key].sessionsSet.add(pv.session_id);
      }
    });

    // 3. Populate tool events as visitor touches as well
    db.tool_events.forEach((te) => {
      if (te.timestamp >= startTime && te.timestamp <= endTime) {
        const { key, label } = getBucketKey(te.timestamp);
        if (!buckets[key]) {
          buckets[key] = {
            key,
            label,
            timestamp: te.timestamp,
            visitorSet: new Set<string>(),
            pageViews: 0,
            sessionsSet: new Set<string>(),
          };
        }
        buckets[key].visitorSet.add(te.anonymous_visitor_id);
        buckets[key].sessionsSet.add(te.session_id);
      }
    });

    const series = Object.values(buckets)
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((b) => ({
        key: b.key,
        label: b.label,
        timestamp: b.timestamp,
        visitors: b.visitorSet.size,
        pageViews: b.pageViews,
        sessions: b.sessionsSet.size,
      }));

    return series;
  }

  /**
   * Tool usage rankings and breakdown
   */
  public getToolUsage(
    range?: string,
    sort: 'most' | 'least' | 'alpha' = 'most',
    customStart?: string,
    customEnd?: string
  ) {
    const db = this.ensureDb();
    const { startTime, endTime } = this.parseDateRange(range, customStart, customEnd);

    const counts: Record<string, number> = {};
    let totalUses = 0;

    db.tool_events.forEach((te) => {
      if (te.timestamp >= startTime && te.timestamp <= endTime) {
        counts[te.tool_slug] = (counts[te.tool_slug] || 0) + 1;
        totalUses++;
      }
    });

    const list = Object.entries(counts).map(([slug, count]) => ({
      toolSlug: slug,
      toolName: getToolDisplayName(slug),
      uses: count,
      percentage: totalUses > 0 ? Number(((count / totalUses) * 100).toFixed(1)) : 0,
    }));

    if (sort === 'most') {
      list.sort((a, b) => b.uses - a.uses);
    } else if (sort === 'least') {
      list.sort((a, b) => a.uses - b.uses);
    } else if (sort === 'alpha') {
      list.sort((a, b) => a.toolName.localeCompare(b.toolName));
    }

    return {
      totalUses,
      tools: list,
    };
  }

  /**
   * Individual tool analytics drill-down
   */
  public getIndividualToolAnalytics(
    toolSlug: string,
    range?: string,
    customStart?: string,
    customEnd?: string
  ) {
    const db = this.ensureDb();
    const slug = toolSlug.toLowerCase().trim();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = startOfToday - 6 * 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    const { startTime, endTime } = this.parseDateRange(range, customStart, customEnd);

    let totalUses = 0;
    let usesToday = 0;
    let usesThisWeek = 0;
    let usesThisMonth = 0;
    let usesThisYear = 0;

    const timelineBuckets: Record<string, { date: string; label: string; count: number }> = {};

    // Pre-populate last 14 days or range
    const oneDay = 86400000;
    for (let t = startTime; t <= endTime; t += oneDay) {
      const d = new Date(t);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timelineBuckets[key] = { date: key, label, count: 0 };
    }

    db.tool_events.forEach((te) => {
      if (te.tool_slug === slug) {
        totalUses++;
        if (te.timestamp >= startOfToday) usesToday++;
        if (te.timestamp >= startOfWeek) usesThisWeek++;
        if (te.timestamp >= startOfMonth) usesThisMonth++;
        if (te.timestamp >= startOfYear) usesThisYear++;

        if (te.timestamp >= startTime && te.timestamp <= endTime) {
          const d = new Date(te.timestamp);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (timelineBuckets[key]) {
            timelineBuckets[key].count++;
          }
        }
      }
    });

    const trend = Object.values(timelineBuckets).sort((a, b) => a.date.localeCompare(b.date));

    return {
      toolSlug: slug,
      toolName: getToolDisplayName(slug),
      totalUses,
      usesToday,
      usesThisWeek,
      usesThisMonth,
      usesThisYear,
      trend,
    };
  }

  /**
   * Most visited pages
   */
  public getPageVisits(range?: string, customStart?: string, customEnd?: string) {
    const db = this.ensureDb();
    const { startTime, endTime } = this.parseDateRange(range, customStart, customEnd);

    const counts: Record<string, { views: number; visitors: Set<string> }> = {};
    let totalViews = 0;

    db.page_views.forEach((pv) => {
      if (pv.timestamp >= startTime && pv.timestamp <= endTime) {
        if (!counts[pv.path]) {
          counts[pv.path] = { views: 0, visitors: new Set() };
        }
        counts[pv.path].views++;
        counts[pv.path].visitors.add(pv.anonymous_visitor_id);
        totalViews++;
      }
    });

    const pages = Object.entries(counts)
      .map(([path, data]) => ({
        path,
        views: data.views,
        uniqueVisitors: data.visitors.size,
        percentage: totalViews > 0 ? Number(((data.views / totalViews) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.views - a.views);

    return {
      totalViews,
      pages,
    };
  }

  /**
   * Monthly visitor traffic for a selected year
   */
  public getMonthlyVisitors(targetYear = new Date().getFullYear()) {
    const db = this.ensureDb();
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const monthlyMap: Record<number, Set<string>> = {};
    for (let i = 0; i < 12; i++) {
      monthlyMap[i] = new Set();
    }

    db.visitors.forEach((v) => {
      const d = new Date(v.last_seen_at);
      if (d.getFullYear() === targetYear) {
        monthlyMap[d.getMonth()].add(v.anonymous_id);
      }
    });

    return months.map((monthName, idx) => ({
      month: monthName,
      monthIndex: idx,
      year: targetYear,
      visitors: monthlyMap[idx].size,
    }));
  }

  /**
   * Yearly visitor traffic with Year-over-Year change
   */
  public getYearlyVisitors() {
    const db = this.ensureDb();
    const yearsMap: Record<number, Set<string>> = {};

    db.visitors.forEach((v) => {
      const yr = new Date(v.last_seen_at).getFullYear();
      if (!yearsMap[yr]) {
        yearsMap[yr] = new Set();
      }
      yearsMap[yr].add(v.anonymous_id);
    });

    const sortedYears = Object.keys(yearsMap)
      .map(Number)
      .sort((a, b) => a - b);

    // If empty, list only current year with real visitor count (0)
    const currentYear = new Date().getFullYear();
    if (Object.keys(yearsMap).length === 0) {
      yearsMap[currentYear] = new Set();
    }

    const allYears = Object.keys(yearsMap)
      .map(Number)
      .sort((a, b) => a - b);

    const result = allYears.map((yr, idx) => {
      const count = yearsMap[yr].size;
      let changePercent: number | null = null;
      if (idx > 0) {
        const prevCount = yearsMap[allYears[idx - 1]].size;
        if (prevCount > 0) {
          changePercent = Number((((count - prevCount) / prevCount) * 100).toFixed(1));
        }
      }
      return {
        year: yr,
        visitors: count,
        changePercent,
      };
    });

    return result;
  }

  /**
   * Recent aggregated activity feed without PII
   */
  public getRecentActivity(limit = 15) {
    const db = this.ensureDb();
    const recent = [...db.tool_events]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
      .map((e) => {
        const toolName = getToolDisplayName(e.tool_slug);
        let actionDesc = 'used';
        if (e.event_type === 'tool_opened') actionDesc = 'opened';
        if (e.event_type === 'tool_started') actionDesc = 'started';
        if (e.event_type === 'tool_completed') actionDesc = 'completed';
        if (e.event_type === 'tool_failed') actionDesc = 'failed';

        return {
          id: e.id,
          toolSlug: e.tool_slug,
          toolName,
          eventType: e.event_type,
          description: `${toolName} — ${actionDesc}`,
          timestamp: e.timestamp,
        };
      });

    return recent;
  }

  /**
   * Generates aggregated export payload in CSV or JSON
   */
  public exportData(
    range?: string,
    format: 'csv' | 'json' = 'csv',
    customStart?: string,
    customEnd?: string
  ): { contentType: string; filename: string; content: string } {
    const dailySeries = this.getVisitorTrend(range, 'daily', customStart, customEnd);
    const { startTime, endTime } = this.parseDateRange(range, customStart, customEnd);
    const db = this.ensureDb();

    // Map tool uses per date
    const toolUsesPerDate: Record<string, number> = {};
    db.tool_events.forEach((te) => {
      if (te.timestamp >= startTime && te.timestamp <= endTime) {
        const d = new Date(te.timestamp);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        toolUsesPerDate[key] = (toolUsesPerDate[key] || 0) + 1;
      }
    });

    const exportRows = dailySeries.map((row) => ({
      date: row.key,
      visitors: row.visitors,
      pageViews: row.pageViews,
      toolUses: toolUsesPerDate[row.key] || 0,
    }));

    if (format === 'json') {
      return {
        contentType: 'application/json',
        filename: `toolino-analytics-${Date.now()}.json`,
        content: JSON.stringify(exportRows, null, 2),
      };
    }

    // CSV format
    const header = 'Date,Visitors,PageViews,ToolUses';
    const lines = exportRows.map(
      (r) => `${r.date},${r.visitors},${r.pageViews},${r.toolUses}`
    );
    const csvContent = [header, ...lines].join('\n');

    return {
      contentType: 'text/csv',
      filename: `toolino-analytics-${Date.now()}.csv`,
      content: csvContent,
    };
  }

  /**
   * Test-only helper to simulate events for benchmark testing.
   * STRICT GUARD: Never executes unless an explicit test database file is defined.
   */
  public seedMockEvents(count: number): void {
    if (!process.env.TOOLINO_ANALYTICS_FILE) {
      throw new Error(
        'SECURITY REJECTION: seedMockEvents cannot execute against production analytics. TOOLINO_ANALYTICS_FILE must be set in an isolated test environment.'
      );
    }
    const db = this.ensureDb();
    const now = Date.now();
    const slugs = Object.keys(KNOWN_TOOLS);
    const paths = ['/', '/emi-calculator', '/discount-calculator', '/pdf-summarizer', '/gst-calculator', '/image-compressor'];

    for (let i = 0; i < count; i++) {
      const anonId = `mock_anon_${i % 120}`;
      const sessId = `mock_sess_${i % 80}`;
      // Distribute timestamps over past 30 days
      const daysAgo = (i % 30) * 86400000;
      const ts = now - daysAgo - Math.floor(Math.random() * 3600000);

      // Visitor
      let v = db.visitors.find((x) => x.anonymous_id === anonId);
      if (!v) {
        v = {
          id: crypto.randomUUID(),
          anonymous_id: anonId,
          first_seen_at: ts,
          last_seen_at: ts,
          created_at: ts,
        };
        db.visitors.push(v);
      } else {
        if (ts > v.last_seen_at) v.last_seen_at = ts;
      }

      // Page view
      db.page_views.push({
        id: crypto.randomUUID(),
        session_id: sessId,
        anonymous_visitor_id: anonId,
        path: paths[i % paths.length],
        timestamp: ts,
      });

      // Tool event
      db.tool_events.push({
        id: crypto.randomUUID(),
        session_id: sessId,
        anonymous_visitor_id: anonId,
        tool_slug: slugs[i % slugs.length],
        event_type: 'tool_completed',
        timestamp: ts + 1000,
      });
    }

    this.save();
  }
}

export const analyticsDb = new AnalyticsDatabase();
