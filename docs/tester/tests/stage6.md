# Stage 6: Listener & Connection Module

## Overview
Phase 0 showcased the low level functions and libraries that make up the underlying architecture of any web server. In the stages that follow, we fix problems that we come across to create a fully functional [HTTP Web Sever](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_web_server)

## Constraints to be followed
- The server should run on ports `8001`, `8002`, `8003`, `8004`
- Server should be able to accept an incoming TCP connection from any of the port, while ensuring graceful shutdown in case of errors

## Tests
### Test 1: Single client - input output
This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on

```js
testInput: "client sends a randomly generated string to the server"
expectedBehavior: "client receives reversed version of the input"
```

### Test 2: Multiple clients to same port - input output
This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client

```js
testInput: "Connect multiple clients to server and sent string simultaneously"
expectedBehavior: "Each of the clients should receive the reversed versions of the string that they sent"
```

### Test 3: Error handling
In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected

```js
testInput: "client forcefully disconnects"
expectedBehavior: "Previous and new clients are able to send and receive output as expected"
```
