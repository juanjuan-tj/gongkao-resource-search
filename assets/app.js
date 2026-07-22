const RESULTS_PER_PAGE = 20;

const input = document.querySelector('#search-input');
const resultsElement = document.querySelector('#results');
const summaryElement = document.querySelector('#result-summary');
const clearButton = document.querySelector('#clear-search');
const showMoreButton = document.querySelector('#show-more');

let resources = [];
let matchingResources = [];
let visibleCount = RESULTS_PER_PAGE;

function searchable(value) {
  return value.toLocaleLowerCase('zh-CN').replace(/[\s\p{P}\p{S}_]+/gu, '');
}

function getMatches(query) {
  const terms = searchable(query).match(/[\u4e00-\u9fff]+|[a-z]+|\d+/g) ?? [];
  if (!terms.length) return [];
  return resources.filter((resource) => {
    const title = searchable(resource.title);
    return terms.every((term) => title.includes(term));
  });
}

function makeCard(resource) {
  const card = document.createElement('article');
  card.className = 'result-card';

  const index = document.createElement('span');
  index.className = 'result-index';
  index.textContent = String(resource.id).padStart(4, '0');

  const title = document.createElement('div');
  title.className = 'result-title';
  title.textContent = resource.title;

  const link = document.createElement('a');
  link.className = 'open-link';
  link.href = resource.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = '打开网盘';
  link.setAttribute('aria-label', `打开网盘：${resource.title}`);

  card.append(index, title, link);
  return card;
}

function render() {
  resultsElement.replaceChildren();
  const query = input.value.trim();
  const hasQuery = Boolean(query);

  if (!hasQuery) {
    const empty = document.createElement('div');
    empty.className = 'empty empty-discovery';
    const title = document.createElement('strong');
    title.textContent = '输入关键词，开始找资料';
    const description = document.createElement('span');
    description.textContent = '可按年份、科目、机构或老师名称检索，例如“2027 申论”或“超格”。';
    empty.append(title, description);
    resultsElement.append(empty);
    summaryElement.textContent = `共收录 ${resources.length} 条资料 · 等待搜索`;
    showMoreButton.hidden = true;
    clearButton.hidden = true;
    return;
  }

  const displayed = matchingResources.slice(0, visibleCount);

  if (matchingResources.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = `没有找到“${query}”相关的资料，试试更短的关键词。`;
    resultsElement.append(empty);
  } else {
    displayed.forEach((resource) => resultsElement.append(makeCard(resource)));
  }

  summaryElement.textContent = `“${query}”找到 ${matchingResources.length} 条资料`;
  showMoreButton.hidden = visibleCount >= matchingResources.length;
  clearButton.hidden = !query;
}

function updateSearch() {
  visibleCount = RESULTS_PER_PAGE;
  matchingResources = getMatches(input.value);
  render();
}

input.addEventListener('input', updateSearch);
clearButton.addEventListener('click', () => {
  input.value = '';
  input.focus();
  updateSearch();
});
showMoreButton.addEventListener('click', () => {
  visibleCount += RESULTS_PER_PAGE;
  render();
});
document.querySelectorAll('[data-query]').forEach((button) => {
  button.addEventListener('click', () => {
    input.value = button.dataset.query;
    input.focus();
    updateSearch();
  });
});

const disclaimerDialog = document.querySelector('#disclaimer-dialog');
const disclaimerSessionKey = 'gongkao-disclaimer-seen';
function closeDisclaimer() {
  disclaimerDialog.close();
  sessionStorage.setItem(disclaimerSessionKey, 'true');
}
document.querySelector('#accept-disclaimer').addEventListener('click', closeDisclaimer);
document.querySelector('#close-disclaimer').addEventListener('click', closeDisclaimer);
if (!sessionStorage.getItem(disclaimerSessionKey) && typeof disclaimerDialog.showModal === 'function') {
  disclaimerDialog.showModal();
}

const resourceDataUrl = window.RESOURCE_API_URL || './data/resources.json';

fetch(resourceDataUrl, { cache: 'no-store' })
  .then((response) => {
    if (!response.ok) throw new Error('资料索引加载失败');
    return response.json();
  })
  .then((data) => {
    resources = data;
    matchingResources = resources;
    render();
  })
  .catch(() => {
    summaryElement.textContent = '资料索引加载失败，请稍后刷新重试。';
  });
