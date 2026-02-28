# Stage 11: Upstream Module 

## Overview
As of stage 10, we have completed the basic architecture required to create a fully functioning web server. In the following stages leading to the start of Phase 2, we shall implement some of the features expected from a web server, namely
- Proxy Server
- File Server

In this stage, we shall implement the proxy server

## Constraints to be followed 
- Proxy server should run on port `8001`
- Ports `8002`, `8003`, `8004` should be used for string write-back
- Server should be able to accept an incoming TCP connection from any of the port, while ensuring graceful shutdown in case of errors

## Tests
### Test 1: Single client - input output
This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on

```js
testInput: "Client sends a randomly generated string to the server"
expectedBehavior: "client receives reversed version of the input"
```

### Test 2: proxy response checking -- multiple clients
Creates multiple clients and verifies if the clients receive the responses meant for them, as well as if the response is matching the response received directly from the dummy server

```js
testInput: "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2"
expectedBehavior: "client 1 receives response from /test/1 && client 2 gets response from /test/2"
```

### Test 3: Error handling
Checks the behaviour of the proxy server in the event that the upstream server is unavailable

```js
testInput: "Client connects to the proxy and sends a request to be relayed to the upstream server"
expectedBehavior: "Proxy server shouldn't crash, instead handle the error gracefully"
```
