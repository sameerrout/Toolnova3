import { EditorPage } from './types';

// High quality vector illustration of modern silver laptop on desk with plant and Toolino dashboard
export const LAPTOP_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 340" width="500" height="340">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
    <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="50%" stop-color="#cbd5e1"/>
      <stop offset="100%" stop-color="#94a3b8"/>
    </linearGradient>
    <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>

  <!-- Background scene -->
  <rect width="500" height="340" fill="url(#bgGrad)" rx="8"/>
  <line x1="0" y1="270" x2="500" y2="270" stroke="#cbd5e1" stroke-width="2"/>

  <!-- Potted plant on left -->
  <ellipse cx="60" cy="270" rx="22" ry="6" fill="#94a3b8" opacity="0.3"/>
  <!-- Pot -->
  <path d="M 45 235 L 75 235 L 70 270 L 50 270 Z" fill="url(#potGrad)" stroke="#cbd5e1" stroke-width="1.5"/>
  <!-- Plant Leaves -->
  <path d="M 60 235 C 50 210 35 205 30 195 C 45 205 58 220 60 235" fill="#22c55e"/>
  <path d="M 60 235 C 55 200 65 180 70 170 C 72 190 68 215 60 235" fill="#16a34a"/>
  <path d="M 60 235 C 70 215 85 205 92 198 C 82 212 70 225 60 235" fill="#4ade80"/>
  <path d="M 60 235 C 40 225 45 210 40 205 C 52 215 58 225 60 235" fill="#15803d"/>

  <!-- Laptop Base Shadow -->
  <ellipse cx="280" cy="275" rx="170" ry="12" fill="#64748b" opacity="0.25"/>

  <!-- Laptop Screen Lid -->
  <g transform="perspective(600)">
    <!-- Outer screen frame -->
    <rect x="150" y="55" width="260" height="175" rx="8" fill="url(#metal)" stroke="#94a3b8" stroke-width="1.5"/>
    <rect x="156" y="61" width="248" height="161" rx="4" fill="#0f172a"/>
    <!-- Web Camera dot -->
    <circle cx="280" cy="58" r="2" fill="#475569"/>

    <!-- Screen Content: Toolino Dashboard -->
    <rect x="160" y="65" width="240" height="153" fill="url(#screenGrad)"/>
    
    <!-- Toolino Logo on Screen -->
    <circle cx="280" cy="115" r="22" fill="#2563eb" opacity="0.9"/>
    <circle cx="288" cy="110" r="14" fill="#38bdf8" opacity="0.8"/>
    <path d="M 272 125 L 272 105 L 288 125 L 288 105" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="280" y="152" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="bold" text-anchor="middle" letter-spacing="1">Toolino</text>
    <text x="280" y="168" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="8" text-anchor="middle">Privacy-First Cloud Utilities</text>
    
    <!-- Mini UI dashboard lines on screen -->
    <rect x="175" y="182" width="60" height="6" rx="2" fill="#3b82f6" opacity="0.8"/>
    <rect x="245" y="182" width="50" height="6" rx="2" fill="#10b981" opacity="0.8"/>
    <rect x="305" y="182" width="60" height="6" rx="2" fill="#8b5cf6" opacity="0.8"/>
    <rect x="175" y="195" width="210" height="4" rx="2" fill="#334155"/>
  </g>

  <!-- Laptop Base Body (Keyboard portion) -->
  <path d="M 100 230 L 460 230 L 440 270 L 120 270 Z" fill="url(#metal)" stroke="#94a3b8" stroke-width="1.5"/>
  <!-- Front notch indent -->
  <path d="M 260 270 L 300 270 L 295 273 L 265 273 Z" fill="#94a3b8"/>

  <!-- Keyboard area -->
  <polygon points="140,233 420,233 408,252 152,252" fill="#334155" opacity="0.85"/>
  <!-- Key rows indication -->
  <line x1="145" y1="237" x2="415" y2="237" stroke="#475569" stroke-width="1.5" stroke-dasharray="8 3"/>
  <line x1="148" y1="242" x2="412" y2="242" stroke="#475569" stroke-width="1.5" stroke-dasharray="9 3"/>
  <line x1="151" y1="247" x2="409" y2="247" stroke="#475569" stroke-width="1.5" stroke-dasharray="12 4"/>

  <!-- Trackpad -->
  <polygon points="255,255 305,255 303,267 257,267" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1"/>
</svg>
`)}`;

export const INITIAL_PAGES: EditorPage[] = [
  // Page 1: Project Proposal (Exact replica of the screenshot)
  {
    id: 'page-1',
    pageNumber: 1,
    rotation: 0,
    title: 'Project Proposal',
    customTemplateType: 'proposal',
    elements: [
      {
        id: 'p1-text-intro',
        type: 'text',
        text: 'Toolino is a comprehensive online toolkit designed to help users get things done — faster, easier, and smarter. From PDF editing to image conversion, calculators to AI-powered tools, we bring everything you need in one place.',
        x: 42,
        y: 205,
        width: 250,
        height: 75,
        fontSize: 10,
        fontFamily: 'Inter',
        color: '#1e293b',
        bold: false,
        italic: false,
        underline: false,
        align: 'left',
      },
      {
        id: 'p1-img-laptop',
        type: 'image',
        src: LAPTOP_SVG_DATA_URL,
        x: 305,
        y: 175,
        width: 245,
        height: 165,
        alt: 'Laptop on desk showing Toolino',
      },
    ],
    drawings: [],
  },
  // Page 2: Executive Summary
  {
    id: 'page-2',
    pageNumber: 2,
    rotation: 0,
    title: 'Executive Summary',
    customTemplateType: 'summary',
    elements: [],
    drawings: [],
  },
  // Page 3: Market Metrics & Analytical Charts
  {
    id: 'page-3',
    pageNumber: 3,
    rotation: 0,
    title: 'Market Metrics & Analytics',
    customTemplateType: 'metrics',
    elements: [],
    drawings: [],
  },
  // Page 4: Technical Specifications & Roadmap
  {
    id: 'page-4',
    pageNumber: 4,
    rotation: 0,
    title: 'Technical Specifications',
    customTemplateType: 'roadmap',
    elements: [],
    drawings: [],
  },
  // Page 5: Thank You & Contact
  {
    id: 'page-5',
    pageNumber: 5,
    rotation: 0,
    title: 'Thank You & Sign-off',
    customTemplateType: 'thankyou',
    elements: [],
    drawings: [],
  },
];
