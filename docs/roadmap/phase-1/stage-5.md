# Stage 5: Server & Client Modules

## Recap

- We ended Phase 0 by building our own TCP proxy with concurrency support

## Introduction

We being building eXpServer with the server and client module. All the code for server and client module will go in the `network` folder.

Apart from that, our main functions will go in `main.c` in the parent folder.

In Phase 0, our codebase was compact and self-contained. Functions were developed within individual files and utilized exclusively within those contexts. However, as our project will grow in size and complexity, there will be a need to share code components across various files. This included functions, structs, typedefs, and other elements. Hence the use of header files (.h) is imperative.

In C programming, header files (files with a `.h` extension) are used to declare functions, data structures, constants, and macros that are shared across multiple source code files. These header files typically contain function prototypes, type definitions, and any necessary pre-processor directives.

Almost all header files will be given to you. This will be act as a blueprint to the functions that will have to implemented, its input and expected output type. As mentioned before, header files will also have the user defined data structures that you will be using to build eXpServer.

So have a look at the network folder. there should be three header files present.

- `xps_client.h`
- `xps_server.h`
- `xps_socket.h`

For clarity, all files names will be appended with `xps_`

![filestructure.png](/assets/stage-5/filestructure.png)

There is a lot to build here, so lets get started.

## Implementation

### `xps_socket.h & xps_socket.c`

The header file consists of the `xps_socket_s` definition, and two functions (socket create and destroy). The implementation of these functions will be done in `xps_socket.c`.

::: details network/xps_socket.c

```c
/**
 * @brief Creates a new socket instance.
 *
 * This function creates a new socket instance based on the provided file descriptor (fd).
 * If fd is negative, indicating that no socket file descriptor is provided, it creates a new
 * TCP socket using the socket system call. The function then sets the socket to non-blocking
 * mode using the fcntl function with O_NONBLOCK flag.
 *
 * @param fd The file descriptor associated with the socket. If negative, a new socket will be created.
 * @return A pointer to the created socket instance. Returns NULL if any error occurs during socket creation
 * or memory allocation.
 */
xps_socket_t *xps_socket_create(int fd) {

	if(fd < 0) {
		fd = /* create socket instance */
	}

	// Error creating socket
	if(fd < 0) {
    /* handle error */
  }

	int flags = /* retrive existing flags in fd using fcntl */
	if(flags<0) {
		/* handle error */
	}

	if(fnctl(/* set fd as non-blocking (append non-blocking flag to flags) */) < -1) {
		/* handle error */
	}

	xps_socket_t *sock = (xps_socket_t *)malloc(sizeof(xps_socket_t));
	if(sock == NULL) {
		/* handle error */
	}
	sock->fd = fd;

	return sock;

}
```

:::

There are two ways in which a program interacts with sockets when performing I/O operations such as reading and writing to socket:

1. **Blocking I/O**
   1. When a program performs a read or write operation on a socket, the program waits until the operation is completed before moving on to execute the next line of code
   2. If there is no data available to read from the socket, a read operation will block (i.e., pause execution) until data arrives
2. **Non-blocking I/O**
   1. When a program performs a read or write operation on a socket, the program continues execution immediately without waiting for the operation to complete
   2. Non-blocking I/O allows the program to perform other tasks while waiting for I/O operations to complete

If you are familiar with JavaScript, you may associate this with synchronous and asynchronous functions.

Making the socket to non-blocking one is crucial as it prevents deadlocks, provides concurrency and allows for better use of system resources.

To make a socket non-blocking, we will use the `fcntl()` function provided by the `fcntl.h` header file. This function is used for manipulation of file descriptors. Read more about them [here](https://man7.org/linux/man-pages/man2/fcntl.2.html).

::: warning
While handling errors, do not forget to close the `fd`.
:::

```c
xps_socket_t *sock = (xps_socket_t *)malloc(sizeof(xps_socket_t));
```

The above snippet shows us how we allocate space in C. Here’s what’s happening:

- `sock` is an instance of struct type `xps_socket_t`
- `malloc` allocates memory of size `xps_socket_t`
- `(xps_socket_t *)` is for type casting

Moving on to the destroy function, we can see that it is pretty straight forward. The purpose of destroy functions in general is to free up memory. In this case, when a socket is provided to be destroyed, we have to free up all the memory occupied by it. This includes all the members of the socket instance.

::: details network/xps_socket.c

```c
/**
 * @brief Destroys a socket instance.
 *
 * This function releases the resources associated with the given socket instance. It first checks
 * if the provided socket pointer is NULL. If it is NULL, it logs an error message and returns
 * without performing any action. Otherwise, it closes the file descriptor associated with the socket
 * and frees the memory allocated for the socket instance.
 *
 * @param sock Pointer to the socket instance to be destroyed.
 * @return void
 */
void xps_socket_destroy(xps_socket_t *sock) {

	if(sock == NULL) {
		/* handle error */
	}

	/* close all members of sock instance */
	/* free sock */

}
```

:::

This is the general structure that will be followed for all the create and destroy functions moving forward.

### `xps_server.h & xps_server.c`

`xps_server.h` contains the `xps_server_s` structure:

```c
struct xps_server_s {
  int port;
  xps_socket_t *sock;
  vec_void_t clients;
  xps_server_connection_handler_t connection_cb;
};

// defined in xps.h
typedef void (*xps_server_connection_handler_t)(xps_server_t *server, int status);
```

Each server will have the following:

- `int port`: an integer port number
- `xps_socket_t *sock`: pointer to an instance of socket associated with the server
- `vec_void_t clients`: list of clients handled by the server
- `xps_server_connection_handler_t connection_cb`: a callback function

Let’s proceed with writing the functions associated with the server. We have a server create and destroy function. Most of the implementation for `xps_server_create()` was already done by us in the previous stages.

::: details network/xps_server.c

```c
/**
 * @brief Creates a new server instance.
 *
 * This function creates a new server instance listening on the specified port. It sets up
 * the server socket, binds it to the port, and starts listening for incoming connections.
 * If successful, it returns a pointer to the created server instance.
 *
 * @param port The port number on which the server will listen for incoming connections.
 * @param connection_cb A callback function to be invoked when a new connection is accepted.
 * @return A pointer to the created server instance. Returns NULL if any error occurs during
 *         server creation.
 */
xps_server_t *xps_server_create(int port, xps_server_connection_handler_t connection_cb) {

  /* check if port is a valid port number */

  /* setup server address */

  xps_socket_t *sock = /* create socket instance using xps_socket_create() */
  if(sock == NULL) {
	  /* handle error */
	}

	/* set sock opt reuse addr */

  /* bind socket to port */

  /* start listening on port */

  xps_server_t *server = /* allocate memory for server instance */
  if(server == NULL) {
	  /* handle error */
	}

	server->port = /* fill this */
	server->sock = /* fill this */
	server->connection_cb = /* fill this */
	vec_init(&(server->clients));

  return server;

}
```

:::

This destroy function might be a bit tricky on first glance as `xps_server_t` structure has members of different types. Let’s break it down:

- `server→sock` can be destroyed using `xps_socket_destroy()`
- `server→clients` should be destroyed individually by iterating through each one of them. Code for this will be provided as we are yet to do the client code.

You might have a question here. What about `server->port` & `server->connection_cb`? Memory needs to be free/deallocated ONLY for members which were dynamically allocated (for eg. using malloc).

::: details network/xps_server.c

```c
/**
 * @brief Destroys a server instance.
 *
 * This function releases all resources associated with the specified server instance, including
 * its socket and any client connections. It deallocates the memory used by the server object itself.
 *
 * @param server A pointer to the server instance to be destroyed.
 * @return void
 */
void xps_server_destroy(xps_server_t *server) {

  if(server == NULL) {
	  /* handle error */
	}

	/* destory socket */

	// Destory clients
	for (int i = 0; i < server->clients.length; i++) {
    xps_client_t *client = (xps_client_t *)(server->clients.data[i]);
    if (client != NULL)
      xps_client_destroy(client); // we will implement this later
  }

  vec_deinit(&(server->clients));

  /* free server */

}
```

:::

The above code snippet shows us how we can deallocate memory for `vec` type objects.

Last but not least, we have a short and important function `xps_server_loop_read_handler()` that invokes the callback function associated with the server instance.

::: details network/xps_server.c

```c
/**
 * @brief Handler function for reading from the server socket.
 *
 * This function invokes the connection callback function associated with the server instance.
 * It passes the server instance itself and a status code indicating successful read operation.
 *
 * @param server A pointer to the server instance.
 * @return void
 */
void xps_server_loop_read_handler(xps_server_t *server) {
	server->connection_cb(server, OK);
}
```

:::

### Milestone #1

Let’s have a recap of what we have done till now. If you think about it, this stage is just decoupling and adding a bit more code to existing logic we had.

---

### `xps_client.h & xps_client.c`

```c
struct xps_client_s {
  xps_socket_t *sock;
  xps_server_t *server;
  xps_client_read_handler_t read_cb;
};

// defined in xps.h
typedef void (*xps_client_read_handler_t)(xps_client_t *client, int status);
```

We’ll start with the usual create and destroy functions. `xps_client_create()` function will create a new instance client instance with the specified server and socket.

::: tip
It is a good coding practice to check if the parameters are contains valid values that we receive at the beginning of the function to prevent any errors when we use those the values in the function.
:::

::: details network/xps_client.c

```c
/**
 * @brief Creates a new client instance.
 *
 * This function creates a new client instance associated with the specified server and socket.
 * It also sets the callback function to be invoked when data is read from the client socket.
 *
 * @param server A pointer to the server instance to which the client belongs.
 * @param sock A pointer to the socket instance associated with the client.
 * @param read_cb The callback function to be invoked when data is read from the client socket.
 * @return A pointer to the created client instance. Returns NULL if any error occurs during client creation.
 */
xps_client_t *xps_client_create(xps_server_t *server, xps_socket_t *sock, xps_client_read_handler_t read_cb) {

	xps_client_t *client = /* allocate memory for client instance */

	/* populate client object */

	return client;

}
```

:::

If you recall, we used `xps_client_destroy()` in the `xps_server_destroy()` function. We passed the client object for it to be destroyed.

The `xps_client_destroy()` function is responsible for releasing the resources associated with a client instance. Each client is associated with a server, and the server may have multiple clients connected to it. When destroying a client, the function iterates through the list of clients in the server to find the specific client instance and set it to `NULL`.

::: details network/xps_client.c

```c
/**
 * @brief Destroys a client instance.
 *
 * This function releases all resources associated with the specified client instance
 * and sets it to NULL.
 *
 * @param client A pointer to the client instance to be destroyed.
 * @return void
 */
void xps_client_destroy(xps_client_t *client) {

  for (int i = 0; i < client->server->clients.length; i++) {
    xps_client_t *curr = (xps_client_t *)(client->server->clients.data[i]);
    if (/* fill this */) {
      client->server->clients.data[i] = NULL;
      break;
    }
  }

  /* free client */

}
```

:::

`xps_client_write()` is responsible for sending data contained in the buffer to the client socket and `xps_client_read()` function reads data from the client socket into the buffer. If you notice, the return type is of type `xps_buffer_t`. How would you create one? Using `malloc`? You could, but we have a `xps_buffer_create()` function just for this. It’ll take care of creating the buffer, all the error handling in between and return a buffer of type `xps_buffer_t`.

This illustrates the advantage of spending some time writing the create and destroy functions. The abstraction it provides will come in handy down the line when we start building components over it.

::: details network/xps_client.c

```c
/**
 * @brief Writes data to the client socket.
 *
 * This function sends the data contained in the specified buffer to the client socket.
 *
 * @param client A pointer to the client instance.
 * @param buff A pointer to the buffer containing the data to be written.
 * @return void
 */
void xps_client_write(xps_client_t *client, xps_buffer_t *buff) {

  int bytes_written = 0;
  int message_len = buff->len;

  /* send message to the client using send */

}

/**
 * @brief Reads data from the client socket.
 *
 * This function reads data from the client socket into a buffer.
 *
 * @param client A pointer to the client instance.
 * @return A pointer to the buffer containing the read data, or NULL if an error occurs or the client closes the connection.
 */
xps_buffer_t *xps_client_read(xps_client_t *client) {

	char *buff = /* create a char* buffer dynamically (using malloc) of size DEFAULT_BUFFER_SIZE */

	return xps_buffer_create(/* fill this */);

}
```

:::

`xps_client_loop_read_handler()` just calls the client read callback.

::: details network/xps_client.c

```c
/**
 * @brief Handler function for reading from the client socket.
 *
 * This function invokes the read callback function associated with the client instance.
 * It passes the client instance and a status code indicating successful read operation.
 *
 * @param client A pointer to the client instance.
 * @return void
 */
void xps_client_loop_read_handler(xps_client_t *client) {

	/* fill this */

}
```

:::

### Milestone #2

We have successfully demodularized the code the client and server code with create and destory functions.

Previously, up to Stage 4, our code was limited to utilizing a single port and server instance. This restriction meant that expanding to accommodate multiple servers was not feasible. However, with the successful demodularization of the client and server code, including the implementation of create and destroy functions, our architecture has evolved significantly.

Now, with the ability to dynamically create server instances, we've unlocked the potential to scale our application effortlessly. Imagine having multiple ports available and the capability to accept client connections from any of them. This newfound flexibility means that we can spin up as many servers as needed, effectively distributing the workload and maximizing resource utilization.

That is exactly what were are going to do now in the `main.c` file.

---

### `main.c`

We can start with the `main()` function to get some clarity.

::: details main.c

```c
/**
 * @brief Main function.
 *
 * This function is the entry point of the program. It sets up an event loop and creates multiple servers,
 * each listening on a different port. Once the servers are created, the event loop is started to handle incoming
 * connections and data.
 *
 * @return An integer indicating the exit status of the program.
 */
int main() {

	/* create loop using loop_create()*/

	/* spin up 4 servers on ports 8001 to 8004 */

	/* start event loop */

}
```

:::

::: warning
While creating the servers, don’t forget to add them to the loop.
:::

Create two additional functions, one to add to loop (`loop_attach()`) and another to remove from the loop (`loop_detach()`).

We are already seen the `loop_attach()` function when we wrote the proxy. To detach a fd from the fd, use the `EPOLL_CTL_DEL` flag in `epoll_ctl()` function.

::: details main.c

```c
/**
 * @brief Creates an epoll instance.
 *
 * This function creates a new epoll instance for event monitoring.
 *
 * @return An integer representing the file descriptor of the epoll instance, or -1 on failure.
 */
int loop_create() {
	...
}

/**
 * @brief Attaches a file descriptor to the event loop.
 *
 * This function adds the specified file descriptor to the epoll event loop, monitoring the specified events.
 *
 * @param epoll_fd The file descriptor of the epoll instance.
 * @param fd The file descriptor to be attached to the event loop.
 * @param events The events to monitor for the specified file descriptor.
 * @return void
 */
void loop_attach(int epoll_fd, int fd, int events) {
  ...
}

/**
 * @brief Detaches a file descriptor from the event loop.
 *
 * This function removes the specified file descriptor from the epoll event loop.
 *
 * @param epoll_fd The file descriptor of the epoll instance.
 * @param fd The file descriptor to be detached from the event loop.
 * @return void
 */
void loop_detach(int epoll_fd, int fd) {

  struct epoll_event event;
  event.events = 0;

  /* fill this */

}
```

:::

Recall in case of server, we were triggering a callback (`connection_cb`). We still need the function definition for this. Think about what this callback will contain.

::: details main.c

```c
/**
 * @brief Handles incoming client connections to the server.
 *
 * This function is called when a new client connection is accepted by the server.
 * It creates a new client instance, associates it with the server, and adds it
 * to the list of clients. It also attaches the client socket to the event loop
 * for monitoring read events.
 *
 * @param server A pointer to the server instance.
 * @param status An integer representing the status of the connection operation.
 * @return void
 */
void xps_server_connection_handler(xps_server_t *server, int status) {

  /* accept connection */

  xps_socket_t *sock = /* create socket instance using xps_socket_create() */

  xps_client_t *client = /* create client instance using xps_client_create() */

  // Adding client to clients list of server
  vec_push(&(server->clients), (void *)client);

  /* attach client to loop using loop_attach() */

}
```

:::

Similarly, we have a callback for when data is ready to be read from the client socket (`read_cb()`).

::: details main.c

```c
/**
 * @brief Handles reading data from the client socket.
 *
 * This function is called when data is ready to be read from the client socket.
 * It reads the data from the client, reverses the string, and sends the reversed
 * string back to the client.
 *
 * @param client A pointer to the client instance.
 * @param status An integer representing the status of the read operation.
 * @return void
 */
void xps_client_read_handler(xps_client_t *client, int status) {

  xps_buffer_t *buff = /* read message from client using xps_client_read() */

  /* error handling (detach client fd from loop and destory client) */

  printf("%s", buff->data);

  // Add null terminator to end of message string
  buff->data[buff->len] = 0;

  /* reverse message */

  /* send reversed message to client using xps_client_write() */

}
```

:::

We can now focus on the `loop_run()` function, which contains the event loop (epoll).

::: details main.c

```c
/**
 * @brief Runs the event loop.
 *
 * This function continuously monitors events on file descriptors registered with the epoll instance.
 * When events occur, it dispatches the appropriate handler functions to handle the events.
 *
 * @param epoll_fd The file descriptor of the epoll instance.
 * @return void
 */
void loop_run(int epoll_fd) {
  while (1) {

    /* epoll wait */

    for (int i = 0; i < n_ready_fds; i++) {
      int curr_fd = events[i].data.fd;

      xps_server_t *server = NULL;

      // Checking if fd is of a server
      for (int i = 0; i < n_servers; i++) {
        if (servers[i]->sock->fd == curr_fd) {
          server = servers[i];
          break;
        }
      }

      // Event is on a server, accept connection
      if (server != NULL) {
        xps_server_loop_read_handler(server);
        continue;
      }

      xps_client_t *client = NULL;

      // Checking if fd is of a client
      for (int i = 0; i < n_servers && client == NULL; i++) {
        for (int j = 0; j < servers[i]->clients.length; j++) {
          xps_client_t *curr_client = (xps_client_t *)(servers[i]->clients.data[j]);
          if (curr_client != NULL && curr_fd == curr_client->sock->fd) {
            client = curr_client;
            break;
          }
        }
      }

      // Event is on some connection socket
      if (client != NULL) {
        xps_client_loop_read_handler(client);
      }
    }
  }
}
```

:::

### Milestone #3

## Conclusion
