var CACHE_NAME = "help_chat_cache_v3"
var immutableRequests = [
  
]
var mutableRequests = [
  "index.html",
  "style.css",
  "app.js",
  "aria.modal.css",
  "aria.modal.min.js",
  "db_interactions.js"
]

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      var newImmutableRequests = []
      return Promise.all(
        immutableRequests.map(function(url){
          return caches.match(url).then(function(response){
            if (response) {
              return cache.put(url, response)
            } else {
              newImmutableRequests.push(url)
              return Promise.resolve()
            }
          })
        })
      ).then(function(){
        return cache.addAll(newImmutableRequests.concat(mutableRequests))
      }) 
    })
  )
})

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(cacheNames){
      return Promise.all(
        cacheNames.map(function(cacheName){
          if (CACHE_NAME !== cacheName && cacheName.startsWith("help_chat_cache")){
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

self.addEventListener("fetch", function(event){
  event.respondWith(
    fetch(event.request).catch(function(){
      return caches.match(event.request).then(function(response){
        if (response) {
          return response
        } else if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("index.html")
        }
      })
    })
  )
})
