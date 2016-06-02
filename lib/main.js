requirejs.config({
  baseUrl: 'lib',
  shim: {
    underscore: {
      exports: '_'
    }
  }
})

requirejs(["jquery", "underscore"], function($) {
  var s = document.createElement('script')
  s.src = "/lib/BrainKids.js"
  document.head.appendChild(s)
})
