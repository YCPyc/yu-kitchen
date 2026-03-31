Page({
  data: {},

  chooseChef() {
    wx.setStorageSync("role", "chef");
    wx.redirectTo({ url: "../chef/index" });
  },

  chooseDiner() {
    wx.setStorageSync("role", "diner");
    wx.redirectTo({ url: "../diner/index" });
  },
});
