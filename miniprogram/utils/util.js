/**
 * @file 工具函数
 * 宠物社区小程序 - 通用工具函数
 */

/**
 * 格式化点赞数量
 * @param {number} count - 原始数量
 * @returns {string} 格式化后的字符串
 */
function formatCount(count) {
  if (count >= 100000) {
    return (count / 10000).toFixed(1) + 'w';
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return count.toString();
}

/**
 * 获取分类对应的颜色
 * @param {string} category - 分类ID
 * @returns {string} 颜色值
 */
function getCategoryColor(category) {
  const colorMap = {
    'all': '#FF6B6B',
    'dog': '#FF8EC4',
    'cat': '#6B9FFF',
    'rabbit': '#FF8EC4',
    'hamster': '#FFB366',
    'bird': '#FF6B6B',
    'reptile': '#B388FF',
    'medical': '#4ECDC4',
    'daily': '#7FD8A6',
    'goods': '#FFE66D',
    'food': '#FFE66D'
  };
  
  return colorMap[category] || '#FF6B6B';
}

/**
 * 获取分类对应的名称
 * @param {string} category - 分类ID
 * @returns {string} 分类名称
 */
function getCategoryName(category) {
  const nameMap = {
    'all': '推荐',
    'dog': '🐶 汪星人',
    'cat': '🐱 喵星人',
    'rabbit': '🐰 兔兔',
    'hamster': '🐹 仓鼠',
    'bird': '🦜 鸟类',
    'reptile': '🐢 爬宠',
    'medical': '🏥 医疗',
    'daily': '📷 日常',
    'goods': '🎁 好物',
    'food': '🍖 食谱'
  };
  
  return nameMap[category] || '🏠 萌宠';
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间(ms)
 */
function debounce(func, wait = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 间隔时间(ms)
 */
function throttle(func, wait = 300) {
  let timeout;
  return function(...args) {
    if (!timeout) {
      timeout = setTimeout(() => timeout = null, wait);
      func.apply(this, args);
    }
  };
}

/**
 * 格式化日期
 * @param {Date|string|number} date - 日期
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 生成随机ID
 * @returns {string} 随机ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 导出
module.exports = {
  formatCount,
  getCategoryColor,
  getCategoryName,
  debounce,
  throttle,
  formatDate,
  generateId
};
