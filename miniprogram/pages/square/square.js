/**
 * 广场页 - pages/square/square.js
 * 暖宠星球小程序 - 帖子广场页
 * 
 * 功能：
 * 1. 分类帖子展示
 * 2. 点赞、评论等交互（需登录）
 * 3. 数据隔离 - 用户操作带上 uid
 */

const app = getApp()

Page({
  data: {
    // 导航栏适配 - 从全局获取
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonTop: 0,
    menuButtonHeight: 0,
    
    squareTabs: [
      { id: 'all', name: '全部', active: true },
      { id: '晒宠', name: '晒宠日常', active: false },
      { id: '求助', name: '求助问答', active: false },
      { id: '送养', name: '宠物送养', active: false },
      { id: '闲置', name: '二手闲置', active: false },
      { id: '经验', name: '养宠经验', active: false }
    ],
    leftPosts: [],
    rightPosts: [],
    loading: false,
    hasMore: true,
    showPublishSheet: false,
    publishOptions: [
      { id: '晒宠', icon: '📷', name: '晒宠日常', color: '#FFF0F0' },
      { id: '送养', icon: '🏠', name: '宠物送养', color: '#FFF9F0' },
      { id: '求助', icon: '🤝', name: '求助问答', color: '#FDF4FF' },
      { id: '闲置', icon: '🔄', name: '二手闲置', color: '#F0F4FF' },
      { id: '走失', icon: '🔍', name: '走失寻主', color: '#F0FFF4' },
      { id: '聚会', icon: '🎉', name: '萌宠聚会', color: '#FFF4F4' }
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
    this.loadPosts()
  },

  onShow() {
    // 设置自定义TabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  // Tab切换
  onTabTap(e) {
    const id = e.currentTarget.dataset.id
    const squareTabs = this.data.squareTabs.map(item => ({
      ...item,
      active: item.id === id
    }))
    this.setData({ squareTabs })
    this.loadPosts()
  },

  // 搜索
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  // 加载帖子
  loadPosts() {
    if (this.data.loading) return
    
    this.setData({ loading: true })
    
    // 模拟数据
    setTimeout(() => {
      const mockPosts = [
        { id: 1, title: '🐶 柴犬宝宝的日常萌照', content: '今天带豆豆去公园玩，太开心了！', images: ['https://picsum.photos/seed/dog1/400/400'], likes: 128, comments: 23, author: '豆豆妈', avatar: 'https://picsum.photos/seed/avatar1/100/100', tag: '晒宠' },
        { id: 2, title: '🐱 猫咪撒娇时刻', content: '主子今天心情好，一直蹭蹭~', images: ['https://picsum.photos/seed/cat1/400/500'], likes: 256, comments: 45, author: '喵星人', avatar: 'https://picsum.photos/seed/avatar2/100/100', tag: '晒宠' },
        { id: 3, title: '🐰 兔兔第一次出门', content: '带小白去宠物店，超乖的！', images: ['https://picsum.photos/seed/rabbit1/400/300'], likes: 89, comments: 12, author: '兔兔控', avatar: 'https://picsum.photos/seed/avatar3/100/100', tag: '晒宠' },
        { id: 4, title: '🐹 仓鼠的豪华别墅', content: '给仓仓换了大房子，太幸福了', images: ['https://picsum.photos/seed/hamster1/400/400'], likes: 167, comments: 28, author: '仓鼠主人', avatar: 'https://picsum.photos/seed/avatar4/100/100', tag: '晒宠' },
        { id: 5, title: '🐶 金毛寻回犬的游泳初体验', content: '第一次下水，太勇敢了！', images: ['https://picsum.photos/seed/dog2/400/400'], likes: 324, comments: 56, author: '金毛爸', avatar: 'https://picsum.photos/seed/avatar5/100/100', tag: '晒宠' },
        { id: 6, title: '🐱 布偶猫的睡颜', content: '每天看它睡觉都觉得好治愈', images: ['https://picsum.photos/seed/cat2/400/450'], likes: 412, comments: 67, author: '布偶奴', avatar: 'https://picsum.photos/seed/avatar6/100/100', tag: '晒宠' },
        { id: 7, title: '🦜 虎皮鹦鹉学说话', content: '终于学会说你好了！', images: ['https://picsum.photos/seed/bird1/400/400'], likes: 198, comments: 34, author: '鸟类爱好者', avatar: 'https://picsum.photos/seed/avatar7/100/100', tag: '晒宠' },
        { id: 8, title: '🐶 柯基的小短腿', content: '爬楼梯真的好努力啊哈哈哈', images: ['https://picsum.photos/seed/dog3/400/350'], likes: 567, comments: 89, author: '柯基控', avatar: 'https://picsum.photos/seed/avatar8/100/100', tag: '晒宠' },
      ]
      
      // 左右分栏
      const leftPosts = mockPosts.filter((_, i) => i % 2 === 0)
      const rightPosts = mockPosts.filter((_, i) => i % 2 === 1)
      
      this.setData({
        leftPosts,
        rightPosts,
        loading: false,
        hasMore: false
      })
    }, 500)
  },

  // 帖子点击
  onPostTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    })
  },

  // 点赞
  onLikeTap(e) {
    const id = e.currentTarget.dataset.id
    // 简化处理
    wx.showToast({
      title: '已点赞',
      icon: 'none'
    })
  },

  // 发布按钮
  onPublishTap() {
    this.setData({ showPublishSheet: true })
  },

  // 关闭发布面板
  onClosePublish() {
    this.setData({ showPublishSheet: false })
  },

  // 选择发布类型
  onSelectPublish(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ showPublishSheet: false })
    
    if (app.globalData.isLoggedIn) {
      wx.navigateTo({
        url: `/pages/publish/publish?type=${type}`
      })
    } else {
      wx.showModal({
        title: '提示',
        content: '请先登录后发布内容',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            })
          }
        }
      })
    }
  },

  // 刷新
  onPullDownRefresh() {
    this.loadPosts()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})
