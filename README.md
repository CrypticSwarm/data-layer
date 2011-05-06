Data Cache Layer
================

Your routes shouldn't need to know where data is coming from.  You should be able to swap out data sources in a relatively easy manner and still have your websites templates render the exact same way. You should be able to connect the same data to different output formats with ease.  

This module provides a way to access your data through internal routes and provides the ability to cache the data.  It also provides a template rendering controller and JSON rendering controller.

# addRoute

Add a handler for the specified url.

* route   -- internal url
* handler -- function to grab the requested data
* ttl     -- cache time to live

## hander -> function(req, callback)

* req      -- is the request object.  Currently only url and params are set.
* callback -- function to call when the data is retrieved

## Example

  addRoute('blog/:slug', function(req, cb) {
    getBlogPost(req.params.slug, cb)
  })


# compositeRoute

Helper to easily compile several routes into one object

* route        -- internal url
* dependencies -- key value pairs.  Key -> dependent url, Value -> key to put data in the returned object.

## Example

  compositeRoute('blog/:slug/data',
    { 'blog/:slug': 'blogPost'
    , 'blog/:slug/comments': 'comments'
    })
  // Generates
  // { blogPost: blogPostData
  // , comments: commentData
  // }

# getData

Get data from specified route.

* route    -- the url to grab
* callback -- callback to call with err or data when data is retrieved.

## Example

  getData('blog/first-post', function(err, post) {
    if (err) return handleErr(err)
    doSomethingBlogPost(post)
  })


# connectDataTemplate

External url handler that will render a template with the data result from an internal url

* dataRoute -- Internal route to get data from
* template  -- Template to render

## Example
  
  app.get('/blog/:slug', connectDataTemplate('blog/:slug/data', 'blogPost'))


# connectJSONTemplate

External url handler that gives JSON output of internal url data

* dataRoute -- Internal route to get data from

## Example

  app.get('/api/blog/:slug/comments', connectJSONTemplate('blog/:slug/comments'))



