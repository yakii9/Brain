var Bn = ( function($, _) {
  var Brain = {}

  var GetId = ( function (prefix) {
    var keyId = 0
    return function () {return (prefix + (keyId++))}
  }('BrainKids') )

  var Event = {
    // 初始化对象的公共接口
    init: function(triggerable=null, dispatchible=null) {
      this.key = GetId()

      this.processors = {}
      this.subscribers = []
      this.maintainSubs = []

      this.children = []

      this.triggerableEventType = triggerable || []
      this.dispatchibleEventType = dispatchible || []
    },

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

    bindTolistener: function(target, options={}) {
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

      const myself = this
      let temp = []
      target.subscribers.forEach(
        function(s) {
          if (s.key !== myself.key) {
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
      if (target === this) {
        return false
      }

      if (target !== null) {
        return target.router(e)
      }

      if (this.subscribers && this.subscribers.length) {
        this.subscribers.forEach(function(s) {
          s.router.call(s, e, target)
        })
        return true
      }
    },

    // 处理外来事件的函数
    router: function(e, target=null, options={}) {
      var keysFortrigger = this.triggerableEventType.join(' ')
      var keysForDispatch = this.dispatchibleEventType.join(' ')

      if (e.sender === this) {
        return false
      }

      if (this.triggerableEventType.length === 0
        || keysFortrigger.indexOf(e.type) > -1) {

        this.trigger(e, this)
      }

      return true
    }
  }

  Brain.element = function(options={}, triggerable=null, dispatchible=null) {
    this.init(triggerable, dispatchible)
    this.initialization(options)
  }

  $.extend(Brain.element.prototype, Event)

  Brain.element.prototype.setOptions =  function(opt) {
    var attrs = ["id", "attributes", "className", "tagName", "children", "targetLayer", "center", "template", "originValue", "el"]

    for (var key in opt) {
      if (attrs.indexOf(key) > -1) {
        this[key] = opt[key]
      }
    }

    this["tagName"] = this["tagName"] || 'div'
  }

  Brain.element.prototype.ensureElement = function() {
    if (!this.el) {
      this.el = document.createElement(this.tagName)
      this.el.id = this.id
      this.el.className = this.className || ''
    }

    if (this.children) {
      for (var i=0; i<this.children.length; i++) {
        this.el.appendChild(this.children[i].el)
      }
    }
  }

  // 在render方法里将要在这个元素中显示的内容加入到this.ele中，这个方法是需要自定义的方法
  Brain.element.prototype.render = function() {}

  // 初始化方法
  Brain.element.prototype.buildBasicFacade = function() {
    if (!this.template) {
      // this.el.innerHTML = "<p>这个组件没有定义模板……</p>"
    }

    var foo = _.template(this.template)
    this.el.innerHTML = foo(this.originValue)
  }

  Brain.element.prototype.bindFacadeEvent = function() {}

  Brain.element.prototype.initialization = function(opt) {
    this.setOptions(opt || this.options)
    this.ensureElement()
    this.buildBasicFacade()
    this.bindFacadeEvent()
  }

  Brain.center = function(triggerable=null, dispatchible=null) {
    this.init(triggerable, dispatchible)
  }

  $.extend(Brain.center.prototype, Event)

  Brain.center.prototype.router = function(e) {
    this.dispatch(e)
  }

  return Brain
}(window.$, window._) )