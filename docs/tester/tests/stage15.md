# Stage 15: HTTP Response Module 

## Overview
In Phase 2, we shall make use of the HTTP protocol for communication between the client and the server. Read more about http [here](https://developer.mozilla.org/en-US/docs/Web/HTTP). 

In this stage, we implement the response parser module. This module will be responsible for reading the request from the client and parsing the data into an in-memory data structure in order to extract information from the request and to handle different requests accordingly

The tests done within this stage will ensure the parser has been written properly by testing the server with a variety of valid and invalid http requests and verifying the output the server provides

## Constraints to be followed
- All ports `8001`, `8002`, `8003`, `8004` listen to http requests
- The server should expect the all files to be shared from the `public/` directory
- The `public/` directory should be expected to be present within the same relative path to the executable as given within the documentation

## Tests
### Test 1: Valid request - jpg
This test aims to ensure that the requested file is served and verifies that the headers match what is expected

```js
testInput: "Sends a request to the server requesting for a .jpg file"
expectedBehavior: "HTTP/1.1 200} OK
Content-Type: image/jpeg
Server: eXpServer

"
```

### Test 2: Valid request - pdf
This test aims to ensure that the requested file is served and verifies that the headers match what is expected

```js
testInput: "Sends a request to the server requesting for a .pdf file"
expectedBehavior: "HTTP/1.1 200} OK
Content-Type: application/pdf
Server: eXpServer

"
```

### Test 3: Valid request - plain
This test aims to ensure that the requested file is served and verifies that the headers match what is expected

```js
testInput: "Sends a request to the server requesting for a .txt file"
expectedBehavior: "HTTP/1.1 200} OK
Content-Type: text/plain
Server: eXpServer

"
```

### Test 4: File not found
This test aims to ensure the error handling in case the user requests for a file that isn't found within the public directory

```js
testInput: "Sends a request to the server request for a file that doesn't exist"
expectedBehavior: "HTTP/1.1 404} Not Found
Server: eXpServer

"
```

### Test 5: Missing HTTP Version
This test aims to ensure proper error handling of the server in case of an invalid HTTP request

```js
testInput: "Sends a request to the server without specifying HTTP version"
expectedBehavior: "HTTP/1.1 400} Bad Request
Server: eXpServer

"
```

### Test 6: Invalid HTTP method
This test aims to ensure proper error handling of the server in case of an invalid HTTP request

```js
testInput: "Sends a request to the server with an invalid HTTP method"
expectedBehavior: "HTTP/1.1 400} Bad Request
Server: eXpServer

"
```

### Test 7: Missing host header
This test aims to ensure proper error handling of the server in case of an invalid HTTP request

```js
testInput: "Sends a request to the server without specifying the host (mandatory header field)"
expectedBehavior: "HTTP/1.1 400} Bad Request
Server: eXpServer

"
```

### Test 8: Invalid HTTP Version
This test aims to ensure proper error handling of the server in case of an invalid HTTP request

```js
testInput: "Sends a request to the server with a non-existent HTTP Version"
expectedBehavior: "HTTP/1.1 400} Bad Request
Server: eXpServer

"
```

### Test 9: Improperly formatted request (headers)
This test aims to ensure proper error handling of the server in case of an invalid HTTP request

```js
testInput: "Sends a request to the server without colon separation between the key-value pairs in the headers"
expectedBehavior: "HTTP/1.1 400} Bad Request
Server: eXpServer

"
```
