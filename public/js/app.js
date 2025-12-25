// 服务器数据存储
let servers = [];
let editingId = null;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadServers();
    renderTable();

    // 表单提交事件
    document.getElementById('serverForm').addEventListener('submit', handleFormSubmit);

    // 取消按钮事件
    document.getElementById('cancelBtn').addEventListener('click', resetForm);

    // 输入方式切换事件
    const inputModeRadios = document.querySelectorAll('input[name="inputMode"]');
    inputModeRadios.forEach(radio => {
        radio.addEventListener('change', handleInputModeChange);
    });

    // 充值日期和年限变化时自动计算到期日期
    document.getElementById('rechargeDate').addEventListener('change', calculateExpiryDate);
    document.getElementById('years').addEventListener('input', calculateExpiryDate);

    // 续费模式下，到期日期变化时也要重新计算
    document.getElementById('expiryDate').addEventListener('change', calculateExpiryDate);

    // 批量导入相关事件
    document.getElementById('downloadTemplateBtn').addEventListener('click', downloadTemplate);
    document.getElementById('selectFileBtn').addEventListener('click', () => {
        document.getElementById('excelFileInput').click();
    });
    document.getElementById('excelFileInput').addEventListener('change', handleFileSelect);
    document.getElementById('importBtn').addEventListener('click', handleImport);
});

// 从 localStorage 加载数据
function loadServers() {
    const data = localStorage.getItem('servers');
    if (data) {
        servers = JSON.parse(data);
    }
}

// 保存数据到 localStorage
function saveServers() {
    localStorage.setItem('servers', JSON.stringify(servers));
}

// 验证邮箱格式
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 处理输入方式切换
function handleInputModeChange(e) {
    const mode = e.target.value;
    const rechargeGroup = document.getElementById('rechargeGroup');
    const expiryGroup = document.getElementById('expiryGroup');
    const rechargeDate = document.getElementById('rechargeDate');
    const expiryDate = document.getElementById('expiryDate');

    // 更新active类
    document.querySelectorAll('.mode-option').forEach(option => {
        option.classList.remove('active');
    });
    e.target.closest('.mode-option').classList.add('active');

    if (mode === 'initial') {
        // 初次缴费模式：显示充值日期，到期日期自动计算（只读显示）
        rechargeGroup.style.display = 'block';
        expiryGroup.style.display = 'block';
        rechargeDate.required = true;
        expiryDate.required = false;
        expiryDate.readOnly = true;
        expiryDate.style.backgroundColor = '#f5f5f5';

        // 如果充值日期和年限都有值，自动计算到期日期
        calculateExpiryDate();
    } else {
        // 续费模式：隐藏充值日期，显示到期日期输入（用于输入当前到期日期）
        rechargeGroup.style.display = 'none';
        expiryGroup.style.display = 'block';
        rechargeDate.required = false;
        expiryDate.required = true;
        expiryDate.readOnly = false;
        expiryDate.style.backgroundColor = '';
    }
}

// 根据充值日期和年限自动计算到期日期
function calculateExpiryDate() {
    const mode = document.querySelector('input[name="inputMode"]:checked').value;
    const rechargeDateInput = document.getElementById('rechargeDate');
    const yearsInput = document.getElementById('years');
    const expiryDateInput = document.getElementById('expiryDate');

    const years = parseInt(yearsInput.value);

    if (!years || years <= 0) return;

    if (mode === 'initial') {
        // 初次缴费：充值日期 + 充值年限 = 到期日期
        const rechargeDate = rechargeDateInput.value;
        if (!rechargeDate) return;

        const date = new Date(rechargeDate);
        date.setFullYear(date.getFullYear() + years);

        // 格式化为 YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        expiryDateInput.value = `${year}-${month}-${day}`;
    } else if (mode === 'renewal') {
        // 续费：当前到期日期 + 续费年限 = 新到期日期
        const currentExpiryDate = expiryDateInput.value;
        if (!currentExpiryDate) return;

        const date = new Date(currentExpiryDate);
        date.setFullYear(date.getFullYear() + years);

        // 格式化为 YYYY-MM-DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        // 在续费模式下，显示计算后的新到期日期提示
        const newExpiryDate = `${year}-${month}-${day}`;
        expiryDateInput.value = newExpiryDate;
    }
}

// 处理表单提交
function handleFormSubmit(e) {
    e.preventDefault();

    const payer = document.getElementById('payer').value.trim();
    const company = document.getElementById('company').value.trim();
    const years = document.getElementById('years').value;
    const expiryDate = document.getElementById('expiryDate').value;
    const email = document.getElementById('email').value.trim();

    // 输入验证
    if (!payer || !company || !years || !expiryDate || !email) {
        alert('请填写所有必填字段');
        return;
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
        alert('请输入正确的邮箱格式');
        return;
    }

    // 验证充值年限
    const yearsNum = parseInt(years);
    if (isNaN(yearsNum) || yearsNum < 1) {
        alert('充值年限必须是大于0的整数');
        return;
    }

    // 验证日期格式
    const dateObj = new Date(expiryDate);
    if (isNaN(dateObj.getTime())) {
        alert('请输入正确的日期格式');
        return;
    }

    const server = {
        id: editingId || Date.now(),
        payer: payer,
        company: company,
        years: yearsNum,
        expiryDate: expiryDate,
        email: email
    };

    if (editingId) {
        // 更新现有服务器
        const index = servers.findIndex(s => s.id === editingId);
        if (index !== -1) {
            servers[index] = server;
        }
    } else {
        // 添加新服务器
        servers.push(server);
    }

    try {
        saveServers();
        renderTable();
        resetForm();
        alert('保存成功！');
    } catch (error) {
        alert('保存失败：' + error.message);
    }
}

// 重置表单
function resetForm() {
    document.getElementById('serverForm').reset();
    document.getElementById('serverId').value = '';
    editingId = null;
}

// 计算剩余天数
function calculateDaysRemaining(expiryDate) {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// 渲染表格
function renderTable() {
    const tbody = document.getElementById('serverTableBody');
    tbody.innerHTML = '';

    if (servers.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.textContent = '暂无数据';
        cell.style.textAlign = 'center';
        row.appendChild(cell);
        tbody.appendChild(row);
        return;
    }

    servers.forEach(server => {
        const daysRemaining = calculateDaysRemaining(server.expiryDate);
        const row = document.createElement('tr');

        // 如果剩余天数少于30天，添加警告样式
        if (daysRemaining <= 30) {
            row.classList.add('warning');
        }

        // 安全地创建单元格，防止XSS攻击
        const payerCell = document.createElement('td');
        payerCell.textContent = server.payer;
        row.appendChild(payerCell);

        const companyCell = document.createElement('td');
        companyCell.textContent = server.company;
        row.appendChild(companyCell);

        const yearsCell = document.createElement('td');
        yearsCell.textContent = server.years + ' 年';
        row.appendChild(yearsCell);

        const expiryCell = document.createElement('td');
        expiryCell.textContent = server.expiryDate;
        row.appendChild(expiryCell);

        const daysCell = document.createElement('td');
        daysCell.textContent = daysRemaining + ' 天';
        row.appendChild(daysCell);

        const emailCell = document.createElement('td');
        emailCell.textContent = server.email;
        row.appendChild(emailCell);

        // 操作按钮
        const actionCell = document.createElement('td');

        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-edit';
        editBtn.textContent = '编辑';
        editBtn.onclick = () => editServer(server.id);
        actionCell.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-delete';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = () => deleteServer(server.id);
        actionCell.appendChild(deleteBtn);

        const emailBtn = document.createElement('button');
        emailBtn.className = 'btn btn-email';
        emailBtn.textContent = '发送提醒';
        emailBtn.onclick = () => sendReminder(server.id);
        actionCell.appendChild(emailBtn);

        row.appendChild(actionCell);
        tbody.appendChild(row);
    });
}

// 编辑服务器
function editServer(id) {
    const server = servers.find(s => s.id === id);
    if (server) {
        document.getElementById('payer').value = server.payer;
        document.getElementById('company').value = server.company;
        document.getElementById('years').value = server.years;
        document.getElementById('expiryDate').value = server.expiryDate;
        document.getElementById('email').value = server.email;
        editingId = id;
    }
}

// 删除服务器
function deleteServer(id) {
    if (confirm('确定要删除这条记录吗？')) {
        servers = servers.filter(s => s.id !== id);
        saveServers();
        renderTable();
    }
}

// 发送邮件提醒
function sendReminder(id) {
    const server = servers.find(s => s.id === id);
    if (!server) return;

    const daysRemaining = calculateDaysRemaining(server.expiryDate);

    // 发送邮件到后端
    fetch('/api/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: server.email,
            payer: server.payer,
            company: server.company,
            expiryDate: server.expiryDate,
            daysRemaining: daysRemaining
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('邮件发送成功！');
        } else {
            alert('邮件发送失败：' + data.message);
        }
    })
    .catch(error => {
        alert('邮件发送失败：' + error.message);
    });
}

// ========== 批量导入功能 ==========

// 下载Excel模板
function downloadTemplate() {
    // 创建模板数据
    const templateData = [
        ['缴费人', '缴费单位', '充值年限', '充值日期', '联系人邮箱'],
        ['张三', '测试科技有限公司', '1', '2025-01-01', 'zhangsan@example.com'],
        ['李四', '示例网络公司', '2', '2025-01-15', 'lisi@example.com']
    ];

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // 设置列宽
    ws['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 15 },
        { wch: 30 }
    ];

    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '服务器续费信息');

    // 下载文件
    XLSX.writeFile(wb, '服务器续费导入模板.xlsx');

    showImportStatus('模板下载成功！请填写数据后上传。', 'success');
}

// 处理文件选择
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('fileName').textContent = file.name;
    document.getElementById('importBtn').disabled = false;
}

// 处理批量导入
function handleImport() {
    const fileInput = document.getElementById('excelFileInput');
    const file = fileInput.files[0];

    if (!file) {
        showImportStatus('请先选择Excel文件', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // 读取第一个工作表
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // 解析并导入数据
            importData(jsonData);
        } catch (error) {
            showImportStatus('文件解析失败：' + error.message, 'error');
        }
    };

    reader.readAsArrayBuffer(file);
}

// 导入数据到系统
function importData(jsonData) {
    if (jsonData.length < 2) {
        showImportStatus('Excel文件中没有数据', 'error');
        return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    // 跳过表头，从第二行开始
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];

        // 跳过空行
        if (!row || row.length === 0 || !row[0]) continue;

        try {
            const payer = row[0]?.toString().trim();
            const company = row[1]?.toString().trim();
            const years = parseInt(row[2]);
            const rechargeDate = row[3]?.toString().trim();
            const email = row[4]?.toString().trim();

            // 验证必填字段
            if (!payer || !company || !years || !rechargeDate || !email) {
                errors.push(`第${i + 1}行：缺少必填字段`);
                errorCount++;
                continue;
            }

            // 验证邮箱格式
            if (!validateEmail(email)) {
                errors.push(`第${i + 1}行：邮箱格式不正确`);
                errorCount++;
                continue;
            }

            // 计算到期日期
            const date = new Date(rechargeDate);
            if (isNaN(date.getTime())) {
                errors.push(`第${i + 1}行：充值日期格式不正确`);
                errorCount++;
                continue;
            }

            date.setFullYear(date.getFullYear() + years);
            const expiryDate = date.toISOString().split('T')[0];

            // 添加到服务器列表
            const server = {
                id: Date.now() + i,
                payer: payer,
                company: company,
                years: years,
                expiryDate: expiryDate,
                email: email
            };

            servers.push(server);
            successCount++;
        } catch (error) {
            errors.push(`第${i + 1}行：${error.message}`);
            errorCount++;
        }
    }

    // 保存数据并刷新表格
    saveServers();
    renderTable();

    // 显示导入结果
    let message = `导入完成！成功：${successCount}条`;
    if (errorCount > 0) {
        message += `，失败：${errorCount}条`;
        if (errors.length > 0) {
            message += '\n错误详情：\n' + errors.slice(0, 5).join('\n');
            if (errors.length > 5) {
                message += `\n...还有${errors.length - 5}个错误`;
            }
        }
    }

    showImportStatus(message, errorCount > 0 ? 'info' : 'success');

    // 清空文件选择
    document.getElementById('excelFileInput').value = '';
    document.getElementById('fileName').textContent = '';
    document.getElementById('importBtn').disabled = true;
}

// 显示导入状态
function showImportStatus(message, type) {
    const statusDiv = document.getElementById('importStatus');
    statusDiv.textContent = message;
    statusDiv.className = `import-status ${type}`;
    statusDiv.style.display = 'block';
}
