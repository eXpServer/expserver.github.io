# Network Protocols & Models

In networking, a protocol is a set of rules for formatting and processing data. Network protocols are like a common language for computers. The computers within a network may use vastly different software and hardware; however, the use of protocols enables them to communicate with each other regardless.

On the Internet, there are different protocols for different types of processes. Protocols are often represented in two different network models:

- OSI Model
- TCP/IP Model

## OSI Model

The open systems interconnection (OSI) model is a conceptual model created by the International Organization for Standardization which enables diverse communication systems to communicate using standard protocols. In plain English, the OSI provides a standard for different computer systems to be able to communicate with each other.

The OSI Model can be seen as a universal language for computer networking. It is based on the concept of splitting up a communication system into seven abstract layers, each one stacked upon the last.

Each layer of the OSI Model handles a specific job and communicates with the layers above and below itself.

The seven abstraction layers of the OSI model can be defined as follows, from top to bottom:

### 7. Application layer

This is the only layer that directly interacts with data from the user. Software applications like web browsers and email clients rely on the application layer to initiate communications.

Application layer is responsible for the protocols and data manipulation that the software relies on to present meaningful data to the user.

![Untitled](/assets/phase-0-overview/application.png)

HTTP is an example of an application layer protocol. We will be working with this for eXpServer’s implementation.

### **6. Presentation layer**

This layer is primarily responsible for preparing data so that it can be used by the application layer. The presentation layer is responsible for translation, encryption, and compression of data.

![Untitled](/assets/phase-0-overview/presentation.png)

### 5. Session layer

This is the layer responsible for opening and closing communication between the two devices. The time between when the communication is opened and closed is known as the session.

![Untitled](/assets/phase-0-overview/session.png)

The session layer ensures that the session stays open long enough to transfer all the data being exchanged, and then promptly closes the session in order to avoid wasting resources.

### 4. T**ransport layer**

Layer 4 is responsible for end-to-end communication between the two devices. This includes taking data from the session layer and breaking it up into chunks called segments before sending it to layer 3. The transport layer on the receiving device is responsible for reassembling the segments into data the session layer can consume.

![Untitled](/assets/phase-0-overview/transport.png)

The transport layer is also responsible for flow control and error control. Flow control determines an optimal speed of transmission to ensure that a sender with a fast connection does not overwhelm a receiver with a slow connection. The transport layer performs error control on the receiving end by ensuring that the data received is complete, and requesting a retransmission if it isn’t.

### 3. N**etwork layer**

The network layer is responsible for facilitating data transfer between two different networks.

![Untitled](/assets/phase-0-overview/network.png)

It breaks up segments from the transport layer into smaller units, called packets, on the sender’s device, and reassembling these packets on the receiving device. The network layer also finds the best physical path for the data to reach its destination; this is known as routing.

### 2. Data link layer

The data link layer is very similar to the network layer, except the data link layer facilitates data transfer between two devices on the *same* network. The data link layer takes packets from the network layer and breaks them into smaller pieces called frames.

![Untitled](/assets/phase-0-overview/data-link.png)

Like the network layer, the data link layer is also responsible for flow control and error control in intra-network communication

### 1. P**hysical layer**

This layer includes the physical equipment involved in the data transfer, such as the cables. This is also the layer where the data gets converted into a bit stream, which is a string of 1s and 0s.

![Untitled](/assets/phase-0-overview/physical.png)

The physical layer of both devices must also agree on a signal convention so that the 1s can be distinguished from the 0s on both devices.

## TCP/IP Model

The TCP/IP or the *Transmission Control Protoco*l/_Internet Protocol_ is a communication protocol suite using which network devices can be connected to the Internet.

The OSI model on the other hand is a logical model. It was designed to describe the functions of the communication system by dividing the communication procedure into smaller and simpler components.

The TCP/IP model is a concise version of the OSI model. It contains four layers, unlike the seven layers in the OSI model.

![Untitled](/assets/phase-0-overview/tcp.png)

Read more about IP [here](/guides/resources/ip).
