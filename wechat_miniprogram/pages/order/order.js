// pages/order/order.js
const app = getApp()
const api = require('../../utils/api')

Page({
  data: {
    orders: [],
    loading: false,
    pageNum: 1,
    pageSize: 10,
    hasMore: true
  },

  onLoad: function() {
    this.loadOrderList()
  },

  onShow: function() {
    this.refreshOrderList()
  },

  // 刷新订单列表
  refreshOrderList: function() {
    this.setData({ 
      pageNum: 1,
      orders: [],
      hasMore: true
    })
    this.loadOrderList()
  },

  // 加载订单列表
  loadOrderList: function() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true })
    
    api.orderAPI.getHistoryOrders(this.data.pageNum, this.data.pageSize, null).then(res => {
      this.setData({ loading: false })
      
      if (res.code === 1) {
        const newOrders = res.data.records || []
        // 处理订单数据
        const processedOrders = newOrders.map(order => {
          console.log('处理订单:', order)
          let statusText = ''
          let statusClass = ''
          switch (order.status) {
            case 1: 
              statusText = '待付款'; 
              statusClass = 'status-pending';
              break;
            case 2: 
              statusText = '待接单'; 
              statusClass = 'status-waiting';
              break;
            case 3: 
              statusText = '已接单'; 
              statusClass = 'status-confirmed';
              break;
            case 4: 
              statusText = '派送中'; 
              statusClass = 'status-delivering';
              break;
            case 5: 
              statusText = '已完成'; 
              statusClass = 'status-completed';
              break;
            case 6: 
              statusText = '已取消'; 
              statusClass = 'status-cancelled';
              break;
            default: 
              statusText = '未知状态';
              statusClass = 'status-unknown';
          }
          
          console.log('订单状态:', order.status, '状态文本:', statusText, '状态类:', statusClass)
          
          return {
            ...order,
            statusText,
            statusClass,
            totalNumber: order.orderDetails ? order.orderDetails.reduce((sum, item) => sum + item.number, 0) : 0
          }
        })
        
        this.setData({
          orders: this.data.pageNum === 1 ? processedOrders : this.data.orders.concat(processedOrders),
          hasMore: newOrders.length >= this.data.pageSize
        })
      } else {
        wx.showToast({
          title: res.msg || '加载失败',
          icon: 'error'
        })
      }
    }).catch(err => {
      this.setData({ loading: false })
      wx.showToast({
        title: '网络错误',
        icon: 'error'
      })
    })
  },

  // 下拉刷新
  onPullDownRefresh: function() {
    this.refreshOrderList()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  // 上拉加载更多
  onReachBottom: function() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({ pageNum: this.data.pageNum + 1 })
      this.loadOrderList()
    }
  },

  // 查看订单详情
  viewOrderDetail: function(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order/detail/detail?id=${orderId}`
    })
  },

  // 再来一单
  reorder: function(e) {
    const orderId = e.currentTarget.dataset.id
    wx.showLoading({ title: '处理中...' })
    
    // 如果API中有repetition方法，使用它；否则需要后端实现
    if (api.orderAPI.repetition) {
      api.orderAPI.repetition(orderId).then(res => {
        wx.hideLoading()
        if (res.code === 1) {
          wx.showToast({
            title: '已添加到购物车',
            success: () => {
              app.updateCartCount()
              wx.switchTab({ url: '/pages/cart/cart' })
            }
          })
        } else {
          wx.showToast({
            title: res.msg || '操作失败',
            icon: 'error'
          })
        }
      }).catch(err => {
        wx.hideLoading()
        wx.showToast({
          title: '操作失败',
          icon: 'error'
        })
      })
    } else {
      // 如果没有repetition接口，可以先获取订单详情再添加到购物车
      wx.hideLoading()
      wx.showToast({
        title: '功能正在完善中',
        icon: 'none'
      })
    }
  },

  // 去首页逛逛
  goToIndex: function() {
    wx.switchTab({ url: '/pages/index/index' })
  }
})