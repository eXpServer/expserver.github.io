# Internet Protocol (IP)

**Internet Protocol (IP)** is the protocol part of the [TCP/IP](/guides/resources/tcp-ip-model) for sending data from one device to another across the internet. Every device has an **IP address** that uniquely identifies it and enables it to communicate with and exchange data with other devices connected to the internet. Today, it’s considered the standard for fast and secure communication.

<!-- IP protocol's main purpose is to deliver data packets between the source application or device and the destination using methods and structures that place tags, such as address information, within data packets. -->

Data traversing the Internet is divided into smaller pieces, called [packets](https://en.wikipedia.org/wiki/Network_packet). IP information is attached to each packet, and this information helps routers to send packets to the right place. Every device or domain that connects to the Internet is assigned an IP address, and as packets are directed to the IP address attached to them, data arrives where it is needed.

Once the packets arrive at their destination, they are handled differently depending on which transport protocol is used in combination with IP. The most common transport protocols are [TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) and [UDP](https://en.wikipedia.org/wiki/User_Datagram_Protocol).

## IP address

An **Internet Protocol (IP) address** is the unique identifying number assigned to every device connected to the internet. An IP address definition is a numeric label assigned to devices that use the internet to communicate. Computers that communicate over the internet or via local networks share information to a specific location using IP addresses.

IP addresses have two distinct versions or standards:

- The Internet Protocol version 4 ([IPv4](https://en.wikipedia.org/wiki/Internet_Protocol_version_4)) address is the older of the two, which has space for up to 4 billion IP addresses and is assigned to all computers.
- The more recent Internet Protocol version 6 ([IPv6](https://en.wikipedia.org/wiki/IPv6)) has space for trillions of IP addresses

Every device with an internet connection has an IP address, whether it's a computer, laptop, IoT device, or even toys. The IP addresses allow for the efficient transfer of data between two connected devices, allowing machines on different networks to talk to each other.

Read more about them [here](https://en.wikipedia.org/wiki/IP_address).

## Port numbers

Port numbers are associated with TCP and are 16-bit unsigned integers used to uniquely identify applications or services running on a computer within a network.

They provide a way for incoming data packets to be directed to the appropriate application or service on a host machine.

It ranges from 0 to 65535. They are divided into the following categories:

- 0 to 1023 - Reserved for well-known services
- 1024 to 49151 - Registered ports assigned by the Internet Assigned Numbers Authority (IANA) for specific services
- 49152 to 65535 - Dynamic or private ports that can be used by applications dynamically.

Read more about them [here](<https://en.wikipedia.org/wiki/Port_(computer_networking)>).
