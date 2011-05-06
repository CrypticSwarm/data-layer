var express = require('express')
  , app = express.createServer()
  , dataLayer = require('../data-cache')()

app.configure(function(){
  app.use(express.logger())
  app.set('view engine', 'jade')
})

app.get('/', dataLayer.connectDataTemplate('index/all', 'index'))
app.get('/:cryptic', dataLayer.connectDataTemplate(':cryptic/all', 'index')) // the params in the external url match an internal url they get passed through


dataLayer.compositeRoute(':chaos/all', // Again here the params get passed through if they match. 
  { 'datamonkey': 'name'
  , 'cryptic/:chaos': 'message' // However the names are independent of what we called them in the other section
  })

dataLayer.addRoute('datamonkey', function(req, cb) {
  console.log('Fetching: ', req.url)
  setTimeout(function() {
    cb(null, "The Message")
  }, 100)
}, 3000)

dataLayer.addRoute('cryptic/:swarm', function(req, cb) {
  console.log('Fetching: ', req.url)
  setTimeout(function() {
    cb(null, "This is the a parametrized response " + req.params.swarm)
  }, 1000)
}, 10000)

app.listen(3000)
