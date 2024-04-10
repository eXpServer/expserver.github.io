# TCP

**Transmission Control Protocol (TCP)** is part of the [Transport Layer](https://en.wikipedia.org/wiki/Transport_layer) of the [TCP/IP suite](https://en.wikipedia.org/wiki/Internet_protocol_suite). TCP ensures that data sent from one device reaches its destination intact and in the correct order, handling error detection, retransmission of lost packets, flow control, and congestion control.

TCP is used on top of [Internet Protocol](https://en.wikipedia.org/wiki/Internet_Protocol), therefore the Internet protocol stack is sometimes referred to as **TCP/IP**.

When we want to send data over the network from the [Application layer](https://en.wikipedia.org/wiki/Application_layer), we create a **TCP socket**. For sending and receieving data from the socket, we use the socket programming API's provided by the operating system. These APIs in the form of [system calls](https://en.wikipedia.org/wiki/System_call), such as `send()` and `receive()` facilitate the bidirectional flow of data between [Application layer](https://en.wikipedia.org/wiki/Application_layer) and [Transport layer](https://en.wikipedia.org/wiki/Transport_layer).

TCP then takes this data and breaks it into units called **TCP segments**. These segments are encapsulated with TCP headers, which contain information such as source and destination port numbers, sequence numbers, and acknowledgment numbers.

Once the data is segmented and encapsulated, TCP passes it down to the [Internet layer](https://en.wikipedia.org/wiki/Internet_layer) for further processing and transmission over the network.

::: tip PRE-REQUISITE READING
Read the following [sockets](/guides/resources/sockets) documentation before proceeding further.
:::

Below is the structure of IP packets and TCP segments. This is just for our reference as we will not be directly involved in the creation of these packets and segments. The socket programming APIs provides an abstraction that makes it easier to work with them.

![tcp-ip-packet.png](/assets/resources/tcp-ip-packet.png)
