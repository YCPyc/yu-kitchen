const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// Returns tomorrow's date as YYYY-MM-DD so tonight's survey appears on the chef view after midnight
function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { action } = event;

  if (action === "updateSubscription") {
    // Save/update subscription preference only
    const { name, subscribed } = event;
    await db.collection("subscriptions").where({ openid: OPENID }).get().then(async (res) => {
      if (res.data.length > 0) {
        await db.collection("subscriptions").where({ openid: OPENID }).update({
          data: { name, subscribed, updatedAt: db.serverDate() },
        });
      } else {
        await db.collection("subscriptions").add({
          data: { openid: OPENID, name, subscribed, updatedAt: db.serverDate() },
        });
      }
    });
    return { success: true };
  }

  if (action === "submit") {
    const { name, meals } = event;
    const date = getTomorrowDate();

    // Upsert survey record (one per openid per date)
    const existing = await db.collection("surveys")
      .where({ openid: OPENID, date })
      .get();

    if (existing.data.length > 0) {
      await db.collection("surveys").where({ openid: OPENID, date }).update({
        data: { name, meals, updatedAt: db.serverDate() },
      });
    } else {
      await db.collection("surveys").add({
        data: { openid: OPENID, name, date, meals, createdAt: db.serverDate() },
      });
    }

    // Also ensure subscription record exists (with name)
    const sub = await db.collection("subscriptions").where({ openid: OPENID }).get();
    if (sub.data.length === 0) {
      await db.collection("subscriptions").add({
        data: { openid: OPENID, name, subscribed: false, updatedAt: db.serverDate() },
      });
    } else {
      await db.collection("subscriptions").where({ openid: OPENID }).update({
        data: { name, updatedAt: db.serverDate() },
      });
    }

    return { success: true };
  }

  return { success: false, error: "Unknown action" };
};
