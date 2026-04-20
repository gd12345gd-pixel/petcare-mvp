Page({
  data: {
    hero: {
      title1: '上门喂猫 / 遛狗',
      desc: '全程记录 · 安全认证 · 服务可追溯',
      locationText: '上海 · 宝山区'
    },

    serviceTags: ['喂猫', '遛狗', '临时照护'],

    guarantees: [
      { icon: '✅', title: '实名托托师', desc: '平台审核上岗' },
      { icon: '🎥', title: '服务记录', desc: '图片 / 视频回传' },
      { icon: '📝', title: '服务可追溯', desc: '过程节点可查看' },
      { icon: '💬', title: '互助社区', desc: '寻宠 / 寻主 / 评论' }
    ],

    sitters: [
      {
        id: 1,
        name: 'Anna',
        score: '5.0',
        count: '已服务172次',
        distance: '2.1km',
        tags: ['已实名', '养猫经验'],
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop'
      },
      {
        id: 2,
        name: '小李',
        score: '4.9',
        count: '已服务96次',
        distance: '3.8km',
        tags: ['已实名', '遛狗经验'],
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop'
      }
    ],

    communityCards: [
      {
        type: 'lost',
        title: '寻宠',
        desc1: '查看附近走失信息',
        desc2: '地图查看 / 评论线索',
        imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=800&auto=format&fit=crop'
      },
      {
        type: 'found',
        title: '寻主',
        desc1: '捡到宠物找主人',
        desc2: '附近认领 / 互动留言',
        imageUrl: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=800&auto=format&fit=crop'
      }
    ],

    latestFeed: [
      {
        id: 1,
        type: 'lost',
        title: '柴犬走失',
        subtitle: '宝山区 · 2小时前',
        imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=400&auto=format&fit=crop'
      },
      {
        id: 2,
        type: 'found',
        title: '橘猫待认领',
        subtitle: '静安区 · 30分钟前',
        imageUrl: 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?q=80&w=400&auto=format&fit=crop'
      }
    ]
  },

  goBooking() {
    wx.navigateTo({
      url: '/pages/order-create/index'
    })
  },

  goPetCommunity() {
    wx.switchTab({
      url: '/pages/pet-community/index'
    })
  },

  goCommunityByType(e) {
    const type = e.currentTarget.dataset.type || 'lost'
    wx.setStorageSync('petCommunityDefaultTab', type === 'found' ? 'found' : 'lost')
    wx.switchTab({
      url: '/pages/pet-community/index'
    })
  },

  goLatestDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item) return

    wx.navigateTo({
      url: `/pages/pet-detail/index?id=${item.id}&type=${item.type}`
    })
  },

  goSitterList() {
    wx.showToast({
      title: '后续可接托托师列表页',
      icon: 'none'
    })
  }
})