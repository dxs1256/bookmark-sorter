// background.js – 完整可运行版
// 功能：递归遍历所有书签文件夹，剔除标题尾部空格后按字符长度升序排列

// 核心：处理单个文件夹
async function sortFolderChildren(parentId) {
  const children = await chrome.bookmarks.getChildren(parentId);
  // 只保留真正的书签（url 存在）
  const links = children.filter(c => c.url);
  if (links.length < 2) return;

  // 1. 去掉尾部空格（防止影响长度计算）
  links.forEach(n => n.title = n.title.trimEnd());

  // 2. 按剔除空格后的长度升序
  links.sort((a, b) => a.title.length - b.title.length);

  // 3. 依次 move 到最前面
  for (let i = 0; i < links.length; i++) {
    await chrome.bookmarks.move(links[i].id, { parentId, index: i });
  }
}

// 递归遍历所有文件夹
async function walkTree(parentId) {
  const nodes = await chrome.bookmarks.getChildren(parentId);
  for (const node of nodes) {
    if (!node.url) {                 // 是文件夹
      await sortFolderChildren(node.id); // 先排本子
      await walkTree(node.id);           // 再递归
    }
  }
}

// 点击图标触发
chrome.action.onClicked.addListener(async () => {
  const [root] = await chrome.bookmarks.getTree();
  await walkTree(root.id);
  // 简单提示
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon.png",
    title: "排序完成",
    message: "已按剔除尾部空格后的标题长度升序排列！"
  });
});
