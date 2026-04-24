const { request, BASE_URL } = require('../../utils/request')

Page({
  data: {
    id: null,
    isEdit: false,

    petTypeOptions: ['猫咪', '狗狗', '其他'],
    genderOptions: ['弟弟', '妹妹'],
    attackOptions: ['具有攻击性', '没有攻击性'],
    vaccineOptions: ['已接种', '未接种'],

    // 预设标签名
    presetTagNames: ['黏人', '活泼', '怕生', '亲人', '爱叫', '需陪玩', '胆小', '爱干净'],

    // 标签对象数组
    tagOptions: [
      { name: '黏人', active: false },
      { name: '活泼', active: false },
      { name: '怕生', active: false },
      { name: '亲人', active: false },
      { name: '爱叫', active: false },
      { name: '需陪玩', active: false },
      { name: '胆小', active: false },
      { name: '爱干净', active: false }
    ],

    customTagInput: '',

    petTypeIndex: 0,
    genderIndex: 0,
    attackIndex: 1,
    vaccineIndex: 0,

    form: {
      avatarUrl: '',
      type: '猫咪',
      name: '',
      age: '',
      gender: '弟弟',
      weight: '',
      breed: '',
      tags: [],
      hasAggression: 0,
      vaccinated: 1,
      intro: '',
      albumList: []
    }
  },

  onLoad(options) {
    const id = options.id ? Number(options.id) : null

    this.setData({
      id,
      isEdit: !!id,
      tagOptions: this.buildTagOptions(this.data.presetTagNames, []),
      customTagInput: '',
      form: {
        avatarUrl: '',
        type: '猫咪',
        name: '',
        age: '',
        gender: '弟弟',
        weight: '',
        breed: '',
        tags: [],
        hasAggression: 0,
        vaccinated: 1,
        intro: '',
        albumList: []
      },
      petTypeIndex: 0,
      genderIndex: 0,
      attackIndex: 1,
      vaccineIndex: 0
    })

    if (id) {
      this.loadDetail(id)
    }
  },

  buildTagOptions(tagNames = [], selectedTags = []) {
    return tagNames.map(name => ({
      name,
      active: selectedTags.indexOf(name) !== -1
    }))
  },

  syncFormTags() {
    const tags = this.data.tagOptions
      .filter(item => item.active)
      .map(item => item.name)

    this.setData({
      'form.tags': tags
    })
  },

  navigateBack() {
    const pages = getCurrentPages()

    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.reLaunch({
            url: '/pages/pet-list/index'
          })
        }
      })
    } else {
      wx.reLaunch({
        url: '/pages/pet-list/index'
      })
    }
  },

  loadDetail(id) {
    request(`/api/pet/detail?id=${id}`, 'GET')
      .then((data) => {
        const type = data.type || '猫咪'
        const gender = data.gender || '弟弟'
        const hasAggression = Number(data.hasAggression || 0)
        const vaccinated = Number(data.vaccinated || 1)
        const tags = Array.isArray(data.tags) ? data.tags : []

        const mergedTagNames = [...this.data.presetTagNames]
        tags.forEach(tag => {
          if (tag && mergedTagNames.indexOf(tag) === -1) {
            mergedTagNames.push(tag)
          }
        })

        this.setData({
          petTypeIndex: this.data.petTypeOptions.indexOf(type) > -1 ? this.data.petTypeOptions.indexOf(type) : 0,
          genderIndex: this.data.genderOptions.indexOf(gender) > -1 ? this.data.genderOptions.indexOf(gender) : 0,
          attackIndex: hasAggression === 1 ? 0 : 1,
          vaccineIndex: vaccinated === 1 ? 0 : 1,
          tagOptions: this.buildTagOptions(mergedTagNames, tags),
          form: {
            avatarUrl: data.avatarUrl || '',
            type,
            name: data.name || '',
            age: data.age || '',
            gender,
            weight: data.weight || '',
            breed: data.breed || '',
            tags,
            hasAggression,
            vaccinated,
            intro: data.intro || '',
            albumList: data.albumList || []
          }
        })
      })
      .catch(() => {})
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value

    this.setData({
      [`form.${field}`]: value
    })
  },

  choosePetType(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({
      petTypeIndex: index,
      'form.type': this.data.petTypeOptions[index]
    })
  },

  chooseGender(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({
      genderIndex: index,
      'form.gender': this.data.genderOptions[index]
    })
  },

  chooseAttack(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({
      attackIndex: index,
      'form.hasAggression': index === 0 ? 1 : 0
    })
  },

  chooseVaccine(e) {
    const index = Number(e.currentTarget.dataset.index)
    this.setData({
      vaccineIndex: index,
      'form.vaccinated': index === 0 ? 1 : 0
    })
  },

  toggleTag(e) {
    const index = Number(e.currentTarget.dataset.index)
    const tagOptions = [...this.data.tagOptions]

    tagOptions[index] = {
      ...tagOptions[index],
      active: !tagOptions[index].active
    }

    this.setData({
      tagOptions
    })

    this.syncFormTags()
  },

  onCustomTagInput(e) {
    this.setData({
      customTagInput: (e.detail.value || '').trim()
    })
  },

  addCustomTag() {
    const value = (this.data.customTagInput || '').trim()

    if (!value) {
      wx.showToast({
        title: '请输入标签内容',
        icon: 'none'
      })
      return
    }

    if (value.length > 6) {
      wx.showToast({
        title: '标签最多6个字',
        icon: 'none'
      })
      return
    }

    const tagOptions = [...this.data.tagOptions]
    const existIndex = tagOptions.findIndex(item => item.name === value)

    if (existIndex > -1) {
      tagOptions[existIndex] = {
        ...tagOptions[existIndex],
        active: true
      }
    } else {
      tagOptions.push({
        name: value,
        active: true
      })
    }

    this.setData({
      tagOptions,
      customTagInput: ''
    })

    this.syncFormTags()
  },

  chooseAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.uploadImage(res.tempFiles[0].tempFilePath, 'avatarUrl')
      }
    })
  },

  chooseAlbum() {
    wx.chooseMedia({
      count: 9,
      mediaType: ['image'],
      success: (res) => {
        const files = res.tempFiles || []
        files.forEach(file => {
          this.uploadAlbumImage(file.tempFilePath)
        })
      }
    })
  },

  uploadAlbumImage(filePath) {
    wx.uploadFile({
      url: `${BASE_URL}/api/files/upload-image`,
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0 && data.data && data.data.url) {
            const albumList = [...this.data.form.albumList, data.data.url]
            this.setData({
              'form.albumList': albumList
            })
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
          }
        } catch (e) {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      }
    })
  },

  uploadImage(filePath, field) {
    wx.uploadFile({
      url: `${BASE_URL}/api/files/upload-image`,
      filePath,
      name: 'file',
      success: (res) => {
        try {
          const data = JSON.parse(res.data)
          if (data.code === 0 && data.data && data.data.url) {
            this.setData({
              [`form.${field}`]: data.data.url
            })
          } else {
            wx.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
          }
        } catch (e) {
          wx.showToast({
            title: '上传失败',
            icon: 'none'
          })
        }
      },
      fail: () => {
        wx.showToast({
          title: '上传失败',
          icon: 'none'
        })
      }
    })
  },

  removeAlbumImage(e) {
    const index = Number(e.currentTarget.dataset.index)
    const albumList = [...this.data.form.albumList]
    albumList.splice(index, 1)
    this.setData({
      'form.albumList': albumList
    })
  },

  validateForm() {
    const { form } = this.data

    if (!form.avatarUrl) {
      wx.showToast({ title: '请上传宠物头像', icon: 'none' })
      return false
    }
    if (!form.name) {
      wx.showToast({ title: '请输入宠物名字', icon: 'none' })
      return false
    }
    if (!form.age) {
      wx.showToast({ title: '请输入宠物年龄', icon: 'none' })
      return false
    }
    if (!form.weight) {
      wx.showToast({ title: '请输入宠物体重', icon: 'none' })
      return false
    }
    if (!form.breed) {
      wx.showToast({ title: '请输入宠物品种', icon: 'none' })
      return false
    }

    return true
  },

  savePet() {
    if (!this.validateForm()) return

    const currentUser = wx.getStorageSync('currentUser') || { id: 1 }
    const { form, isEdit, id } = this.data

    const payload = {
      userId: currentUser.id,
      avatarUrl: form.avatarUrl,
      type: form.type,
      name: form.name,
      age: form.age,
      gender: form.gender,
      weight: form.weight,
      breed: form.breed,
      tags: form.tags,
      hasAggression: form.hasAggression,
      vaccinated: form.vaccinated,
      intro: form.intro,
      albumList: form.albumList
    }

    if (isEdit) {
      payload.id = id
    }

    request(isEdit ? '/api/pet/update' : '/api/pet/create', 'POST', payload)
      .then((data) => {
        wx.showToast({
          title: isEdit ? '保存成功' : '新增成功',
          icon: 'success'
        })

        if (!isEdit && data && data.id) {
          wx.setStorageSync('latestPetId', data.id)
        }

        setTimeout(() => {
          this.navigateBack()
        }, 500)
      })
      .catch(() => {})
  }
})
