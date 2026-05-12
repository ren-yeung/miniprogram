/**
 * 用户云函数 - user/index.js
 * 暖宠星球小程序 - 云开发后端
 * 
 * 功能：
 * - getProfile: 获取用户资料
 * - updateProfile: 更新用户资料
 * - updateAvatar: 更新头像
 */

const cloud = require('wx-server-sdk')

cloud.init({
  // ⚠️ 重要：请替换为你的云开发环境ID
  env: 'yangchangren-d7gzeie6f61d60403'
})

const db = cloud.database()

/**
 * 云函数入口
 * 通过 action 参数区分操作类型
 */
exports.main = async (event, context) => {
  const { action, ...params } = event
  
  console.log('[User] 云函数开始执行', { action, params })

  try {
    switch (action) {
      case 'getProfile':
        return await getProfile(params, context)
      case 'updateProfile':
        return await updateProfile(params, context)
      case 'updateAvatar':
        return await updateAvatar(params, context)
      default:
        return {
          code: 400,
          message: '未知操作: ' + action,
          data: null
        }
    }
  } catch (err) {
    console.error('[User] 云函数执行失败:', err)
    return {
      code: 500,
      message: '服务器错误: ' + err.message,
      data: null
    }
  }
}

/**
 * 获取用户资料
 */
async function getProfile(params, context) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const uid = params.uid || null

  console.log('[User] getProfile', { openid: openid?.slice(0, 10), uid })

  // 优先通过 openid 查找
  let query = null
  if (openid) {
    query = db.collection('users').where({ _openid: openid })
  } else if (uid) {
    query = db.collection('users').where({ uid: uid })
  }

  if (!query) {
    return {
      code: 400,
      message: '缺少用户标识',
      data: null
    }
  }

  try {
    const result = await query.limit(1).get()
    
    if (result.data && result.data.length > 0) {
      const user = result.data[0]
      return {
        code: 0,
        message: 'success',
        data: {
          uid: user.uid,
          name: user.name,
          avatar: user.avatar || '',
          phone: user.phone || '',
          address: user.address || '',
          bio: user.bio || '',
          city: user.city || '',
          isVip: user.isVip || false,
          coins: user.coins || 0,
          balance: user.balance || '0.00',
          stats: {
            likes: user.likes || 0,
            following: user.following || 0,
            followers: user.followers || 0,
            posts: user.posts || 0
          }
        }
      }
    } else {
      return {
        code: 404,
        message: '用户不存在',
        data: null
      }
    }
  } catch (err) {
    console.error('[User] 查询用户失败:', err)
    return {
      code: 500,
      message: '查询失败: ' + err.message,
      data: null
    }
  }
}

/**
 * 更新用户资料
 */
async function updateProfile(params, context) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  console.log('[User] updateProfile', params)

  if (!openid) {
    return {
      code: 401,
      message: '用户未登录',
      data: null
    }
  }

  // 允许更新的字段
  const allowedFields = ['name', 'phone', 'address', 'bio', 'city']
  const updateData = {}

  for (const field of allowedFields) {
    if (params[field] !== undefined) {
      updateData[field] = params[field]
    }
  }

  if (Object.keys(updateData).length === 0) {
    return {
      code: 400,
      message: '没有需要更新的字段',
      data: null
    }
  }

  // ========== 内容安全检测 ==========
  // 检测昵称和简介等文本内容
  const textToCheck = [updateData.name, updateData.bio, updateData.address]
    .filter(Boolean)
    .join(' ')
  
  if (textToCheck.trim()) {
    try {
      const msgResult = await cloud.openapi.security.msgSecCheck({
        action: 'message',
        content: textToCheck,
        version: 2,
        scene: 2,
        openid: openid
      })
      
      if (msgResult.result && msgResult.result.label && msgResult.result.label !== 100) {
        console.log('[User] 文本内容违规:', msgResult.result)
        return {
          code: 10001,
          message: '内容包含违规信息，请修改',
          data: null
        }
      }
    } catch (err) {
      console.error('[User] 文本安全检测失败:', err)
    }
  }
  // ========== 内容安全检测结束 ==========

  updateData.updatedAt = Date.now()

  try {
    const result = await db.collection('users')
      .where({ _openid: openid })
      .update({ data: updateData })

    console.log('[User] 更新成功', result)

    return {
      code: 0,
      message: '更新成功',
      data: {
        updated: result.stats.updated,
        ...updateData
      }
    }
  } catch (err) {
    console.error('[User] 更新失败:', err)
    return {
      code: 500,
      message: '更新失败: ' + err.message,
      data: null
    }
  }
}

/**
 * 更新头像
 * 头像URL需要先通过 wx.cloud.uploadFile 上传到云存储
 */
async function updateAvatar(params, context) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { avatarUrl } = params

  console.log('[User] updateAvatar', { avatarUrl })

  if (!openid) {
    return {
      code: 401,
      message: '用户未登录',
      data: null
    }
  }

  if (!avatarUrl) {
    return {
      code: 400,
      message: '头像URL不能为空',
      data: null
    }
  }

  try {
    const result = await db.collection('users')
      .where({ _openid: openid })
      .update({
        data: {
          avatar: avatarUrl,
          updatedAt: Date.now()
        }
      })

    return {
      code: 0,
      message: '头像更新成功',
      data: {
        updated: result.stats.updated,
        avatar: avatarUrl
      }
    }
  } catch (err) {
    console.error('[User] 更新头像失败:', err)
    return {
      code: 500,
      message: '更新失败: ' + err.message,
      data: null
    }
  }
}
