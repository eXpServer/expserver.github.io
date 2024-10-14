# TCP Socket Programming

Have you ever thought about how we are able to get websites through browsers on searching, how emails are delivered, and how files are transmitted between devices. All these should happen reliably. TCP Protocol in the [**Transport layer**](/guides/resources/tcp-ip-model) plays a crucial role in ensuring this. 

::: tip Before looking into what TCP is, and its significance in networking, you should have a proper understanding of the layers in the [TCP/IP Model](https://simple.wikipedia.org/wiki/TCP/IP_model) and how they are interconnected.
:::

## TCP (Transmission Control Protocol)

Let us look into the TCP Protocol in detail. **Transmission Control Protocol (TCP)** is part of the [Transport Layer](https://en.wikipedia.org/wiki/Transport_layer) of the [TCP/IP suite](https://en.wikipedia.org/wiki/Internet_protocol_suite). TCP ensures that all data sent is received by the recipient in the correct order. If packets are lost, TCP will re-transmit them until they are correctly received. Thus it ensures a reliable transmission of data. Before any data is sent, TCP requires a connection to be established between the client and server. This connection setup involves a three-way handshake.

### The Phases of TCP operations

The working of [TCP protocol](https://en.wikipedia.org/wiki/Transmission_Control_Protocol#Protocol_operation) can be broadly divided into three different phases.  These steps fit into three main stages:

1. **Connection Establishment:** TCP uses a **three-way handshake** (SYN, SYN-ACK, ACK) to establish a reliable connection between a client and server, ensuring both are ready to communicate.  Three way handshake involves the following steps: The client (sender) sends a SYN packet to the server, indicating its desire to establish a connection. The server responds with a SYN-ACK packet, acknowledging the client’s request and indicating its readiness to communicate. Finally, the client acknowledges the server’s response with an ACK packet. At this point, both parties are synchronized and ready for data exchange.
2. **Data Transmission:** During this phase, data is sent between the client and server with mechanisms for error detection, acknowledgment, and re-transmission to ensure reliable delivery.  The data transmission may involve [**packet loss**](https://en.wikipedia.org/wiki/Packet_loss) or transmission errors, which are corrected using packet re-transmission and error correction techniques.  TCP also handles correct re-ordering of received data, in case of out of order receipt of packets due to transmission delays or re-transmissions.  
3. **Connection Termination:** The connection is closed gracefully using a four-way handshake (FIN, ACK, FIN, ACK), allowing both parties to end communication without data loss.

### **TCP segments**

When the Transmission Control Protocol receives a data stream, divides it up, and adds a TCP header to the transfer, the data stream becomes a '**TCP segment**'. The TCP header ensures that when the individual data packets arrive at their destination, they can easily be arranged in the correct order.

In the connection establishment phase, applications can announce their [**Maximum Segment Size**](https://en.wikipedia.org/wiki/Maximum_segment_size) (**MSS**), which defines the largest TCP segment they will exchange. This represents the largest amount of data that will be transmitted in a single segment. If the MSS is too large, it can cause the packet to exceed the [**Maximum Transmission Unit**](https://en.wikipedia.org/wiki/Maximum_transmission_unit) (**MTU**) of the underlying network. So the IP fragmentation will break the individual packets into smaller pieces. The packets are re-ordered correctly on reaching the destination. The minimum header size for a TCP segment is 20 bytes and maximum header size is 60 bytes. The default maximum segment size for IPv4 is 536 bytes and for IPv6 it is 1220 bytes. 

![tcp-ip-packet.png](/assets/resources/tcp-ip-packet.png)

## **Socket Programming**

Sockets provide a programming interface that allows two application programs or processes to communicate with each other over a network using the TCP protocol. They enable these programs on different host machines to send and receive data reliably and efficiently.    The Unix/Linux socket programming interface, provided in the `sys/socket.h` header, contains declarations of a set of functions that can be invoked by applications to carry out various actions such as establishment of connection,  transmission and reception of data, connection termination etc. The socket programming interface also provides functions that allow use of other transport layer protocols including UDP. Although sockets primarily connect processes on a computer network, they also enable communication between processes on the same device. The same-machine connections use the [IPC (Inter-process communication)](https://en.wikipedia.org/wiki/Inter-process_communication) sockets, also known as [Unix domain sockets](https://en.wikipedia.org/wiki/Unix_domain_socket). In Unix-like systems, sockets are treated as [file descriptors](https://en.wikipedia.org/wiki/Inter-process_communication).

![socket.png](/assets/phase-0-overview/socket.png)

Sockets are commonly used in a [client-server](https://en.wikipedia.org/wiki/Client%E2%80%93server_model) network. In this model, the server socket listens and waits for client's requests. The clients exchange information with the server using [TCP/IP](/guides/resources/tcp-ip-model) protocol.  Application programs such as browsers and email servers/clients that use the [HTTP and](/guides/resources/http) [SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol) protocols respectively at the application layer also use the socket programming interface for transport layer communication.     

Sockets in networking are typically classified as follows:

- `SOCK_STREAM`: Stream sockets ensure that data is delivered in the order it was sent and without errors. TCP protocol uses this type of socket. Eg: Web browsing, email  etc use this socket type.
- `SOCK_DGRAM`: Datagram sockets send packets of data, called datagrams, without establishing a connection or ensuring delivery.  UDP protocol uses this type of socket. Eg: Video streaming, online gaming etc use this socket type.
- `SOCK_RAW`: Raw sockets provide access to lower-level network protocols (like IP) and is often used for custom protocols or network monitoring tools.

Each network socket is associated with an [IP address](https://en.wikipedia.org/wiki/IP_address) and a [port number](https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers), identifying both the host and a specific application or service. 

::: tip
**Socket address** is the combination of both **IP address** and **port number**.
:::

## Flow of events in TCP

A socket has a typical flow of events. The following figure shows the typical flow of events (and the sequence of function calls) for a connection-oriented socket session in TCP. An explanation of each event follows the figure.

![socket-flow.png](/assets/resources/flow-of-events.png)

1. **Socket creation:**   An application process that uses sockets for communication  begins with the creation of a socket using the `socket()` system call. This call returns a file descriptor. 
    ::: details `socket()`
        
    **Header** : `#include <sys/socket.h>`
        
    `int socket ( int domain, int type, int protocol );`
        
    **Description** : creates a transport layer communication endpoint and returns a file descriptor that refers to that endpoint.    
        
    **Return Value :** On success, a file descriptor for the new socket is returned.  On error, -1 is returned, and [***errno***](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | domain | `int` | Specifies the communication domain.This selects the protocol family which will be used for communication. (e.g., `AF_INET` for [IPv4,](https://en.wikipedia.org/wiki/IPv4) `AF_INET6` for [IPv6](https://en.wikipedia.org/wiki/IPv6)). In this project we will be using IPv4. |
    | type | `int` | Specifies the communication semantics (e.g., `SOCK_STREAM`  -  Provides sequenced, reliable, two-way, connection-based byte streams, Used with TCP.   `SOCK_DGRAM`   -  Supports connection less, unreliable messages of a fixed maximum length, Used with UDP. The following options, which are not used in the project, are also supported.                          `SOCK_RAW`       -  Provides raw network protocol access.                                      `SOCK_SEQPACKET`  -  Provides a sequenced, reliable, two-way connection-based data transmission path for datagrams of fixed maximum length). |
    | protocol | `int` | Specifies the particular protocol to be used with the socket. When `0` is passed as the protocol argument, the system selects the default protocol for the given domain and type combination. For `AF_INET` and `SOCK_STREAM`, this typically results in TCP being chosen as the protocol, as it is the default protocol for stream sockets in the IPv4 domain. |
    ::: 
2. **Binding :** In server applications, the socket may be bound to a specific [IP address](https://en.wikipedia.org/wiki/IP_address) and [Port Number](https://en.wikipedia.org/wiki/List_of_TCP_and_UDP_port_numbers) using the `bind()` system call. This step is necessary for servers to listen to incoming connections on a specific IP address and port number. (Bind is optional for client sockets, as the operating system assigns a local IP address and port number automatically)
    ::: details `bind()`
        
    **Header** : `#include <sys/socket.h>`
        
    `int bind ( int sockfd, const struct sockaddr *addr, socklen_t addrlen );`
        
    **Description :** When a socket is created with `socket()`, it has no socket address assigned to it. The `bind()` assigns the IP address and port number specified by ***addr***  to the socket referred to by the file descriptor ***sockfd***. 
        
    **Return Value :** On success, zero is returned.  On error, -1 is returned, and
    [***errno***](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | Specifies the file descriptor of the socket to be bound. |
    | addr | `const struct sockaddr *` | Points to a **`sockaddr`** structure containing the address to be bound to the socket.  The length and format of the address depend on the address family of the socket. |
    | addrlen | `socklen_t` | Specifies the length of the **`sockaddr`** structure pointed to by the *addr* argument. |
    ::: details `struct sockaddr`
            
    The **`sockaddr`** structure is used to define a socket address. The `<sys/socket.h>` header shall define the **sockaddr** structure that includes at least the following members:
            
    ```c
    struct sockaddr{
            
    sa_family_t    sa_family       //Address family.
    char           sa_data[]       //Socket address (variable-length data).
            
    };
    ```
            
    `sa_family_t` is defined as an *unsigned integer* type in `<sys/socket.h>` header.
    
    ::: details `socklen_t`
            
    `socklen_t` is an *unsigned opaque integer type* of length of at least 32 bits (the exact length depends on the host machine). It is included in `<sys/socket.h>` header. `socklen_t` enables writing code in a platform independent manner. The header may use different definitions according to the target platform.
    ::: 
            
3. **Listening (Server Only)**: Servers transition into a listening state using the `listen()` system call, indicating their readiness to accept incoming connections from clients.
    ::: details `listen()`
        
    **Header** : `#include <sys/socket.h>`
        
    `int listen ( int sockfd, int backlog );`
        
    **Description :** `listen()` marks the socket referred to by sockfd as a passive socket, that is, as a socket that will be used to accept incoming connection requests. 
        
    **Return Value :** On success, zero is returned. On error, -1 is returned, and
    [***errno***](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | The sockfd is a file descriptor(of server) that refers to a socket of type `SOCK_STREAM` or `SOCK_SEQPACKET` to listen on. |
    | backlog | `int` | The backlog defines the maximum length to which the queue of pending connections for sockfd may grow.        a) if backlog less than 0, the function sets the length of the listen queue to 0.                                                             b) If backlog exceeds the maximum queue length specified, the length will be set to the maximum supported value.                                                                                   
    |
    :::
4. **Connection Establishment (Client)**: Clients initiate a connection to the server by using the `connect()` system call, specifying the server's address and port. This call establishes a connection to the server, allowing for data exchange.
    ::: details `connect()`
        
    **Header** : `#include <sys/socket.h>`
        
    `int connect( int sockfd, const struct sockaddr * addr, socklen_t addrlen );` 
        
    **Description** : The `connect()` system call connects the socket referred by the file descriptor sockfd to the address specified by ***addr***. The `connect()` system call is normally called by the client process to connect to the server process.
        
    **Return Value :** If the connection succeeds, zero is returned.  On error, -1 is returned, and [errno](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | Specifies the file descriptor associated with the socket(of client). |
    | addr | `const struct sockaddr *` | Pointer to a `sockaddr` structure that contains the server address to which the client wishes to connect to. The length and format of the address depend on the address family of the socket. |
    | addrlen | `socklen_t` | Specifies the length of the `sockaddr` structure pointed to by the *addr* argument |
    :::
5. **Accepting Connections (Server):** Upon receiving a connection request from a client, the server accepts the connection using the `accept()` system call. This call creates a new socket specifically for communication with the client.
    ::: details `accept()`
        
    **Header** : `#include <sys/socket.h>`
        
    `int accept ( int sockfd, struct sockaddr *addr, socklen_t *addrlen );`
        
    **Description :**  The `accept()` system call is used with connection-based socket types (`SOCK_STREAM`, `SOCK_SEQPACKET`) for accepting an incoming connection on a listening socket. It extracts the first connection request on the queue of pending connections for the listening socket, sockfd, creates a new connected socket ( with the same socket type protocol and address family as the specified socket), and returns a new file descriptor referring to that socket. The newly created socket is not in the listening state. The original socket sockfd is unaffected by this call.
        
    **Return Value :**  On success, return a file descriptor for the accepted socket (a non negative integer). On error, -1 is returned, errno is set to indicate the error, and addrlen is left unchanged.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | sockfd refers to a listening socket that has been created with `socket()`, bound to a local address with `bind()`, and is listening for connections after a `listen()`. |
    | addr | `const struct sockaddr *` | Pointer to a `sockaddr` structure to receive the address of the connecting entity (client).See the note below.                                 |
    | addrlen | `socklen_t` | Points to a `socklen_t` structure which on input specifies the length of the supplied **`sockaddr`** structure, and on output specifies the length of the stored address. |
        
    Note: The fields of the `sockaddr` structure are filled by the OS kernel and returned after analyzing the client connection details. Note that the client does not set this structure in the `connect()` system call.
    ::: 
        
6. **Data Exchange**: Once the connection is established, both the client and server can send and receive data using the `send()` and `recv()` system calls, respectively. Data sent by one party is received by the other, allowing for bidirectional communication.
    ::: details `send()`
        
    **Header** : `#include <sys/socket.h>`  
    `ssize_t send( int sockfd, const void *buf, size_t len, int flags );`
        
    **Description :**  The system call `send()` is used to transmit a message to another socket. The `send()` call may be used only when the socket is in a connected state (so that the intended recipient is known). 
        
    **Return Value :** On success, these calls return the number of bytes sent.  On error, -1 is returned, and [errno](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    When the message does not fit into the send buffer of the socket, `send()` normally blocks, unless the socket has been placed in nonblocking I/O mode.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | File descriptor of the sending socket  |
    | buf | `const void *` | Pointer to the buffer containing the data to be sent. |
    | len | `size_t` | Length of the data to be sent in bytes. |
    | flags | `int` | This is used to specify various options or behaviors for the `send()` operation. Commonly, this argument is set to `0` to indicate no special behavior. Eg:  `MSG_CONFIRM` flag ensures that destination address is confirmed as reachable, `MSG_OOB` flag is used for urgent messages.                         |
    :::
    ::: details `recv()`
        
    **Header** : `#include <sys/socket.h>`

    `ssize_t recv ( int socket, const void *buf, size_t length, int flags );`
        
    **Description :** The `recv()` function shall receive a message from a socket. It is normally used with connected sockets because it does not permit the application to retrieve the source address of received data. The `recv()` function receives data on a socket and stores it in a buffer. The `recv()` call applies only to connected sockets. 
        
    **Return Value :** It return the number of bytes received, or -1 if an error occurred.  In the event of an error, [errno](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error. If a message is too long to fit in the supplied buffer, excess bytes may be discarded depending on the type of socket the message is received from.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | File descriptor of the connected socket.  |
    | buf | `const void *` | Pointer to the buffer to receive the data. |
    | len | `int` | Length of the buffer. |
    | flags | `int` | This is used to specify various options or behaviors for the `recv()` operation. Commonly, this argument is set to `0` to indicate no special behavior. Eg:  `MSG_DONTWAIT` flag makes the `recv()` operation non-blocking, `MSG_WAITALL` flag enables waiting until the full amount of requested data is received. |
    :::
7. **Connection Termination**: When communication is complete, either party can initiate the termination of the connection using the `close()` system call. This releases the allocated resources associated with the socket and terminates the communication channel.
    ::: details `close()`
        
    **Header :** `#include <unistd.h>` 
        
    `int close(int fd);`
        
    **Description :** closes a file descriptor, so that it no longer refers to any file and may be reused.
        
    **Return Value :** returns zero on success.  On error, -1 is returned, and [errno](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | File descriptor of the socket to close.  |
    :::
