Component({
  data: {
    selected: 0,
    list: [
      {
        pagePath: "/pages/index/index",
        text: "首页",
        iconPath: "/assets/tabbar/home.png",
        selectedIconPath: "/assets/tabbar/home-active.png"
      },
      {
        pagePath: "/pages/square/square",
        text: "广场",
        iconPath: "/assets/tabbar/square.png",
        selectedIconPath: "/assets/tabbar/square-active.png"
      },
      {
        pagePath: "/pages/tools/tools",
        text: "平台",
        iconPath: "/assets/tabbar/tools.png",
        selectedIconPath: "/assets/tabbar/tools-active.png"
      },
      {
        pagePath: "/pages/profile/profile",
        text: "我的",
        iconPath: "/assets/tabbar/profile.png",
        selectedIconPath: "/assets/tabbar/profile-active.png"
      }
    ]
  },

  methods: {
    switchTab(e) {
      const idx = e.currentTarget.dataset.index
      const item = this.data.list[idx]
      wx.switchTab({ url: item.pagePath })
    }
  }
})
