/**
 * 搜索页 - pages/search/search.js
 */

Page({
  data: {
    searchKey: '',
    hotSearch: ['金毛', '英短', '猫咪绝育', '狗粮推荐', '宠物医院', '领养'],
    historySearch: ['猫咪洗澡', '柯基', '仓鼠用品'],
    results: [],
    statusBarHeight: 0,
    menuButtonHeight: 0
  },

  onLoad(options) {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      menuButtonHeight: app.globalData.menuButtonHeight
    })
    if (options.key) {
      this.setData({ searchKey: options.key })
    }
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
  },

  onSearchConfirm() {
    const key = this.data.searchKey
    if (key) {
      wx.showToast({ title: '搜索: ' + key, icon: 'none' })
    }
  },

  onHotTap(e) {
    const key = e.currentTarget.dataset.key
    this.setData({ searchKey: key })
  },

  onClearHistory() {
    this.setData({ historySearch: [] })
  },

  onBack() {
    wx.navigateBack({
      delta: 1
    })
  }
})
