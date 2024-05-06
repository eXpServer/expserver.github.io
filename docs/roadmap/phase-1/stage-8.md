# Stage 8: Non-Blocking Sockets

## Recap

- In the last 2 stages, we created listener, connection, core and loop modules.
- We saw that blocking I/O on sockets lead to inefficient connection handling.

## Learning Objectives

- Use network sockets in non blocking mode.

## Introduction

So far eXpServer has been doing a simple task. Receiving a string from a TCP client (_netcat_), reversing it and sending it back. We found that the approach we currently use with [blocking](<https://en.wikipedia.org/wiki/Blocking_(computing)>) sockets is not scalable when dealing with huge amounts of data and large number of connections. Inorder to mitigate this problem, in this stage we will be modifying our code to use non-blocking sockets.

### File Structure

![Filestructure.png](/assets/stage-8/filestructure.png)

## Design

From the experiment in Stage 7 we realized that when sending large amounts of data through a blocking socket, the process could block when the kernel buffer fills up.

But why doesn’t reading from a blocking socket cause the process to block? Actually, reading from a blocking socket can also cause the process to block. We saw this in the early stages of Phase 0 before the use of epoll.

When we call `recv()` on a blocking socket, if there is no data available in the kernel buffer, our process will block until some data arrives i.e. data is sent by the client. But when using epoll, we subscribe for read events (`EPOLLIN`). When we receive a read event from epoll, we can be sure that there is some data available in the kernel buffer. Thus a call to `recv()` will not block and instead return instantly with the data being copied from kernel buffer to the user buffer. Given below is a sample call to `recv()`:

```c
long read_n = recv(conn_sock_fd, user_buff, sizeof(user_buff), 0);
```

When calling `recv()`, the kernel will copy data from the kernel buffer to `user_buff` upto a maximum of `sizeof(user_buff)` bytes. On success it will return the no. of bytes copied to `user_buff` which is then saved in the variable `read_n`. This is all well and good. But what if `sizeof(user_buff)` is less than the total amount of bytes available in kernel buffer. Won’t we miss the rest of the data?

This is where epoll triggering modes comes in. By default epoll operates in **level triggered** mode. This means that as long as there is some data available in the kernel buffer we will receive a read notification in the next iteration of the event loop. Thus even though we might have missed some data in the first notification, we will keep on receiving notifications from epoll until there is no data left to read from the kernel buffer.

::: tip NOTE

We will be going more in-depth on epoll triggering modes in the next stage.

:::

So we understand that:

- Reading from a blocking socket is **OK** in epoll level triggered mode. The process will not block and we will not miss out on any received data.
- Writing to blocking socket is **NOT OK** as we could end up filling the kernel buffer and there by blocking the process.

What is the solution to this writing problem? Non-blocking sockets!

::: tip PRE-REQUISITE READING

Read about [Blocking & Non-Blocking Sockets](/guides/resources/blocking-and-non-blocking-sockets) before proceeding further.

:::

Now we know that a `send()` call on a non-blocking socket will return immediately regardless of the kernel buffer being full or not. Given below is a sample call to `send()`:

```c
long write_n = send(conn_sock_fd, user_buff, msg_size, 0);
```

When calling `send()`, the kernel will copy data from `user_buff` to kernel buffer and return the no. of bytes copied which is then saved in the variable `write_n`.

`write_n` could have different possible values:

- `write_n == msg_size`: All the data in the `user_buff` is copied to kernel buffer.
- `write_n < msg_size`: Only some data from `user_buff` is copied to kernel buffer.
- `write_n == -1` and `errno` is set: Some error has occurred. If `errno` is `EAGAIN` or `EWOULDBLOCK` then it means the kernel buffer is full. If any other error has occurred we can close the connection.

How do we handle each of these conditions? When all the data is copied to kernel buffer as in `write_n == msg_size` there is nothing to handle. When partial user buffer is copied or none of the user buffer is copied due to kernel buffer being full, then we have to save the rest of the data and try to re-send it when the kernel buffer clears.

To accomplish this we have to do two things:

- Get notifications when the socket is available for writing.
- Keep a buffer of un-sent data.

We can easily get notifications when the socket is available for writing by subscribing to write events in epoll. Currently when creating a connection, we attach connection to the loop by doing the following:

```c
// Inside xps_connection_create() in xps_connection.c

xps_loop_attach(core->loop, sock_fd, EPOLLIN, connection, connection_loop_read_handler);
```

At the moment `xps_loop_attach()` takes only a `read_cb`. We will modify it to take two more callback functions, `write_cb` and `close_cb`

- `write_cb` will be invoked when there is a write event on the socket, and
- `close_cb` will be invoked when the peer has closed the TCP connection.

In order to get notifications for write events we have to pass the `EPOLLOUT` flag. Close events are notified by default and hence does not require any flags.

Hence after modifications, the above line will look like this:

```c
// Inside xps_connection_create() in xps_connection.c

xps_loop_attach(core->loop, sock_fd, EPOLLIN | EPOLLOUT, connection, connection_loop_read_handler, connection_loop_write_handler, connection_loop_close_handler);
```

## Implementation

![Implementation.png](/assets/stage-8/implementation.png)

### Modifications to `xps_loop` Module

We will start implementation of non-blocking sockets by modifying the loop module to accommodate for more event handler functions. Given below is the updates to `xps_loop.h`

::: details **expserver/src/core/xps_loop.h**

```c
#ifndef XPS_LOOP_H
#define XPS_LOOP_H

#include "../xps.h"

struct xps_loop_s {
  xps_core_t *core;
  u_int epoll_fd;
  struct epoll_event epoll_events[MAX_EPOLL_EVENTS];
  vec_void_t events;
  u_int n_null_events;
};

struct loop_event_s {
  u_int fd;
  xps_handler_t read_cb;
  xps_handler_t write_cb; // [!code ++]
  xps_handler_t close_cb; // [!code ++]
  void *ptr;
};

typedef struct loop_event_s loop_event_t;

xps_loop_t *xps_loop_create(xps_core_t *core);
void xps_loop_destroy(xps_loop_t *loop);
int xps_loop_attach(xps_loop_t *loop, u_int fd, int event_flags, void *ptr, xps_handler_t read_cb); // [!code --]
int xps_loop_attach(xps_loop_t *loop, u_int fd, int event_flags, void *ptr, xps_handler_t read_cb, xps_handler_t write_cb, xps_handler_t close_cb); // [!code ++ ]
int xps_loop_detach(xps_loop_t *loop, u_int fd);
void xps_loop_run(xps_loop_t *loop);

#endif
```

:::

Make necessary changes in `xps_loop.c`. Here are a few hints:

- Currently we check for read events using:

  ```c
  // Inside xps_loop_run()

  if(curr_epoll_event.events & EPOLLIN) {
  	...
  }
  ```

  Similarly, we can check for close events and write events:

  ```c
  if(curr_epoll_event.events & (EPOLLERR | EPOLLHUP)) {
  	...
  }

  if(curr_epoll_event.events & EPOLLOUT) {
  	...
  }
  ```

- Check for events in the order, close, read and then write.
- Make sure to check if the `loop_event_t` instance is still not null after processing each event.

### Modifications to `xps_listener` Module

- Attaching listener to epoll does not require `write_cb` and `close_cb` . Thus `NULL` can be used in their place.
- When creating a connection instance within `listener_connection_handler()` , make `conn_sock_fd` non blocking using the following utility function.

  ::: details **expserver/src/utils/xps_utils.c** - `make_socket_non_blocking()`

  ```c
  int make_socket_non_blocking(u_int sock_fd) {
    int flags = fcntl(sock_fd, F_GETFL, 0);
    if (flags < 0) {
      logger(LOG_ERROR, "make_socket_non_blocking()", "failed to get flags");
      perror("Error message");
      return E_FAIL;
    }

    if (fcntl(sock_fd, F_SETFL, flags | O_NONBLOCK) < 0) {
      logger(LOG_ERROR, "make_socket_non_blocking()", "failed to set flags");
      perror("Error message");
      return E_FAIL;
    }

    return OK;
  }
  ```

  :::

  - Make sure to add a corresponding function prototype in `xps_utils.h`
  - Include `<fcntl.h>` header in `xps.h` to get the declaration for `fcntl()`
  - Handle errors properly

### Modifications to `xps_connection` Module

- Similar to `connection_loop_read_handler()`, add `connection_loop_write_handler()` and `connection_loop_close_handler()` in `xps_connection.c` .
- In `connection_close_handler()` destroy the connection instance.
- Currently in `connection_loop_read_handler()` we `recv()` from the connection socket, reverse the string and `send()` it back. However, from now on `connection_loop_write_handler()` will be invoked when the socket is available to be written to. Hence, `send()` should be invoked within `connection_loop_write_handler()` .
- Therefore, we need to the buffer the reversed strings somewhere till it is ready to be sent. For that we will use an `xps_buffer_list` .

::: tip PRE-REQUISITE READING

Read about the [xps_buffer](/guides/references/xps_buffer) module before proceeding.

:::

- Add the source code for `xps_buffer` under `expserver/src/utils` folder.
- Add the utility function `vec_filter_null` used by the `xps_buffer` module to `expserver/src/utils/xps_utils.c` . Make sure to add a function prototype in the `xps_utils.h` file.

  ::: details **expserver/src/utils/xps_utils.c** - `vec_filter_null()`

  ```c
  void vec_filter_null(vec_void_t *v) {
    assert(v != NULL);

    vec_void_t temp;
    vec_init(&temp);

    for (int i = 0; i < v->length; i++) {
      void *curr = v->data[i];
      if (curr != NULL)
        vec_push(&temp, curr);
    }

    vec_clear(v);
    for (int i = 0; i < temp.length; i++)
      vec_push(v, temp.data[i]);

    vec_deinit(&temp);
  }
  ```

  :::

- Add struct declarations for `xps_buffer` structs in `xps.h`
- Add `xps_buffer.h` header to `xps.h`
- Add `<errno.h>` header to `xps.h`
- Add a field `xps_buffer_list_t *write_buff_list` to `struct xps_connection_s`.
- Initialize it in the `xps_connection_create()` function.
- Inside `connection_loop_read_handler()` function after `recv()` create an `xps_buffer_t` instance with the reversed string and append it to the `write_buff_list` using `xps_buffer_list_append()` function.
- Make sure to free unnecessary buffers.
- By doing this, all the reversed string messages will be appended to the `write_buff_list` in `xps_connection_t` instance. All we have to do now is to read from the list and `send()` it within the `connection_loop_write_handler()` function.
- Now, within `connection_loop_write_handler()`, read from `write_buff_list` using `xps_buffer_list_read()` function. Read the entire length of the buffer list i.e. pass `write_buff_list->len` as the length of the buffer list to be read to `xps_buff_list_read()` function.
- Then send the returned buffer using `send()` system call. On success, `send()` will return the no. of bytes written to kernel buffer. Clear that many bytes from `write_buff_list` using `xps_buffer_list_clear()` function.
- On error check if `errno` is `EAGAIN` or `EWOULDBLOCK` . If yes simply return after destroying any unnecessary buffers, else destroy the connection.
- Refer the man page for [`recv()`](https://man7.org/linux/man-pages/man2/recv.2.html) and [`send()`](https://man7.org/linux/man-pages/man2/send.2.html) for more info.

### Milestone #1

We have successfully modified the code from Stage 7 to use non-blocking sockets.

- We added `write_cb` and `close_cb` to loop module.
- We made the connection socket non-blocking in `listener_connection_handler()`.
- We added a `xps_buffer_list_t` instance to connection to buffer the reversed messages to be sent back to the client.
- We moved `send()` from `connection_loop_read_handler()` to `connection_loop_write_handler()` such that data will be read from `write_buff_list` and sent to client only when the the socket is ready for write.

Lets test out the changes. Make sure to modify `build.sh` to include `xps_buffer` module. Compile and run the server. Run the same experiment from Stage 7 and observe the changes.

- Now we should be able to see that the process does not block.
- New connections should be accepted and processed even when the huge file is being sent to the server.

## Experiments

### Experiment #1

- Run eXpServer.
- Now open a new terminal and run the [htop](https://htop.dev/) utility. htop is a command line tool that lets us monitor processes running in the system.
- Check the CPU utilization for the `xps` process. You should be able to see it is near 0%.
  ![experiment1-1.png](/assets/stage-8/experiment1-1.png)
- Now open a new terminal and connect a netcat TCP client to eXpServer. Then check the CPU utilization. It should be near 100%.
  ![experiment1-2.png](/assets/stage-8/experiment1-2.png)
- What is going on here? Why is an idle TCP connection taking up 100% of a CPU core? Let’s try to figure this out.
- Start by enabling debug logs by setting the env var `XPS_DEBUG` to “1”.
- If you have logged such debug messages in your code, you should be able to see that when a TCP connection is active, the write event constantly keeps triggering.
  ![experiment1-3.png](/assets/stage-8/experiment1-3.png)
  ::: tip NOTE
  CPU usage is low when debug messages are logging because the process is blocked for a brief period when the log messages are being printed to `stdout`.
  :::
- The repeated triggering of write events is expected. As mentioned in the _Design_ section, epoll when operating in its default level triggered mode will keep notifying us when the kernel buffer is available to be written to. And since we are not writing anything to the socket during an idle TCP connection, the kernel buffer is empty and epoll will keep notifying us of that. Hence, when we call `epoll_wait()` instead of blocking, it will return immediately. This causes fast iterations of the event loop resulting in wastage of CPU time.
- In order to mitigate this problem we will have to use epoll in edge triggered mode. We will see this in detail in the next stage.

### Experiment #2

- Temporarily comment out the line printing the client message from `connection_loop_read_handler()`
- Build and run eXpServer in one terminal and htop in another.
- Now use the utility from experiment in Stage 7 and pipe to it a huge file (in the order of a few gigabytes) and send it to eXpServer. Then observe the memory usage for the `xps` process.
  ![experiment2-1.png](/assets/stage-8/experiment2-1.png)
- You should be able to notice that the memory usage steadily keeps climbing.
- As our experiment utility from Stage 7 only sends data and does not recv them, when we try to send the reversed string back to the client it will accumulate in the kernel buffer.
- Once the kernel buffer is full, the data will start buffering in the user space buffer ie. `write_buff_list`
- As we haven’t implemented a limit for the buffer size, the incoming data will keep on getting added to the buffer and will result in the steady growth of memory usage by the `xps` process.
- This is lack of a ‘backpressure’ feedback leads to uncontrolled flow of data from incoming stream to outgoing stream. If the incoming stream is faster than the outgoing stream, it will result in a growing buffer resulting in high memory consumption.
- In-order to fix this problem we can simply set a max limit to the `len` of `write_buff_list`. If `len` exceeds this limit we can stop reading from the socket even when receiving read events.
- But this is more of a ‘bandaid fix’ than a proper solution. A more sophisticated solution will be explored in the next stage.

## Conclusion

In this stage we fixed inefficiency of blocking sockets in handling connections by using sockets in non-blocking mode. In order to accomplish this we had to do two things:

- Monitor write events on the socket using epoll.
- Maintain a buffer of data to be sent to the client.

In the experiments we found issues to this approach regarding high CPU and memory consumption. We will solve these problems in the next stage by incorporating epoll edge triggering with the `xps_pipe` system, there by laying the foundational architecture of eXpServer.
