# 暖宠星球 - API 接口文档

## 概述

本文档描述暖宠星球小程序与后端的 API 接口约定，用于实现用户数据隔离。

## 认证机制

### 登录流程

```
1. 前端调用 wx.login() 获取 code
2. 前端 POST /api/auth/login { code } 获取 uid + token
3. 后端验证 code，生成 uid 和 token 返回
4. 前端存储 token，后续请求在 header 中携带
```

### Token 使用

- 所有需要认证的请求，都需要在 HTTP Header 中携带：
  ```
  Authorization: Bearer {token}
  ```
- Token 有效期建议 7 天，过期后需要刷新

### 数据隔离

- **关键原则**：后端以 Token 中解析的 uid 为准，前端传的 uid 仅作参考
- 所有用户相关操作都通过 Token 关联到真实用户

---

## API 接口

### 1. 登录接口

**POST** `/api/auth/login`

#### 请求参数

```json
{
  "code": "微信登录凭证"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "uid": "user_123456",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "refresh_abc123",
    "userInfo": {
      "name": "小明",
      "avatar": "https://example.com/avatar.jpg",
      "city": "上海市",
      "bio": "养宠达人"
    }
  }
}
```

---

### 2. 刷新 Token

**POST** `/api/auth/refresh`

#### 请求参数

```json
{
  "refreshToken": "refresh_abc123"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "刷新成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...new"
  }
}
```

---

### 3. 获取用户信息

**GET** `/api/user/profile`

#### Header

```
Authorization: Bearer {token}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "uid": "user_123456",
    "name": "小明",
    "avatar": "https://example.com/avatar.jpg",
    "city": "上海市",
    "bio": "养宠达人",
    "stats": {
      "likes": 128,
      "following": 32,
      "followers": 86,
      "posts": 12
    }
  }
}
```

---

### 4. 更新用户信息

**POST** `/api/user/profile`

#### Header

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "name": "新昵称",
  "bio": "新简介"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "更新成功",
  "data": {
    "name": "新昵称",
    "bio": "新简介"
  }
}
```

---

### 5. 获取帖子列表

**GET** `/api/posts/list`

#### Header

```
Authorization: Bearer {token}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 分类ID |
| page | int | 否 | 页码，默认1 |
| pageSize | int | 否 | 每页数量，默认20 |

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "post_001",
        "title": "帖子标题",
        "content": "帖子内容...",
        "images": ["url1", "url2"],
        "likes": 100,
        "comments": 20,
        "category": "晒宠",
        "user": {
          "uid": "user_123456",
          "name": "用户昵称",
          "avatar": "url"
        },
        "createTime": "2024-01-01 12:00:00"
      }
    ],
    "hasMore": true,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 6. 帖子详情

**GET** `/api/posts/detail`

#### Header

```
Authorization: Bearer {token}
```

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 帖子ID |

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "post_001",
    "title": "帖子标题",
    "content": "帖子内容...",
    "images": ["url1", "url2"],
    "likes": 100,
    "comments": 20,
    "isLiked": false,
    "isCollected": false,
    "category": "晒宠",
    "user": {
      "uid": "user_123456",
      "name": "用户昵称",
      "avatar": "url"
    },
    "createTime": "2024-01-01 12:00:00"
  }
}
```

---

### 7. 发布帖子

**POST** `/api/posts/create`

#### Header

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "title": "帖子标题",
  "content": "帖子内容",
  "images": ["url1", "url2"],
  "category": "晒宠"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "发布成功",
  "data": {
    "postId": "post_new_001"
  }
}
```

---

### 8. 点赞/取消点赞

**POST** `/api/posts/like`

#### Header

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "postId": "post_001"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "liked": true,
    "likes": 101
  }
}
```

---

### 9. 收藏/取消收藏

**POST** `/api/posts/collect`

#### Header

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "postId": "post_001"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "操作成功",
  "data": {
    "collected": true
  }
}
```

---

### 10. 评论

**POST** `/api/posts/comment`

#### Header

```
Authorization: Bearer {token}
```

#### 请求参数

```json
{
  "postId": "post_001",
  "content": "评论内容"
}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "评论成功",
  "data": {
    "commentId": "comment_001"
  }
}
```

---

### 11. 获取我的发布

**GET** `/api/user/posts`

#### Header

```
Authorization: Bearer {token}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [...],
    "total": 12
  }
}
```

---

### 12. 获取我的收藏

**GET** `/api/user/collections`

#### Header

```
Authorization: Bearer {token}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [...],
    "total": 67
  }
}
```

---

### 13. 获取我的点赞

**GET** `/api/user/likes`

#### Header

```
Authorization: Bearer {token}
```

#### 响应示例

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [...],
    "total": 128
  }
}
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 2001 | 用户不存在 |
| 2002 | Token 过期 |
| 2003 | Token 无效 |
| 3001 | 帖子不存在 |
| 3002 | 无权操作 |
| 5001 | 服务器错误 |

---

## 安全建议

1. **Token 存储**：建议对存储的 token 进行简单加密
2. **敏感操作**：删除、修改等操作必须验证 Token
3. **日志脱敏**：线上环境不要在日志中打印完整 Token
4. **HTTPS**：生产环境必须使用 HTTPS
