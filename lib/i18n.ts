export type Lang = 'en' | 'ar';

const en = {
  loading: 'Loading…',
  errorTitle: 'Something went wrong',
  linkExpired: 'This feedback link has expired or been closed.',
  contactUs: 'Reach out at contact@devya.dev if you believe this is a mistake.',
  hi: 'Hi',
  ratingHeadline: 'How did we do?',
  ratingSubline:
    'Your honest take shapes how we work with the next client — and helps future teams decide whether to hire us.',
  scaleLow: '1 = disappointed',
  scaleHigh: '5 = delighted',
  submitRating: 'Submit rating',
  thanksHigh: 'That means a lot — thank you.',
  pickPlatform: 'Pick a platform to leave your public review',
  pickPlatformSubline:
    "Choose whichever you already have an account on. All are third-party verified — we don't see or edit anything you write.",
  profileComingSoon: 'Profile coming soon',
  visitProfile: 'Open profile',
  thanksLow: 'Thank you for the honest feedback.',
  privateFormHead: 'Tell us what went wrong',
  privateFormSubline:
    "Your reply goes straight to Ahmed's inbox — it's not published anywhere and you'll hear back within 24 hours.",
  privatePlaceholder: 'What could we have done better?',
  submitPrivate: 'Send private feedback',
  privateSubmitted: 'Got it — you should hear from Ahmed within a day.',
  done: 'You can close this tab.',
} as const;

const ar: Record<keyof typeof en, string> = {
  loading: 'جارٍ التحميل…',
  errorTitle: 'حصلت مشكلة',
  linkExpired: 'الرابط ده منتهي أو مقفول.',
  contactUs: 'راسلنا على contact@devya.dev لو تعتقد إن ده خطأ.',
  hi: 'أهلًا',
  ratingHeadline: 'إزاي كان شغلنا معاك؟',
  ratingSubline:
    'رأيك بيأثّر على طريقة تعاملنا مع العميل اللي بعديك، وبيساعد فرق شغل تانية تقرر إذا كانوا هيوظّفونا ولا لأ.',
  scaleLow: '١ = مش راضي',
  scaleHigh: '٥ = فوق التوقع',
  submitRating: 'ابعت التقييم',
  thanksHigh: 'ده بيفرق معانا كتير — شكرًا ليك.',
  pickPlatform: 'اختار الموقع اللي تفضل تسيب فيه المراجعة',
  pickPlatformSubline:
    'اختار اللي عندك عليه حساب. كل المواقع دي بتوثّق المراجعات مع طرف ثالث — إحنا مش شايفين ولا بنعدّل حاجة بتكتبها.',
  profileComingSoon: 'الحساب هيتفتح قريب',
  visitProfile: 'افتح الحساب',
  thanksLow: 'شكرًا على الرأي الصريح.',
  privateFormHead: 'قولنا اللي حصل مظبوطًا',
  privateFormSubline:
    'ردّك بيوصل مباشرة لإيميل أحمد — مش هيتنشر في أي مكان، وهترد عليك خلال ٢٤ ساعة.',
  privatePlaceholder: 'كنا نقدر نعمل إيه أحسن؟',
  submitPrivate: 'ابعت الرأي الخاص',
  privateSubmitted: 'وصلنا — هيوصلك رد من أحمد خلال يوم.',
  done: 'ممكن تقفل الصفحة دي.',
};

export function t(lang: Lang, key: keyof typeof en): string {
  return (lang === 'ar' ? ar : en)[key];
}
