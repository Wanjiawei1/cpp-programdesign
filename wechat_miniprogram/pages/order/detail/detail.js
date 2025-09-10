// pages/order/detail/detail.js
const { orderAPI } = require('../../../utils/api.js')

Page({
  data: {
    orderDetail: {},
    orderAmountText: '¥0.00' // 格式化的订单金额（不含配送费）
  },

  onLoad: function(options) {
    const orderId = options.id
    if (orderId) {
      this.loadOrderDetail(orderId)
    }
  },

  // 加载订单详情
  loadOrderDetail: function(orderId) {
    wx.showLoading({ title: '加载中...' })
    
    orderAPI.getDetail(orderId).then(res => {
      const orderDetail = this.formatOrderDetail(res.data)
      const orderAmountText = `¥${(orderDetail.amount - 3).toFixed(2)}`
      this.setData({ 
        orderDetail,
        orderAmountText
      })
      wx.hideLoading()
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({
        title: '加载失败',
        icon: 'none'
      })
    })
  },

  // 格式化订单详情
  formatOrderDetail: function(order) {
    const statusMap = {
      1: '待付款',
      2: '待接单', 
      3: '已接单',
      4: '派送中',
      5: '已完成',
      6: '已取消'
    }
    
    return {
      ...order,
      statusText: statusMap[order.status] || '未知状态',
      orderTime: new Date(order.orderTime).toLocaleString(),
      checkoutTime: order.checkoutTime ? new Date(order.checkoutTime).toLocaleString() : null
    }
  },

  // 取消订单
  cancelOrder: function() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消这个订单吗？',
      success: (res) => {
        if (res.confirm) {
          orderAPI.cancel(this.data.orderDetail.id).then(() => {
            wx.showToast({
              title: '已取消订单',
              icon: 'success'
            })
            setTimeout(() => {
              wx.navigateBack()
            }, 1500)
          }).catch(err => {
            wx.showToast({
              title: '取消失败',
              icon: 'none'
            })
          })
        }
      }
    })
  },

  // 支付订单
  payOrder: function() {
    // 这里可以集成微信支付
    wx.showModal({
      title: '支付功能',
      content: '支付功能开发中...',
      showCancel: false
    })
  },

  // 催单
  reminderOrder: function() {
    orderAPI.reminder(this.data.orderDetail.id).then(() => {
      wx.showToast({
        title: '催单成功',
        icon: 'success'
      })
    }).catch(err => {
      wx.showToast({
        title: '催单失败',
        icon: 'none'
      })
    })
  },

  // 再来一单
  repeatOrder: function() {
    orderAPI.repetition(this.data.orderDetail.id).then(() => {
      wx.showToast({
        title: '已添加到购物车',
        icon: 'success'
      })
      wx.switchTab({
        url: '/pages/cart/cart'
      })
    }).catch(err => {
      wx.showToast({
        title: '操作失败',
        icon: 'none'
      })
    })
  }
})
