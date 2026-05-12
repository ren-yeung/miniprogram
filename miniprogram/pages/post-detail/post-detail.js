/**
 * 帖子详情页 - pages/post-detail/post-detail.js
 * 暖宠星球小程序 - 帖子详情页
 * 
 * 功能：
 * 1. 帖子详情展示
 * 2. 点赞、评论等交互（需登录）
 * 3. 数据隔离 - 用户操作带上 uid
 */

const app = getApp()

Page({
  data: {
    post: {
      id: 1,
      title: '周末带肉丸去了趟宠物乐园，它居然会游泳了！🏊 太惊喜了～',
      content: '今天带我家肉丸去了新开的宠物乐园，本来以为它会害怕水，没想到它居然学会了游泳！太聪明了！\n\n🏊 第一次下水\n🐕 克服恐惧\n🎉 玩得很开心',
      images: [
        'https://picsum.photos/seed/detail1/750/750',
        'https://picsum.photos/seed/detail2/750/750',
        'https://picsum.photos/seed/detail3/750/750'
      ],
      likes: 345,
      comments: 28,
      user: {
        name: '肉丸妈',
        avatar: 'https://i.pravatar.cc/64?img=3'
      },
      category: '晒宠',
      createTime: '2小时前'
    },
    liked: false,
    currentImage: 0,
    statusBarHeight: 0,
    menuButtonHeight: 0
  },

  onLoad(options) {
    const app = getApp()
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      menuButtonHeight: app.globalData.menuButtonHeight
    })
    const id = options.id
    console.log('[PostDetail] Post ID:', id)
    
    // TODO: 调用后端接口获取帖子详情
    // const request = require('../../utils/request.js')
    // request.get('/api/posts/detail', { id })
    //   .then(res => {
    //     this.setData({ post: res.data })
    //   })
    //   .catch(err => console.error('[PostDetail] 获取详情失败:', err))

    // 如果已登录，记录当前用户 uid
    if (app.checkAuth()) {
      const uid = app.getUid()
      console.log('[PostDetail] 当前用户 uid:', uid)
    }
  },

  onImageChange(e) {
    this.setData({
      currentImage: e.detail.current
    })
  },

  onLikeTap() {
    // 检查登录状态
    if (!app.checkAuth()) {
      app.showLoginTip('登录后即可点赞')
      return
    }

    const uid = app.getUid()
    const postId = this.data.post.id
    console.log('[PostDetail] 点赞, postId:', postId, 'uid:', uid)

    // TODO: 调用后端接口记录点赞
    // const request = require('../../utils/request.js')
    // request.post('/api/posts/like', { postId, uid })
    //   .then(res => { ... })
    //   .catch(err => console.error('[PostDetail] 点赞失败:', err))

    // 本地更新
    this.setData({
      liked: !this.data.liked,
      'post.likes': this.data.liked ? this.data.post.likes + 1 : this.data.post.likes - 1
    })
  },

  onCommentTap() {
    // 检查登录状态
    if (!app.checkAuth()) {
      app.showLoginTip('登录后即可评论')
      return
    }

    wx.showToast({
      title: '评论功能开发中',
      icon: 'none'
    })
    // TODO: 实现评论功能
    // wx.showModal({
    //   title: '发表评论',
    //   editable: true,
    //   placeholderText: '说点什么...',
    //   success: (res) => {
    //     if (res.confirm && res.content) {
    //       const request = require('../../utils/request.js')
    //       request.post('/api/posts/comment', {
    //         postId: this.data.post.id,
    //         content: res.content,
    //         uid: app.getUid()
    //       }).then(res => {
    //         wx.showToast({ title: '评论成功', icon: 'success' })
    //         // 更新评论数
    //         this.setData({
    //           'post.comments': this.data.post.comments + 1
    //         })
    //       })
    //     }
    //   }
    // })
  },

  onShareTap() {
    // 检查登录状态
    if (!app.checkAuth()) {
      app.showLoginTip('登录后才能分享')
      return
    }

    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
    // TODO: 实现分享功能
  },

  onCollectTap() {
    // 检查登录状态
    if (!app.checkAuth()) {
      app.showLoginTip('登录后即可收藏')
      return
    }

    const uid = app.getUid()
    const postId = this.data.post.id
    console.log('[PostDetail] 收藏, postId:', postId, 'uid:', uid)

    // TODO: 调用后端接口收藏
    // const request = require('../../utils/request.js')
    // request.post('/api/posts/collect', { postId, uid })

    wx.showToast({
      title: '已收藏',
      icon: 'success'
    })
  },

  onUserTap() {
    // 查看用户详情
    const userId = this.data.post.user.id
    console.log('[PostDetail] 查看用户:', userId)
    // TODO: 跳转到用户主页
    // wx.navigateTo({
    //   url: '/pages/user-home/user-home?uid=' + userId
    // })
  },

  onBackTap() {
    wx.navigateBack()
  }
})
