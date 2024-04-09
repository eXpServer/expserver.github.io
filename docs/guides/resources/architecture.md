# Architecture

## What can eXpServer do?

Before we get into the architecture of eXpServer, lets take a look at what all things a web server is expected to do. We will take [Nginx](https://nginx.org/en/) a popular modern web server as our reference.

After [installing](https://nginx.org/en/linux_packages.html#instructions) Nginx on a computer, it will be run as a [background process](https://en.wikipedia.org/wiki/Background_process). Nginx starts by reading a configuration file by the name of `nginx.conf` usually present at the path `/etc/nginx` . According to the configuration, Nginx will serve static files from a folder, [reverse proxy](https://en.wikipedia.org/wiki/Reverse_proxy) requests to [upstream servers](https://en.wikipedia.org/wiki/Upstream_server), do [load balancing](https://www.cloudflare.com/en-gb/learning/performance/what-is-load-balancing/) or a number of other things. Here is a [beginner’s guide](https://nginx.org/en/docs/beginners_guide.html) to Nginx.

eXpServer will work in a similar manner. It will take a configuration file which will describe how to serve each client request. eXpServer will have two primary objectives.

- Serve static files
- Reverse proxy requests

Other associated features such as load balancing, gzip compression etc. will be built on top of this in later stages of the roadmap.

In order to achieve these objectives, we need to implement the [HTTP protocol](https://en.wikipedia.org/wiki/HTTP) on top of [TCP](https://en.wikipedia.org/wiki/Transmission_Control_Protocol) using [socket programming](https://en.wikipedia.org/wiki/Berkeley_sockets) APIs provided by the operating system.

## Architecture

When it comes to web servers, there are primarily 2 types of architectures.

- [Multi-threaded](<https://en.wikipedia.org/wiki/Multithreading_(computer_architecture)>) architecture. eg: [Apache](https://httpd.apache.org/)
- Single-threaded, event-driven, asynchronous architecture. eg [Nginx](https://nginx.org/en/)

Let us break it down. In a multi-threaded architecture such as that of Apache, a new [thread](<https://en.wikipedia.org/wiki/Thread_(computing)>) is created to handle every connection. Using threads allow the server to handle multiple clients simultaneously with the operating system taking care of thread scheduling. However, using a separate thread for every connection results in significant overhead on system resources.

Due to this limitation, most modern web servers uses a single-threaded, event-driven, asynchronous architecture. What exactly does all these terms mean?

- **Single-threaded**: Uses a single OS [thread](<https://en.wikipedia.org/wiki/Thread_(computing)>) to operate
- **Event-driven**: Uses [event](https://en.wikipedia.org/wiki/Event-driven_architecture) notification mechanisms provided by the operating system (such as [epoll](https://en.wikipedia.org/wiki/Epoll) in Linux) to efficiently monitor multiple events [sockets](https://en.wikipedia.org/wiki/Network_socket) and determine which operations are ready to be processed
- **Asynchronous**: Uses [asynchronous I/O](https://en.wikipedia.org/wiki/Asynchronous_I/O) that doesn't block and wait for the operation to complete

Read more about architecture of Nginx [here](https://aosabook.org/en/v2/nginx.html).

eXpServer uses an architecture similar to Nginx. Using the Linux [epoll](https://en.wikipedia.org/wiki/Epoll) I/O notification mechanism, eXpServer serves clients concurrently using a single thread.

## Modules

eXpServer is built in form of modules. A module will have _functions_ and _structs_ that take care of a specific task. Take a look at the following figure that roughly outlines the various modules in eXpServer.

![xps_architecture.png](/assets/resources/xps_architecture.png)

Let us go over each module one by one.

::: tip NOTE
A detailed view of the _structs_ and _functions_ present in each module will be explained in its corresponding stages along the roadmap.
:::

### `xps_core`

The `xps_core` module is the container to which all [instances](<https://en.wikipedia.org/wiki/Instance_(computer_science)>) of all other modules attach. It can be thought of as an instance of eXpServer.

### `xps_loop`

The `xps_loop` module contains the [event loop](https://en.wikipedia.org/wiki/Event_loop). Event loop is the engine that drives eXpServer. It is implemented using Linux [epoll](https://en.wikipedia.org/wiki/Epoll). TCP sockets are attached to epoll to monitor for events. On receiving event notifications, the loop will handle them through [callback functions](<https://en.wikipedia.org/wiki/Callback_(computer_programming)>). Another responsibility of the loop is to drive the **pipe system,** through which the bytes flow from one module to another.

### `xps_config`

The `xps_config` module is responsible for reading and parsing the configuration file, the path to which is provided as a [command line argument](https://en.wikipedia.org/wiki/Command-line_interface#Arguments). The configuration file is written in [Lua](https://www.lua.org/) and is parsed using the [LuaJIT](https://luajit.org/) compiler in to a configuration _struct_ and stored in the `xps_core` instance.

### `xps_listener`

The `xps_listener` module creates a TCP listening socket and attaches it to the loop (epoll) to receive notifications for read events on the socket. Read events on the listening socket indicate that a client is trying to connect to the server. On receiving a read event, a callback function is invoked - `listener_connection_handler()` which will accept the connection and create an `xps_connection` instance for the connected client. Along with creating the connection instance, an instance of `xps_session` is created, which is responsible for handling the client according to the configuration.

### `xps_connection`

The `xps_connection` module creates instances for TCP connections, be it a client or upstream server. The connection instance has handler functions which will take care of sending and receiving from the socket using the `send()` and `recv()` system calls respectively. A connection instance is ‘piped’ - attached using `xps_pipe` instances to an `xps_session` instance. These pipes allow the flow of bytes between them and the session instance will handle the client request according to the configuration file.

### `xps_session`

An `xps_sesion` instance is created in the previously mentioned `listener_connection_handler()` function at the same time a new client connection is accepted. The session instance is the orchestrator that handles the client requests. It will parse the incoming bytes from the client TCP connection using the `xps_http` module. According to the parsed HTTP request, session instance will look up the config to decide whether to serve a file or to reverse proxy the request. On deciding, an `xps_file` instance or an `xps_upstream` instance is created and attached using _pipes_ to the session instance. Then the bytes flow between the _client_ and corresponding _file_ or _upstream_ through the _session_ instance.
