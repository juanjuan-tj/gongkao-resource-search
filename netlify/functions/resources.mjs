import { getStore } from '@netlify/blobs';
import { verifyRequestOrigin } from '@netlify/identity';
import seedItems from '../../data/resources.json' with { type: 'json' };
import { isAllowedUrl, json, requireAdmin } from './_shared.mjs';

const store = getStore('gongkao-resources');
const key = 'catalog';

function normalizeItem(input, { existing } = {}) {
  const title = String(input.title ?? '').trim();
  const url = String(input.url ?? '').trim();
  if (!title || title.length > 200) throw new Error('资料标题不能为空，且不能超过 200 个字符。');
  if (!isAllowedUrl(url)) throw new Error('请输入有效的 http 或 https 网盘链接。');

  return {
    id: existing?.id ?? crypto.randomUUID(),
    title,
    url,
    platform: String(input.platform ?? '').trim().slice(0, 30),
    category: String(input.category ?? '').trim().slice(0, 80),
    code: String(input.code ?? '').trim().slice(0, 100),
    description: String(input.description ?? '').trim().slice(0, 500),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function seedCatalog() {
  return seedItems.map((item) => ({
    id: `legacy-${item.id}`,
    title: item.title,
    url: item.url,
    platform: '夸克',
    category: '',
    code: '',
    description: '',
    createdAt: null,
    updatedAt: null
  }));
}

async function readCatalog() {
  const result = await store.getWithMetadata(key, { type: 'json', consistency: 'strong' });
  if (result) return { items: result.data, etag: result.etag };

  const items = seedCatalog();
  const created = await store.setJSON(key, items, { onlyIfNew: true });
  if (created.modified) return { items, etag: created.etag };
  return readCatalog();
}

async function writeCatalog(items, etag) {
  const result = await store.setJSON(key, items, { onlyIfMatch: etag });
  if (!result.modified) throw new Error('资料库刚被其他操作更新，请刷新后重试。');
  return result;
}

export default async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204 });

  try {
    if (request.method === 'GET') {
      const { items } = await readCatalog();
      return json(request, items, { cache: 'public, max-age=60' });
    }

    verifyRequestOrigin(request);
    const auth = await requireAdmin(request);
    if (auth.error) return auth.error;
    const { items, etag } = await readCatalog();

    if (request.method === 'POST') {
      const item = normalizeItem(await request.json());
      await writeCatalog([item, ...items], etag);
      return json(request, item, { status: 201 });
    }

    if (request.method === 'PUT') {
      const input = await request.json();
      const index = items.findIndex((item) => item.id === input.id);
      if (index === -1) return json(request, { error: '找不到该资料。' }, { status: 404 });
      const item = normalizeItem(input, { existing: items[index] });
      const nextItems = [...items];
      nextItems[index] = item;
      await writeCatalog(nextItems, etag);
      return json(request, item);
    }

    if (request.method === 'DELETE') {
      const id = new URL(request.url).searchParams.get('id');
      const nextItems = items.filter((item) => item.id !== id);
      if (nextItems.length === items.length) return json(request, { error: '找不到该资料。' }, { status: 404 });
      await writeCatalog(nextItems, etag);
      return json(request, { ok: true });
    }

    return json(request, { error: '不支持的请求方式。' }, { status: 405 });
  } catch (error) {
    return json(request, { error: error instanceof Error ? error.message : '保存资料时发生错误。' }, { status: 400 });
  }
};
