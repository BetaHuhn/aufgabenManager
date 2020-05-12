/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["about/index.html","e5bed854b1a8d00a997d41c783b34afb"],["about/main.css","321885f6778b6aae2901e736a110122d"],["about/main.js","3bc8eff9770fc405941eebc4097bacdc"],["account/index.html","6e7e76bbe38985659f4f4a9f95b5e33d"],["account/main.css","7962b7f4d9063070df5c382f13cb141f"],["account/main.js","6eb35409716efc53a821d3296fcaf01e"],["account/reset/index.html","b5ec857fd85dd2d1532d6327ecc221d5"],["account/reset/main.css","9538ef8a8f0c4126cbfe37484aa8a624"],["account/reset/main.js","593db95122806155b293a477638bdbf4"],["admin/bot/index.html","01705cf63e5dbe6f538835dad3cac05d"],["admin/bot/main.css","07fe17edcd49065ed9248b35bcf76230"],["admin/bot/main.js","ea96db4e7f0bed92494018901055e29c"],["aufgabe/index.html","6719f31e1821fb0013476dc4ebcffe0b"],["aufgabe/main.css","b668ba563c8698eaebd9d045b152cb2c"],["aufgabe/main.js","6693ef2de007198b14b87d8cf87b8047"],["aufgaben/index.html","c25d528f3358d37a3877a5b3ad289f00"],["aufgaben/main.css","5f182361136cc185093a70ba85debcc1"],["aufgaben/main.js","ece16e859c48fbc5003ae329549e9b6f"],["datenschutz/index.html","8ce26b3263e4fedcbaba140db8e74dac"],["datenschutz/main.css","29eee0dd7c0dc51807a8ecb0fb2bdeec"],["datenschutz/main.js","e33735ec57d3611e630e1a13dbc0a686"],["dokumentation/index.html","e88bf6e240a7a116a684381f4fbaaec1"],["dokumentation/main.css","e697c2053ba07ad6343aecf8183dfee0"],["dokumentation/main.js","65400e546a8b4de1302b94a0f269f2f0"],["error/400/index.html","1adfd926cfe90e4a5e99b72f94ae951b"],["error/404/404.html","45cf583422f15946d231d9ab5e792c38"],["error/404/index.html","07b86630b15adfbd9801e45b1d172891"],["error/404/script.js","db26fc7cf9f355e142fadb8be9fafc74"],["error/404/style.css","a87d602f8f3b2943bf3bf829341e5115"],["error/maintenance/index.html","269015ab3d27fa0ef706219633358a07"],["favicon.ico","4bedcfe23a6fd7efc321c0affce2576f"],["google85aa94ed649fd149.html","3fb7d0791e1997ad3498f05c1ca24aa2"],["impressum/index.html","5d6254821ce3e1256ae1e6b95c0a5e30"],["impressum/main.css","29eee0dd7c0dc51807a8ecb0fb2bdeec"],["impressum/main.js","3bc8eff9770fc405941eebc4097bacdc"],["index.html","2d2228d4afd451570a94c253df9a1db2"],["login/index.html","7585f1b6ce765c4598d9a05332d357fb"],["login/main.css","d29604230fa53ce2ada8476a07046da2"],["login/main.js","77d2723c598718dfbb35dcc7488560de"],["main.css","d2d31585e7f880da5bb7edbceee02a24"],["main.js","bffebee3e76ce80da7503013f81514b8"],["manifest.json","3cf7c345a8225f52abaa793ff0736345"],["new/index.html","3d9c472771a72454cadd94228aff6004"],["new/main.css","a7cb0b27f7d28241c28cd9bb9186827e"],["new/main.js","4305e3a7ceb53e27d046b00bb4202e3f"],["register/main.css","3f25cd0207ec1b648fff60bc9bd95014"],["register/main.js","22dc3d1e91f797c98554457741e4f603"],["robots.txt","41c8b8b6ba8a8e64e1871f7341303c70"],["sitemap.xml","5bad96067ff2d5d69420719e63183cb8"],["static/android-icon-144x144.png","e67e8bd9db2c15b550024df360f10eb4"],["static/android-icon-192x192.png","aa3a7e91ab6680944baf1b6480c977db"],["static/android-icon-36x36.png","dd1330b1cf65f1a5a65024a4b3f58951"],["static/android-icon-48x48.png","b544ea1dc33ebc5fae8833c5b2bb4bea"],["static/android-icon-72x72.png","9b6f2c895357b5f208de76d50b7143b1"],["static/android-icon-96x96.png","0c7cf21a7f49e06bdffc3083fbfeb49d"],["static/apple-icon-114x114.png","40b5fccf9936d788999814176a2eafc6"],["static/apple-icon-120x120.png","5200591b80b5c24bada3817a7749ca17"],["static/apple-icon-144x144.png","e67e8bd9db2c15b550024df360f10eb4"],["static/apple-icon-152x152.png","3ac4b8406e0da85239169667a93376a0"],["static/apple-icon-180x180.png","a7b14d4a978b36d54c431ced28042823"],["static/apple-icon-57x57.png","51b35abf9c664e69c8b791a128001271"],["static/apple-icon-60x60.png","7962795a3323bdb72e2ffa670cf0d9b4"],["static/apple-icon-72x72.png","9b6f2c895357b5f208de76d50b7143b1"],["static/apple-icon-76x76.png","abd8211b1028ce3404b2d8284be42b87"],["static/apple-icon-precomposed.png","cd5712256e53b4d96c9d52931ee3a41d"],["static/apple-icon.png","cd5712256e53b4d96c9d52931ee3a41d"],["static/banner.png","adc126802537c6e8a578f1fc6b05a615"],["static/browserconfig.xml","653d077300a12f09a69caeea7a8947f8"],["static/favicon-16x16.png","2cb4106ed4e9f9845b6426bed3099c36"],["static/favicon-32x32.png","b919205806dea7881e479008df03bf1f"],["static/favicon-96x96.png","0c7cf21a7f49e06bdffc3083fbfeb49d"],["static/favicon.ico","4bedcfe23a6fd7efc321c0affce2576f"],["static/logo.png","7a00d3a7a5e39bd470036fc04907f9fc"],["static/ms-icon-144x144.png","e67e8bd9db2c15b550024df360f10eb4"],["static/ms-icon-150x150.png","8f0d43134f5ab005788dfafceece6b12"],["static/ms-icon-310x310.png","76b8053bf94069eefff2a642ef2bb558"],["static/ms-icon-70x70.png","6b439bb5d149b00d9e29fe82a276623c"],["static/previews/AufgabeDark.png","cd25d3dae00849989bf68b12cdc63eea"],["static/previews/AufgabeLehrerDark.png","b3b6bac3d8394b6434e2266e8e9a5ae3"],["static/previews/AufgabeLehrerLight.png","3c9910828e0e8f65a15b38199e96dfcf"],["static/previews/AufgabeLehrerMobileDark.png","dfa06861b88c6c87470fa28957bfe2f8"],["static/previews/AufgabeLehrerMobileLight.png","51db8573811ad5b4150284e579a48078"],["static/previews/AufgabeLight.png","e9ac6d2b4e8fd930b063ffcee640acc7"],["static/previews/AufgabeSchuelerDark.png","d9c4df0fb1c9c727e319d0f6b310340b"],["static/previews/AufgabeSchuelerLight.png","255c4966e16d802261ba440ec8cd9a0b"],["static/previews/AufgabenMobileDark.png","81755c485807a9652f4e91b1e3d0d4e1"],["static/previews/AufgabenMobileLight.png","6107ec4bc22f934dc5cb789f77f25682"],["static/previews/AufgabenViewDark.png","1e078f1edc753bbf30ffd47b522639a7"],["static/previews/AufgabenViewLight.png","76ac4057ab019b11ba71af3924ede523"],["static/previews/MockupLight.png","f3f5167ba8ba69f183049f774c636868"],["statuspage/main.js","28486c74737dd118defcf946983ad8c4"],["statuspage/style.css","e34f7c58c8e4879f6857c7c16d1bad6a"],["statuspage/widget.js","07234eb58673c59490692a8547fb145c"],["strich.png","d45a43515028c85c0c7941ba1383eee8"]];
var cacheName = 'sw-precache-v3-sw-precache-' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/^utm_/];



var addDirectoryIndex = function(originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function(originalResponse) {
    // If this is not a redirected response, then we don't have to do anything.
    if (!originalResponse.redirected) {
      return Promise.resolve(originalResponse);
    }

    // Firefox 50 and below doesn't support the Response.body stream, so we may
    // need to read the entire body to memory as a Blob.
    var bodyPromise = 'body' in originalResponse ?
      Promise.resolve(originalResponse.body) :
      originalResponse.blob();

    return bodyPromise.then(function(body) {
      // new Response() is happy when passed either a stream or a Blob.
      return new Response(body, {
        headers: originalResponse.headers,
        status: originalResponse.status,
        statusText: originalResponse.statusText
      });
    });
  };

var createCacheKey = function(originalUrl, paramName, paramValue,
                           dontCacheBustUrlsMatching) {
    // Create a new URL object to avoid modifying originalUrl.
    var url = new URL(originalUrl);

    // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
    // then add in the extra cache-busting URL parameter.
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
      url.search += (url.search ? '&' : '') +
        encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
  };

var isPathWhitelisted = function(whitelist, absoluteUrlString) {
    // If the whitelist is empty, then consider all URLs to be whitelisted.
    if (whitelist.length === 0) {
      return true;
    }

    // Otherwise compare each path regex to the path of the URL passed in.
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function(whitelistedPathRegex) {
      return path.match(whitelistedPathRegex);
    });
  };

var stripIgnoredUrlParameters = function(originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function(item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, false);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function(requests) {
    return requests.map(function(request) {
      return request.url;
    });
  }).then(function(urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return setOfCachedUrls(cache).then(function(cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, {credentials: 'same-origin'});
              return fetch(request).then(function(response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function(responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function() {
      
      // Force the SW to transition from installing -> active state
      return self.skipWaiting();
      
    })
  );
});

self.addEventListener('activate', function(event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.keys().then(function(existingRequests) {
        return Promise.all(
          existingRequests.map(function(existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function() {
      
      return self.clients.claim();
      
    })
  );
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = 'index.html';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '';
    if (!shouldRespond &&
        navigateFallback &&
        (event.request.mode === 'navigate') &&
        isPathWhitelisted([], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function(e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});







