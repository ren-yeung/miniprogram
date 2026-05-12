/**
 * 首页 - pages/index/index.js
 * 暖宠星球小程序首页
 * 
 * 功能：
 * 1. 帖子列表展示（云函数）
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
    
    city: '上海',
    banners: [
      { id: 1, image: 'https://picsum.photos/seed/petbanner1/750/300', title: '免费领养·爱心接力', subtitle: '已有3268位宠主参与' },
      { id: 2, image: 'https://picsum.photos/seed/petbanner2/750/300', title: '春季驱虫全攻略', subtitle: '新手必看的养护指南' },
      { id: 3, image: 'https://picsum.photos/seed/petbanner3/750/300', title: '周末萌宠聚会', subtitle: '城市限定·免费参加' }
    ],
    currentBanner: 0,
    categories: [
      { id: 'all', name: '推荐', emoji: '🔥', active: true },
      { id: 'dog', name: '狗狗', emoji: '🐶', active: false },
      { id: 'cat', name: '猫咪', emoji: '🐱', active: false },
      { id: 'rabbit', name: '兔兔', emoji: '🐰', active: false },
      { id: 'bird', name: '鸟类', emoji: '🦜', active: false },
      { id: 'hamster', name: '仓鼠', emoji: '🐹', active: false },
      { id: 'clinic', name: '问诊', emoji: '🏥', active: false },
      { id: 'goods', name: '好物', emoji: '🎁', active: false }
    ],
    funcIcons: [
      { id: 1, name: '互动交流', icon: '💬', bg: '#FFF0F0' },
      { id: 2, name: '宠物领养', icon: '🏠', bg: '#FFF9F0' },
      { id: 3, name: '走失寻主', icon: '🔍', bg: '#F0FFF4' },
      { id: 4, name: '二手交易', icon: '🔄', bg: '#F0F4FF' },
      { id: 5, name: '求助问答', icon: '🤝', bg: '#FDF4FF' },
      { id: 6, name: '萌宠聚会', icon: '🎉', bg: '#FFF4F4' },
      { id: 7, name: '养宠百科', icon: '📚', bg: '#F0FDF9' },
      { id: 8, name: '症状自查', icon: '🩺', bg: '#F5F0FF' },
      { id: 9, name: '宠物医院', icon: '🏥', bg: '#FFF9F5' },
      { id: 10, name: '更多', icon: '📦', bg: '#FFF9F9' }
    ],
    feedTabs: [
      { id: 'newest', name: '最新', active: true },
      { id: 'nearby', name: '附近', active: false },
      { id: 'hot', name: '互动', active: false },
      { id: 'adopt', name: '送养', active: false }
    ],
    posts: [],
    leftPosts: [],
    rightPosts: [],
    loading: false,
    hasMore: true,
    currentCategory: 'all',
    currentSort: 'newest',
    page: 1
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
      this.getTabBar().setData({ selected: 0 })
    }
  },

  // Banner切换
  onBannerChange(e) {
    this.setData({
      currentBanner: e.detail.current
    })
  },

  // 分类切换
  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    const categories = this.data.categories.map(item => ({
      ...item,
      active: item.id === id
    }))
    this.setData({ 
      categories,
      currentCategory: id,
      page: 1  // 重置页码
    })
    this.loadPosts()
  },

  // 功能图标点击
  onFuncTap(e) {
    const name = e.currentTarget.dataset.name
    if (name === '更多') {
      wx.showToast({
        title: '更多功能开发中',
        icon: 'none'
      })
    } else {
      wx.showToast({
        title: name,
        icon: 'none'
      })
    }
  },

  // 定位点击
  onLocationTap() {
    wx.chooseLocation({
      success: (res) => {
        this.setData({
          city: res.name || '未知位置'
        })
      }
    })
  },

  // 搜索点击
  onSearchTap() {
    wx.navigateTo({
      url: '/pages/search/search'
    })
  },

  // 消息点击
  onMessageTap() {
    wx.showToast({ title: '消息功能开发中', icon: 'none' })
  },

  // Tab切换
  onTabTap(e) {
    const id = e.currentTarget.dataset.id
    const feedTabs = this.data.feedTabs.map(item => ({
      ...item,
      active: item.id === id
    }))
    this.setData({ 
      feedTabs,
      currentSort: id,
      page: 1  // 重置页码
    })
    this.loadPosts()
  },

  // 加载帖子（支持云函数）
  loadPosts(refresh = false) {
    if (this.data.loading) return
    
    const page = refresh ? 1 : this.data.page
    
    this.setData({ loading: true })
    
    // 优先使用云函数
    if (wx.cloud) {
      this.loadPostsFromCloud(page, refresh)
    } else {
      this.loadPostsMock(refresh)
    }
  },

  // 从云函数加载帖子
  loadPostsFromCloud(page, refresh) {
    wx.cloud.callFunction({
      name: 'posts',
      data: {
        action: 'list',
        category: this.data.currentCategory,
        page: page,
        pageSize: 20,
        sortBy: this.data.currentSort
      }
    }).then(res => {
      console.log('[Index] 帖子列表返回:', res)
      this.setData({ loading: false })
      
      if (res.result && res.result.code === 0) {
        const list = res.result.data.list || []
        const hasMore = res.result.data.hasMore
        
        // 处理时间格式
        const formattedList = list.map(post => ({
          ...post,
          time: this.formatTime(post.createdAt),
          liked: post.isLiked || false
        }))
        
        // 如果是刷新，替换列表；否则追加
        const newPosts = refresh ? formattedList : [...this.data.posts, ...formattedList]
        
        // 左右分栏
        const leftPosts = newPosts.filter((_, i) => i % 2 === 0)
        const rightPosts = newPosts.filter((_, i) => i % 2 === 1)
        
        this.setData({
          posts: newPosts,
          leftPosts,
          rightPosts,
          hasMore,
          page: page + 1
        })
      } else {
        console.error('[Index] 获取帖子失败:', res.result)
        // 降级到Mock
        this.loadPostsMock(refresh)
      }
    }).catch(err => {
      console.error('[Index] 云函数调用失败:', err)
      this.setData({ loading: false })
      // 降级到Mock
      this.loadPostsMock(refresh)
    })
  },

  // Mock数据（降级方案）
  loadPostsMock(refresh) {
    setTimeout(() => {
      const mockPosts = [
        { id: 'mock_1', title: '🐶 柴犬宝宝的日常萌照', content: '今天带豆豆去公园玩，太开心了！', images: ['https://picsum.photos/seed/dog1/400/400'], likes: 128, comments: 23, author: { name: '豆豆妈', avatar: 'https://picsum.photos/seed/avatar1/100/100' }, time: '2小时前', liked: false },
        { id: 'mock_2', title: '🐱 猫咪撒娇时刻', content: '主子今天心情好，一直蹭蹭~', images: ['https://picsum.photos/seed/cat1/400/500'], likes: 256, comments: 45, author: { name: '喵星人', avatar: 'https://picsum.photos/seed/avatar2/100/100' }, time: '3小时前', liked: false },
        { id: 'mock_3', title: '🐰 兔兔第一次出门', content: '带小白去宠物店，超乖的！', images: ['https://picsum.photos/seed/rabbit1/400/300'], likes: 89, comments: 12, author: { name: '兔兔控', avatar: 'https://picsum.photos/seed/avatar3/100/100' }, time: '5小时前', liked: false },
        { id: 'mock_4', title: '🐹 仓鼠的豪华别墅', content: '给仓仓换了大房子，太幸福了', images: ['https://picsum.photos/seed/hamster1/400/400'], likes: 167, comments: 28, author: { name: '仓鼠主人', avatar: 'https://picsum.photos/seed/avatar4/100/100' }, time: '6小时前', liked: false },
        { id: 'mock_5', title: '🐶 金毛寻回犬的游泳初体验', content: '第一次下水，太勇敢了！', images: ['https://picsum.photos/seed/dog2/400/400'], likes: 324, comments: 56, author: { name: '金毛爸', avatar: 'https://picsum.photos/seed/avatar5/100/100' }, time: '8小时前', liked: false },
        { id: 'mock_6', title: '🐱 布偶猫的睡颜', content: '每天看它睡觉都觉得好治愈', images: ['https://picsum.photos/seed/cat2/400/450'], likes: 412, comments: 67, author: { name: '布偶奴', avatar: 'https://picsum.photos/seed/avatar6/100/100' }, time: '10小时前', liked: false },
        { id: 'mock_7', title: '🦜 虎皮鹦鹉学说话', content: '终于学会说你好了！', images: ['https://picsum.photos/seed/bird1/400/400'], likes: 198, comments: 34, author: { name: '鸟类爱好者', avatar: 'https://picsum.photos/seed/avatar7/100/100' }, time: '12小时前', liked: false },
        { id: 'mock_8', title: '🐶 柯基的小短腿', content: '爬楼梯真的好努力啊哈哈哈', images: ['https://picsum.photos/seed/dog3/400/350'], likes: 567, comments: 89, author: { name: '柯基控', avatar: 'https://picsum.photos/seed/avatar8/100/100' }, time: '1天前', liked: false },
      ]
      
      const newPosts = refresh ? mockPosts : [...this.data.posts, ...mockPosts]
      
      // 左右分栏
      const leftPosts = newPosts.filter((_, i) => i % 2 === 0)
      const rightPosts = newPosts.filter((_, i) => i % 2 === 1)
      
      this.setData({
        posts: newPosts,
        leftPosts,
        rightPosts,
        loading: false,
        hasMore: false
      })
    }, 500)
  },

  // 格式化时间
  formatTime(timestamp) {
    if (!timestamp) return ''
    const now = Date.now()
    const diff = now - timestamp
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    
    if (diff < minute) {
      return '刚刚'
    } else if (diff < hour) {
      return Math.floor(diff / minute) + '分钟前'
    } else if (diff < day) {
      return Math.floor(diff / hour) + '小时前'
    } else if (diff < 7 * day) {
      return Math.floor(diff / day) + '天前'
    } else {
      const date = new Date(timestamp)
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  },

  // 帖子点击
  onPostTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}`
    })
  },

  // 点赞（支持云函数）
  onLikeTap(e) {
    const id = e.currentTarget.dataset.id
    const post = this.data.posts.find(p => p.id === id)
    if (!post) return
    
    const newLiked = !post.liked
    const newLikes = newLiked ? post.likes + 1 : post.likes - 1
    
    // 先更新UI
    const posts = this.data.posts.map(p => {
      if (p.id === id) {
        return { ...p, liked: newLiked, likes: newLikes }
      }
      return p
    })
    this.setData({ posts })
    
    // 调用云函数
    if (wx.cloud) {
      wx.cloud.callFunction({
        name: 'posts',
        data: {
          action: 'like',
          postId: id,
          action: newLiked ? 'like' : 'unlike'
        }
      }).then(res => {
        console.log('[Index] 点赞结果:', res)
        if (res.result && res.result.code !== 0) {
          // 失败则回滚
          wx.showToast({ title: '操作失败', icon: 'none' })
        }
      }).catch(err => {
        console.error('[Index] 点赞失败:', err)
        // 失败则回滚
        this.setData({
          posts: this.data.posts.map(p => {
            if (p.id === id) {
              return { ...p, liked: !newLiked, likes: post.likes }
            }
            return p
          })
        })
      })
    }
    
    wx.showToast({
      title: newLiked ? '已点赞' : '取消点赞',
      icon: 'none'
    })
  },

  // 评论
  onCommentTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/post-detail/post-detail?id=${id}&focus=comment`
    })
  },

  // 分享
  onShareTap(e) {
    wx.showShareMenu({
      withShareTicket: true
    })
  },

  // 刷新
  onPullDownRefresh() {
    this.loadPosts(true)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadPosts(false)
    }
  },

  // 登录状态变化
  onLoginStateChange(isLoggedIn) {
    this.setData({
      isLoggedIn,
      userInfo: app.globalData.userInfo,
      uid: app.globalData.uid
    })
  }
})
