# UDP Socket Programming

## User Datagram Protocol (UDP)

The **User Datagram Protocol (UDP)** is a key protocol in the [**Transport Layer**](https://en.wikipedia.org/wiki/Transport_layer) of the [**TCP/IP suite**](https://en.wikipedia.org/wiki/Internet_protocol_suite).  UDP provides a connection-less communication method for transferring data between devices. Unlike TCP, UDP does not guarantee data delivery, ordering, or re-transmission of lost packets. Instead, it offers a simpler, faster way to transmit data with minimal overhead.

### **The Phases of UDP Operations**

UDP operations are much simpler than TCP due to the lack of connection setup, error correction, or acknowledgment. Here are the main stages:

1. **No Connection Establishment:** UDP does not require a connection to be established before data is sent. The client can start sending packets (called datagrams) to the server immediately without a handshake.
2. **Data Transmission:** In UDP ,the client and server send data as datagrams without checking if the data has been received or delivered in order. Each datagram is independent and can be delivered out of order, duplicated, or lost without any notification to the sender. There is no mechanism for re-transmission or error checking at the protocol level. UDP is best used in scenarios where speed is more critical than reliability, such as video streaming or online gaming.
3. **No Connection Termination:** Since there is no formal connection in UDP, there is no need for a termination process like in TCP. The communication ends when no more data is sent.

### **UDP Datagrams**

UDP handles data by dividing it into small, independent packets called “[datagrams](https://en.wikipedia.org/wiki/Datagram)”. Each datagram contains both the data and header information, including source and destination IP addresses and port numbers, but there is no ordering or acknowledgment like in TCP. If a packet is lost, it is not re-transmitted. The header size of a UDP datagram is a fixed 8 bytes.

UDP does not provide mechanisms for dividing data into segments or handling large data sizes like TCP does. If datagrams exceed the [maximum transmission unit](https://en.wikipedia.org/wiki/Maximum_transmission_unit) (MTU) of the network, they may be fragmented at the IP layer, but UDP itself does not handle reassembly. The minimum datagram size is 8 bytes for the header, and the maximum is typically determined by the network’s MTU.

![tcp-ip-packet.png](/assets/resources/udp-ip-packet.png)

## UDP Socket Programming

When sending data over the network from the Application layer, we create a UDP socket. To send and receive data using this socket, we use the socket programming APIs provided by the operating system. These APIs include system calls like `sendto()` and `recvfrom()`, which facilitate the transmission of data between the Application layer and the Transport layer.

The flow of events in UDP is given below:

![udp_flow.png](/assets/resources/udp_flow.png)

1. **Socket creation:**   An application process that uses sockets for communication  begins with the creation of a socket using the `socket()` system call. This call returns a file descriptor. Here we create a UDP socket using the `socket()` system call.
    ::: details `socket()`
        
    **Header** : `#include <sys/socket.h>`
        
    `int socket ( int domain, int type, int protocol );`
        
     **Description** : creates a transport layer communication endpoint and returns a file descriptor that refers to that endpoint.    
        
    **Return Value :** On success, a file descriptor for the new socket is returned.  On error, -1 is returned, and [**errno**](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | domain | `int` | Specifies the communication domain.This selects the protocol family which will be used for communication. (e.g., `AF_INET` for [IPv4,](https://en.wikipedia.org/wiki/IPv4) `AF_INET6` for [IPv6](https://en.wikipedia.org/wiki/IPv6)). In this project we will be using IPv4. |
    | type | `int` | Specifies the communication semantics (e.g., `SOCK_STREAM`  -  Provides sequenced, reliable, two-way, connection-based byte streams, used with TCP.   `SOCK_DGRAM`   -  Supports connection less, unreliable messages of a fixed maximum length, used with UDP. The following options, which are not used in the project, are also supported.                          `SOCK_RAW`       -  Provides raw network protocol access.                                      `SOCK_SEQPACKET`  -  Provides a sequenced, reliable, two-way connection-based data transmission path for datagrams of fixed maximum length). |
    | protocol | `int` | Specifies the particular protocol to be used with the socket. When `0` is passed as the protocol argument, the system selects the default protocol for the given domain and type combination. For `AF_INET` and `SOCK_DGRAM`, this typically results in UDP being chosen as the protocol, as it is the default protocol for stream sockets in the IPv4 domain. |
    :::

2. **Binding :** In server applications, the socket may be bound to a specific [IP address](https://www.notion.so/2c33762c6bd047f39055aa2eed772611?pvs=21) and [port number](Port Number) using the `bind()` system call. This step is necessary for servers to listen to incoming connections on a specific IP address and port number.
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
            
     **`socklen_t`** is an *unsigned opaque integer type* of length of at least 32 bits (the exact length depends on the host machine). It is included in `<sys/socket.h>` header. `socklen_t` enables writing code in a platform independent manner. The header may use different definitions according to the target platform.
            
3. **Data Exchange**: Data is exchanged between the client and server using `sendto()` and `recvfrom()` system calls. These calls allow sending and receiving datagrams without requiring a connection.
    ::: details `sendto()`
        
    **Header** : `#include <sys/socket.h`
        
    `ssize_t sendto(int sockfd, const void *buf, size_t len, int flags, const struct sockaddr *dest_addr, socklen_t addrlen);`
        
    **Description :**  Sends data to the specified destination address. Since UDP is connectionless, the destination address must be provided with each `sendto()` call.
        
    **Return Value :** On success, these calls return the number of bytes sent.  On error, -1 is returned, and [errno](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    When the message does not fit into the send buffer of the socket, `sendto()` normally blocks, unless the socket has been placed in non-blocking I/O mode.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | File descriptor of the sending socket  |
    | buf | `const void *` | Pointer to the buffer containing the data to be sent. |
    | len | `size_t` | Length of the data to be sent in bytes. |
    | flags | `int` | This is used to specify various options or behaviors for the `sendto()` operation. Commonly, this argument is set to `0` to indicate no special behavior. Eg:  `MSG_CONFIRM` flag ensures that destination address is confirmed as reachable.                        |
    | dest_addr | `const struct sockaddr *` | Pointer to a sockaddr structure that contains destination address. |
    | addrlen | `socklen_t` | The size of the destination address. |
    ::: 

    ::: details `recvfrom()`
        
    **Header** : `#include <sys/socket.h>`
        
    `ssize_t recvfrom(int sockfd,const void *buf, size_t len, int flags,const struct sockaddr *src_addr, socklen_t *addrlen);`
        
    **Description:** The `recvfrom()` function is used to receive data in **UDP**. It allows the receiving socket to read data sent by a specific sender and also retrieve the sender's address. Since UDP is connectionless, each call to `recvfrom()` can receive data from a different sender.
        
    **Return Value :** It return the number of bytes received, or -1 if an error occurred.  In the event of an error, [errno](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error. If a message is too long to fit in the supplied buffer, excess bytes may be discarded depending on the type of socket the message is received from.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | File descriptor of the socket which receive the incoming datagrams. |
    | buf | `const void *` | A pointer to the buffer where the received data will be stored. |
    | len | `size_t` | The maximum number of bytes to be received. |
    | flags | `int` | This is used to specify various options or behaviors for the `recv()` operation. Commonly, this argument is set to `0` to indicate no special behavior. Eg:  `MSG_DONTWAIT` flag makes the `recv()` operation non-blocking, `MSG_WAITALL` flag enables waiting until the full amount of requested data is received. |
    | src_addr | `const struct sockaddr *` | A pointer to a `sockaddr` structure where the address of the sender will be stored. This is useful for identifying where the data came from. If this parameter is `NULL`, the sender's address is not captured. |
    | addrlen | `socklen_t *` | A pointer to a variable containing the size of the `sockaddr` structure. When `recvfrom()` returns, this variable will be updated to reflect the actual size of the sender’s address. |
    ::: 

4. **Connection Termination**: When communication is complete, either party can initiate the termination of the connection using the `close()` system call. This releases the allocated resources associated with the socket and terminates the communication channel.
    ::: details `close()` 
        
    **Header :** `#include <unistd.h>` 
        
    `int close(int fd);`
        
    **Description :** closes a file descriptor, so that it no longer refers to any file and may be reused.
        
    **Return Value :** returns zero on success.  On error, -1 is returned, and [errno](https://man7.org/linux/man-pages/man3/errno.3.html) is set to indicate the error.
        
    | Argument Name | Argument Type | Description |
    | --- | --- | --- |
    | sockfd | `int` | File descriptor of the socket to close.  |
    ::: 