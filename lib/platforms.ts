// Mirrors REVIEW_PLATFORMS in devya-solutions/lib/seo-schemas.ts — the four
// verified B2B review directories Devya is listed on. When a profile URL is
// claimed, paste it into BOTH files so the site's Organization sameAs and the
// feedback flow both learn about it. Keep this list to real review directories
// only (no social pages) — the high-rating flow hands clients exactly these.
export const REVIEW_PLATFORMS = [
  { key: 'clutch', name: 'Clutch', url: 'https://clutch.co/profile/devya-solutions' },
  { key: 'g2', name: 'G2', url: 'https://www.g2.com/products/devya-solutions/reviews' },
  { key: 'goodfirms', name: 'GoodFirms', url: 'https://www.goodfirms.co/company/devya-solutions' },
  { key: 'trustpilot', name: 'Trustpilot', url: 'https://www.trustpilot.com/review/devya.dev' },
] as const;

export type ReviewPlatform = (typeof REVIEW_PLATFORMS)[number];
