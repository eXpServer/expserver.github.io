# Stage 3: Epoll

## Recap

- We wrote a basic TCP client using Linux networking APIs
- We established successful connection with the TCP server written in Stage 1

## Introduction

Currently the server is only able to cater to one client. When the client disconnects, the server will break out of the recv-send while loop and exit the program.

In this stage we will modify the `tcp_server.c` code to facilitate **concurrency**. Concurrency refers to the ability to handle multiple clients simultaneously. We will achieve this with the help of **_epoll_**.

### epoll

epoll is a I/O event notification mechanism provided by the Linux kernel. It allows applications to efficiently monitor multiple file descriptors (such as sockets) for various I/O events. Read about epoll [here](https://www.notion.so/epoll-65f310e89d9b4ae79fff4397c295d636?pvs=21).

## Implementation

![implementation.png](/assets/stage-3/implementation.png)

Let’s understand the requirement clearly once again. We have one single port that is listening for incoming client connections. Through this port, we want to be able to accept multiple clients, and cater to all of them.

Think of the `tcp_server.c` as two parts:

- Creating the server; creating the listening socket, binding it to a port and made the server listen on it
- Accepting clients

In hind sight, we will only be changing the part of the code where we are accepting the incoming client connections as the server setup does not need any change.

The section that we’ll be modifying is given below:

```c
int conn_sock_fd = accept(listen_sock_fd, (struct sockaddr *)&client_addr, &client_addr_len);

while(1) {
	...
}
```

This step allowed us to connect to one client and keep serving them indefinitely until the connection is broken.

Now let’s use epoll to achieve our goal.

First we’ll create an epoll instance using `epoll_create1(0)` given by the `<sys/epoll.h>` library. This returns a file descriptor (FD), and lets call it `epoll_fd`. Remember FD’s are just integers (unsigned integers, to be specific).

We need the epoll to do two things:

1. To monitor specific FD’s that we are interested in and notify us if there is any events in it.
2. To store the events that occur in the FD’s that we are interested in.

`struct epoll_event` is a structure provided by the `<sys/epoll.h>` library just for this purpose. So lets create two of them for the above mentioned purposes.

1. `event` - to hold information about the events our epoll should monitor
2. `events[MAX_EPOLL_EVENTS]` - to store the events that occur

The structure definition of `epoll_event` is given below:

```c
struct **epoll_event** {
		uint32_t      events;  /* Epoll events */
		**epoll_data_t**  data;    /* User data variable */
};

union epoll_data {
		void     *ptr;
    int       fd;
    uint32_t  u32;
    uint64_t  u64;
};

typedef union epoll_data **epoll_data_t**;
```

We are now ready to utilize our epoll instance. What FD do we want to monitor first? The listening socket.

So let’s add the listening socket FD to the epoll; `event`to be specific. This will allow us to listen to incoming connections requests.

```c
event.events = EPOLLIN;
event.data.fd = /* listen socket FD */
epoll_ctl(epoll_fd, EPOLL_CTL_ADD, /* listen socket FD */, &event);
```

- `EPOLLIN` - specifies that event to monitor for the listening socket is of type read
- `epoll_ctl` - used to add, modify, or remove entries in the interest list of epoll; in this case we are adding the listening socket FD to our epoll instance `epoll_fd`. The `EPOLL_CTL_ADD` command tells epoll to add this socket to its monitoring list, using the event configuration specified in `event`.

---

### Milestone #1

Let’s recap for a bit and look at what we have done as understanding of how epoll works is crucial.

- We created an epoll instance
- We created two structures to store information related to epoll
- We added the listening socket FD to epoll

---

Now we wait. We wait till there are events in `events[]` that are ready to read. For this we use the function `epoll_wait`. It returns the number of FD’s for which events have occurred and are ready to be processed. The events themselves will be stored in the `events[]`. Let’s also not forget to wrap this in an infinite loop to keep the server running indefinitely.

```c
while(1) {
	int n_ready_fds = epoll_wait(epoll_fd, events, MAX_EPOLL_EVENTS, -1);
	...
}
```

Now that we got the number of events, let’s iterate through and process them:

```c
for(/* interate from 0 to n_ready_fds */) {
	...
}
```

Since the epoll is only monitoring the listening socket right now, the events will be from that only.

So when we get events on listen socket, accept the connection, and create a connection socket like how we did in the previous stages. The only difference here is to add the connection socket FD also to the epoll. This will allow us to know if and when events occur on the connection socket.

This means that, from the next iteration, we could get two types of events:

- event is on listen socket
- event is on connection socket

The for loop should address both the cases and a simple if-else would be sufficient to differentiate between them:

```c
if (/* event is on listen socket */) {
	...
}
else if (/* else if its a connection socket */) {
	...
}
```

If the event is on the connection socket, read message from client, print it on the terminal, reverse the message and send it to the client.

The code within the `if` and `else` should be straight forward as we have implemented it previously in Stage 1.

---

At the end your code should look like this.

```c
/* previous code */

/* epoll setup */

/* adding listening socket to epoll */

while(1) {
	int n_ready_fds = epoll_wait(epoll_fd, events, MAX_EPOLL_EVENTS, -1);

	for (/* interate from 0 to n_ready_fds */) {
		if (/* event is on listen socket */) {

			/* accept connection */

			/* add client socket to epoll */

		}
		else if (/* else if its a connection socket */) {

			/* read message from client */

			/* reverse message */

			/* send reversed message to client */

		}
	}
```

### Milestone #2

## Conclusion

That’s it! The server is now capable of handling multiple clients simultaneously, showcasing the power of epoll. In the next stage, we'll develop a straightforward TCP proxy. If you're unfamiliar with the concept, don't worry—the introduction section will provide clarity.
