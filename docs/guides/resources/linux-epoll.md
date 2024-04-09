# Linux epoll

**_epoll_** stands for _event poll_ and is a Linux-specific construct. It allows a process to monitor multiple file descriptors and receive notifications when an event occurs on them. Essentially, it's a kernel data structure facilitating I/O multiplexing on multiple file descriptors.

epoll can be managed through three system calls, facilitating its creation, modification, and deletion. It's notably employed in [Nginx](https://en.wikipedia.org/wiki/Nginx), a popular web server, and it's a fundamental component of our implementation of eXpServer as well.

## **The Problem**

The core challenge in running a network service is the speed discrepancy between the server and client networks. Typically, a server handling a request involves reading the user's request (e.g., [HTTP GET](https://en.wikipedia.org/wiki/HTTP#Request_methods)), processing it, and then writing a response (e.g., an [HTML](https://en.wikipedia.org/wiki/HTML) page).

```Text
read user's request (eg. HTTP GET)
server process request
write a response (eg. HTML page with the requested info)
```

Traditional servers, such as [Apache](https://en.wikipedia.org/wiki/Apache_HTTP_Server), which spawn a new thread for each request, face significant hurdles when a large number of connections attempt to connect simultaneously, often leading to the infamous [C10K problem](https://en.wikipedia.org/wiki/C10k_problem).

The question arises: Can we utilize server idle time (reading and writing) more productively?

## **The Solution**

In 2001, Davide Libenzi addressed this issue for Linux with the inception of **epoll**. By 2003, with the release of stable kernel 2.6, epoll became widely available.

epoll enables a single thread or process to register interest in a vast array of network sockets. A call to `epoll_wait` will then block until one of these sockets is ready for reading or writing. With epoll, a single thread can manage tens of thousands of concurrent (and mostly idle) requests efficiently.

epoll subtly alters the architecture of applications. Instead of a linear sequence of reading a request, handling it, and writing a response, we adopt a loop:

```Text
loop
  epoll_wait on all connections
  for each of the ready connections:
    continue from where you left off
```

This approach allows you to manage multiple connections simultaneously, handling each as required without blocking. It necessitates remembering the state of each connection, performing only as much I/O as each socket can handle without blocking, and then resuming the loop with `epoll_wait` to monitor additional events.

![linux-epoll-architecure.png](/assets/resources/linux-epoll-architecture.png)

### In simple words

- The process that uses epoll creates an epoll instance using `epoll_create1()`.
- The process can add file descriptors (FD) that it wants to monitor to the epoll instance using `epoll_ctl()`
- Then the server calls the `epoll_wait()` function. This function will [block](<https://en.wikipedia.org/wiki/Blocking_(computing)>) the process till there are some events on the monitored events
- If some activity is detected in the FD’s the process will unblock from `epoll_wait()` and handle the events
- The process goes back to `epoll_wait()` when all the events are handled

To get a more in-depth look into the Linux epoll, refer [Linux epoll Tutorial](/guides/resources/linux-epoll-tutorial).

<!-- ![linux-epoll-usage.png](/assets/resources/linux-epoll-usage.png) -->
