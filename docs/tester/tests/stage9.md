# Stage 9: Epoll Edge Triggering

## Overview
As of the previous stage, we have started working with non-blocking sockets, but we noticed during one of the experiments a very peculiar issue. Even during an idle TCP connection, CPU utilization kept increasing unnecessarily. This is due to the default behavior of Epoll. 
Epoll has 2 main modes: 
- Level Triggering
- Edge Triggering


By default Epoll runs on level triggerign mode, which informs the user as long as a file descriptor is ready to either be read from or written to. This is the reason for the unnecessary CPU utilization, as any file descriptor that has an associated empty buffer will be seen as **can be written to**, leading to unnecessary calls to `connection_loop_write_handler`.

Epoll edge triggering works in a more efficient manner, by only informing the user a file descriptor is ready, when it changes state from `not-ready` to `ready`. This results in further consequences as the server now needs to manage the state of each file descriptor so as to not miss any notifications that weren't instantly handled.

The tests within this stage, ensures the proper use of edge triggering by measuring CPU usage over the course of a few seconds and ensuring the average CPU utilization is below a certain threshold.



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

### Test 2: CPU usage
This test verifies that the process doesn't consume CPU time unnecessarily by creating an idle client connection and tracks CPU usage over the course of 20 seconds

```js
testInput: "Creates an idle client connection and tracks CPU usage over the course of 20 seconds"
expectedBehavior: "CPU usage should be less than 10%"
```

### Test 3: Single client - input output
This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on

```js
testInput: "client sends a randomly generated string to the server"
expectedBehavior: "client receives reversed version of the input"
```

### Test 4: Multiple clients to same port - input output
This test ensures that the server is able to handle multiple connections at once and verifies the response received by each of the client

```js
testInput: "Connect multiple clients to server and sent string simultaneously"
expectedBehavior: "Each of the clients should receive the reversed versions of the string that they sent"
```

### Test 5: Error handling
In the current implementation of the server, there should be no inturruption in service when a singular client disconnects. This test ensures that previously connected clients, as well as new clients are able to connect, send to and receive from the server even after a client has diconnected

```js
testInput: "client forcefully disconnects"
expectedBehavior: "Previous and new clients are able to send and receive output as expected"
```
