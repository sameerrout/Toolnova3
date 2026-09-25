import { QrCodeOptions } from './QrCodeGeneratorOptions';

/**
 * Escapes special characters for Wi-Fi QR code strings (§17).
 * Special characters \ ; , : " must be preceded by a backslash.
 */
export function escapeWifiString(str: string): string {
  if (!str) return '';
  return str.replace(/([\\;,:"])/g, '\\$1');
}

/**
 * Escapes special characters for vCard 3.0 strings.
 * Commas, semicolons, and backslashes must be escaped.
 */
export function escapeVCardString(str: string): string {
  if (!str) return '';
  return str.replace(/([\\;,])/g, '\\$1');
}

/**
 * Robustly constructs standardized QR payload strings.
 */
export function buildQrPayload(options: QrCodeOptions): string {
  switch (options.dataType) {
    case 'url': {
      let url = (options.url || '').trim();
      if (!url) return 'https://toolnova.com';
      if (!/^https?:\/\//i.test(url) && !url.startsWith('//')) {
        url = `https://${url}`;
      }
      return url;
    }

    case 'email': {
      const email = (options.email.address || '').trim();
      const subject = encodeURIComponent(options.email.subject || '');
      const body = encodeURIComponent(options.email.body || '');
      return `mailto:${email}?subject=${subject}&body=${body}`;
    }

    case 'phone': {
      const phone = (options.phone || '').trim().replace(/[^\d+]/g, '');
      return `tel:${phone}`;
    }

    case 'wifi': {
      const ssid = escapeWifiString(options.wifi.ssid || '');
      const enc = options.wifi.encryption || 'WPA';
      const pass = enc !== 'nopass' ? escapeWifiString(options.wifi.password || '') : '';
      return `WIFI:S:${ssid};T:${enc};P:${pass};;`;
    }

    case 'vcard': {
      const fn = escapeVCardString(options.vcard.firstName || '');
      const ln = escapeVCardString(options.vcard.lastName || '');
      const org = escapeVCardString(options.vcard.organization || '');
      const phone = (options.vcard.phone || '').trim();
      const email = (options.vcard.email || '').trim();
      const website = (options.vcard.website || '').trim();

      const lines = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${ln};${fn};;;`,
        `FN:${[fn, ln].filter(Boolean).join(' ')}`,
      ];
      if (org) lines.push(`ORG:${org}`);
      if (phone) lines.push(`TEL;TYPE=CELL:${phone}`);
      if (email) lines.push(`EMAIL:${email}`);
      if (website) lines.push(`URL:${website}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }

    case 'text':
    default:
      return (options.text || '').trim() || 'Toolnova - High-Performance Online Tools';
  }
}
