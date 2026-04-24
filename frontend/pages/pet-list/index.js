const { ensureLogin } = require('../../utils/auth')
const { request } = require('../../utils/request')
const { formatPetAge } = require('../../utils/pet-display')

Page({
  data: {
    pets: [],
    loading: false
  },

  onShow() {
    this.loadPetList()
  },

  navigateBack() {
    console.log('pet-list navigateBack clicked')

    const pages = getCurrentPages()
    console.log('pages stack length =', pages.length)
    console.log('pages route =', pages.map(p => p.route))

    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: (err) => {
          console.error('navigateBack fail:', err)
          wx.switchTab({
            url: '/pages/profile/index'
          })
        }
      })
    } else {
      wx.switchTab({
        url: '/pages/profile/index',
        fail: (err) => {
          console.error('switchTab fail:', err)
          wx.reLaunch({
            url: '/pages/profile/index'
          })
        }
      })
    }
  },

  loadPetList() {
    const currentUser = ensureLogin()

    this.setData({ loading: true })

    request(`/api/pet/list?userId=${currentUser.id}`, 'GET')
      .then((list) => {
        this.setData({
          pets: (list || []).map(item => ({
            ...item,
            ageText: formatPetAge(item.age)
          }))
        })
      })
      .catch(() => {})
      .finally(() => {
        this.setData({ loading: false })
      })
  },

  goAddPet() {
    wx.navigateTo({
      url: '/pages/pet-edit/index'
    })
  },

  goEditPet(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/pet-edit/index?id=${id}`
    })
  }
})
