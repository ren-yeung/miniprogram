/**
 * 网络请求封装 - utils/request.js
 * 暖宠星球小程序 - 统一网络请求处理
 * 
 * 优化说明 (2026-05-12):
 * 1. 提取配置常量和Token管理类
 * 2. 改进云函数调用封装，支持更多API
 * 3. 优化Token刷新机制，支持队列处理
 * 4. 增加请求重试和指数退避策略
 * 5. 完善错误处理和日志输出
 * 6. 支持 PUT/DELETE 方法
 */

const app = getApp()

// ==================== 配置常量 ====================
const CONFIG = {
  API_BASE_URL: 'https://api.nuanchong.com',
  USE_MOCK: false,  // 开发阶段可设为 true
  USE_CLOUD: true,
  TIMEOUT: 15000,
  MAX_RETRY: 2
}

// ==================== Token 管理 ====================
const TokenManager = {
  get() {
    try {
      return wx.getStorageSync('auth_token') || ''
    } catch (e) {
      console.error('[TokenManager] 获取 token 失败:', e)
      return ''
    }
  },

  getRefreshToken() {
    try {
      return wx.getStorageSync('refresh_token') || ''
    } catch (e) {
      return ''
    }
  },

  getUid() {
    try {
      return wx.getStorageSync('user_uid') || ''
    } catch (e) {
      return ''
    }
  },

  isLoggedIn() {
    return !!(this.get() && this.getUid())
  },

  save(tokens) {
    const { uid, token, refreshToken, userInfo } = tokens
    try {
      if (uid) wx.setStorageSync('user_uid', uid)
      if (token) wx.setStorageSync('auth_token', token)
      if (refreshToken) wx.setStorageSync('refresh_token', refreshToken)
      if (userInfo) wx.setStorageSync('user_info', userInfo)
    } catch (e) {
      console.error('[TokenManager] 保存 token 失败:', e)
    }
  },

  clear() {
    try {
      wx.removeStorageSync('auth_token')
      wx.removeStorageSync('refresh_token')
      // 保留 uid 和 userInfo 用于降级体验
    } catch (e) {
      console.error('[TokenManager] 清除 token 失败:', e)
    }
  }
}

// ==================== 云函数调用 ====================
/**
 * 调用云函数
 * @param {string} functionName - 云函数名称
 * @param {object} data - 传递给云函数的数据
 * @returns {Promise<object>} - 返回云函数执行结果
 */
function cloudCall(functionName, data = {}) {
  console.log(`[Cloud] 调用云函数: ${functionName}`, data)
  
  return wx.cloud.callFunction({
    name: functionName,
    data: data
  }).then(res => {
    console.log(`[Cloud] 云函数返回: ${functionName}`, res)
    
    if (res.errMsg && res.errMsg.includes('ok')) {
      const result = res.result
      // 检查业务错误码
      if (result && result.code !== undefined) {
        if (result.code !== 0) {
          const error = new Error(result.message || '请求失败')
          error.code = result.code
          error.data = result
          throw error
        }
        return result
      }
      return res
    } else {
      throw new Error(res.errMsg || '云函数调用失败')
    }
  })
}

// ==================== API 云函数封装 ====================
const cloudAPI = {
  // 认证相关
  auth: {
    login: () => cloudCall('login', {}),
    refreshToken: (refreshToken) => cloudCall('auth', { action: 'refreshToken', refreshToken })
  },
  
  // 用户相关
  user: {
    getProfile: (uid) => cloudCall('user', { action: 'getProfile', uid }),
    updateProfile: (params) => cloudCall('user', { action: 'updateProfile', ...params }),
    updateAvatar: (avatarUrl) => cloudCall('user', { action: 'updateAvatar', avatarUrl })
  },
  
  // 帖子相关
  posts: {
    list: (params) => cloudCall('posts', { action: 'list', ...params }),
    detail: (postId) => cloudCall('posts', { action: 'detail', postId }),
    create: (params) => cloudCall('posts', { action: 'create', ...params }),
    like: (postId, action) => cloudCall('posts', { action: 'like', postId, action }),
    delete: (postId) => cloudCall('posts', { action: 'delete', postId })
  },
  
  // 评论相关
  comments: {
    list: (postId, params) => cloudCall('comments', { action: 'list', postId, ...params }),
    create: (params) => cloudCall('comments', { action: 'create', ...params })
  }
}

// ==================== Token 刷新机制 ====================
let isRefreshing = false
let refreshPromise = null
let pendingRequests = []

function refreshToken() {
  if (isRefreshing) {
    return refreshPromise
  }

  isRefreshing = true

  refreshPromise = new Promise((resolve, reject) => {
    const refreshToken = TokenManager.getRefreshToken()
    
    if (!refreshToken) {
      isRefreshing = false
      reject(new Error('No refresh token'))
      return
    }

    cloudAPI.auth.refreshToken(refreshToken)
      .then(res => {
        if (res.code === 0 && res.data) {
          TokenManager.save({
            token: res.data.token,
            refreshToken: res.data.refreshToken || refreshToken
          })
          
          // 执行所有待处理的请求
          pendingRequests.forEach(callback => callback())
          pendingRequests = []
          
          resolve(res.data.token)
        } else {
          throw new Error(res.message || '刷新token失败')
        }
      })
      .catch(err => {
        console.error('[Token] 刷新失败:', err)
        // 刷新失败，清除 token 并跳转登录
        TokenManager.clear()
        wx.navigateTo({ url: '/pages/login/login' })
        reject(err)
      })
      .finally(() => {
        isRefreshing = false
        refreshPromise = null
      })
  })

  return refreshPromise
}

// ==================== 请求重试机制 ====================
/**
 * 核心请求方法
 * @param {object} options - 请求配置
 * @param {number} retryCount - 重试次数
 * @returns {Promise<object>}
 */
function request(options, retryCount = 0) {
  return new Promise((resolve, reject) => {
    // 构建请求配置
    const config = {
      method: 'GET',
      timeout: CONFIG.TIMEOUT,
      header: {
        'Content-Type': 'application/json'
      },
      ...options,
      header: {
        'Content-Type': 'application/json',
        ...(options.header || {}),
        'Authorization': TokenManager.get() ? `Bearer ${TokenManager.get()}` : ''
      }
    }

    // 添加 uid 到请求参数（后端以此为准）
    if (config.data && TokenManager.getUid()) {
      config.data.uid = TokenManager.getUid()
    }

    console.log(`[Request] ${config.method} ${config.url}`, config.data)

    wx.request({
      ...config,
      success: async (res) => {
        console.log(`[Response] ${config.url}`, res.statusCode)
        
        // 业务成功
        if (res.statusCode === 200 && res.data.code === 0) {
          resolve(res.data)
          return
        }

        // Token 过期，尝试刷新
        if (res.statusCode === 401 && retryCount < CONFIG.MAX_RETRY) {
          try {
            await refreshToken()
            // 刷新成功，重试请求
            const result = await request(options, retryCount + 1)
            resolve(result)
          } catch (err) {
            reject(new Error('认证失败，请重新登录'))
          }
          return
        }

        // 其他错误
        const error = new Error(res.data?.message || `请求失败(${res.statusCode})`)
        error.code = res.data?.code || res.statusCode
        error.data = res.data
        reject(error)
      },
      fail: (err) => {
        console.error(`[Request Error] ${config.url}`, err)
        
        // 网络错误重试
        if (retryCount < CONFIG.MAX_RETRY) {
          console.log(`[Request] 重试请求 (${retryCount + 1}/${CONFIG.MAX_RETRY})`)
          setTimeout(() => {
            request(options, retryCount + 1).then(resolve).catch(reject)
          }, 1000 * (retryCount + 1))  // 指数退避
          return
        }

        // 构建错误信息
        let errorMessage = '网络请求失败'
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请稍后重试'
          } else if (err.errMsg.includes('fail')) {
            errorMessage = '网络连接失败，请检查网络'
          }
        }

        const error = new Error(errorMessage)
        error.originalError = err
        reject(error)
      }
    })
  })
}

// ==================== 导出方法 ====================
module.exports = {
  // HTTP 请求方法
  request,
  get: (url, data, options) => request({ ...options, url, data, method: 'GET' }),
  post: (url, data, options) => request({ ...options, url, data, method: 'POST' }),
  put: (url, data, options) => request({ ...options, url, data, method: 'PUT' }),
  delete: (url, data, options) => request({ ...options, url, data, method: 'DELETE' }),
  
  // 云函数调用
  cloudCall,
  cloud: cloudAPI,
  
  // Token 管理
  token: TokenManager,
  
  // 配置
  config: CONFIG
}
