/**
 * 暖宠星球 - 全局JS
 * 包含用户认证、全局状态管理、云开发初始化
 */

// 引入请求封装
const request = require('./utils/request.js')

App({
  globalData: {
    // 用户认证信息
    uid: '',           // 用户唯一ID
    token: '',         // 认证token
    refreshToken: '',   // 刷新token
    userInfo: null,    // 用户信息（昵称、头像等）
    isLoggedIn: false, // 登录状态
    
    // ⚠️ 云开发配置
    openid: '',        // 微信openid（云开发自动获取）
    
    // 系统信息 - 导航栏适配
    statusBarHeight: 0,    // 状态栏高度
    navBarHeight: 0,       // 导航栏总高度（状态栏+胶囊按钮区域）
    menuButtonTop: 0,      // 胶囊按钮top值
    menuButtonHeight: 0,  // 胶囊按钮高度
    menuButtonBottom: 0,  // 胶囊按钮bottom值
    
    location: {
      city: '上海',
      latitude: 31.230416,
      longitude: 121.473701
    }
  },

  onLaunch() {
    // ========== 云开发初始化 ==========
    // ⚠️ 重要：请替换为你的云开发环境ID
    // 在微信开发者工具中查看：云开发控制台 -> 设置 -> 环境ID
    if (!wx.cloud) {
      console.error('当前微信版本不支持云开发，请升级')
    } else {
      wx.cloud.init({
        // ⚠️ 请替换为你的云开发环境ID
        env: 'yangchangren-d7gzeie6f61d60403',
        traceUser: true  // 访问用户时是否记录用户访问记录
      })
      console.log('[App] 云开发初始化完成，环境: yangchangren-d7gzeie6f61d60403')
    }
    
    // ========== 导航栏适配：动态计算胶囊按钮位置 ==========
    const sysInfo = wx.getSystemInfoSync()
    const menuButton = wx.getMenuButtonBoundingClientRect()
    
    // 状态栏高度
    const statusBarHeight = sysInfo.statusBarHeight || 0
    
    // 胶囊按钮的bottom值 = 状态栏高度 + 胶囊按钮上下间距 * 2 + 胶囊按钮高度
    // 导航栏总高度 = 胶囊按钮bottom + 胶囊按钮与状态栏的间距
    // 间距 = menuButton.top - statusBarHeight
    const menuButtonTop = menuButton.top
    const menuButtonHeight = menuButton.height
    const menuButtonBottom = menuButton.bottom
    
    // 导航栏高度 = 胶囊按钮bottom值 + (胶囊按钮top - 状态栏高度)
    // 即：胶囊按钮底部 + 胶囊按钮与状态栏的间距
    const navBarHeight = menuButtonBottom + (menuButtonTop - statusBarHeight)
    
    // 存储到全局数据
    this.globalData.statusBarHeight = statusBarHeight
    this.globalData.navBarHeight = navBarHeight
    this.globalData.menuButtonTop = menuButtonTop
    this.globalData.menuButtonHeight = menuButtonHeight
    this.globalData.menuButtonBottom = menuButtonBottom
    
    console.log('导航栏适配参数:', {
      statusBarHeight,
      navBarHeight,
      menuButtonTop,
      menuButtonHeight,
      menuButtonBottom
    })

    // 启动时尝试静默登录
    this.silentLogin()
    
    // 检查登录状态并同步到 globalData
    this.syncAuthState()
  },

  /**
   * 同步本地存储的认证状态到 globalData
   */
  syncAuthState() {
    try {
      const uid = wx.getStorageSync('user_uid') || ''
      const token = wx.getStorageSync('auth_token') || ''
      const refreshToken = wx.getStorageSync('refresh_token') || ''
      const userInfo = wx.getStorageSync('user_info') || null
      const openid = wx.getStorageSync('user_openid') || ''

      this.globalData.uid = uid
      this.globalData.token = token
      this.globalData.refreshToken = refreshToken
      this.globalData.userInfo = userInfo
      this.globalData.openid = openid
      this.globalData.isLoggedIn = !!(uid && token)
    } catch (e) {
      console.error('同步认证状态失败:', e)
    }
  },

  /**
   * 静默登录 - 通过云函数登录
   */
  silentLogin() {
    // 如果已登录，直接返回
    if (this.globalData.isLoggedIn) {
      return Promise.resolve({
        uid: this.globalData.uid,
        token: this.globalData.token
      })
    }

    return new Promise((resolve, reject) => {
      // 调用登录云函数
      wx.cloud.callFunction({
        name: 'login',
        data: {}
      }).then(res => {
        console.log('[App] 云函数登录结果:', res)
        
        if (res.result && res.result.code === 0) {
          const { uid, token, refreshToken, userInfo } = res.result.data
          
          // 保存到本地存储
          wx.setStorageSync('user_uid', uid)
          wx.setStorageSync('auth_token', token)
          if (refreshToken) {
            wx.setStorageSync('refresh_token', refreshToken)
          }
          if (userInfo) {
            wx.setStorageSync('user_info', userInfo)
          }
          
          // 更新全局数据
          this.globalData.uid = uid
          this.globalData.token = token
          this.globalData.refreshToken = refreshToken || ''
          this.globalData.userInfo = userInfo
          this.globalData.isLoggedIn = true
          
          resolve({ uid, token })
        } else {
          console.error('[App] 登录失败:', res.result)
          reject(new Error(res.result?.message || '登录失败'))
        }
      }).catch(err => {
        console.error('[App] 调用登录云函数失败:', err)
        reject(err)
      })
    })
  },

  /**
   * 检查认证状态
   * @returns {boolean} 是否已登录
   */
  checkAuth() {
    return this.globalData.isLoggedIn && !!this.globalData.uid
  },

  /**
   * 获取用户ID
   * @returns {string} uid
   */
  getUid() {
    return this.globalData.uid
  },

  /**
   * 获取Token
   * @returns {string} token
   */
  getToken() {
    return this.globalData.token
  },

  /**
   * 发起登录
   */
  doLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  /**
   * 退出登录
   */
  logout() {
    // 只清除认证相关存储，不影响其他数据
    wx.removeStorageSync('user_uid')
    wx.removeStorageSync('auth_token')
    wx.removeStorageSync('refresh_token')
    wx.removeStorageSync('user_info')
    // 保留 openid
    
    this.globalData.uid = ''
    this.globalData.token = ''
    this.globalData.refreshToken = ''
    this.globalData.userInfo = null
    this.globalData.isLoggedIn = false
    
    console.log('[App] 用户已退出登录')
    
    // 通知当前页面更新
    const pages = getCurrentPages()
    pages.forEach(page => {
      if (page.onLoginStateChange) {
        page.onLoginStateChange(false)
      }
    })
  },

  /**
   * 检查登录状态，未登录则跳转登录页
   * @param {Function} callback - 登录成功后的回调
   */
  checkLogin(callback) {
    if (this.globalData.isLoggedIn) {
      callback && callback()
    } else {
      wx.showModal({
        title: '提示',
        content: '请先登录后操作',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.doLogin()
          }
        }
      })
    }
  },

  /**
   * 提示需要登录
   * @param {string} message - 提示信息
   */
  showLoginTip(message = '请先登录') {
    wx.showModal({
      title: '提示',
      content: message,
      confirmText: '去登录',
      success: (res) => {
        if (res.confirm) {
          this.doLogin()
        }
      }
    })
  },

  /**
   * 发起网络请求的便捷方法
   * @param {Object} options - 请求选项
   */
  request(options) {
    const defaultOptions = {
      header: {}
    }
    
    // 添加认证token
    if (this.globalData.token) {
      defaultOptions.header['Authorization'] = `Bearer ${this.globalData.token}`
    }
    
    // 合并选项
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      header: {
        ...defaultOptions.header,
        ...options.header
      }
    }
    
    return request(mergedOptions)
  },

  /**
   * 调用云函数
   * @param {string} name - 云函数名称
   * @param {object} data - 参数
   * @returns {Promise}
   */
  callCloud(name, data = {}) {
    return wx.cloud.callFunction({
      name: name,
      data: data
    })
  }
})
