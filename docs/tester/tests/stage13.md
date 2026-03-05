# Stage 13: Session Module 

## Overview
Session module, introducted in the current stage, will lay the foundation of HTTP request response which is to be implemented in the upcoming Phase.

Tests done within this stage will ensure all the features and performance improvements implemented in the current phase works as intended


## Constraints to be followed
- Proxy server should run on port `8001`
- File server should run on port `8002`
- Ports `8003`, `8004` currently serves no functionality
- Server should be able to accept an incoming TCP connection from any of the port, while ensuring graceful shutdown in case of errors

## Tests
### Test 1: proxy response checking -- multiple clients
creates multiple clients and verifies if the clients receive the responses meant for them, as well as if the response is matching the response received directly from the dummy server

```js
testInput: "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2"
expectedBehavior: "client 1 receives response from /test/1 && client 2 gets response from /test/2"
```

### Test 2: File server response
This test ensures the file server responds with the 'sample.txt' file stored within the public folder

```js
testInput: "Connects to the file server"
expectedBehavior: "Server responds with the contents of 'sample.txt' without needing any input from the client"
```

### Test 3: Error handling
This test ensures the server responds properly in the case of unexpected crashes from the upstream server

```js
testInput: "Client connects to the proxy and sends a request to be relayed to the upstream server, which is terminated"
expectedBehavior: "Proxy server shouldn't crash, instead handle the error gracefully"
```
