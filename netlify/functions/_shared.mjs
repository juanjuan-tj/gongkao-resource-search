import { getUser } from '@netlify/identity';

const defaultPublicOrigin = 'https://juanjuan-tj.github.io';

export function headersFor(request, { cache = 'no-store' } = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': cache,
    'Vary': 'Origin'
  });
  const origin = request.headers.get('origin');
  const ownOrigin = new URL(request.url).origin;
  const publicOrigin = process.env.PUBLIC_SITE_ORIGIN || defaultPublicOrigin;
  if (origin && (origin === publicOrigin || origin === ownOrigin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return headers;
}

export function json(request, value, init = {}) {
  const headers = headersFor(request, { cache: init.cache });
  if (init.headers) {
    for (const [key, value] of Object.entries(init.headers)) headers.set(key, value);
  }
  return new Response(JSON.stringify(value), { status: init.status ?? 200, headers });
}

export async function requireAdmin(request) {
  const user = await getUser();
  if (!user) return { error: json(request, { error: '请先登录管理员账号。' }, { status: 401 }) };

  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!configuredEmail) {
    return { error: json(request, { error: '后台尚未配置管理员邮箱。' }, { status: 503 }) };
  }
  if (user.email?.toLowerCase() !== configuredEmail) {
    return { error: json(request, { error: '当前账号没有后台权限。' }, { status: 403 }) };
  }
  return { user };
}

export function isAllowedUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
