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
      console.log(this);
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
      console.log("in the trigger: ", this);

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
      console.log("in the router::", this);
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

  Brain.layer = function(layerNum, triggerable=null, dispatchible=null) {

    this.showingElements = []

    if (layerNum === 0) {
      this.id = "baseLayer"
    } else {
      this.id = "layer" + layerNum
    }

    this.el = document.getElementById(this.id)

    this.showing = true

    this.init(triggerable, dispatchible)
    this.initialization()
    this.registInnerEvent()
  }

  $.extend(Brain.layer.prototype, Event)

  Brain.layer.prototype.initialization = function() {
    if (this.id !== "baseLayer") {
      this.toggle()
    }
  }

  Brain.layer.prototype.handleElementShow = function(e) {
    if (this.showingElements.length === 0) {
      this.toggle()
    }

    this.showingElements.push(e.sender)
  }

  Brain.layer.prototype.handleElementHide = function(e) {
    var idx = this.showingElements.indexOf(e.sender)
    if (idx > -1) {
      this.showingElements.splice(idx, 1)
    }

    if (this.showingElements.length === 0) {
      this.toggle()
    }
  }

  Brain.layer.prototype.handleElementAdd = function(e) {
    console.log("in the handleElementAdd : ", this, e, this.el, e.sender.el);

    if (e.targetLayer !== this.id) {
      return false
    }

    this.children.push(e.sender)
    this.el.appendChild(e.sender.el)

    if (this.showing === false) {
      this.toggle()
    }
  }

  Brain.layer.prototype.handleElementRemove = function(e) {
    if (e.targetLayer !== this.id) {
      return false
    }

    var idx = this.children.indexOf(e.sender)
    if (idx<0) { return false }
    this.el.removeChild(e.sender.el)
    this.children.splice(idx, 1)

    if (this.chilren.length === 0) {
      this.toggle()
    }
  }

  // 一些帮助方法
  Brain.layer.prototype.toggle = function() {
    console.log("in the toggle:", this);
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


  Brain.layer.prototype.registInnerEvent = function() {
    this.on({type: 'page:init'}, this.initialization)
    this.on({type: 'element:show'}, this.handleElementShow)
    this.on({type: 'element:hide'}, this.handleElementHide)
    this.on({type: 'element:add'}, this.handleElementAdd)
    this.on({type: 'element:remove'}, this.handleElementRemove)
  }

  Brain.element = function(options={}, triggerable=null, dispatchible=null) {
    console.log("in the element's constructor:", options);
    this.init(triggerable, dispatchible)
    this.initialization(options)
  }

  $.extend(Brain.element.prototype, Event)

  Brain.element.prototype.setOptions =  function(opt) {
    var attrs = ["id", "attributes", "className", "tagName", "children", "targetLayer", "center", "template", "originValue"]

    for (var key in opt) {
      if (attrs.indexOf(key) > -1) {
        this[key] = opt[key]
      }
    }

    this["tagName"] = this["tagName"] || 'div'
    this["targetLayer"] = this["targetLayer"] || 'baseLayer'
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

  Brain.element.prototype.closeSelf = function(e) {
    console.log("in the closeSelf:", e)
    var t = e.target.owner

    $(t.el).hide(100, function() {
      t.dispatch({type: 'element:hide', targetLayer: t.targetLayer, sender: t})
    })
  }

  // 在render方法里将要在这个元素中显示的内容加入到this.ele中，这个方法是需要自定义的方法
  Brain.element.prototype.render = function() {}

  // 初始化方法
  Brain.element.prototype.buildBasicFacade = function() {
    if (!this.template) {
      this.el.innerHTML = "<p>这个组件没有定义模板……</p>"
    }

    console.log("in the buildBasicFacade: ", this.template);

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

  // 一些帮助方法
  var templates = {
    tipTemplate: "<div class='tipPanel'><h3><%= headLine %></h3><p><%= info %></p><button>close panel</button></div>"
  }

  var helper = {
    tipElement: function(options={}, triggerable=null, dispatchible=null) {
      this.init(triggerable, dispatchible)
      this.initialization(options)
    }
  }

  $.extend(helper.tipElement.prototype, Brain.element.prototype)
  helper.tipElement.prototype.template = templates.tipTemplate

  helper.tipElement.prototype.bindFacadeEvent = function() {
    this.el.children[0].children[2].owner = this
    this.el.children[0].children[2].addEventListener('click', this.closeSelf, false)
  }

  Brain.helper = helper

  return Brain
}(window.$, window._) )