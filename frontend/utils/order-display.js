/**
 * 用户/接单师共用的订单展示：今日是否有上门、面向用户的状态短文案（弱化内部枚举）
 */

function todayYmd() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function normalizeDateStr(s) {
  if (!s) return ''
  return String(s).slice(0, 10)
}

function orderHasServiceToday(item) {
  const ymd = todayYmd()
  const dates = item && item.serviceDates
  if (Array.isArray(dates) && dates.length) {
    return dates.some(d => normalizeDateStr(d) === ymd)
  }
  const a = normalizeDateStr(item && item.firstServiceDate)
  const b = normalizeDateStr(item && item.lastServiceDate)
  if (a && b && a <= ymd && ymd <= b) {
    return true
  }
  return a === ymd || b === ymd
}

function isInProgressOrderStatus(status) {
  return ['TAKEN', 'SERVING', 'PART_SERVING', 'PART_COMPLETED'].includes(status)
}

/** 宠物主列表/详情角标：一句话说清进度 */
function getUserOrderStatusSummary(item) {
  const s = (item && item.orderStatus) || ''
  const done = Number(item && item.completedServiceCount ? item.completedServiceCount : 0)
  const total = Number(item && item.serviceDateCount ? item.serviceDateCount : 0)

  if (s === 'CANCELLED') return '已取消'
  if (s === 'COMPLETED') return '全部已完成'
  if (s === 'EXCEPTION') return '需平台协助'

  if (s === 'WAIT_TAKING') {
    return item && item.canReschedule ? '等待接单 · 可改期' : '等待接单'
  }

  if (isInProgressOrderStatus(s)) {
    if (total > 0) {
      if (s === 'TAKEN') return `已接单 · 共${total}次上门 · 待开始`
      if (s === 'PART_COMPLETED') return `进行中 · 已完成${done}/${total}次 · 待后续上门`
      if (s === 'PART_SERVING' || s === 'SERVING') return `进行中 · 已完成${done}/${total}次 · 本次服务中`
    }
    return '进行中'
  }

  return '处理中'
}

/** 接单师「我的服务单」列表角标 */
function getSitterMineStatusSummary(item) {
  const s = (item && item.orderStatus) || ''
  const done = Number(item && item.completedServiceCount != null ? item.completedServiceCount : 0)
  const total = Number(item && item.serviceDateCount ? item.serviceDateCount : 0)

  if (s === 'CANCELLED') return '已取消'
  if (s === 'COMPLETED') return '本单已全部完成'
  if (s === 'EXCEPTION') return '异常单'

  if (s === 'WAIT_TAKING') return '待接单'

  if (isInProgressOrderStatus(s)) {
    if (total > 0) {
      if (s === 'TAKEN') return `已接单 · 共${total}次 · 待上门`
      if (s === 'PART_COMPLETED') return `进行中 · ${done}/${total}次已完成 · 待下趟`
      if (s === 'PART_SERVING' || s === 'SERVING') return `进行中 · ${done}/${total}次已完成 · 服务中`
    }
    return '进行中'
  }

  return '处理中'
}

module.exports = {
  orderHasServiceToday,
  getUserOrderStatusSummary,
  getSitterMineStatusSummary,
  isInProgressOrderStatus
}
