/**
 * 登录页面 - pages/login/login.js
 * 暖宠星球小程序 - 用户登录页
 * 支持云函数登录模式
 */

const app = getApp()

Page({
  data: {
    loading: false,
    privacyChecked: false,
    statusBarHeight: 0,
    navBarHeight: 0,
    menuButtonHeight: 0
  },

  onLoad(options) {
    // 导航栏适配
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      menuButtonHeight: app.globalData.menuButtonHeight
    })

    // 如果已登录，直接返回
    if (app.globalData.isLoggedIn) {
      this.navigateBack(options.redirect)
    }
  },

  /**
   * 微信一键登录
   * 流程：调用 login 云函数获取 uid + token
   */
  doWechatLogin() {
    if (!this.data.privacyChecked) {
      wx.showToast({
        title: '请先同意隐私政策',
        icon: 'none'
      })
      return
    }

    if (this.data.loading) return
    this.setData({ loading: true })

    // 调用 login 云函数
    this.cloudLogin()
  },

  /**
   * 使用云函数登录
   */
  cloudLogin() {
    wx.showLoading({ title: '登录中...' })

    wx.cloud.callFunction({
      name: 'login',
      data: {}
    }).then(res => {
      console.log('[Login] 云函数返回:', res)
      wx.hideLoading()

      if (res.result && res.result.code === 0) {
        this.handleLoginSuccess(res.result.data)
      } else {
        this.handleLoginError(new Error(res.result?.message || '登录失败'))
      }
    }).catch(err => {
      console.error('[Login] 云函数调用失败:', err)
      wx.hideLoading()

      // 如果云函数不可用，降级到传统方式
      if (err.message && err.message.includes('not found')) {
        wx.showModal({
          title: '提示',
          content: '云函数未部署，是否使用模拟登录？',
          success: (res) => {
            if (res.confirm) {
              this.mockLogin()
            }
          }
        })
      } else {
        this.handleLoginError(err)
      }
    })
  },

  /**
   * 模拟登录（降级方案）
   */
  mockLogin() {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          // 模拟登录成功
          const mockUid = 'mock_' + Date.now()
          const mockToken = 'mock_token_' + Date.now()
          
          this.handleLoginSuccess({
            uid: mockUid,
            token: mockToken,
            refreshToken: '',
            userInfo: {
              name: '暖宠用户',
              avatar: 'https://i.pravatar.cc/144?img=1',
              city: '上海市',
              bio: '暖宠星球萌主'
            }
          })
        } else {
          this.handleLoginError(new Error('获取登录凭证失败'))
        }
      },
      fail: (err) => {
        this.handleLoginError(err)
      }
    })
  },

  /**
   * 处理登录成功
   * 保存 uid、token、refreshToken、userInfo 到本地存储和全局状态
   */
  handleLoginSuccess(data) {
    const { uid, token, refreshToken, userInfo } = data

    try {
      // 保存到本地存储
      wx.setStorageSync('user_uid', uid)
      wx.setStorageSync('auth_token', token)
      if (refreshToken) {
        wx.setStorageSync('refresh_token', refreshToken)
      }
      if (userInfo) {
        wx.setStorageSync('user_info', userInfo)
      }

      // 同步更新 app globalData
      app.globalData.uid = uid
      app.globalData.token = token
      app.globalData.refreshToken = refreshToken || ''
      app.globalData.userInfo = userInfo || null
      app.globalData.isLoggedIn = true
    } catch (e) {
      console.error('[Login] 保存登录信息失败:', e)
    }

    this.setData({ loading: false })

    wx.showToast({
      title: data.isNewUser ? '注册成功' : '登录成功',
      icon: 'success'
    })

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      this.navigateBack()
    }, 1200)
  },

  /**
   * 处理登录失败
   */
  handleLoginError(err) {
    this.setData({ loading: false })
    console.error('[Login] 登录失败:', err)
    wx.showToast({
      title: err.message || '登录失败，请重试',
      icon: 'none'
    })
  },

  /**
   * 返回上一页或首页
   */
  navigateBack(redirect) {
    if (redirect) {
      wx.redirectTo({ url: redirect })
    } else {
      const pages = getCurrentPages()
      if (pages.length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
    }
  },

  /**
   * 手机号登录（预留）
   */
  goPhoneLogin() {
    wx.showToast({
      title: '手机号登录开发中',
      icon: 'none'
    })
  },

  /**
   * 切换隐私政策勾选
   */
  togglePrivacy() {
    this.setData({
      privacyChecked: !this.data.privacyChecked
    })
  },

  /**
   * 查看隐私政策
   */
  onViewPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '暖宠星球非常重视您的个人隐私保护，在您使用我们的服务时，我们需要收集和使用您的相关信息。请您仔细阅读并了解我们的隐私政策...',
      showCancel: false,
      confirmText: '我知道了'
    })
  },

  /**
   * 查看用户协议
   */
  onViewAgreement() {
    wx.showModal({
      title: '用户协议',
      content: '暖宠星球用户协议...',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
})
