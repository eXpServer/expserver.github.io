# Stage 1: TCP Server

## Overview
This stage aims at creating a basic tcp server, that has the ability to connect to a single client at once, receive data in the form of strings, reverse it and send it back. The following tests have been created to ensure the proper functionality of the code you have written.

## Constraints to be followed
- The server is expected to run on port `8080`
- Server should be able to accept an incoming TCP connection and properly handle any errors that might occur.
- Server should receive string and reverse it, while leaving any trailing `\n` intact.
    - eg: `abcd\n` should be reversed as `dcba\n`

## Tests
### Test 1: String reversal
Ensures proper working of the server by verifying if the string returned by the server matches the expected output

```js
testInput: "client sends a randomly generated string to the server"
expectedBehavior: "client receives reversed version of the input"
```

### Test 2: Checking error handling
Checks how the server behaves when the client unexpectedly disconnects. In the current version of the server, we are not implementing proper handling of such a situation and thus the server should terminate with error code 1

```js
testInput: "Force disconnection of the client"
expectedBehavior: "Process exited with code 1"
```
