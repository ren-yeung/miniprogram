/**
 * @file 自定义TabBar组件
 * 宠物社区小程序 - 底部导航栏
 */

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 当前选中的索引
    activeIndex: {
      type: Number,
      value: 0
    },
    // 是否有未读消息
    hasMessage: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // TabBar项目配置
    tabs: [
      { icon: '🏠', activeIcon: '🏠', text: '首页' },
      { icon: '🔍', activeIcon: '🔍', text: '发现' },
      { icon: '➕', activeIcon: '➕', text: '发布', isSpecial: true },
      { icon: '💬', activeIcon: '💬', text: '消息' },
      { icon: '👤', activeIcon: '👤', text: '我的' }
    ]
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * TabBar点击处理
     */
    onTabTap(e) {
      const index = e.currentTarget.dataset.index;
      
      if (index === this.data.activeIndex) return;
      
      this.triggerEvent('change', { index });
    }
  }
});
