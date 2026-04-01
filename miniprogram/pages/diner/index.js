// Subscription message template ID — fill this in after creating the template
// in WeChat MP admin (https://mp.weixin.qq.com) under "订阅消息"
const SUBSCRIBE_TMPL_ID = "YOUR_TEMPLATE_ID_HERE";

const MEALS = ["breakfast", "lunch", "dinner"];
const MEAL_LABELS = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };
const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
  "21:00", "21:30"
];

Page({
  data: {
    name: "",
    submitted: false,
    loading: false,
    meals: {
      breakfast: { attending: false, food: "", time: "08:00" },
      lunch:     { attending: false, food: "", time: "12:00" },
      dinner:    { attending: false, food: "", time: "18:00" },
    },
    mealKeys: MEALS,
    mealLabels: MEAL_LABELS,
    timeOptions: TIME_OPTIONS,
  },

  onLoad() {
    this._requestSubscription();
  },

  _requestSubscription() {
    if (!SUBSCRIBE_TMPL_ID || SUBSCRIBE_TMPL_ID === "YOUR_TEMPLATE_ID_HERE") return;
    wx.requestSubscribeMessage({
      tmplIds: [SUBSCRIBE_TMPL_ID],
      success: (res) => {
        const subscribed = res[SUBSCRIBE_TMPL_ID] === "accept";
        const app = getApp();
        if (!app.globalData.openid) return;
        wx.cloud.callFunction({
          name: "submitSurvey",
          data: {
            action: "updateSubscription",
            name: wx.getStorageSync("dinerName") || "",
            subscribed,
          },
        });
      },
    });
  },

  onNameInput(e) {
    const name = e.detail.value;
    this.setData({ name });
    wx.setStorageSync("dinerName", name);
  },

  onAttendingChange(e) {
    const { meal } = e.currentTarget.dataset;
    const attending = e.detail.value;
    this.setData({ [`meals.${meal}.attending`]: attending });
  },

  onFoodInput(e) {
    const { meal } = e.currentTarget.dataset;
    this.setData({ [`meals.${meal}.food`]: e.detail.value });
  },

  onTimeChange(e) {
    const { meal } = e.currentTarget.dataset;
    const time = TIME_OPTIONS[Number(e.detail.value)] || this.data.meals[meal].time;
    this.setData({ [`meals.${meal}.time`]: time });
  },

  onSubmit() {
    const { name, meals } = this.data;
    if (!name.trim()) {
      wx.showToast({ title: "请先填写你的名字", icon: "none" });
      return;
    }
    const hasAny = MEALS.some(m => meals[m].attending);
    if (!hasAny) {
      wx.showToast({ title: "请至少勾选一顿饭", icon: "none" });
      return;
    }
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: "submitSurvey",
      data: {
        action: "submit",
        name: name.trim(),
        meals,
      },
      success: () => {
        this.setData({ submitted: true, loading: false });
        wx.showToast({ title: "提交成功 🎉", icon: "success" });
      },
      fail: (err) => {
        this.setData({ loading: false });
        console.error("submitSurvey failed", err);
        wx.showToast({ title: "提交失败，请重试", icon: "none" });
      },
    });
  },

  goBack() {
    wx.redirectTo({ url: "../role-select/index" });
  },

  reSubmit() {
    this.setData({ submitted: false });
  },
});
