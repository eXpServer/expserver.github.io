# Stage 8: Non-Blocking Sockets

## Overview
Experiments conducted during the stage 7 showcased a fatal flaw within the implementation. The issue lied within the expectation of the server that the client always receives the data sent back. But when a client doesn't listen for responses sent back, it results in overflow of kernel buffer. In stage 8, we fixed the issue by decoupling `send` and `recv` operations as two different events, to prevent them from [blocking](https://en.wikipedia.org/wiki/Blocking_(computing)) each other. The following test cases test for the proper implementation of non-blocking sockets, while ensuring the previous functionality of the server is maintained.


## Constraints to be followed
- The server should run on ports `8001`, `8002`, `8003`, `8004`
- Server should be able to accept an incoming TCP connection from any of the port, while ensuring graceful shutdown in case of errors

## Tests
### Test 1: Non-blocking server
creates a tcp connection to the tcp server running on the given port sends a 4gb file to the server, but does not receive anything to check if the server is non-blocking waits for 5 seconds, then creates a second connection

```js
testInput: "a client is connected to the server and sends a large file, but does not receive any data from the server. After 30 seconds, a second client is connected to the server, and verifies if the server responds"
expectedBehavior: "the second connection is able to send and receive data from the server"
```

### Test 2: Single client - input output
This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on

```js
testInput: "client sends a randomly generated string to the server"
expectedBehavior: "client receives reversed version of the input"
```

### Test 3: Multiple clients to same port - input output
This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client

```js
testInput: "Connect multiple clients to server and sent string simultaneously"
expectedBehavior: "Each of the clients should receive the reversed versions of the string that they sent"
```

### Test 4: Error handling
In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected

```js
testInput: "client forcefully disconnects"
expectedBehavior: "Previous and new clients are able to send and receive output as expected"
```
