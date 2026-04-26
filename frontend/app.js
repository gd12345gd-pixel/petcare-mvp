const { installToastPatch } = require('./utils/toast-patch')

installToastPatch()

App({ globalData: { userId: 1 } })