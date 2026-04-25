const { request } = require('../../utils/request')
const { getCurrentUser, getToken } = require('../../utils/auth')
const { QQMAP_KEY } = require('../../utils/qqmap-config')

Page({
  data: {
    locationDisplay: '当前定位',
    locationSubText: '用于匹配附近托托师',
    currentAddress: null,

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

    latestFeed: []
  },

  onShow() {
    this.loadHomeLocation()
    this.loadLatestCommunityFeed()
  },

  loadHomeLocation() {
    const selectedAddress = wx.getStorageSync('selectedServiceAddress')
    if (selectedAddress) {
      this.setHomeAddress(selectedAddress)
      return
    }

    const currentUser = getCurrentUser()
    if (!(getToken() && currentUser && currentUser.id)) {
      this.resolveGuestLocation()
      return
    }

    request(`/api/address/list?userId=${currentUser.id}`, 'GET', {}, { silent: true })
      .then((list) => {
        const defaultAddress = (list || []).find(item => item.isDefault === 1)
        if (defaultAddress) {
          this.setHomeAddress(defaultAddress)
        }
      })
      .catch(() => {})
  },

  setHomeAddress(address) {
    const district = address.district || address.city || ''
    const detail = address.detailAddress || address.fullAddress || ''
    const locationDisplay = detail || address.fullAddress || district || '当前定位'
    const locationSubText = district || '用于匹配附近托托师'

    this.setData({
      currentAddress: address,
      locationDisplay,
      locationSubText
    })
  },

  resolveGuestLocation() {
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: false,
      success: (res) => {
        this.reverseGeocodeLocation(res.latitude, res.longitude)
      },
      fail: () => {
        this.setData({
          currentAddress: null,
          locationDisplay: '当前定位',
          locationSubText: '用于匹配附近托托师'
        })
      }
    })
  },

  reverseGeocodeLocation(latitude, longitude) {
    wx.request({
      url: 'https://apis.map.qq.com/ws/geocoder/v1/',
      method: 'GET',
      data: {
        location: `${latitude},${longitude}`,
        key: QQMAP_KEY
      },
      success: (res) => {
        const data = res.data || {}
        const result = data.result || {}
        const ac = result.address_component || {}
        const display = this.formatGuestLocationDisplay(ac, result)
        this.setData({
          currentAddress: null,
          locationDisplay: display,
          locationSubText: '用于匹配附近托托师'
        })
      },
      fail: () => {
        this.setData({
          currentAddress: null,
          locationDisplay: '当前定位',
          locationSubText: '用于匹配附近托托师'
        })
      }
    })
  },

  formatGuestLocationDisplay(ac, result) {
    const districtText = [ac.city, ac.district].filter(Boolean).join(' ')
    if (districtText) return districtText
    if (ac.district) return ac.district
    if (ac.city) return ac.city
    if (result.address) return result.address
    return '当前定位'
  },

  goChooseLocation() {
    wx.navigateTo({
      url: '/pages/address-list/index?from=home'
    })
  },

  handleSearchTap() {
    wx.showToast({
      title: '搜索功能完善中',
      icon: 'none'
    })
  },

  goBooking() {
    wx.navigateTo({
      url: '/pages/service-detail/index'
    })
  },

  goPetCommunity() {
    wx.navigateTo({
      url: '/pages/pet-community/index'
    })
  },

  goCommunityByType(e) {
    const type = e.currentTarget.dataset.type || 'lost'
    wx.navigateTo({
      url: `/pages/pet-community/index?type=${type === 'found' ? 'found' : 'lost'}`
    })
  },

  loadLatestCommunityFeed() {
    Promise.all([
      request('/api/pet-community/lost/list', 'GET', {}, { silent: true }).catch(() => []),
      request('/api/pet-community/found/list', 'GET', {}, { silent: true }).catch(() => [])
    ]).then(([lostList, foundList]) => {
      const feed = [
        ...(lostList || []).slice(0, 2).map(item => this.formatCommunityFeed(item, 'lost')),
        ...(foundList || []).slice(0, 2).map(item => this.formatCommunityFeed(item, 'found'))
      ]
        .filter(item => item.id)
        .slice(0, 2)

      this.setData({ latestFeed: feed })
    })
  },

  formatCommunityFeed(item, type) {
    const titlePrefix = type === 'lost' ? '寻宠' : '寻主'
    const petName = item.petName || (type === 'lost' ? '走失宠物' : '待认领宠物')
    const district = item.district || item.city || '附近'
    return {
      id: item.id,
      type,
      title: `${titlePrefix} · ${petName}`,
      subtitle: `${district} · ${item.timeText || '刚刚发布'}`,
      imageUrl: item.imageUrl || 'https://dummyimage.com/300x220/fff1f5/ff6b81.png&text=PET'
    }
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
