# Internet Protocol (IP)

The Internet Protocol (IP) is a protocol, or set of rules, for routing and addressing packets of data so that they can travel across networks and arrive at the correct destination. Data traversing the Internet is divided into smaller pieces, called **packets**. IP information is attached to each packet, and this information helps network routers to send packets to the right place.

Once the packets arrive at their destination, they are handled differently depending on which transport protocol is used in combination with IP. The most common transport protocols are TCP and UDP.

## **What is an IP address?**

An IP address is a unique identifier assigned to a device or domain that connects to the Internet. Each IP address is a series of characters, such as '192.168.1.1'.

Each IP packet will contain both the IP address of the device or domain sending the packet and the IP address of the intended recipient, much like how both the destination address and the return address are included on a piece of mail.

## **What is an IP packet?**

IP packets are created by adding an IP header to each packet of data before it is sent on its way. An IP header is just a series of bits (ones and zeros), and it records several pieces of information about the packet, including the sending and receiving IP address.

![Untitled](/assets/phase-0-overview/ip.png)
