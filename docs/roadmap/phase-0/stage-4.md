# Stage 4: Linux epoll

## Recap

- In stage 2, we made the TCP server iterative and connected multiple clients one after the other.
- In stage 3, we wrote UDP server code to handle multiple clients simultaneously using multithreading.

## Learning Objectives

- We will modify our TCP server from [Stage 1](/roadmap/phase-0/stage-1) to serve multiple clients simultaneously using epoll.

## Introduction

In the previous stage we have created a concurrent server using multithreading mechanism to handle multiple clients at a time. In this stage we will use another approach to fix the drawbacks that we encountered in Stage 2. We will achieve this with the help of **_epoll_**.

### epoll

[epoll](https://en.wikipedia.org/wiki/Epoll) is an I/O event notification mechanism provided by the Linux kernel. It allows applications to efficiently monitor multiple file descriptors for various I/O events.

There are various [asynchronous I/O](https://en.wikipedia.org/wiki/Asynchronous_I/O) mechanisms available in operating systems. We have chosen epoll as it is widely used in modern servers such as nginx.

## Implementation

![implementation.png](/assets/stage-3/implementation.png)

Let us clearly understand the requirement once again. We have one single port that is listening for incoming client connections. Through this port, we want to be able to accept multiple clients, and cater to all of them simultaneously. We have already achieved this in stage 3 using multithreading. In this stage we are incoorporating the same functionility using a single thread with epoll mechanism. Multithreading involves switiching between threads which is considered less efficient in comparison with epoll.

Think of [`tcp_server.c`](/roadmap/phase-0/stage-1.md#tcp-server-c) (implemented in stage 1) as two parts:

1. **Setting up the server and waiting for clients**

   - Creating the listening socket
   - Binding the socket to a port
   - Making the socket listen on the port

2. **Accepting and serving clients**

   - Accept client connection
   - Revieve and send messages to client

We will only be changing the part of the code where we are accepting the incoming client connections as the server setup does not need any change.

The code until `listen()` will remain the same. The code snippet below is the only part that will require modification.

```c
// tcp_server.c

while(1) {
  int conn_sock_fd = accept(listen_sock_fd, (struct sockaddr *)&client_addr, &client_addr_len);

  while(1) {
    // recv() and send()
    ...
  }
}
```

The above code allowed us to connect to one client at a time and keep serving them indefinitely until the connection is broken.

Now let us modify this section and use epoll to achieve our goal of concurrency.

::: tip PRE-REQUISITE READING
- Read about [Introduction to epoll](/guides/resources/introduction-to-linux-epoll).
- Read about [Linux epoll](/guides/resources/linux-epoll)
:::

First we’ll create an epoll instance using [`epoll_create1()`](https://man7.org/linux/man-pages/man2/epoll_create.2.html) given by the `<sys/epoll.h>` header. This returns a file descriptor (FD), and lets call it `epoll_fd`. Remember FD’s are just integers (unsigned integers, to be specific).

```c
int epoll_fd = epoll_create1(0);
```

We need _epoll_ to monitor specific FD’s that we are interested in (listening socket and connection sockets) and notify us if there are any events on it.
`struct epoll_event` is a structure provided by the `<sys/epoll.h>` that specifies event related data that epoll provides. We will be using an `event` variable and an `events` array of `struct epoll_event` type for the following purposes

1. `event` - to setup a FD with the events that should be monitored for and pass on to [`epoll_ctl()`](https://man7.org/linux/man-pages/man2/epoll_ctl.2.html) function to register it with `epoll_fd`.
2. `events[MAX_EPOLL_EVENTS]` - to store the events that occur

```c
struct epoll_event event, events[MAX_EPOLL_EVENTS];
```

::: tip NOTE
Add this to global definitions:

```c
#define MAX_EPOLL_EVENTS 10
```

`MAX_EPOLL_EVENTS` - maximum number of events that can be notified by the epoll at a time

:::

The structure definition of `epoll_event` is given below for our understanding. The fields that are relevent to the project will be explained when required.

::: info
In the current stage, we will look into how to get epoll working. A closer look at epoll will be done at a later stage.
:::

```c
struct epoll_event {
  uint32_t      events;  /* Epoll events (eg: EPOLLIN,EPOLLOUT,EPOLLET) */
  epoll_data_t  data;    /* User data variable */
};

union epoll_data {
  void     *ptr;  /* Pointer to a user defined data structure */
  int       fd;   /* File descritor of the socket we are monitoring*/
  uint32_t  u32;  /* Not used within the scope of this project */
  uint64_t  u64;  /* Not used within the scope of this project */
};

typedef union epoll_data epoll_data_t;
```

:::info IMPORTANT NOTE

**Fields inside `struct epoll_event`**

**`events`**  
event flags indicating which I/O conditions to monitor (`EPOLLIN`, `EPOLLOUT`, etc.) and which of them actually occurred.

<!--since nested block is not possible this is a workaround using HTML code-->
<div class="custom-block danger">
  <p>
    In this project, the results of <code>epoll_wait()</code> are kept in an array
    named <code>events</code>, so the event flags naturally appear in the code as
    <code>events[i].events</code>.
  </p>
</div>

**`data`**  
User-defined payload returned unchanged by the kernel. Used to associate the file descriptor with application-specific state.

**Fields inside `union epoll_data`**

**`ptr`**  
Pointer to application-defined context or a custom struct.  
This is the primary method used in later stages and is what makes `epoll_event` highly useful.

**`fd`**  
Stores the file descriptor directly. Useful when no additional state or context is required.

**`u32 / u64`**  
Integer fields for lightweight IDs or metadata.  
(Not used within the scope of this project.)

:::


:::tip Union
`epoll_data_t` is implemented as a union. Since all members overlap in memory, only one field holds a valid value at a time.
:::


We are now ready to utilize our epoll instance. The first FD we would like to monitor is the listening socket. So let us add that to the epoll. This will allow us to get notified of incoming connection requests.

```c
event.events = EPOLLIN;
event.data.fd = /* listen socket FD */
epoll_ctl(epoll_fd, EPOLL_CTL_ADD, /* listen socket FD */, &event);
```

- `EPOLLIN` - specifies that we are interested in read events on the socket
- `epoll_ctl` - used to add, modify, or remove entries in the interest list of epoll; in this case we are adding the listening socket FD to our epoll instance `epoll_fd`. The `EPOLL_CTL_ADD` flag tells the epoll system call to add this socket to its monitoring list, using the event configuration specified in `event`.

---

### Milestone #1

Let us recap and look at what we have done so far

- We created an epoll instance
- We added the listening socket FD to epoll to monitor read events

---

Next step is to wait for any events to happen. For this we use the [`epoll_wait()`](https://man7.org/linux/man-pages/man2/epoll_wait.2.html) blocking system call provided by the `<sys/epoll.h>` header.

```c
while(1) {
  int n_ready_fds = epoll_wait(epoll_fd, events, MAX_EPOLL_EVENTS, -1);
  ...
}
```

When some event has ouccured on the FDs that we added to the epoll, `epoll_wait()` returns the number of FD’s for which events have occurred. The events themselves will be stored in the `events[]`. We wraped this in an infinite loop to keep the server running indefinitely.

Now that we got the number of events, we have to iterate through the `events[]` array and proccess them. Since the epoll is only monitoring the listening socket right now the events will be from that only.

```c
  for(/* interate from 0 to n_ready_fds */) {
    int curr_fd = events[i].data.fd;

    /* accept client connection and add to epoll */

  }
```

When we get a read event on the listen socket, we accept the connection and create a connection socket like we did in the previous stages. The only crucial difference here is to add the connection socket FD to the epoll. This will allow us to be notified of events that occur on the connection socket.

This means that, from the next iteration, we could get two types of events:

- event on listen socket
- event on connection socket

The for loop should address both the cases and a simple if-else would be sufficient to differentiate between them:

```c
  for(/* interate from 0 to n_ready_fds */) {
    int curr_fd = events[i].data.fd;

    if (/* event is on listen socket */) {
    	...
    }
    else { // event on connection sockect
    	...
    }
  }
```

If the event is on the connection socket, read message from client, print it on the terminal, reverse the message and send it to the client.

The code within the `if` and `else` should be straight forward as we have implemented it previously in Stage 1.

---

At the end, our code should look like this.

```c
/* previous code till listen() */

/* epoll setup */

/* adding listening socket to epoll */

while(1) {
  printf("[DEBUG] Epoll wait\n");
  int n_ready_fds = epoll_wait(epoll_fd, events, MAX_EPOLL_EVENTS, -1);

  for (/* iterate from 0 to n_ready_fds */) {

	if (/* event is on listen socket */) {

      /* accept connection */

	  /* add client socket to epoll */

	}
	else { // It is a connection socket

	  /* read message from client */

	  /* reverse message */

	  /* send reversed message to client */

	}
}
```

---

### Milestone #2

Time to test our server! Compile and start `tcp_server.c` in a terminal. We should get the following message:

```bash
[INFO] Server listening on port 8080
[DEBUG] Epoll wait
```

The `[DEBUG]` statement confirms that the epoll instance is created and has entered the while loop and the program is blocked till any events occur on FDs registered with the epoll.

On another terminal, run `tcp_client.c`. Lets call this _client#1_. _client#1_ terminal will print this:

```bash
[INFO] Connected to server
```

Upon client connection to server, the server terminal will enter the `epoll_wait` state again.

```bash
[INFO] Client connected to server
[DEBUG] Epoll wait
```

Open another client instance, say _client#2_ and connect to the server. We will get the same client message as the previous one. But the server terminal will notify that another client has connected to the server:

```bash
[INFO] Client connected to server
[DEBUG] Epoll wait
[INFO] Client connected to server
[DEBUG] Epoll wait
```

Both the clients are connected to server at the same time! Try sending messages from both client terminals and see the output in _client#1_, _client#2_ and the server terminal.

Here is the expected output:

![milestone-2.png](/assets/stage-3/milestone-2.png)

## Conclusion

The server is now capable of handling multiple clients simultaneously using the _epoll_ I/O event notification mechanism in Linux. Recall that this is one of the methods that can be done to provide concurrency.


