# TCP/IP Model

TCP/IP, short for Transmission Control Protocol/Internet Protocol, constitutes a set of communication **protocols** enabling data exchange between devices. It dictates the packetization, addressing, transmission, routing, and reception of data on a network, facilitating end-to-end communication.

::: info
In networking, a protocol establishes rules for formatting and managing data. Think of network protocols as a set of rules for data communcation between the devices/computers. Despite variations in software and hardware among computers within a network, protocols facilitate communication between them.
:::

The TCP/IP model is comprised of four layers:

1. Application layer
2. Transport layer
3. Network layer
4. Data link layer

Each layer is assigned specific tasks according to the protocols it follows. Let's briefly examine each of them:

![tcp-ip-model.png](/assets/resources/tcp-ip-model.png)

### **1. Application Layer**

The uppermost layer of the TCP/IP model is the Application layer. It's accountable for delivering network services directly to end-users or applications. This layer encompasses protocols like [HTTP](https://en.wikipedia.org/wiki/HTTP), [FTP](https://en.wikipedia.org/wiki/File_Transfer_Protocol), [SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol), and [DNS](https://en.wikipedia.org/wiki/Domain_Name_System), that enables activities such as web browsing, file transfer, email communication, and domain name resolution.

We will implement protocols and functionalities at this layer to handle interactions between the web server and clients. This includes parsing [HTTP requests & generating HTTP responses](https://en.wikipedia.org/wiki/HTTP), [TLS/SSL](https://en.wikipedia.org/wiki/Transport_Layer_Security), and features such as [caching](<https://en.wikipedia.org/wiki/Cache_(computing)>), [rate limiting](https://en.wikipedia.org/wiki/Rate_limiting), and [load balancing](<https://en.wikipedia.org/wiki/Load_balancing_(computing)>).

### **2. Transport Layer**

The Transport layer is responsible for end-to-end communication between devices. The primary protocols operating at this layer are [Transmission Control Protocol (TCP)](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) and [User Datagram Protocol (UDP)](https://en.wikipedia.org/wiki/User_Datagram_Protocol). TCP provides reliable, connection-oriented communication, while UDP offers a connectionless, unreliable transmission mechanism.

At this layer, we will primarily work with TCP. We will implement TCP socket programming to establish and manage connections between the server and clients.

::: tip PRE-REQUISITE READING
Read the following document on [TCP](/guides/resources/tcp) before proceeding further.
:::

### **3. Internet Layer**

The Internet layer is responsible for routing packets across different networks to their destination. It uses [IP (Internet Protocol)](https://en.wikipedia.org/wiki/Internet_Protocol) to handle addressing and packet forwarding. IP is a connectionless protocol that provides the necessary addressing information to route packets from the source to the destination across multiple network devices.

We won't directly interact with this layer, as the TCP layer will be the one interacting with it.

### **4. Data Link Layer**

At the bottom of the TCP/IP model is the Data Link layer. This layer deals with the physical and logical connections between devices on the same network. It includes protocols such as [Ethernet](https://en.wikipedia.org/wiki/Ethernet), and [Wi-Fi (IEEE 802.11)](https://en.wikipedia.org/wiki/IEEE_802.11). The Link layer is responsible for encapsulating data into frames for transmission over the physical network medium and handling error detection and correction.

Just as in the case of Interent layer, there is no direct interaction with the Data Link layer.
