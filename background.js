// 对同一文件夹内的书签按 title.length 升序排列
async function sortFolderChildren(parentId) {
  const children = await chrome.bookmarks.getChildren(parentId);
  // 只保留真正的书签（url 存在）
  const urls = children.filter(n => n.url);
  if (urls.length < 2) return;          // 无需排序
  // 按字符长度升序
  urls.sort((a, b) => a.title.length - b.title.length);
  // Chrome 的 move 接口：index 越小越靠前
  for (let i = 0; i < urls.length; i++) {
    await chrome.bookmarks.move(urls[i].id, { parentId, index: i });
  }
}

// 递归处理所有文件夹
async function walkAndSort(parentId) {
  const nodes = await chrome.bookmarks.getChildren(parentId);
  for (const n of nodes) {
    if (!n.url) {               // 文件夹
      await sortFolderChildren(n.id);   // 先排本子
      await walkAndSort(n.id);          // 再递归
    }
  }
}

// 点击图标运行一次
chrome.action.onClicked.addListener(() => {
  chrome.bookmarks.getTree(async ([root]) => {
    // 从根节点开始
    await walkAndSort(root.id);
    console.log('【Sort by length】done');
  });
});
