// Mirrors REVIEW_PLATFORMS in devya-solutions/lib/seo-schemas.ts.
// When a profile URL is claimed, paste it into BOTH files so the
// site's Organization sameAs and the feedback flow both learn about it.
// Exception: Facebook is flow-only here — its page identity already lives in
// seo-schemas SAME_AS, so we don't duplicate it into that file's REVIEW_PLATFORMS.
export const REVIEW_PLATFORMS = [
  { key: 'clutch', name: 'Clutch', url: 'https://clutch.co/profile/devya-solutions' },
  { key: 'g2', name: 'G2', url: 'https://www.g2.com/products/devya-solutions/reviews' },
  { key: 'goodfirms', name: 'GoodFirms', url: '' },
  { key: 'the-manifest', name: 'The Manifest', url: '' },
  { key: 'trustpilot', name: 'Trustpilot', url: 'https://www.trustpilot.com/review/devya.dev' },
  { key: 'facebook', name: 'Facebook', url: 'https://www.facebook.com/devyasoftware/reviews' },
  { key: 'google', name: 'Google Business Profile', url: '' },
] as const;

export type ReviewPlatform = (typeof REVIEW_PLATFORMS)[number];
