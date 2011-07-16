module.exports = function(next) {
  var cache = {}
    , queue = {}
    , depend = {}
    , addRoute
    , routeIt = require('connect').router(function(methods) {
      addRoute = methods
    })

  next = next || function notFound(route, callback) {
    return function() {
    }
  }

  var CL =
  { getData: function getData(route, callback, user) {
      var req = { url: route, method: 'GET', user: user }
      routeIt(req, callback)
    }

  , compositeRoute: function(route, dependencies) {
      var routes = Object.keys(dependencies)
        , len = routes.length
      routes.forEach(function(r) {
        if (!Array.isArray(depend[r])) depend[r] = [route]
        else depend[r].push(route)
      })
      CL.addRoute(route, function(req, callback) {
        var finished = 0
          , errs
          , ret = {}
        routes.forEach(function(r) {
          CL.getData(prepareRoute(r, req.params), function(err, data) {
            finished++
            if (err) {
              if (!errs) errs = [err]
              else errs.push(err)
            }
            else if (typeof dependencies[r] === 'function') dependencies[r](data, ret)
            else ret[dependencies[r]] = data
            if (finished === len) callback(errs, ret)
          }, req.user)
        })
      }, -1)
    }

  , addRoute: function(route, func, opts) {
      opts = opts || {}
      var f
        , ttl = opts.ttl || 0
      f = function(req, callback, next) {
        if (cache[req.url]) {
          return callback(null, cache[req.url])
        }
        else if (queue[req.url]) return queue[req.url].push(callback)
        if (!opts.volatile) queue[req.url] = [callback]
        func(req, function addToCache(err, data) {
          if (!err) {
            if (ttl > 0 || ttl === -1) {
              cache[req.url] = data
              if (req.url !== route) {
                if (!Array.isArray(depend[route])) depend[route] = [req.url]
                else depend[route].push(req.url)
              }
              if (ttl !== -1) setTimeout(function() {
                CL.clearCache(req.url)
              }, ttl)
            }
          }
          if (!opts.volatile) {
            queue[req.url].forEach(function(cb) {
              cb(err, data)
            })
            delete queue[req.url]
          }
          else callback(err, data)
        }, next)
      }
      addRoute.get(route, f)
    }

  , clearCache: function clearCache(route) {
      delete cache[route]
      if (depend[route]) depend[route].forEach(clearCache)
    }

  , connectDataTemplate: function connectDataTemplate(dataRoute, template, params) {
      return function dataTemplate(req, res) {
        CL.getData(prepareRoute(dataRoute, req.params), function(err, data) {
          if (err) {
            res.end()
            return console.log(err)
          }
          if (params) data = appendCall(append({}, data), params, req)
          res.render(template, data)
        }, req.user)
      }
    }

  , connectJSONTemplate: function connectJSONTemplate(dataRoute) {
      return function JSONTemplate(req, res) {
        CL.getData(prepareRoute(dataRoute, req.params), function(err, data) {
          if (err) {
            res.end()
            return console.log(err)
          }
          res.header('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
        }, req.user)
      }
    }

  }
  return CL
}

function prepareRoute(str, params) {
  return str.replace(/:([^\/?]+)\??/g, function(_, m) {
    return params[m] == null ? '' : params[m]
  })
}

function append(obj, copy) {
  Object.keys(copy).forEach(function(key) {
    obj[key] = copy[key]
  })
  return obj
}

function appendCall(obj, copy, req) {
  Object.keys(copy).forEach(function(key) {
    obj[key] = copy[key](req)
  })
  return obj
}
