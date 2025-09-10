// 请求工具类
const app = getApp()

// 请求基础配置
const request = (options) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.baseUrl}${options.url}`,
      method: options.method || 'GET',
      data: options.method === 'POST' ? JSON.stringify(options.data || {}) : options.data || {},
      header: {
        'Content-Type': 'application/json',
        'authentication': app.globalData.token || '',
        ...options.header
      },
      success: (res) => {
        if (res.data.code === 1) {
          resolve(res.data)
        } else {
          // 如果是401错误且没有token，不显示错误提示
          if (res.statusCode === 401 && !app.globalData.token) {
            reject(res.data)
            return
          }
          wx.showToast({
            title: res.data.msg || '请求失败',
            icon: 'none',
            duration: 2000
          })
          reject(res.data)
        }
      },
      fail: (error) => {
        // 如果是401错误，不显示网络失败提示
        if (error.errMsg && error.errMsg.includes('401')) {
          reject(error)
          return
        }
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000
        })
        reject(error)
      }
    })
  })
}

// GET请求
const get = (url, data = {}) => {
  return request({
    url,
    method: 'GET',
    data
  })
}

// 公开GET请求（兼容有无token的情况）
const getPublic = (url, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${app.globalData.baseUrl}${url}`,
      method: 'GET',
      data: data,
      header: {
        'Content-Type': 'application/json',
        'authentication': app.globalData.token || ''
      },
      success: (res) => {
        if (res.data.code === 1) {
          resolve(res.data)
        } else {
          // 如果是401错误且没有token，这是正常的，不显示错误提示
          if (res.statusCode === 401 && !app.globalData.token) {
            reject(res.data)
            return
          }
          wx.showToast({
            title: res.data.msg || '请求失败',
            icon: 'none',
            duration: 2000
          })
          reject(res.data)
        }
      },
      fail: (error) => {
        // 如果是401错误，不显示网络失败提示
        if (error.errMsg && error.errMsg.includes('401')) {
          reject(error)
          return
        }
        wx.showToast({
          title: '网络请求失败',
          icon: 'none',
          duration: 2000
        })
        reject(error)
      }
    })
  })
}

// POST请求
const post = (url, data = {}) => {
  return request({
    url,
    method: 'POST',
    data
  })
}

// PUT请求
const put = (url, data = {}) => {
  return request({
    url,
    method: 'PUT',
    data
  })
}

// DELETE请求
const del = (url, data = {}) => {
  return request({
    url,
    method: 'DELETE',
    data
  })
}

module.exports = {
  request,
  get,
  getPublic,
  post,
  put,
  del
}
