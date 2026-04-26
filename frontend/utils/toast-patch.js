/**
 * 修复原生 wx.showToast：title 过长时易出现竖排单字、难以阅读；默认停留时间过短。
 * 在 app.js 入口最先执行 installToastPatch()。
 */

function toastVisualUnits(title) {
  let units = 0
  for (const ch of String(title)) {
    if (/[\u4e00-\u9fff\u3400-\u4dbf\u3000-\u303f\uff00-\uffef]/.test(ch)) {
      units += 2
    } else {
      units += 1
    }
  }
  return units
}

function installToastPatch() {
  const nativeShowToast = wx.showToast.bind(wx)

  wx.showToast = function patchedShowToast(options) {
    if (!options || typeof options !== 'object') {
      return nativeShowToast(options)
    }
    if (options.icon === 'loading') {
      return nativeShowToast(options)
    }

    const title = options.title != null ? String(options.title) : ''
    if (!title) {
      return nativeShowToast(options)
    }

    // 约 7 个汉字等效宽度，超出则不用 toast，避免竖排异常
    if (toastVisualUnits(title) > 14) {
      wx.showModal({
        title: '提示',
        content: title,
        showCancel: false,
        confirmText: '知道了'
      })
      return
    }

    const raw = options.duration
    let duration
    if (raw == null || raw === undefined) {
      duration = options.icon === 'success' ? 2200 : 3000
    } else {
      const n = Number(raw)
      duration = Number.isNaN(n) ? 3000 : Math.min(Math.max(n, 2000), 6000)
    }

    return nativeShowToast({
      ...options,
      title,
      duration
    })
  }
}

module.exports = { installToastPatch }
