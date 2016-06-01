var Bn = ( function(root, $, _) {
  var Brain = {}

  var GetId = ( function (prefix) {
    var keyId = 0
    return function () {return (prefix + (keyId++))}
  }('BrainKids') )

  var Event = {
    // 这是保存内部事件处理器和订阅者的地方
    processors: {},
    subscribers: [],
    maintainSubs: [],

    // 初始化对象的公共接口
    initialization: function() {},

    // 内部处理器的订阅/解除订阅的方法
    on: function(e, method, options) {
      if (!this.processors[e.type] && !this.processors[e.type].length) {
        this.processors[e.type] = []
      }

      this.processors[e.type].push({callback: method, options: options, invokenCounter: 0})
      return method
    },

    off: function(e, method) {
      if (!method) {
        return delete this.processors[e.type]
      }

      if (this.processors[e.type] && this.processors[e.type]) {
        var idx = this.processors[e.type].findIndex( (val) => val.callback === method)
        if (idx<0) return false
        this.processors[e.type].splice(idx, 1)
      }
    }

    // 其他对象的订阅/取消订阅的方法
    listenTo: function(target) {
      try {
        return target.subscribe(this)
      } catch (e) {
        console.log(e.type, e.message);
        return false
      }
    }

    stopListening: function(target) {
      if (!target) return null

      const self = this
      let temp = []
      target.subscribers.forEach(
        function(s) {
          if (s.clientId !== self.clientId) {
            temp.push(s)
          }
        }
      )

      target.subscribers = temp
    }
  }

  return Brain
}(window, window.$, window._) )