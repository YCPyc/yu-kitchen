const MEALS = ["breakfast", "lunch", "dinner"];
const MEAL_LABELS = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };
const MEAL_EMOJIS = { breakfast: "🌅", lunch: "☀️", dinner: "🌙" };

Page({
  data: {
    loading: true,
    daySections: [],
    mealKeys: MEALS,
    mealLabels: MEAL_LABELS,
    mealEmojis: MEAL_EMOJIS,
  },

  _midnightTimer: null,

  onLoad() {
    this._loadResults();
    this._scheduleMidnightRefresh();
  },

  onUnload() {
    if (this._midnightTimer) {
      clearTimeout(this._midnightTimer);
      this._midnightTimer = null;
    }
  },

  onPullDownRefresh() {
    this._loadResults(() => wx.stopPullDownRefresh());
  },

  _loadResults(cb) {
    this.setData({ loading: true });
    wx.cloud.callFunction({
      name: "getSurveyResults",
      success: (res) => {
        const days = this._normalizeDays(res.result || {});
        this.setData({
          loading: false,
          daySections: this._buildDaySections(days),
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

  _scheduleMidnightRefresh() {
    if (this._midnightTimer) {
      clearTimeout(this._midnightTimer);
    }

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 5, 0);

    this._midnightTimer = setTimeout(() => {
      this._loadResults();
      this._scheduleMidnightRefresh();
    }, nextMidnight - now);
  },

  _normalizeDays(result) {
    if (result.days && result.days.today && result.days.tomorrow) {
      return result.days;
    }

    const today = this._getDateString(0);
    const tomorrow = this._getDateString(1);
    const emptyMeals = {
      breakfast: [],
      lunch: [],
      dinner: [],
    };

    return {
      today: {
        date: result.date || today,
        meals: result.meals || emptyMeals,
        totalDiners: result.totalDiners || 0,
      },
      tomorrow: {
        date: tomorrow,
        meals: emptyMeals,
        totalDiners: 0,
      },
    };
  },

  _buildDaySections(days) {
    return [
      {
        key: "today",
        label: "今天",
        dateLabel: this._formatDate(days.today.date),
        meals: days.today.meals,
        totalDiners: days.today.totalDiners,
      },
      {
        key: "tomorrow",
        label: "明天",
        dateLabel: this._formatDate(days.tomorrow.date),
        meals: days.tomorrow.meals,
        totalDiners: days.tomorrow.totalDiners,
      },
    ];
  },

  _getDateString(offsetDays) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
