# Stage 5: TCP Proxy

## Overview
In this stage, we shall deviate a bit from our current implementation to explore a concept that is widely used in networks, [proxy servers](https://en.wikipedia.org/wiki/Proxy_server). 


## Constraints to be followed
- The proxy server should run on port `8080`
- The proxy server should expect the upstream server to run on port `3000`
- The proxy server should handle any unexpected error scenarios accordingly

## Tests
### Test 1: proxy response checking -- multiple clients
creates multiple clients and verifies if the clients receive the responses meant for them, as well as if the response is matching the response received directly from the dummy server

```js
testInput: "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2"
expectedBehavior: "client 1 receives response from /test/1 && client 2 gets response from /test/2"
```
