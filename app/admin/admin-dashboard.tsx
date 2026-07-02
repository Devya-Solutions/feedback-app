'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  api,
  type AdminCreateBody,
  type AdminFeedback,
  type FeedbackImportRow,
  type ImportApplyResult,
  type ImportPreview,
} from '@/lib/api';

type Summary = {
  total: number;
  responded: number;
  responseRate: number;
  averageRating: number;
  byStatus: Record<string, number>;
};

export default function AdminDashboard() {
  const [items, setItems] = useState<AdminFeedback[] | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [applyResult, setApplyResult] = useState<ImportApplyResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [list, sum] = await Promise.all([
        api.admin.list({ take: 100 }),
        api.admin.summary(),
      ]);
      setItems(list.items);
      setSummary(sum);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreate = async (body: AdminCreateBody, andSend: boolean) => {
    setBusy(true);
    try {
      const created = await api.admin.create(body);
      if (andSend) {
        await api.admin.send(created.id);
      }
      setShowForm(false);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setBusy(false);
    }
  };

  const handleFileChosen = async (file: File) => {
    setBusy(true);
    try {
      const p = await api.admin.importPreview(file);
      setPreview(p);
      setApplyResult(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setBusy(false);
    }
  };

  const handleApplyImport = async (rows: FeedbackImportRow[], autoSend: boolean) => {
    setBusy(true);
    try {
      const result = await api.admin.importApply(rows, autoSend);
      setApplyResult(result);
      setPreview(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setBusy(false);
    }
  };

  const handleAction = async (
    id: string,
    action: 'send' | 'resend' | 'close',
  ) => {
    setBusy(true);
    try {
      if (action === 'send') await api.admin.send(id);
      else if (action === 'resend') await api.admin.resend(id);
      else await api.admin.close(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-ink-400 mb-1">
            Devya Feedback
          </div>
          <h1 className="text-2xl font-semibold">Admin</h1>
        </div>
        <div className="flex gap-2">
          <a
            href={api.admin.exportXlsxUrl()}
            className="rounded-full border border-ink-700 text-ink-100 px-4 py-2 hover:bg-ink-800 text-sm"
          >
            Export xlsx
          </a>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="rounded-full border border-ink-700 text-ink-100 px-4 py-2 hover:bg-ink-800 text-sm disabled:opacity-40"
          >
            Import xlsx
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFileChosen(f);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-white text-ink-950 font-medium px-5 py-2 hover:bg-ink-100 transition-colors"
          >
            {showForm ? 'Cancel' : '+ New request'}
          </button>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-800 bg-red-950/40 text-red-200 p-3 text-sm">
          {error}
        </div>
      )}

      {summary && <SummaryStrip s={summary} />}

      {showForm && (
        <CreateForm
          onCancel={() => setShowForm(false)}
          onSubmit={handleCreate}
          busy={busy}
        />
      )}

      {applyResult && (
        <div className="mb-6 rounded-lg border border-green-800 bg-green-950/30 text-green-200 p-3 text-sm">
          Imported {applyResult.created} · Sent {applyResult.sent} · Skipped {applyResult.skipped}
          {applyResult.errors.length > 0 && (
            <div className="mt-2 text-xs text-yellow-300">
              {applyResult.errors.slice(0, 5).map((e, i) => (
                <div key={i}>· {e}</div>
              ))}
              {applyResult.errors.length > 5 && (
                <div>· +{applyResult.errors.length - 5} more</div>
              )}
            </div>
          )}
        </div>
      )}

      {preview && (
        <ImportPreviewPanel
          preview={preview}
          onCancel={() => setPreview(null)}
          onApply={(autoSend) => void handleApplyImport(preview.rows, autoSend)}
          busy={busy}
        />
      )}

      <FeedbackTable
        items={items}
        onAction={(id, a) => void handleAction(id, a)}
        busy={busy}
      />
    </main>
  );
}

function SummaryStrip({ s }: { s: Summary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <Stat label="Total requests" value={s.total} />
      <Stat label="Responded" value={`${s.responded} (${s.responseRate}%)`} />
      <Stat
        label="Average rating"
        value={s.averageRating ? s.averageRating.toFixed(2) : '—'}
      />
      <Stat
        label="Awaiting reply"
        value={
          (s.byStatus.SENT ?? 0) +
          (s.byStatus.OPENED ?? 0) +
          (s.byStatus.REMINDER_SENT ?? 0)
        }
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900 p-4">
      <div className="text-xs uppercase tracking-widest text-ink-500 mb-2">
        {label}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}

function CreateForm({
  onCancel,
  onSubmit,
  busy,
}: {
  onCancel: () => void;
  onSubmit: (body: AdminCreateBody, andSend: boolean) => void;
  busy: boolean;
}) {
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [projectName, setProjectName] = useState('');
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  const submit = (andSend: boolean) => {
    onSubmit(
      {
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim(),
        clientCompany: clientCompany.trim() || undefined,
        projectName: projectName.trim() || undefined,
        lang,
      },
      andSend,
    );
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(true);
      }}
      className="rounded-2xl border border-ink-800 bg-ink-900 p-5 mb-8 grid gap-4 md:grid-cols-2"
    >
      <Field
        label="Client name"
        value={clientName}
        onChange={setClientName}
        required
      />
      <Field
        label="Client email"
        type="email"
        value={clientEmail}
        onChange={setClientEmail}
        required
      />
      <Field
        label="Company (optional)"
        value={clientCompany}
        onChange={setClientCompany}
      />
      <Field
        label="Project (optional)"
        value={projectName}
        onChange={setProjectName}
      />
      <label className="text-sm">
        <div className="text-ink-400 mb-1">Email language</div>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as 'en' | 'ar')}
          className="w-full rounded-md bg-ink-950 border border-ink-700 p-2 text-ink-100"
        >
          <option value="en">English</option>
          <option value="ar">العربية</option>
        </select>
      </label>
      <div className="md:col-span-2 flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-5 py-2 border border-ink-700 hover:bg-ink-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => submit(false)}
          disabled={busy || !clientName || !clientEmail}
          className="rounded-full px-5 py-2 border border-ink-700 hover:bg-ink-800 disabled:opacity-40"
        >
          Save draft
        </button>
        <button
          type="submit"
          disabled={busy || !clientName || !clientEmail}
          className="rounded-full px-5 py-2 bg-white text-ink-950 font-medium hover:bg-ink-100 disabled:opacity-40"
        >
          Save &amp; send
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="text-sm">
      <div className="text-ink-400 mb-1">{label}</div>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md bg-ink-950 border border-ink-700 p-2 text-ink-100 focus:outline-none focus:border-ink-500"
      />
    </label>
  );
}

function FeedbackTable({
  items,
  onAction,
  busy,
}: {
  items: AdminFeedback[] | null;
  onAction: (id: string, action: 'send' | 'resend' | 'close') => void;
  busy: boolean;
}) {
  if (items === null) return <div className="text-ink-400">Loading…</div>;
  if (items.length === 0)
    return (
      <div className="text-ink-400">
        No feedback requests yet. Create one above.
      </div>
    );
  return (
    <div className="rounded-2xl border border-ink-800 bg-ink-900 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-ink-950 text-ink-500 uppercase text-xs tracking-widest">
          <tr>
            <th className="text-start p-3">Client</th>
            <th className="text-start p-3">Project</th>
            <th className="text-start p-3">Status</th>
            <th className="text-start p-3">Rating</th>
            <th className="text-start p-3">Opens</th>
            <th className="text-start p-3">Sent</th>
            <th className="text-end p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr
              key={it.id}
              className="border-t border-ink-800 hover:bg-ink-800/50"
            >
              <td className="p-3">
                <div className="text-ink-100 font-medium">{it.clientName}</div>
                <div className="text-ink-500 text-xs">{it.clientEmail}</div>
                {it.clientCompany && (
                  <div className="text-ink-500 text-xs">{it.clientCompany}</div>
                )}
              </td>
              <td className="p-3 text-ink-300">{it.projectName ?? '—'}</td>
              <td className="p-3">
                <StatusPill status={it.status} />
              </td>
              <td className="p-3 text-ink-300">
                {it.rating !== null ? `${it.rating} ★` : '—'}
              </td>
              <td className="p-3 text-ink-300 text-xs">
                {it.emailOpenCount > 0 ? (
                  <span>
                    {it.emailOpenCount}× ·{' '}
                    <span className="text-ink-500">
                      {it.emailOpenedAt
                        ? new Date(it.emailOpenedAt).toLocaleDateString()
                        : ''}
                    </span>
                  </span>
                ) : (
                  <span className="text-ink-600">—</span>
                )}
              </td>
              <td className="p-3 text-ink-500 text-xs">
                {it.sentAt ? new Date(it.sentAt).toLocaleDateString() : '—'}
                {it.reminderCount > 0 && (
                  <div>+{it.reminderCount} reminder(s)</div>
                )}
              </td>
              <td className="p-3 text-end">
                <div className="inline-flex gap-2">
                  {it.status === 'DRAFT' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onAction(it.id, 'send')}
                      className="rounded-full px-3 py-1 bg-white text-ink-950 text-xs font-medium hover:bg-ink-100 disabled:opacity-40"
                    >
                      Send
                    </button>
                  )}
                  {['SENT', 'OPENED', 'REMINDER_SENT'].includes(it.status) && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onAction(it.id, 'resend')}
                      className="rounded-full px-3 py-1 border border-ink-700 text-xs hover:bg-ink-800 disabled:opacity-40"
                    >
                      Resend
                    </button>
                  )}
                  {it.status !== 'CLOSED' && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => onAction(it.id, 'close')}
                      className="rounded-full px-3 py-1 border border-ink-700 text-xs hover:bg-ink-800 disabled:opacity-40"
                    >
                      Close
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ImportPreviewPanel({
  preview,
  onCancel,
  onApply,
  busy,
}: {
  preview: ImportPreview;
  onCancel: () => void;
  onApply: (autoSend: boolean) => void;
  busy: boolean;
}) {
  const good = preview.rows.filter((r) => !r.validationError).length;
  const bad = preview.rows.length - good;
  return (
    <div className="mb-6 rounded-2xl border border-ink-800 bg-ink-900 p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Import preview</h2>
        <div className="text-sm text-ink-400">
          {good} ready · {bad} with errors
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto text-sm border border-ink-800 rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-ink-950 text-ink-500 uppercase tracking-widest">
            <tr>
              <th className="text-start p-2">#</th>
              <th className="text-start p-2">Name</th>
              <th className="text-start p-2">Email</th>
              <th className="text-start p-2">Company</th>
              <th className="text-start p-2">Project</th>
              <th className="text-start p-2">Lang</th>
              <th className="text-start p-2">Issue</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((r) => (
              <tr
                key={r.index}
                className={r.validationError ? 'bg-red-950/30 text-red-200' : ''}
              >
                <td className="p-2">{r.index}</td>
                <td className="p-2">{r.clientName}</td>
                <td className="p-2">{r.clientEmail}</td>
                <td className="p-2">{r.clientCompany ?? '—'}</td>
                <td className="p-2">{r.projectName ?? '—'}</td>
                <td className="p-2">{r.lang}</td>
                <td className="p-2">{r.validationError ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-5 py-2 border border-ink-700 hover:bg-ink-800"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={busy || good === 0}
          onClick={() => onApply(false)}
          className="rounded-full px-5 py-2 border border-ink-700 hover:bg-ink-800 disabled:opacity-40"
        >
          Save as drafts
        </button>
        <button
          type="button"
          disabled={busy || good === 0}
          onClick={() => onApply(true)}
          className="rounded-full px-5 py-2 bg-white text-ink-950 font-medium hover:bg-ink-100 disabled:opacity-40"
        >
          Save &amp; send all
        </button>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-ink-800 text-ink-300',
    SENT: 'bg-blue-950 text-blue-300',
    OPENED: 'bg-yellow-950 text-yellow-300',
    RESPONDED: 'bg-green-950 text-green-300',
    REMINDER_SENT: 'bg-orange-950 text-orange-300',
    CLOSED: 'bg-ink-800 text-ink-500',
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-widest ${
        map[status] ?? 'bg-ink-800 text-ink-300'
      }`}
    >
      {status}
    </span>
  );
}
