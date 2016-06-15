# Brain
## 一款基于异步消息机制的 web前端 框架

－－灵感来自于《失控》

## 模块结构说明
Events 对象为整个模块的基础设施，它作为框架其他模块的原型存在，为其他模块提供一些基础的事件处理逻辑。它通过dispatch向外分发事件，通过trigger触发模块内部的监听器；通过listenTo监听来自其他模块的事件，通过on设置内部的事件触发器；router决定如何处理外部事件。
element 类，是整个组件的基类。

虽然去除了依赖文件，但是这个库依然是依赖于JQuery和underscore的。