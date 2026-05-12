/**
 * @file 帖子卡片组件
 * 宠物社区小程序 - 瀑布流卡片
 */

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    post: {
      type: Object,
      value: {
        id: 0,
        title: '',
        image: '',
        category: '',
        categoryName: '',
        categoryColor: '',
        user: {
          name: '',
          avatar: ''
        },
        likes: 0,
        liked: false
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 点赞动画状态
    likeAnimating: false,
    // 卡片点击动画状态
    cardTapAnimating: false
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点赞处理
     */
    onLikeTap() {
      const postId = this.data.post.id;
      
      // 触发心跳动画
      this.setData({ likeAnimating: true });
      
      setTimeout(() => {
        this.setData({ likeAnimating: false });
      }, 300);
      
      // 通知父组件
      this.triggerEvent('like', { postId });
    },

    /**
     * 卡片点击处理
     */
    onCardTap() {
      // 触发动画
      this.setData({ cardTapAnimating: true });
      
      setTimeout(() => {
        this.setData({ cardTapAnimating: false });
      }, 100);
      
      // 通知父组件
      this.triggerEvent('tap', { postId: this.data.post.id });
    },

    /**
     * 图片加载完成
     */
    onImageLoad(e) {
      // 可以在这里获取图片实际高度来优化瀑布流
      // console.log('图片加载完成', e.detail);
    },

    /**
     * 图片加载失败
     */
    onImageError() {
      // 使用默认占位图
      console.log('图片加载失败');
    }
  }
});
