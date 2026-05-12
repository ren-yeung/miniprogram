/**
 * 网络请求封装 - utils/request.js
 * 暖宠星球小程序 - 统一网络请求处理
 * 
 * 功能特性：
 * 1. 自动携带 Authorization token
 * 2. 请求前自动检查登录状态
 * 3. 支持云函数调用
 * 4. 统一错误处理
 * 5. 支持 mock 数据模式（开发阶段）
 */

const app = getApp()

// API 基础地址（Mock模式或非云开发时使用）
const API_BASE_URL = 'https://api.nuanchong.com'  // TODO: 替换为真实后端地址

// ⚠️ 是否启用 mock 数据模式（开发阶段为 true，云开发上线后改为 false）
const USE_MOCK = false

// ⚠️ 是否使用云函数（云开发上线后改为 true）
const USE_CLOUD = true

/**
 * 请求配置
 */
const defaultConfig = {
  method: 'GET',
  timeout: 15000,
  header: {
    'Content-Type': 'application/json'
  }
}

/**
 * 获取存储的 token
 */
function getToken() {
  try {
    return wx.getStorageSync('auth_token') || ''
  } catch (e) {
    console.error('[Request] 获取 token 失败:', e)
    return ''
  }
}

/**
 * 获取存储的 uid
 */
function getUid() {
  try {
    return wx.getStorageSync('user_uid') || ''
  } catch (e) {
    console.error('[Request] 获取 uid 失败:', e)
    return ''
  }
}

/**
 * 检查是否已登录
 */
function isLoggedIn() {
  const token = getToken()
  const uid = getUid()
  return !!token && !!uid
}

/**
 * 调用云函数
 * @param {string} functionName - 云函数名称
 * @param {object} data - 传递给云函数的数据
 * @returns {Promise}
 */
function cloudCall(functionName, data = {}) {
  console.log(`[Cloud] 调用云函数: ${functionName}`, data)
  
  return wx.cloud.callFunction({
    name: functionName,
    data: data
  }).then(res => {
    console.log(`[Cloud] 云函数返回: ${functionName}`, res)
    
    if (res.errMsg && res.errMsg.includes('ok')) {
      // 云函数执行成功
      const result = res.result
      if (result && result.code !== undefined) {
        if (result.code !== 0) {
          // 业务错误
          const error = new Error(result.message || '请求失败')
          error.code = result.code
          error.data = result
          return Promise.reject(error)
        }
        return result
      }
      return res
    } else {
      // 云函数执行失败
      const error = new Error(res.errMsg || '云函数调用失败')
      error.code = -1
      return Promise.reject(error)
    }
  }).catch(err => {
    console.error(`[Cloud] 云函数调用失败: ${functionName}`, err)
    const error = new Error(err.message || '网络请求失败')
    error.code = -1
    error.originalError = err
    return Promise.reject(error)
  })
}

/**
 * 云函数封装 - 各接口调用
 */
const cloudAPI = {
  // 登录
  login: () => cloudCall('login', {}),
  
  // 用户相关
  getUserProfile: (uid) => cloudCall('user', { action: 'getProfile', uid }),
  updateUserProfile: (params) => cloudCall('user', { action: 'updateProfile', ...params }),
  updateUserAvatar: (avatarUrl) => cloudCall('user', { action: 'updateAvatar', avatarUrl }),
  
  // 帖子相关
  getPostsList: (params) => cloudCall('posts', { action: 'list', ...params }),
  getPostDetail: (postId) => cloudCall('posts', { action: 'detail', postId }),
  createPost: (params) => cloudCall('posts', { action: 'create', ...params }),
  likePost: (postId, action) => cloudCall('posts', { action: 'like', postId, action }),
}

/**
 * Mock 数据处理
 */
function getMockData(url, method, data) {
  // 根据 URL 和方法返回对应的 mock 数据
  const mockHandlers = {
    // 登录接口 mock
    '/api/auth/login': () => ({
      code: 0,
      message: '登录成功',
      data: {
        uid: 'mock_uid_' + Date.now(),
        token: 'mock_token_' + Date.now(),
        refreshToken: 'mock_refresh_' + Date.now(),
        userInfo: {
          name: '暖宠用户',
          avatar: 'https://i.pravatar.cc/144?img=1',
          city: '上海市',
          bio: '暖宠星球萌主'
        }
      }
    }),
    
    // 用户信息 mock
    '/api/user/profile': () => ({
      code: 0,
      message: 'success',
      data: {
        uid: getUid(),
        name: '暖宠用户',
        avatar: 'https://i.pravatar.cc/144?img=1',
        city: '上海市',
        bio: '暖宠星球萌主',
        stats: {
          likes: 128,
          following: 32,
          followers: 86,
          posts: 12
        }
      }
    }),
    
    // 帖子列表 mock
    '/api/posts/list': () => ({
      code: 0,
      message: 'success',
      data: {
        list: [
          { id: 1, title: 'Mock帖子1', likes: 100, comments: 10 },
          { id: 2, title: 'Mock帖子2', likes: 200, comments: 20 }
        ],
        hasMore: true
      }
    }),
    
    // 点赞接口 mock
    '/api/posts/like': () => ({
      code: 0,
      message: '操作成功',
      data: { success: true }
    }),
    
    // 发布帖子 mock
    '/api/posts/create': () => ({
      code: 0,
      message: '发布成功',
      data: {
        postId: 'new_post_' + Date.now()
      }
    })
  }

  // 匹配 mock handler
  for (const [path, handler] of Object.entries(mockHandlers)) {
    if (url.includes(path)) {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(handler())
        }, 300)
      })
    }
  }

  return null
}

/**
 * 静默登录 - 仅在需要时调用
 */
function silentLogin() {
  return new Promise((resolve, reject) => {
    // 如果已登录，直接返回
    if (isLoggedIn()) {
      resolve({ uid: getUid(), token: getToken() })
      return
    }

    // 优先使用云函数登录
    if (USE_CLOUD && wx.cloud) {
      wx.cloud.callFunction({
        name: 'login',
        data: {}
      }).then(res => {
        if (res.result && res.result.code === 0) {
          const { uid, token, userInfo } = res.result.data
          wx.setStorageSync('user_uid', uid)
          wx.setStorageSync('auth_token', token)
          if (userInfo) {
            wx.setStorageSync('user_info', userInfo)
          }
          resolve({ uid, token })
        } else {
          reject(new Error(res.result?.message || '登录失败'))
        }
      }).catch(reject)
    } else {
      // 降级：使用 wx.login
      wx.login({
        success: (loginRes) => {
          // 模拟登录成功
          const mockUid = 'uid_' + Date.now()
          const mockToken = 'token_' + Date.now()
          
          // 保存到本地存储
          wx.setStorageSync('user_uid', mockUid)
          wx.setStorageSync('auth_token', mockToken)
          
          resolve({ uid: mockUid, token: mockToken })
        },
        fail: reject
      })
    }
  })
}

/**
 * 核心请求方法
 * @param {string} url - 请求地址
 * @param {object} data - 请求参数
 * @param {object} options - 请求配置
 */
function request(url, data = {}, options = {}) {
  return new Promise(async (resolve, reject) => {
    // 检查是否启用 mock 模式
    if (USE_MOCK) {
      const mockData = getMockData(url, options.method || 'GET', data)
      if (mockData) {
        console.log(`[Request Mock] ${options.method || 'GET'} ${url}`)
        resolve(mockData)
        return
      }
    }

    // 请求前检查登录状态（对于需要认证的接口）
    const needAuth = options.needAuth !== false
    if (needAuth && !isLoggedIn()) {
      try {
        await silentLogin()
      } catch (e) {
        console.error('[Request] 静默登录失败:', e)
        // 静默登录失败不阻断请求，继续尝试
      }
    }

    // 构建完整 URL
    const fullUrl = url.startsWith('http') ? url : API_BASE_URL + url

    // 获取 token
    const token = getToken()

    // 构建请求配置
    const config = {
      ...defaultConfig,
      ...options,
      url: fullUrl,
      data: {
        ...data,
        // 自动添加 uid 参数（后端以此为准，前端仅作参考）
        uid: getUid() || undefined
      },
      header: {
        ...defaultConfig.header,
        ...(options.header || {}),
        // 添加 Authorization header
        'Authorization': token ? `Bearer ${token}` : ''
      }
    }

    // 移除自定义配置项
    delete config.needAuth
    delete config.retryCount

    console.log(`[Request] ${config.method} ${url}`, data)

    wx.request({
      ...config,
      success: (res) => {
        console.log(`[Response] ${url}`, res.data)

        // 处理业务错误码
        if (res.data.code !== 0) {
          // 业务错误
          const error = new Error(res.data.message || '请求失败')
          error.code = res.data.code
          error.data = res.data

          // 401 未授权，尝试刷新 token
          if (res.statusCode === 401 && options.retryCount !== 1) {
            refreshTokenAndRetry(url, data, options)
              .then(resolve)
              .catch(reject)
            return
          }

          reject(error)
          return
        }

        resolve(res.data)
      },
      fail: (err) => {
        console.error(`[Request Error] ${url}`, err)

        // 网络错误处理
        let errorMessage = '网络请求失败'
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请稍后重试'
          } else if (err.errMsg.includes('abort')) {
            errorMessage = '请求被取消'
          }
        }

        const error = new Error(errorMessage)
        error.originalError = err
        reject(error)
      }
    })
  })
}

/**
 * 刷新 token 并重试请求
 */
let isRefreshing = false
let refreshPromise = null

function refreshTokenAndRetry(url, data, options) {
  if (isRefreshing) {
    return refreshPromise
  }

  isRefreshing = true

  refreshPromise = new Promise((resolve, reject) => {
    // 调用刷新 token 接口
    request('/api/auth/refresh', {
      refreshToken: wx.getStorageSync('refresh_token') || ''
    }, { needAuth: false, retryCount: 1 })
      .then(res => {
        if (res.data && res.data.token) {
          // 保存新 token
          wx.setStorageSync('auth_token', res.data.token)
          // 重试原请求
          options.retryCount = 1
          request(url, data, options).then(resolve).catch(reject)
        } else {
          reject(new Error('刷新token失败'))
        }
      })
      .catch(err => {
        reject(err)
      })
      .finally(() => {
        isRefreshing = false
        refreshPromise = null
      })
  })

  return refreshPromise
}

// 导出请求方法
module.exports = {
  // 原有 HTTP 请求方法
  request,
  get: (url, data, options) => request(url, data, { ...options, method: 'GET' }),
  post: (url, data, options) => request(url, data, { ...options, method: 'POST' }),
  
  // 云函数调用方法
  cloudCall,
  cloud: cloudAPI,
  
  // 辅助方法
  getToken,
  getUid,
  isLoggedIn,
  silentLogin
}
