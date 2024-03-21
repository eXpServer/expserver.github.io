# Stage 3: Linux EPOLL

## Recap

- We wrote a basic TCP client using linux networking APIs
- We established successful connection with the TCP server written in Stage 1

## Introduction

Currently the server is only able to cater to one client. When the client disconnects, the server will break out of the recv-send while loop and exit the program.

In this stage we will modify the `tcp_server.c` code to facilitate **concurrency**. Concurrency refers to the ability to handle multiple clients simultaneously. We will achieve this with the help of _EPOLL_.

There will be slight changes in some terminologies that we have used in the previous stages. It will be mentioned wherever applicable.

### EPOLL

EPOLL is a I/O event notification mechanism provided by the Linux kernel. It allows applications to efficiently monitor multiple file descriptors (such as sockets) for various I/O events.

Here is a high level overview of the functionality of EPOLL

![epoll.png](../../assets/epoll.png)

## Implementation

Recall the setup of how we created a listening socket, bound it to a particular port and made it listen on it. No changes are required to that.

The section that we’ll be modifying is given below:

```c
int conn_sock_fd = accept(listen_sock_fd, (struct sockaddr *)&client_addr, &client_addr_len);

while(1) {
	...
}
```

This step allowed us to connect to one client and keep serving them indefinity until the connection is broken.

As mentioned before we will edit this part of the code to serve multiple clients simultaneously using EPOLL.

Create an instance of EPOLL using the `epoll_create1()` function provided by the `<sys/epoll.h>` library. The function will return a FD, and lets call it `epoll_fd`.

We need a way to store the events that occur in EPOLL. For this, create an object of instance `struct epoll_event`.

```c
struct epoll_event {
	uint32_t      events;  /* Epoll events */
	epoll_data_t  data;    /* User data variable */
};

union epoll_data {
	void     *ptr;
  int       fd;
  uint32_t  u32;
  uint64_t  u64;
};
typedef union epoll_data epoll_data_t;
```

Add the listening socket FD to the EPOLL event list and set the events field to `EPOLLIN`. This sets the event being registered is for read operations.

Attach the EPOLL event object to `epoll_fd` using the `epoll_ctl()` function.

```c
epoll_ctl(epoll_fd, EPOLL_CTL_ADD, listen_sock_fd, &event);
```

Now that we have attached the listening socket to EPOLL, if there is any event on the socket, a callback will be triggered.
