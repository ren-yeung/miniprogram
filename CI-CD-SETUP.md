# 微信小程序 CI/CD 配置指南

本文档说明如何配置 GitHub Actions 自动部署微信小程序。

## 📋 前置条件

1. **微信小程序账号** - 需要 AppID
2. **上传密钥** - 从微信公众平台下载
3. **GitHub 仓库** - 代码已推送到 GitHub

---

## 🔧 配置步骤

### 步骤1：获取微信小程序上传密钥

1. 登录微信公众平台：https://mp.weixin.qq.com
2. 进入 **开发 → 开发管理 → 开发设置**
3. 找到 **"小程序代码上传密钥"**
4. 点击 **"生成"** 或 **"重置"**
5. 下载密钥文件（通常名为 `private.key` 或类似名称）

⚠️ **重要**：密钥文件非常重要，不要提交到代码仓库！

---

### 步骤2：配置 GitHub Secrets

1. 进入你的 GitHub 仓库：**ren-yeung/miniprogram**
2. 点击 **Settings → Secrets and variables → Actions**
3. 点击 **"New repository secret"**，添加以下两个 Secret：

#### Secret 1：`WECHAT_APPID`
- **Name**: `WECHAT_APPID`
- **Value**: 你的小程序 AppID（在微信公众平台 → 开发设置 中找到）

示例：
```
wx1234567890abcdef
```

#### Secret 2：`WECHAT_PRIVATE_KEY`
- **Name**: `WECHAT_PRIVATE_KEY`
- **Value**: 上传密钥文件的内容（**全部内容，包括开头和结尾的标记**）

示例：
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoGBAL...
...（中间省略很多行）...
-----END PRIVATE KEY-----
```

⚠️ **注意**：
- 必须包含 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
- 保留所有换行符
- 不要添加额外的空格或空行

---

### 步骤3：修改 GitHub Actions 工作流（如需要）

如果你已经正确配置了 Secrets，GitHub Actions 会自动：

1. **代码检查** - 每次 push 或 PR 时运行
2. **自动部署** - 推送到 main 分支时自动上传到微信后台

#### 自定义配置

如果需要自定义上传行为，编辑 `.github/workflows/ci-cd.yml`：

```yaml
# 修改版本号
version: '1.0.1'  # 改为你的版本号

# 修改上传描述
desc: 'Auto upload by GitHub Actions - 修复bug'  # 改为你的描述
```

---

## 🚀 使用方法

### 自动触发

**场景1：代码检查**（PR 或 push 到非 main 分支）
- ✅ 自动运行代码规范检查
- ✅ 自动运行测试
- ❌ 不上传到微信后台

**场景2：自动部署**（push 到 main 分支）
- ✅ 自动运行代码检查
- ✅ 自动运行测试
- ✅ 自动上传到微信后台

### 手动触发（可选）

如果需要手动触发部署，修改 `.github/workflows/ci-cd.yml`，添加：

```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:  # 添加这一行，支持手动触发
```

然后在 GitHub Actions 页面点击 **"Run workflow"** 手动触发。

---

## 📊 查看部署状态

1. 进入 GitHub 仓库：**ren-yeung/miniprogram**
2. 点击 **Actions** 标签
3. 查看工作流运行记录
4. 点击某个运行记录查看详细日志

---

## 🔍 故障排查

### 问题1：`WECHAT_APPID` 或 `WECHAT_PRIVATE_KEY` 未配置

**错误信息**：
```
警告：未配置 WECHAT_APPID 或 WECHAT_PRIVATE_KEY
```

**解决方法**：
- 检查 GitHub Secrets 是否正确配置
- 确认 Secret 的名称完全匹配（区分大小写）

---

### 问题2：上传密钥格式错误

**错误信息**：
```
Error: Invalid private key
```

**解决方法**：
- 确认复制了密钥文件的**全部内容**
- 包含 `-----BEGIN PRIVATE KEY-----` 和 `-----END PRIVATE KEY-----`
- 保留所有换行符

---

### 问题3：`miniprogram-ci` 找不到项目文件

**错误信息**：
```
Error: Project path not found
```

**解决方法**：
- 检查 `.github/workflows/ci-cd.yml` 中的 `projectPath` 是否正确
- 确认 `miniprogram/` 目录存在

---

## 📝 示例：完整的 GitHub Actions 日志

```
✅ 检出代码
✅ 设置 Node.js
✅ 安装微信小程序 CLI 工具
✅ 准备上传（需要配置 Secrets）
✅ 开始上传代码到微信小程序后台...
✅ 上传成功 { mediaId: 'xxx', size: 12345 }
✅ 清理敏感文件
```

---

## 🔗 相关链接

- **微信公众平台**：https://mp.weixin.qq.com
- **miniprogram-ci 文档**：https://www.npmjs.com/package/miniprogram-ci
- **GitHub Actions 文档**：https://docs.github.com/en/actions

---

## 💡 最佳实践

1. **不要将密钥提交到代码仓库** - 始终使用 GitHub Secrets
2. **定期轮换密钥** - 每 3-6 个月重置一次上传密钥
3. **使用版本号** - 每次部署时更新版本号
4. **添加部署描述** - 说明本次部署的内容
5. **测试后再部署** - 确保 `test` job 通过后再部署

---

## 📞 需要帮助？

如果遇到问题，可以：
1. 查看 GitHub Actions 日志
2. 检查 `miniprogram-ci` 的文档
3. 在微信开发者社区提问
