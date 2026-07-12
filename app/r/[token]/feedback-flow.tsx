'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { api, type PublicFeedback } from '@/lib/api';
import { REVIEW_PLATFORMS } from '@/lib/platforms';
import { useT, useLocale, useSetLocale } from '@/lib/i18n/client';
import { LocaleToggle } from '@/components/ui/locale-toggle';

type Stage = 'loading' | 'error' | 'rating' | 'high' | 'low' | 'done';

const RATING_HIGH_THRESHOLD = 4;

export default function FeedbackFlow({ token }: { token: string }) {
  const [stage, setStage] = useState<Stage>('loading');
  const [data, setData] = useState<PublicFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [seededFromBackend, setSeededFromBackend] = useState(false);

  const locale = useLocale();
  const setLocale = useSetLocale();

  useEffect(() => {
    let cancelled = false;
    api.public
      .get(token)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        // If the client hasn't explicitly picked a language yet (cookie was
        // default 'en') but the backend has recorded their preferred lang as
        // 'ar', mirror that so the form matches how the outreach email
        // addressed them. Only seed once — after that the LocaleToggle wins.
        if (!seededFromBackend && res.lang === 'ar' && locale === 'en') {
          setLocale('ar');
        }
        setSeededFromBackend(true);
        if (res.hasResponded) {
          setStage('done');
        } else if (res.rating === null || res.rating === undefined) {
          setStage('rating');
        } else if (res.rating >= RATING_HIGH_THRESHOLD) {
          setStage('high');
        } else {
          setStage('low');
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'unknown error');
        setStage('error');
      });
    return () => {
      cancelled = true;
    };
    // We intentionally only run this once per token — locale/setLocale changes
    // must not re-trigger the network round trip.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRatingSubmit = async (
    rating: number,
    note?: string,
    image?: File | null,
  ) => {
    setStage('loading');
    try {
      let imageUrl: string | undefined;
      if (image) {
        try {
          imageUrl = (await api.public.uploadImage(token, image)).url;
        } catch {
          // Photo is optional — a failed upload must not block the rating.
          imageUrl = undefined;
        }
      }
      await api.public.submitRating(token, rating, {
        testimonial: note?.trim() || undefined,
        imageUrl,
      });
      setData((prev) => (prev ? { ...prev, rating } : prev));
      setStage(rating >= RATING_HIGH_THRESHOLD ? 'high' : 'low');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
      setStage('error');
    }
  };

  const handlePrivateSubmit = async (body: string) => {
    try {
      await api.public.submitPrivate(token, body);
      setStage('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
      setStage('error');
    }
  };

  const handlePlatformClick = async (platformKey: string, url: string) => {
    try {
      await api.public.trackPlatformClick(token, platformKey);
    } catch {
      // Best-effort tracking — always let the click go through.
    }
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl animate-fade-in">
        <Header clientName={data?.clientName} />

        {stage === 'loading' && <LoadingLine />}
        {stage === 'error' && <ErrorPanel message={error ?? ''} />}
        {stage === 'rating' && <RatingPanel onSubmit={handleRatingSubmit} />}
        {stage === 'high' && (
          <HighRatingPanel onPick={(p, u) => void handlePlatformClick(p, u)} />
        )}
        {stage === 'low' && (
          <PrivateFeedbackPanel onSubmit={(b) => void handlePrivateSubmit(b)} />
        )}
        {stage === 'done' && <DonePanel rating={data?.rating ?? null} />}

        {stage !== 'loading' && <PrivacyFooter />}
      </div>
    </main>
  );
}

function PrivacyFooter() {
  const t = useT();
  return (
    <p className="mt-12 border-t border-ink-800 pt-6 text-xs leading-relaxed text-ink-500">
      {t('client.privacyNote')}{' '}
      <a
        href="https://www.devya.dev/privacy-policy"
        target="_blank"
        rel="noreferrer"
        className="underline hover:text-ink-300"
      >
        {t('client.privacyPolicy')}
      </a>
    </p>
  );
}

function Header({ clientName }: { clientName?: string }) {
  const t = useT();
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-widest text-ink-400 mb-3">
          {t('shell.clientBrandTag')}
        </div>
        {clientName && (
          <div className="text-ink-300 text-sm mb-2">
            {t('client.hi')}, {clientName.split(' ')[0]}
          </div>
        )}
      </div>
      <LocaleToggle />
    </div>
  );
}

function LoadingLine() {
  const t = useT();
  return <div className="text-ink-300 mt-8">{t('client.loading')}</div>;
}

function ErrorPanel({ message }: { message: string }) {
  const t = useT();
  return (
    <div className="mt-8">
      <h1 className="text-2xl font-semibold mb-3">{t('client.errorTitle')}</h1>
      <p className="text-ink-300 mb-2">{t('client.linkExpired')}</p>
      <p className="text-ink-400 text-sm">{t('client.contactUs')}</p>
      {message && (
        <p className="text-ink-500 text-xs mt-6 font-mono">{message}</p>
      )}
    </div>
  );
}

function RatingPanel({
  onSubmit,
}: {
  onSubmit: (rating: number, note?: string, image?: File | null) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const t = useT();

  // A note or photo may be published publicly, so it needs explicit consent
  // (GDPR). A star-only rating carries no personal content and needs none.
  const hasPublishable = note.trim().length > 0 || image !== null;
  const blocked = selected === null || (hasPublishable && !consent);

  const pickImage = (file: File | null) => {
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    setImage(file);
  };

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold mb-4 leading-tight">
        {t('client.ratingHeadline')}
      </h1>
      <p className="text-ink-300 mb-8">{t('client.ratingSubline')}</p>

      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={t('client.starsAria').replace('{n}', String(n))}
            onClick={() => setSelected(n)}
            className={`w-16 h-16 rounded-full border transition-all text-2xl font-semibold ${
              selected !== null && n <= selected
                ? 'bg-yellow-400 text-ink-950 border-yellow-400'
                : 'bg-transparent border-ink-700 text-ink-500 hover:border-ink-500 hover:text-ink-300'
            }`}
          >
            {n <= (selected ?? 0) ? '★' : n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-ink-500 mb-8">
        <span>{t('client.scaleLow')}</span>
        <span>{t('client.scaleHigh')}</span>
      </div>

      {/* Optional testimonial + photo — collected alongside the stars. */}
      <label className="block text-sm text-ink-300 mb-2">
        {t('client.noteLabel')}
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t('client.notePlaceholder')}
        maxLength={4000}
        rows={4}
        className="w-full rounded-2xl bg-ink-900 border border-ink-700 p-4 text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ink-500 mb-4"
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
      />
      {preview ? (
        <div className="flex items-center gap-3 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt=""
            className="h-16 w-16 rounded-xl object-cover border border-ink-700"
          />
          <button
            type="button"
            onClick={() => pickImage(null)}
            className="text-sm text-ink-400 hover:text-ink-200 transition-colors"
          >
            {t('client.photoRemove')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border border-dashed border-ink-700 text-ink-400 px-4 py-3 mb-6 hover:border-ink-500 hover:text-ink-200 transition-colors"
        >
          {t('client.photoLabel')}
        </button>
      )}

      {hasPublishable && (
        <label className="flex items-start gap-3 mb-6 text-sm text-ink-300 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-yellow-400"
          />
          <span>{t('client.consentLabel')}</span>
        </label>
      )}

      <button
        type="button"
        disabled={blocked}
        onClick={() => !blocked && onSubmit(selected!, note, image)}
        className="w-full rounded-full bg-white text-ink-950 font-medium px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-100 transition-colors"
      >
        {t('client.submitRating')}
      </button>
      {hasPublishable && !consent && (
        <p className="mt-3 text-xs text-ink-500 text-center">
          {t('client.consentHint')}
        </p>
      )}
    </div>
  );
}

function HighRatingPanel({
  onPick,
}: {
  onPick: (platformKey: string, url: string) => void;
}) {
  const t = useT();
  const claimed = useMemo(() => REVIEW_PLATFORMS.filter((p) => p.url), []);
  const showPlaceholders = claimed.length === 0;
  return (
    <div className="mt-6">
      <div className="text-yellow-400 text-2xl mb-3">★★★★★</div>
      <h1 className="text-3xl font-semibold mb-3 leading-tight">
        {t('client.thanksHigh')}
      </h1>
      <h2 className="text-lg text-ink-100 mt-8 mb-2">
        {t('client.pickPlatform')}
      </h2>
      <p className="text-ink-400 text-sm mb-6">
        {t('client.pickPlatformSubline')}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {(showPlaceholders ? REVIEW_PLATFORMS : claimed).map((p) => {
          const disabled = !p.url;
          return (
            <button
              key={p.key}
              type="button"
              disabled={disabled}
              onClick={() => onPick(p.key, p.url)}
              className={`text-start rounded-2xl border p-4 transition-colors ${
                disabled
                  ? 'border-ink-800 bg-ink-900/50 opacity-50 cursor-not-allowed'
                  : 'border-ink-700 bg-ink-900 hover:bg-ink-800 hover:border-ink-500'
              }`}
            >
              <div className="text-base font-semibold text-ink-100">
                {p.name}
              </div>
              <div className="text-xs text-ink-500 mt-1">
                {disabled
                  ? t('client.profileComingSoon')
                  : t('client.visitProfile') + ' ↗'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrivateFeedbackPanel({
  onSubmit,
}: {
  onSubmit: (body: string) => void;
}) {
  const [body, setBody] = useState('');
  const t = useT();
  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold mb-3 leading-tight">
        {t('client.privateFormHead')}
      </h1>
      <p className="text-ink-300 mb-6">{t('client.privateFormSubline')}</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t('client.privatePlaceholder')}
        maxLength={4000}
        rows={8}
        className="w-full rounded-2xl bg-ink-900 border border-ink-700 p-4 text-ink-100 placeholder-ink-500 focus:outline-none focus:border-ink-500 mb-6"
      />
      <button
        type="button"
        disabled={body.trim().length < 4}
        onClick={() => onSubmit(body.trim())}
        className="w-full rounded-full bg-white text-ink-950 font-medium px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-100 transition-colors"
      >
        {t('client.submitPrivate')}
      </button>
    </div>
  );
}

function DonePanel({ rating }: { rating: number | null }) {
  const t = useT();
  const high = (rating ?? 0) >= RATING_HIGH_THRESHOLD;
  return (
    <div className="mt-8">
      <h1 className="text-3xl font-semibold mb-3 leading-tight">
        {high ? t('client.thanksHigh') : t('client.privateSubmitted')}
      </h1>
      <p className="text-ink-400">{t('client.done')}</p>
    </div>
  );
}
