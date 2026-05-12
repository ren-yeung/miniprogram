/**
 * 我的页面 - pages/profile/profile.js
 * 暖宠星球小程序 - 个人中心页
 * 
 * 功能：
 * 1. 登录状态展示
 * 2. 用户信息管理（云函数）
 * 3. 数据隔离 - 用户专属数据
 */

const app = getApp()

Page({
  data: {
    // 导航栏适配 - 从全局获取
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonTop: 0,
    menuButtonHeight: 0,
    
    // 登录状态
    isLoggedIn: false,
    
    // 用户信息（登录后显示）
    userInfo: null,
    uid: '',
    
    // 未登录时的展示数据
    guestInfo: {
      name: '点击登录',
      avatar: '/assets/images/avatar-guest.png',
      bio: '登录后查看更多内容'
    },
    
    // 默认显示的用户数据
    stats: {
      likes: '0',
      following: '0',
      followers: '0',
      posts: '0'
    },
    wallet: {
      coins: '0',
      balance: '0.00',
      messages: 0
    },
    menuList1: [
      { id: 1, name: '我的发布', icon: '📝', badge: false, count: '0篇', bg: '#FFF0F0', requireLogin: true },
      { id: 2, name: '我的点赞', icon: '❤️', badge: false, count: '0篇', bg: '#F0FFF4', requireLogin: true },
      { id: 3, name: '我的收藏', icon: '⭐', badge: false, count: '0篇', bg: '#F0F4FF', requireLogin: true },
      { id: 4, name: '我的活动', icon: '🎪', badge: false, count: '', bg: '#FFF9F0', requireLogin: true }
    ],
    menuList2: [
      { id: 5, name: '宠物管理', icon: '🐾', badge: false, bg: '#FDF4FF', requireLogin: true },
      { id: 6, name: '健康档案', icon: '🩺', badge: false, bg: '#FFE0E0', requireLogin: true },
      { id: 7, name: '购物订单', icon: '📦', badge: false, bg: '#F0F9F0', requireLogin: false },
      { id: 8, name: '钱包充值', icon: '💰', badge: false, bg: '#FFF8E0', requireLogin: true }
    ],
    menuList3: [
      { id: 9, name: '帮助中心', icon: '❓', badge: false, bg: '#F0F4FF' },
      { id: 10, name: '关于我们', icon: 'ℹ️', badge: false, bg: '#FFF0F0' },
      { id: 11, name: '联系客服', icon: '📞', badge: false, bg: '#F0FFF4' }
    ],

    // 编辑弹窗
    showEditModal: false,
    editForm: {
      nickname: '',
      phone: '',
      code: '',
      address: ''
    },
    codeCountdown: 0
  },

  onLoad() {
    // 从全局获取导航栏适配参数
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      menuButtonTop: app.globalData.menuButtonTop,
      menuButtonHeight: app.globalData.menuButtonHeight
    })
    
    // 同步登录状态
    this.syncLoginState()
  },

  onShow() {
    // 设置自定义TabBar选中状态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
    // 每次显示页面时同步登录状态
    this.syncLoginState()
  },

  /**
   * 同步登录状态
   */
  syncLoginState() {
    const isLoggedIn = app.globalData.isLoggedIn
    const userInfo = app.globalData.userInfo
    const uid = app.globalData.uid
    
    this.setData({
      isLoggedIn,
      userInfo,
      uid
    })
    
    // 如果已登录，更新用户数据
    if (isLoggedIn && userInfo) {
      this.setData({
        stats: {
          likes: userInfo.stats?.likes || '0',
          following: userInfo.stats?.following || '0',
          followers: userInfo.stats?.followers || '0',
          posts: userInfo.stats?.posts || '0'
        },
        wallet: {
          coins: userInfo.coins || '0',
          balance: userInfo.balance || '0.00',
          messages: userInfo.messages || 0
        }
      })
      
      // 从云函数获取最新用户信息
      this.fetchUserProfile()
    }
  },

  /**
   * 从云函数获取用户信息
   */
  fetchUserProfile() {
    if (!wx.cloud) return
    
    wx.cloud.callFunction({
      name: 'user',
      data: {
        action: 'getProfile'
      }
    }).then(res => {
      console.log('[Profile] 获取用户信息:', res)
      if (res.result && res.result.code === 0) {
        const profile = res.result.data
        this.setData({
          userInfo: profile,
          stats: profile.stats || this.data.stats,
          wallet: {
            coins: profile.coins || '0',
            balance: profile.balance || '0.00',
            messages: profile.messages || 0
          }
        })
        
        // 更新全局数据
        app.globalData.userInfo = profile
        wx.setStorageSync('user_info', profile)
      }
    }).catch(err => {
      console.error('[Profile] 获取用户信息失败:', err)
    })
  },

  // 登录点击
  onLoginTap() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 编辑资料
  onEditTap() {
    if (!this.data.isLoggedIn) {
      this.onLoginTap()
      return
    }
    const userInfo = this.data.userInfo || {}
    this.setData({
      showEditModal: true,
      editForm: {
        nickname: userInfo.name || '',
        phone: userInfo.phone || '',
        code: '',
        address: userInfo.address || ''
      }
    })
  },

  // 关闭编辑弹窗
  onCloseEditModal() {
    this.setData({ showEditModal: false })
  },

  // 阻止事件冒泡（防止点击弹窗内容区关闭）
  onPreventBubble() {
    return
  },

  // 修改头像（支持云函数）
  onChangeAvatar() {
    if (!this.data.isLoggedIn) {
      this.onLoginTap()
      return
    }
    
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempFilePath = res.tempFilePaths[0]
        
        wx.showLoading({ title: '上传中...' })
        
        try {
          // 上传到云存储
          const cloudPath = `avatars/${app.globalData.uid}_${Date.now()}.jpg`
          
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath: cloudPath,
            filePath: tempFilePath
          })
          
          console.log('[Profile] 头像上传成功:', uploadResult)
          
          // 调用云函数更新头像
          const fileID = uploadResult.fileID
          
          wx.cloud.callFunction({
            name: 'user',
            data: {
              action: 'updateAvatar',
              avatarUrl: fileID
            }
          }).then(updateRes => {
            console.log('[Profile] 更新头像结果:', updateRes)
            wx.hideLoading()
            
            if (updateRes.result && updateRes.result.code === 0) {
              // 更新本地显示
              const userInfo = this.data.userInfo || {}
              userInfo.avatar = fileID
              this.setData({ userInfo })
              app.globalData.userInfo = userInfo
              wx.setStorageSync('user_info', userInfo)
              
              wx.showToast({ title: '头像已更新', icon: 'success' })
            } else {
              // 仍然更新本地（云端可能失败）
              const userInfo = this.data.userInfo || {}
              userInfo.avatar = tempFilePath
              this.setData({ userInfo })
              wx.showToast({ title: '头像已本地更新', icon: 'none' })
            }
          }).catch(err => {
            console.error('[Profile] 更新头像失败:', err)
            wx.hideLoading()
            // 本地更新
            const userInfo = this.data.userInfo || {}
            userInfo.avatar = tempFilePath
            this.setData({ userInfo })
            wx.showToast({ title: '头像已本地更新', icon: 'none' })
          })
          
        } catch (err) {
          console.error('[Profile] 上传失败:', err)
          wx.hideLoading()
          wx.showToast({ title: '上传失败，请重试', icon: 'none' })
        }
      }
    })
  },

  // 输入事件
  onNicknameInput(e) {
    this.setData({ 'editForm.nickname': e.detail.value })
  },
  onPhoneInput(e) {
    this.setData({ 'editForm.phone': e.detail.value })
  },
  onCodeInput(e) {
    this.setData({ 'editForm.code': e.detail.value })
  },
  onAddressInput(e) {
    this.setData({ 'editForm.address': e.detail.value })
  },

  // 保存编辑（支持云函数）
  onSaveEdit() {
    const { nickname, phone, address } = this.data.editForm
    
    if (!nickname) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }
    
    wx.showLoading({ title: '保存中...' })
    
    if (wx.cloud) {
      // 使用云函数更新
      wx.cloud.callFunction({
        name: 'user',
        data: {
          action: 'updateProfile',
          name: nickname,
          phone: phone,
          address: address
        }
      }).then(res => {
        console.log('[Profile] 更新资料结果:', res)
        wx.hideLoading()
        
        if (res.result && res.result.code === 0) {
          // 更新本地显示
          const userInfo = this.data.userInfo || {}
          userInfo.name = nickname
          userInfo.phone = phone
          userInfo.address = address
          this.setData({ 
            userInfo,
            showEditModal: false 
          })
          app.globalData.userInfo = userInfo
          wx.setStorageSync('user_info', userInfo)
          
          wx.showToast({ title: '保存成功', icon: 'success' })
        } else {
          wx.showToast({ title: res.result?.message || '保存失败', icon: 'none' })
        }
      }).catch(err => {
        console.error('[Profile] 更新资料失败:', err)
        wx.hideLoading()
        wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      })
    } else {
      // 降级：仅本地更新
      const userInfo = this.data.userInfo || {}
      userInfo.name = nickname
      userInfo.phone = phone
      userInfo.address = address
      this.setData({ 
        userInfo,
        showEditModal: false 
      })
      app.globalData.userInfo = userInfo
      wx.setStorageSync('user_info', userInfo)
      wx.hideLoading()
      wx.showToast({ title: '保存成功', icon: 'success' })
    }
  },

  // 菜单点击
  onMenuTap(e) {
    const id = e.currentTarget.dataset.id
    const requireLogin = e.currentTarget.dataset.login
    
    if (requireLogin && !this.data.isLoggedIn) {
      this.onLoginTap()
      return
    }
    
    switch (id) {
      case 1:
        wx.showToast({ title: '我的发布开发中', icon: 'none' })
        break
      case 2:
        wx.showToast({ title: '我的点赞开发中', icon: 'none' })
        break
      case 3:
        wx.showToast({ title: '我的收藏开发中', icon: 'none' })
        break
      case 4:
        wx.showToast({ title: '我的活动开发中', icon: 'none' })
        break
      case 5:
        wx.showToast({ title: '宠物管理开发中', icon: 'none' })
        break
      case 6:
        wx.showToast({ title: '健康档案开发中', icon: 'none' })
        break
      case 7:
        wx.showToast({ title: '购物订单开发中', icon: 'none' })
        break
      case 8:
        wx.showToast({ title: '钱包充值开发中', icon: 'none' })
        break
      case 9:
        wx.showToast({ title: '帮助中心开发中', icon: 'none' })
        break
      case 10:
        wx.showToast({ title: '关于我们开发中', icon: 'none' })
        break
      case 11:
        wx.showToast({ title: '联系客服开发中', icon: 'none' })
        break
    }
  },

  // 退出登录
  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout()
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            uid: '',
            stats: { likes: '0', following: '0', followers: '0', posts: '0' },
            wallet: { coins: '0', balance: '0.00', messages: 0 }
          })
          wx.showToast({ title: '已退出登录', icon: 'success' })
        }
      }
    })
  }
})
