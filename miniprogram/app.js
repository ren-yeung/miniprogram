/**
 * 暖宠星球 - 全局JS
 * 包含用户认证、全局状态管理、云开发初始化
 * 
 * 优化说明 (2026-05-12):
 * 1. 移除冗余的Token管理，统一使用 request.js 的 TokenManager
 * 2. 简化登录逻辑，委托给 request.js 处理
 * 3. 优化全局状态管理
 * 4. 改进错误处理
 */

// 引入请求封装
const request = require('./utils/request.js')

App({
  globalData: {
    // 用户认证信息（从 storage 同步）
    uid: '',           
    token: '',         
    userInfo: null,    
    isLoggedIn: false, 
    
    // 云开发配置
    openid: '',        
    
    // 系统信息 - 导航栏适配
    statusBarHeight: 0,    
    navBarHeight: 0,       
    menuButtonTop: 0,      
    menuButtonHeight: 0,  
    menuButtonBottom: 0,   
    
    // 位置信息
    location: {
      city: '上海',
      latitude: 31.230416,
      longitude: 121.473701
    }
  },

  onLaunch() {
    // ========== 云开发初始化 ==========
    if (!wx.cloud) {
      console.error('[App] 当前微信版本不支持云开发，请升级')
    } else {
      wx.cloud.init({
        env: 'yangchangren-d7gzeie6f61d60403',
        traceUser: true
      })
      console.log('[App] 云开发初始化完成')
    }
    
    // ========== 导航栏适配 ==========
    this.initNavBar()
    
    // ========== 同步认证状态 ==========
    this.syncAuthState()
    
    // ========== 尝试静默登录 ==========
    this.tryAutoLogin()
  },

  /**
   * 初始化导航栏适配
   */
  initNavBar() {
    try {
      const sysInfo = wx.getSystemInfoSync()
      const menuButton = wx.getMenuButtonBoundingClientRect()
      
      const statusBarHeight = sysInfo.statusBarHeight || 0
      const menuButtonTop = menuButton.top
      const menuButtonHeight = menuButton.height
      const menuButtonBottom = menuButton.bottom
      
      // 导航栏高度 = 胶囊按钮bottom + (胶囊按钮top - 状态栏高度)
      const navBarHeight = menuButtonBottom + (menuButtonTop - statusBarHeight)
      
      // 存储到全局数据
      Object.assign(this.globalData, {
        statusBarHeight,
        navBarHeight,
        menuButtonTop,
        menuButtonHeight,
        menuButtonBottom
      })
      
      console.log('[App] 导航栏适配完成:', {
        statusBarHeight,
        navBarHeight,
        menuButtonTop,
        menuButtonHeight
      })
    } catch (e) {
      console.error('[App] 导航栏适配失败:', e)
    }
  },

  /**
   * 同步本地存储的认证状态到 globalData
   */
  syncAuthState() {
    try {
      const token = request.token.get()
      const uid = request.token.getUid()
      const userInfo = wx.getStorageSync('user_info') || null
      const openid = wx.getStorageSync('user_openid') || ''

      this.globalData.uid = uid
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.openid = openid
      this.globalData.isLoggedIn = !!(uid && token)

      console.log('[App] 认证状态同步完成:', {
        isLoggedIn: this.globalData.isLoggedIn,
        uid: uid ? '***' : ''
      })
    } catch (e) {
      console.error('[App] 同步认证状态失败:', e)
    }
  },

  /**
   * 尝试自动登录（静默登录）
   */
  tryAutoLogin() {
    // 如果已登录，无需重复登录
    if (this.globalData.isLoggedIn) {
      console.log('[App] 用户已登录，跳过自动登录')
      return Promise.resolve({
        uid: this.globalData.uid,
        token: this.globalData.token
      })
    }

    // 尝试静默登录
    return request.silentLogin()
      .then(res => {
        console.log('[App] 静默登录成功')
        this.syncAuthState()
        return res
      })
      .catch(err => {
        console.log('[App] 静默登录失败（非致命）:', err.message)
        // 静默登录失败不阻塞应用启动
        return null
      })
  },

  /**
   * 检查认证状态
   * @returns {boolean} 是否已登录
   */
  checkAuth() {
    return request.token.isLoggedIn()
  },

  /**
   * 获取用户ID
   * @returns {string} uid
   */
  getUid() {
    return request.token.getUid()
  },

  /**
   * 获取Token
   * @returns {string} token
   */
  getToken() {
    return request.token.get()
  },

  /**
   * 发起登录（跳转登录页）
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
    // 清除认证信息
    request.token.clear()
    wx.removeStorageSync('user_info')
    
    // 更新全局状态
    Object.assign(this.globalData, {
      uid: '',
      token: '',
      userInfo: null,
      isLoggedIn: false
    })
    
    console.log('[App] 用户已退出登录')
    
    // 通知所有页面更新登录状态
    const pages = getCurrentPages()
    pages.forEach(page => {
      if (typeof page.onLoginStateChange === 'function') {
        page.onLoginStateChange(false)
      }
    })
  },

  /**
   * 检查登录状态，未登录则跳转登录页
   * @param {Function} callback - 登录成功后的回调
   */
  checkLogin(callback) {
    if (this.checkAuth()) {
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
   * 发起网络请求的便捷方法（使用优化后的 request）
   * @param {Object} options - 请求选项
   */
  request(options) {
    return request.request(options)
  },

  /**
   * 调用云函数（使用优化后的 cloudCall）
   * @param {string} name - 云函数名称
   * @param {object} data - 参数
   * @returns {Promise}
   */
  callCloud(name, data = {}) {
    return request.cloudCall(name, data)
  }
})
