/**
 * 登录云函数 - login/index.js
 * 暖宠星球小程序 - 云开发后端
 * 
 * 功能：
 * 1. 获取用户 openid
 * 2. 查找或创建用户记录
 * 3. 返回 uid、token、userInfo
 */

const cloud = require('wx-server-sdk')

cloud.init({
  // ⚠️ 重要：请替换为你的云开发环境ID
  // 在微信开发者工具中查看：云开发控制台 -> 设置 -> 环境ID
  env: 'yangchangren-d7gzeie6f61d60403'  
})

const db = cloud.database()

/**
 * 生成简单token（基于openid+时间戳）
 * 生产环境建议使用JWT或其他安全方案
 */
function generateToken(openid) {
  const timestamp = Date.now()
  // 简单混淆：实际生产中建议使用更安全的方案
  const raw = `${openid}_${timestamp}_nuanchong_secret`
  return Buffer.from(raw).toString('base64')
}

/**
 * 生成用户唯一标识
 */
function generateUid(openid) {
  // 使用openid前8位 + 随机数作为用户ID
  const prefix = openid.slice(-8).toUpperCase()
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `NC_${prefix}${random}`
}

exports.main = async (event, context) => {
  console.log('[Login] 云函数开始执行', event)
  
  try {
    // 获取调用者的openid（云开发自动注入）
    const wxContext = cloud.getWXContext()
    const openid = wxContext.OPENID
    
    if (!openid) {
      return {
        code: 401,
        message: '获取用户身份失败',
        data: null
      }
    }

    // 在 users 集合中查找用户
    let userRecord = null
    let isNewUser = false
    
    try {
      const userResult = await db.collection('users')
        .where({ _openid: openid })
        .limit(1)
        .get()
      
      if (userResult.data && userResult.data.length > 0) {
        userRecord = userResult.data[0]
      }
    } catch (err) {
      // 集合可能不存在，跳过查询
      console.log('[Login] 查询用户失败或集合不存在:', err.message)
    }

    // 如果用户不存在，创建新用户记录
    if (!userRecord) {
      isNewUser = true
      const now = Date.now()
      
      try {
        const newUser = {
          _openid: openid,
          uid: generateUid(openid),
          name: `暖宠用户${openid.slice(-4)}`,
          avatar: '',
          phone: '',
          address: '',
          bio: '我是暖宠星球的新成员~',
          city: '',
          isVip: false,
          coins: 0,
          balance: '0.00',
          followers: 0,
          following: 0,
          likes: 0,
          posts: 0,
          createdAt: now,
          updatedAt: now
        }
        
        const addResult = await db.collection('users').add({
          data: newUser
        })
        
        userRecord = { ...newUser, _id: addResult._id }
      } catch (err) {
        console.error('[Login] 创建用户失败:', err.message)
        // 如果创建失败，仍尝试继续（可能集合权限问题）
        userRecord = {
          _openid: openid,
          uid: generateUid(openid),
          name: `暖宠用户${openid.slice(-4)}`
        }
      }
    }

    // 生成 token
    const token = generateToken(openid)
    const refreshToken = generateToken(openid + '_refresh')

    // 构建返回数据
    const userInfo = {
      uid: userRecord.uid,
      name: userRecord.name,
      avatar: userRecord.avatar || '',
      city: userRecord.city || '',
      bio: userRecord.bio || '',
      stats: {
        likes: userRecord.likes || 0,
        following: userRecord.following || 0,
        followers: userRecord.followers || 0,
        posts: userRecord.posts || 0
      }
    }

    console.log('[Login] 登录成功', { 
      uid: userRecord.uid, 
      isNewUser,
      openid: openid.slice(0, 10) + '...' 
    })

    return {
      code: 0,
      message: isNewUser ? '注册成功' : '登录成功',
      data: {
        uid: userRecord.uid,
        token: token,
        refreshToken: refreshToken,
        userInfo: userInfo,
        isNewUser: isNewUser
      }
    }

  } catch (err) {
    console.error('[Login] 云函数执行失败:', err)
    return {
      code: 500,
      message: '服务器错误: ' + err.message,
      data: null
    }
  }
}
