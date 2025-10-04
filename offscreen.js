// offscreen.js 会被 Chrome 在独立文档里运行
// 收到 bg 消息后立即量宽度并回传
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type !== "measure") return;

  // 用和书签栏一样的系统字体
  const ctx = document.createElement("canvas").getContext("2d");
  ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const map = {};
  msg.titles.forEach(t => map[t] = ctx.measureText(t).width);

  sendResponse(map);   // 返回 {"abc":23.4, "def":34.5, ...}
});
