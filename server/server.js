const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

// 中间件
app.use(express.json({ limit: '1mb' })); // 限制请求体大小
app.use(express.static(path.join(__dirname, '../public')));

// HTML转义函数，防止邮件注入
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// 验证邮箱格式
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 邮件配置（QQ邮箱）
// 请在环境变量中设置 EMAIL_USER 和 EMAIL_PASS
const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || 'your-email@qq.com', // 发件人邮箱
        pass: process.env.EMAIL_PASS || 'your-app-password' // 邮箱授权码
    }
});

// 发送邮件 API
app.post('/api/send-email', async (req, res) => {
    const { to, payer, company, expiryDate, daysRemaining } = req.body;

    // 输入验证
    if (!to || !payer || !company || !expiryDate || daysRemaining === undefined) {
        return res.status(400).json({ success: false, message: '缺少必要参数' });
    }

    // 验证邮箱格式
    if (!isValidEmail(to)) {
        return res.status(400).json({ success: false, message: '邮箱格式不正确' });
    }

    // 验证剩余天数是否为数字
    if (typeof daysRemaining !== 'number' || isNaN(daysRemaining)) {
        return res.status(400).json({ success: false, message: '剩余天数格式不正确' });
    }

    // 转义用户输入，防止邮件注入
    const safePayer = escapeHtml(payer);
    const safeCompany = escapeHtml(company);
    const safeExpiryDate = escapeHtml(expiryDate);
    const safeDaysRemaining = escapeHtml(daysRemaining);

    // 根据剩余天数设置紧急程度
    let urgencyLevel = '';
    let urgencyColor = '#FF9800';
    if (daysRemaining <= 7) {
        urgencyLevel = '【紧急催收】';
        urgencyColor = '#F44336';
    } else if (daysRemaining <= 15) {
        urgencyLevel = '【重要提醒】';
        urgencyColor = '#FF5722';
    } else if (daysRemaining <= 30) {
        urgencyLevel = '【续费提醒】';
        urgencyColor = '#FF9800';
    }

    // 构建邮件内容
    const subject = `${urgencyLevel}服务器账号缴费催收通知`;
    const html = `
        <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
            <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="background-color: ${urgencyColor}; color: white; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; font-size: 24px;">${urgencyLevel}服务器账号缴费催收</h2>
                </div>

                <p style="font-size: 16px; color: #333;">尊敬的 <strong>${safePayer}</strong>：</p>

                <p style="font-size: 14px; color: #555; line-height: 1.6;">您好！</p>

                <p style="font-size: 14px; color: #555; line-height: 1.6;">
                    根据我们的系统记录，<strong style="color: #2196F3;">${safeCompany}</strong> 的服务器账号即将到期，现特此通知您尽快完成续费缴纳。
                </p>

                <div style="background-color: #FFF3E0; border-left: 4px solid ${urgencyColor}; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #E65100; font-size: 16px;">账号到期信息</h3>
                    <table style="width: 100%; font-size: 14px; color: #555;">
                        <tr>
                            <td style="padding: 5px 0;"><strong>缴费单位：</strong></td>
                            <td style="padding: 5px 0;">${safeCompany}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>到期日期：</strong></td>
                            <td style="padding: 5px 0; color: #F44336; font-weight: bold;">${safeExpiryDate}</td>
                        </tr>
                        <tr>
                            <td style="padding: 5px 0;"><strong>剩余天数：</strong></td>
                            <td style="padding: 5px 0; color: #F44336; font-weight: bold; font-size: 18px;">${safeDaysRemaining} 天</td>
                        </tr>
                    </table>
                </div>

                <div style="background-color: #FFEBEE; border: 1px solid #FFCDD2; padding: 15px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; color: #C62828; font-size: 16px;">⚠️ 重要提醒</h3>
                    <p style="margin: 5px 0; font-size: 14px; color: #555; line-height: 1.6;">
                        为确保您的服务器正常运行，避免因账号到期导致的服务中断、数据丢失等问题，请您务必在到期前完成续费缴纳。
                    </p>
                    <p style="margin: 5px 0; font-size: 14px; color: #D32F2F; font-weight: bold;">
                        逾期未缴费可能导致：服务器停机、数据无法访问、业务中断等严重后果。
                    </p>
                </div>

                <div style="background-color: #E3F2FD; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0;">
                    <h3 style="margin: 0 0 10px 0; color: #1565C0; font-size: 16px;">续费方式</h3>
                    <p style="margin: 5px 0; font-size: 14px; color: #555; line-height: 1.6;">
                        请联系管理员办理续费手续，或通过以下方式与我们取得联系：
                    </p>
                    <ul style="font-size: 14px; color: #555; line-height: 1.8;">
                        <li>联系邮箱：admin@example.com</li>
                        <li>请在邮件中注明您的单位名称和服务器信息</li>
                    </ul>
                </div>

                <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 20px;">
                    如您已完成续费，请忽略此邮件。如有任何疑问，欢迎随时与我们联系。
                </p>

                <p style="font-size: 14px; color: #555; line-height: 1.6;">感谢您的配合与支持！</p>

                <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 20px 0;">

                <p style="font-size: 12px; color: #999; text-align: center;">
                    此邮件由服务器续费管理系统自动发送，请勿直接回复。<br>
                    发送时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
                </p>
            </div>
        </div>
    `;

    const mailOptions = {
        from: '"服务器管理中心" <2354621633@qq.com>',
        to: to,
        subject: subject,
        html: html
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: '邮件发送成功' });
    } catch (error) {
        console.error('邮件发送失败:', error);
        // 不要将详细错误信息返回给客户端
        res.status(500).json({ success: false, message: '邮件发送失败，请稍后重试' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
