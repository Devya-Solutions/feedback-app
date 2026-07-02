'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, type PublicFeedback } from '@/lib/api';
import { REVIEW_PLATFORMS } from '@/lib/platforms';
import { t, type Lang } from '@/lib/i18n';

type Stage = 'loading' | 'error' | 'rating' | 'high' | 'low' | 'done';

const RATING_HIGH_THRESHOLD = 4;

export default function FeedbackFlow({ token }: { token: string }) {
  const [stage, setStage] = useState<Stage>('loading');
  const [data, setData] = useState<PublicFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.public
      .get(token)
      .then((res) => {
        if (cancelled) return;
        setData(res);
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
  }, [token]);

  const lang: Lang = (data?.lang as Lang) ?? 'en';

  const handleRatingSubmit = async (rating: number) => {
    setStage('loading');
    try {
      await api.public.submitRating(token, rating);
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
    <main
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen flex items-center justify-center px-6 py-16"
    >
      <div className="w-full max-w-xl animate-fade-in">
        <Header lang={lang} clientName={data?.clientName} />

        {stage === 'loading' && (
          <div className="text-ink-300 mt-8">{t(lang, 'loading')}</div>
        )}
        {stage === 'error' && (
          <ErrorPanel lang={lang} message={error ?? ''} />
        )}
        {stage === 'rating' && (
          <RatingPanel lang={lang} onSubmit={handleRatingSubmit} />
        )}
        {stage === 'high' && (
          <HighRatingPanel
            lang={lang}
            onPick={(p, u) => void handlePlatformClick(p, u)}
          />
        )}
        {stage === 'low' && (
          <PrivateFeedbackPanel
            lang={lang}
            onSubmit={(b) => void handlePrivateSubmit(b)}
          />
        )}
        {stage === 'done' && <DonePanel lang={lang} rating={data?.rating ?? null} />}
      </div>
    </main>
  );
}

function Header({ lang, clientName }: { lang: Lang; clientName?: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-ink-400 mb-3">
        Devya Solutions · Client Feedback
      </div>
      {clientName && (
        <div className="text-ink-300 text-sm mb-2">
          {t(lang, 'hi')}, {clientName.split(' ')[0]}
        </div>
      )}
    </div>
  );
}

function ErrorPanel({ lang, message }: { lang: Lang; message: string }) {
  return (
    <div className="mt-8">
      <h1 className="text-2xl font-semibold mb-3">{t(lang, 'errorTitle')}</h1>
      <p className="text-ink-300 mb-2">{t(lang, 'linkExpired')}</p>
      <p className="text-ink-400 text-sm">{t(lang, 'contactUs')}</p>
      {message && (
        <p className="text-ink-500 text-xs mt-6 font-mono">{message}</p>
      )}
    </div>
  );
}

function RatingPanel({
  lang,
  onSubmit,
}: {
  lang: Lang;
  onSubmit: (rating: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold mb-4 leading-tight">
        {t(lang, 'ratingHeadline')}
      </h1>
      <p className="text-ink-300 mb-8">{t(lang, 'ratingSubline')}</p>

      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} stars`}
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
        <span>{t(lang, 'scaleLow')}</span>
        <span>{t(lang, 'scaleHigh')}</span>
      </div>
      <button
        type="button"
        disabled={selected === null}
        onClick={() => selected !== null && onSubmit(selected)}
        className="w-full rounded-full bg-white text-ink-950 font-medium px-6 py-3 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-100 transition-colors"
      >
        {t(lang, 'submitRating')}
      </button>
    </div>
  );
}

function HighRatingPanel({
  lang,
  onPick,
}: {
  lang: Lang;
  onPick: (platformKey: string, url: string) => void;
}) {
  const claimed = useMemo(() => REVIEW_PLATFORMS.filter((p) => p.url), []);
  const showPlaceholders = claimed.length === 0;
  return (
    <div className="mt-6">
      <div className="text-yellow-400 text-2xl mb-3">★★★★★</div>
      <h1 className="text-3xl font-semibold mb-3 leading-tight">
        {t(lang, 'thanksHigh')}
      </h1>
      <h2 className="text-lg text-ink-100 mt-8 mb-2">
        {t(lang, 'pickPlatform')}
      </h2>
      <p className="text-ink-400 text-sm mb-6">
        {t(lang, 'pickPlatformSubline')}
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
                {disabled ? t(lang, 'profileComingSoon') : t(lang, 'visitProfile') + ' ↗'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrivateFeedbackPanel({
  lang,
  onSubmit,
}: {
  lang: Lang;
  onSubmit: (body: string) => void;
}) {
  const [body, setBody] = useState('');
  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold mb-3 leading-tight">
        {t(lang, 'privateFormHead')}
      </h1>
      <p className="text-ink-300 mb-6">{t(lang, 'privateFormSubline')}</p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t(lang, 'privatePlaceholder')}
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
        {t(lang, 'submitPrivate')}
      </button>
    </div>
  );
}

function DonePanel({ lang, rating }: { lang: Lang; rating: number | null }) {
  const high = (rating ?? 0) >= RATING_HIGH_THRESHOLD;
  return (
    <div className="mt-8">
      <h1 className="text-3xl font-semibold mb-3 leading-tight">
        {high ? t(lang, 'thanksHigh') : t(lang, 'privateSubmitted')}
      </h1>
      <p className="text-ink-400">{t(lang, 'done')}</p>
    </div>
  );
}
