/**
 * 宠物纪念日 - pages/memorial-day/memorial-day.js
 */

const app = getApp()

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonHeight: 0,
    
    loading: true,
    memorials: [],
    nextMemorial: null,
    memorialGroups: []
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      menuButtonHeight: app.globalData.menuButtonHeight
    })
    
    this.loadMemorials()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  /**
   * 加载纪念日数据
   */
  loadMemorials() {
    this.setData({ loading: true })
    
    // ============================================
    // TODO: 替换为云函数或API调用
    // 示例：wx.cloud.callFunction({ name: 'memorials', data: {} })
    // ============================================
    
    // 示例数据 - 对接后删掉这部分
    const mockData = {
      memorials: [
        {
          id: '1',
          name: '布丁生日',
          petName: '布丁',
          type: 'birthday',
          typeLabel: '生日',
          emoji: '🎂',
          bg: '#FFE0E0',
          date: '2026-07-15',
          dateText: '每年 7 月 15 日',
          repeat: 'yearly'
        },
        {
          id: '2',
          name: '到家纪念日',
          petName: '布丁',
          type: 'gotcha',
          typeLabel: '到家日',
          emoji: '🏠',
          bg: '#D0F0E0',
          date: '2026-03-20',
          dateText: '每年 3 月 20 日',
          repeat: 'yearly'
        },
        {
          id: '3',
          name: '第一次洗澡',
          petName: '布丁',
          type: 'milestone',
          typeLabel: '里程碑',
          emoji: '🛁',
          bg: '#D8E4FF',
          date: '2026-04-10',
          dateText: '2026 年 4 月 10 日',
          repeat: 'once'
        },
        {
          id: '4',
          name: '健康体检日',
          petName: '年糕',
          type: 'health',
          typeLabel: '健康日',
          emoji: '🩺',
          bg: '#FFF0E0',
          date: '2026-05-20',
          dateText: '每年 5 月 20 日',
          repeat: 'yearly'
        }
      ]
    }

    // 处理数据
    const memorials = this.processMemorials(mockData.memorials)
    
    // 分组
    const groups = this.groupMemorials(memorials)
    
    // 找到下一个最近的纪念日
    const nextMemorial = this.findNextMemorial(memorials)

    this.setData({
      memorials,
      memorialGroups: groups,
      nextMemorial,
      loading: false
    })
  },

  /**
   * 处理纪念日数据，计算倒计时
   */
  processMemorials(rawList) {
    const now = new Date()
    const currentYear = now.getFullYear()
    
    return rawList.map(item => {
      const dateObj = new Date(item.date)
      
      let calcDate
      if (item.repeat === 'yearly') {
        // 年重复：使用今年或明年的日期
        calcDate = new Date(currentYear, dateObj.getMonth(), dateObj.getDate())
        if (calcDate < now) {
          calcDate = new Date(currentYear + 1, dateObj.getMonth(), dateObj.getDate())
        }
      } else {
        calcDate = dateObj
      }
      
      // 计算天数差
      const diffTime = calcDate.getTime() - now.getTime()
      const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      return {
        ...item,
        daysUntil
      }
    })
  },

  /**
   * 按类型分组
   */
  groupMemorials(list) {
    const typeConfig = {
      birthday: { typeName: '🎂 生日', color: '#FF6B6B' },
      gotcha:   { typeName: '🏠 到家日', color: '#4CAF50' },
      milestone: { typeName: '⭐ 里程碑', color: '#6B9FFF' },
      health:   { typeName: '🩺 健康日', color: '#F59E0B' }
    }
    
    const groups = {}
    const sortedList = [...list].sort((a, b) => a.daysUntil - b.daysUntil)
    
    sortedList.forEach(item => {
      const type = item.type || 'other'
      if (!groups[type]) {
        groups[type] = {
          type,
          ...typeConfig[type] || { typeName: '📌 其他', color: '#9CA3AF' },
          list: []
        }
      }
      groups[type].list.push(item)
    })
    
    // 按配置顺序排序
    const order = ['birthday', 'gotcha', 'milestone', 'health']
    return order
      .filter(key => groups[key])
      .map(key => groups[key])
  },

  /**
   * 找到最近的下一个纪念日
   */
  findNextMemorial(list) {
    const upcoming = list
      .filter(item => item.daysUntil >= 0)
      .sort((a, b) => a.daysUntil - b.daysUntil)
    
    return upcoming.length > 0 ? upcoming[0] : null
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack()
  },

  /**
   * 点击纪念日卡片
   */
  onMemorialTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/memorial-detail/memorial-detail?id=${id}`
    })
  },

  /**
   * 添加纪念日
   */
  onAddTap() {
    wx.navigateTo({
      url: '/pages/add-memorial/add-memorial'
    })
  }
})
