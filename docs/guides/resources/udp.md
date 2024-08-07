# UDP

**User Datagram Protocol (UDP)** is part of the Transport Layer of the TCP/IP suite. UDP provides a connectionless communication method for sending data between devices. Unlike TCP, UDP does not guarantee data delivery, ordering, or error recovery. Instead, it offers a simpler, faster way to transmit data with minimal overhead.

When sending data over the network from the Application layer, we create a UDP socket. To send and receive data using this socket, we use the socket programming APIs provided by the operating system. These APIs include system calls like `sendto()` and `recvfrom()`, which facilitate the transmission of data between the Application layer and the Transport layer.

![udp-ip-packet.png](/assets/resources/udp-ip-packet.png)

Here’s how UDP handles data:
1. **Socket Creation:**
    - **UDP Socket:** An application creates a UDP socket using the `socket()` system call, specifying the UDP protocol.
2. **Data Transmission:**
- **Sending Data:** When data is sent via a UDP socket, the data is provided to the `sendto()` system call. The data is then encapsulated in UDP packets (datagrams).
- **Receiving Data:** The `recvfrom()` system call is used to receive data from the socket. The received UDP datagram is then passed up to the application layer.
3. **UDP Datagram Structure:**
    - **Datagram Format:** A UDP datagram consists of a UDP header and the data payload. The UDP header includes fields such as:
        - **Source Port:** The port number of the sending application.
        - **Destination Port:** The port number of the receiving application.
        - **Length:** The length of the UDP header and payload.
        - **Checksum:** Used for error checking, but it's optional in IPv4.