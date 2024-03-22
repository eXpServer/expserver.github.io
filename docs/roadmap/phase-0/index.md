# Phase 0: Overview

## Client-Server Architecture

Systems on a network can usually be classified into two categories:

- **Server**: A system that provides services to other systems in a network. They typically run continuously and are designed to handle requests from multiple clients simultaneously.
  - For eg. Web servers, Email servers, File servers, Database servers
- **Client**: A system that uses remote services provided by a server. They initiate communication with servers by sending requests for specific services or data.
  - For eg. Web browsers, Email clients.

## TCP & TCP Server

TCP (Transmission Control Protocol) is one the core protocols of the Internet protocol suite (TCP/IP). that lets two hosts connect and exchange data streams. Naturally, a TCP server is a type of server that uses TCP/IP to establish a connection and exchange data with client programs over a network.

A TCP server is responsible for listening for incoming TCP connections from client programs, accept these connections, and process the data sent by the clients.

You can read more about TCP and the TCP/IP protocol suite [here](https://en.wikipedia.org/wiki/Transmission_Control_Protocol).

## Sockets

A socket is an endpoint for communication between two machines over a network. It allows two nodes on a network to communicate with each other by establishing a connection. Think of it as a combination of an IP address and a port number, which enables data transmission between the client and the server.

There are typically two main types of sockets:

- `SOCK_STREAM`: Stream sockets ensure that data is delivered in the order it was sent and without errors. E.g. Web browsing, email, etc use this socket type.
- `SOCK_DGRAM`: Datagram sockets send packets of data, called datagrams, without establishing a connection or ensuring delivery. E.g. Video streaming, online gaming etc use this socket type.

Since we are building a TCP server, we will be using `SOCK_STREAM`.
