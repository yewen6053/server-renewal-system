# 服务器续费管理系统

一个用于管理服务器续费情况的 Web 应用系统，支持数据录入、到期提醒和邮件通知功能。

## 功能特点

- ✅ 服务器信息管理（添加、编辑、删除）
- ✅ 自动计算剩余使用天数
- ✅ 剩余时间不足30天自动标红提醒
- ✅ 邮件提醒功能
- ✅ 数据本地存储（localStorage）
- ✅ 响应式设计，支持移动端

## 技术栈

- 前端：HTML5 + CSS3 + JavaScript
- 后端：Node.js + Express
- 邮件服务：Nodemailer

## 项目结构

```
server-renewal-system/
├── public/              # 前端文件
│   ├── index.html      # 主页面
│   ├── css/
│   │   └── style.css   # 样式文件
│   └── js/
│       └── app.js      # 前端逻辑
├── server/             # 后端文件
│   └── server.js       # 服务器代码
├── package.json        # 项目配置
└── README.md          # 说明文档
```

## 安装步骤

1. 进入项目目录：
```bash
cd myproject/server-renewal-system
```

2. 安装依赖：
```bash
npm install
```

3. 配置邮件服务（重要）：
   - 打开 `server/server.js` 文件
   - 修改邮件配置部分：
     - `user`: 改为你的发件邮箱
     - `pass`: 改为你的邮箱应用密码
     - `service`: 根据需要修改邮件服务商

## 使用方法

1. 启动服务器：
```bash
npm start
```

2. 打开浏览器访问：
```
http://localhost:3000
```

3. 使用系统：
   - 填写表单添加服务器信息
   - 查看服务器列表和剩余天数
   - 点击"发送提醒"按钮发送邮件通知
   - 剩余时间不足30天的记录会自动标红

## 邮件配置说明

### Gmail 配置示例

1. 开启两步验证
2. 生成应用专用密码
3. 在 `server/server.js` 中配置：
```javascript
service: 'gmail',
user: 'your-email@gmail.com',
pass: 'your-app-password'
```

### 其他邮箱服务

支持的邮件服务包括：
- Gmail
- Outlook
- QQ邮箱
- 163邮箱
- 自定义SMTP服务器

## 注意事项

1. 首次使用需要配置邮件服务
2. 数据存储在浏览器 localStorage 中
3. 清除浏览器数据会导致数据丢失
4. 建议定期备份重要数据

## 开发模式

使用 nodemon 自动重启服务器：
```bash
npm run dev
```

## 许可证

ISC
