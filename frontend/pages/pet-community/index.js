const { request } = require('../../utils/request')

Page({
  data: {
    city: '上海',
    activeTab: 'lost', // lost / found
    sortMode: 'latest', // latest / nearby
    radiusFilter: 'all', // 3 / 5 / all
    bannerVisible: true,
    lostList: [],
    foundList: [],
    loading: false,
    currentLatitude: null,
    currentLongitude: null,

    regionFilter: ['全部', '全部', '全部'],
    provinceFilter: '',
    cityFilterValue: '',
    districtFilter: ''
  },

  onLoad(options = {}) {
    const type = options.type === 'found' ? 'found' : 'lost'
    this.setData({ activeTab: type }, () => {
      this.loadCurrentTabData()
    })
  },

  onShow() {
    const defaultTab = wx.getStorageSync('petCommunityDefaultTab')
if (defaultTab) {
  this.setData({ activeTab: defaultTab })
  wx.removeStorageSync('petCommunityDefaultTab')
}
    this.loadCurrentTabData()
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab }, () => {
      this.loadCurrentTabData()
    })
  },

  switchSort(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({ sortMode: mode }, () => {
      if (mode === 'nearby') {
        this.getCurrentLocationAndLoad()
      } else {
        this.loadCurrentTabData()
      }
    })
  },

  switchRadius(e) {
    const radius = e.currentTarget.dataset.radius
    this.setData({
      radiusFilter: radius
    }, () => {
      if (this.data.sortMode === 'nearby') {
        this.getCurrentLocationAndLoad()
      }
    })
  },

  onRegionChange(e) {
    const region = e.detail.value || ['全部', '全部', '全部']
    const [province, city, district] = region

    this.setData({
      regionFilter: region,
      provinceFilter: province === '全部' ? '' : province,
      cityFilterValue: city === '全部' ? '' : city,
      districtFilter: district === '全部' ? '' : district
    }, () => {
      this.loadCurrentTabData()
    })
  },

  resetRegionFilter() {
    this.setData({
      regionFilter: ['全部', '全部', '全部'],
      provinceFilter: '',
      cityFilterValue: '',
      districtFilter: ''
    }, () => {
      this.loadCurrentTabData()
    })
  },

  getCurrentLocationAndLoad() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.setData({
          currentLatitude: res.latitude,
          currentLongitude: res.longitude
        }, () => {
          this.loadCurrentTabData()
        })
      },
      fail: () => {
        wx.showToast({
          title: '获取位置失败',
          icon: 'none'
        })
        this.setData({ sortMode: 'latest' }, () => {
          this.loadCurrentTabData()
        })
      }
    })
  },

  buildQueryParams(extra = {}) {
    const params = []

    if (this.data.provinceFilter) {
      params.push(`province=${encodeURIComponent(this.data.provinceFilter)}`)
    }
    if (this.data.cityFilterValue) {
      params.push(`city=${encodeURIComponent(this.data.cityFilterValue)}`)
    }
    if (this.data.districtFilter) {
      params.push(`district=${encodeURIComponent(this.data.districtFilter)}`)
    }

    Object.keys(extra).forEach(key => {
      const value = extra[key]
      if (value !== undefined && value !== null && value !== '') {
        params.push(`${key}=${encodeURIComponent(value)}`)
      }
    })

    return params.length ? `?${params.join('&')}` : ''
  },

  loadCurrentTabData() {
    if (this.data.activeTab === 'lost') {
      this.loadLostList()
    } else {
      this.loadFoundList()
    }
  },

  loadLostList() {
    this.setData({ loading: true })

    let api = '/api/pet-community/lost/list'

    if (
      this.data.sortMode === 'nearby' &&
      this.data.currentLatitude &&
      this.data.currentLongitude
    ) {
      const extra = {
        latitude: this.data.currentLatitude,
        longitude: this.data.currentLongitude
      }
      if (this.data.radiusFilter !== 'all') {
        extra.radiusKm = this.data.radiusFilter
      }
      api = '/api/pet-community/lost/nearby' + this.buildQueryParams(extra)
    } else {
      api += this.buildQueryParams()
    }

    request(api, 'GET')
      .then((data) => {
        this.setData({
          lostList: data || [],
          loading: false
        })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  loadFoundList() {
    this.setData({ loading: true })

    let api = '/api/pet-community/found/list'

    if (
      this.data.sortMode === 'nearby' &&
      this.data.currentLatitude &&
      this.data.currentLongitude
    ) {
      const extra = {
        latitude: this.data.currentLatitude,
        longitude: this.data.currentLongitude
      }
      if (this.data.radiusFilter !== 'all') {
        extra.radiusKm = this.data.radiusFilter
      }
      api = '/api/pet-community/found/nearby' + this.buildQueryParams(extra)
    } else {
      api += this.buildQueryParams()
    }

    request(api, 'GET')
      .then((data) => {
        this.setData({
          foundList: data || [],
          loading: false
        })
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  goPublish() {
    wx.navigateTo({
      url: `/pages/pet-publish/index?type=${this.data.activeTab}`
    })
  },

  goPublishType(e) {
    const type = e.currentTarget.dataset.type || this.data.activeTab
    wx.navigateTo({
      url: `/pages/pet-publish/index?type=${type}`
    })
  },

  goDetail(e) {
    const { id, type } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/pet-detail/index?id=${id}&type=${type}`
    })
  },

  goService() {
    wx.switchTab({
      url: '/pages/home/index'
    })
  },

  goMapPage() {
    wx.navigateTo({
      url: `/pages/pet-map/index?type=${this.data.activeTab}`
    })
  },

  onPullDownRefresh() {
    this.loadCurrentTabData()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  }
})