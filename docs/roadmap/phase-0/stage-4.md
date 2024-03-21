# Stage 4: TCP Proxy

## Recap

- We modified the TCP server code to handle multiple clients simultaneously using EPOLL

## Introduction

In this stage, we will combine the functionalities of a TCP server and client to make a TCP **proxy**.

Proxy is a intermediary which sits in between a client and a server and relays communication between them. When a client makes a request to access a resource (such as a website or a file), it connects to the proxy server instead of directly connecting to the target server. The proxy server then forwards the client's request to the target server, retrieves the response, and sends it back to the client.

In this stage, our client will be a web browser and server will be a python file server serving a folder on our local hard drive. Instead of the web browser directly connecting with the python file server, it makes a connection to the proxy which in turn will connect to the python server to relay the request from the browser.

Image here

Before we get into the implementation of the proxy, lets have a look at what we are trying to achieve. We will start by running a python file server.

Open a terminal and navigate to the folder you want to serve. Run the following command below to start a simple python file server:

```bash
python3 -m http.server 3000
```

Now that the local file server is running on port 3000, we can connect to it using a browser by going to `[localhost:3000](http://localhost:3000)`.

Image here

## Implementation

### Milestone #1

## Conclusion
