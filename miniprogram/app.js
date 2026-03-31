// app.js
App({
  onLaunch: function () {
    this.globalData = {
      // Fill in your Cloud environment ID here
      // 请在此填入云开发环境 ID
      env: "cloud1-9gjxcaul68a68902",
      openid: null,
    };
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
      // Fetch openid on launch and cache globally
      wx.cloud.callFunction({
        name: "getOpenId",
        success: (res) => {
          this.globalData.openid = res.result.openid;
        },
        fail: (err) => {
          console.error("getOpenId failed", err);
        },
      });
    }
  },
});
