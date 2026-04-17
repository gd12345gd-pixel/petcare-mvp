const { request } = require('../../utils/request')

Page({
  data: {
    type: 'lost', // lost / found
    latitude: 31.2304,
    longitude: 121.4737,
    scale: 12,
    markers: [],
    rawList: [],
    selectedItem: null,
    selectedId: null,
    mapHeight: '100vh',
    panelHeight: 380,
    currentIndex: 0,
    radiusFilter: 'all'
  },

  onLoad(options) {
    const type = options.type || 'lost'
    this.setData({ type })

    this.initLocationAndLoad()
  },

  initLocationAndLoad() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          latitude: res.latitude,
          longitude: res.longitude
        }, () => {
          this.loadMapData()
        })
      },
      fail: () => {
        wx.showModal({
          title: '需要定位权限',
          content: '用于展示附近的寻宠信息',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
        this.loadMapData()
      }
    })
  },
  switchRadius(e) {
    const radius = e.currentTarget.dataset.radius
    this.setData({
      radiusFilter: radius,
      selectedItem: null,
      selectedId: null,
      currentIndex: 0
    }, () => {
      this.loadMapData()
    })
  },
  loadMapData() {
    const { type, radiusFilter, latitude, longitude } = this.data
  
    let api = type === 'lost'
      ? '/api/pet-community/lost/list'
      : '/api/pet-community/found/list'
  
    if (latitude && longitude) {
      api = type === 'lost'
        ? `/api/pet-community/lost/nearby?latitude=${latitude}&longitude=${longitude}`
        : `/api/pet-community/found/nearby?latitude=${latitude}&longitude=${longitude}`
  
      if (radiusFilter !== 'all') {
        api += `&radiusKm=${radiusFilter}`
      }
    }
  
    request(api, 'GET')
      .then((data) => {
        const list = (data || []).filter(item => item.latitude && item.longitude)
  
        const markers = list.map((item) => ({
          id: Number(item.id),
          latitude: Number(item.latitude),
          longitude: Number(item.longitude),
          width: 32,
          height: 32,
          zIndex: 10,
          callout: {
            content: item.petName || (this.data.type === 'lost' ? '寻宠信息' : '寻主信息'),
            color: '#333333',
            fontSize: 12,
            borderRadius: 8,
            bgColor: '#ffffff',
            padding: 6,
            display: 'BYCLICK',
            textAlign: 'center'
          }
        }))
  
        const firstItem = list.length ? list[0] : null
  
        this.setData({
          rawList: list,
          markers,
          selectedItem: firstItem,
          selectedId: firstItem ? firstItem.id : null,
          currentIndex: 0,
          latitude: firstItem ? Number(firstItem.latitude) : this.data.latitude,
          longitude: firstItem ? Number(firstItem.longitude) : this.data.longitude,
          scale: firstItem ? 15 : 12
        })
      })
  },

  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      type,
      selectedItem: null,
      selectedId: null,
      markers: [],
      rawList: [],
      currentIndex: 0
    }, () => {
      this.loadMapData()
    })
  },

  onMarkerTap(e) {
    const markerId = Number(e.detail.markerId)
    const list = this.data.rawList
    const index = list.findIndex(item => Number(item.id) === markerId)

    if (index > -1) {
      const selected = list[index]
      this.setData({
        selectedItem: selected,
        selectedId: selected.id,
        currentIndex: index,
        latitude: Number(selected.latitude),
        longitude: Number(selected.longitude),
        scale: 15
      })
    }
  },

  onSwiperChange(e) {
    const index = e.detail.current
    const item = this.data.rawList[index]
    if (!item) return

    this.setData({
      currentIndex: index,
      selectedItem: item,
      selectedId: item.id,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      scale: 15
    })
  },

  selectCard(e) {
    const index = Number(e.currentTarget.dataset.index)
    const item = this.data.rawList[index]
    if (!item) return

    this.setData({
      currentIndex: index,
      selectedItem: item,
      selectedId: item.id,
      latitude: Number(item.latitude),
      longitude: Number(item.longitude),
      scale: 15
    })
  },

  goDetail() {
    const item = this.data.selectedItem
    if (!item) return

    wx.navigateTo({
      url: `/pages/pet-detail/index?id=${item.id}&type=${this.data.type}`
    })
  },

  goBack() {
    wx.navigateBack()
  }
})