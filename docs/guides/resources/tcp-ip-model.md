# TCP/IP Model

The TCP/IP model, short for Transmission Control Protocol/Internet Protocol, is a conceptual framework used to understand how data is transmitted over a network. It consists of four layers, each responsible for specific tasks related to communication.

![tcp-ip.png](/assets/phase-0-overview/tcp-ip.png)

## **1. Application Layer**

At the top of the TCP/IP model is the Application layer. This layer is responsible for providing network services directly to end-users or applications. It includes protocols such as [HTTP](https://en.wikipedia.org/wiki/HTTP), [FTP](https://en.wikipedia.org/wiki/File_Transfer_Protocol), [SMTP](https://en.wikipedia.org/wiki/Simple_Mail_Transfer_Protocol), and [DNS](https://en.wikipedia.org/wiki/Domain_Name_System). These protocols define how applications interact with the network and enable tasks such as web browsing, file transfer, email communication, and domain name resolution.

## **2. Transport Layer**

The Transport layer sits above the Internet layer and is responsible for end-to-end communication between devices. It ensures that data is reliably transmitted across the network. The primary protocols operating at this layer are Transmission Control Protocol ([TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol)) and User Datagram Protocol ([UDP](https://en.wikipedia.org/wiki/User_Datagram_Protocol)). TCP provides reliable, connection-oriented communication, while UDP offers a connectionless, unreliable transmission mechanism.

In this project, we will be using the [TCP socket](https://en.wikipedia.org/wiki/Network_socket) programming interface for communication.

## **3. Internet Layer**

The Internet layer is responsible for routing packets across different networks to their destination. It uses [IP (Internet Protocol)](https://en.wikipedia.org/wiki/Internet_Protocol) to handle addressing and packet forwarding. IP is a connectionless protocol that provides the necessary addressing information to route packets from the source to the destination across multiple network devices.

## **4. Link Layer**

At the bottom of the TCP/IP model is the Link layer, also referred to as the [Link layer](https://en.wikipedia.org/wiki/Link_layer). This layer deals with the physical and logical connections between devices on the same network. It includes protocols such as [Ethernet](https://en.wikipedia.org/wiki/Ethernet), and [Wi-Fi (IEEE 802.11)](https://en.wikipedia.org/wiki/IEEE_802.11#:~:text=IEEE%20802.11%20is%20used%20in,networks%20with%20IEEE%20802.11p.). The Link layer is responsible for encapsulating data into frames for transmission over the physical network medium and handling error detection and correction.
