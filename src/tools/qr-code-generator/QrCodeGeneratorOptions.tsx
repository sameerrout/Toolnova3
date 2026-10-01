'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Copy, Download, Check, QrCode, Globe, Mail, Phone, Wifi, User, Type } from 'lucide-react';

import { buildQrPayload } from './qrPayload';

export type QrDataType = 'text' | 'url' | 'email' | 'phone' | 'wifi' | 'vcard';

export interface QrCodeOptions {
  dataType: QrDataType;
  text: string;
  url: string;
  email: { address: string; subject: string; body: string };
  phone: string;
  wifi: { ssid: string; encryption: 'WPA' | 'WEP' | 'nopass'; password: '' };
  vcard: {
    firstName: string;
    lastName: string;
    organization: string;
    phone: string;
    email: string;
    website: string;
  };
  size: number;
  margin: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  foregroundColor: string;
  backgroundColor: string;
  format: 'png' | 'svg';
}

interface QrCodeGeneratorOptionsProps {
  options: QrCodeOptions;
  onChange: (options: QrCodeOptions) => void;
  disabled?: boolean;
}

export function QrCodeGeneratorOptionsComponent({
  options,
  onChange,
  disabled = false,
}: QrCodeGeneratorOptionsProps) {
  const [copied, setCopied] = useState(false);
  const [dataUrl, setDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const payload = buildQrPayload(options);

  // Render live preview
  useEffect(() => {
    let isCancelled = false;

    async function generate() {
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

        const pngUrl = await QRCode.toDataURL(payload, qrOpts);
        const svg = await QRCode.toString(payload, {
          ...qrOpts,
          type: 'svg',
        });

        if (!isCancelled) {
          setDataUrl(pngUrl);
          setSvgString(svg);
        }
      } catch (err) {
        console.error('Failed to generate live QR preview', err);
      }
    }

    generate();

    return () => {
      isCancelled = true;
    };
  }, [payload, options]);

  const handleCopy = async () => {
    try {
      if (options.format === 'svg') {
        await navigator.clipboard.writeText(svgString);
      } else {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback copy text
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDirectDownload = () => {
    const a = document.createElement('a');
    if (options.format === 'svg') {
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      a.href = URL.createObjectURL(blob);
      a.download = `toolino-qr-${Date.now()}.svg`;
    } else {
      a.href = dataUrl;
      a.download = `toolino-qr-${Date.now()}.png`;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const types: { id: QrDataType; label: string; icon: React.ReactNode }[] = [
    { id: 'url', label: 'URL / Link', icon: <Globe className="w-4 h-4" /> },
    { id: 'text', label: 'Plain Text', icon: <Type className="w-4 h-4" /> },
    { id: 'email', label: 'Email', icon: <Mail className="w-4 h-4" /> },
    { id: 'phone', label: 'Phone', icon: <Phone className="w-4 h-4" /> },
    { id: 'wifi', label: 'Wi-Fi', icon: <Wifi className="w-4 h-4" /> },
    { id: 'vcard', label: 'vCard Contact', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      {/* Configuration Column */}
      <div className="lg:col-span-7 space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
            QR Code Content Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ ...options, dataType: t.id })}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                  options.dataType === t.id
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Inputs according to selected type */}
        <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3.5">
          {options.dataType === 'url' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Website URL
              </label>
              <input
                type="url"
                disabled={disabled}
                value={options.url}
                onChange={(e) => onChange({ ...options, url: e.target.value })}
                placeholder="https://example.com"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {options.dataType === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Plain Text Message
              </label>
              <textarea
                disabled={disabled}
                rows={3}
                value={options.text}
                onChange={(e) => onChange({ ...options, text: e.target.value })}
                placeholder="Enter any text message, instructions, or code..."
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              />
            </div>
          )}

          {options.dataType === 'email' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  disabled={disabled}
                  value={options.email.address}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      email: { ...options.email, address: e.target.value },
                    })
                  }
                  placeholder="name@company.com"
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={options.email.subject}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      email: { ...options.email, subject: e.target.value },
                    })
                  }
                  placeholder="Inquiry / Feedback"
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {options.dataType === 'phone' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number (with Country Code)
              </label>
              <input
                type="tel"
                disabled={disabled}
                value={options.phone}
                onChange={(e) => onChange({ ...options, phone: e.target.value })}
                placeholder="+1 234 567 8900"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {options.dataType === 'wifi' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Wi-Fi Network Name (SSID)
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={options.wifi.ssid}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      wifi: { ...options.wifi, ssid: e.target.value },
                    })
                  }
                  placeholder="Office-Guest-WiFi"
                  className="w-full text-sm px-3.5 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Security Encryption
                  </label>
                  <select
                    disabled={disabled}
                    value={options.wifi.encryption}
                    onChange={(e) =>
                      onChange({
                        ...options,
                        wifi: {
                          ...options.wifi,
                          encryption: e.target.value as any,
                        },
                      })
                    }
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">None (Open)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    disabled={disabled}
                    value={options.wifi.password}
                    onChange={(e) =>
                      onChange({
                        ...options,
                        wifi: { ...options.wifi, password: e.target.value as any },
                      })
                    }
                    placeholder="WiFi Password"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {options.dataType === 'vcard' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={options.vcard.firstName}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      vcard: { ...options.vcard, firstName: e.target.value },
                    })
                  }
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={options.vcard.lastName}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      vcard: { ...options.vcard, lastName: e.target.value },
                    })
                  }
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Organization
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={options.vcard.organization}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      vcard: { ...options.vcard, organization: e.target.value },
                    })
                  }
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  disabled={disabled}
                  value={options.vcard.phone}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      vcard: { ...options.vcard, phone: e.target.value },
                    })
                  }
                  className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Styling & Customization Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Foreground
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={disabled}
                value={options.foregroundColor}
                onChange={(e) =>
                  onChange({ ...options, foregroundColor: e.target.value })
                }
                className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <span className="text-xs font-mono text-slate-600">
                {options.foregroundColor}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                disabled={disabled}
                value={options.backgroundColor}
                onChange={(e) =>
                  onChange({ ...options, backgroundColor: e.target.value })
                }
                className="w-9 h-9 rounded cursor-pointer border border-slate-300 p-0.5 bg-white"
              />
              <span className="text-xs font-mono text-slate-600">
                {options.backgroundColor}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Error Correction
            </label>
            <select
              disabled={disabled}
              value={options.errorCorrectionLevel}
              onChange={(e) =>
                onChange({
                  ...options,
                  errorCorrectionLevel: e.target.value as any,
                })
              }
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="L">Low (7%)</option>
              <option value="M">Medium (15%)</option>
              <option value="Q">Quartile (25%)</option>
              <option value="H">High (30%)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Format
            </label>
            <select
              disabled={disabled}
              value={options.format}
              onChange={(e) =>
                onChange({ ...options, format: e.target.value as any })
              }
              className="w-full text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="png">PNG (Raster)</option>
              <option value="svg">SVG (Vector)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-5 flex flex-col items-center justify-between border-t lg:border-t-0 lg:border-l border-slate-200 pt-6 lg:pt-0 lg:pl-8">
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold text-slate-900">Live Preview</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {options.size}x{options.size} px
          </span>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl w-full max-w-[280px] aspect-square">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Generated QR Code"
              className="w-full h-full object-contain rounded-lg shadow-sm bg-white p-2"
            />
          ) : (
            <div className="text-xs text-slate-400">Rendering preview...</div>
          )}
        </div>

        <div className="w-full grid grid-cols-2 gap-3 mt-6">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDirectDownload}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download {options.format.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
