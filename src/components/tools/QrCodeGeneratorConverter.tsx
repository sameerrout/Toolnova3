'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  QrCode,
  Globe,
  Type,
  Mail,
  Phone,
  Wifi,
  User,
  Download,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Sliders,
  CheckCircle2,
  Trash2,
  FileText,
} from 'lucide-react';
import { QrCodeOptions, QrDataType } from '@/tools/qr-code-generator/QrCodeGeneratorOptions';
import { buildQrPayload } from '@/tools/qr-code-generator/qrPayload';
import { trackToolEvent } from '@/lib/analytics/tracker';

const DEFAULT_OPTIONS: QrCodeOptions = {
  dataType: 'url',
  text: '',
  url: 'https://toolnova.com',
  email: { address: '', subject: '', body: '' },
  phone: '',
  wifi: { ssid: '', encryption: 'WPA', password: '' },
  vcard: {
    firstName: '',
    lastName: '',
    organization: '',
    phone: '',
    email: '',
    website: '',
  },
  size: 512,
  margin: 2,
  errorCorrectionLevel: 'M',
  foregroundColor: '#0f172a',
  backgroundColor: '#ffffff',
  format: 'png',
};

const COLOR_PRESETS_FG = [
  { label: 'Slate Black', value: '#0f172a' },
  { label: 'Toollino Blue', value: '#2563eb' },
  { label: 'Emerald Green', value: '#059669' },
  { label: 'Violet', value: '#7c3aed' },
  { label: 'Crimson', value: '#dc2626' },
];

const COLOR_PRESETS_BG = [
  { label: 'Pure White', value: '#ffffff' },
  { label: 'Light Slate', value: '#f8fafc' },
  { label: 'Warm Cream', value: '#fef3c7' },
];

const SIZE_PRESETS = [
  { id: 256, label: 'Small', resolution: '256 × 256 px' },
  { id: 512, label: 'Medium', resolution: '512 × 512 px' },
  { id: 1024, label: 'Large', resolution: '1024 × 1024 px' },
];

// Helper to compute contrast ratio for scannability warnings
function getLuminance(hex: string): number {
  const c = hex.replace('#', '');
  if (c.length !== 6) return 0.5;
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const a = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1: string, hex2: string): number {
  try {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  } catch {
    return 21;
  }
}

export function QrCodeGeneratorConverter() {
  const [options, setOptions] = useState<QrCodeOptions>(DEFAULT_OPTIONS);
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Desktop viewport lock (fits completely into one screen without outer scrolling)
  useEffect(() => {
    const applyOverflow = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    };

    applyOverflow();
    window.addEventListener('resize', applyOverflow);

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('resize', applyOverflow);
    };
  }, []);

  // Validation according to selected QR data type
  const validation = useMemo(() => {
    switch (options.dataType) {
      case 'url': {
        const u = options.url.trim();
        if (!u) return { valid: false, message: 'Please enter a website URL.' };
        return { valid: true };
      }
      case 'text': {
        const t = options.text.trim();
        if (!t) return { valid: false, message: 'Please enter your text message.' };
        return { valid: true };
      }
      case 'email': {
        const email = options.email.address.trim();
        if (!email) return { valid: false, message: 'Please enter a recipient email address.' };
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return { valid: false, message: 'Please enter a valid email address.' };
        }
        return { valid: true };
      }
      case 'phone': {
        const phone = options.phone.trim();
        if (!phone) return { valid: false, message: 'Please enter a phone number.' };
        if (phone.replace(/[^\d]/g, '').length < 4) {
          return { valid: false, message: 'Please enter a valid phone number.' };
        }
        return { valid: true };
      }
      case 'wifi': {
        const ssid = options.wifi.ssid.trim();
        if (!ssid) return { valid: false, message: 'Please enter your Wi-Fi network name (SSID).' };
        if (options.wifi.encryption !== 'nopass' && !options.wifi.password) {
          return { valid: false, message: 'Please enter your Wi-Fi password.' };
        }
        return { valid: true };
      }
      case 'vcard': {
        const fn = options.vcard.firstName.trim();
        const ln = options.vcard.lastName.trim();
        const phone = options.vcard.phone.trim();
        const email = options.vcard.email.trim();
        if (!fn && !ln && !phone && !email) {
          return { valid: false, message: 'Please enter at least a name, phone, or email for the contact.' };
        }
        return { valid: true };
      }
      default:
        return { valid: true };
    }
  }, [options]);

  // Contrast check
  const contrastRatio = useMemo(() => {
    return getContrastRatio(options.foregroundColor, options.backgroundColor);
  }, [options.foregroundColor, options.backgroundColor]);

  const hasLowContrast = contrastRatio < 2.8;

  // Build the standardized payload
  const payload = useMemo(() => {
    if (!validation.valid) return '';
    return buildQrPayload(options);
  }, [options, validation.valid]);

  // Live QR Generation Effect (Debounced)
  useEffect(() => {
    if (!validation.valid || !payload) {
      setDataUrl('');
      setSvgString('');
      return;
    }

    let isMounted = true;
    setIsGenerating(true);
    setGenerationError(null);

    const timer = setTimeout(async () => {
      try {
        const qrOpts: QRCode.QRCodeToDataURLOptions = {
          width: options.size,
          margin: options.margin,
          errorCorrectionLevel: options.errorCorrectionLevel,
          color: {
            dark: options.foregroundColor,
            light: options.backgroundColor,
          },
        };

        const png = await QRCode.toDataURL(payload, qrOpts);
        const svg = await QRCode.toString(payload, {
          ...qrOpts,
          type: 'svg',
        });

        if (isMounted) {
          setDataUrl(png);
          setSvgString(svg);
          setIsGenerating(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to generate live QR code:', err);
          setGenerationError('Unable to generate QR code with current parameters.');
          setIsGenerating(false);
        }
      }
    }, 60);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [payload, options.size, options.margin, options.errorCorrectionLevel, options.foregroundColor, options.backgroundColor, validation.valid]);

  // Download Action
  const handleDownload = useCallback(() => {
    if (!validation.valid || (!dataUrl && !svgString)) return;

    trackToolEvent('qr-code-generator', 'tool_completed');
    const a = document.createElement('a');

    if (options.format === 'svg') {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `qrcode_${options.dataType}_${Date.now()}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      a.href = dataUrl;
      a.download = `qrcode_${options.dataType}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [dataUrl, svgString, options.format, options.dataType, validation.valid]);

  // Copy Action
  const handleCopy = async () => {
    if (!validation.valid || !dataUrl) return;

    try {
      if (options.format === 'svg' && svgString) {
        await navigator.clipboard.writeText(svgString);
      } else {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback: copy payload text
      if (payload) {
        await navigator.clipboard.writeText(payload);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    }
  };

  // Reset Customization (Keeps entered content)
  const handleResetCustomization = () => {
    setOptions((prev) => ({
      ...prev,
      size: DEFAULT_OPTIONS.size,
      margin: DEFAULT_OPTIONS.margin,
      errorCorrectionLevel: DEFAULT_OPTIONS.errorCorrectionLevel,
      foregroundColor: DEFAULT_OPTIONS.foregroundColor,
      backgroundColor: DEFAULT_OPTIONS.backgroundColor,
      format: DEFAULT_OPTIONS.format,
    }));
  };

  // Clear Input Data (Returns to empty state)
  const handleClearContent = () => {
    setOptions((prev) => ({
      ...prev,
      text: '',
      url: '',
      email: { address: '', subject: '', body: '' },
      phone: '',
      wifi: { ssid: '', encryption: 'WPA', password: '' },
      vcard: {
        firstName: '',
        lastName: '',
        organization: '',
        phone: '',
        email: '',
        website: '',
      },
    }));
  };

  // Content Type Tab Definitions
  const qrTypes: { id: QrDataType; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: 'Website', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'text', label: 'Text', icon: <Type className="w-3.5 h-3.5" /> },
    { id: 'email', label: 'Email', icon: <Mail className="w-3.5 h-3.5" /> },
    { id: 'phone', label: 'Phone', icon: <Phone className="w-3.5 h-3.5" /> },
    { id: 'wifi', label: 'Wi-Fi', icon: <Wifi className="w-3.5 h-3.5" /> },
    { id: 'vcard', label: 'Contact', icon: <User className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="bg-[#f8fafc] w-full min-h-[calc(100vh-72px)] lg:h-[calc(100vh-72px)] lg:max-h-[calc(100vh-72px)] lg:overflow-hidden flex flex-col font-sans">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-2 sm:py-3 flex-1 flex flex-col justify-between min-h-0">
        {/* ========================================================================= */}
        {/* TOP SECTION: Breadcrumb + Header + Privacy Badge                          */}
        {/* ========================================================================= */}
        <div className="shrink-0 space-y-1.5">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/utility-tools" className="hover:text-blue-600 transition-colors">
              Tools
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-bold text-slate-900">QR Code Generator</span>
          </nav>

          {/* Compact Page Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 bg-blue-600 rounded-xl flex flex-col items-center justify-center text-white shadow-2xs shrink-0 relative overflow-hidden"
                aria-hidden="true"
              >
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-700 rounded-bl-sm"></div>
                <QrCode className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    QR Code Generator
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-200/60 rounded-full">
                    v1.0.0
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">
                  Create a QR code quickly, customize it, preview it instantly, and download it.
                </p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-full px-3 py-1 flex items-center gap-1.5 shadow-2xs shrink-0">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-semibold text-slate-800 hidden sm:inline">
                Generated securely on your device
              </span>
              <span className="text-[11px] text-emerald-700 font-medium sm:before:content-['•_'] sm:before:mr-1">
                100% private
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN WORKSPACE: Two-Column SaaS Layout (Left Settings + Right Preview)     */}
        {/* ========================================================================= */}
        <div className="flex-1 min-h-0 my-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80">
            {/* --------------------------------------------------------------------- */}
            {/* LEFT COLUMN: QR Type Selection + Dynamic Input + Customization        */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-7 flex flex-col min-h-0 bg-white p-3 sm:p-4 overflow-y-auto">
              <div className="space-y-4 text-xs">
                {/* 1. What should this QR code contain? */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 block">
                      What should this QR code contain?
                    </label>
                    <button
                      type="button"
                      onClick={handleClearContent}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition flex items-center gap-1 cursor-pointer font-medium"
                      title="Clear entered information"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {qrTypes.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setOptions((prev) => ({ ...prev, dataType: t.id }));
                          trackToolEvent('qr-code-generator', 'tool_started');
                        }}
                        className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                          options.dataType === t.id
                            ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs ring-1 ring-blue-600/30'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white hover:border-slate-300'
                        }`}
                      >
                        {t.icon}
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Dynamic Input Form Area */}
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
                  {/* WEBSITE URL */}
                  {options.dataType === 'url' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Website URL
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          value={options.url}
                          onChange={(e) => setOptions((prev) => ({ ...prev, url: e.target.value }))}
                          placeholder="https://example.com"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Scanning the QR code will instantly open this URL in the user&apos;s browser.
                      </p>
                    </div>
                  )}

                  {/* PLAIN TEXT */}
                  {options.dataType === 'text' && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-700">
                          Your Text
                        </label>
                        <span className="text-[10px] text-slate-400">
                          {options.text.length} characters
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        value={options.text}
                        onChange={(e) => setOptions((prev) => ({ ...prev, text: e.target.value }))}
                        placeholder="Enter your message, notes, serial number, or instructions..."
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition shadow-2xs resize-none"
                      />
                    </div>
                  )}

                  {/* EMAIL */}
                  {options.dataType === 'email' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={options.email.address}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              email: { ...prev.email, address: e.target.value },
                            }))
                          }
                          placeholder="name@example.com"
                          className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Subject (Optional)
                          </label>
                          <input
                            type="text"
                            value={options.email.subject}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                email: { ...prev.email, subject: e.target.value },
                              }))
                            }
                            placeholder="Inquiry / Feedback"
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Message (Optional)
                          </label>
                          <input
                            type="text"
                            value={options.email.body}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                email: { ...prev.email, body: e.target.value },
                              }))
                            }
                            placeholder="Pre-filled message..."
                            className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PHONE NUMBER */}
                  {options.dataType === 'phone' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={options.phone}
                        onChange={(e) => setOptions((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 555 123 4567"
                        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition shadow-2xs"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Include country code so international scanners can dial directly.
                      </p>
                    </div>
                  )}

                  {/* WI-FI NETWORK */}
                  {options.dataType === 'wifi' && (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Network Name (SSID)
                        </label>
                        <input
                          type="text"
                          value={options.wifi.ssid}
                          onChange={(e) =>
                            setOptions((prev) => ({
                              ...prev,
                              wifi: { ...prev.wifi, ssid: e.target.value },
                            }))
                          }
                          placeholder="Office-Guest-WiFi"
                          className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                            Security
                          </label>
                          <select
                            value={options.wifi.encryption}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                wifi: {
                                  ...prev.wifi,
                                  encryption: e.target.value as 'WPA' | 'WEP' | 'nopass',
                                },
                              }))
                            }
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                          >
                            <option value="WPA">WPA / WPA2 / WPA3</option>
                            <option value="WEP">WEP</option>
                            <option value="nopass">None (Open Network)</option>
                          </select>
                        </div>
                        {options.wifi.encryption !== 'nopass' && (
                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="text-[11px] font-semibold text-slate-600">
                                Password
                              </label>
                              <button
                                type="button"
                                onClick={() => setShowPassword((p) => !p)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                              >
                                {showPassword ? (
                                  <>
                                    <EyeOff className="w-3 h-3" />
                                    <span>Hide</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3" />
                                    <span>Show</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={options.wifi.password}
                              onChange={(e) =>
                                setOptions((prev) => ({
                                  ...prev,
                                  wifi: { ...prev.wifi, password: e.target.value as '' },
                                }))
                              }
                              placeholder="Wi-Fi Password"
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none transition shadow-2xs"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* VCARD CONTACT */}
                  {options.dataType === 'vcard' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={options.vcard.firstName}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                vcard: { ...prev.vcard, firstName: e.target.value },
                              }))
                            }
                            placeholder="John"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={options.vcard.lastName}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                vcard: { ...prev.vcard, lastName: e.target.value },
                              }))
                            }
                            placeholder="Doe"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Organization
                          </label>
                          <input
                            type="text"
                            value={options.vcard.organization}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                vcard: { ...prev.vcard, organization: e.target.value },
                              }))
                            }
                            placeholder="Acme Corp"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={options.vcard.phone}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                vcard: { ...prev.vcard, phone: e.target.value },
                              }))
                            }
                            placeholder="+1 555 123 4567"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Email
                          </label>
                          <input
                            type="email"
                            value={options.vcard.email}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                vcard: { ...prev.vcard, email: e.target.value },
                              }))
                            }
                            placeholder="john@example.com"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                            Website
                          </label>
                          <input
                            type="url"
                            value={options.vcard.website}
                            onChange={(e) =>
                              setOptions((prev) => ({
                                ...prev,
                                vcard: { ...prev.vcard, website: e.target.value },
                              }))
                            }
                            placeholder="https://example.com"
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-2xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Validation Error Message */}
                  {!validation.valid && (
                    <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                      <span>{validation.message}</span>
                    </div>
                  )}
                </div>

                {/* 3. Customization Section */}
                <div className="space-y-3 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Customization
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCustomization}
                      className="text-[11px] text-slate-400 hover:text-blue-600 transition flex items-center gap-1 cursor-pointer font-medium"
                      title="Reset styling to defaults"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Color Pickers & Presets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Foreground Color */}
                    <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">
                          QR Color
                        </label>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {options.foregroundColor}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={options.foregroundColor}
                          onChange={(e) =>
                            setOptions((prev) => ({ ...prev, foregroundColor: e.target.value }))
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                          title="Choose custom QR color"
                        />
                        <div className="flex items-center gap-1 flex-wrap">
                          {COLOR_PRESETS_FG.map((p) => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() =>
                                setOptions((prev) => ({ ...prev, foregroundColor: p.value }))
                              }
                              className={`w-6 h-6 rounded-md border transition cursor-pointer ${
                                options.foregroundColor.toLowerCase() === p.value.toLowerCase()
                                  ? 'ring-2 ring-blue-600 border-white scale-110'
                                  : 'border-slate-300 hover:scale-105'
                              }`}
                              style={{ backgroundColor: p.value }}
                              title={p.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Background Color */}
                    <div className="p-2.5 bg-slate-50/60 rounded-xl border border-slate-200/70 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-700">
                          Background
                        </label>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {options.backgroundColor}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={options.backgroundColor}
                          onChange={(e) =>
                            setOptions((prev) => ({ ...prev, backgroundColor: e.target.value }))
                          }
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300 p-0.5 bg-white shrink-0"
                          title="Choose custom background color"
                        />
                        <div className="flex items-center gap-1 flex-wrap">
                          {COLOR_PRESETS_BG.map((p) => (
                            <button
                              key={p.value}
                              type="button"
                              onClick={() =>
                                setOptions((prev) => ({ ...prev, backgroundColor: p.value }))
                              }
                              className={`w-6 h-6 rounded-md border transition cursor-pointer ${
                                options.backgroundColor.toLowerCase() === p.value.toLowerCase()
                                  ? 'ring-2 ring-blue-600 border-slate-400 scale-110'
                                  : 'border-slate-300 hover:scale-105'
                              }`}
                              style={{ backgroundColor: p.value }}
                              title={p.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contrast Scannability Warning */}
                  {hasLowContrast && (
                    <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px]">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        This color combination may be difficult to scan. Consider using a darker QR color.
                      </span>
                    </div>
                  )}

                  {/* Size & Error Correction Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Size Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        QR Size
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {SIZE_PRESETS.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setOptions((prev) => ({ ...prev, size: s.id }))}
                            className={`px-1.5 py-1.5 rounded-lg border text-[11px] font-semibold transition cursor-pointer text-center ${
                              options.size === s.id
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-slate-200 hover:bg-slate-50 text-slate-700 bg-white'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Error Correction */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Error Correction
                      </label>
                      <select
                        value={options.errorCorrectionLevel}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H',
                          }))
                        }
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="L">Low (7% recovery)</option>
                        <option value="M">Standard (15% recovery)</option>
                        <option value="Q">Quartile (25% recovery)</option>
                        <option value="H">High (30% recovery)</option>
                      </select>
                    </div>

                    {/* Margin / Quiet Zone */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Margin (Quiet Zone)
                      </label>
                      <select
                        value={options.margin}
                        onChange={(e) =>
                          setOptions((prev) => ({
                            ...prev,
                            margin: parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="1">1 (Compact)</option>
                        <option value="2">2 (Standard)</option>
                        <option value="4">4 (Wide spacing)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* RIGHT COLUMN: Live QR Preview + Download Actions                      */}
            {/* --------------------------------------------------------------------- */}
            <div className="lg:col-span-5 flex flex-col justify-between min-h-0 bg-slate-50/60 p-4 sm:p-5">
              {/* Preview Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/70 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Live Preview</span>
                  {validation.valid && dataUrl && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Ready to scan
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {options.size} × {options.size} px
                </span>
              </div>

              {/* QR Preview Graphic Viewport */}
              <div className="flex-1 flex items-center justify-center p-3 my-2">
                <div className="w-full max-w-[280px] sm:max-w-[300px] aspect-square bg-white rounded-2xl border border-slate-200 shadow-md p-4 flex flex-col items-center justify-center relative overflow-hidden transition-all">
                  {validation.valid && dataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={dataUrl}
                      alt="Generated QR Code"
                      className="w-full h-full object-contain select-none transition-transform duration-200"
                    />
                  ) : (
                    /* Friendly Empty State */
                    <div className="flex flex-col items-center justify-center text-center p-4 space-y-2 select-none">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                        <QrCode className="w-6 h-6" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-700">
                        Your QR code will appear here
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-[200px]">
                        Enter information on the left to generate your live QR code.
                      </p>
                    </div>
                  )}

                  {isGenerating && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-2xs flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Format Selector & Download Card */}
              <div className="space-y-2.5 pt-2 border-t border-slate-200/70 shrink-0">
                {/* Format Tabs (PNG vs SVG) */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-600">
                    Download Format:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setOptions((prev) => ({ ...prev, format: 'png' }))}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        options.format === 'png'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      PNG (Raster)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOptions((prev) => ({ ...prev, format: 'svg' }))}
                      className={`px-3 py-1 text-[11px] font-bold rounded-md transition cursor-pointer ${
                        options.format === 'svg'
                          ? 'bg-white text-blue-700 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      SVG (Vector)
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    disabled={!validation.valid || !dataUrl}
                    className={`col-span-1 py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
                      !validation.valid || !dataUrl
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isCopied
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!validation.valid || (!dataUrl && !svgString)}
                    className={`col-span-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white shadow-2xs transition flex items-center justify-center gap-2 ${
                      !validation.valid || (!dataUrl && !svgString)
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-[0.99] cursor-pointer'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download QR Code ({options.format.toUpperCase()})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM METADATA BAR */}
        <div className="shrink-0 pt-1 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <span>Clean, permanent QR codes</span>
            <span>•</span>
            <span>No expiration</span>
            <span>•</span>
            <span>Commercial-use ready</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Powered by Toollino Core Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
