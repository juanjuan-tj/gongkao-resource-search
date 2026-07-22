const api = '/.netlify/functions';
const state = { items: [], user: null };
const statusText = document.querySelector('#status-text');
const loginPanel = document.querySelector('#login-panel');
const adminPanel = document.querySelector('#admin-panel');
const loginMessage = document.querySelector('#login-message');
const resourceMessage = document.querySelector('#resource-message');
const resourceForm = document.querySelector('#resource-form');

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || '请求失败，请重试。');
  return data;
}

function message(element, text, ok = false) {
  element.textContent = text;
  element.classList.toggle('ok', ok);
}

async function refreshResources() {
  state.items = await request('/resources');
  document.querySelector('#total-count').textContent = state.items.length;
  document.querySelector('#data-status').textContent = '已同步';
  renderList();
}

function resetForm() {
  resourceForm.reset();
  resourceForm.elements.id.value = '';
  document.querySelector('#form-title').textContent = '新增网盘资料';
  document.querySelector('#save-button').textContent = '保存到资料库';
  document.querySelector('#cancel-edit').hidden = true;
  message(resourceMessage, '');
}

function beginEdit(item) {
  for (const field of ['id','title','url','platform','category','code','description']) resourceForm.elements[field].value = item[field] ?? '';
  document.querySelector('#form-title').textContent = '编辑网盘资料';
  document.querySelector('#save-button').textContent = '保存修改';
  document.querySelector('#cancel-edit').hidden = false;
  resourceForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderList() {
  const list = document.querySelector('#resource-list');
  const query = document.querySelector('#filter-input').value.trim().toLocaleLowerCase('zh-CN');
  const items = state.items.filter((item) => [item.title,item.category,item.description,item.platform].join(' ').toLocaleLowerCase('zh-CN').includes(query));
  list.replaceChildren();
  if (!items.length) { list.innerHTML = '<p class="empty">没有匹配的资料。</p>'; return; }
  items.slice(0, 100).forEach((item) => {
    const row = document.createElement('article'); row.className = 'resource-row';
    const main = document.createElement('div'); main.className = 'resource-main';
    const title = document.createElement('span'); title.className = 'resource-title'; title.textContent = item.title;
    const meta = document.createElement('span'); meta.className = 'resource-meta'; meta.textContent = [item.platform, item.category, item.code ? `提取码：${item.code}` : ''].filter(Boolean).join(' · ') || item.url;
    main.append(title, meta);
    const actions = document.createElement('div'); actions.className = 'row-actions';
    const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = '编辑'; edit.addEventListener('click', () => beginEdit(item));
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'delete'; remove.textContent = '删除'; remove.addEventListener('click', () => removeItem(item));
    actions.append(edit, remove); row.append(main, actions); list.append(row);
  });
}

async function removeItem(item) {
  if (!window.confirm(`确定删除“${item.title}”吗？`)) return;
  try { await request(`/resources?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' }); await refreshResources(); }
  catch (error) { window.alert(error.message); }
}

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  message(loginMessage, '正在登录…');
  try { await request('/auth', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) }); await initialize(); }
  catch (error) { message(loginMessage, error.message); }
});

resourceForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const save = document.querySelector('#save-button'); save.disabled = true; message(resourceMessage, '正在保存…');
  const values = Object.fromEntries(new FormData(resourceForm));
  try {
    await request('/resources', { method: values.id ? 'PUT' : 'POST', body: JSON.stringify(values) });
    resetForm(); await refreshResources(); message(resourceMessage, '已保存。', true);
  } catch (error) { message(resourceMessage, error.message); }
  finally { save.disabled = false; }
});

document.querySelector('#cancel-edit').addEventListener('click', resetForm);
document.querySelector('#filter-input').addEventListener('input', renderList);
document.querySelector('#logout-button').addEventListener('click', async () => { await request('/auth', { method: 'DELETE' }); await initialize(); });

async function initialize() {
  try {
    const auth = await request('/auth');
    state.user = auth;
    if (!auth.isAdmin) {
      adminPanel.hidden = true; loginPanel.hidden = false; document.querySelector('#logout-button').hidden = !auth.authenticated;
      statusText.textContent = auth.authenticated ? '该账号没有管理员权限。请确认 ADMIN_EMAIL 配置。' : '请登录管理员账号。';
      return;
    }
    loginPanel.hidden = true; adminPanel.hidden = false; document.querySelector('#logout-button').hidden = false;
    statusText.textContent = '已登录，可安全维护资料库。'; document.querySelector('#user-email').textContent = auth.email;
    await refreshResources();
  } catch (error) { statusText.textContent = error.message; }
}

initialize();
