# UDP

**User Datagram Protocol (UDP)** is part of the Transport Layer of the TCP/IP suite. UDP provides a connectionless communication method for sending data between devices. Unlike TCP, UDP does not guarantee data delivery, ordering, or error recovery. Instead, it offers a simpler, faster way to transmit data with minimal overhead.

When sending data over the network from the Application layer, we create a UDP socket. To send and receive data using this socket, we use the socket programming APIs provided by the operating system. These APIs include system calls like `sendto()` and `recvfrom()`, which facilitate the transmission of data between the Application layer and the Transport layer.

![udp-ip-packet.png](/assets/resources/udp-ip-packet.png)

Here’s how UDP handles data:
1. **Socket Creation:**
    - **UDP Socket:** An application creates a UDP socket using the `socket()` system call, specifying the UDP protocol.
2. **Data Transmission:**
- **Sending Data:** When data is sent via a UDP socket, the data is provided to the `sendto()` system call. The data is then encapsulated in UDP packets (datagrams).

::: details int sendto( int sockfd, const void * buf, int len, int flags, const struct sockaddr * dest_addr, int addr_len)  
*Send data to a specific address without establishing a connection*
    
    
| Argument Name | Argument Type | Description |
| --- | --- | --- |
| sockfd | int | File descriptor of the socket.  |
| buf | const void * | Pointer to he buffer containing the data to be sent. |
| len | int | Length of the data to be sent. |
| flags | int | Bitwise OR of flags controlling the operation(Default 0). |
| dest_addr | const struct sockaddr * | Pointer to a sockaddr structure that contains destination address. |
| addr_len | int | The size of the destination address. |
:::

- **Receiving Data:** The `recvfrom()` system call is used to receive data from the socket. The received UDP datagram is then passed up to the application layer.

::: details int recvfrom( int sockfd, const void * buf, int len, int flags, const struct sockaddr * src_addr, int addr_len)  
*Send data to a specific address without establishing a connection*
    
    
| Argument Name | Argument Type | Description |
| --- | --- | --- |
| sockfd | int | File descriptor of the socket.  |
| buf | const void * | Pointer to he buffer containing the data to be sent. |
| len | int | Length of the data to be sent. |
| flags | int | Bitwise OR of flags controlling the operation(Default 0). |
| src_addr | const struct sockaddr * | Pointer to a sockaddr structure that contains source address. |
| addr_len | int | The size of the source address. |
:::

3. **UDP Datagram Structure:**
    - **Datagram Format:** A UDP datagram consists of a UDP header and the data payload. The UDP header includes fields such as:
        - **Source Port:** The port number of the sending application.
        - **Destination Port:** The port number of the receiving application.
        - **Length:** The length of the UDP header and payload.
        - **Checksum:** Used for error checking, but it's optional in IPv4.