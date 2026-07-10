const BASE = '/api';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      msg = j?.message ?? j?.error ?? msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export type PublicFeedback = {
  id: string;
  clientName: string;
  clientCompany?: string | null;
  projectName?: string | null;
  lang: 'en' | 'ar';
  rating: number | null;
  hasResponded: boolean;
};

export const api = {
  public: {
    get: (token: string) => req<PublicFeedback>(`/public/feedback/${token}`),
    submitRating: (
      token: string,
      rating: number,
      extras?: { testimonial?: string; imageUrl?: string },
    ) =>
      req<{ rating: number }>(`/public/feedback/${token}/rating`, {
        method: 'POST',
        body: JSON.stringify({ rating, ...extras }),
      }),
    uploadImage: async (token: string, file: File): Promise<{ url: string }> => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${BASE}/public/feedback/${token}/image`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await extractError(res));
      return res.json() as Promise<{ url: string }>;
    },
    submitPrivate: (token: string, privateFeedback: string) =>
      req<{ ok: true }>(`/public/feedback/${token}/private`, {
        method: 'POST',
        body: JSON.stringify({ privateFeedback }),
      }),
    trackPlatformClick: (token: string, platformKey: string) =>
      req<{ ok: true }>(`/public/feedback/${token}/platform-click`, {
        method: 'POST',
        body: JSON.stringify({ platformKey }),
      }),
  },
  admin: {
    list: (params?: { status?: string; take?: number; skip?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.take !== undefined) q.set('take', String(params.take));
      if (params?.skip !== undefined) q.set('skip', String(params.skip));
      const qs = q.toString();
      return req<{ items: AdminFeedback[]; total: number }>(
        `/admin/feedback${qs ? `?${qs}` : ''}`,
      );
    },
    get: (id: string) => req<AdminFeedback>(`/admin/feedback/${id}`),
    create: (body: AdminCreateBody) =>
      req<AdminFeedback>(`/admin/feedback`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    send: (id: string) =>
      req<AdminFeedback>(`/admin/feedback/${id}/send`, { method: 'POST' }),
    resend: (id: string) =>
      req<AdminFeedback>(`/admin/feedback/${id}/resend`, { method: 'POST' }),
    close: (id: string) =>
      req<AdminFeedback>(`/admin/feedback/${id}/close`, { method: 'POST' }),
    summary: () =>
      req<{
        total: number;
        responded: number;
        responseRate: number;
        averageRating: number;
        byStatus: Record<string, number>;
      }>(`/admin/feedback/stats/summary`),
    importPreview: async (file: File): Promise<ImportPreview> => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${BASE}/admin/feedback/import/preview`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await extractError(res));
      return res.json() as Promise<ImportPreview>;
    },
    importApply: (rows: FeedbackImportRow[], autoSend: boolean) =>
      req<ImportApplyResult>(`/admin/feedback/import/apply`, {
        method: 'POST',
        body: JSON.stringify({ rows, autoSend }),
      }),
    exportXlsxUrl: () => `${BASE}/admin/feedback/export/xlsx`,
  },
};

async function extractError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j?.message ?? j?.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export type AdminCreateBody = {
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  projectName?: string;
  projectClosedAt?: string;
  lang?: 'en' | 'ar';
};

export type AdminFeedback = {
  id: string;
  token: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string | null;
  projectName: string | null;
  projectClosedAt: string | null;
  status: string;
  lang: string;
  sentAt: string | null;
  emailOpenedAt: string | null;
  emailOpenCount: number;
  openedAt: string | null;
  respondedAt: string | null;
  rating: number | null;
  platformKey: string | null;
  platformClickedAt: string | null;
  privateFeedback: string | null;
  testimonial: string | null;
  imageUrl: string | null;
  reminderCount: number;
  lastReminderAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FeedbackImportRow = {
  index: number;
  clientName: string;
  clientEmail: string;
  clientCompany: string | null;
  projectName: string | null;
  lang: 'en' | 'ar';
  validationError: string | null;
};

export type ImportPreview = { rows: FeedbackImportRow[]; totalRows: number };
export type ImportApplyResult = {
  created: number;
  sent: number;
  skipped: number;
  errors: string[];
};
