const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// Fill in your subscription message template ID here.
// Create it at https://mp.weixin.qq.com → 订阅消息 → 我的模板
const SUBSCRIBE_TMPL_ID = "YOUR_TEMPLATE_ID_HERE";

exports.main = async (event, context) => {
  if (!SUBSCRIBE_TMPL_ID || SUBSCRIBE_TMPL_ID === "YOUR_TEMPLATE_ID_HERE") {
    console.warn("sendReminder: SUBSCRIBE_TMPL_ID not configured, skipping.");
    return { sent: 0, skipped: true };
  }

  // Fetch all users who opted in
  const res = await db.collection("subscriptions")
    .where({ subscribed: true })
    .get();

  const users = res.data;
  let sent = 0;
  const errors = [];

  for (const user of users) {
    try {
      await cloud.openapi.subscribeMessage.send({
        touser: user.openid,
        templateId: SUBSCRIBE_TMPL_ID,
        // Adjust page to the diner survey page
        page: "pages/diner/index",
        data: {
          // These field keys depend on your template's variables.
          // Common single-field reminder template example:
          thing1: { value: "晚上记得填写明天用餐计划哦 🍽️" },
          time2:  { value: "今晚 19:00 - 23:59" },
        },
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send to ${user.openid}:`, err);
      errors.push({ openid: user.openid, error: err.message });
    }
  }

  return { sent, total: users.length, errors };
};
