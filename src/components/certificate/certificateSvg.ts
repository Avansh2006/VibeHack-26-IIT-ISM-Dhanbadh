import type { Verdict } from '@/components/courtroom/trialLogic';

export interface CertificateDetails {
  certificateId: string;
  issuedAt: number;
  clickCount: number;
  verdict: Verdict;
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrapText(value: string, maximumLength: number): readonly string[] {
  const words = value.split(/\s+/u);
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maximumLength && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }

  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export function createCertificateSvg(details: CertificateDetails): string {
  const date = new Date(details.issuedAt).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const rulingLines = wrapText(details.verdict.ruling, 78);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#160d23"/>
      <stop offset="0.52" stop-color="#08090d"/>
      <stop offset="1" stop-color="#221006"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#fde68a"/>
      <stop offset="0.5" stop-color="#fef3c7"/>
      <stop offset="1" stop-color="#d97706"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="12"/></filter>
  </defs>
  <rect width="1600" height="1100" fill="url(#background)"/>
  <rect x="42" y="42" width="1516" height="1016" rx="28" fill="none" stroke="#fcd34d" stroke-width="3"/>
  <rect x="64" y="64" width="1472" height="972" rx="20" fill="none" stroke="#fcd34d" stroke-opacity="0.25"/>
  <circle cx="800" cy="260" r="116" fill="#f59e0b" opacity="0.16" filter="url(#glow)"/>
  <circle cx="800" cy="260" r="88" fill="none" stroke="url(#gold)" stroke-width="5"/>
  <text x="800" y="280" text-anchor="middle" font-family="Georgia, serif" font-size="74" fill="#fde68a">⚖</text>
  <text x="800" y="130" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="9" fill="#fcd34d">THE COURT OF INTERFACE AFFAIRS</text>
  <text x="800" y="410" text-anchor="middle" font-family="Georgia, serif" font-size="70" font-weight="700" fill="#fff7ed">CERTIFIED DIGITAL MENACE</text>
  <text x="800" y="462" text-anchor="middle" font-family="Arial, sans-serif" font-size="23" letter-spacing="5" fill="#d6d3d1">THIS DOCUMENT IRRESPONSIBLY CERTIFIES THAT ITS HOLDER IS</text>
  <text x="800" y="555" text-anchor="middle" font-family="Georgia, serif" font-size="48" font-style="italic" fill="#fde68a">${escapeXml(details.verdict.menaceLevel)}</text>
  <line x1="310" y1="590" x2="1290" y2="590" stroke="#fcd34d" stroke-opacity="0.4"/>
  <text x="800" y="662" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#f8fafc">${escapeXml(details.verdict.title)}</text>
  ${rulingLines
    .map(
      (line, index) =>
        `<text x="800" y="${720 + index * 38}" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#d6d3d1">${escapeXml(line)}</text>`,
    )
    .join('\n  ')}
  <text x="230" y="935" font-family="Arial, sans-serif" font-size="20" fill="#a8a29e">EVIDENCE COUNT</text>
  <text x="230" y="980" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#fde68a">${details.clickCount}</text>
  <text x="800" y="935" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#a8a29e">ISSUED</text>
  <text x="800" y="980" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#fde68a">${escapeXml(date)}</text>
  <text x="1370" y="935" text-anchor="end" font-family="Arial, sans-serif" font-size="20" fill="#a8a29e">CERTIFICATE</text>
  <text x="1370" y="980" text-anchor="end" font-family="monospace" font-size="24" font-weight="700" fill="#fde68a">${escapeXml(details.certificateId)}</text>
</svg>`;
}

export function createCertificateDataUri(details: CertificateDetails): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createCertificateSvg(details))}`;
}

export function downloadCertificate(details: CertificateDetails): void {
  const anchor = document.createElement('a');
  anchor.href = createCertificateDataUri(details);
  anchor.download = `certified-digital-menace-${details.certificateId}.svg`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
