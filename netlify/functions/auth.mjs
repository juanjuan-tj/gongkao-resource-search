import { getUser, login, logout, verifyRequestOrigin } from '@netlify/identity';
import { json, requireAdmin } from './_shared.mjs';

export default async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    if (request.method === 'GET') {
      const user = await getUser();
      const admin = await requireAdmin(request);
      return json(request, {
        authenticated: Boolean(user),
        email: user?.email ?? null,
        isAdmin: Boolean(admin.user)
      });
    }

    verifyRequestOrigin(request);

    if (request.method === 'POST') {
      const { email, password } = await request.json();
      if (!email || !password) return json(request, { error: '请输入邮箱和密码。' }, { status: 400 });
      await login(email, password);
      return json(request, { ok: true });
    }

    if (request.method === 'DELETE') {
      await logout();
      return json(request, { ok: true });
    }

    return json(request, { error: '不支持的请求方式。' }, { status: 405 });
  } catch (error) {
    return json(request, { error: error instanceof Error ? error.message : '身份验证失败。' }, { status: 400 });
  }
};
