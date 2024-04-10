# Phase 0 Overview

## What to expect in Phase 0

In Phase 0, we will go through the basic networking conecpts that are essential for building eXpServer.

## File structure

All the code associated with the project will be contained in a directory named `expserver`.

As we go through the documentation, we will be asked to create directories and files with specific names. It is recommended to follow the mentioned convention in order to maintain consistency.

### Phase 0 initial file structure

![filestructure.png](/assets/phase-0-overview/filestructure.png)

## Introduction

To get a clear understanding of what we are going to do, we need to setup a foundation of the basics. So, let us start from the beginning.

Imagine a situation where we launch a web browser and navigate to a website. In this scenario, the browser acts as a **client**, sending a request to access the website, while the content of the website is provided by a **server**.

We call this the **client-server model** or the **client-server architecture.**

- **Client**: A system that uses remote services provided by a server. They initiate communication with servers by sending requests for specific services or data.
- **Server**: A system that provides services to other systems in a network. They typically run continuously and are designed to handle requests from multiple clients simultaneously. Read more about servers below.

---

When someone says the word server, we immediately get a picture of huge datacentres with lots computers, expensive hardware, wires and blinking lights. But in reality, **server is just a program** that is running on a computer. The term “server” just describes the role or the purpose of what the program does.

A server's role is to provide data or services requested by ‘someone’. That someone is a client, which again is just a program, that initiates communication by asking the server for what it needs. When a client requests something, the server fulfils the request by providing the requested data or service.

::: tip INFO
The computers in huge datacentres are different. Their size is primarily due to the high _traffic_ that these servers (programs) need to handle. To manage the high volume of traffic effectively, the servers require more computing power and bandwidth.
:::

In this project we will be using the [TCP/IP procotol suite](https://en.wikipedia.org/wiki/Internet_protocol_suite) for seting the server.

The underlying communication between the devices is taken care by [network sockets](https://en.wikipedia.org/wiki/Network_socket). They enable bidirectional data flow, allowing processes to send and receive data over a network connection. We will extensively use sockets while writing eXpServer.
