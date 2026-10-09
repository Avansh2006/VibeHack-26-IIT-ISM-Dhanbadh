import { describe, expect, it } from 'vitest';
import {
  createCertificateDataUri,
  createCertificateSvg,
} from '@/components/certificate/certificateSvg';

describe('digital menace certificate', () => {
  it('includes verdict details and escapes dynamic XML', () => {
    const svg = createCertificateSvg({
      certificateId: 'CASE-13',
      issuedAt: Date.UTC(2026, 9, 9),
      clickCount: 13,
      verdict: {
        title: 'Guilty <beyond doubt>',
        ruling: 'Buttons & links testified against the defendant.',
        sentence: 'Community service.',
        menaceLevel: 'Clicker "First Class"',
      },
    });

    expect(svg).toContain('CERTIFIED DIGITAL MENACE');
    expect(svg).toContain('Guilty &lt;beyond doubt&gt;');
    expect(svg).toContain('Buttons &amp; links');
    expect(svg).toContain('CASE-13');
    expect(svg).not.toContain('Guilty <beyond doubt>');
  });

  it('creates a browser-downloadable SVG data URI', () => {
    const details = {
      certificateId: 'CASE-13',
      issuedAt: Date.UTC(2026, 9, 9),
      clickCount: 13,
      verdict: {
        title: 'Guilty',
        ruling: 'The buttons testified.',
        sentence: 'Community service.',
        menaceLevel: 'First Class Menace',
      },
    };

    const uri = createCertificateDataUri(details);
    expect(uri).toMatch(/^data:image\/svg\+xml;charset=utf-8,/u);
    expect(decodeURIComponent(uri.split(',')[1] ?? '')).toBe(createCertificateSvg(details));
  });
});
