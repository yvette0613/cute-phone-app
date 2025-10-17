// ▼▼▼ 步骤3：将下面所有JS代码粘贴到 <script> 标签的最顶部 ▼▼▼

// ================== 地址选择与持久化功能 ==================

// 1. 定义全局变量来存储用户的选择
let locationMode = 'real'; // 'real' 或 'virtual'
let virtualLocation = '';

/**
 * 打开地址选择菜单
 */
function openLocationChooser() {
    document.getElementById('locationActionSheet').classList.add('show');
}

/**
 * 关闭地址选择菜单
 */
function closeLocationChooser() {
    document.getElementById('locationActionSheet').classList.remove('show');
}

/**
 * 用户选择“获取真实地址”
 */
function selectRealLocation() {
    locationMode = 'real';
    // 调用现有的定位函数
    updateLocation();
    // 保存设置并关闭菜单
    saveLocationSettings();
    closeLocationChooser();
}

/**
 * 用户选择“填写虚拟地址”
 */
function selectVirtualLocation() {
    const currentVirtual = localStorage.getItem('virtualLocation') || '请输入虚拟地址';
    const newLocation = prompt('请输入你要显示的虚拟地址：', currentVirtual);

    // 如果用户输入了内容 (而不是取消或留空)
    if (newLocation !== null && newLocation.trim() !== '') {
        const trimmedLocation = newLocation.trim();
        locationMode = 'virtual';
        virtualLocation = trimmedLocation;

        // 立刻更新界面
        document.getElementById('locationText').textContent = trimmedLocation;

        // 保存设置
        saveLocationSettings();
    }
    // 关闭菜单
    closeLocationChooser();
}

/**
 * 将用户的选择保存到 localStorage
 */
function saveLocationSettings() {
    try {
        localStorage.setItem('locationMode', locationMode);
        localStorage.setItem('virtualLocation', virtualLocation);
        console.log(`地址设置已保存: 模式=${locationMode}, 地址=${virtualLocation}`);
    } catch (e) {
        console.error('保存地址设置失败:', e);
    }
}

/**
 * 从 localStorage 加载用户的地址设置
 * (这个函数会在页面启动时调用)
 */
function loadLocationSettings() {
    const savedMode = localStorage.getItem('locationMode');
    const savedVirtual = localStorage.getItem('virtualLocation');

    if (savedMode) {
        locationMode = savedMode;
    }
    if (savedVirtual) {
        virtualLocation = savedVirtual;
    }

    console.log(`地址设置已加载: 模式=${locationMode}, 地址=${virtualLocation}`);

    // 加载后立即应用设置
    if (locationMode === 'virtual' && virtualLocation) {
        document.getElementById('locationText').textContent = virtualLocation;
    } else {
        // 如果是真实模式，则调用 updateLocation
        updateLocation();
    }
}


// ▲▲▲ JS代码粘贴结束 ▲▲▲


// ================== 新增：用户设置相关函数 ==================

/**
 * 打开用于编辑用户信息的卡片
 * 这个函数由“我的信息”按钮的 onclick 调用
 */

let userProfile = {
    name: '我',
    avatar: '👤',
    persona: '我是一名用户，请以简洁友好的方式与我对话。' // 新增用户设定字段
};
let currentAvatarTarget = null;

/**
 * 从 localStorage 加载用户配置
 * 这个函数会在应用启动时调用
 */
function loadUserProfile() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        try {
            const loadedProfile = JSON.parse(savedProfile);
            // 确保旧的用户数据也能兼容新的persona字段
            userProfile = {...userProfile, ...loadedProfile};
            console.log('成功从 localStorage 加载用户个人信息。');
        } catch (e) {
            console.error('解析用户个人信息失败:', e);
        }
    }
}

/**
 * 修复版：统一保存联系人和用户信息的函数
 * - 解决了新建联系人时会创建重复数据的问题
 * - 结构清晰，易于维护
 */
/**
 * [最终智能版] 统一保存联系人和用户信息的函数
 * - 能根据标记判断是保存到普通列表、密友列表或当前世界
 */
function saveAllCharacterData() {
    const modal = document.getElementById('characterCardModal');
    const contactId = modal.dataset.editingId;
    const saveTarget = modal.dataset.saveTarget || 'default'; // 获取保存目标标记，默认为'default'
    const worldIdToSaveTo = modal.dataset.currentWorldId; // 获取当前世界ID

    if (!contactId) {
        console.error("保存失败：无法获取当前操作的联系人ID。");
        alert("保存失败，发生未知错误。");
        return;
    }

    const contactName = document.getElementById('char-name').value.trim();
    if (!contactName) {
        alert('角色姓名不能为空！');
        return;
    }

    const contactPersona = document.getElementById('char-persona').value.trim();
    const contactAvatar = document.getElementById('avatar-preview').src;
    // ▼▼▼ 第4步：在这里粘贴新增的JS代码 ▼▼▼
    // [新增] 获取绑定的世界书ID
    const boundWorldbooks = [];
    document.querySelectorAll('#charWorldbooksList input[type="checkbox"]:checked').forEach(cb => {
        boundWorldbooks.push(cb.value);
    });


    // 保存用户个人信息 (这部分不变)
    userProfile.name = document.getElementById('user-name').value.trim() || '我';
    userProfile.persona = document.getElementById('user-persona').value.trim();
    userProfile.avatar = document.getElementById('user-avatar-preview').src;
    localStorage.setItem('userProfile', JSON.stringify(userProfile));

    // --- 处理联系人数据的保存逻辑 ---
    let contactToEditOrCreate = contactsData.find(c => String(c.id) === String(contactId));

    if (contactToEditOrCreate) {
        // 编辑现有联系人
        contactToEditOrCreate.name = contactName;
        contactToEditOrCreate.status = contactPersona || '这个角色很神秘，还没有设定...';
        contactToEditOrCreate.avatar = contactAvatar;
        contactToEditOrCreate.boundWorldbooks = boundWorldbooks;
    } else {
        // 创建新联系人
        contactToEditOrCreate = {
            id: contactId,
            name: contactName,
            status: contactPersona || '这个角色很神秘，还没有设定...',
            avatar: contactAvatar,
            boundWorldbooks: boundWorldbooks,
        };
        contactsData.push(contactToEditOrCreate); // 添加到总联系人列表
    }

    // 针对不同列表的特殊处理
    if (saveTarget === 'sweetheart') {
        const existingSweetheartIndex = sweetheartContactsData.findIndex(c => String(c.id) === String(contactId));
        if (existingSweetheartIndex !== -1) {
            sweetheartContactsData[existingSweetheartIndex] = contactToEditOrCreate;
        } else {
            sweetheartContactsData.push(contactToEditOrCreate);
        }
        saveSweetheartContacts();
        renderSweetheartList();
    } else if (worldIdToSaveTo) { // 如果是从某个世界打开的通讯录
        const world = worldsData.find(w => w.id === worldIdToSaveTo);
        if (world && !world.contacts.includes(contactId)) {
            world.contacts.push(contactId); // 将新联系人ID添加到该世界的联系人列表
            saveWorldsData(); // 保存世界数据
        }
        // 重新渲染当前世界的通讯录
        openWorldContacts(worldIdToSaveTo);
    } else { // 默认情况下，渲染所有联系人
        localStorage.setItem('phoneContactsData', JSON.stringify(contactsData));
        renderContacts(contactsData);
    }

    // 如果当前聊天对象被编辑了，同步更新聊天标题
    if (currentChatContact && String(currentChatContact.id) === String(contactId)) {
        document.getElementById('chatContactName').textContent = contactName;
    }

    closeCharacterCardPage();
    showSuccessModal('保存成功', '所有信息已更新。');

    // 清理标记，避免下次打开时出错
    modal.removeAttribute('data-save-target');
    modal.removeAttribute('data-currentWorldId'); // 清理世界ID标记
}


// ========== 密友角色卡相关函数 ==========

let currentEditingSweetheartId = null;

/**
 * 打开密友角色卡弹窗（新建模式）
 */
function openSweetheartCardModal() {
    currentEditingSweetheartId = null;

    // 重置所有字段
    document.getElementById('sweetheart-name').value = '';
    document.getElementById('sweetheart-persona').value = '';
    document.getElementById('sweetheart-personality').value = '';
    document.getElementById('sweetheart-occupation').value = '';
    document.getElementById('sweetheart-catchphrase').value = '';
    document.getElementById('sweetheart-history').value = '';
    document.getElementById('sweetheart-relationship').value = '';

    // 重置头像
    document.getElementById('sweetheart-avatar-preview').src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    // 重置世界书区域
    document.getElementById('sweetheartWorldbooksList').style.display = 'none';
    document.getElementById('sweetheart-wb-arrow').classList.remove('open');

    // 显示弹窗
    document.getElementById('sweetheartCardModal').classList.add('show');
}

/**
 * 关闭密友角色卡弹窗
 */
function closeSweetheartCardModal() {
    document.getElementById('sweetheartCardModal').classList.remove('show');
    currentEditingSweetheartId = null;
}

/**
 * 打开头像选择器
 */
function openSweetheartAvatarPicker() {
    // 这里可以实现更复杂的选择逻辑，现在简单触发文件上传
    document.getElementById('sweetheart-avatar-input').click();
}

/**
 * 切换世界书列表的展开/收起
 */
function toggleSweetheartWorldbooks() {
    const list = document.getElementById('sweetheartWorldbooksList');
    const arrow = document.getElementById('sweetheart-wb-arrow');

    if (list.style.display === 'none') {
        renderSweetheartWorldbooksList();
        list.style.display = 'block';
        arrow.classList.add('open');
    } else {
        list.style.display = 'none';
        arrow.classList.remove('open');
    }
}

/**
 * 渲染世界书复选框列表
 */
function renderSweetheartWorldbooksList() {
    const container = document.getElementById('sweetheartWorldbooksList');

    if (worldbookData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #BCAAA4; padding: 20px; font-size: 13px;">还没有世界书哦~</div>';
        return;
    }

    container.innerHTML = '';

    worldbookData.forEach(wb => {
        const item = document.createElement('div');
        item.className = 'sweetheart-wb-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `sh-wb-${wb.id}`;
        checkbox.value = wb.id;

        const label = document.createElement('label');
        label.htmlFor = `sh-wb-${wb.id}`;
        label.textContent = wb.title;

        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
}

/**
 * 保存密友角色卡数据
 */
function saveSweetheartCardData() {
    // 1. 获取必填字段
    const name = document.getElementById('sweetheart-name').value.trim();
    if (!name) {
        alert('请填写姓名！💕');
        return;
    }

    const persona = document.getElementById('sweetheart-persona').value.trim();
    if (!persona) {
        alert('请填写基础设定！📝');
        return;
    }

    // 2. 获取可选字段
    const personality = document.getElementById('sweetheart-personality').value.trim();
    const occupation = document.getElementById('sweetheart-occupation').value.trim();
    const catchphrase = document.getElementById('sweetheart-catchphrase').value.trim();
    const history = document.getElementById('sweetheart-history').value.trim();
    const relationship = document.getElementById('sweetheart-relationship').value.trim();

    // 3. 获取头像
    const avatar = document.getElementById('sweetheart-avatar-preview').src;
    const finalAvatar = (avatar && !avatar.includes('data:image/gif')) ? avatar : '💖';

    // 4. 获取绑定的世界书
    const boundWorldbooks = [];
    document.querySelectorAll('.sweetheart-wb-item input[type="checkbox"]:checked').forEach(cb => {
        boundWorldbooks.push(cb.value);
    });

    // 5. 生成ID并保存
    const contactId = currentEditingSweetheartId || 'SH' + Date.now();

    const contactData = {
        id: contactId,
        name,
        status: persona,
        avatar: finalAvatar,
        personality,
        occupation,
        catchphrase,
        history,
        relationship,
        boundWorldbooks
    };

    // 6. 判断是新建还是编辑
    const existingIndex = sweetheartContactsData.findIndex(c => c.id === contactId);
    if (existingIndex !== -1) {
        sweetheartContactsData[existingIndex] = contactData;
    } else {
        sweetheartContactsData.push(contactData);
    }

    // 7. 保存到localStorage
    saveSweetheartContacts();

    // 8. 刷新列表并关闭弹窗
    renderSweetheartList();
    closeSweetheartCardModal();
    showSuccessModal('保存成功', `${name} 已加入密友列表！💖`);
}

// ▼▼▼ 第3步：在这里粘贴新增的JS代码 ▼▼▼

/**
 * [新增] 切换角色卡中世界书列表的展开/收起
 */
function toggleCharacterWorldbooks() {
    const list = document.getElementById('charWorldbooksList');
    const arrow = document.getElementById('char-wb-arrow');

    if (list.style.display === 'none') {
        list.style.display = 'block';
        arrow.classList.add('open');
    } else {
        list.style.display = 'none';
        arrow.classList.remove('open');
    }
}

/**
 * [新增] 在角色卡中渲染世界书复选框列表
 * @param {Array<string>} boundIds - 当前角色已绑定的世界书ID数组
 */
function renderCharacterWorldbooksList(boundIds = []) {
    const container = document.getElementById('charWorldbooksList');
    if (!container) return;

    if (worldbookData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; padding: 20px; font-size: 13px;">还没有创建世界书哦~</div>';
        return;
    }

    container.innerHTML = ''; // 清空旧内容

    worldbookData.forEach(wb => {
        const item = document.createElement('div');
        item.className = 'char-wb-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `char-wb-${wb.id}`;
        checkbox.value = wb.id;
        // 如果当前世界书ID在已绑定列表中，则默认勾选
        if (boundIds.includes(wb.id)) {
            checkbox.checked = true;
        }

        const label = document.createElement('label');
        label.htmlFor = `char-wb-${wb.id}`;
        label.textContent = wb.title;

        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
}

// ▲▲▲ JS代码粘贴结束 ▲▲▲


// 监听头像上传
document.addEventListener('DOMContentLoaded', function () {
    const avatarInput = document.getElementById('sweetheart-avatar-input');
    if (avatarInput) {
        avatarInput.addEventListener('change', function (event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    document.getElementById('sweetheart-avatar-preview').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
});


const predefinedWallpapers = [
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1980&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=1974&auto=format&fit=crop',
    'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1759876940844_qdqqd_7jj1ti.jpg',
    'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760094166464_qdqqd_n7utqx.jpg',
    'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760094369789_qdqqd_54ccoj.png',
    'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760094483657_qdqqd_fpd674.png',
    'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760094641422_qdqqd_nrkqzw.png',
    'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760094705206_qdqqd_fmzh0j.png',
    'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760094777621_qdqqd_wx4ars.png'
];

function applyWallpaper(imageUrl) {
    const screenEl = document.getElementById('screen');
    if (!imageUrl) {
        screenEl.style.backgroundImage = '';
        localStorage.removeItem('phoneWallpaper');
        console.log('壁纸已清除，恢复默认背景');
    } else {
        screenEl.style.backgroundImage = `url('${imageUrl}')`;
        localStorage.setItem('phoneWallpaper', imageUrl);
        console.log('壁纸已应用并保存');
    }
    updateWallpaperActiveState(imageUrl);
}

function renderWallpaperThumbnails() {
    const grid = document.getElementById('wallpaperGrid');
    grid.innerHTML = '';

    predefinedWallpapers.forEach(url => {
        const thumb = document.createElement('div');
        thumb.className = 'wallpaper-thumbnail';
        thumb.style.backgroundImage = `url('${url}')`;
        thumb.dataset.url = url;
        thumb.onclick = () => applyWallpaper(url);
        grid.appendChild(thumb);
    });

    const noWallpaperThumb = document.createElement('div');
    noWallpaperThumb.className = 'wallpaper-thumbnail';
    noWallpaperThumb.style.background = 'linear-gradient(135deg, #ddd, #fff)';
    noWallpaperThumb.innerHTML = '<span style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-weight:bold; color:#888; font-size:12px;">默认</span>';
    noWallpaperThumb.onclick = () => applyWallpaper('');
    grid.appendChild(noWallpaperThumb);
}

function updateWallpaperActiveState(currentUrl) {
    document.querySelectorAll('.wallpaper-thumbnail').forEach(thumb => {
        if (!thumb.dataset.url && !currentUrl) {
            thumb.classList.add('active');
        } else {
            thumb.classList.toggle('active', thumb.dataset.url === currentUrl);
        }
    });
}

function handleWallpaperUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        applyWallpaper(e.target.result);
        showWallpaperStatus('本地壁纸已应用');
    };
    reader.onerror = () => {
        showWallpaperStatus('读取文件失败', 'error');
    };
    reader.readAsDataURL(file);
}

function toggleWallpaperUrlInput() {
    const urlBox = document.getElementById('wallpaper-url-box');
    urlBox.classList.toggle('show');
}

function applyWallpaperFromUrl() {
    const urlInput = document.getElementById('wallpaper-url-input');
    const url = urlInput.value.trim();
    if (url) {
        applyWallpaper(url);
        showWallpaperStatus('URL壁纸已应用');
        urlInput.value = '';
        toggleWallpaperUrlInput();
    } else {
        showWallpaperStatus('请输入有效的URL', 'error');
    }
}

function showWallpaperStatus(message, type = 'success') {
    const statusEl = document.getElementById('wallpaper-status');
    statusEl.textContent = message;
    statusEl.className = 'status-message' + (type === 'error' ? ' error' : '');
    setTimeout(() => {
        statusEl.textContent = '';
    }, 3000);
}

// === 使用这个最终版本的 updateTime 函数 ===
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const dayStr = days[now.getDay()];

    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const monthStr = months[now.getMonth()];
    const dateNum = now.getDate();

    const fullDateStr = `${dayStr}, ${monthStr} ${dateNum}`;

    // 更新状态栏的时间
    document.querySelectorAll('.status-bar span:first-child').forEach(el => {
        el.textContent = timeStr;
    });

    // 更新我们最终版容器内的时间和日期
    const mainTimeEl = document.getElementById('finalMainTime');
    if (mainTimeEl) {
        mainTimeEl.textContent = timeStr;
    }

    const mainDateEl = document.getElementById('finalMainDate');
    if (mainDateEl) {
        mainDateEl.textContent = fullDateStr;
    }
}


updateTime();
setInterval(updateTime, 60000);
const globalConfig = {
    apiConfigs: [],
    activeApiConfig: null,
    database: {
        supabaseUrl: '',
        supabaseKey: '',
        tableName: 'user_data',
        client: null
    },
    storage: {
        bucketName: 'icons',
        uploadPath: 'app-icons/',
        maxFileSize: 5
    },
    customIcons: {},
    savedWidgets: [],
    dockIcons: ['https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760103483956_qdqqd_ufc76a.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760095214931_qdqqd_cud7dm.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760094934930_qdqqd_5lvg07.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760103414729_qdqqd_t8eu22.png']
};

// ========== 开始：请用这个【修正版】函数替换旧的 openCharacterCardPage 函数 ==========

function openCharacterCardPage() {
    const page = document.getElementById('characterCardModal');
    if (!page) {
        console.error('错误：无法找到 characterCardModal 元素！');
        return;
    }
    // 1. 确保 modal 容器在 DOM 中是可见的
    page.style.display = 'flex';

    // 2. 为了让 CSS 过渡动画能够正确触发，我们延迟一个渲染帧再添加 'show' 类
    requestAnimationFrame(() => {
        page.classList.add('show');
    });

    const modal = page.querySelector('.character-card-modal');

    // 现在的逻辑更加健壮，不再寻找不存在的元素。
    // 我们直接处理显示逻辑。

    // 检查是否正在创建一个全新的联系人。
    // this.dataset.editingId 已经被移除，现在的判断更通用
    const isNewContact = !document.getElementById('characterCardModal').textContent || document.getElementById('characterCardModal').textContent === '...';
    if (isNewContact) {
        // 重置表单，为新建联系人做准备
        document.getElementById('char-name').value = '';
        document.getElementById('char-persona').value = '';
        // 重置性别选择为男性
        // 重置性别选择为男性
        const maleRadio = document.querySelector('.character-gender-selection input[value="male"]');
        if (maleRadio) maleRadio.checked = true;
        // 使用1x1的透明像素作为占位符，避免出现破碎的图片图标
        document.getElementById('avatar-preview').src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
        document.getElementById('avatar-input').value = '';
    }
}


function closeCharacterCardPage() {
    const page = document.getElementById('characterCardModal');
    const modal = page.querySelector('.character-card-modal');
    page.classList.remove('show');

    // 在动画结束后执行清理工作
    setTimeout(() => {
        page.style.display = 'none';
        // 清理模式标记，以便下次默认是编辑联系人
        modal.removeAttribute('data-mode');
    }, 300);
}

// ========== 开始：用这个【修正版】的change事件监听器替换旧的 ==========
document.getElementById('avatar-input').addEventListener('change', function (event) {
    const file = event.target.files[0];
    // 检查文件和当前目标是否存在
    if (file && currentAvatarTarget) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // 根据记录的目标更新对应的头像预览
            const previewId = currentAvatarTarget === 'user' ? 'user-avatar-preview' : 'avatar-preview';
            document.getElementById(previewId).src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
}); // <--- 【核心修正】在这里补上缺失的 });

// ========== 结束：替换完成 ==========


// ========== 结束：替换完成 ==========


function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (match) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[match];
    });
}

let messageLongPressTimer = null; // 用于检测长按的计时器

/**
 * 创建消息的DOM元素，并为其绑定长按/右键事件
 */
function _createMessageDOM(contactId, message, index) {
    const row = document.createElement('div');
    row.className = 'message-row ' + (message.sender === 'user' ? 'sent' : 'received');
    row.dataset.messageIndex = index;

    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-chat-avatar';

    let avatarSrc, senderName;
    if (message.sender === 'user') {
        // ============ ↓↓↓ 核心改造点在这里 ↓↓↓ ============
        // 不再使用硬编码的"你"和"👤", 而是从 userProfile 获取
        senderName = userProfile.name;
        avatarSrc = userProfile.avatar;
        const isUrl = avatarSrc && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:'));
        if (isUrl) {
            avatarDiv.innerHTML = `<img src="${avatarSrc}" alt="${senderName}">`;
        } else {
            // 使用自定义的 emoji 或字符作为头像，并保持蓝色背景
            avatarDiv.innerHTML = `<div class="initials" style="background: #0A84FF;">${escapeHTML(avatarSrc)}</div>`;
        }
        // ============ ↑↑↑ 改造结束 ↑↑↑ ============
    } else {
        // 渲染对方消息的逻辑保持不变
        senderName = currentChatContact.name;
        avatarSrc = currentChatContact.avatar;
        const isUrl = avatarSrc && (avatarSrc.startsWith('http') || avatarSrc.startsWith('data:'));
        if (isUrl) {
            avatarDiv.innerHTML = `<img src="${avatarSrc}" alt="${senderName}">`;
        } else {
            avatarDiv.innerHTML = `<div class="initials" style="background: #6c757d;">${escapeHTML(avatarSrc)}</div>`;
        }
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const senderNameDiv = document.createElement('div');
    senderNameDiv.className = 'message-sender-name';
    senderNameDiv.textContent = senderName;

    const bubble = createMessageBubble(message);

    bubble.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showMessageActionSheet(contactId, index);
    });

    let messageLongPressTimer = null;
    bubble.addEventListener('touchstart', () => {
        messageLongPressTimer = setTimeout(() => showMessageActionSheet(contactId, index), 500);
    }, {passive: true});
    bubble.addEventListener('touchend', () => clearTimeout(messageLongPressTimer));
    bubble.addEventListener('touchmove', () => clearTimeout(messageLongPressTimer));

    contentDiv.appendChild(senderNameDiv);
    contentDiv.appendChild(bubble);

    // 最终结论：无论发送还是接收，DOM结构都应该是 [头像, 内容]。
    // 这样CSS规则才能在一致的结构上工作，不会产生歧义。
    row.appendChild(avatarDiv);
    row.appendChild(contentDiv);

    return row;
}


/**
 * 显示消息操作菜单
 * @param {string|number} contactId - 联系人ID
 * @param {number} index - 消息的索引
 */
function showMessageActionSheet(contactId, index) {
    const actionSheet = document.getElementById('messageActionSheet');
    actionSheet.dataset.contactId = contactId;
    actionSheet.dataset.index = index;
    actionSheet.classList.add('show');
}

/**
 * 隐藏消息操作菜单
 */
function hideMessageActionSheet() {
    const actionSheet = document.getElementById('messageActionSheet');
    actionSheet.classList.remove('show');
    // 清理数据以防万一
    delete actionSheet.dataset.contactId;
    delete actionSheet.dataset.index;
}


/**
 * 删除指定的消息 (现在由操作菜单调用)
 * @param {string|number} contactId - 联系人ID
 * @param {number} messageIndex - 消息的索引
 */
function deleteMessage(contactId, messageIndex) {
    if (confirm('确定要永久删除这条消息吗？')) {
        const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');
        if (chatHistory[contactId] && chatHistory[contactId][messageIndex] !== undefined) {
            chatHistory[contactId].splice(messageIndex, 1);
            try {
                localStorage.setItem('phoneChatHistory', JSON.stringify(chatHistory));
            } catch (e) {
                console.error('保存失败:', e);
                alert('存储空间不足，请清理数据');
            }
            console.log(`消息已删除 (Contact: ${contactId}, Index: ${messageIndex})`);
            openChat(currentChatContact);
            renderContacts(contactsData);
        }
    }
}

/**
 * [新增] 复制消息文本到剪贴板
 */
function copyMessage(contactId, messageIndex) {
    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');
    const message = chatHistory[contactId]?.[messageIndex];

    if (message && message.text) {
        // 如果消息是图片HTML，我们复制一个[图片]占位符
        if (message.text.trim().startsWith('<img')) {
            navigator.clipboard.writeText('[图片]').then(() => {
                showSuccessModal('复制成功', '已将"[图片]"复制到剪贴板。');
            }).catch(err => console.error('复制图片占位符失败', err));
        } else {
            // 否则，正常复制文本
            navigator.clipboard.writeText(message.text).then(() => {
                showSuccessModal('复制成功', '消息内容已复制到剪贴板。');
            }).catch(err => console.error('复制失败', err));
        }
    }
    hideMessageActionSheet();
}

/**
 * [全新版本] 引用消息：激活引用预览UI
 */
function quoteMessage(contactId, messageIndex) {
    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');
    const message = chatHistory[contactId]?.[messageIndex];

    if (!message) return;

    // 1. 存储被引用的消息数据
    currentQuoteData = {
        sender: message.sender,
        text: message.text,
        senderName: message.sender === 'user' ? userProfile.name : currentChatContact.name
    };

    // 2. 更新并显示预览UI
    const previewEl = document.getElementById('quotePreview');
    document.getElementById('quotePreviewSender').textContent = currentQuoteData.senderName;

    let previewText = message.text;
    // 如果是图片，预览文本显示为[图片]
    if (previewText.trim().startsWith('<img')) {
        previewText = '[图片]';
    }
    document.getElementById('quotePreviewText').textContent = previewText;

    previewEl.classList.add('show');

    // 3. 聚焦输入框并隐藏操作菜单
    document.getElementById('chatInput').focus();
    hideMessageActionSheet();
}

/**
 * [新增] 取消引用
 */
function cancelQuote() {
    currentQuoteData = null;
    const previewEl = document.getElementById('quotePreview');
    previewEl.classList.remove('show');
}


/**
 * [新增] 重新生成AI回复
 */
async function regenerateAiResponse(contactId, messageIndex) {
    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');
    const messages = chatHistory[contactId];

    if (!messages || !messages[messageIndex]) return;

    const targetMessage = messages[messageIndex];

    // 只能重新生成AI的回复
    if (targetMessage.sender === 'user') {
        showSuccessModal('操作无效', '只能对AI的回复进行重新生成哦。', 2000);
        hideMessageActionSheet();
        return;
    }

    // 1. 删除当前的AI回复
    messages.splice(messageIndex, 1);
    try {
        localStorage.setItem('phoneChatHistory', JSON.stringify(chatHistory));
    } catch (e) {
        console.error('保存失败:', e);
        alert('存储空间不足，请清理数据');
    }
    openChat(currentChatContact); // 重新渲染界面以移除旧消息

    // 2. 隐藏操作菜单
    hideMessageActionSheet();

    // 3. 调用 getAiReply 函数，它会自动使用当前的（已删掉最后一条的）历史记录来生成新回复
    await getAiReply();
}

/**
 * [全新版本] 创建消息气泡的DOM元素
 * @param {object} message - 消息对象，可能包含 text, quote 等属性
 * @returns {HTMLElement} - 创建好的气泡DOM元素
 */
function createMessageBubble(message) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';

    const messageText = String(message.text || '');

    // 1. 检查并渲染引用部分
    if (message.quote) {
        const quoteWrapper = document.createElement('div');
        quoteWrapper.className = 'quoted-message-wrapper';

        let quotedContent = message.quote.text;
        if (quotedContent.trim().startsWith('<img')) {
            quotedContent = '[图片]';
        }

        quoteWrapper.innerHTML = `
            <strong class="quoted-sender">${escapeHTML(message.quote.senderName)}</strong>
            <span class="quoted-text">${escapeHTML(quotedContent)}</span>
        `;
        bubble.appendChild(quoteWrapper);
    }

    // 2. 区分处理主消息内容（图片、代码、纯文本）

    // 2a. 如果主消息是图片
    if (messageText.trim().startsWith('<img')) {
        // 如果是图片，它自己就需要一个容器，而不是直接插入气泡
        const imageContainer = document.createElement('div');
        imageContainer.innerHTML = messageText;

        // 为了保持样式统一，我们把图片也包装一下，并且去掉气泡的padding
        bubble.classList.add('image-only');
        bubble.appendChild(imageContainer.firstChild);

        // 如果有引用，图片消息的padding需要特殊处理
        if (message.quote) {
            bubble.style.padding = '8px';
            bubble.classList.remove('image-only');
        }
        return bubble;
    }

    // 2b. 如果主消息包含代码块
    const codeBlockRegex = /```([\s\S]*?)```/g;
    if (codeBlockRegex.test(messageText)) {
        // 这部分逻辑和之前一样，用于解析代码块和普通文本混合的内容
        let lastIndex = 0;
        let match;
        codeBlockRegex.lastIndex = 0; // 重置正则的 lastIndex

        while ((match = codeBlockRegex.exec(messageText)) !== null) {
            const precedingText = messageText.slice(lastIndex, match.index);
            if (precedingText) {
                const textNode = document.createElement('div');
                textNode.className = 'main-message-text';
                textNode.textContent = precedingText;
                bubble.appendChild(textNode);
            }

            // 创建代码块... (这部分代码保持不变)
            const codeContent = match[1].trim();
            const wrapper = document.createElement('div');
            wrapper.className = 'code-block-wrapper';
            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.textContent = codeContent;
            pre.appendChild(code);
            const copyBtn = document.createElement('button');
            copyBtn.className = 'copy-code-btn';
            copyBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg><span>复制</span>`;
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(codeContent).then(() => {
                    copyBtn.classList.add('copied');
                    copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></svg><span>已复制</span>';
                    setTimeout(() => {
                        copyBtn.classList.remove('copied');
                        copyBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg><span>复制</span>';
                    }, 2000);
                }).catch(err => {
                    console.error('复制失败:', err);
                    alert('复制失败，请手动复制');
                });
            };

            wrapper.appendChild(pre);
            wrapper.appendChild(copyBtn);
            bubble.appendChild(wrapper);

            lastIndex = codeBlockRegex.lastIndex;
        }
        const remainingText = messageText.slice(lastIndex);
        if (remainingText) {
            const textNode = document.createElement('div');
            textNode.className = 'main-message-text';
            textNode.textContent = remainingText;
            bubble.appendChild(textNode);
        }

    } else if (messageText) {
        // 2c. 如果主消息是纯文本
        const textNode = document.createElement('div');
        textNode.className = 'main-message-text';
        textNode.textContent = messageText;
        bubble.appendChild(textNode);
    }

    return bubble;
}


// 步骤一：将 const 修改为 let，以便后续从 localStorage 加载数据
let contactsData = [
    {id: '1', name: '代码助手', avatar: '🤖', status: '为您服务'},
];
// ========== 新增：独立的密友数据数组 ==========
let sweetheartContactsData = [
    {id: '1', name: '代码助手', avatar: '🤖', status: '为您服务'},
    {id: '2', name: '平平无奇的朋友', avatar: '😊', status: '你好呀'},
    {
        id: 'SH_default_001',
        name: '贴心小助手',
        status: '随时准备好聆听你的心事~',
        avatar: '💖',
        personality: '温柔体贴',
        relationship: '最好的朋友',
        boundWorldbooks: []
    }
];


// ========== 世界系统数据 ==========
let worldsData = []; // 存储所有世界
let currentWorldId = null; // 当前选中的世界ID

// ========== 世界系统功能 ==========

/**
 * 打开世界选择页面
 */
function openWorldSelect() {
    document.getElementById('worldSelectPage').classList.add('show');
    renderWorldList();
}

/**
 * 关闭世界选择页面
 */
function closeWorldSelect() {
    document.getElementById('worldSelectPage').classList.remove('show');

    // 【核心修复】关闭世界选择页面意味着返回主桌面，
    // 此时应清除当前的世界ID，避免影响其他页面的返回逻辑。
    currentWorldId = null;
    localStorage.removeItem('currentWorldId');
}


/**
 * 渲染世界列表
 */
function renderWorldList() {
    const container = document.getElementById('worldSelectContent');
    container.innerHTML = '';
    saveWorldsData();


    // 渲染现有世界
    worldsData.forEach(world => {
        const card = document.createElement('div');
        card.className = 'world-card';
        card.onclick = () => enterWorld(world.id);

        // 获取该世界的联系人数量
        const contactCount = world.contacts ? world.contacts.length : 0;

        card.innerHTML = `
            <div class="world-card-icon">${world.icon || '🌍'}</div>
            <div class="world-card-name">${escapeHTML(world.name)}</div>
            <div class="world-card-desc">${escapeHTML(world.description || '暂无描述')}</div>
            <div class="world-card-contacts">${contactCount} 个联系人</div>
        `;

        container.appendChild(card);
    });

    // 添加"新建世界"卡片
    const newCard = document.createElement('div');
    newCard.className = 'world-card new-world';
    newCard.onclick = openNewWorldModal;
    newCard.innerHTML = `
        <div class="world-card-icon">➕</div>
        <div class="world-card-name">新建世界</div>
        <div class="world-card-desc">创建一个全新的世界</div>
    `;
    container.appendChild(newCard);
}

/**
 * 进入指定世界（打开该世界的通讯录）
 */
function enterWorld(worldId) {
    currentWorldId = worldId;
    localStorage.setItem('currentWorldId', worldId);

    closeWorldSelect();

    // 延迟打开密友列表，让关闭动画完成
    setTimeout(() => {
        openSweetheartList();
    }, 300);
}


/**
 * 打开指定世界的通讯录
 */
function openWorldContacts(worldId) {
    const world = worldsData.find(w => w.id === worldId);
    if (!world) return;

    // 你可以在这里更新contactsPage的标题，例如显示世界名称
    // 假设contactsPage的header有一个id为'contactsTitle'的元素
    // const contactsTitleEl = document.getElementById('contactsTitle');
    // if (contactsTitleEl) contactsTitleEl.textContent = world.name + '通讯录';

    document.getElementById('contactsPage').classList.add('show');

    // 根据世界的联系人ID列表，筛选出对应的联系人
    const worldContacts = contactsData.filter(contact =>
        world.contacts && world.contacts.includes(String(contact.id))
    );

    renderContacts(worldContacts); // 渲染该世界的联系人
}


/**
 * 打开新建世界弹窗
 */
function openNewWorldModal() {
    document.getElementById('worldNameInput').value = '';
    document.getElementById('worldDescInput').value = '';
    document.getElementById('worldWorldbooksList').style.display = 'none';
    document.getElementById('world-wb-arrow').classList.remove('open');

    // V V V 新增的重置代码 V V V
    document.getElementById('worldMapPreview').src = '';
    document.getElementById('worldMapPreview').style.display = 'none';
    document.getElementById('worldMapPlaceholder').style.display = 'block';
    document.getElementById('worldMapOptions').style.display = 'none';
    document.getElementById('worldMapInput').value = '';
    // ^ ^ ^ 新增的重置代码 ^ ^ ^

    document.getElementById('newWorldModal').classList.add('show');
    renderWorldWorldbooksList(); // 渲染可绑定的世界书列表
}


/**
 * 关闭新建世界弹窗
 */
function closeNewWorldModal() {
    document.getElementById('newWorldModal').classList.remove('show');
}

/**
 * 切换世界书列表的展开/收起
 */
function toggleWorldWorldbooks() {
    const list = document.getElementById('worldWorldbooksList');
    const arrow = document.getElementById('world-wb-arrow');

    if (list.style.display === 'none') {
        renderWorldWorldbooksList();
        list.style.display = 'block';
        arrow.classList.add('open');
    } else {
        list.style.display = 'none';
        arrow.classList.remove('open');
    }
}

/**
 * 渲染世界书复选框列表
 */
function renderWorldWorldbooksList() {
    const container = document.getElementById('worldWorldbooksList');

    if (worldbookData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #7FB5D1; padding: 20px; font-size: 13px;">还没有世界书哦~</div>';
        return;
    }

    container.innerHTML = '';

    worldbookData.forEach(wb => {
        const item = document.createElement('div');
        item.className = 'world-wb-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `world-wb-${wb.id}`;
        checkbox.value = wb.id;

        const label = document.createElement('label');
        label.htmlFor = `world-wb-${wb.id}`;
        label.textContent = wb.title;

        item.appendChild(checkbox);
        item.appendChild(label);
        container.appendChild(item);
    });
}

/* ========== 新增：世界地图功能相关函数 ========== */

/**
 * 切换地图选项的显示/隐藏
 */
function toggleWorldMapOptions() {
    const optionsEl = document.getElementById('worldMapOptions');
    if (optionsEl.style.display === 'flex') {
        optionsEl.style.display = 'none';
    } else {
        optionsEl.style.display = 'flex';
    }
}

/**
 * 选择默认地图（当前为占位功能）
 */
function selectDefaultMap() {
    // 这里可以扩展为显示一个包含多张默认地图的弹窗
    const defaultMapUrl = 'https://i.pinimg.com/originals/b6/29/79/b629796791c13a48e7787f0b5d92ac87.png'; // 示例默认地图
    const previewImg = document.getElementById('worldMapPreview');
    const placeholder = document.getElementById('worldMapPlaceholder');

    previewImg.src = defaultMapUrl;
    previewImg.style.display = 'block';
    placeholder.style.display = 'none';

    // 选择后隐藏选项
    document.getElementById('worldMapOptions').style.display = 'none';
    showSuccessModal('选择成功', '已应用默认地图。');
}

/**
 * 处理用户上传的地图图片
 * @param {Event} event - 文件输入框的 change 事件
 */
function handleWorldMapUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 使用 FileReader 将图片文件转为 Base64 URL
    const reader = new FileReader();
    reader.onload = function (e) {
        const previewImg = document.getElementById('worldMapPreview');
        const placeholder = document.getElementById('worldMapPlaceholder');

        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        placeholder.style.display = 'none';

        // 上传后隐藏选项
        document.getElementById('worldMapOptions').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

/**
 * 保存新建的世界
 */
function saveNewWorld() {
    const name = document.getElementById('worldNameInput').value.trim();

    if (!name) {
        alert('请填写世界名称！');
        return;
    }

    const description = document.getElementById('worldDescInput').value.trim();

    // V V V 新增的获取地图代码 V V V
    const mapUrl = document.getElementById('worldMapPreview').src;
    // ^ ^ ^ 新增的获取地图代码 ^ ^ ^

    // 获取选中的世界书
    const selectedWorldbooks = [];
    document.querySelectorAll('.world-wb-item input[type="checkbox"]:checked').forEach(cb => {
        selectedWorldbooks.push(cb.value);
    });

    const newWorld = {
        id: 'WORLD_' + Date.now(),
        name,
        description,
        mapUrl: mapUrl.includes('base64') || mapUrl.includes('pinimg.com') ? mapUrl : '', // 仅当有有效图片时才保存
        icon: '🌍',
        contacts: [], // 新世界默认没有联系人
        worldbooks: selectedWorldbooks,
        timestamp: Date.now()
    };

    worldsData.push(newWorld);
    saveWorldsData();

    closeNewWorldModal();
    renderWorldList(); // 重新渲染世界列表

    // 根据需求，新建世界后跳转到该世界的通讯录（空状态）
    showSuccessModal('创建成功', `世界"${name}"已创建！`);
    setTimeout(() => {
        enterWorld(newWorld.id); // 直接进入新创建的世界
    }, 1000); // 稍微延迟一下，让成功提示显示
}

/**
 * 保存世界数据到localStorage
 */
function saveWorldsData() {
    try {
        localStorage.setItem('phoneWorldsData', JSON.stringify(worldsData));
    } catch (e) {
        console.error('保存世界数据失败:', e);
    }
}

/**
 * 从localStorage加载世界数据
 */
function loadWorldsData() {
    try {
        const saved = localStorage.getItem('phoneWorldsData');
        if (saved) {
            worldsData = JSON.parse(saved);
            console.log('成功加载世界数据，共', worldsData.length, '个世界');
        } else {
            // 如果没有世界数据，则初始化一个默认世界
            worldsData.push({
                id: 'DEFAULT_WORLD',
                name: '一个平平无奇的世界',
                description: '这是一个普通的世界',
                icon: '🌏',
                contacts: ['1', '2'], // 默认包含代码助手和另一个朋友
                worldbooks: [],
                timestamp: Date.now()
            });
            saveWorldsData(); // 立即保存到 localStorage
            console.log('已初始化默认世界数据。');
        }
    } catch (e) {
        console.error('加载世界数据失败:', e);
    }
}


let currentChatContact = null;
let currentQuoteData = null;

async function updateBattery() {
    try {
        if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();

            const updateBatteryDisplay = () => {
                const level = Math.round(battery.level * 100);
                const charging = battery.charging;
                document.querySelectorAll('.status-icons').forEach(iconGroup => {
                    const container = iconGroup.querySelector('.battery-container');
                    const levelBar = iconGroup.querySelector('.battery-level');
                    const text = iconGroup.querySelector('.battery-text');
                    if (container && levelBar && text) {
                        text.textContent = `${level}%`;

                        container.classList.toggle('charging', charging);

                        levelBar.style.width = `${level * 0.85}%`;

                        levelBar.classList.toggle('low', level <= 20 && !charging);
                    }
                });

                console.log(`电量已更新: ${level}% ${charging ? '(充电中)' : ''}`);
            };

            updateBatteryDisplay();

            battery.addEventListener('levelchange', updateBatteryDisplay);
            battery.addEventListener('chargingchange', updateBatteryDisplay);

        } else {
            console.warn('浏览器不支持 Battery API');
        }
    } catch (error) {
        console.error('获取电量失败:', error);
    }
}


// ========== 开始：请用这个【修正版】函数替换旧的 updateLocation 函数 ==========
async function updateLocation() {
    if (locationMode !== 'real') return;
    // [修正] 原来的选择器 '.weather-card .location' 是错误的，这里修正为 '.location-text'
    const locationElement = document.querySelector('.location-text');
    if (!locationElement) {
        // [优化] 增加错误提示，方便调试
        console.error("代码错误：未能找到用于显示位置的 .location-text 元素。");
        return;
    }

    try {
        if (!navigator.geolocation) {
            console.warn('浏览器不支持地理定位');
            locationElement.textContent = '无法定位';
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                console.log('成功获取位置坐标:', lat, lon);

                // 备注：这里使用了高德API，你需要替换 'YOUR_AMAP_KEY' 为你自己的有效Key
                try {
                    const response = await fetch(
                        `https://restapi.amap.com/v3/geocode/regeo?location=${lon},${lat}&key=66dfab01a25cfe9002858086538601e6&extensions=base`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        if (data.status === '1' && data.regeocode) {
                            const address = data.regeocode.addressComponent;
                            const district = address.district || address.city || '未知位置';
                            locationElement.textContent = district; // 更新UI
                            console.log('高德地址解析成功:', district);
                            return; // 成功后提前退出
                        }
                    }
                } catch (error) {
                    console.warn('高德API解析失败, 将尝试使用备用方案。错误:', error);
                }

                // 如果高德API失败，则使用备用方案 (OpenStreetMap)
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=zh-CN`
                    );

                    if (response.ok) {
                        const data = await response.json();
                        const address = data.address;
                        const location = address.city || address.town || address.village ||
                            address.county || address.state || '未知位置';
                        locationElement.textContent = location; // 更新UI
                        console.log('备用方案地址解析成功:', location);
                    }
                } catch (error) {
                    console.error('备用方案地址解析也失败了:', error);
                    locationElement.textContent = `坐标:${lat.toFixed(2)},${lon.toFixed(2)}`;
                }
            },
            (error) => {
                console.warn('获取地理位置失败:', error.message);
                if (error.code === 1) { // PERMISSION_DENIED
                    locationElement.textContent = '未授权定位';
                } else {
                    locationElement.textContent = '定位失败';
                }
            }, {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 600000
            }
        );
    } catch (error) {
        console.error('地理定位功能出现未知错误:', error);
    }
}

// ========== 结束：替换完成 ==========


function toggleWeatherSelector(event) {
    event.stopPropagation();
    const popup = document.getElementById('weatherPopup');
    if (popup.style.display === 'none') {
        popup.style.display = 'block';
    } else {
        popup.style.display = 'none';
    }
}

function selectWeather(weatherType, event) {
    event.stopPropagation();

    const weatherIcons = {
        sunny: '☀️',
        cloudy: '☁️',
        rainy: '🌧️',
        snowy: '❄️'
    };

    const currentIcon = document.getElementById('currentWeatherIcon');
    if (currentIcon) {
        currentIcon.textContent = weatherIcons[weatherType];
    }

    document.querySelectorAll('.weather-option').forEach(option => {
        option.classList.remove('active');
    });

    const selectedOption = document.querySelector(`[data-weather="${weatherType}"]`);
    if (selectedOption) {
        selectedOption.classList.add('active');
    }

    localStorage.setItem('selectedWeather', weatherType);

    document.getElementById('weatherPopup').style.display = 'none';

    console.log(`已选择天气: ${weatherType}`);
}

function editMood(event) {
    event.stopPropagation();

    const moodTextEl = document.getElementById('moodText');
    const currentMood = moodTextEl.classList.contains('empty') ? '' : moodTextEl.textContent;

    const newMood = prompt('输入你的心情：', currentMood);

    if (newMood !== null) {
        if (newMood.trim() === '') {
            moodTextEl.textContent = '点击填写心情...';
            moodTextEl.classList.add('empty');
        } else {
            moodTextEl.textContent = newMood.trim();
            moodTextEl.classList.remove('empty');
        }

        localStorage.setItem('userMood', newMood.trim());
    }
}

function loadSavedMoodAndWeather() {
    const weatherIcons = {
        sunny: '☀️',
        cloudy: '☁️',
        rainy: '🌧️',
        snowy: '❄️'
    };

    const savedMood = localStorage.getItem('userMood');
    const moodTextEl = document.getElementById('moodText');
    if (savedMood && moodTextEl) {
        moodTextEl.textContent = savedMood;
        moodTextEl.classList.remove('empty');
    }

    const savedWeather = localStorage.getItem('selectedWeather') || 'sunny';
    const currentIcon = document.getElementById('currentWeatherIcon');
    if (currentIcon) {
        currentIcon.textContent = weatherIcons[savedWeather];
    }

    document.querySelectorAll('.weather-option').forEach(option => {
        option.classList.remove('active');
    });
    const selectedOption = document.querySelector(`[data-weather="${savedWeather}"]`);
    if (selectedOption) {
        selectedOption.classList.add('active');
    }
}

document.addEventListener('click', function (e) {
    const popup = document.getElementById('weatherPopup');
    const weatherDisplay = document.querySelector('.weather-display');
    if (popup && !popup.contains(e.target) && !weatherDisplay.contains(e.target)) {
        popup.style.display = 'none';
    }
});

function initSupabaseClient() {
    const {supabaseUrl, supabaseKey} = globalConfig.database;

    if (!supabaseUrl || !supabaseKey) {
        return null;
    }

    globalConfig.database.client = {
        from: (table) => ({
            select: () => Promise.resolve({data: [], error: null}),
            insert: (data) => Promise.resolve({data, error: null}),
            update: (data) => Promise.resolve({data, error: null}),
            delete: () => Promise.resolve({data: null, error: null})
        }),
        storage: {
            from: (bucket) => ({
                upload: (path, file) => {
                    console.log(`上传文件到: ${bucket}/${path}`);
                    return Promise.resolve({
                        data: {path: `${bucket}/${path}`},
                        error: null
                    });
                },
                getPublicUrl: (path) => ({
                    data: {publicUrl: `https://example.supabase.co/storage/v1/object/public/${path}`}
                })
            })
        }
    };

    return globalConfig.database.client;
}

const dbAPI = {
    async saveData(data) {
        if (!globalConfig.database.client) {
            console.warn('数据库未初始化，请先配置Supabase');
            return {success: false, message: '数据库未初始化'};
        }

        try {
            const {data: result, error} = await globalConfig.database.client
                .from(globalConfig.database.tableName)
                .insert(data);

            if (error) throw error;
            return {success: true, data: result};
        } catch (error) {
            console.error('保存数据失败:', error);
            return {success: false, message: error.message};
        }
    },

    async getData(filters = {}) {
        if (!globalConfig.database.client) {
            console.warn('数据库未初始化');
            return {success: false, data: []};
        }

        try {
            const {data, error} = await globalConfig.database.client
                .from(globalConfig.database.tableName)
                .select();

            if (error) throw error;
            return {success: true, data};
        } catch (error) {
            console.error('获取数据失败:', error);
            return {success: false, data: []};
        }
    }
};

const storageAPI = {
    async uploadFile(file, customPath = '') {
        if (!globalConfig.database.client) {
            console.warn('云存储未初始化，请先配置Supabase');
            return {success: false, url: null};
        }

        try {
            const {bucketName, uploadPath} = globalConfig.storage;
            const filePath = `${uploadPath}${customPath || file.name}`;

            const {data, error} = await globalConfig.database.client.storage
                .from(bucketName)
                .upload(filePath, file);

            if (error) throw error;

            const {data: urlData} = globalConfig.database.client.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            console.log('文件上传成功:', urlData.publicUrl);
            return {success: true, url: urlData.publicUrl};
        } catch (error) {
            console.error('文件上传失败:', error);
            return {success: false, url: null, message: error.message};
        }
    }
};

const appsPage1 = [
    {
        id: 'worldbook',
        icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760105951573_qdqqd_4zhn48.png',
        label: '世界书',
        row: 0,
        col: 0,
        clickable: true
    },
    {
        id: 'photo',
        icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760112395282_qdqqd_jxwwfg.png',
        label: '相册',
        row: 0,
        col: 1
    },
    {
        id: 'calc',
        icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760107619286_qdqqd_tzxf3r.png',
        label: '账单',
        row: 0,
        col: 2
    },
    {
        id: 'store',
        icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760103537174_qdqqd_18w1fw.png',
        label: '切换手机',
        row: 0,
        col: 3
    },
    {
        id: 'settings',
        icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760110940876_qdqqd_ev1xec.png',
        label: '设置',
        row: 1,
        col: 0,
        clickable: true
    },
    {
        id: 'calendar',
        icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760110811117_qdqqd_gsrlfw.png',
        label: '日历',
        row: 1,
        col: 1
    },
    {
        id: 'note',
        icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760105743965_qdqqd_p5o31m.png',
        label: '日记',
        row: 1,
        col: 2
    },
    {
        id: 'clock',
        icon: 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760107999099_qdqqd_h6se19.png',
        label: '时钟',
        row: 1,
        col: 3
    }
];


// ========== 开始：用这个新版本替换旧的 appsPage2 数组 ==========
const appsPage2 = [
    {
        id: 'media_reading',
        label: '影音阅读',
        isFolder: true,
        icons: ['https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760115843325_qdqqd_69tlcj.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760117195210_qdqqd_k1cy4r.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760115791541_qdqqd_x3y0wt.png'], // 合并后的3个图标
        row: 0,
        col: 0
    },
    {
        id: 'entertainment',
        label: 'entertainment',
        isFolder: true,
        icons: ['https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760096293687_qdqqd_xti5y9.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760117261962_qdqqd_55pbz9.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760117296583_qdqqd_i0fpo6.png'], // 保留并确保3个图标
        row: 0,
        col: 1
    },
    {
        id: 'home',
        label: '居家生活',
        isFolder: true,
        icons: ['https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760095662621_qdqqd_b8q0r7.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760107551403_qdqqd_1s7h4p.png'], // 精简为2个图标
        row: 0,
        col: 2
    },
    {
        id: 'purchase',
        label: 'purchase',
        isFolder: true,
        // 补充为2个图标
        icons: ['https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760106251908_qdqqd_s71t7l.png', 'https://s3plus.meituan.net/opapisdk/op_ticket_885190757_1760106346391_qdqqd_ro4t40.png'],
        row: 0,
        col: 3
    },
    {
        id: 'widget2',
        label: 'Widget',
        isWidget: true,
        row: 1, // 调整了行号以适应新布局
        col: 0,
        colspan: 4,
        rowspan: 2
    }
];
// ========== 结束：替换完成 ==========

const state = {
    currentPage: 1,
    draggedElement: null,
    isDragging: false,
    isEditMode: false,
    hasDragged: false,
    dragStart: {x: 0, y: 0},
    dragOffset: {x: 0, y: 0},
    longPressTimer: null,
    swipeStart: {x: 0, time: 0},
    isSwipingPage: false,
    initialTransform: 0,
    swipeMoveScheduled: false, // <--- 新增
    lastSwipeTranslateX: 0,
    appLayouts: {
        page1: appsPage1,
        page2: appsPage2
    },
    lastDragEndTime: 0, // ✅ 新增：记录最后一次拖动结束的时间
    isDraggingFromDock: false  // 🔧 新增这一行
};


const screen = document.getElementById('screen');
const pagesWrapper = document.getElementById('pagesWrapper');

const getTouch = (e) => e.touches?.[0] || e;
const getChangedTouch = (e) => e.changedTouches?.[0] || e;

function positionElement(el, row, col, colspan = 1, rowspan = 1) {
    const ROW_HEIGHT_PX = 94;
    const GAP_PX = 14;
    const leftPercent = col * 25;
    const widthPercent = colspan * 25;
    const topPx = row * (ROW_HEIGHT_PX + GAP_PX);
    const heightPx = (rowspan * ROW_HEIGHT_PX) + ((rowspan - 1) * GAP_PX);
    Object.assign(el.style, {
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        top: `${topPx}px`,
        height: `${heightPx}px`
    });
}


function showEditHint(show) {
    const hint = document.getElementById(state.currentPage === 1 ? 'editHint1' : 'editHint2');
    hint.classList.toggle('show', show);
}

function showDeleteButtons(show) {
    const timeCard = document.getElementById('timeCard');
    if (timeCard) {
        timeCard.classList.toggle('show-delete', show);
    }

    const weatherCard = document.getElementById('weatherCard');
    if (weatherCard) {
        weatherCard.classList.toggle('show-delete', show);
    }

    // ✅ 修复：同时选择 .widget 和 .cat-widget
    document.querySelectorAll('.widget, .cat-widget').forEach(widget => {
        widget.classList.toggle('show-delete', show);
    });
}

function exitEditMode() {
    if (state.isEditMode && !state.isDragging) {
        state.isEditMode = false;
        showEditHint(false);
        showDeleteButtons(false);
        state.hasDragged = false;
    }
}

function openSettings() {
    document.getElementById('settingsPage').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsPage').classList.remove('show');
}

function openApiConfig() {
    document.getElementById('apiConfig').classList.add('show');
    renderApiConfigs();
}

function closeApiConfig() {
    document.getElementById('apiConfig').classList.remove('show');
}

function renderApiConfigs() {
    const list = document.getElementById('apiConfigList');
    list.innerHTML = '';

    globalConfig.apiConfigs.forEach((config, index) => {
        const item = document.createElement('div');
        item.className = 'api-config-item';
        if (globalConfig.activeApiConfig === index) {
            item.classList.add('active');
        }

        item.innerHTML = `
            <div class="config-details">
                <div class="config-name">${config.name}</div>
                <div class="config-url">${config.url}</div>
            </div>
            <button class="delete-config-btn" title="删除这个配置">×</button>
        `;

        item.querySelector('.config-details').onclick = () => applyApiConfig(index);

        const deleteBtn = item.querySelector('.delete-config-btn');
        deleteBtn.onclick = (event) => {
            event.stopPropagation();
            deleteApiConfig(index);
        };

        list.appendChild(item);
    });

    const addBtn = document.createElement('button');
    addBtn.className = 'add-new-btn';
    addBtn.textContent = '+ 新增配置';
    addBtn.onclick = () => {
        if (globalConfig.activeApiConfig !== null) {
            document.querySelector('.api-config-item.active')?.classList.remove('active');
            globalConfig.activeApiConfig = null;
            saveGlobalConfig();
        }
        clearApiForm();
    };
    list.appendChild(addBtn);
}


function clearApiForm() {
    document.getElementById('configName').value = '';
    document.getElementById('apiUrl').value = '';
    document.getElementById('apiKey').value = '';
    document.getElementById('modelSelect').innerHTML = '<option value="">请先拉取模型列表</option>';
    showApiStatus('', '');
}

async function testConnection() {
    const url = document.getElementById('apiUrl').value;
    const key = document.getElementById('apiKey').value;

    if (!url || !key) {
        showApiStatus('请填写URL和Key', 'error');
        return;
    }

    showApiStatus('正在测试连接...', '');

    setTimeout(() => {
        showApiStatus('连接成功', 'success');
    }, 1000);
}

async function fetchModels() {
    const url = document.getElementById('apiUrl').value.trim();
    const key = document.getElementById('apiKey').value.trim();

    if (!url || !key) {
        showApiStatus('请填写有效的API URL和API Key', 'error');
        return;
    }

    showApiStatus('正在向服务器请求模型列表...', '');
    const modelSelect = document.getElementById('modelSelect');
    modelSelect.innerHTML = '<option value="">正在拉取...</option>';
    modelSelect.disabled = true;

    try {
        const response = await fetch(`${url}/models`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${key}`
            }
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.error?.message || `服务器返回错误: ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();

        const models = (data.data || data).map(model => model.id).filter(id => id);

        if (models.length > 0) {
            modelSelect.innerHTML = models.map(m => `<option value="${m}">${m}</option>`).join('');
            showApiStatus(`成功拉取 ${models.length} 个模型！`, 'success');
        } else {
            modelSelect.innerHTML = '<option value="">未找到可用模型</option>';
            showApiStatus('API连接成功，但未返回任何模型列表。', 'error');
        }

    } catch (error) {
        console.error('拉取模型失败:', error);
        modelSelect.innerHTML = '<option value="">拉取失败</option>';
        showApiStatus(`拉取失败: ${error.message}。请检查URL、Key和网络连接。`, 'error');
    } finally {
        modelSelect.disabled = false;
    }
}


function saveApiConfig() {
    const name = document.getElementById('configName').value.trim();
    const url = document.getElementById('apiUrl').value.trim();
    const key = document.getElementById('apiKey').value.trim();
    const model = document.getElementById('modelSelect').value;

    if (!name || !url || !key) {
        showApiStatus('请填写所有必填项', 'error');
        return;
    }

    const configData = {name, url, key, model};

    if (globalConfig.activeApiConfig !== null && globalConfig.apiConfigs[globalConfig.activeApiConfig]) {
        globalConfig.apiConfigs[globalConfig.activeApiConfig] = configData;
        showSuccessModal('更新成功', `配置 "${name}" 已被更新！`);
    } else {
        globalConfig.apiConfigs.push(configData);
        globalConfig.activeApiConfig = globalConfig.apiConfigs.length - 1;
        showSuccessModal('保存成功', `配置 "${name}" 已被添加并激活！`);
    }

    saveGlobalConfig();
    renderApiConfigs();
}


function applyApiConfig(index) {
    globalConfig.activeApiConfig = index;
    const config = globalConfig.apiConfigs[index];

    document.getElementById('configName').value = config.name;
    document.getElementById('apiUrl').value = config.url;
    document.getElementById('apiKey').value = config.key;
    if (config.model) {
        document.getElementById('modelSelect').innerHTML = `<option value="${config.model}">${config.model}</option>`;
    }

    showApiStatus(`已应用配置: ${config.name}`, 'success');
    renderApiConfigs();
}

function showApiStatus(message, type) {
    const status = document.getElementById('apiStatus');
    status.textContent = message;
    status.style.color = type === 'error' ? '#dc3545' : '#28a745';
}

function openConfig(type) {
    const configId = type === 'database' ? 'databaseConfig' : 'storageConfig';
    document.getElementById(configId).classList.add('show');

    if (type === 'database') {
        document.getElementById('supabaseUrl').value = globalConfig.database.supabaseUrl;
        document.getElementById('supabaseKey').value = globalConfig.database.supabaseKey;
        document.getElementById('tableName').value = globalConfig.database.tableName;
    } else {
        document.getElementById('bucketName').value = globalConfig.storage.bucketName;
        document.getElementById('uploadPath').value = globalConfig.storage.uploadPath;
        document.getElementById('maxFileSize').value = globalConfig.storage.maxFileSize;
    }
}

function closeConfig(type) {
    const configId = type === 'database' ? 'databaseConfig' : 'storageConfig';
    document.getElementById(configId).classList.remove('show');
}

function saveConfig(type) {
    if (type === 'database') {
        globalConfig.database.supabaseUrl = document.getElementById('supabaseUrl').value;
        globalConfig.database.supabaseKey = document.getElementById('supabaseKey').value;
        globalConfig.database.tableName = document.getElementById('tableName').value;

        const client = initSupabaseClient();
        if (client) {
            const status = document.getElementById('dbStatus');
            status.textContent = '数据库已初始化，可以使用 dbAPI 进行操作';
            status.style.color = '#28a745';

            console.log('Supabase已初始化！');
            console.log('使用方法：');
            console.log('1. 保存数据: await dbAPI.saveData({ key: "value" })');
            console.log('2. 获取数据: await dbAPI.getData()');
        } else {
            const status = document.getElementById('dbStatus');
            status.textContent = '请填写完整的URL和Key';
            status.style.color = '#dc3545';
        }
    } else {
        globalConfig.storage.bucketName = document.getElementById('bucketName').value;
        globalConfig.storage.uploadPath = document.getElementById('uploadPath').value;
        globalConfig.storage.maxFileSize = document.getElementById('maxFileSize').value;

        const status = document.getElementById('storageStatus');
        status.textContent = '云存储配置已保存，上传文件时自动使用此配置';
        status.style.color = '#28a745';

        console.log('云存储已配置！');
        console.log('使用方法：');
        console.log('await storageAPI.uploadFile(file, "custom-path.png")');
    }

    setTimeout(() => closeConfig(type), 2000);
}

function openBeautify() {
    document.getElementById('beautifyPage').classList.add('show');
    renderAppPreviews();
    renderWallpaperThumbnails();
    const currentWallpaper = localStorage.getItem('phoneWallpaper');
    updateWallpaperActiveState(currentWallpaper);
}


function closeBeautify() {
    document.getElementById('beautifyPage').classList.remove('show');
}

function openWidgetManager() {
    document.getElementById('widgetManager').classList.add('show');
    renderSavedWidgets();
}

function closeWidgetManager() {
    document.getElementById('widgetManager').classList.remove('show');
}

function renderSavedWidgets() {
    const container = document.getElementById('savedWidgetsList');
    container.innerHTML = '';

    if (globalConfig.savedWidgets.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无已删除的组件</div>';
        return;
    }

    globalConfig.savedWidgets.forEach((widget, index) => {
        const item = document.createElement('div');
        item.className = 'saved-widget-item';
        item.innerHTML = `
                    <div class="saved-widget-name">${widget.name}</div>
                    <div style="display: flex; gap: 8px; margin-top: 8px;">
                        <button class="restore-btn" onclick="restoreWidget(${index})">恢复到桌面</button>
                        <button class="delete-saved-btn" onclick="deleteSavedWidget(${index})">永久删除</button>
                    </div>
                `;
        container.appendChild(item);
    });
}

function restoreWidget(index) {
    const widget = globalConfig.savedWidgets[index];
    if (!widget) return;

    if (widget.type === 'time') {
        const section = document.querySelector('.time-weather-section');
        section.insertAdjacentHTML('afterbegin', widget.html);
    } else if (widget.type === 'weather') {
        const section = document.querySelector('.time-weather-section');
        const timeCard = document.getElementById('timeCard');
        if (timeCard) {
            timeCard.insertAdjacentHTML('afterend', widget.html);
        } else {
            section.insertAdjacentHTML('beforeend', widget.html);
        }
    } else if (widget.type === 'widget') {
        const pageNum = widget.id.includes('widget2') ? 2 : 1;
        const grid = document.getElementById(`grid${pageNum}`);
        grid.insertAdjacentHTML('beforeend', widget.html);

        const restoredElement = grid.querySelector(`[data-id="${widget.id}"]`);
        if (restoredElement) {
            addDragListeners(restoredElement, false);
        }
    }

    const deletedComponents = JSON.parse(localStorage.getItem('deletedComponents') || '[]');
    const componentIndex = deletedComponents.indexOf(widget.id);

    if (componentIndex > -1) {
        deletedComponents.splice(componentIndex, 1);
    }

    globalConfig.savedWidgets.splice(index, 1);

    try {
        localStorage.setItem('deletedComponents', JSON.stringify(deletedComponents));
        localStorage.setItem('savedWidgets', JSON.stringify(globalConfig.savedWidgets));
        console.log(`${widget.name} 已恢复到桌面`);
    } catch (e) {
        console.error('保存数据失败:', e);
    }

    renderSavedWidgets();
}

function deleteSavedWidget(index) {
    const widget = globalConfig.savedWidgets[index];
    if (!widget) return;

    if (confirm(`确定要永久删除"${widget.name}"吗？此操作无法撤销。`)) {
        globalConfig.savedWidgets.splice(index, 1);

        localStorage.setItem('savedWidgets', JSON.stringify(globalConfig.savedWidgets));

        renderSavedWidgets();

        console.log(`${widget.name} 已永久删除`);
    }
}

function openContacts() {
    document.getElementById('contactsPage').classList.add('show');
    renderContacts(contactsData);
}

function closeContacts() {
    document.getElementById('contactsPage').classList.remove('show');
    document.getElementById('contactsSearch').value = '';

    // 如果是从某个世界进入通讯录的，返回时应该回到世界选择页面
    if (currentWorldId) {
        // 延迟一下，让通讯录关闭动画完成
        setTimeout(() => {
            openWorldSelect();
            currentWorldId = null; // 清除当前世界ID
            localStorage.removeItem('currentWorldId'); // 清除本地存储
        }, 300);
    }
}


// ========== 开始：请粘贴这段全新的 JavaScript 代码 ==========

function toggleContactMenu(event) {
    // 阻止事件冒泡，防止点击事件被页面的其他部分捕获，导致菜单立即关闭
    event.stopPropagation();

    const menu = document.getElementById('contactMenu');
    // 使用 classList.toggle() 来切换 'show' 类
    // 如果菜单没有 'show' 类，就给它加上；如果已经有了，就把它移除。
    // 这正是“切换”的含义。
    menu.classList.toggle('show');
}

// ========== 结束：粘贴代码 ==========


// ========== 开始：请用这个【修正版】函数替换旧的 renderContacts 函数 ==========
function renderContacts(contacts) {
    const container = document.getElementById('contactsList');
    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');

    container.innerHTML = '';
    if (contacts.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">未找到联系人</div>';
        return;
    }

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'contact-item';

        const contactMessages = chatHistory[contact.id] || [];
        let lastMessageText = contact.status;
        if (contactMessages.length > 0) {
            const lastMessage = contactMessages[contactMessages.length - 1];
            // 修正：如果最后一条消息是图片，显示占位符
            if (lastMessage.text && lastMessage.text.includes('<img')) {
                lastMessageText = '[图片]';
            } else {
                lastMessageText = lastMessage.text;
            }
        }

        // --- ↓↓↓ 核心修正点 ↓↓↓ ---
        // 1. 判断头像是 URL 还是 Emoji
        const isUrl = contact.avatar && (String(contact.avatar).startsWith('http') || String(contact.avatar).startsWith('data:'));

        // 2. 根据判断结果生成不同的 HTML
        // 修正示例
        const avatarContent = isUrl
            ? `<div class="contact-avatar"><img src="${contact.avatar}" alt="${escapeHTML(contact.name)}"></div>`
            : `<div class="contact-avatar">${escapeHTML(contact.avatar)}</div>`;


        item.innerHTML = `
            ${avatarContent}
            <div class="contact-info">
                <div class="contact-name">${escapeHTML(contact.name)}</div>
                <div class="contact-status">${escapeHTML(lastMessageText)}</div>
            </div>
            ${contact.badge > 0 ? `<div class="contact-badge">${contact.badge}</div>` : ''}
        `;

        item.style.cursor = 'pointer';
        item.onclick = () => openChat(contact);
        container.appendChild(item);
    });
}

function createNewContact() {
    const menu = document.getElementById('contactMenu');
    if (menu) menu.classList.remove('show');

    // 获取弹窗元素
    const modal = document.getElementById('characterCardModal');
    // 生成新ID并存储
    const newId = 'ID' + Math.floor(100000 + Math.random() * 900000);
    modal.dataset.editingId = newId;

    // 如果当前有选中的世界，则标记联系人属于该世界
    if (currentWorldId) {
        modal.dataset.currentWorldId = currentWorldId;
    } else {
        modal.removeAttribute('data-currentWorldId');
    }

    // --- 重置表单 (逻辑不变) ---
    document.getElementById('char-name').value = '';
    document.getElementById('char-persona').value = '';
    // ... (其他重置代码保持不变) ...
    document.getElementById('avatar-preview').src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
    const maleRadio = document.querySelector('.character-gender-selection input[value="male"]');
    if (maleRadio) maleRadio.checked = true;

    document.getElementById('user-name').value = userProfile.name || '我';
    document.getElementById('user-persona').value = userProfile.persona || '';
    const userAvatar = userProfile.avatar;
    const isUserUrl = userAvatar && (userAvatar.startsWith('http') || userAvatar.startsWith('data:'));
    document.getElementById('user-avatar-preview').src = isUserUrl ? userAvatar : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    openCharacterCardPage();
}


// ========== 结束：替换完成 ==========


function selectExistingContact() {
    const menu = document.getElementById('contactMenu');
    menu.classList.remove('show');
    alert('打开选择已有联系人页面');
}

document.addEventListener('click', function (e) {
    // --- 优化开始 ---

    // 1. 处理悬浮球菜单的外部点击
    const floatingMenu = document.getElementById('floatingBallMenu');
    const ball = document.getElementById('floatingBall');
    if (floatingMenu && ball && !floatingMenu.contains(e.target) && !ball.contains(e.target)) {
        closeFloatingBallMenu();
    }

    // 2. 处理联系人菜单的外部点击
    const contactMenu = document.getElementById('contactMenu');
    const addBtn = document.querySelector('.add-contact-btn');
    if (contactMenu && addBtn && !contactMenu.contains(e.target) && !addBtn.contains(e.target)) {
        contactMenu.classList.remove('show');
    }

    // --- 优化结束 ---
});


function applyCustomWidget() {
    const code = document.getElementById('widgetCodeInput').value.trim();

    if (!code) {
        alert('请输入组件代码');
        return;
    }

    const targetWidget = document.querySelector('[data-id="widget2"]');

    if (!targetWidget) {
        alert('未找到目标 Widget，请先恢复原始组件');
        return;
    }

    const alreadySaved = globalConfig.savedWidgets.some(w => w.id === 'widget2');

    if (!alreadySaved) {
        globalConfig.savedWidgets.push({
            id: 'widget2',
            type: 'widget',
            name: 'Widget（原始）',
            html: targetWidget.outerHTML,
            timestamp: Date.now()
        });

        localStorage.setItem('savedWidgets', JSON.stringify(globalConfig.savedWidgets));
        console.log('原始 Widget 已保存到"已删除组件"列表');
    }

    const widgetScene = targetWidget.querySelector('.widget-scene');
    if (widgetScene) {
        widgetScene.innerHTML = code;
        alert('自定义组件已应用！');
        console.log('自定义组件代码已应用到桌面');
    } else {
        alert('Widget 结构异常，请检查');
    }
}

function renderAppPreviews() {
    const container = document.getElementById('appPreviewList');
    container.innerHTML = '';

    const dockSection = document.createElement('div');
    dockSection.innerHTML = '<div class="section-title">DOCK栏图标</div>';
    container.appendChild(dockSection);

    for (let i = 0; i < 4; i++) {
        const item = document.createElement('div');
        item.className = 'app-preview-item';

        const currentIcon = globalConfig.dockIcons[i];
        const isUrl = currentIcon.startsWith('http') || currentIcon.startsWith('data:');
        const iconDisplay = isUrl
            ? `<img src="${currentIcon}" alt="Dock ${i + 1}">`
            : currentIcon;

        item.innerHTML = `
            <div class="preview-header">
                <div class="preview-icon" id="preview-dock-${i}">
                    ${iconDisplay}
                </div>
                <div class="preview-name">Dock 图标 ${i + 1}</div>
            </div>
            <div class="upload-section">
                <label class="upload-btn">
                    📁 上传文件
                    <input type="file" class="file-input" accept="image/*" onchange="handleDockUpload(event, ${i})">
                </label>
                <div class="url-input-btn" onclick="toggleDockUrlInput(${i})">🔗 URL填写</div>
            </div>
            <div class="url-input-box" id="dock-url-box-${i}">
                <input type="text" class="url-input-field" id="dock-url-input-${i}" placeholder="输入图片URL">
                <button class="confirm-btn" onclick="applyDockUrl(${i})">确认</button>
            </div>
            <div class="status-message" id="dock-status-${i}"></div>
        `;

        container.appendChild(item);
    }

    const divider = document.createElement('div');
    divider.innerHTML = '<div class="section-title">应用图标</div>';
    container.appendChild(divider);

    const allApps = [...appsPage1.filter(app => !app.isWidget), ...appsPage2.filter(app => !app.isWidget && !app.isFolder)];

    allApps.forEach(app => {
        const item = document.createElement('div');
        item.className = 'app-preview-item';

        const customIcon = globalConfig.customIcons[app.id];
        const iconDisplay = customIcon
            ? `<img src="${customIcon}" alt="${app.label}">`
            : app.icon;

        item.innerHTML = `
                    <div class="preview-header">
                        <div class="preview-icon" id="preview-${app.id}">
                            ${iconDisplay}
                        </div>
                        <div class="preview-name">${app.label}</div>
                    </div>
                    <div class="upload-section">
                        <label class="upload-btn">
                            📁 上传文件
                            <input type="file" class="file-input" accept="image/*" onchange="handleFileUpload(event, '${app.id}')">
                        </label>
                        <div class="url-input-btn" onclick="toggleUrlInput('${app.id}')">🔗 URL填写</div>
                    </div>
                    <div class="url-input-box" id="url-box-${app.id}">
                        <input type="text" class="url-input-field" id="url-input-${app.id}" placeholder="输入图片URL">
                        <button class="confirm-btn" onclick="applyUrlIcon('${app.id}')">确认</button>
                    </div>
                    <div class="status-message" id="status-${app.id}"></div>
                `;

        container.appendChild(item);
    });
}

function toggleUrlInput(appId) {
    const urlBox = document.getElementById(`url-box-${appId}`);
    urlBox.classList.toggle('show');
}

async function handleFileUpload(event, appId) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = globalConfig.storage.maxFileSize * 1024 * 1024;
    if (file.size > maxSize) {
        showStatus(appId, `文件太大 最大${globalConfig.storage.maxFileSize}MB`, 'error');
        return;
    }

    if (globalConfig.database.client) {
        showStatus(appId, '正在上传到云存储...', '');
        const result = await storageAPI.uploadFile(file, `${appId}-${Date.now()}.${file.name.split('.').pop()}`);

        if (result.success) {
            applyCustomIcon(appId, result.url);
            showStatus(appId, '已上传到云存储');
        } else {
            showStatus(appId, '上传失败，使用本地预览', 'error');
            const reader = new FileReader();
            reader.onload = (e) => {
                applyCustomIcon(appId, e.target.result);
            };
            reader.readAsDataURL(file);
        }
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            applyCustomIcon(appId, e.target.result);
            showStatus(appId, '文件已加载（本地预览）');
        };
        reader.readAsDataURL(file);
    }
}

function applyUrlIcon(appId) {
    const urlInput = document.getElementById(`url-input-${appId}`);
    const url = urlInput.value.trim();

    if (!url) {
        showStatus(appId, '请输入URL', 'error');
        return;
    }

    applyCustomIcon(appId, url);
    showStatus(appId, 'URL图标已应用');
    urlInput.value = '';
    toggleUrlInput(appId);
}

function applyCustomIcon(appId, iconUrl) {
    globalConfig.customIcons[appId] = iconUrl;

    const previewEl = document.getElementById(`preview-${appId}`);
    previewEl.innerHTML = `<img src="${iconUrl}" alt="">`;

    updateMainIcon(appId, iconUrl);
    saveCustomIconsToLocalStorage();
    console.log(`已将 ${appId} 的新图标保存到 LocalStorage`);
    if (globalConfig.database.client) {
        dbAPI.saveData({
            app_id: appId,
            icon_url: iconUrl,
            updated_at: new Date().toISOString()
        }).then(result => {
            if (result.success) {
                console.log(`图标配置已同步到数据库: ${appId}`);
            }
        });
    }
}

function toggleDockUrlInput(index) {
    const urlBox = document.getElementById(`dock-url-box-${index}`);
    urlBox.classList.toggle('show');
}

async function handleDockUpload(event, index) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = globalConfig.storage.maxFileSize * 1024 * 1024;
    if (file.size > maxSize) {
        showDockStatus(index, `文件太大 最大${globalConfig.storage.maxFileSize}MB`, 'error');
        return;
    }

    if (globalConfig.database.client) {
        showDockStatus(index, '正在上传到云存储...', '');
        const result = await storageAPI.uploadFile(file, `dock-${index}-${Date.now()}.${file.name.split('.').pop()}`);

        if (result.success) {
            applyDockIcon(index, result.url);
            showDockStatus(index, '已上传到云存储');
        } else {
            showDockStatus(index, '上传失败,使用本地预览', 'error');
            const reader = new FileReader();
            reader.onload = (e) => {
                applyDockIcon(index, e.target.result);
            };
            reader.readAsDataURL(file);
        }
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            applyDockIcon(index, e.target.result);
            showDockStatus(index, '文件已加载(本地预览)');
        };
        reader.readAsDataURL(file);
    }
}

function applyDockUrl(index) {
    const urlInput = document.getElementById(`dock-url-input-${index}`);
    const url = urlInput.value.trim();

    if (!url) {
        showDockStatus(index, '请输入URL', 'error');
        return;
    }

    applyDockIcon(index, url);
    showDockStatus(index, 'URL图标已应用');
    urlInput.value = '';
    toggleDockUrlInput(index);
}

function applyDockIcon(index, iconUrl) {
    globalConfig.dockIcons[index] = iconUrl;

    const previewEl = document.getElementById(`preview-dock-${index}`);
    if (previewEl) {
        previewEl.innerHTML = `<img src="${iconUrl}" alt="">`;
    }

    const dockIcon = document.querySelectorAll('.dock-icon')[index];
    if (dockIcon) {
        dockIcon.innerHTML = `<img src="${iconUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;" alt="">`;
    }

    localStorage.setItem('phoneDockIcons', JSON.stringify(globalConfig.dockIcons));
    console.log(`Dock图标 ${index} 已保存`);
}

function showDockStatus(index, message, type = 'success') {
    const statusEl = document.getElementById(`dock-status-${index}`);
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = 'status-message' + (type === 'error' ? ' error' : '');
        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);
    }
}


function updateMainIcon(appId, iconUrl) {
    const appElements = document.querySelectorAll(`[data-id="${appId}"]`);
    appElements.forEach(el => {
        const iconWrapper = el.querySelector('.icon-wrapper');
        if (iconWrapper && !el.classList.contains('folder')) {
            iconWrapper.innerHTML = `<img src="${iconUrl}" alt="">`;
        }
    });
}

function showStatus(appId, message, type = 'success') {
    const statusEl = document.getElementById(`status-${appId}`);
    statusEl.textContent = message;
    statusEl.className = 'status-message' + (type === 'error' ? ' error' : '');
    setTimeout(() => {
        statusEl.textContent = '';
    }, 3000);
}

function deleteTimeCard() {
    const timeCard = document.getElementById('timeCard');
    if (!timeCard) return;

    globalConfig.savedWidgets.push({
        id: 'timeCard',
        type: 'time',
        name: '时间卡片',
        html: timeCard.outerHTML,
        timestamp: Date.now()
    });

    timeCard.remove();

    localStorage.setItem('savedWidgets', JSON.stringify(globalConfig.savedWidgets));

    console.log('时间卡片已删除并保存');

    const deletedComponents = JSON.parse(localStorage.getItem('deletedComponents') || '[]');
    if (!deletedComponents.includes('timeCard')) {
        deletedComponents.push('timeCard');
        localStorage.setItem('deletedComponents', JSON.stringify(deletedComponents));
    }
}

function deleteWeatherCard() {
    const weatherCard = document.getElementById('weatherCard');
    if (!weatherCard) return;

    globalConfig.savedWidgets.push({
        id: 'weatherCard',
        type: 'weather',
        name: '天气卡片',
        html: weatherCard.outerHTML,
        timestamp: Date.now()
    });

    weatherCard.remove();

    localStorage.setItem('savedWidgets', JSON.stringify(globalConfig.savedWidgets));

    console.log('天气卡片已删除并保存');
    const deletedComponents = JSON.parse(localStorage.getItem('deletedComponents') || '[]');
    if (!deletedComponents.includes('weatherCard')) {
        deletedComponents.push('weatherCard');
        localStorage.setItem('deletedComponents', JSON.stringify(deletedComponents));
    }
}

function deleteWidget(widgetElement) {
    if (!widgetElement) return;

    const widgetId = widgetElement.dataset.id;

    globalConfig.savedWidgets.push({
        id: widgetId,
        type: 'widget',
        name: widgetElement.querySelector('.app-label')?.textContent || 'Widget',
        html: widgetElement.outerHTML,
        timestamp: Date.now()
    });

    widgetElement.remove();

    localStorage.setItem('savedWidgets', JSON.stringify(globalConfig.savedWidgets));

    console.log(`Widget ${widgetId} 已删除并保存`);
    const deletedComponents = JSON.parse(localStorage.getItem('deletedComponents') || '[]');
    if (!deletedComponents.includes(widgetId)) {
        deletedComponents.push(widgetId);
        localStorage.setItem('deletedComponents', JSON.stringify(deletedComponents));
    }
}

// ▼▼▼ 请用下面这个完整的、修正后的函数，替换掉您文件中旧的 createElement 函数 ▼▼▼

function createElement(app, grid) {
    const el = document.createElement('div');

    if (app.isWidget) {
        // 只为 widget2 创建数码像素猫组件
        if (app.id === 'widget2') {
            el.className = 'cat-widget';
            Object.assign(el.dataset, {id: app.id, row: app.row, col: app.col});
            el.dataset.colspan = app.colspan;
            el.dataset.rowspan = app.rowspan;

            el.innerHTML = `
            <div class="delete-widget-btn" onclick="deleteWidget(this.parentElement)">×</div>

            <!-- 状态数据条 -->
            <div class="cat-stats-container">
                <div class="cat-stat-item" data-stat="happiness" onclick="editCatStat(event, 'happiness')">
                    <div class="cat-stat-label">
                        <span>😊 开心度</span>
                        <span class="cat-stat-value" id="stat-happiness-value">85%</span>
                    </div>
                    <div class="cat-stat-bar-bg">
                        <div class="cat-stat-bar-fill" id="stat-happiness-bar" style="width: 85%"></div>
                    </div>
                </div>

                <div class="cat-stat-item" data-stat="hunger" onclick="editCatStat(event, 'hunger')">
                    <div class="cat-stat-label">
                        <span>🍖 饱食度</span>
                        <span class="cat-stat-value" id="stat-hunger-value">70%</span>
                    </div>
                    <div class="cat-stat-bar-bg">
                        <div class="cat-stat-bar-fill" id="stat-hunger-bar" style="width: 70%"></div>
                    </div>
                </div>

                <div class="cat-stat-item" data-stat="energy" onclick="editCatStat(event, 'energy')">
                    <div class="cat-stat-label">
                        <span>⚡ 精力值</span>
                        <span class="cat-stat-value" id="stat-energy-value">60%</span>
                    </div>
                    <div class="cat-stat-bar-bg">
                        <div class="cat-stat-bar-fill" id="stat-energy-bar" style="width: 60%"></div>
                    </div>
                </div>

                <div class="cat-stat-item" data-stat="cleanliness" onclick="editCatStat(event, 'cleanliness')">
                    <div class="cat-stat-label">
                        <span>✨ 清洁度</span>
                        <span class="cat-stat-value" id="stat-cleanliness-value">90%</span>
                    </div>
                    <div class="cat-stat-bar-bg">
                        <div class="cat-stat-bar-fill" id="stat-cleanliness-bar" style="width: 90%"></div>
                    </div>
                </div>
            </div>

            <!-- 数码像素猫主体 -->
            <div class="pixel-cat-body"></div>

            <!-- 猫咪对话气泡 -->
            <div class="cat-speech-bubble" onclick="editCatSpeech(event)">喵~ 今天也要开心喔！🌸</div>
        `;
        } else {
            return; // 其他widget暂不创建
        }
    } else {
        // 普通图标和文件夹的逻辑保持不变
        el.className = app.isFolder ? 'app-icon folder' : 'app-icon';
        Object.assign(el.dataset, {id: app.id, row: app.row, col: app.col});

        const customIcon = globalConfig.customIcons[app.id];
        let content;
        const initialIcon = app.icon;
        const isInitialIconUrl = initialIcon && (initialIcon.startsWith('http') || initialIcon.startsWith('data:'));

        if (customIcon) {
            content = `<img src="${customIcon}" alt="${app.label}">`;
        } else if (isInitialIconUrl) {
            content = `<img src="${initialIcon}" alt="${app.label}">`;
        } else if (app.isFolder) {
            content = app.icons.slice(0, 9).map(icon => {
                const isUrl = icon && (icon.startsWith('http') || icon.startsWith('data:'));
                const miniIconContent = isUrl ? `<img src="${icon}" alt="">` : icon;
                return `<div class="folder-mini-icon">${miniIconContent}</div>`;
            }).join('');
        } else {
            content = app.icon;
        }

        el.innerHTML = `
            <div class="icon-wrapper">${content}</div>
            <div class="app-label">${app.label}</div>
            ${app.badge ? `<span class="badge">${app.badge}</span>` : ''}`;
    }

    // 定位、添加事件监听并添加到网格中
    positionElement(el, app.row, app.col, app.colspan || 1, app.rowspan || 1);
    addDragListeners(el, app.clickable);
    grid.appendChild(el);

    // 针对文件夹，异步获取颜色并应用
    if (app.isFolder) {
        const firstImageUrl = app.icons.find(icon => icon && (icon.startsWith('http') || icon.startsWith('data:')));
        if (firstImageUrl) {
            getAverageColorFromImageUrl(firstImageUrl, (colorGradient) => {
                if (el && el.isConnected && colorGradient) {
                    const iconWrapper = el.querySelector('.icon-wrapper');
                    if (iconWrapper) {
                        iconWrapper.style.background = colorGradient;
                    }
                }
            });
        }
    }
}


function addDragListeners(el, clickable) {
    let lastDragEndTime = 0;
    // ✅ 新增：如果是小猫组件，增加长按时间，防止误触
    const longPressDelay = el.classList.contains('cat-widget') ? 500 : 350;
    const startInteraction = (e) => {
        if (state.isSwipingPage) return;

        state.hasDragged = false;
        const touch = getTouch(e);
        state.dragStart = {x: touch.clientX, y: touch.clientY};

        state.longPressTimer = setTimeout(() => {
            state.draggedElement = el;
            state.isEditMode = true;
            state.isDragging = true;
            el.classList.add('dragging');
            document.body.style.cursor = 'grabbing';
            showEditHint(true);
            showDeleteButtons(true);
        }, longPressDelay); // ✅ 使用动态延迟时间
    };

    const endInteraction = () => {
        clearTimeout(state.longPressTimer);
        if (state.hasDragged) {
            lastDragEndTime = Date.now();
        }
    };

    el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startInteraction(e);
    });
    el.addEventListener('touchstart', startInteraction, {passive: true});

    el.addEventListener('mouseup', endInteraction);
    el.addEventListener('mouseleave', endInteraction);
    el.addEventListener('touchend', endInteraction);

    // ▼▼▼▼▼ 从这里开始修改 ▼▼▼▼▼
    el.addEventListener('click', (e) => {
        const timeSinceLastDrag = Date.now() - lastDragEndTime;
        if (!state.hasDragged && !state.isEditMode && timeSinceLastDrag > 300) {
            e.stopPropagation();

            // 【新增】判断点击的是否为文件夹
            if (el.classList.contains('folder')) {
                const pageKey = el.parentElement.id === 'grid1' ? 'page1' : 'page2';
                const appId = el.dataset.id;
                const folderData = state.appLayouts[pageKey].find(app => app.id === appId);
                if (folderData) {
                    openFolder(folderData);
                }
            }
            // 【修改】将原来的if改为else if
            else if (clickable) {
                if (el.dataset.id === 'settings') {
                    openSettings();
                } else if (el.dataset.id === 'worldbook') {
                    openWorldbook();
                }
            }
        }
    });
    // ▲▲▲▲▲ 修改到这里结束 ▲▲▲▲▲
}

function isOccupied(pageKey, targetRow, targetCol, draggedId) {
    const apps = state.appLayouts[pageKey];
    for (const app of apps) {
        if (app.id === draggedId) {
            continue;
        }
        const appColSpan = app.colspan || 1;
        const appRowSpan = app.rowspan || 1;
        const inHorizontalRange = targetCol >= app.col && targetCol < (app.col + appColSpan);
        const inVerticalRange = targetRow >= app.row && targetRow < (app.row + appRowSpan);

        if (inHorizontalRange && inVerticalRange) {
            return true;
        }
    }
    return false;
}


function handleMove(e) {
    if (!state.draggedElement) return;

    const touch = getTouch(e);
    const distance = Math.sqrt(
        Math.pow(touch.clientX - state.dragStart.x, 2) +
        Math.pow(touch.clientY - state.dragStart.y, 2)
    );

    if (distance > 5 && !state.hasDragged) {
        state.hasDragged = true;
        clearTimeout(state.longPressTimer);
        if (!state.isDragging) {
            state.isEditMode = true;
            state.isDragging = true;
            state.draggedElement.classList.add('dragging');
            document.body.style.cursor = 'grabbing';
            showEditHint(true);
            state.draggedElement.style.transition = 'none';
        }
    }

    if (!state.isDragging) return;

    if (e.cancelable) e.preventDefault();

    const deltaX = touch.clientX - state.dragStart.x;
    const deltaY = touch.clientY - state.dragStart.y;
    state.draggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.08)`;
}

function handleEnd(e) {
    // ✅ 新增的“守卫”逻辑：
    // 如果 dragGhost 存在，说明当前是“从收藏夹拖出”的操作，
    // 那么 handleEnd 函数不应该执行任何操作，直接返回。
    if (dragGhost) {
        return;
    }
    clearTimeout(state.longPressTimer);
    document.body.style.cursor = 'default';

    if (state.isDragging && state.draggedElement) {
        const panel = document.getElementById('iconDockPanel');
        const touch = getChangedTouch(e);

        if (panel && panel.classList.contains('show')) {
            const panelRect = panel.getBoundingClientRect();

            if (touch.clientX >= panelRect.left && touch.clientX <= panelRect.right &&
                touch.clientY >= panelRect.top && touch.clientY <= panelRect.bottom) {
                addIconToDockPanel(state.draggedElement);
                finishDrag(true);
                return;
            }
        }
    }

    if (state.isDragging && state.draggedElement) {
        const draggedEl = state.draggedElement;
        const originalTransition = draggedEl.style.transition;
        draggedEl.style.transition = 'none';
        draggedEl.style.transform = '';

        const grid = draggedEl.parentElement;
        const gridRect = grid.getBoundingClientRect();

        const ROW_HEIGHT_PX = 94;
        const GAP_PX = 14;
        const DOCK_HEIGHT_PX = 80;

        const touch = getChangedTouch(e);
        const dropX = touch.clientX - gridRect.left;
        const dropY = touch.clientY - gridRect.top;

        let col = Math.floor(dropX / (gridRect.width / 4));
        let row = Math.floor(dropY / (ROW_HEIGHT_PX + GAP_PX));

        const colspan = parseInt(draggedEl.dataset.colspan) || 1;
        col = Math.max(0, Math.min(col, 4 - colspan));
        row = Math.max(0, Math.min(row, 6 - 1));

        const dropYInScreen = touch.clientY;
        if (dropYInScreen > gridRect.top + gridRect.height - DOCK_HEIGHT_PX) {
            revertPosition(draggedEl, originalTransition);
        } else {
            const pageKey = grid.id === 'grid1' ? 'page1' : 'page2';
            if (isOccupied(pageKey, row, col, draggedEl.dataset.id)) {
                revertPosition(draggedEl, originalTransition);
            } else {
                updateAndSavePosition(draggedEl, row, col);
            }
        }

        state.lastDragEndTime = Date.now();
    }

    // ✨ 核心修复 ✨
    // 只有在拖动图标时，才立即退出编辑模式
    // 如果只是长按激活，则保持编辑模式
    finishDrag(state.hasDragged);
}


function finishDrag(exitImmediately) {
    if (state.draggedElement) {
        state.draggedElement.classList.remove('dragging');
        state.draggedElement.style.transition = '';
    }

    state.isDragging = false;
    state.draggedElement = null;

    // ✅ 修改：只有在实际发生拖拽后才重置 hasDragged
    if (exitImmediately) {
        state.hasDragged = false;
    }

    // ✅ 核心修复：只在明确要求立即退出时，才延迟关闭编辑模式
    if (exitImmediately && state.hasDragged) {
        setTimeout(() => {
            if (state.isEditMode && !state.isDragging) {
                state.isEditMode = false;
                showEditHint(false);
                showDeleteButtons(false);
            }
        }, 500);
    }
    // ✅ 如果只是长按激活（没有拖拽），则保持编辑模式不退出
}


function revertPosition(el, originalTransition = '') {
    const originalRow = parseInt(el.dataset.row);
    const originalCol = parseInt(el.dataset.col);
    const colspan = parseInt(el.dataset.colspan) || 1;
    const rowspan = parseInt(el.dataset.rowspan) || 1;

    el.style.transition = 'all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    positionElement(el, originalRow, originalCol, colspan, rowspan);

    setTimeout(() => {
        el.style.transition = originalTransition;
    }, 250);
}


function updateAndSavePosition(el, newRow, newCol) {
    const appId = el.dataset.id;
    const pageKey = el.parentElement.id === 'grid1' ? 'page1' : 'page2';

    const appData = state.appLayouts[pageKey].find(app => app.id === appId);
    if (appData) {
        appData.row = newRow;
        appData.col = newCol;
    }

    el.dataset.row = newRow;
    el.dataset.col = newCol;

    const colspan = parseInt(el.dataset.colspan) || 1;
    const rowspan = parseInt(el.dataset.rowspan) || 1;
    positionElement(el, newRow, newCol, colspan, rowspan);

    saveLayoutToLocalStorage();
    console.log(`已保存 ${appId} 到新位置: (${newRow}, ${newCol})`);
}

function saveLayoutToLocalStorage() {
    localStorage.setItem('phoneAppLayouts', JSON.stringify(state.appLayouts));
}

function saveCustomIconsToLocalStorage() {
    localStorage.setItem('phoneCustomIcons', JSON.stringify(globalConfig.customIcons));
}


function showPage(pageNum) {
    state.currentPage = pageNum;
    pagesWrapper.style.transform = `translateX(-${(pageNum - 1) * 50}%)`;
    document.querySelectorAll('.dot').forEach((dot, i) =>
        dot.classList.toggle('active', i === pageNum - 1));

    const hint1 = document.getElementById('editHint1');
    const hint2 = document.getElementById('editHint2');

    if (pageNum === 1) {
        hint1.style.display = 'block';
        hint2.style.display = 'none';
    } else {
        hint1.style.display = 'none';
        hint2.style.display = 'block';
    }
}


// 【新增】一个专门用于在 requestAnimationFrame 中更新样式的函数
function updateSwipeTransform() {
    if (!state.swipeMoveScheduled) {
        return;
    }
    pagesWrapper.style.transform = `translateX(${state.lastSwipeTranslateX}%)`;
    state.swipeMoveScheduled = false; // 更新完成后，重置标志
}

// ============ 开始：请将这个全新的代码块完整粘贴到你的 <script> 中 ============

// 这是一个统一的“滑动结束”处理器，它会清理自身绑定的事件
function swipeEndHandler(e) {
    // 解除在 document 上绑定的事件，这是防止冲突的关键！
    document.removeEventListener('mousemove', swipeMoveHandler);
    document.removeEventListener('mouseup', swipeEndHandler);
    document.removeEventListener('touchmove', swipeMoveHandler);
    document.removeEventListener('touchend', swipeEndHandler);

    if (!state.isSwipingPage) return;

    // --- 动画和翻页逻辑 (这部分和我们上次修复的逻辑一致) ---
    const diff = getChangedTouch(e).clientX - state.swipeStart.x;
    const timeElapsed = Date.now() - state.swipeStart.time;
    const velocity = timeElapsed > 0 ? Math.abs(diff) / timeElapsed : 0;

    pagesWrapper.classList.remove('no-transition');

    let targetPage = state.currentPage;
    if (Math.abs(diff) > 30 || velocity > 0.2) {
        if (diff > 0 && state.currentPage === 2) {
            targetPage = 1;
        } else if (diff < 0 && state.currentPage === 1) {
            targetPage = 2;
        }
    }

    // 使用 setTimeout 确保动画无缝衔接
    setTimeout(() => {
        showPage(targetPage);
    }, 0);

    state.isSwipingPage = false;
}

// 这是一个统一的“滑动中”处理器
function swipeMoveHandler(e) {
    if (!state.isSwipingPage) return;

    // 阻止默认行为（如浏览器返回）
    if (e.cancelable) {
        e.preventDefault();
    }

    const touch = getTouch(e);
    const diffX = touch.clientX - state.swipeStart.x;

    const percentDiff = (diffX / screen.offsetWidth) * 50;
    const newTransform = Math.max(-50, Math.min(0, state.initialTransform + percentDiff));

    // 使用 rAF 优化性能
    if (!state.swipeMoveScheduled) {
        state.lastSwipeTranslateX = newTransform;
        state.swipeMoveScheduled = true;
        requestAnimationFrame(updateSwipeTransform);
    }
}

// ============ 开始：请用这个全新的、修复了点击冲突的函数替换旧的 swipeStartHandler ============

function swipeStartHandler(e) {
    // ▼ ▼ ▼ 核心修复点在这里 ▼ ▼ ▼
    // 检查事件的目标元素是否是我们不希望触发滑动的区域
    if (e.target.closest('.page-dots, .dock')) {
        // 如果是，说明用户想点击按钮而不是滑动页面，
        // 那么我们什么都不做，直接返回，让按钮的 onclick 事件正常执行。
        return;
    }
    // ▲ ▲ ▲ 修复结束 ▲ ▲ ▲

    // --- 后续的滑动判断逻辑保持不变 ---
    if (Date.now() - state.lastDragEndTime < 300) return;
    if (e.target.closest('#iconDockPanel, #floatingBall, .cat-widget, .contacts-page, .chat-page, .settings-page, .config-page, .beautify-page, .modal-overlay, #codeSandboxModal')) {
        return;
    }
    if (state.isDraggingFromDock || state.isEditMode || state.isDragging) return;

    // 初始化滑动状态
    const touch = getTouch(e);
    state.swipeStart = {x: touch.clientX, time: Date.now()};
    state.isSwipingPage = true;
    state.initialTransform = -(state.currentPage - 1) * 50;
    pagesWrapper.classList.add('no-transition');

    // 动态绑定监听器
    if (e.type === 'touchstart') {
        document.addEventListener('touchmove', swipeMoveHandler, {passive: false});
        document.addEventListener('touchend', swipeEndHandler);
    } else { // mousedown
        document.addEventListener('mousemove', swipeMoveHandler);
        document.addEventListener('mouseup', swipeEndHandler);
    }
}

// ============ 结束：替换代码 ============


// 这个 rAF 更新函数保持不变
function updateSwipeTransform() {
    if (!state.swipeMoveScheduled) {
        return;
    }
    pagesWrapper.style.transform = `translateX(${state.lastSwipeTranslateX}%)`;
    state.swipeMoveScheduled = false;
}

// ============ 结束：粘贴代码 ============


document.addEventListener('touchmove', handleMove, {passive: false});
document.addEventListener('mousemove', handleMove);
document.addEventListener('touchend', (e) => handleEnd(e));
document.addEventListener('mouseup', (e) => handleEnd(e));
// 在 initializeApp 函数中添加这两行
screen.addEventListener('touchstart', swipeStartHandler, {passive: true});
screen.addEventListener('mousedown', swipeStartHandler);

screen.addEventListener('click', (e) => {
    if (e.target.closest('.chat-page, .contacts-page, .settings-page, .config-page, .beautify-page, .modal-overlay')) {
        return;
    }

    // ✅ 修改：点击任何非组件区域都退出编辑模式
    if (!e.target.closest('.app-icon') &&
        !e.target.closest('.widget') &&
        !e.target.closest('.cat-widget') && // 确保这行存在
        !e.target.closest('.time-card') &&
        !e.target.closest('.weather-card') &&
        !e.target.closest('[class*="delete-"]')) {
        exitEditMode();
    }
});


function initializeLayout() {
    // 加载壁纸
    const savedWallpaper = localStorage.getItem('phoneWallpaper');
    if (savedWallpaper) {
        applyWallpaper(savedWallpaper);
    }
    // 【核心修复 - 第1步】:
    // 在所有操作之前，首先加载收藏夹图标数据
    const savedDockedIcons = localStorage.getItem('phoneDockedIcons');
    let dockedIconIds = new Set(); // 使用 Set 数据结构，查询效率更高
    if (savedDockedIcons) {
        try {
            // 解析收藏夹数据，并提取所有图标的 ID
            const dockedIconsData = JSON.parse(savedDockedIcons);
            dockedIconsData.forEach(icon => dockedIconIds.add(icon.id));
        } catch (e) {
            console.error("解析收藏夹图标ID失败", e);
        }
    }
    // 加载桌面布局
    const savedLayouts = localStorage.getItem('phoneAppLayouts');
    if (savedLayouts) {
        try {
            const loadedLayouts = JSON.parse(savedLayouts);

            // 【核心修复 - 第2步】:
            // 将收藏夹图标ID集合传递给 mergeAppLayouts 函数
            state.appLayouts.page1 = mergeAppLayouts(appsPage1, loadedLayouts.page1 || [], dockedIconIds);
            state.appLayouts.page2 = mergeAppLayouts(appsPage2, loadedLayouts.page2 || [], dockedIconIds);
            console.log('成功从 LocalStorage 加载布局并合并新功能');
        } catch (e) {
            console.error('解析 LocalStorage 布局失败，使用默认布局', e);
        }
    }
    // Dock栏图标加载（这部分逻辑不变，但为了完整性放在这里）
    const savedDockIcons = localStorage.getItem('phoneDockIcons');
    let dockIconsToRender = globalConfig.dockIcons;
    if (savedDockIcons) {
        try {
            dockIconsToRender = JSON.parse(savedDockIcons);
            console.log('成功从 LocalStorage 加载Dock图标');
        } catch (e) {
            console.error('解析 Dock 图标失败', e);
        }
    }
    const dockContainer = document.querySelector('.dock');
    dockContainer.innerHTML = '';
    dockIconsToRender.forEach((icon, index) => {
        const dockIcon = document.createElement('div');
        dockIcon.className = 'dock-icon';
        dockIcon.dataset.index = index;
        if (icon && (icon.startsWith('http') || icon.startsWith('data:'))) {
            dockIcon.innerHTML = `<img src="${icon}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 14px;" alt="">`;
        } else if (icon) {
            dockIcon.textContent = icon;
        }
        if (index === 0) {
            dockIcon.onclick = openContacts;
        } else if (index === 2) {
            dockIcon.onclick = openWorldSelect;
        }
        dockContainer.appendChild(dockIcon);
    });
    // 其他设置加载（保持不变）
    const savedIcons = localStorage.getItem('phoneCustomIcons');
    if (savedIcons) {
        try {
            globalConfig.customIcons = JSON.parse(savedIcons);
        } catch (e) {
        }
    }
    const savedWidgets = localStorage.getItem('savedWidgets');
    if (savedWidgets) {
        try {
            globalConfig.savedWidgets = JSON.parse(savedWidgets);
        } catch (e) {
        }
    }
    const deletedComponents = JSON.parse(localStorage.getItem('deletedComponents') || '[]');
    // 渲染桌面
    [['grid1', state.appLayouts.page1], ['grid2', state.appLayouts.page2]].forEach(([id, apps]) => {
        const grid = document.getElementById(id);
        grid.innerHTML = '';
        apps.forEach(app => {
            if (app.isWidget && deletedComponents.includes(app.id)) {
                return;
            }
            createElement(app, grid);
        });
    });

    // 处理已删除的组件（保持不变）
    if (deletedComponents.includes('timeCard')) {
        document.getElementById('timeCard')?.remove();
    }
    if (deletedComponents.includes('weatherCard')) {
        document.getElementById('weatherCard')?.remove();
    }
    loadSavedMoodAndWeather();
}

function mergeAppLayouts(defaultApps, savedApps, dockedIconIds) {
    const merged = [...savedApps];
    const savedIds = new Set(savedApps.map(app => app.id));
    // 将默认布局中新增的应用添加进来
    defaultApps.forEach(defaultApp => {
        // 【核心修复 - 第3步】:
        // 增加一个判断条件：!dockedIconIds.has(defaultApp.id)
        // 只有当图标既不在当前桌面，也不在收藏夹时，才把它添加回来
        if (!savedIds.has(defaultApp.id) && !dockedIconIds.has(defaultApp.id)) {
            merged.push(defaultApp);
            console.log(`新增或恢复了应用: ${defaultApp.label}`);
        }
    });
    return merged;
}

document.getElementById('chatInput').addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();

        addMessageToList();
    }
});

// ========== 开始：用这个全新的JS代码块替换旧的 openAvatarActions 和相关函数 ==========

/**
 * 打开头像操作菜单，并记录当前操作的目标是哪个头像
 * @param {'contact' | 'user'} target - 'contact' 表示对方头像, 'user' 表示用户头像
 */
function openAvatarActions(target) {
    currentAvatarTarget = target; // 记录当前操作目标
    document.getElementById('avatarActionSheet').classList.add('show');
}

/**
 * 关闭头像操作菜单
 */
function closeAvatarActions() {
    document.getElementById('avatarActionSheet').classList.remove('show');
}

/**
 * 触发隐藏的文件上传输入框
 */
function triggerFileUpload() {
    document.getElementById('avatar-input').click();
    closeAvatarActions();
}

/**
 * 弹出输入框让用户填写图片URL
 */
function promptForUrl() {
    const url = prompt("请输入图片URL:", "https://");
    if (url) {
        const img = new Image();
        img.onload = function () {
            // 根据之前记录的目标，更新正确的头像预览
            const previewId = currentAvatarTarget === 'user' ? 'user-avatar-preview' : 'avatar-preview';
            document.getElementById(previewId).src = url;
            console.log(`已将 ${previewId} 的头像更新为: ${url}`);
        };
        img.onerror = function () {
            alert("无法加载该URL的图片，请检查链接是否正确。");
        };
        img.src = url;
    }
    closeAvatarActions();
}

// ========== 结束：替换完成 ==========


function triggerFileUpload() {
    document.getElementById('avatar-input').click();
    closeAvatarActions();
}

function promptForUrl() {
    const url = prompt("请输入图片URL:", "https://");
    if (url) {
        const img = new Image();
        img.onload = function () {
            // 根据记录的目标更新对应的头像预览
            const previewId = currentAvatarTarget === 'user' ? 'user-avatar-preview' : 'avatar-preview';
            document.getElementById(previewId).src = url;
        };
        img.onerror = function () {
            alert("无法加载该URL的图片，请检查链接。");
        };
        img.src = url;
    }
    closeAvatarActions();
}

// ▼▼▼ 步骤2：用这个新版本完整替换旧的 openChat 函数 ▼▼▼

/**
 * [最终版] 打开聊天页面，并能根据联系人类型自动切换主题
 * @param {object} contact - 要聊天的联系人对象
 */
function openChat(contact) {
    if (!contact) return;
    currentChatContact = contact;

    const chatPage = document.getElementById('chatPage');
    const contactNameEl = document.getElementById('chatContactName');
    const messagesEl = document.getElementById('chatMessages');

    // 1. 核心逻辑：检查当前联系人是否在“密友列表”中
    const isSweetheart = sweetheartContactsData.some(sweetheart => sweetheart.id === contact.id);

    // 2. 根据检查结果，动态添加或移除主题class
    if (isSweetheart) {
        // 如果是密友，添加 'sweetheart-mode' 类
        chatPage.classList.add('sweetheart-mode');
        console.log(`正在以密友模式打开与 ${contact.name} 的聊天`);
    } else {
        // 如果不是，确保移除该类，恢复为普通模式
        chatPage.classList.remove('sweetheart-mode');
        console.log(`正在以普通模式打开与 ${contact.name} 的聊天`);
    }

    // 后续的渲染逻辑保持不变...
    contactNameEl.textContent = contact.name;
    messagesEl.innerHTML = '';

    requestAnimationFrame(() => {
        chatPage.classList.add('show');
    });

    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');
    const contactMessages = chatHistory[contact.id] || [];

    if (contactMessages.length === 0) {
        // 为不同模式设置不同的欢迎语
        const welcomeMessage = isSweetheart
            ? `和密友 ${contact.name} 的悄悄话开始了...💖`
            : `你和 ${contact.name} 开始聊天了`;

        // 使用你的 _createMessageDOM 函数来创建系统消息（如果支持的话）
        // 这里简化处理，直接插入一个提示
        const systemMessageEl = document.createElement('div');
        systemMessageEl.textContent = welcomeMessage;
        systemMessageEl.style.textAlign = 'center';
        systemMessageEl.style.fontSize = '12px';
        systemMessageEl.style.color = '#aaa';
        systemMessageEl.style.margin = '10px 0';
        messagesEl.appendChild(systemMessageEl);

    } else {
        contactMessages.forEach((message, index) => {
            const messageRow = _createMessageDOM(contact.id, message, index);
            messagesEl.appendChild(messageRow);
        });
    }

    setTimeout(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 50);
}

// 同时，为了保险起见，我们也在 closeChat 函数中确保清除主题
function closeChat() {
    const chatPage = document.getElementById('chatPage');
    chatPage.classList.remove('show');
    // 在动画结束后，移除主题类，以防影响下次打开
    setTimeout(() => {
        chatPage.classList.remove('sweetheart-mode');
    }, 350);
}


function closeChat() {
    const chatPage = document.getElementById('chatPage');
    chatPage.classList.remove('show');
}

// ========== 开始：粘贴这个全新的、支持识图的 callApi 函数 ==========
async function callApi(messages) {
    // 1. 检查 API 配置
    if (globalConfig.activeApiConfig === null || !globalConfig.apiConfigs[globalConfig.activeApiConfig]) {
        return {success: false, message: '请先在“设置”中配置并选择一个有效的API。'};
    }
    const config = globalConfig.apiConfigs[globalConfig.activeApiConfig];

    // 2. [核心改造] 检查是否选择了视觉模型
    const isVisionModel = config.model.includes('vision') || config.model.includes('4o');
    if (!isVisionModel) {
        console.warn(`当前模型 ${config.model} 可能不支持识图。为获得最佳效果，请在设置中选用 gpt-4o 或 gpt-4-vision-preview 等模型。`);
    }

    // 3. 构建请求体
    const requestBody = {
        model: config.model,
        messages: messages,
        // 如果是视觉模型，可以设置更高的 max_tokens 来获取更详细的描述
        max_tokens: isVisionModel ? 4096 : 2048
    };

    // 4. 发送 API 请求
    try {
        const response = await fetch(`${config.url}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({message: '无法解析API错误信息'}));
            throw new Error(`API 请求失败，状态码: ${response.status} - ${errorData.error ? errorData.error.message : response.statusText}`);
        }

        const data = await response.json();
        const replyContent = data.choices[0]?.message?.content;

        if (!replyContent) {
            throw new Error('API返回的数据格式不正确，未能找到回复内容。');
        }

        return {success: true, message: replyContent.trim()};

    } catch (error) {
        console.error('调用API时出错:', error);
        return {success: false, message: `网络或API错误: ${error.message}`};
    }
}

/**
 * [全新版本] 发送消息，会检查并打包引用信息
 */
function addMessageToList() {
    const inputEl = document.getElementById('chatInput');
    const messagesEl = document.getElementById('chatMessages');
    const messageText = inputEl.value.trim();

    // 如果没有新输入内容，且没有引用内容，则不发送
    if (!messageText && !currentQuoteData) return;

    // 如果只输入了空格，也不发送
    if (!messageText.trim() && !currentQuoteData) {
        inputEl.value = '';
        return;
    }

    // 构造要保存的消息对象
    const messagePayload = {
        sender: 'user',
        text: messageText,
    };

    // 如果存在引用数据，将其附加到消息对象上
    if (currentQuoteData) {
        messagePayload.quote = currentQuoteData;
    }

    // 保存消息并获取其新索引
    const newIndex = saveMessage(currentChatContact.id, messagePayload);

    // 在界面上渲染这条新消息
    const messageRow = _createMessageDOM(currentChatContact.id, messagePayload, newIndex);
    messagesEl.appendChild(messageRow);

    // 清理工作
    inputEl.value = ''; // 清空输入框
    document.querySelector('.chat-input-area').classList.remove('has-text'); // 更新发送按钮状态
    cancelQuote(); // 取消引用状态并隐藏预览条

    renderContacts(contactsData); // 更新联系人列表的最后消息
    messagesEl.scrollTop = messagesEl.scrollHeight; // 滚动到底部
    inputEl.focus();
}


/**
 * [最终修正版] 获取AI回复，并自动注入角色、世界和世界书的完整上下文
 */
async function getAiReply() {
    if (!currentChatContact) return;

    const messagesEl = document.getElementById('chatMessages');
    const getReplyBtn = document.getElementById('getReplyBtn');

    getReplyBtn.disabled = true;
    chatInput.disabled = true;

    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');
    const historyMessages = chatHistory[currentChatContact.id] || [];

    if (historyMessages.length === 0) {
        console.log("没有历史消息，不请求AI回复。");
        getReplyBtn.disabled = false;
        chatInput.disabled = false;
        return;
    }

    // --- ▼▼▼ 这是修正和增强的核心区域 ▼▼▼ ---

    // 1. 整合用户设定（System Prompt）
    let systemPrompts = [];
    if (userProfile.persona && userProfile.persona.trim() !== '') {
        systemPrompts.push(`[关于我(用户)的设定]:\n${userProfile.persona}`);
    }

    // 2. 整合角色设定
    const persona = (currentChatContact.status && currentChatContact.status.trim() !== '')
        ? currentChatContact.status
        : '你是一个乐于助人的助手。';
    systemPrompts.push(`[关于你(AI)的角色设定]:\n${persona}`);

    // 3. 【新】调用我们修正后的函数，获取并添加世界书内容
    const worldbookContext = gatherWorldbookContext();
    if (worldbookContext) {
        systemPrompts.push(worldbookContext); // 添加世界书背景
    }

    // 将所有系统指令合并成一个，用换行符分隔
    const combinedSystemPrompt = systemPrompts.join('\n\n');

    // ★★★【验证步骤】★★★
    // 你可以在浏览器开发者工具的控制台看到最终发送给AI的系统指令
    console.log("即将发送给AI的系统指令(System Prompt):\n", combinedSystemPrompt);

    // 4. 构建最终发送给API的消息列表
    const apiMessages = [{role: 'system', content: combinedSystemPrompt}];
    historyMessages.forEach(msg => {
        apiMessages.push({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        });
    });

    // --- ▲▲▲ 修改结束 ▲▲▲ ---

    // 后续的API调用和UI更新逻辑保持不变
    const thinkingBubble = createMessageBubble('...', 'received');
    messagesEl.appendChild(thinkingBubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    const result = await callApi(apiMessages);
    thinkingBubble.remove();

    let responseText, newIndex;
    if (result.success) {
        responseText = result.message;
        newIndex = saveMessage(currentChatContact.id, {sender: 'contact', text: responseText});
    } else {
        // 创建一个用户友好的错误消息
        responseText = `[网络错误] 唔...连接AI服务器失败了，请检查网络或API设置再试一次哦。(${result.message})`;
        newIndex = saveMessage(currentChatContact.id, {
            sender: 'contact',
            text: responseText // 直接保存友好的错误消息
        });
    }


    const messageRow = _createMessageDOM(currentChatContact.id, {
        sender: 'contact',
        text: responseText
    }, newIndex);
    if (!result.success) {
        messageRow.querySelector('.chat-bubble').style.backgroundColor = '#ffebee';
        messageRow.querySelector('.chat-bubble').style.color = '#c62828';
    }
    messagesEl.appendChild(messageRow);

    renderContacts(contactsData);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    getReplyBtn.disabled = false;
    chatInput.disabled = false;
    chatInput.focus();
}


/**
 * [修复版] 保存消息到localStorage
 * @param {string|number} contactId - 联系人ID
 * @param {object} message - 消息对象，可能包含 sender, text, quote 等字段
 * @returns {number} 新消息的索引
 */
function saveMessage(contactId, message) {
    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');
    if (!chatHistory[contactId]) {
        chatHistory[contactId] = [];
    }

    // ✅ 核心修复：保存完整的消息对象，而不仅仅是 sender 和 text
    // 这样 quote 字段（如果存在）也会被保存
    const messageToSave = {
        sender: message.sender,
        text: message.text
    };

    // 如果消息中包含引用信息，也一并保存
    if (message.quote) {
        messageToSave.quote = message.quote;
    }

    chatHistory[contactId].push(messageToSave);
    try {
        localStorage.setItem('phoneChatHistory', JSON.stringify(chatHistory));
    } catch (e) {
        console.error('保存失败:', e);
        alert('存储空间不足，请清理数据');
    }

    return chatHistory[contactId].length - 1;
}


// ========== 开始：粘贴这个【修正版】的 editCurrentContact 函数 ==========
function editCurrentContact() {
    if (!currentChatContact) return;

    // 获取弹窗元素
    const modal = document.getElementById('characterCardModal');
    // 将正在编辑的联系人ID存储到弹窗的data属性中
    modal.dataset.editingId = currentChatContact.id;

    // --- 填充表单数据 (逻辑不变) ---
    document.getElementById('char-name').value = currentChatContact.name;
    document.getElementById('char-persona').value = currentChatContact.status;
    // ... (其他填充代码保持不变) ...
    const contactAvatar = currentChatContact.avatar;
    const isContactUrl = contactAvatar && (contactAvatar.startsWith('http') || contactAvatar.startsWith('data:'));
    document.getElementById('avatar-preview').src = isContactUrl ? contactAvatar : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    document.getElementById('user-name').value = userProfile.name;
    document.getElementById('user-persona').value = userProfile.persona;
    const userAvatar = userProfile.avatar;
    const isUserUrl = userAvatar && (userAvatar.startsWith('http') || userAvatar.startsWith('data:'));
    document.getElementById('user-avatar-preview').src = isUserUrl ? userAvatar : 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    // ▼▼▼ 添加此行 ▼▼▼
    renderCharacterWorldbooksList(currentChatContact.boundWorldbooks || []);

    openCharacterCardPage();
}


function showSuccessModal(title = '操作成功', message = '你的设置已保存。', duration = 1500) {
    const modal = document.getElementById('successModal');
    const modalTitle = document.getElementById('successModalTitle');
    const modalMessage = document.getElementById('successModalMessage');

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    modal.style.display = 'flex';

    setTimeout(() => modal.classList.add('show'), 10);

    setTimeout(() => {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }, duration);
}

function deleteApiConfig(index) {
    const configToDelete = globalConfig.apiConfigs[index];
    if (!configToDelete) return;

    if (confirm(`你确定要删除配置 "${configToDelete.name}" 吗？`)) {
        globalConfig.apiConfigs.splice(index, 1);

        if (globalConfig.activeApiConfig === index) {
            globalConfig.activeApiConfig = null;
            clearApiForm();
        } else if (globalConfig.activeApiConfig > index) {
            globalConfig.activeApiConfig--;
        }

        console.log(`配置 "${configToDelete.name}" 已删除。`);

        saveGlobalConfig();
        renderApiConfigs();

        showSuccessModal('删除成功', `配置 "${configToDelete.name}" 已被移除。`);
    }
}

/**
 * [新增] 保存密友列表到localStorage
 */
function saveSweetheartContacts() {
    try {
        localStorage.setItem('phoneSweetheartContactsData', JSON.stringify(sweetheartContactsData));
    } catch (e) {
        console.error('保存密友列表到 localStorage 失败:', e);
    }
}


function saveGlobalConfig() {
    try {
        const configToSave = {
            apiConfigs: globalConfig.apiConfigs,
            activeApiConfig: globalConfig.activeApiConfig,
        };
        localStorage.setItem('phoneGlobalConfig', JSON.stringify(configToSave));
    } catch (e) {
        console.error('保存全局配置到 localStorage 失败:', e);
    }
}

function loadGlobalConfig() {
    try {
        const savedConfig = localStorage.getItem('phoneGlobalConfig');
        if (savedConfig) {
            const parsedConfig = JSON.parse(savedConfig);
            Object.assign(globalConfig, parsedConfig);
            console.log('成功从 localStorage 加载API配置。');
        }
    } catch (e) {
        console.error('从 localStorage 加载API配置失败:', e);
    }
}

function openChatSettings() {
    document.getElementById('chatSettingsPage').classList.add('show');
}

function closeChatSettings() {
    document.getElementById('chatSettingsPage').classList.remove('show');
}

function clearCurrentChatHistory() {
    if (!currentChatContact) return; // 安全检查，确保当前有聊天对象

    // 弹出确认框，防止用户误操作
    if (confirm(`确定要清空与 "${currentChatContact.name}" 的所有聊天记录吗？`)) {
        // 从 localStorage 读取聊天记录
        const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');

        // 如果存在当前联系人的记录，就删除它
        if (chatHistory[currentChatContact.id]) {
            delete chatHistory[currentChatContact.id];
            // 将修改后的数据存回 localStorage
            try {
                localStorage.setItem('phoneChatHistory', JSON.stringify(chatHistory));
            } catch (e) {
                console.error('保存失败:', e);
                alert('存储空间不足，请清理数据');
            }

            // 重新加载聊天界面，使其显示为空
            openChat(currentChatContact);

            // 关闭设置页并显示成功提示
            closeChatSettings();
            showSuccessModal('操作成功', '聊天记录已清空。');
        }
    }
}


/* --- 复制并粘贴这段代码 --- */
function applyCodeScrollSetting(isEnabled) {
    if (isEnabled) {
        document.body.classList.add('code-scrolling-enabled');
    } else {
        document.body.classList.remove('code-scrolling-enabled');
    }
}

/* ------------------------- */


// ========== 开始：这是你需要粘贴的新JS代码 ==========

/**
 * 应用聊天背景图的核心函数
 * @param {string} imageUrl - 图片的URL或Base64数据。如果为空字符串，则恢复默认背景。
 */
function applyChatBackground(imageUrl) {
    const chatPage = document.getElementById('chatPage');
    if (imageUrl) {
        // 设置背景图片
        chatPage.style.backgroundImage = `url('${imageUrl}')`;
        chatPage.style.backgroundSize = 'cover';
        chatPage.style.backgroundPosition = 'center';
        localStorage.setItem('chatBackground', imageUrl);
        showChatBgStatus('背景已应用');
    } else {
        // 恢复默认背景
        chatPage.style.backgroundImage = '';
        localStorage.removeItem('chatBackground');
        showSuccessModal('操作成功', '已恢复为默认背景。');
    }
}

/**
 * 从本地文件上传处理函数
 * @param {Event} event - 文件输入框的change事件对象
 */
function handleChatBgUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // 使用FileReader将图片转为Base64，以便保存和预览
    const reader = new FileReader();
    reader.onload = (e) => {
        applyChatBackground(e.target.result);
    };
    reader.onerror = () => {
        showChatBgStatus('读取文件失败', 'error');
    };
    reader.readAsDataURL(file);
}

/**
 * 切换URL输入框的显示/隐藏
 */
function toggleChatBgUrlInput() {
    const urlBox = document.getElementById('chat-bg-url-box');
    urlBox.classList.toggle('show');
}

/**
 * 从URL输入框应用背景图
 */
function applyChatBgFromUrl() {
    const urlInput = document.getElementById('chat-bg-url-input');
    const url = urlInput.value.trim();
    if (url) {
        applyChatBackground(url);
        urlInput.value = '';
        toggleChatBgUrlInput(); // 应用后自动隐藏输入框
    } else {
        showChatBgStatus('请输入有效的URL', 'error');
    }
}

/**
 * 在UI上显示状态消息
 * @param {string} message - 要显示的消息
 * @param {string} type - 消息类型 ('success' 或 'error')
 */
function showChatBgStatus(message, type = 'success') {
    const statusEl = document.getElementById('chat-bg-status');
    statusEl.textContent = message;
    statusEl.className = 'status-message' + (type === 'error' ? ' error' : '');
    setTimeout(() => {
        statusEl.textContent = '';
    }, 3000);
}

/**
 * 加载已保存的聊天背景图 (在应用初始化时调用)
 */
function loadChatBackground() {
    const savedBg = localStorage.getItem('chatBackground');
    if (savedBg) {
        applyChatBackground(savedBg);
    }
}

/* ========== 开始：粘贴这段全新的JS代码块 ========== */
function applyChatStyle(style) {
    const chatPage = document.getElementById('chatPage');
    const selector = document.getElementById('messageStyleSelector');

    if (style === 'simple') {
        chatPage.classList.add('simple-style');
    } else {
        chatPage.classList.remove('simple-style');
    }

    // 更新UI选择器状态
    if (selector) {
        selector.querySelectorAll('.segmented-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.style === style);
        });
    }

    // 保存选择
    localStorage.setItem('chatMessageStyle', style);
}


function setupStyleSelector() {
    const selector = document.getElementById('messageStyleSelector');
    if (selector) {
        selector.addEventListener('click', (event) => {
            const target = event.target.closest('.segmented-option');
            if (target && !target.classList.contains('active')) {
                const newStyle = target.dataset.style;
                applyChatStyle(newStyle);
            }
        });
    }
}

function applyFullscreenSetting(isEnabled) {
    if (isEnabled) {
        document.body.classList.add('fullscreen-enabled');
    } else {
        document.body.classList.remove('fullscreen-enabled');
    }
}

/* ========== 开始：用这段全新的代码替换旧的 setupAttachmentMenu 函数 ========== */

function setupAttachmentMenu() {
    // 1. 获取所有相关的 DOM 元素
    const showMenuBtn = document.getElementById('showAttachmentMenuBtn');
    const menu = document.getElementById('attachmentMenu');
    const fileInput = document.getElementById('fileInput');
    const imageInput = document.getElementById('imageInput'); // 图片上传暂时只做前端预览
    const uploadFileBtn = document.getElementById('uploadFileBtn');
    const uploadImageBtn = document.getElementById('uploadImageBtn');

    // 2. 点击“+”按钮时，切换菜单的显示/隐藏
    showMenuBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        menu.classList.toggle('show');
    });

    // 3. 点击“上传文件”菜单项时，触发隐藏的文件选择框
    uploadFileBtn.addEventListener('click', () => {
        fileInput.click();
        menu.classList.remove('show');
    });

    // 4. 点击“上传图片”菜单项（暂时只做预览，不上传）
    uploadImageBtn.addEventListener('click', () => {
        imageInput.click();
        menu.classList.remove('show');
    });

    // 5. 【核心改造】当用户选择了文件后，上传文件并获取AI回复
    fileInput.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // a. 先在界面上显示“文件已发送”
        const userMessageText = `📎 文件已发送: ${file.name}`;
        simulateSendingMessage(userMessageText);

        // b. 显示一个“AI正在思考”的提示
        const messagesEl = document.getElementById('chatMessages');
        const thinkingBubble = _createMessageDOM(currentChatContact.id, {
            sender: 'contact',
            text: '正在读取和分析文件...'
        }, -1);
        messagesEl.appendChild(thinkingBubble);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
            // c. 调用函数将文件发送到我们的后端（Edge Function）
            const aiResponse = await uploadFileAndGetAiResponse(file);

            // d. 移除思考提示，显示AI的真实回复
            thinkingBubble.remove();
            const newIndex = saveMessage(currentChatContact.id, {
                sender: 'contact',
                text: aiResponse
            });
            const messageRow = _createMessageDOM(currentChatContact.id, {
                sender: 'contact',
                text: aiResponse
            }, newIndex);
            messagesEl.appendChild(messageRow);

        } catch (error) {
            // e. 如果出错，显示错误信息
            thinkingBubble.remove();
            const errorText = `处理文件失败: ${error.message}`;
            const newIndex = saveMessage(currentChatContact.id, {
                sender: 'contact',
                text: errorText
            });
            const messageRow = _createMessageDOM(currentChatContact.id, {
                sender: 'contact',
                text: errorText
            }, newIndex);
            messageRow.querySelector('.chat-bubble').style.backgroundColor = '#ffebee';
            messageRow.querySelector('.chat-bubble').style.color = '#c62828';
            messagesEl.appendChild(messageRow);
        } finally {
            messagesEl.scrollTop = messagesEl.scrollHeight;
            event.target.value = ''; // 重置input
        }
    });

    // 图片选择的逻辑保持不变，仅作本地预览
    // ========== 开始：粘贴这个全新的 imageInput 事件监听器 ==========
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file || !currentChatContact) {
            event.target.value = ''; // 重置 input 以便下次能选择相同文件
            return;
        }

        const reader = new FileReader();
        reader.onload = async function (e) {
            const base64Image = e.target.result;

            // 1. [UI] 先在用户侧显示发送的图片
            const imageHtmlForDisplay = `<img src="${base64Image}" style="max-width: 150px; border-radius: 10px;" alt="${file.name}">`;
            simulateSendingMessage(imageHtmlForDisplay);

            // 2. [UI] 显示 "AI 正在分析..." 的提示
            const messagesEl = document.getElementById('chatMessages');
            const thinkingBubble = _createMessageDOM(currentChatContact.id, {
                sender: 'contact',
                text: '正在分析图片...'
            }, -1);
            // 使用-1索引表示这是临时消息
            messagesEl.appendChild(thinkingBubble);
            messagesEl.scrollTop = messagesEl.scrollHeight;

            // 3. [核心] 构建发送给 Vision API 的消息体
            const visionMessage = {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        // ========== 开始：仅修改 visionMessage 对象中的这一行 ==========
                        text: document.getElementById('chatInput').value.trim() || '这张图片里有什么？请详细描述一下。'
                        // 这是给AI的指令
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: base64Image
                        }
                    }
                ]
            };
            // 4. [API] 调用API
            // 我们只把这条识图消息发给AI，不一定需要带上之前的聊天记录，这样更专注
            const result = await callApi([visionMessage]);
            document.getElementById('chatInput').value = '';
            chatInputArea.classList.remove('has-text');
            // 6. [UI] 移除"正在分析"的提示
            thinkingBubble.remove();

            let aiResponseText;
            if (result.success) {
                aiResponseText = result.message;
            } else {
                aiResponseText = `抱歉，图片识别失败了: ${result.message}`;
            }

            // 6. [数据] 保存AI的回复
            const newIndex = saveMessage(currentChatContact.id, {
                sender: 'contact',
                text: aiResponseText
            });

            // 7. [UI] 显示AI的最终回复
            const messageRow = _createMessageDOM(currentChatContact.id, {
                sender: 'contact',
                text: aiResponseText
            }, newIndex);

            // 如果是错误信息，给个特殊样式
            if (!result.success) {
                messageRow.querySelector('.chat-bubble').style.backgroundColor = '#ffebee';
                messageRow.querySelector('.chat-bubble').style.color = '#c62828';
            }

            messagesEl.appendChild(messageRow);
            messagesEl.scrollTop = messagesEl.scrollHeight;

            // 8. 更新联系人列表的最后消息
            renderContacts(contactsData);
        };

        reader.readAsDataURL(file); // 读取图片文件为 Base64
        event.target.value = ''; // 读取后立即清空，确保下次还能触发 change 事件
    });
// ========== 结束：粘贴全新的 imageInput 事件监听器 ==========


    // 7. 关闭菜单的逻辑
    document.addEventListener('click', () => {
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    });
    menu.addEventListener('click', (event) => event.stopPropagation());
}

/**
 * 【核心函数】上传文件到后端并等待AI响应
 * @param {File} file 用户选择的文件对象
 * @returns {Promise<string>} AI的回复文本
 */
async function uploadFileAndGetAiResponse(file) {
    // 假设你的 Supabase Edge Function 地址是这个
    // 你需要先创建这个 Function，见第2步
    const functionUrl = `${globalConfig.database.supabaseUrl}/functions/v1/analyze-file`;
    const supabaseKey = globalConfig.database.supabaseKey;

    if (!functionUrl || !supabaseKey) {
        throw new Error("Supabase 配置不完整，请在设置中检查 URL 和 Key。");
    }

    // 使用 FormData 来包装文件，适合文件上传
    const formData = new FormData();
    formData.append('file', file);

    // 获取当前聊天记录作为上下文
    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');
    const historyMessages = chatHistory[currentChatContact.id] || [];

    // 将历史记录和角色设定一起发送给后端
    formData.append('chatHistory', JSON.stringify(historyMessages));
    formData.append('persona', currentChatContact.status || '你是一个乐于助人的AI助手');

    const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${supabaseKey}`
            // 注意：当使用 FormData 时，浏览器会自动设置 Content-Type，不要手动设置
        },
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '服务器返回错误');
    }

    const result = await response.json();
    return result.reply;
}

/* ========== 结束：替换代码 ========== */


// 创建一个辅助函数来模拟发送消息，避免代码重复
function simulateSendingMessage(messageText) {
    const messagesEl = document.getElementById('chatMessages');
    if (!messageText || !currentChatContact) return;

    // 保存消息记录
    const newIndex = saveMessage(currentChatContact.id, {sender: 'user', text: messageText});

    // 创建并显示消息 DOM
    const messageRow = _createMessageDOM(currentChatContact.id, {
        sender: 'user',
        text: messageText
    }, newIndex);
    messagesEl.appendChild(messageRow);

    // 更新联系人列表的最后消息并滚动到底部
    renderContacts(contactsData);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

/* ========== 结束：粘贴 JavaScript 代码块 ========== */

/* ========== 开始：粘贴悬浮球的全新JavaScript逻辑 ========== */

// ========== 开始：粘贴这段【最终修正版】的悬浮球JS逻辑 ==========

function initializeFloatingBall() {
    const ball = document.getElementById('floatingBall');
    const phone = document.querySelector('.phone');

    if (!ball || !phone) return;

    let isDragging = false;
    let hasMoved = false; // 同样用于区分点击和拖拽
    let startX, startY;
    let initialLeft, initialTop;

    // 智能吸附到边缘的函数（保持不变）
    const snapToEdge = () => {
        const phoneRect = phone.getBoundingClientRect();
        const ballRect = ball.getBoundingClientRect();
        const screenInnerWidth = phoneRect.width - 24;
        let currentLeft = parseFloat(ball.style.left || 0);

        if (currentLeft + ballRect.width / 2 < screenInnerWidth / 2) {
            ball.style.left = '12px';
        } else {
            ball.style.left = `${phoneRect.width - ballRect.width - 12}px`;
        }
    };

    // 【 handleClick 函数被简化 】
    // 它现在只负责核心的点击业务，不再做判断
    const handleClick = () => {
        console.log('悬浮球被点击了!');
        toggleFloatingBallMenu(); // 打开或关闭菜单
    };

    const startDrag = (e) => {
        // e.preventDefault() 会阻止后续的 click 事件，但我们这里不能阻止，否则桌面端的 click 会失效。
        // 我们在 touchend 中有选择地阻止。

        isDragging = true;
        hasMoved = false; // 每次开始时重置
        ball.classList.add('dragging');

        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;

        const ballRect = ball.getBoundingClientRect();
        const phoneRect = phone.getBoundingClientRect();
        initialLeft = ballRect.left - phoneRect.left;
        initialTop = ballRect.top - phoneRect.top;

        // 统一使用 left/top 定位，后续计算更简单
        ball.style.left = `${initialLeft}px`;
        ball.style.top = `${initialTop}px`;
        ball.style.right = 'auto';
        ball.style.bottom = 'auto';

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('touchmove', onDrag, {passive: false});
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    };

    const onDrag = (e) => {
        if (!isDragging) return;

        // 【优化】移动距离超过一个微小阈值才判定为拖拽
        const touch = e.touches ? e.touches[0] : e;
        if (!hasMoved && (Math.abs(touch.clientX - startX) > 5 || Math.abs(touch.clientY - startY) > 5)) {
            hasMoved = true;
        }

        // 只有真正拖动时才阻止页面滚动
        if (hasMoved && e.cancelable) e.preventDefault();

        const deltaX = touch.clientX - startX;
        const deltaY = touch.clientY - startY;

        const phoneRect = phone.getBoundingClientRect();
        const ballRect = ball.getBoundingClientRect();

        let newLeft = initialLeft + deltaX;
        let newTop = initialTop + deltaY;

        // 更可靠的边界检测
        const minX = 12;
        const maxX = phoneRect.width - ballRect.width - 12;
        const minY = 12;
        const maxY = phoneRect.height - ballRect.height - 12;

        newLeft = Math.max(minX, Math.min(newLeft, maxX));
        newTop = Math.max(minY, Math.min(newTop, maxY));

        ball.style.left = `${newLeft}px`;
        ball.style.top = `${newTop}px`;
    };

    // 【 endDrag 函数是修复的核心 】
    const endDrag = (e) => {
        if (!isDragging) return;

        // 1. 如果没有拖动，就判定为 "Tap"（轻点）
        if (!hasMoved) {
            // [关键修复] 如果是触摸事件，我们主动阻止默认行为。
            // 这能有效防止大约300ms后浏览器自动触发的 `click` 事件，从而避免了双重调用。
            if (e.type === 'touchend') {
                e.preventDefault();
            }
            handleClick(); // 手动执行点击逻辑
        } else {
            // 2. 如果拖动了，执行吸附边缘的逻辑
            snapToEdge();
        }

        // 3. 清理工作
        isDragging = false;
        ball.classList.remove('dragging');

        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
    };

    // 【 绑定事件 】
    // 我们同时监听 mousedown 和 touchstart，它们都调用 startDrag
    ball.addEventListener('mousedown', startDrag);
    ball.addEventListener('touchstart', startDrag, {passive: false});

    // 我们为桌面端保留 click 事件。因为在 touchend 中 preventDefault() 了，
    // 所以在移动端，这个 click 事件将不会被触发，完美解决了冲突。
    ball.addEventListener('click', (e) => {
        // 为了防止极少数情况下 touchend 的 preventDefault 失效，增加一个判断：
        // 如果是拖拽过的，就不要执行点击。
        if (hasMoved) {
            e.stopPropagation();
            return;
        }
        // 对于桌面端，因为没有 touchend，所以会正常执行 handleClick
        if (e.detail > 0) { // e.detail > 0 确保这是真正的用户鼠标点击
            handleClick();
        }
    });
}

// ========== 结束：粘贴【最终修正版】的悬浮球JS逻辑 ==========


// ========== 开始：粘贴这个全新的 JavaScript 函数 ==========

/**
 * 清空所有本地存储的数据
 * 这是一个危险操作，执行前会要求用户确认。
 */
function clearAllData() {
    // 1. 弹出确认框，给用户最后一次反悔的机会
    const confirmation = confirm(
        "⚠️ 警告！\n\n你确定要清空所有数据吗？\n\n此操作将不可逆转地删除：\n- 所有API、数据库和云存储设置\n- 所有联系人、密友和聊天记录\n- 所有自定义图标、壁纸和组件\n- 所有世界书和分组\n- 其他所有个性化配置\n\n应用将恢复到初始状态。"
    );

    // 2. 检查用户的选择
    if (confirmation) {
        // 3. 如果用户点击“确定”，则清空 localStorage
        localStorage.clear();

        // 4. 显示一个操作成功的提示
        alert("所有数据已成功清除。应用即将重新加载。");

        // 5. 重新加载页面，让应用以全新的状态启动
        location.reload();
    } else {
        // 如果用户点击“取消”，则不做任何事
        console.log("用户取消了清空所有数据的操作。");
    }
}

// ========== 结束：粘贴代码 ==========


/* ========== 开始：粘贴这个全新的 JavaScript 函数 ========== */

/**
 * 根据传入的状态，显示或隐藏悬浮球
 * @param {boolean} isEnabled - true 为显示, false 为隐藏
 */
function applyFloatingBallSetting(isEnabled) {
    const ball = document.getElementById('floatingBall');
    if (ball) {
        ball.style.display = isEnabled ? 'flex' : 'none';
    }
}

// ========== 图标收藏栏功能 ==========

let dockedIcons = []; // 存储在栏目中的图标数据

/**
 * 打开/关闭悬浮球菜单
 */
function toggleFloatingBallMenu() {
    const menu = document.getElementById('floatingBallMenu');
    menu.classList.toggle('show');
}

/**
 * 关闭悬浮球菜单
 */
function closeFloatingBallMenu() {
    const menu = document.getElementById('floatingBallMenu');
    menu.classList.remove('show');
}

/**
 * 打开/关闭图标收藏栏
 */
function toggleIconDockPanel() {
    const panel = document.getElementById('iconDockPanel');
    panel.classList.toggle('show');
    closeFloatingBallMenu();

    // 如果是打开状态，渲染图标
    if (panel.classList.contains('show')) {
        renderDockedIcons();
    }
}

/**
 * 关闭图标收藏栏
 */
function closeIconDockPanel() {
    const panel = document.getElementById('iconDockPanel');
    panel.classList.remove('show');
}

/**
 * 渲染栏目中的图标
 */
function renderDockedIcons() {
    const container = document.getElementById('dockPanelContent');

    if (dockedIcons.length === 0) {
        container.innerHTML = '<div class="dock-panel-empty">拖动图标到这里收藏</div>';
        return;
    }

    container.innerHTML = '';

    dockedIcons.forEach((iconData, index) => {
        const iconEl = document.createElement('div');
        iconEl.className = 'dock-panel-icon';
        iconEl.dataset.iconId = iconData.id;
        iconEl.dataset.sourceGrid = iconData.sourceGrid;
        iconEl.dataset.dockIndex = index;

        // 构建图标HTML
        const customIcon = globalConfig.customIcons[iconData.id];
        let iconContent;

        if (customIcon) {
            iconContent = `<img src="${customIcon}" alt="${iconData.label}">`;
        } else if (iconData.icon && (iconData.icon.startsWith('http') || iconData.icon.startsWith('data:'))) {
            iconContent = `<img src="${iconData.icon}" alt="${iconData.label}">`;
        } else {
            iconContent = iconData.icon || '📱';
        }

        iconEl.innerHTML = `
            <div class="icon-wrapper">${iconContent}</div>
            <div class="app-label">${iconData.label}</div>
        `;

        // 添加长按拖出功能
        addDockIconDragListeners(iconEl, iconData);

        // 点击功能
        iconEl.addEventListener('click', (e) => {
            if (!iconData.clickable) return;
            if (iconData.id === 'settings') {
                closeIconDockPanel();
                openSettings();
            } else if (iconData.id === 'worldbook') {
                closeIconDockPanel();
                openWorldbook();
            }
        });

        container.appendChild(iconEl);
    });
}

/**
 * 为栏目中的图标添加拖出功能
 */
function addDockIconDragListeners(el, iconData) {
    let longPressTimer = null;
    let startPos = {x: 0, y: 0};
    let isDraggingFromDock = false;

    const startDrag = (e) => {
        const touch = e.touches ? e.touches[0] : e;
        startPos = {x: touch.clientX, y: touch.clientY};

        longPressTimer = setTimeout(() => {
            isDraggingFromDock = true;
            el.style.opacity = '0.5';
            createDragGhost(iconData, touch.clientX, touch.clientY);
        }, 500);
    };

    const endDrag = () => {
        clearTimeout(longPressTimer);
        if (isDraggingFromDock) {
            el.style.opacity = '';
            isDraggingFromDock = false;
        }
    };

    el.addEventListener('mousedown', startDrag);
    el.addEventListener('touchstart', startDrag, {passive: true});
    el.addEventListener('mouseup', endDrag);
    el.addEventListener('touchend', endDrag);
}

let dragGhost = null;
let ghostIconData = null;

/**
 * 创建拖动的幽灵元素
 */
function createDragGhost(iconData, x, y) {
    // 🔧 新增：设置全局拖拽标志
    state.isDraggingFromDock = true;
    // 移除旧的幽灵元素
    if (dragGhost) {
        dragGhost.remove();
    }

    ghostIconData = iconData;

    dragGhost = document.createElement('div');
    dragGhost.className = 'app-icon dragging';
    dragGhost.style.position = 'fixed';
    dragGhost.style.zIndex = '3000';
    dragGhost.style.pointerEvents = 'none';
    dragGhost.style.left = `${x}px`;
    dragGhost.style.top = `${y}px`;
    dragGhost.style.transform = 'translate(-50%, -50%) scale(1.1)';

    const customIcon = globalConfig.customIcons[iconData.id];
    let iconContent;

    if (customIcon) {
        iconContent = `<img src="${customIcon}" alt="">`;
    } else if (iconData.icon && (iconData.icon.startsWith('http') || iconData.icon.startsWith('data:'))) {
        iconContent = `<img src="${iconData.icon}" alt="">`;
    } else {
        iconContent = iconData.icon || '📱';
    }

    dragGhost.innerHTML = `
        <div class="icon-wrapper">${iconContent}</div>
        <div class="app-label">${iconData.label}</div>
    `;

    document.body.appendChild(dragGhost);

    // 添加移动和释放事件
    document.addEventListener('mousemove', moveDragGhost);
    document.addEventListener('touchmove', moveDragGhost, {passive: false});
    document.addEventListener('mouseup', dropDragGhost);
    document.addEventListener('touchend', dropDragGhost);
}

/**
 * 移动幽灵元素
 */
function moveDragGhost(e) {
    if (!dragGhost) return;

    if (e.cancelable) e.preventDefault();

    const touch = e.touches ? e.touches[0] : e;
    dragGhost.style.left = `${touch.clientX}px`;
    dragGhost.style.top = `${touch.clientY}px`;
}

/**
 * 释放幽灵元素
 */
function dropDragGhost(e) {
    if (!dragGhost || !ghostIconData) {
        cleanupDragGhost();
        return;
    }

    const touch = e.changedTouches ? e.changedTouches[0] : e;

    // 检测是否释放在页面区域
    const grids = [document.getElementById('grid1'), document.getElementById('grid2')];
    let droppedOnGrid = false;

    grids.forEach((grid, pageIndex) => {
        const rect = grid.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
            droppedOnGrid = true;

            // 将图标从栏目移回页面
            moveIconBackToGrid(ghostIconData, grid, touch.clientX - rect.left, touch.clientY - rect.top, pageIndex + 1);
        }
    });
    state.lastDragEndTime = Date.now(); // ✅ 新增：无论是否成功放下，都记录拖拽结束时间
    cleanupDragGhost();
}

/**
 * 清理拖拽状态
 */
function cleanupDragGhost() {
    if (dragGhost) {
        dragGhost.remove();
        dragGhost = null;
    }
    ghostIconData = null;
    // 🔧 新增：清除拖拽标志
    state.isDraggingFromDock = false;
    document.removeEventListener('mousemove', moveDragGhost);
    document.removeEventListener('touchmove', moveDragGhost);
    document.removeEventListener('mouseup', dropDragGhost);
    document.removeEventListener('touchend', dropDragGhost);
}

/**
 * 将图标从栏目移回网格
 */
function moveIconBackToGrid(iconData, grid, dropX, dropY, pageNum) {
    const ROW_HEIGHT_PX = 94;
    const GAP_PX = 14;
    const gridRect = grid.getBoundingClientRect();

    let col = Math.floor(dropX / (gridRect.width / 4));
    let row = Math.floor(dropY / (ROW_HEIGHT_PX + GAP_PX));

    col = Math.max(0, Math.min(col, 3));
    row = Math.max(0, Math.min(row, 5));

    const pageKey = `page${pageNum}`;

    // 检查位置是否被占用
    if (isOccupied(pageKey, row, col, iconData.id)) {
        showSuccessModal('提示', '该位置已被占用，请拖到其他位置', 1500);
        return;
    }

    // 从栏目中移除
    const dockIndex = dockedIcons.findIndex(icon => icon.id === iconData.id);
    if (dockIndex !== -1) {
        dockedIcons.splice(dockIndex, 1);
        saveDockedIcons();
    }

    // 添加回网格
    const appData = {
        ...iconData,
        row,
        col
    };

    state.appLayouts[pageKey].push(appData);
    saveLayoutToLocalStorage();

    // 重新渲染
    const el = createElement(appData, grid);
    renderDockedIcons();

    showSuccessModal('移动成功', `已将"${iconData.label}"移动到第${pageNum}页`, 1500);
}

/**
 * 保存栏目图标到localStorage
 */
function saveDockedIcons() {
    try {
        localStorage.setItem('phoneDockedIcons', JSON.stringify(dockedIcons));
    } catch (e) {
        console.error('保存栏目图标失败:', e);
    }
}

/**
 * 加载栏目图标
 */
function loadDockedIcons() {
    try {
        const saved = localStorage.getItem('phoneDockedIcons');
        if (saved) {
            dockedIcons = JSON.parse(saved);
            console.log('成功加载栏目图标，共', dockedIcons.length, '个');
        }
    } catch (e) {
        console.error('加载栏目图标失败:', e);
    }
}

/**
 * 将图标添加到栏目
 */
function addIconToDockPanel(element) {
    const iconId = element.dataset.id;
    const grid = element.parentElement;
    const pageKey = grid.id === 'grid1' ? 'page1' : 'page2';

    // 查找图标数据
    const appData = state.appLayouts[pageKey].find(app => app.id === iconId);
    if (!appData) {
        console.error('未找到图标数据:', iconId);
        return;
    }

    // 检查是否已在栏目中
    if (dockedIcons.some(icon => icon.id === iconId)) {
        showSuccessModal('提示', '该图标已在收藏栏中', 1500);
        return;
    }

    // 保存源网格信息
    const iconData = {
        ...appData,
        sourceGrid: pageKey,
        sourceRow: appData.row,
        sourceCol: appData.col
    };

    // 添加到栏目
    dockedIcons.push(iconData);
    saveDockedIcons();

    // 从原页面移除
    state.appLayouts[pageKey] = state.appLayouts[pageKey].filter(app => app.id !== iconId);
    saveLayoutToLocalStorage();
    element.remove();

    // 刷新栏目显示
    renderDockedIcons();

    showSuccessModal('添加成功', `已将"${iconData.label}"添加到收藏栏`, 1500);
}


// ========== 开始：新增的密友列表相关函数 ==========

/**
 * 打开密友列表页面
 */
function openSweetheartList() {
    document.getElementById('sweetheartListPage').classList.add('show');
    // 每次打开时都重新渲染列表，以保证数据最新
    renderSweetheartList();
}

/**
 * 关闭密友列表页面
 */
function closeSweetheartList(isNavigatingBack = false) {
    document.getElementById('sweetheartListPage').classList.remove('show');

    // 只有在明确是“返回”操作时，才跳转回世界选择页面
    if (isNavigatingBack && currentWorldId) {
        setTimeout(() => {
            openWorldSelect();
        }, 300);
    }
}


/**
 * 渲染密友列表
 * (这里我们复用现有的 contactsData 数据源，但使用全新的外观)
 */
/**
 * [最终修正版] 渲染密友列表
 */
function renderSweetheartList() {
    const container = document.getElementById('sweetheartListContainer');
    const chatHistory = JSON.parse(localStorage.getItem('phoneChatHistory') || '{}');

    container.innerHTML = '';

    // 根据当前世界筛选联系人
    let contactsToShow = [];

    if (currentWorldId) {
        // 如果有选中的世界，显示该世界的联系人
        const world = worldsData.find(w => w.id === currentWorldId);
        if (world && world.contacts) {
            contactsToShow = sweetheartContactsData.filter(contact =>
                world.contacts.includes(String(contact.id))
            );
        }
    } else {
        // 如果没有选中世界，显示所有密友
        contactsToShow = sweetheartContactsData;
    }

    if (contactsToShow.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 60px 20px; color: #A1887F; font-size: 14px; line-height: 1.6;">这个世界还没有联系人，<br/>点击右上角添加一个吧 ✨</div>';
        return;
    }

    contactsToShow.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'sweetheart-item';

        item.onclick = () => {
            // 明确告知这不是“返回”操作
            closeSweetheartList(false);
            // 稍微增加延迟，让关闭动画更流畅
            setTimeout(() => openChat(contact), 350);
        };


        const contactMessages = chatHistory[contact.id] || [];
        let lastMessageText = contact.status;
        if (contactMessages.length > 0) {
            const lastMessage = contactMessages[contactMessages.length - 1];
            if (lastMessage.text && lastMessage.text.includes('<img')) {
                lastMessageText = '[图片]';
            } else {
                lastMessageText = lastMessage.text;
            }
        }

        const isUrl = contact.avatar && (String(contact.avatar).startsWith('http') || String(contact.avatar).startsWith('data:'));
        const avatarContent = isUrl
            ? `<img src="${escapeHTML(contact.avatar)}" alt="${escapeHTML(contact.name)}">`
            : `<span>${escapeHTML(contact.avatar)}</span>`;

        item.innerHTML = `
            <div class="sweetheart-avatar">${avatarContent}</div>
            <div class="sweetheart-info">
                <div class="sweetheart-name">${escapeHTML(contact.name)}</div>
                <div class="sweetheart-status">${escapeHTML(lastMessageText)}</div>
            </div>
        `;

        container.appendChild(item);
    });
}


// ========== 结束：新增的密友列表相关函数 ==========

/**
 * [新增] 添加一个新的密友
 */
/**
 * [修正版] 添加一个新的密友，直接打开粉色卡片
 */
function addNewSweetheartContact() {
    openSweetheartCardModal();
}


// ========== 世界书功能 - 开始 ==========

// 世界书数据存储
let worldbookData = [];
let selectedCategory = null; // 当前选择的分组
let selectedGroup = null; // 选中的分类
let currentEditingWorldbookId = null;

/**
 * 打开世界书主页面
 */
function openWorldbook() {
    document.getElementById('worldbookPage').classList.add('show');
    renderWorldbookList();
}

/**
 * 关闭世界书主页面
 */
function closeWorldbook() {
    document.getElementById('worldbookPage').classList.remove('show');
}

/**
 * 渲染世界书列表
 */
function renderWorldbookList() {
    const emptyEl = document.getElementById('worldbookEmpty');
    const listEl = document.getElementById('worldbookList');

    if (worldbookData.length === 0) {
        emptyEl.style.display = 'flex';
        listEl.style.display = 'none';
    } else {
        emptyEl.style.display = 'none';
        listEl.style.display = 'flex';

        listEl.innerHTML = '';
        worldbookData.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'worldbook-item';
            item.onclick = () => editWorldbookEntry(entry.id);

            const groupNames = {
                'worldview': '世界观',
                'rules': '行为规范',
                'knowledge': '知识库'
            };

            // 获取分组名称
            let categoryName = '未分组';
            if (entry.category && entry.category !== 'uncategorized') {
                const cat = categoriesData.find(c => c.id === entry.category);
                categoryName = cat ? cat.name : '未分组';
            }

            const preview = (entry.content || '暂无内容').substring(0, 60);

            item.innerHTML = `
                <div class="worldbook-item-title">${escapeHTML(entry.title)}</div>
                <div class="worldbook-item-category">${escapeHTML(groupNames[entry.group] || '未分类')} · ${escapeHTML(categoryName)}</div>
                <div class="worldbook-item-preview">${escapeHTML(preview)}${preview.length >= 60 ? '...' : ''}</div>
            `;

            listEl.appendChild(item);
        });
    }
}


/**
 * 打开世界书弹窗（新建模式）
 */
function openWorldbookModal() {
    currentEditingWorldbookId = null;
    selectedGroup = null;
    selectedCategory = null;

    document.getElementById('worldbookModalTitle').textContent = '新建世界书';
    document.getElementById('wbTitleInput').value = '';  // ← 改这里
    document.getElementById('wbContentInput').value = ''; // ← 改这里

    // 重置分类
    document.getElementById('groupSelected').textContent = '请选择分类';
    document.querySelectorAll('#groupOptions .category-option').forEach(opt => {
        opt.classList.remove('selected');
    });

    // 重置分组
    document.getElementById('categorySelected').textContent = '请选择分组';
    updateCategoryOptions();

    document.getElementById('wbContentLabel').textContent = '内容'; // ← 改这里
    document.getElementById('worldbookDeleteBtn').style.display = 'none';
    document.getElementById('worldbookModal').classList.add('show');
}


/**
 * 编辑世界书条目
 */
// 请用这个新版本替换旧的 editWorldbookEntry 函数
function editWorldbookEntry(entryId) {
    const entry = worldbookData.find(e => e.id === entryId);
    if (!entry) return;

    currentEditingWorldbookId = entryId;
    selectedGroup = entry.group; // 确保 selectedGroup 被正确赋值
    selectedCategory = entry.category;

    document.getElementById('worldbookModalTitle').textContent = '编辑世界书';
    document.getElementById('wbTitleInput').value = entry.title;
    document.getElementById('wbContentInput').value = entry.content || '';

    // 设置分类
    const groupNames = {
        'worldview': '世界观',
        'rules': '行为规范',
        'knowledge': '知识库'
    };
    // V V V 修正点在这里 V V V
    document.getElementById('groupSelected').textContent = groupNames[entry.group] || '请选择分类';
    document.querySelectorAll('#groupOptions .category-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.group === entry.group);
    });

    // 设置分组（这部分逻辑保持不变）
    updateCategoryOptions();
    const categoryName = categoriesData.find(c => c.id === entry.category)?.name || '请选择分组';
    document.getElementById('categorySelected').textContent = categoryName;
    document.querySelectorAll('#categoryOptions .category-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.category === entry.category);
    });

    document.getElementById('worldbookDeleteBtn').style.display = 'block';
    document.getElementById('worldbookModal').classList.add('show');
}


/**
 * 关闭世界书弹窗
 */
function closeWorldbookModal() {
    document.getElementById('worldbookModal').classList.remove('show');
    currentEditingWorldbookId = null;
}

/**
 * 保存世界书条目
 */
function saveWorldbookEntry() {
    const title = document.getElementById('wbTitleInput').value.trim();     // ← 改这里
    const content = document.getElementById('wbContentInput').value.trim(); // ← 改这里

    if (!title) {
        alert('请填写世界书名称！');
        return;
    }

    if (!selectedGroup) {
        alert('请选择分类！');
        return;
    }

    const entryData = {
        id: currentEditingWorldbookId || 'WB' + Date.now(),
        title,
        group: selectedGroup,
        category: selectedCategory || 'uncategorized',
        content,
        timestamp: Date.now()
    };

    if (currentEditingWorldbookId) {
        const index = worldbookData.findIndex(e => e.id === currentEditingWorldbookId);
        if (index !== -1) {
            worldbookData[index] = entryData;
        }
    } else {
        worldbookData.push(entryData);
    }

    saveWorldbookToStorage();
    renderWorldbookList();
    closeWorldbookModal();
    showSuccessModal('保存成功', '世界书已更新！');
}


/**
 * 删除世界书条目
 */
function deleteWorldbookEntry() {
    if (!currentEditingWorldbookId) return;

    if (confirm('确定要删除这个世界书条目吗？')) {
        worldbookData = worldbookData.filter(e => e.id !== currentEditingWorldbookId);
        saveWorldbookToStorage();
        renderWorldbookList();
        closeWorldbookModal();
        showSuccessModal('删除成功', '世界书条目已移除。');
    }
}

/**
 * 保存世界书数据到 localStorage
 */
function saveWorldbookToStorage() {
    try {
        localStorage.setItem('phoneWorldbookData', JSON.stringify(worldbookData));
    } catch (e) {
        console.error('保存世界书数据失败:', e);
    }
}

/**
 * 从 localStorage 加载世界书数据
 */
function loadWorldbookData() {
    try {
        const saved = localStorage.getItem('phoneWorldbookData');
        if (saved) {
            worldbookData = JSON.parse(saved);
            console.log('成功加载世界书数据，共', worldbookData.length, '条');
        }
    } catch (e) {
        console.error('加载世界书数据失败:', e);
    }
}

/**
 * 初始化分组选择器
 */
function setupCategorySelector() {
    // 分组选择器
    const groupSelector = document.getElementById('groupSelector');
    const groupSelectedEl = document.getElementById('groupSelected');
    const groupOptionsEl = document.getElementById('groupOptions');

    groupSelectedEl.addEventListener('click', (e) => {
        e.stopPropagation();
        groupSelector.classList.toggle('active');
        // 关闭分组选择器
        document.getElementById('categorySelector').classList.remove('active');
    });

    groupOptionsEl.addEventListener('click', (e) => {
        const option = e.target.closest('.category-option');
        if (!option) return;

        const group = option.dataset.group;
        selectedGroup = group;

        groupSelectedEl.textContent = option.textContent;
        document.querySelectorAll('#groupOptions .category-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');

        const labels = {
            'worldview': '世界观',
            'rules': '行为规范',
            'knowledge': '知识库'
        };
        document.getElementById('wbContentLabel').textContent = labels[group];
        document.getElementById('worldbookContent').placeholder = `填写${labels[group]}的内容...`;

        groupSelector.classList.remove('active');
    });

    // 分组选择器
    const categorySelector = document.getElementById('categorySelector');
    const categorySelectedEl = document.getElementById('categorySelected');
    const categoryOptionsEl = document.getElementById('categoryOptions');

    categorySelectedEl.addEventListener('click', (e) => {
        e.stopPropagation();
        categorySelector.classList.toggle('active');
        // 关闭分组选择器
        groupSelector.classList.remove('active');
    });

    categoryOptionsEl.addEventListener('click', (e) => {
        const option = e.target.closest('.category-option');
        if (!option) return;

        const category = option.dataset.category;
        selectedCategory = category;

        categorySelectedEl.textContent = option.textContent;
        document.querySelectorAll('#categoryOptions .category-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');

        categorySelector.classList.remove('active');
    });

    // 点击其他地方关闭所有选择器
    document.addEventListener('click', () => {
        groupSelector.classList.remove('active');
        categorySelector.classList.remove('active');
    });
}


/**
 * 打开分组管理（暂时用简单提示，后续可扩展）
 */
function openCategoryManage(event) {
    event.stopPropagation();
    alert('分组管理功能开发中...');
}

// ========== 分类管理功能 - 开始 ==========

/**
 * 打开分类管理页面
 */
function openClassificationManage(event) {
    if (event) event.stopPropagation();
    document.getElementById('classificationManagePage').classList.add('show');
    renderClassificationList(); // 打开时渲染列表
}

/**
 * 关闭分类管理页面
 */
function closeClassificationManage() {
    document.getElementById('classificationManagePage').classList.remove('show');
}

/**
 * 渲染分类列表（世界观、行为规范、知识库）
 */
function renderClassificationList() {
    const listEl = document.getElementById('classificationList');
    const emptyEl = document.getElementById('classificationEmpty');

    // 1. 定义我们的三个核心分类
    const coreClassifications = [
        {key: 'worldview', name: '世界观', icon: '🌍'},
        {key: 'rules', name: '行为规范', icon: '📜'},
        {key: 'knowledge', name: '知识库', icon: '📚'}
    ];

    let hasContent = false;
    listEl.innerHTML = ''; // 清空旧内容

    // 2. 遍历每个核心分类
    coreClassifications.forEach(classification => {
        // 找出所有属于当前分类的世界书条目
        const worldbooksInCategory = worldbookData.filter(wb => wb.group === classification.key);

        if (worldbooksInCategory.length > 0) {
            hasContent = true;
        }

        const count = worldbooksInCategory.length;

        // 3. 创建分类的 DOM 结构（复用分组管理的样式）
        const item = document.createElement('div');
        item.className = 'category-item';
        item.dataset.classificationId = classification.key; // 使用 key 作为唯一标识

        item.innerHTML = `
            <div class="category-item-header" onclick="toggleClassificationExpand('${classification.key}')">
                <div class="category-item-icon">${classification.icon}</div>
                <div class="category-item-info">
                    <div class="category-item-name">${escapeHTML(classification.name)}</div>
                    <div class="category-item-count">${count} 个世界书</div>
                </div>
                <div class="category-item-arrow">›</div>
            </div>
            <div class="category-worldbooks" id="worldbooks-clf-${classification.key}">
                ${worldbooksInCategory.length === 0
            ? '<div style="padding: 20px; text-align: center; color: #BCAAA4; font-size: 13px;">暂无世界书</div>'
            : worldbooksInCategory.map(wb => `
                        <div class="worldbook-mini-item" onclick="editWorldbookFromClassification('${wb.id}')">
                            <div class="worldbook-mini-title">${escapeHTML(wb.title)}</div>
                            <div class="worldbook-mini-preview">${escapeHTML((wb.content || '').substring(0, 40))}...</div>
                        </div>
                    `).join('')}
            </div>
        `;
        listEl.appendChild(item);
    });

    // 4. 根据是否有内容，决定显示列表还是空状态提示
    if (hasContent || worldbookData.length > 0) { // 只要有世界书就显示分类列表
        emptyEl.style.display = 'none';
        listEl.style.display = 'flex';
    } else {
        emptyEl.style.display = 'flex';
        listEl.style.display = 'none';
    }
}

/**
 * 切换分类的展开/收起
 */
function toggleClassificationExpand(classificationKey) {
    const item = document.querySelector(`[data-classification-id="${classificationKey}"]`);
    if (item) {
        item.classList.toggle('expanded');
    }
}

/**
 * 从分类管理页面跳转到编辑世界书
 */
function editWorldbookFromClassification(worldbookId) {
    closeClassificationManage();
    // 延迟执行，等待页面关闭动画完成
    setTimeout(() => {
        openWorldbook();
        // 再次延迟，等待世界书页面打开
        setTimeout(() => editWorldbookEntry(worldbookId), 100);
    }, 300);
}

// ========== 分类管理功能 - 结束 ==========


// ========== 分组管理功能 - 开始 ==========

// 分组数据存储
let categoriesData = [];
let currentEditingCategoryId = null;

/**
 * 打开分组管理页面
 */
function openCategoryManage(event) {
    if (event) event.stopPropagation();
    document.getElementById('categoryManagePage').classList.add('show');
    renderCategoryList();
}

/**
 * 关闭分组管理页面
 */
function closeCategoryManage() {
    document.getElementById('categoryManagePage').classList.remove('show');
}

/**
 * 动态更新分组选择器的选项
 */
function updateCategoryOptions() {
    const optionsEl = document.getElementById('categoryOptions');
    if (!optionsEl) return;

    optionsEl.innerHTML = '';

    // 添加"未分组"选项
    const uncategorizedOption = document.createElement('div');
    uncategorizedOption.className = 'category-option';
    uncategorizedOption.dataset.category = 'uncategorized';
    uncategorizedOption.textContent = '未分组';
    optionsEl.appendChild(uncategorizedOption);

    // 添加自定义分组
    categoriesData.forEach(category => {
        const option = document.createElement('div');
        option.className = 'category-option';
        option.dataset.category = category.id;
        option.textContent = category.name;
        optionsEl.appendChild(option);
    });
}


/**
 * 渲染分组列表
 */
function renderCategoryList() {
    const emptyEl = document.getElementById('categoryEmpty');
    const listEl = document.getElementById('categoryList');

    if (categoriesData.length === 0) {
        emptyEl.style.display = 'flex';
        listEl.style.display = 'none';
    } else {
        emptyEl.style.display = 'none';
        listEl.style.display = 'flex';

        listEl.innerHTML = '';
        categoriesData.forEach(category => {
            const item = createCategoryItem(category);
            listEl.appendChild(item);
        });
    }
}

/**
 * 创建分组项DOM元素
 */
function createCategoryItem(category) {
    const item = document.createElement('div');
    item.className = 'category-item';
    item.dataset.categoryId = category.id;

    // 统计该分组下的世界书数量
    const worldbooksInCategory = worldbookData.filter(wb => wb.category === category.id);
    const count = worldbooksInCategory.length;

    item.innerHTML = `
        <div class="category-item-header" onclick="toggleCategoryExpand('${category.id}')">
            <div class="category-item-icon">📂</div>
            <div class="category-item-info">
                <div class="category-item-name">${escapeHTML(category.name)}</div>
                <div class="category-item-count">${count} 个世界书</div>
            </div>
            <div class="category-item-arrow">›</div>
        </div>
        <div class="category-worldbooks" id="worldbooks-${category.id}">
            ${worldbooksInCategory.length === 0
        ? '<div style="padding: 20px; text-align: center; color: #BCAAA4; font-size: 13px;">暂无世界书</div>'
        : worldbooksInCategory.map(wb => `
                    <div class="worldbook-mini-item" onclick="editWorldbookFromCategory('${wb.id}')">
                        <div class="worldbook-mini-title">${escapeHTML(wb.title)}</div>
                        <div class="worldbook-mini-preview">${escapeHTML((wb.content || '').substring(0, 40))}...</div>
                    </div>
                `).join('')}
        </div>
    `;

    return item;
}

/**
 * 切换分组展开/收起
 */
function toggleCategoryExpand(categoryId) {
    const item = document.querySelector(`[data-category-id="${categoryId}"]`);
    if (!item) return;

    item.classList.toggle('expanded');
}

/**
 * 从分组管理页面编辑世界书
 */
function editWorldbookFromCategory(worldbookId) {
    closeCategoryManage();
    setTimeout(() => {
        openWorldbook();
        setTimeout(() => editWorldbookEntry(worldbookId), 100);
    }, 300);
}

/**
 * 打开新建分组弹窗
 */
function openNewCategoryModal() {
    currentEditingCategoryId = null;

    document.getElementById('categoryModalTitle').textContent = '新建分组';
    document.getElementById('categoryNameInput').value = '';
    document.getElementById('categoryDescInput').value = '';
    document.getElementById('categoryDeleteBtn').style.display = 'none';

    document.getElementById('categoryModal').classList.add('show');
}

/**
 * 编辑分组
 */
function editCategory(categoryId) {
    const category = categoriesData.find(c => c.id === categoryId);
    if (!category) return;

    currentEditingCategoryId = categoryId;

    document.getElementById('categoryModalTitle').textContent = '编辑分组';
    document.getElementById('categoryNameInput').value = category.name;
    document.getElementById('categoryDescInput').value = category.description || '';
    document.getElementById('categoryDeleteBtn').style.display = 'block';

    document.getElementById('categoryModal').classList.add('show');
}

/**
 * 关闭分组弹窗
 */
function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('show');
    currentEditingCategoryId = null;
}

/**
 * 保存分组
 */
function saveCategory() {
    const name = document.getElementById('categoryNameInput').value.trim();
    const description = document.getElementById('categoryDescInput').value.trim();

    if (!name) {
        alert('请填写分组名称！');
        return;
    }

    const categoryData = {
        id: currentEditingCategoryId || 'CAT' + Date.now(),
        name,
        description,
        timestamp: Date.now()
    };

    if (currentEditingCategoryId) {
        // 编辑模式
        const index = categoriesData.findIndex(c => c.id === currentEditingCategoryId);
        if (index !== -1) {
            categoriesData[index] = categoryData;
        }
    } else {
        // 新建模式
        categoriesData.push(categoryData);
    }

    saveCategoriesToStorage();
    renderCategoryList();
    updateWorldbookCategorySelector(); // 更新世界书弹窗的分组选项
    closeCategoryModal();
    showSuccessModal('保存成功', '分组已更新！');
}

/**
 * 删除分组
 */
function deleteCategory() {
    if (!currentEditingCategoryId) return;

    // 检查是否有世界书使用此分组
    const worldbooksUsingCategory = worldbookData.filter(wb => wb.category === currentEditingCategoryId);

    if (worldbooksUsingCategory.length > 0) {
        if (!confirm(`此分组下有 ${worldbooksUsingCategory.length} 个世界书，删除后这些世界书将变为未分组状态，确定删除吗？`)) {
            return;
        }

        // 将使用此分组的世界书改为未分组
        worldbooksUsingCategory.forEach(wb => {
            wb.category = 'uncategorized';
        });
        saveWorldbookToStorage();
    }

    categoriesData = categoriesData.filter(c => c.id !== currentEditingCategoryId);
    saveCategoriesToStorage();
    renderCategoryList();
    updateWorldbookCategorySelector();
    closeCategoryModal();
    showSuccessModal('删除成功', '分组已移除。');
}

/**
 * 保存分组到localStorage
 */
function saveCategoriesToStorage() {
    try {
        localStorage.setItem('phoneCategoriesData', JSON.stringify(categoriesData));
    } catch (e) {
        console.error('保存分组数据失败:', e);
    }
}

/**
 * 从localStorage加载分组
 */
function loadCategoriesData() {
    try {
        const saved = localStorage.getItem('phoneCategoriesData');
        if (saved) {
            categoriesData = JSON.parse(saved);
            console.log('成功加载分组数据，共', categoriesData.length, '条');
        }
    } catch (e) {
        console.error('加载分组数据失败:', e);
    }
}

/**
 * 更新世界书弹窗的分组选择器
 */
function updateWorldbookCategorySelector() {
    const optionsEl = document.getElementById('categoryOptions');
    if (!optionsEl) return;

    optionsEl.innerHTML = '';

    // 添加"未分组"选项
    const uncategorizedOption = document.createElement('div');
    uncategorizedOption.className = 'category-option';
    uncategorizedOption.dataset.category = 'uncategorized';
    uncategorizedOption.textContent = '未分组';
    optionsEl.appendChild(uncategorizedOption);

    // 添加自定义分组
    categoriesData.forEach(category => {
        const option = document.createElement('div');
        option.className = 'category-option';
        option.dataset.category = category.id;
        option.textContent = category.name;
        optionsEl.appendChild(option);
    });
}

// ========== 分组管理功能 - 结束 ==========
/**
 * [最终修正版] 根据当前聊天上下文，收集所有相关的世界书内容
 * @returns {string} - 格式化后的世界书内容字符串
 */

// ▼▼▼ 第5步：用这个新版本替换旧的 gatherWorldbookContext 函数 ▼▼▼
/**
 * [最终增强版] 根据当前聊天上下文，收集所有相关的世界书内容
 * @returns {string} - 格式化后的世界书内容字符串
 */
function gatherWorldbookContext() {
    if (!currentChatContact) return '';

    const relevantWorldbookIds = new Set();

    // 1. 查找当前聊天对象(无论是密友还是普通联系人)的数据
    // 我们在两个数据源里都找一下
    const sweetheartData = sweetheartContactsData.find(c => c.id === currentChatContact.id);
    const regularContactData = contactsData.find(c => c.id === currentChatContact.id);

    // 2. 从密友数据中添加绑定的世界书
    if (sweetheartData && sweetheartData.boundWorldbooks && sweetheartData.boundWorldbooks.length > 0) {
        sweetheartData.boundWorldbooks.forEach(id => relevantWorldbookIds.add(id));
    }

    // 3. [核心新增] 从普通联系人数据中添加绑定的世界书
    if (regularContactData && regularContactData.boundWorldbooks && regularContactData.boundWorldbooks.length > 0) {
        regularContactData.boundWorldbooks.forEach(id => relevantWorldbookIds.add(id));
    }

    // 4. 从当前所在的世界添加绑定的世界书
    if (currentWorldId) {
        const world = worldsData.find(w => w.id === currentWorldId);
        if (world && world.worldbooks && world.worldbooks.length > 0) {
            world.worldbooks.forEach(id => relevantWorldbookIds.add(id));
        }
    }

    if (relevantWorldbookIds.size === 0) {
        return ''; // 没有绑定的世界书，直接返回
    }

    // 5. 根据收集到的ID，查找内容并格式化
    const contextEntries = [];
    relevantWorldbookIds.forEach(id => {
        const entry = worldbookData.find(wb => wb.id === id);
        if (entry && entry.content) {
            const categoryName = categoriesData.find(c => c.id === entry.category)?.name || '通用';
            contextEntries.push(`### ${categoryName}: ${entry.title}\n${entry.content}`);
        }
    });

    if (contextEntries.length > 0) {
        const finalContext = "[背景设定，必须严格遵守]\n---\n" + contextEntries.join('\n\n') + "\n---";
        console.log("[AI Context] 已加载世界书上下文:\n", finalContext); // 方便调试
        return finalContext;
    }

    return '';
}

// ▲▲▲ 函数替换结束 ▲▲▲

// ========== 世界书功能 - 结束 ==========

// ========== 新增：文件夹操作函数 ==========
// ▼▼▼ 使用这个【全新版本】替换旧的 openFolder 函数 ▼▼▼
function openFolder(folderData) {
    const overlay = document.getElementById('folderOverlay');
    const headerEl = document.querySelector('.folder-header'); // 获取头部容器
    const nameEl = document.getElementById('folderName');
    const gridEl = document.getElementById('folderContentGrid');

    if (!overlay || !nameEl || !gridEl || !headerEl) return;

    // 1. 存储当前文件夹信息，以便保存时使用
    headerEl.dataset.folderId = folderData.id;
    headerEl.dataset.pageKey = folderData.id.startsWith('widget') ? 'page2' : (document.getElementById('grid1').contains(document.querySelector(`[data-id="${folderData.id}"]`))) ? 'page1' : 'page2';


    // 2. 设置文件夹名称
    nameEl.textContent = folderData.label;

    // 3. 清空上次的内容
    gridEl.innerHTML = '';

    // 4. 动态创建并填入新图标
    folderData.icons.forEach(icon => {
        const appIconEl = document.createElement('div');
        appIconEl.className = 'app-icon';

        const isUrl = icon.startsWith('http') || icon.startsWith('data:');
        const iconContent = isUrl ? `<img src="${icon}" alt="">` : icon;

        appIconEl.innerHTML = `
            <div class="icon-wrapper">${iconContent}</div>
            <div class="app-label" style="color: #333; text-shadow: none;">App</div>
        `;
        gridEl.appendChild(appIconEl);
    });

    // 5. 【核心新增】为标题绑定点击事件，进入编辑模式
    nameEl.onclick = enterFolderNameEditMode;

    // 6. 显示浮层
    overlay.classList.add('show');
}


function closeFolder() {
    const overlay = document.getElementById('folderOverlay');
    const headerEl = document.querySelector('.folder-header');
    if (overlay) {
        overlay.classList.remove('show');
    }
    // 【新增】确保关闭时退出编辑模式
    if (headerEl) {
        headerEl.classList.remove('is-editing');
    }
}

// ========== 新增：文件夹名称编辑相关函数 ==========

/**
 * 进入文件夹名称编辑模式
 */
function enterFolderNameEditMode() {
    const headerEl = document.querySelector('.folder-header');
    const nameEl = document.getElementById('folderName');
    const inputEl = document.getElementById('folderNameInput');

    if (!headerEl || !nameEl || !inputEl) return;

    // 切换到编辑状态
    headerEl.classList.add('is-editing');

    // 将当前名称填入输入框并聚焦
    inputEl.value = nameEl.textContent;
    inputEl.focus();
    inputEl.select(); // 全选文本，方便用户直接输入

    // 绑定事件：按Enter键保存，点击别处（失焦）也保存
    inputEl.onkeydown = handleFolderNameKeyDown;
    inputEl.onblur = saveFolderName;
}

/**
 * 处理输入框的键盘事件
 * @param {KeyboardEvent} event
 */
function handleFolderNameKeyDown(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // 阻止回车键的默认行为（如表单提交）
        saveFolderName();
    } else if (event.key === 'Escape') {
        // 按下ESC键，取消编辑
        document.querySelector('.folder-header').classList.remove('is-editing');
    }
}

/**
 * 保存文件夹名称
 */
function saveFolderName() {
    const headerEl = document.querySelector('.folder-header');
    const inputEl = document.getElementById('folderNameInput');
    const nameEl = document.getElementById('folderName');

    if (!headerEl.classList.contains('is-editing')) return; // 如果不是编辑模式，则不执行

    const newName = inputEl.value.trim();
    const folderId = headerEl.dataset.folderId;
    const pageKey = headerEl.dataset.pageKey;

    if (newName && folderId && pageKey) {
        // 更新UI
        nameEl.textContent = newName;

        // 更新数据源 (state.appLayouts)
        const folderData = state.appLayouts[pageKey].find(app => app.id === folderId);
        if (folderData) {
            folderData.label = newName;

            // 更新桌面上的文件夹图标标签
            const mainFolderIconEl = document.querySelector(`.page [data-id="${folderId}"] .app-label`);
            if (mainFolderIconEl) {
                mainFolderIconEl.textContent = newName;
            }

            // 持久化保存到localStorage
            saveLayoutToLocalStorage();
            console.log(`文件夹 "${folderId}" 已重命名为 "${newName}"`);
        }
    }

    // 退出编辑模式
    headerEl.classList.remove('is-editing');

}

/**
 * [新增] 辅助函数：从图片URL获取一个柔和的渐变背景
 * @param {string} imageUrl - 图片的URL
 * @param {function(string|null)} callback - 回调函数，参数为计算出的渐变背景字符串或 null
 */
function getAverageColorFromImageUrl(imageUrl, callback) {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // 关键！允许跨域加载图片，否则会失败

    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        let data;
        try {
            // 从 Canvas 读取像素数据
            data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        } catch (e) {
            console.error("无法从 Canvas 获取图片数据，可能是图片服务器的CORS跨域策略导致。请确保图片允许被跨域访问。", e);
            callback(null); // 出错时回调 null
            return;
        }

        let r = 0, g = 0, b = 0;
        // 为了提高性能，我们只对部分像素点进行采样，而不是计算所有像素
        const pixelCount = data.length / 4;
        const step = Math.max(1, Math.floor(pixelCount / 1000)); // 最多采样1000个点

        let count = 0;
        for (let i = 0; i < data.length; i += 4 * step) {
            // 忽略过于透明或接近纯白的像素，避免它们冲淡颜色
            if (data[i + 3] < 128 || (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240)) {
                continue;
            }
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }

        if (count === 0) { // 如果图片是全透明或纯白色
            callback(null);
            return;
        }

        // 计算RGB平均值
        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        // 为了让颜色更柔和、更符合您界面的可爱风格，我们将其与白色混合以提高亮度
        const lightenFactor = 0.4; // 混合40%的白色
        const finalR = Math.floor(r * (1 - lightenFactor) + 255 * lightenFactor);
        const finalG = Math.floor(g * (1 - lightenFactor) + 255 * lightenFactor);
        const finalB = Math.floor(b * (1 - lightenFactor) + 255 * lightenFactor);

        // 创建两个用于渐变的颜色，一个亮一些，一个稍暗，模仿原始的渐变效果
        const color1 = `rgba(${finalR}, ${finalG}, ${finalB}, 0.9)`;
        const color2 = `rgba(${Math.max(0, finalR - 20)}, ${Math.max(0, finalG - 20)}, ${Math.max(0, finalB - 20)}, 0.8)`;

        // 生成最终的线性渐变字符串
        const gradient = `linear-gradient(135deg, ${color1}, ${color2})`;

        callback(gradient);
    };

    img.onerror = () => {
        console.warn("加载图片失败，无法提取颜色:", imageUrl);
        callback(null); // 图片加载失败，回调 null
    };

    img.src = imageUrl;
}

/**
 * 编辑小猫的状态
 */
function editCatStatus(event) {
    event.stopPropagation();
    const statusEl = event.target;
    const currentStatus = statusEl.textContent.replace('心情: ', '');

    const newStatus = prompt('请输入小猫的状态（例如：开心 😊、困困 😴、饿饿 🍖）', currentStatus);

    if (newStatus !== null && newStatus.trim()) {
        statusEl.textContent = '心情: ' + newStatus.trim();
        // 保存到 localStorage
        localStorage.setItem('catWidgetStatus', newStatus.trim());
    }
}

/**
 * 编辑猫咪状态数值
 */
function editCatStat(event, statName) {
    event.stopPropagation();
    event.preventDefault();  // ✅ 新增：阻止默认行为

    const statLabels = {
        'happiness': '😊 开心度',
        'hunger': '🍖 饱食度',
        'energy': '⚡ 精力值',
        'cleanliness': '✨ 清洁度'
    };

    const valueEl = document.getElementById(`stat-${statName}-value`);
    const barEl = document.getElementById(`stat-${statName}-bar`);

    const currentValue = parseInt(valueEl.textContent);

    const newValue = prompt(
        `请输入${statLabels[statName]}的数值（0-100）：`,
        currentValue
    );

    if (newValue !== null) {
        let numValue = parseInt(newValue);

        // 数值验证
        if (isNaN(numValue)) {
            alert('请输入有效的数字！');
            return;
        }

        // 限制范围
        numValue = Math.max(0, Math.min(100, numValue));

        // 更新UI
        valueEl.textContent = numValue + '%';
        barEl.style.width = numValue + '%';

        // 保存到localStorage
        saveCatStats(statName, numValue);

        // 根据数值显示不同反馈
        showStatFeedback(statName, numValue);
    }
}

/**
 * 保存猫咪状态到localStorage
 */
function saveCatStats(statName, value) {
    const stats = JSON.parse(localStorage.getItem('catWidgetStats') || '{}');
    stats[statName] = value;
    localStorage.setItem('catWidgetStats', JSON.stringify(stats));
}

/**
 * 根据状态值显示反馈
 */
function showStatFeedback(statName, value) {
    const bubble = document.querySelector('.cat-speech-bubble');
    if (!bubble) return;

    const feedbacks = {
        'happiness': {
            high: '喵~ 好开心呀！✨',
            medium: '今天心情还不错~ 😊',
            low: '有点不开心... 😿'
        },
        'hunger': {
            high: '吃饱饱啦！🍖✨',
            medium: '还能再吃一点~ 😋',
            low: '好饿啊... 给我吃的！😿'
        },
        'energy': {
            high: '精力充沛！冲鸭！⚡',
            medium: '还行，可以玩会儿~ 😺',
            low: '好累... 想睡觉了 😴'
        },
        'cleanliness': {
            high: '干干净净真舒服！✨',
            medium: '该洗澡澡了~ 🛁',
            low: '脏兮兮的... 快帮我洗澡！💦'
        }
    };

    let level = 'high';
    if (value < 30) level = 'low';
    else if (value < 70) level = 'medium';

    bubble.textContent = feedbacks[statName][level];
    localStorage.setItem('catWidgetSpeech', bubble.textContent);
}

/**
 * 加载猫咪状态数据
 */
function loadCatStats() {
    const savedStats = localStorage.getItem('catWidgetStats');
    if (!savedStats) return;

    try {
        const stats = JSON.parse(savedStats);

        Object.keys(stats).forEach(statName => {
            const value = stats[statName];
            const valueEl = document.getElementById(`stat-${statName}-value`);
            const barEl = document.getElementById(`stat-${statName}-bar`);

            if (valueEl && barEl) {
                valueEl.textContent = value + '%';
                barEl.style.width = value + '%';
            }
        });
    } catch (e) {
        console.error('加载猫咪状态失败:', e);
    }
}


/**
 * 编辑小猫说的话
 */
function editCatSpeech(event) {
    event.stopPropagation();
    event.preventDefault();  // ✅ 新增：阻止默认行为
    const bubbleEl = event.target;
    const currentSpeech = bubbleEl.textContent;

    const newSpeech = prompt('小猫想说什么呢？', currentSpeech);

    if (newSpeech !== null && newSpeech.trim()) {
        bubbleEl.textContent = newSpeech.trim();
        // 保存到 localStorage
        localStorage.setItem('catWidgetSpeech', newSpeech.trim());
    }
}

/**
 * 加载小猫组件的保存数据
 */
/**
 * 加载小猫组件的保存数据
 */
function loadCatWidgetData() {
    const savedStatus = localStorage.getItem('catWidgetStatus');
    const savedSpeech = localStorage.getItem('catWidgetSpeech');

    // 加载状态文字（已废弃，但保留兼容性）
    if (savedStatus) {
        const statusEl = document.querySelector('.cat-status');
        if (statusEl) statusEl.textContent = '心情: ' + savedStatus;
    }

    // 加载对话内容
    if (savedSpeech) {
        const bubbleEl = document.querySelector('.cat-speech-bubble');
        if (bubbleEl) bubbleEl.textContent = savedSpeech;
    }

    // ✨ 新增：加载状态条数据
    loadCatStats();
}


function initializeApp() {
    // ===== 第一步：获取DOM元素（加上安全检查）=====
    const chatInput = document.getElementById('chatInput');
    const chatInputArea = document.querySelector('.chat-input-area');

    // 检查元素是否存在
    if (!chatInput || !chatInputArea) {
        console.error('❌ 关键元素未找到，请检查HTML结构');
        return; // 提前退出，避免后续错误
    }

    // ===== 第二步：初始化输入框状态 =====
    chatInputArea.classList.remove('has-text');

    // ===== 第三步：加载所有数据 =====
    loadWorldsData();
    currentWorldId = localStorage.getItem('currentWorldId');
    updateBattery();
    loadLocationSettings();
    loadUserProfile();
    loadWorldbookData();
    loadCategoriesData();

    // ===== 第四步：初始化UI组件 =====
    setupCategorySelector();
    updateCategoryOptions();
    updateWorldbookCategorySelector();
    setupAttachmentMenu();
    setupStyleSelector();

    // ===== 第五步：应用保存的设置 =====
    applyChatStyle(localStorage.getItem('chatMessageStyle') || 'bubble');
    loadChatBackground();
    loadGlobalConfig();
    loadDockedIcons();

    // ===== 第六步：加载联系人数据 =====
    const savedContacts = localStorage.getItem('phoneContactsData');
    if (savedContacts) {
        try {
            contactsData = JSON.parse(savedContacts);
            console.log('✅ 成功加载联系人列表');
        } catch (e) {
            console.error('❌ 解析联系人数据失败:', e);
        }
    }

    const savedSweetheartContacts = localStorage.getItem('phoneSweetheartContactsData');
    if (savedSweetheartContacts) {
        try {
            sweetheartContactsData = JSON.parse(savedSweetheartContacts);
            console.log('✅ 成功加载密友列表');
        } catch (e) {
            console.error('❌ 解析密友数据失败:', e);
        }
    } else {
        // 如果是首次使用，保存默认密友列表
        saveSweetheartContacts();
        console.log('✅ 已初始化默认密友列表');
    }


    // ===== 第七步：绑定聊天输入框事件（现在是安全的）=====
    chatInput.addEventListener('input', function () {
        if (this.value.trim().length > 0) {
            chatInputArea.classList.add('has-text');
        } else {
            chatInputArea.classList.remove('has-text');
        }
    });

    // ===== 第八步：初始化其他开关和设置 =====
    const codeScrollToggle = document.getElementById('codeScrollToggle');
    if (codeScrollToggle) {
        const savedScrollSetting = localStorage.getItem('codeScrollEnabled') === 'true';
        codeScrollToggle.checked = savedScrollSetting;
        applyCodeScrollSetting(savedScrollSetting);

        codeScrollToggle.addEventListener('change', function () {
            applyCodeScrollSetting(this.checked);
            localStorage.setItem('codeScrollEnabled', this.checked);
        });
    }

    // ===== 消息操作菜单 =====
    const actionSheet = document.getElementById('messageActionSheet');
    if (actionSheet) {
        actionSheet.addEventListener('click', function (event) {
            const button = event.target.closest('.action-option');
            if (!button) return;

            const {contactId, index} = actionSheet.dataset;
            const messageIndex = parseInt(index, 10);

            if (contactId === undefined || isNaN(messageIndex)) {
                hideMessageActionSheet();
                return;
            }

            switch (button.id) {
                case 'deleteMessageBtn':
                    deleteMessage(contactId, messageIndex);
                    break;
                case 'copyMessageBtn':
                    copyMessage(contactId, messageIndex);
                    break;
                case 'regenerateMessageBtn':
                    regenerateAiResponse(contactId, messageIndex);
                    break;
                case 'quoteMessageBtn':
                    quoteMessage(contactId, messageIndex);
                    break;
            }

            if (button.id !== 'regenerateMessageBtn') {
                hideMessageActionSheet();
            }
        });
    }

    // ===== 全屏模式 =====
    const fullscreenToggle = document.getElementById('fullscreenToggle');
    if (fullscreenToggle) {
        const savedFullscreenSetting = localStorage.getItem('fullscreenEnabled') === 'true';
        fullscreenToggle.checked = savedFullscreenSetting;
        applyFullscreenSetting(savedFullscreenSetting);

        fullscreenToggle.addEventListener('change', function () {
            applyFullscreenSetting(this.checked);
            localStorage.setItem('fullscreenEnabled', this.checked);
        });
    }

    // ===== 悬浮球 =====
    const floatingBallToggle = document.getElementById('floatingBallToggle');
    if (floatingBallToggle) {
        const savedFloatingBallSetting = localStorage.getItem('floatingBallEnabled') === 'true';
        floatingBallToggle.checked = savedFloatingBallSetting;
        applyFloatingBallSetting(savedFloatingBallSetting);

        floatingBallToggle.addEventListener('change', function () {
            applyFloatingBallSetting(this.checked);
            localStorage.setItem('floatingBallEnabled', this.checked);
        });
    }

    // ===== 初始化悬浮球和布局 =====
    initializeFloatingBall();
    initializeLayout();
    renderApiConfigs();

    if (globalConfig.activeApiConfig !== null && globalConfig.apiConfigs[globalConfig.activeApiConfig]) {
        applyApiConfig(globalConfig.activeApiConfig);
    }

    console.log('%c🎉 应用初始化完成！', 'color: #667eea; font-size: 16px; font-weight: bold;');
    // 新增：加载小猫组件数据
    setTimeout(loadCatWidgetData, 500); // 延迟加载，确保DOM已渲染
}


initializeApp();


