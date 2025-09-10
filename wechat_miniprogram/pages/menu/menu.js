// pages/menu/menu.js
const { categoryAPI, dishAPI, setmealAPI, cartAPI } = require('../../utils/api.js')
const app = getApp()

Page({
  data: {
    categories: [],
    currentCategory: null,
    dishCategories: [],
    cartCount: 0,
    totalPrice: 0,
    totalPriceText: '¥0.00',
    loading: false,
    scrollIntoView: '',
    showDetail: false,
    selectedDish: null
  },

  onLoad: function (options) {
    // 如果有传入分类ID，则定位到该分类
    const categoryId = options.categoryId
    this.loadCategories(categoryId)
  },

  onShow: function () {
    this.updateCartInfo()
  },

  onPullDownRefresh: function () {
    this.loadCategories().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载分类数据
  loadCategories: function (targetCategoryId) {
    this.setData({ loading: true })
    
    return categoryAPI.getList(1).then(res => {
      const categories = res.data
      this.setData({ categories })
      
      if (categories.length > 0) {
        const currentCategory = targetCategoryId 
          ? categories.find(cat => cat.id == targetCategoryId)?.id || categories[0].id
          : categories[0].id
        
        this.setData({ currentCategory })
        return this.loadAllDishes(categories)
      }
    }).catch(err => {
      console.error('获取分类失败:', err)
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  // 加载所有分类的菜品
  loadAllDishes: function (categories) {
    const promises = categories.map(category => {
      return Promise.all([
        dishAPI.getListByCategoryId(category.id).catch(() => ({ data: [] })),
        setmealAPI.getListByCategoryId(category.id).catch(() => ({ data: [] }))
      ]).then(([dishRes, setmealRes]) => {
        const dishes = dishRes.data.map(dish => ({
          ...dish,
          type: 'dish',
          cartCount: 0
        }))
        
        const setmeals = setmealRes.data.map(setmeal => ({
          ...setmeal,
          type: 'setmeal',
          cartCount: 0
        }))
        
        return {
          categoryId: category.id,
          categoryName: category.name,
          dishes: [...dishes, ...setmeals]
        }
      })
    })

    return Promise.all(promises).then(results => {
      // 过滤掉没有菜品的分类
      const dishCategories = results.filter(item => item.dishes.length > 0)
      this.setData({ dishCategories })
      this.updateCartInfo()
    })
  },

  // 分类点击
  onCategoryTap: function (e) {
    const { id, index } = e.currentTarget.dataset
    this.setData({ 
      currentCategory: id,
      scrollIntoView: `category-${id}`
    })
  },

  // 滚动事件
  onScroll: function (e) {
    // 根据滚动位置更新当前分类
    // 这里可以实现滚动联动效果
  },

  // 显示菜品详情
  showDishDetail: function (e) {
    const dish = e.currentTarget.dataset.dish
    this.setData({
      selectedDish: dish,
      showDetail: true
    })
  },

  // 隐藏菜品详情
  hideDetail: function () {
    this.setData({
      showDetail: false,
      selectedDish: null
    })
  },

  // 添加菜品
  addDish: function (e) {
    const dish = e.currentTarget.dataset.dish
    this.modifyDish(dish, 1)
  },

  // 减少菜品
  minusDish: function (e) {
    const dish = e.currentTarget.dataset.dish
    this.modifyDish(dish, -1)
  },

  // 详情页添加菜品
  addDetailDish: function () {
    this.modifyDish(this.data.selectedDish, 1)
  },

  // 详情页减少菜品
  minusDetailDish: function () {
    this.modifyDish(this.data.selectedDish, -1)
  },

  // 修改菜品数量
  modifyDish: function (dish, delta) {
    // 检查登录状态
    app.checkLogin().then(() => {
      const cartData = {
        dishId: dish.id,  // 菜单页都是菜品
        setmealId: null,   // 菜单页不是套餐
        dishFlavor: ''
      }

      const apiCall = delta > 0 ? cartAPI.add(cartData) : cartAPI.sub(cartData)
      
      apiCall.then(res => {
        // 更新本地数据
        this.updateLocalDishCount(dish.id, delta)
        this.updateCartInfo()
        
        wx.showToast({
          title: delta > 0 ? '已加入购物车' : '已从购物车移除',
          icon: 'success',
          duration: 1000
        })
      }).catch(err => {
        wx.showToast({
          title: '操作失败',
          icon: 'none'
        })
      })
    }).catch(() => {
      // 未登录，已跳转到登录页
    })
  },

  // 更新本地菜品数量
  updateLocalDishCount: function (dishId, delta) {
    const dishCategories = this.data.dishCategories.map(category => ({
      ...category,
      dishes: category.dishes.map(dish => {
        if (dish.id === dishId) {
          const newCount = Math.max(0, (dish.cartCount || 0) + delta)
          return { ...dish, cartCount: newCount }
        }
        return dish
      })
    }))

    this.setData({ dishCategories })

    // 如果是详情页的菜品，也要更新
    if (this.data.selectedDish && this.data.selectedDish.id === dishId) {
      const newCount = Math.max(0, (this.data.selectedDish.cartCount || 0) + delta)
      this.setData({
        'selectedDish.cartCount': newCount
      })
    }
  },

  // 更新购物车信息
  updateCartInfo: function () {
    if (!app.globalData.token) return

    cartAPI.getList().then(res => {
      const cartItems = res.data
      let cartCount = 0
      let totalPrice = 0
      
      cartItems.forEach(item => {
        cartCount += item.number
        totalPrice += item.amount
      })

      this.setData({
        cartCount,
        totalPrice,
        totalPriceText: `¥${totalPrice.toFixed(2)}`
      })

      // 更新本地菜品的购物车数量
      this.updateLocalCartCount(cartItems)

      // 更新全局购物车数量
      app.globalData.cartCount = cartCount
    }).catch(err => {
      console.error('获取购物车信息失败:', err)
    })
  },

  // 更新本地购物车数量显示
  updateLocalCartCount: function (cartItems) {
    const cartMap = {}
    cartItems.forEach(item => {
      const key = item.dishId || item.setmealId
      cartMap[key] = (cartMap[key] || 0) + item.number
    })

    const dishCategories = this.data.dishCategories.map(category => ({
      ...category,
      dishes: category.dishes.map(dish => ({
        ...dish,
        cartCount: cartMap[dish.id] || 0
      }))
    }))

    this.setData({ dishCategories })
  },

  // 跳转到购物车
  goToCart: function () {
    wx.switchTab({
      url: '/pages/cart/cart'
    })
  }
})
