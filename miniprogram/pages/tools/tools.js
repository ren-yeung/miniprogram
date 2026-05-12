/**
 * 平台页 - pages/tools/tools.js
 */

const app = getApp()

Page({
  data: {
    // 导航栏适配 - 从全局获取
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonTop: 0,
    menuButtonHeight: 0,
    
    coreTools: [
      { id: 1, name: '宠物健康台账', icon: '🩺', desc: '记录疫苗、体重、体检、驱虫', badge: '热门', bg: '#FFE0E0', color: '#FF6B6B', usage: '2.3k' },
      { id: 2, name: '喂养计算器', icon: '🍖', desc: '根据品种、体重、年龄科学计算', badge: '推荐', bg: '#D0F0E0', color: '#4CAF50', usage: '1.8k' },
      { id: 3, name: '宠物纪念日', icon: '🎂', desc: '记录生日、到家日，设置提醒', badge: '新功能', bg: '#FFE8C0', color: '#F59E0B', usage: '956' },
      { id: 4, name: '症状自查', icon: '🔍', desc: 'AI智能初步分析宠物症状', badge: 'AI辅助', bg: '#D8E4FF', color: '#6B9FFF', usage: '3.1k' }
    ],
    localServices: [
      { id: 1, name: '宠物医院', icon: '🏥', desc: '查找附近正规宠物医院', badge: '热门', bg: '#FFF0F0' },
      { id: 2, name: '宠物美容', icon: '✂️', desc: '附近宠物美容店', badge: '', bg: '#F0FFF4' },
      { id: 3, name: '宠物寄养', icon: '🏠', desc: '同城宠友帮忙寄养', badge: '同城', bg: '#FFF9F0' },
      { id: 4, name: '宠物食品店', icon: '🍖', desc: '附近宠物用品店', badge: '', bg: '#F0F4FF' }
    ],
    knowledgeList: [
      { id: 1, name: '训练指南', icon: '📚', desc: '基础指令训练教程' },
      { id: 2, name: '品种百科', icon: '🐾', desc: '各品种宠物介绍' },
      { id: 3, name: '营养指南', icon: '🥗', desc: '科学喂养知识' },
      { id: 4, name: '疾病预防', icon: '💊', desc: '常见疾病预防' }
    ]
  },

  onLoad() {
    // 从全局获取导航栏适配参数
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      menuButtonTop: app.globalData.menuButtonTop,
      menuButtonHeight: app.globalData.menuButtonHeight
    })
  },

  onShow() {
    // 设置自定义TabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  // 工具卡片点击
  onToolTap(e) {
    const name = e.currentTarget.dataset.name
    wx.showToast({
      title: name,
      icon: 'none'
    })
  },

  // 服务卡片点击
  onServiceTap(e) {
    const name = e.currentTarget.dataset.name
    wx.showToast({
      title: name,
      icon: 'none'
    })
  },

  // 知识卡片点击
  onKnowledgeTap(e) {
    const name = e.currentTarget.dataset.name
    wx.showToast({
      title: name,
      icon: 'none'
    })
  },

  // 搜索
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  }
})
