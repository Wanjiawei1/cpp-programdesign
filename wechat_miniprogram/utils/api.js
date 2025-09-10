// API接口定义
const { get, getPublic, post, put, del } = require('./request.js')

// 用户相关API
const userAPI = {
  // 微信登录
  login: (data) => post('/login', data),
}

// 店铺相关API
const shopAPI = {
  // 获取店铺营业状态
  getStatus: () => getPublic('/shop/status')
}

// 分类相关API
const categoryAPI = {
  // 获取分类列表
  getList: (type) => getPublic('/category/list', { type })
}

// 菜品相关API
const dishAPI = {
  // 根据分类ID获取菜品列表
  getListByCategoryId: (categoryId) => getPublic('/dish/list', { categoryId })
}

// 套餐相关API
const setmealAPI = {
  // 根据分类ID获取套餐列表
  getListByCategoryId: (categoryId) => getPublic('/setmeal/list', { categoryId }),
  // 根据套餐ID获取套餐详情
  getDetail: (id) => getPublic(`/setmeal/${id}`)
}

// 购物车相关API
const cartAPI = {
  // 添加到购物车
  add: (data) => post('/shoppingCart/add', data),
  // 获取购物车列表
  getList: () => get('/shoppingCart/list'),
  // 减少购物车商品数量
  sub: (data) => post('/shoppingCart/sub', data),
  // 清空购物车
  clean: () => del('/shoppingCart/clean')
}

// 地址相关API
const addressAPI = {
  // 获取地址列表
  getList: () => get('/addressBook/list'),
  // 新增地址
  add: (data) => post('/addressBook', data),
  // 根据ID获取地址详情
  getById: (id) => get(`/addressBook/${id}`),
  // 修改地址
  update: (data) => put('/addressBook', data),
  // 删除地址
  delete: (id) => del(`/addressBook/${id}`),
  // 设置默认地址
  setDefault: (data) => put('/addressBook/default', data),
  // 获取默认地址
  getDefault: () => get('/addressBook/default')
}

// 订单相关API
const orderAPI = {
  // 提交订单
  submit: (data) => post('/order/submit', data),
  // 订单支付
  payment: (data) => put('/order/payment', data),
  // 获取历史订单
  getHistoryOrders: (page, pageSize, status) => {
    const params = { page, pageSize }
    if (status !== null && status !== undefined) {
      params.status = status
    }
    return get('/order/historyOrders', params)
  },
  // 获取订单详情
  getDetail: (id) => get(`/order/orderDetail/${id}`),
  // 取消订单
  cancel: (id) => put(`/order/cancel/${id}`),
  // 再来一单
  repetition: (id) => post(`/order/repetition/${id}`),
  // 用户催单
  reminder: (id) => get(`/order/reminder/${id}`)
}

module.exports = {
  userAPI,
  shopAPI,
  categoryAPI,
  dishAPI,
  setmealAPI,
  cartAPI,
  addressAPI,
  orderAPI
}
