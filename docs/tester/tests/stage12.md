# Stage 12: File Module 

## Overview
In this stage, we shall implement a premature version of a file server, which upon client connection, sends the contents of a predetermined text file

**Note**
Due to the implementation of file server being a rudimentary version (to be changed in the future), all possible tests aren't currently ran to test different edge cases. It is important to note that code that passes tests in the current stage might show errors once HTTP request/response is implenented and the same functionality is tested to a more deeper extent.

## Constraints to be followed 
- Proxy server should run on port `8001`
- File server should run on port `8002`
- Ports `8003`, `8004` should be used for string write-back
- Server should be able to accept an incoming TCP connection from any of the port, while ensuring graceful shutdown in case of errors

## Tests
### Test 1: Single client - input output
This test ensures that the server runs as expected when a singular client is connected on each of the different port that the server runs on

```js
testInput: "client sends a randomly generated string to the server"
expectedBehavior: "client receives reversed version of the input"
```

### Test 2: proxy response checking -- multiple clients
creates multiple clients and verifies if the clients receive the responses meant for them, as well as if the response is matching the response received directly from the dummy server

```js
testInput: "client 1 sends a GET on /test/1 && client 2 sends a GET on /test/2"
expectedBehavior: "client 1 receives response from /test/1 && client 2 gets response from /test/2"
```

### Test 3: File server response
This test ensures the file server responds with the 'sample.txt' file stored within the public directory

```js
testInput: "Connects to the file server"
expectedBehavior: "Server responds with the contents of 'sample.txt' without needing any input from the client"
```

### Test 4: Error handling
Checks the behaviour of the proxy server in the event that the upstream server is unavailable

```js
testInput: "Client connects to the proxy and sends a request to be relayed to the upstream server"
expectedBehavior: "Proxy server shouldn't crash, instead handle the error gracefully"
```
