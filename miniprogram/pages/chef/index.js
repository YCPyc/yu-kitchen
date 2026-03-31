const MEALS = ["breakfast", "lunch", "dinner"];
const MEAL_LABELS = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };
const MEAL_EMOJIS = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };

Page({
  data: {
    loading: true,
    dateLabel: "",
    meals: {
      breakfast: [],
      lunch: [],
      dinner: [],
    },
    mealKeys: MEALS,
    mealLabels: MEAL_LABELS,
    mealEmojis: MEAL_EMOJIS,
    totalDiners: 0,
  },

  onLoad() {
    this._loadResults();
  },

  onPullDownRefresh() {
    this._loadResults(() => wx.stopPullDownRefresh());
  },

  _loadResults(cb) {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: "getSurveyResults",
      success: (res) => {
        const { date, meals, totalDiners } = res.result;
        this.setData({
          loading: false,
          dateLabel: this._formatDate(date),
          meals,
          totalDiners,
        });
        if (cb) cb();
      },
      fail: (err) => {
        this.setData({ loading: false });
        console.error("getSurveyResults failed", err);
        wx.showToast({ title: "加载失败，请下拉刷新", icon: "none" });
        if (cb) cb();
      },
    });
  },

  _formatDate(dateStr) {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-");
    return `${y}年${m}月${d}日`;
  },

  goBack() {
    wx.redirectTo({ url: "../role-select/index" });
  },
});
