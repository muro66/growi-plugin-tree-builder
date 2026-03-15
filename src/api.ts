import type { GrowiPage, PagesListResponse } from './types';

const BASE = typeof window !== 'undefined' ? window.location.origin : '';

export async function fetchPagesUnderPath(path: string): Promise<PagesListResponse> {
  const normalized = path.replace(/^\//, '') || '';
  const query = new URLSearchParams({ path: '/' + normalized });
  const res = await fetch(`${BASE}/_api/v3/pages/list?${query}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return { pages: data.pages ?? [], totalCount: data.totalCount };
}

export function filterDirectChildren(pages: GrowiPage[], parentPath: string): GrowiPage[] {
  return pages.filter((p) => {
    const path = p.path || '';
    if (path === parentPath) return false;
    const prefix = parentPath === '/' ? '/' : parentPath.replace(/\/$/, '') + '/';
    if (!path.startsWith(prefix)) return false;
    const rest = path.slice(prefix.length);
    return rest !== '' && !rest.includes('/');
  });
}

export function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  const el = document.querySelector('[data-page-path]') as HTMLElement | null;
  if (el?.dataset?.pagePath) return el.dataset.pagePath;
  const meta = document.querySelector('meta[property="growi:path"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;
  const pathname = window.location.pathname;
  const m = pathname.match(/^\/page\/(.+)$/);
  if (m) return '/' + m[1].split('/').map((s) => decodeURIComponent(s)).join('/');
  if (pathname && pathname !== '/' && !/^\/[0-9a-f]{24}$/i.test(pathname)) {
    const decoded = pathname.split('/').filter(Boolean).map((s) => decodeURIComponent(s)).join('/');
    return decoded ? '/' + decoded : '/';
  }
  return '/';
}

export function buildPageUrl(path: string): string {
  if (typeof window === 'undefined') return '';
  const segments = path.split('/').filter((s) => s !== undefined && s !== '');
  const encoded = segments.map((s) => encodeURIComponent(s)).join('/');
  return `${window.location.origin}/${encoded}`;
}

export async function fetchPageByPath(path: string): Promise<{ body?: string } | null> {
  const normalized = path.replace(/^\//, '') || '';
  const query = new URLSearchParams({ path: '/' + normalized });
  const res = await fetch(`${BASE}/_api/v3/page?${query}`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  const page = data.page ?? data;
  return page ? { body: page.revision?.body ?? page.body } : null;
}

/**
 * GROWI に新規ページを作成する
 * @see GROWI REST API v3 pages create
 */
export async function createPage(path: string, body: string = '', options?: { grant?: number }): Promise<boolean> {
  const normalized = path.replace(/^\//, '').replace(/\/$/, '') || '';
  if (!normalized) return false;
  const res = await fetch(`${BASE}/_api/v3/pages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path: '/' + normalized,
      body,
      grant: options?.grant ?? 1,
    }),
  });
  return res.ok;
}
