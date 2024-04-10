# Sockets

Sockets are **[file descriptors](https://en.wikipedia.org/wiki/File_descriptor)** that serve as the communication end-points for processes running on a operating system like Linux. A socket connection is a bidirectional communication interface that allows two processes to exchange information within a network.

Sockets are the interface to use the [TCP protocol](https://en.wikipedia.org/wiki/Transmission_Control_Protocol). Sockets allow applciations to send and receive data from a TCP connection just like reading and writing to a file using a [file descriptor](https://en.wikipedia.org/wiki/File_descriptor). Hence they are used to implement client and server applications. The server process creates a socket and listens on it for clients' requests.

![socket.png](/assets/phase-0-overview/socket.png)

Sockets in networking are typically classified into two types:

- `SOCK_STREAM`: Stream sockets ensure that data is delivered in the order it was sent and without errors. For example web browsing ([HTTP](https://en.wikipedia.org/wiki/HTTP)), email ([STMP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol)), etc use this socket type ([TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)).
- `SOCK_DGRAM`: Datagram sockets send packets of data, called datagrams, without establishing a connection or ensuring delivery. For example video streaming, online gaming etc. use this socket type ([UDP](https://en.wikipedia.org/wiki/User_Datagram_Protocol)).

Each network socket is associated with an [IP address](https://en.wikipedia.org/wiki/IP_address) and a [port number](<https://en.wikipedia.org/wiki/Port_(computer_networking)>), identifying both the host and a specific application or service.

## Flow of events

Sockets used in a client-server model has a typical flow of events. The following figure shows the typical flow of events (and the sequence of issued APIs) for a connection-oriented socket session. An explanation of each event follows the figure.

We will be using the following functions to setup TCP connections:

![socket-flow.png](/assets/resources/flow-of-events.png)

1. **Socket creation:** The process begins with the creation of a socket using the `socket()` system call. This call initializes a communication endpoint and returns a [file descriptor](https://en.wikipedia.org/wiki/File_descriptor).
2. **Binding (optional):** In server applications, the socket may be bound to a specific address and port using the `bind()` system call. This step is necessary for servers to listen for incoming connections on a specific network interface and port. (Bind is optional for client sockets as the operating system assigns a local address and port automatically)
3. **Listening (Server Only)**: Servers then enter a listening state using the `listen()` system call, indicating their readiness to accept incoming connections from clients.
4. **Connection Establishment (Client)**: Clients initiate a connection to the server by using the `connect()` system call, specifying the server's address and port. This call establishes a connection to the server, allowing for data exchange.
5. **Accepting Connections (Server):** Upon receiving a connection request from a client, the server accepts the connection using the `accept()` system call. This call creates a new socket specifically for communication with the client.
6. **Data Exchange**: Once the connection is established, both the client and server can send and receive data using the `send()` and `recv()` system calls, respectively. Data sent by one party is received by the other, allowing for bidirectional communication.
7. **Connection Termination**: When communication is complete, either party can initiate the termination of the connection using the `close()` system call. This releases the allocated resources associated with the socket and terminates the communication channel.
