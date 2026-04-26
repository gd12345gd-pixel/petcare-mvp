const { request } = require('../../../utils/request')

Page({
  data: {
    loading: true,
    levelList: [],
    currentLevel: '',
    currentLevelName: '',
    todayAcceptedCount: 0,
    dailyOrderLimit: 0,
    remainToUpgrade: 0,
    nextLevelCode: '',
    nextDailyOrderLimit: 0,
    maxLevel: false
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
      const [ruleRes, growthRes] = await Promise.all([
        request('/api/sitter/rules', 'GET'),
        request('/api/sitter/growth', 'GET')
      ])

      const levelRules = (ruleRes && ruleRes.levelRules) || []
      const levelList = levelRules.map((item) => ({
        level: this.normalizeLevelCode(item.levelCode),
        levelCode: item.levelCode || '',
        name: item.levelName || '未命名等级',
        maxOrders: Number(item.dailyOrderLimit || 0)
      }))

      this.setData({
        levelList,
        currentLevel: this.normalizeLevelCode(growthRes && growthRes.levelCode),
        currentLevelName: (growthRes && growthRes.levelName) || '',
        todayAcceptedCount: Number((growthRes && growthRes.todayAcceptedCount) || 0),
        dailyOrderLimit: Number((growthRes && growthRes.dailyOrderLimit) || 0),
        remainToUpgrade: Number((growthRes && growthRes.remainToUpgrade) || 0),
        nextLevelCode: this.normalizeLevelCode(growthRes && growthRes.nextLevelCode),
        nextDailyOrderLimit: Number((growthRes && growthRes.nextDailyOrderLimit) || 0),
        maxLevel: !!(growthRes && growthRes.maxLevel),
        loading: false
      })
    } catch (err) {
      console.error('load rule page error', err)
      this.setData({ loading: false })
    }
  },

  normalizeLevelCode(levelCode) {
    if (!levelCode) return '--'
    return String(levelCode).replace(/^L/i, '')
  },

  goGrowth() {
    wx.navigateTo({ url: '/pages/sitter/growth/index' })
  }
})
