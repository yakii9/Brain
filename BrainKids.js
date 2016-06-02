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

    // 一些配置信息，比如说：可以接受的事件类型、可以转发的事件
    triggerableEventType: [],
    dispatchibleEventType: [],

    // 初始化对象的公共接口
    initialization: function() {},

    // 内部处理器的订阅/解除订阅的方法
    on: function(e, method, options={}) {
      if (!this.processors[e.type] && !this.processors[e.type].length) {
        this.processors[e.type] = []
      }

      this.processors[e.type].push({callback: method, options: options, invokenCounter: 0})
      return method
    },

    off: function(e, method, options={}) {
      if (!method) {
        return delete this.processors[e.type]
      }

      if (this.processors[e.type] && this.processors[e.type]) {
        var idx = this.processors[e.type].findIndex( (val) => val.callback === method)
        if (idx<0) return false
        this.processors[e.type].splice(idx, 1)
      }
    },

    // 其他对象的订阅/取消订阅的方法
    listenTo: function(target, options={}) {
      try {
        return target.subscribe(this)
      } catch (e) {
        console.log(e.type, e.message);
        return false
      }
    },

    subscribe: function(subscriber) {
      if (subscriber && subscriber !== this) {
        return this.subscribers.push(subscriber)
      }
    },

    stopListening: function(target, options={}) {
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
    },

    // 触发内部事件的触发器
    trigger: function(e, context, options={}) {
      if (!this.processors[e.type] || !this.processors[e.type].length) {
        return false
      }

      this.evts[eventType].forEach(
        function(listener) {
          if ( listener.options.listenOnce && listener.invokenCounter > 0 ) {
            return
          }

          switch (args.length) {
            case 0:
              listener.callback.call(context?context:null)
              break
            case 1:
              listener.callback.call(context?context:null, args[0])
              break
            case 2:
              listener.callback.call(context?context:null, args[0], args[1])
              break
            case 3:
              listener.callback.call(context?context:null, args[0], args[1], args[2])
              break
            default:
              listener.callback.apply(context?context:null, args)
              break
          }
          listener.invokenCounter += 1
        }
      )
      return true
    },


    // 触发外部事件的函数
    dispatch: function(e, target=null, options={}) {
      if (target === this) {
        return false
      }

      if (target !== null) {
        return target.router(e)
      }

      if (this.subscribers && this.subscribers.length) {
        this.subscribers.forEach(function(s) {
          s.router.call(null, e, target)
        })
        return true
      }
    },

    // 处理外来事件的函数
    router: function(e, target=null, options={}) {
      var keysFortrigger = this.triggerableEventType.jion(' ')
      var keysForDispatch = this.dispatchibleEventType.jion(' ')

      if (keysForDispatch.indexOf(e.type) > -1) {
        this.dispatch(e, target)
      }

      if (keysFortrigger.indexOf(e.type) > -1) {
        this.trigger(e, target)
      }
    }


  }

  return Brain
}(window, window.$, window._) )