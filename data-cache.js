var cache = {}
  , queue = {}
  , depend = {}
  , addRoute
  , routeIt = require('connect').router(function(methods) {
    addRoute = methods
  })

function notFound(req) {
  return function() {
  }
}

module.exports = 
{ getData: function getData(route, callback) {
    if (cache[route]) return callback(null, cache[route])
    else if (queue[route]) return queue[route].push(callback)
    queue[route] = [callback]
    var req = { url: route, method: 'GET' }
    routeIt(req, function clearQueue(err, data) {
      queue[route].forEach(function(cb) {
        cb(err, data)
      })
      delete queue[route]
    }, notFound(req))
  }

, compositeRoute: function(route, dependencies, modifier) {
    var routes = Object.keys(dependencies)
      , len = routes.length
    routes.forEach(function(r) {
      if (!Array.isArray(depend[r])) depend[r] = [route]
      else depend[r].push(route)
    })
    module.exports.addRoute(route, function(req, callback) {
      var finished = 0
        , errs
        , ret = {}
      routes.forEach(function(r) {
        url = r.replace(/:([^\/]+)/g, function(_, m) {
          return req.params[m]
        })
        module.exports.getData(url, function(err, data) {
          finished++
          if (err) {
            if (!errs) errs = [err]
            else errs.push(err)
          }
          else ret[dependencies[r]] = data
          if (finished === len) callback(errs, ret)
        })
      })
    }, -1)
  }

, addRoute: function(route, func, ttl) {
    var f = func
    if (ttl != null) f = function(req, callback) {
      func(req, function addToCache(err, data) {
        if (!err) {
          cache[req.url] = data
          if (req.url !== route) {
            if (!Array.isArray(depend[route])) depend[route] = [req.url]
            else depend[route].push(req.url)
          }
          if (ttl !== -1) setTimeout(function() {
            module.exports.clearCache(route)
          }, ttl)
        }
        callback(err, data)
      })
    }
    addRoute.get(route, f)
  }

, clearCache: function clearCache(route) {
    delete cache[route]
    if (depend[route]) depend[route].forEach(clearCache)
  }

}
