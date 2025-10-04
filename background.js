/* ===== 创建离屏文档（仅一次） ===== */
async function initOffscreen() {
  if (await chrome.offscreen.hasDocument?.()) return; // MV3 新 API
  await chrome.offscreen.createDocument({
    url: 'offscreen.js',
    reasons: ['BLOBS'],
    justification: 'Measure text width for bookmark sorting'
  });
}

/* ===== 量像素宽度 ===== */
async function measureWidths(titles) {
  await initOffscreen();
  return chrome.runtime.sendMessage({ type: 'measure', titles });
}

/* ===== 排序单个文件夹 ===== */
async function sortFolderByPx(parentId) {
  const nodes = await chrome.bookmarks.getChildren(parentId);
  const links = nodes.filter(n => n.url);
  if (links.length < 2) return;

  // 1. 收集标题
  const titles = links.map(l => l.title);
  // 2. 量像素
  const widthMap = await measureWidths(titles);
  // 3. 按像素升序
  links.sort((a, b) => widthMap[a.title] - widthMap[b.title]);

  // 4. 写回顺序
  for (let i = 0; i < links.length; i++) {
    await chrome.bookmarks.move(links[i].id, { parentId, index: i });
  }
}

/* ===== 递归遍历 ===== */
async function walkTree(parentId) {
  const children = await chrome.bookmarks.getChildren(parentId);
  for (const n of children) {
    if (!n.url) {
      await sortFolderByPx(n.id);
      await walkTree(n.id);
    }
  }
}

/* ===== 点击图标运行 ===== */
chrome.action.onClicked.addListener(async () => {
  const [root] = await chrome.bookmarks.getTree();
  await walkTree(root.id);
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: '像素排序完成',
    message: '已按书签栏实际渲染宽度升序排列'
  });
});
