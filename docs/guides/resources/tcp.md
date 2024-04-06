# Transmission Control Protocol (TCP)

**Transmission Control Protocol (TCP)** is a communications standard that enables application programs and computing devices to exchange messages over a network. It is designed to send [packets](https://en.wikipedia.org/wiki/Network_packet) across the internet and ensure the successful delivery of data and messages over networks.

TCP is one of the basic standards that define the rules of the internet and is included within the standards defined by the Internet Engineering Task Force ([IETF](https://en.wikipedia.org/wiki/Internet_Engineering_Task_Force)). It is one of the most commonly used protocols within digital network communications and ensures end-to-end data delivery.

As a result, high-level protocols like Application layer protocols, use the TCP protocol.

Examples include peer-to-peer sharing methods like [File Transfer Protocol (FTP)](https://en.wikipedia.org/wiki/File_Transfer_Protocol), [Secure Shell (SSH)](https://en.wikipedia.org/wiki/Secure_Shell), [Internet Message Access Protocol (IMAP)](https://en.wikipedia.org/wiki/Internet_Message_Access_Protocol) for sending and receiving emails, [Simple Mail Transfer Protocol (SMTP)](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol), and for web access through the [Hypertext Transfer Protocol (HTTP)](https://www.notion.so/HTTP-e93e4b23676d4d5c9e939e7ae835237a?pvs=21)

## **How Transmission Control Protocol works**

TCP is a connection-oriented protocol, which means a connection is established and maintained until the applications at each end have finished exchanging messages. It performs the following actions:

- Establishes through a [three-way handshake](<https://en.wikipedia.org/wiki/Handshake_(computing)#:~:text=%5Bedit%5D-,TCP%20three%2Dway%20handshake,-%5Bedit%5D>) where the sender and the receiver exchange control packets to synchronize and establish a connection.
- Determines how to break application data into packets that networks can deliver.
- Sends packets to, and accepts packets from, the network layer.
- Manages flow control.
- Handles retransmission of dropped or garbled packets, as it's meant to provide error-free data transmission.
- Acknowledges all packets that arrive.
- Terminates connection once data transmission is complete through a four-way handshake.

When a web server sends an [HTML](https://www.theserverside.com/definition/HTML-Hypertext-Markup-Language) file to a client, it uses the HTTP to do so. The HTTP program layer asks the TCP layer to set up the connection and send the file. The TCP stack divides the file into data packets, numbers them and then forwards them individually to the IP layer for delivery.

Although each packet in the transmission has the same source and destination IP address, packets may be sent along multiple routes. The TCP program layer in the client computer waits until all packets have arrived. It then acknowledges those it receives and asks for the retransmission of any it does not, based on missing packet numbers. The TCP layer then assembles the packets into a file and delivers the file to the receiving application.
