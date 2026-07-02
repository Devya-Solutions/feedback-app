// Mirrors REVIEW_PLATFORMS in devya-solutions/lib/seo-schemas.ts.
// When a profile URL is claimed, paste it into BOTH files so the
// site's Organization sameAs and the feedback flow both learn about it.
export const REVIEW_PLATFORMS = [
  { key: 'clutch', name: 'Clutch', url: '' },
  { key: 'g2', name: 'G2', url: '' },
  { key: 'goodfirms', name: 'GoodFirms', url: '' },
  { key: 'the-manifest', name: 'The Manifest', url: '' },
  { key: 'designrush', name: 'DesignRush', url: '' },
  { key: 'trustpilot', name: 'Trustpilot', url: '' },
  { key: 'upcity', name: 'UpCity', url: '' },
  { key: 'sortlist', name: 'Sortlist', url: '' },
  { key: 'agency-spotter', name: 'Agency Spotter', url: '' },
  { key: 'google', name: 'Google Business Profile', url: '' },
] as const;

export type ReviewPlatform = (typeof REVIEW_PLATFORMS)[number];
