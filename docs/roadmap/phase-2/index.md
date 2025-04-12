# Phase 2: Overview
## Recap of Phase 1

After the completion of phase 1, we have built the basic version of eXpServer, which is capable of handling reverse proxy and static file serving. On progressing through each stages in phase 1, we have implemented various modules that form the building blocks for the server. Let’s have a quick recap of the stages in phase 1. 

- In stage 6, we have created the listener and connection modules. Listener module deals with creation of listening socket and handling read events on the listening socket. It’s also responsible for creating a connection instance for the connected client. The connection module creates instances for the TCP connections and deals with sending and receiving of data.
- In stage 7, core and loop modules were created. Core module acts as a container for all other modules of eXpServer. Loop module acts as the engine for the server, which handles all the events occurring on the TCP sockets attached to epoll.
- In stage 8, we have made the sockets non blocking.
- In stage 9, we have implemented epoll in edge triggering mode, which has improved the CPU utilization.
- In stage 10, we have seen pipes for data exchange between modules. Pipes have improved the overall memory utilization.
- In stage 11, the upstream module was created. All the client requests from port 8001, was directed to the upstream server using the upstream module.
- In stage 12, serving of static files was implemented. All the client requests on port 8002, was for file serving. It was implemented with the help of file module.
- In stage 13, we have created a new module named session, which acts as an intermediary between client and either upstream or file module.

## What to expect in Phase 2

In phase 1, we have built a functional eXpServer that supports the basic functionalities of reverse proxying and static file serving. We have used TCP protocol as the basic protocol for data transmission. But till now both the client and server was running and communicating with each other via a terminal. Even though TCP is ensuring reliable data transmission, but it cannot define how data is formatted or interpreted, making it impossible to communicate meaningfully with clients. It lacks the necessary capabilities to effectively serve clients, manage interactions, and provide a meaningful user experience. 

Thus there comes a need to incorporate the application layer protocols in eXpServer, to have a better client interaction and user experience. Without an application layer protocol like HTTP, the server cannot deliver web pages or content in a way that browsers can understand. HTTP is the one of the most important application layer protocol used for enabling web communication. All communication from a browser (client) to the server and vice versa would be in the form of HTTP messages. In this phase, we will introduce the notion of HTTP, and make our server HTTP compatible. 

HTTP requests and responses form the important part of modern web, that enables communication between clients and servers. An HTTP request is sent by a client to the server requesting a resource typically a web page, image or data. An HTTP response is the server’s reply to an HTTP request. In this phase new modules will be created for supporting HTTP features. We will implement an HTTP parser, that can parse the incoming client requests to a structured HTTP request. An http request module and http response module would be created for handling the HTTP requests and HTTP responses.