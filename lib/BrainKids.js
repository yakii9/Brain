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
      if (!this.processors[e.type] || !this.processors[e.type].length) {
        this.processors[e.type] = []
      }

      this.processors[e.type].push({callback: method, options: options, invokenCounter: 0})
      return method
    },

    off: function(e, method, options={}) {
      if (!method) {
        return delete this.processors[e.type]
      }

      if (this.processors[e.type] && this.processors[e.type].length) {
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

    bindTolistener: function(taget, options={}) {
      try {
        target.subscribe(this)
        this.subscribe(target)
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
    trigger: function(e, context, ...args) {
      if (!this.processors[e.type] || this.processors[e.type].length === 0) {
        return false
      }

      this.processors[e.type].forEach(
        function(listener) {
          if ( listener.options.listenOnce && listener.invokenCounter > 0 ) {
            return
          }

          switch (args.length) {
            case 0:
              listener.callback.call(context?context:null, e)
              break
            case 1:
              listener.callback.call(context?context:null, e, args[0])
              break
            case 2:
              listener.callback.call(context?context:null, e, args[0], args[1])
              break
            case 3:
              listener.callback.call(context?context:null, e, args[0], args[1], args[2])
              break
            default:
              listener.callback.apply(context?context:null, args.unshift(e))
              break
          }
          listener.invokenCounter += 1
        }
      )
      return true
    },


    // 触发外部事件的函数
    dispatch: function(e, target=null, options={}) {
      e.sender = this

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
      var keysFortrigger = this.triggerableEventType.join(' ')
      var keysForDispatch = this.dispatchibleEventType.join(' ')

      if (this.dispatchibleEventType.length === 0
        || keysForDispatch.indexOf(e.type) > -1) {

        this.dispatch(e, target)
      }

      if (this.triggerableEventType.length === 0
        || keysFortrigger.indexOf(e.type) > -1) {

        if (e.type === 'page:init') target = this

        this.trigger(e, target)
      }

      return true
    }

  }

  Brain.layer = function(layerNum, triggerable=null, dispatchible=null) {
    var self = Object.create(Event)

    self.key = GetId()

    self.processors = {}
    self.subscribers = []
    self.maintainSubs = []

    self.children = []

    self.triggerableEventType = triggerable || []
    self.dispatchibleEventType = dispatchible || []

    self.showingElements = []

    if (layerNum === 0) {
      self.id = "baseLayer"
    } else {
      self.id = "layer" + layerNum
    }

    self.el = document.getElementById(self.id)

    self.showing = true

    self.initialization = function() {
      if (this.id !== "baselayer") {
        this.toggle()
      }
    }

    self.handleElementShow = function(e) {
      if (this.showingElements.length === 0) {
        this.toggle()
      }

      this.showingElements.push(e.sender)
    }

    self.handleElementHide = function(e) {
      var idx = this.showingElements.indexOf(e.sender)
      if (idx > -1) {
        this.showingElements.splice(idx, 1)
      }

      if (this.showingElements.length === 0) {
        this.toggle()
      }
    }

    self.handleElementAdd = function(e) {
      if (e.targetLayer !== this.id) {
        return false
      }

      this.children.push(e.sender)
      this.el.appendChild(e.sender.el)
    }

    self.handleElementRemove = function(e) {
      if (e.targetLayer !== this.id) {
        return false
      }

      var idx = this.children.indexOf(e.sender)
      if (idx<0) { return false }
      this.el.removeChild(e.sender.el)
      this.children.splice(idx, 1)
    }

    // 一些帮助方法
    self.toggle = function() {
      var t = this

      if (t.showing) {
        $(t.el).hide(0, function() {
          t.showing = false
        })
      } else {
        $(t.el).show(0, function() {
          t.showing = true
        })
      }
    }


    self.on({type: 'page:init'}, self.initialization)
    self.on({type: 'element:show'}, self.handleElementShow)
    self.on({type: 'element:hide'}, self.handleElementHide)
    self.on({type: 'element:add'}, self.handleElementAdd)
    self.on({type: 'element:remove'}, self.handleElementRemove)

    return self
  }

  Brain.element = function(options={}, triggerable=null, dispatchible=null) {
    var self = Object.create(Event)

    self.key = GetId()

    this.options = options || {}

    self.processors = {}
    self.subscribers = []
    self.maintainSubs = []

    self.children = children || []

    self.triggerableEventType = triggerable || []
    self.dispatchibleEventType = dispatchible || []

    // 定义一些有关于初始化的方法
    self.setOptions = function(opt) {
      var attrs = ["model", "collection", "id", "attributes", "className", "tagName", "children", "ele"].join(' ')

      for (var key in opt) {
        if (attrs.indexOf(key) > -1) {
          this[key] = opt[key]
        }
      }

      this["tagName"] = this["tagName"] || 'div'

    }

    self.ensureElement = function() {
      if (!this.el) {
        this.el = document.createElement(this.tagName)
        this.el.id = this.id
        this.el.className = this.className || ''
        this.ele = document.createElement(this.tagName)
        this.el.appendChild(this.ele)
      }

      if (this.children) {
        for (var i=0; i<this.children.length; i++) {
          this.el.appendChild(this.children[i].el)
        }
      }
    }

    // 在render方法里将要在这个元素中显示的内容加入到this.ele中，这个方法是需要自定义的方法
    self.render = function() {}

    // 初始化方法
    self.initialization = function(opt) {
      this.setOptions(opt || this.options)
      this.ensureElement()
      this.render()
    }

    return self
  }

  return Brain
}(window, window.$, window._) )