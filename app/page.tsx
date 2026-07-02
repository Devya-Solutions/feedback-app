import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-lg text-center">
        <div className="text-xs uppercase tracking-widest text-ink-400 mb-4">
          Devya Feedback
        </div>
        <h1 className="text-3xl font-semibold mb-4">
          You&rsquo;ll normally reach this page via a personal link from Ahmed.
        </h1>
        <p className="text-ink-300 mb-8">
          If you&rsquo;re a Devya team member, head to the admin dashboard.
          Otherwise reach out at{' '}
          <a
            className="underline underline-offset-4"
            href="mailto:contact@devya.dev"
          >
            contact@devya.dev
          </a>
          .
        </p>
        <Link
          href="/admin"
          className="inline-block rounded-full bg-white text-ink-950 font-medium px-6 py-3 hover:bg-ink-100 transition-colors"
        >
          Admin dashboard →
        </Link>
      </div>
    </main>
  );
}
