# Sockets

Sockets are a fundamental concept in networking that allow communication between processes running on different computers or within the same computer. They provide a way for programs to establish network connections, send data, and receive data over a network

Each socket comprises an IP address and a port number, identifying both the host and a specific application or service.

There are typically two main types of sockets:

- `SOCK_STREAM`: Stream sockets ensure that data is delivered in the order it was sent and without errors. E.g. Web browsing, email, etc use this socket type (TCP).
- `SOCK_DGRAM`: Datagram sockets send packets of data, called datagrams, without establishing a connection or ensuring delivery. E.g. Video streaming, online gaming etc use this socket type (UDP).

In a client-server architecture, the server typically initiates socket creation, binding it to a specific IP address and port, and listens for incoming connections. Conversely, client programs establish their own sockets and connect to the server's socket by specifying its IP address and port. Once the connection is established, bidirectional data exchange becomes possible, enabling both client and server to send and receive information seamlessly.

![socket.png](/assets/phase-0-overview/socket.png)
