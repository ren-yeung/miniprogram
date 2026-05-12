/**
 * 帖子云函数 - posts/index.js
 * 暖宠星球小程序 - 云开发后端
 * 
 * 功能：
 * - list: 获取帖子列表（支持分页、分类筛选）
 * - detail: 获取帖子详情
 * - create: 创建帖子
 * - like: 点赞/取消点赞
 */

const cloud = require('wx-server-sdk')

cloud.init({
  // ⚠️ 重要：请替换为你的云开发环境ID
  env: 'yangchangren-d7gzeie6f61d60403'
})

const db = cloud.database()
const _ = db.command

/**
 * 云函数入口
 * 通过 action 参数区分操作类型
 */
exports.main = async (event, context) => {
  const { action, ...params } = event
  
  console.log('[Posts] 云函数开始执行', { action, params })

  try {
    switch (action) {
      case 'list':
        return await getList(params, context)
      case 'detail':
        return await getDetail(params, context)
      case 'create':
        return await createPost(params, context)
      case 'like':
        return await toggleLike(params, context)
      default:
        return {
          code: 400,
          message: '未知操作: ' + action,
          data: null
        }
    }
  } catch (err) {
    console.error('[Posts] 云函数执行失败:', err)
    return {
      code: 500,
      message: '服务器错误: ' + err.message,
      data: null
    }
  }
}

/**
 * 获取帖子列表
 */
async function getList(params, context) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { 
    category = 'all',
    page = 1, 
    pageSize = 20,
    sortBy = 'newest'  // newest | hot | nearby
  } = params

  console.log('[Posts] getList', { category, page, pageSize, sortBy })

  try {
    // 构建查询条件
    let query = db.collection('posts')
    
    // 分类筛选
    if (category && category !== 'all') {
      query = query.where({ category: category })
    }

    // 排序
    let orderField = 'createdAt'
    let orderDirection = 'desc'
    
    if (sortBy === 'hot') {
      orderField = 'likes'
      orderDirection = 'desc'
    }

    // 计算分页
    const skip = (page - 1) * pageSize

    // 执行查询
    const result = await query
      .orderBy(orderField, orderDirection)
      .skip(skip)
      .limit(pageSize)
      .get()

    const posts = result.data || []

    // 批量获取作者信息
    const authorIds = [...new Set(posts.map(p => p.uid).filter(Boolean))]
    let authorsMap = {}

    if (authorIds.length > 0) {
      try {
        // 查询作者信息
        const authorsResult = await db.collection('users')
          .field({
            uid: true,
            name: true,
            avatar: true
          })
          .where({
            uid: _.in(authorIds)
          })
          .get()

        authorsMap = authorsResult.data.reduce((map, user) => {
          map[user.uid] = {
            name: user.name,
            avatar: user.avatar
          }
          return map
        }, {})
      } catch (err) {
        console.log('[Posts] 查询作者信息失败:', err.message)
      }
    }

    // 格式化返回数据
    const formattedPosts = posts.map(post => {
      const author = authorsMap[post.uid] || {}
      
      return {
        id: post._id,
        title: post.title || '',
        content: post.content,
        images: post.images || [],
        category: post.category || '晒宠',
        likes: post.likes || 0,
        comments: post.comments || 0,
        createdAt: post.createdAt,
        author: {
          uid: post.uid,
          name: author.name || '匿名用户',
          avatar: author.avatar || ''
        }
      }
    })

    // 判断是否有更多
    const hasMore = posts.length === pageSize

    return {
      code: 0,
      message: 'success',
      data: {
        list: formattedPosts,
        page: page,
        pageSize: pageSize,
        hasMore: hasMore
      }
    }

  } catch (err) {
    console.error('[Posts] 查询帖子列表失败:', err)
    return {
      code: 500,
      message: '查询失败: ' + err.message,
      data: null
    }
  }
}

/**
 * 获取帖子详情
 */
async function getDetail(params, context) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { postId } = params

  console.log('[Posts] getDetail', { postId })

  if (!postId) {
    return {
      code: 400,
      message: '缺少帖子ID',
      data: null
    }
  }

  try {
    // 查询帖子
    const postResult = await db.collection('posts')
      .doc(postId)
      .get()

    if (!postResult.data) {
      return {
        code: 404,
        message: '帖子不存在',
        data: null
      }
    }

    const post = postResult.data

    // 查询作者信息
    let author = { name: '匿名用户', avatar: '' }
    if (post.uid) {
      try {
        const userResult = await db.collection('users')
          .field({ name: true, avatar: true })
          .where({ uid: post.uid })
          .limit(1)
          .get()
        
        if (userResult.data && userResult.data.length > 0) {
          author = {
            name: userResult.data[0].name,
            avatar: userResult.data[0].avatar
          }
        }
      } catch (err) {
        console.log('[Posts] 查询作者失败:', err.message)
      }
    }

    // 查询当前用户是否点赞
    let isLiked = false
    if (openid) {
      try {
        const likeResult = await db.collection('likes')
          .where({
            _openid: openid,
            postId: postId
          })
          .count()
        
        isLiked = likeResult.total > 0
      } catch (err) {
        console.log('[Posts] 查询点赞状态失败:', err.message)
      }
    }

    return {
      code: 0,
      message: 'success',
      data: {
        id: post._id,
        title: post.title || '',
        content: post.content,
        images: post.images || [],
        category: post.category || '晒宠',
        likes: post.likes || 0,
        comments: post.comments || 0,
        createdAt: post.createdAt,
        author: {
          uid: post.uid,
          name: author.name,
          avatar: author.avatar
        },
        isLiked: isLiked
      }
    }

  } catch (err) {
    console.error('[Posts] 查询帖子详情失败:', err)
    return {
      code: 500,
      message: '查询失败: ' + err.message,
      data: null
    }
  }
}

/**
 * 创建帖子
 */
async function createPost(params, context) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { title, content, images, category } = params

  console.log('[Posts] createPost', { title, content, images, category })

  if (!openid) {
    return {
      code: 401,
      message: '用户未登录',
      data: null
    }
  }

  // 验证必填项
  if (!content && (!images || images.length === 0)) {
    return {
      code: 400,
      message: '内容或图片不能为空',
      data: null
    }
  }

  // ========== 内容安全检测 ==========
  // 检测文本内容（标题+正文）
  const textToCheck = (title ? title + ' ' : '') + (content || '')
  if (textToCheck.trim()) {
    try {
      const msgResult = await cloud.openapi.security.msgSecCheck({
        action: 'message',
        content: textToCheck,
        version: 2,
        scene: 2,  // 2=评论
        openid: openid
      })
      
      // label不为0表示命中违规
      if (msgResult.result && msgResult.result.label && msgResult.result.label !== 100) {
        console.log('[Posts] 文本内容违规:', msgResult.result)
        return {
          code: 10001,
          message: '内容包含违规信息，请修改后重新发布',
          data: null
        }
      }
    } catch (err) {
      console.error('[Posts] 文本安全检测失败:', err)
      // 检测失败时选择放行（避免接口抖动影响正常发布）
      // 如果要求严格，可以改为 return 拒绝
    }
  }

  // 检测图片内容
  if (images && images.length > 0) {
    for (const imgUrl of images) {
      try {
        // 下载图片到临时文件
        const downloadResult = await cloud.downloadFile({
          fileID: imgUrl
        })
        const imgBuffer = downloadResult.fileContent
        
        const imgResult = await cloud.openapi.security.imgSecCheck({
          media: {
            contentType: 'image/png',
            value: imgBuffer
          },
          version: 2,
          scene: 2,
          openid: openid
        })
        
        if (imgResult.result && imgResult.result.label && imgResult.result.label !== 100) {
          console.log('[Posts] 图片内容违规:', imgResult.result)
          return {
            code: 10002,
            message: '图片包含违规内容，请更换后重新发布',
            data: null
          }
        }
      } catch (err) {
        console.error('[Posts] 图片安全检测失败:', err)
        // 图片检测失败同样选择放行
      }
    }
  }
  // ========== 内容安全检测结束 ==========

  // 查询用户信息获取 uid
  let uid = ''
  try {
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .limit(1)
      .get()
    
    if (userResult.data && userResult.data.length > 0) {
      uid = userResult.data[0].uid
    }
  } catch (err) {
    console.log('[Posts] 查询用户失败:', err.message)
  }

  const now = Date.now()

  try {
    // 创建帖子
    const postData = {
      _openid: openid,
      uid: uid,
      title: title || '',
      content: content,
      images: images || [],
      category: category || '晒宠',
      likes: 0,
      comments: 0,
      createdAt: now,
      updatedAt: now
    }

    const result = await db.collection('posts').add({
      data: postData
    })

    // 更新用户帖子数
    if (uid) {
      try {
        await db.collection('users')
          .where({ uid: uid })
          .update({
            data: {
              posts: _.inc(1),
              updatedAt: now
            }
          })
      } catch (err) {
        console.log('[Posts] 更新用户帖子数失败:', err.message)
      }
    }

    return {
      code: 0,
      message: '发布成功',
      data: {
        postId: result._id,
        createdAt: now
      }
    }

  } catch (err) {
    console.error('[Posts] 创建帖子失败:', err)
    return {
      code: 500,
      message: '发布失败: ' + err.message,
      data: null
    }
  }
}

/**
 * 点赞/取消点赞
 */
async function toggleLike(params, context) {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  
  const { postId, action: likeAction } = params  // action: 'like' | 'unlike'

  console.log('[Posts] toggleLike', { postId, likeAction })

  if (!openid) {
    return {
      code: 401,
      message: '用户未登录',
      data: null
    }
  }

  if (!postId) {
    return {
      code: 400,
      message: '缺少帖子ID',
      data: null
    }
  }

  // 查询用户信息获取 uid
  let uid = ''
  try {
    const userResult = await db.collection('users')
      .where({ _openid: openid })
      .limit(1)
      .get()
    
    if (userResult.data && userResult.data.length > 0) {
      uid = userResult.data[0].uid
    }
  } catch (err) {
    console.log('[Posts] 查询用户失败:', err.message)
  }

  try {
    // 查询是否已经点赞
    const existingLike = await db.collection('likes')
      .where({
        _openid: openid,
        postId: postId
      })
      .get()

    const hasLiked = existingLike.data && existingLike.data.length > 0

    if (likeAction === 'like' && !hasLiked) {
      // 添加点赞记录
      await db.collection('likes').add({
        data: {
          _openid: openid,
          uid: uid,
          postId: postId,
          createdAt: Date.now()
        }
      })

      // 增加帖子点赞数
      await db.collection('posts')
        .doc(postId)
        .update({
          data: {
            likes: _.inc(1)
          }
        })

      // 增加用户获赞数
      if (uid) {
        try {
          await db.collection('users')
            .where({ uid: uid })
            .update({
              data: {
                likes: _.inc(1)
              }
            })
        } catch (err) {
          console.log('[Posts] 更新用户获赞数失败:', err.message)
        }
      }

      return {
        code: 0,
        message: '点赞成功',
        data: { liked: true }
      }

    } else if (likeAction === 'unlike' && hasLiked) {
      // 删除点赞记录
      const likeId = existingLike.data[0]._id
      await db.collection('likes').doc(likeId).remove()

      // 减少帖子点赞数
      await db.collection('posts')
        .doc(postId)
        .update({
          data: {
            likes: _.inc(-1)
          }
        })

      // 减少用户获赞数
      if (uid) {
        try {
          await db.collection('users')
            .where({ uid: uid })
            .update({
              data: {
                likes: _.inc(-1)
              }
            })
        } catch (err) {
          console.log('[Posts] 更新用户获赞数失败:', err.message)
        }
      }

      return {
        code: 0,
        message: '取消点赞成功',
        data: { liked: false }
      }

    } else {
      // 状态未变化
      return {
        code: 0,
        message: '操作完成',
        data: { liked: hasLiked }
      }
    }

  } catch (err) {
    console.error('[Posts] 点赞操作失败:', err)
    return {
      code: 500,
      message: '操作失败: ' + err.message,
      data: null
    }
  }
}
