const { request } = require('../../../utils/request')

Page({
  data: {
    loading: true,
    level: '--',
    levelName: '',
    growth: 0,
    nextGrowth: 0,
    credit: 0,
    percent: 0,
    need: 0,
    nextLevel: '--',
    maxLevel: false,
    records: []
  },

  onLoad() {
    this.loadData()
  },

  onShow() {
    this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const res = await request('/api/sitter/growth', 'GET')
      this.setData({
        level: this.normalizeLevelCode(res && res.levelCode),
        levelName: (res && res.levelName) || '',
        growth: Number((res && res.growthValue) || 0),
        nextGrowth: Number((res && res.nextGrowthValue) || 0),
        credit: Number((res && res.creditScore) || 0),
        percent: Number((res && res.growthPercent) || 0),
        need: Number((res && res.remainToUpgrade) || 0),
        nextLevel: this.normalizeLevelCode(res && res.nextLevelCode),
        maxLevel: !!(res && res.maxLevel),
        records: (res && res.records) || [],
        loading: false
      })
    } catch (err) {
      console.error('load growth page error', err)
      this.setData({ loading: false })
    }
  },

  normalizeLevelCode(levelCode) {
    if (!levelCode) return '--'
    return String(levelCode).replace(/^L/i, '')
  },

  goRules() {
    wx.navigateTo({ url: '/pages/sitter/rules/index' })
  }
})
