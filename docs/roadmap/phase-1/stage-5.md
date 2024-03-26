# Stage 5: Server and Client Modules

## Recap

- We learnt about `xps_buffer`
- We learnt how to use `xps_loggger`
- We learnt how to use the `vec` library

## Introduction

We begin building eXpServer with the server and client modules. Create a folder in the `expserver` directory and name it `network`.

In Phase 0, our codebase was compact and self-contained. Functions were developed within individual files and utilized exclusively within those contexts. However, as our project will grow in size and complexity, there will be a need to share code components across various files.

In C programming, header files (`.h`) serve this purpose by declaring functions, data structures, and constants shared across multiple source code files. They contain function prototypes, type definitions, and pre-processor directives.

Almost all header files will be given to you. This will act as a blueprint to the functions that will have to implemented. As mentioned before, header files will also have user defined data structures that you will be using to build eXpServer.

### File structure

![filestructure.png](/assets/stage-5/filestructure.png)

To build the server and client modules, we will be working with several files as indicated in the file structure above.

The `main.c` file will be starting point of the code. It will be responsible for starting the server and loop.

Each `.c` file that we work on (apart from `main.c`) will have an associated header file. The code for these `.h` files will be given to you before we work with it.

In the previous phase we were limited to one server instance listening on one particular port. In reality, a web server can be configured to listen on multiple ports. This limitation will be addressed in this stage. By the end of this stage we would have modularised the server and client code. And by doing this we can easily spin up multiple servers listening on various ports.

Here is the overall call stack for Stage 5. This is provide an overview of what the code does. It shows what function calls happen and in what order it happens.

```text
main()
	loop_create()
	xps_server_create()
		xps_socket_create()
	loop_attach()
	loop_run()
		epoll_wait()
		xps_server_loop_read_handler()
			xps_server_connection_handler()
				accept()
				xps_socket_create()
				xps_client_create()
				loop_attach()
		xps_client_loop_read_handler()
			xps_client_read_handler()
				xps_client_read()
					recv()
				strrev()
				xps_client_write()
					send()
```

## Implementation

`xps.h` will consist of constants and user defined types that are common to all modules and will be used everywhere. Create a file `xps.h` under `expserver` folder and copy the below content to it.

::: details expserver/xps.h

```c
#ifndef XPS_H
#define XPS_H

#define DEFAULT_BACKLOG 64
#define MAX_EPOLL_EVENTS 16
#define DEFAULT_BUFFER_SIZE 100000

// Error constants
#define OK 0
#define E_FAIL -1
#define E_AGAIN -2
#define E_CLOSE -3
#define E_NOTFOUND -4
#define E_PERMISSION -5
#define E_EOF -6

// Types
typedef unsigned char u_char;
typedef unsigned int u_int;

struct xps_buffer_s;
struct xps_socket_s;
struct xps_server_s;
struct xps_client_s;

typedef struct xps_buffer_s xps_buffer_t;
typedef struct xps_socket_s xps_socket_t;
typedef struct xps_server_s xps_server_t;
typedef struct xps_client_s xps_client_t;

typedef void (*xps_server_connection_handler_t)(xps_server_t *server, int status);
typedef void (*xps_client_read_handler_t)(xps_client_t *client, int status);

#endif
```

:::

We will be constantly modifying/adding to this file in each stage to accommodate for newer types and constants.

### `xps_socket.h & xps_socket.c`

`xps_socket` module will deal with all things to do with sockets, i.e. creation, deletion etc.

The code below has the contents of the header file for `xps_socket`. Have a look at it and make a copy of it in your codebase.

::: details expserver/network/xps_socket.h

```c
#ifndef XPS_SOCKET_H
#define XPS_SOCKET_H

struct xps_socket_s {
  int fd;
};

/**
 * @brief Creates a socket instance.
 *
 * @param fd File descriptor of the socket. If negative, a new socket will be created.
 * @return Pointer to the created socket instance, or NULL if an error occurs.
 */
xps_socket_t *xps_socket_create(int fd);

/**
 * @brief Destroys a socket instance.
 *
 * This function closes the socket associated with the specified socket instance and frees its memory.
 *
 * @param sock pointer to the socket instance to destroy.
 */
void xps_socket_destroy(xps_socket_t *sock);

#endif
```

:::

Now that we have the function signature, we can work on its implementation. Create a file named `xps_socket.c` under the network folder.

There are two ways in which a program interacts with sockets when performing I/O operations:

1. **Blocking I/O**
   1. When a program performs a read or write operation on a socket, the program waits until the operation is completed before moving on to execute the next line of code
   2. If there is no data available to read from the socket, a read operation will block (i.e., pause execution) until data arrives
2. **Non-blocking I/O**
   1. When a program performs a read or write operation on a socket, the program continues execution immediately without waiting for the operation to complete
   2. Non-blocking I/O allows the program to perform other tasks while waiting for I/O operations to complete

If you are familiar with JavaScript, you may associate this with synchronous and asynchronous functions.

Making a socket non-blocking is crucial as it prevents deadlocks, provides concurrency and allows for better use of system resources. To make a socket non-blocking, we will use the `fcntl()` function provided by the `fcntl.h` header file. This function is used for manipulation of file descriptors. Read more about them [here](https://man7.org/linux/man-pages/man2/fcntl.2.html).

::: warning
While handling errors, do not forget to close the `fd`.
:::

As we move forward, the pattern of create and destroy functions will be repeated. But what are create and destroy functions you may ask.

Each entity will have a create and destroy function. Create functions are responsible for creating an instance of the entity, allocating it memory and assigning it initial values. Destroy function is called on an entity instance when it is no longer needed. This will free the memory and do some module specific chores.

Let’s start by writing the `xps_socket_create()` function.

::: details expserver/network/xps_socket.c

```c
xps_socket_t *xps_socket_create(int fd) {
  // If fd is negative, create a tcp socket
  if (fd < 0) {
    logger(LOG_DEBUG, "xps_socket_create()", "no socket fd provided. creating new socket");
    fd = /* create new socket using socket() */
  }

  // Error creating socket
  if (fd < 0) {
    logger(LOG_ERROR, "xps_socket_create()", "failed to create socket");
    return NULL;
  }

  // Making socket non blocking using fcntl()
  int flags = /* get socket flags */
  if (flags < 0) {
    logger(LOG_DEBUG, "xps_socket_create()",
           "failed to make socket non blocking. failed to get flags");
    perror("Error message");
    close(fd);
    return NULL;
  }

  if (fcntl(/* set fd as non blocking (append 'non-blocking flag' to flags) */) < -1) {
    logger(LOG_DEBUG, "xps_socket_create()",
           "failed to make socket non blocking. failed to set flags");
    perror("Error message");
    close(fd);
    return NULL;
  }

  // Alloc memory for socket instance
  xps_socket_t *sock = (xps_socket_t *)malloc(sizeof(xps_socket_t));
  if (sock == NULL) {
    logger(LOG_ERROR, "xps_socket_create()",
           "failed to alloc memory for socket instance. malloc() returned NULL");
    close(fd);
    return NULL;
  }

  sock->fd = fd;

  return sock;
}
```

:::

Moving on to the destroy function. When a socket is provided to be destroyed, we have to close the socket and free up the memory.

::: details expserver/network/xps_socket.c

```c
void xps_socket_destroy(xps_socket_t *sock) {
  if (sock == NULL) {
    logger(LOG_ERROR, "xps_socket_destory()", "failed to destroy socket. sock is NULL");
    return;
  }

  close(sock->fd);
  free(sock);

  logger(LOG_DEBUG, "xps_socket_destroy()", "destroyed socket");
}
```

:::

**Create function pattern**

- Check for errors in params. Exit by undoing previous steps and returning NULL
- Allocate memory for instance
- Assign values
- Log each event

**Destroy function pattern**

- Check for errors in params
- Free memory and do other chores
- Log each event

### `xps_server.h & xps_server.c`

`xps_server` module will deal with all things to do with servers, i.e. creation, deletion etc.

The code below has the contents of the header file for `xps_server`. Have a look at it and make a copy of it in your codebase.

::: details expserver/network/xps_socket.h

```c
#ifndef XPS_SERVER_H
#define XPS_SERVER_H

#include "../lib/vec/vec.h"
#include "../xps.h"

struct xps_server_s {
  int port;
  xps_socket_t *sock;
  vec_void_t clients;
  xps_server_connection_handler_t connection_cb;
};

xps_server_t *xps_server_create(int port, xps_server_connection_handler_t connection_cb);
void xps_server_destroy(xps_server_t *server);
void xps_server_loop_read_handler(xps_server_t *server);

#endif
```

:::

Each server instance will have the following:

- `int port`: an integer port number
- `xps_socket_t *sock`: pointer to an instance of socket associated with the server
- `vec_void_t clients`: list of clients handled by the server
- `xps_server_connection_handler_t connection_cb`: a callback function called when the server receives a new client connection

Let’s proceed with writing the functions associated with the server. We have a server create and destroy function. Most of the implementation for `xps_server_create()` was already done by us in the previous stages.

::: details expserver/network/xps_server.c

```c
xps_server_t *xps_server_create(int port, xps_server_connection_handler_t connection_cb) {

  /* check if port is a valid port number */

  /* setup server address */

  xps_socket_t *sock = /* create socket instance using xps_socket_create() */
  if (sock == NULL) {
    logger(LOG_ERROR, "xps_server_create()",
           "failed to create socket instance. xps_socket_create() returned NULL");
    return NULL;
  }

	// setsockopt() for reusing ports
  const int enable = 1;
  if (setsockopt(sock->fd, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof(enable)) < 0) {
    logger(LOG_ERROR, "xps_server_create()", "failed setsockopt(). reusing ports");
    perror("Error message");
    xps_socket_destroy(sock);
    return NULL;
  }

  /* bind socket to port */

  /* start listening on port */

  xps_server_t *server = /* allocate memory for server instance using malloc */
  if(server == NULL) {
	  logger(LOG_ERROR, "xps_server_create()", "failed to server instance. malloc() returned NULL");
    xps_socket_destroy(sock);
    return NULL;
	}

	server->port = /* fill this */
	server->sock = /* fill this */
	server->connection_cb = /* fill this */
	vec_init(&(server->clients));

	logger(LOG_DEBUG, "xps_server_create()", "created server on port %d", port);

  return server;

}
```

:::

This destroy function might be a bit tricky on first glance as `xps_server_t` structure has members of different types. Let’s break it down:

- `server→sock` can be destroyed using `xps_socket_destroy()`
- `server→clients` should be destroyed individually by iterating through each one of them. Code for this section will be provided as we are yet to do the client code. We destroy each client using `xps_client_destroy()` which will be implemented in the upcoming section.

You might have a question here. What about `server->port` & `server->connection_cb`? Memory needs to be free/deallocated ONLY for members which were dynamically allocated (for eg. using malloc).

::: details expserver/network/xps_server.c

```c
void xps_server_destroy(xps_server_t *server) {

  /* validate params */

	/* destory socket using xps_socket_destroy() */

	// Destory clients
	for (int i = 0; i < server->clients.length; i++) {
    xps_client_t *client = (xps_client_t *)(server->clients.data[i]);
    if (client != NULL)
      xps_client_destroy(client); // we will implement this later
  }

  vec_deinit(&(server->clients));

  int port = server->port;

  /* free server */

  logger(LOG_DEBUG, "xps_loop_destroy()", "destroyed server on port %d", port);

}
```

:::

The above code snippet shows us how we can destroy objects stored in a `vec` list.

`server→clients` is a `vec` list of type `vec_void_t`. It is filled with all the clients that are associated with the server. Each client instance will be of type `xps_client_t`. So, while iterating through the list, we first have to typecast the void instance to `xps_client_t`.

Last but not least, we have a short and important function `xps_server_loop_read_handler()` that invokes the callback function that should be called when the server receives a new client connection

::: details expserver/network/xps_server.c

```c
void xps_server_loop_read_handler(xps_server_t *server) {
	server->connection_cb(server, OK);
}
```

:::

You might be thinking, why this function is necessary. You will be seeing it used by the event loop to notify the server of read events on its listening socket. Even though it is possible for event loop to directly invoke the `connection_cb()` function, the wrapper `xps_server_loop_read_handler()` is primarily a convention used for consistency purposes as other modules also has similar functions that require some processing other than just invoking the callback.

`connection_cb()`’s implementation will be done in the `main.c` file. It takes the server and a integer status as its parameters. The possible values of status is defined in `xps.h`. When we progress further in the course, status codes will be used everywhere. But right now, we only utilize `OK`.

Diagram here

---

### Milestone #1

Let’s have a recap of what we have done till now.

- We now have a socket module that will take care of creating, destroying and making the sockets non blocking.
- We also have a `xps_server_create()` function that will take a `port` number and a `connection_cb()` function, and create an instance of a server that will be listening on the given port.
- We also have the `xps_server_destroy()` function which can close the socket and free the memory allocated when the server is no longer in use.

---

### `xps_client.h & xps_client.c`

`xps_client` module will deal with all things to do with clients, i.e. creation, deletion, writing etc.

The code below has the contents of the header file for `xps_client`. Have a look at it and make a copy of it in your codebase.

::: details expserver/network/xps_client.h

```c
#ifndef XPS_CLIENT_H
#define XPS_CLIENT_H

#include "../xps.h"

struct xps_client_s {
  xps_socket_t *sock;
  xps_server_t *server;
  xps_client_read_handler_t read_cb;
};

xps_client_t *xps_client_create(xps_server_t *server, xps_socket_t *sock,
                                xps_client_read_handler_t read_cb);
void xps_client_destroy(xps_client_t *client);
void xps_client_write(xps_client_t *client, xps_buffer_t *buff);
xps_buffer_t *xps_client_read(xps_client_t *client);
void xps_client_loop_read_handler(xps_client_t *client);

#endif
```

:::

Each client instance will have the following:

- `xps_socket_t *sock`: pointer to an instance of socket associated with the client
- `xps_server_t *server`: server that the client belongs to
- `xps_client_read_handler_t read_cb`: a callback function called when there is something available to read from the client

The client will also have functions specifically for creation and destruction.

`xps_client_create()` function will create a new client instance with the specified server and socket.

::: details expserver/network/xps_client.c

```c
xps_client_t *xps_client_create(xps_server_t *server, xps_socket_t *sock, xps_client_read_handler_t read_cb) {

	/* validate params */

	xps_client_t *client = /* allocate memory for client instance using malloc*/

	/* populate client object */

	return client;

}
```

:::

::: warning
Moving forward, the documentation or code snippets may not specify error-handling locations. It will be our duty to anticipate potential error points and manage them accordingly. Remember to handle errors proactively and utilise the logger utility extensively.
:::

Recall how in the `xps_server_destroy()` function we used `xps_client_destroy()` to destroy individual clients by passing the client object to it. We will implement this now.

The `xps_client_destroy()` function is responsible for releasing the resources associated with a client instance. Each client belongs to a server, and the server may have multiple clients connected to it. When destroying a client, the function iterates through the list of clients in the server to find the specific client instance and set it to `NULL`.

::: details expserver/network/xps_client.c

```c
void xps_client_destroy(xps_client_t *client) {

	/* validate params */

  for (int i = 0; i < client->server->clients.length; i++) {
    xps_client_t *curr = (xps_client_t *)(client->server->clients.data[i]);
    if (/* fill this */) {
      client->server->clients.data[i] = NULL;
      break;
    }
  }

  /* destroy socket */

  /* free client */

}
```

:::

::: danger Question
Why do you think it is necessary to set NULL in server’s client list while destroying the client? Why can’t we just remove the item from the list instead of setting it to NULL?
:::

Now that we have a client instance, we need a way (functions) to communicate (read and write) with it. This is where `xps_client_read()` and `xps_client_write()` come in.

Refer the `handle_client()` function from the previous stage and modify the functions below.

If you notice carefully, the return type of `xps_client_read()` is of type `xps_buffer_t`. How would you create one? We have a `xps_buffer_create()` function just for this. It’ll take care of creating the buffer, handle all the potential errors in between and return a buffer of type `xps_buffer_t`. Read more about `xps_buffer` utility [here](https://www.notion.so/xps_buffer-f8bceae3c7c347c0a86441e3c80aaa61?pvs=21).

::: details expserver/network/xps_client.c

```c
void xps_client_write(xps_client_t *client, xps_buffer_t *buff) {

  /* send message to the client using send */

}

xps_buffer_t *xps_client_read(xps_client_t *client) {

	/* read message from client to buffer using recv */

	/* return a buffer instance type xps_buffer_t if success or NULL if error */

}
```

:::

Create a simple function, `xps_client_loop_read_handler()` to call the client read callback.

::: details expserver/network/xps_client.c

```c
void xps_client_loop_read_handler(xps_client_t *client) {

	/* fill this */

}
```

:::

### `main.c`

In `main.c`, we'll initialize eXpServer, utilizing some functions from the previous stage. In this stage, our main function will contain event loop related functions only.

As we implemented a proxy last time, code related to upstream wont be relevant as of now. We will get to that when we work on the upstream module in Stage 9.

We’ll start with the `main()` function because that is where the execution starts. What might be the `main()` function’s responsibilities?

- To create a loop instance - `loop_create()`
- To start server(s) - `xps_server_create()`
- To start the event loop - `loop_run()`

::: tip
Always try to keep the main function simple and distribute the work into dedicated functions.
:::

::: details expserver/main.c

```c
// Global variables
int epoll_fd;
struct epoll_event events[MAX_EPOLL_EVENTS];

xps_server_t *servers[10];
int n_servers = 0;

int main() {

	/* create loop using loop_create()*/

  // Create servers on ports 8001, 8002, 8003, 8004
  n_servers = 4;
  for (int i = 0; i < n_servers; i++) {
    int port = 8001 + i;
    servers[i] = xps_server_create(port, **xps_server_connection_handler**);
    loop_attach(epoll_fd, servers[i]->sock->fd, EPOLLIN);
    logger(LOG_INFO, "main()", "Server listening on port %d", port);
  }

	/* start event loop */

}
```

:::

The implementations of `loop_attach()` and `loop_detach()` remain unchanged from the previous stage.

When creating the server with `xps_server_create()`, we provide it with `xps_server_connection_handler` as a callback function. This function gets invoked when a client attempts to connect to the server, essentially replacing `accept_connection()` from the previous stage. It's the same function triggered within `xps_server_loop_read_handler()` in `xps_server.c`. Think about what the callback function will contain before diving into its implementation.

::: details expserver/main.c

```c
void xps_server_connection_handler(xps_server_t *server, int status) {

  /* accept connection */

  xps_socket_t *sock = /* create socket instance using xps_socket_create() */

  xps_client_t *client = xps_client_create(server, sock, **xps_client_read_handler**);

  // Adding client to clients list of server
  vec_push(&(server->clients), (void *)client);

  /* attach client to loop using loop_attach() */

}
```

:::

`xps_client_read_handler()` \*\*\*\*is the client callback function that we attach to all client instances. This function gets triggered when there is data to be read from the client. Recall its use in `xps_client_loop_read_handler()` in `xps_client.c`.

::: details expserver/main.c

```c
void xps_client_read_handler(xps_client_t *client, int status) {

  xps_buffer_t *buff = /* read message from client using xps_client_read() */

  /* error handling (detach client fd from loop and destory client) */

  // Add null terminator to end of message string
  buff->data[buff->len] = 0;

  printf("%s", buff->data);

  /* reverse message */

  /* send reversed message to client using xps_client_write() */

}
```

:::

Now that we have all the functions, we can start writing the `loop_run()` function which is responsible for catching all events and calling the corresponding callbacks. The callback functions (handlers) that we have written so far will start to make sense as we implement `loop_run()` .

Similar to `loop_run()` in last stage, we get events from the server and the client. Identifying if it is a server or a client event is the tricky part now.

In case of a server event, you would have to loop through all the server instances and find the server with the matching socket fd. When the server is found, call the `xps_server_loop_read_handler()` to take care of the event.

Similarly for client, loop through all the clients in all the servers to find the client with the read event. Call the `xps_client_loop_read_handler()` when the client has been found.

::: details expserver/main.c

```c
void loop_run(int epoll_fd) {

  while (1) {

    /* epoll wait */

    for (/* loop though epoll events */) {

      int curr_fd = events[i].data.fd;

      // Check if event is on a server
      for (/* loop through servers */) {
        if (servers[i]->sock->fd == curr_fd) {

          // server with event found

          /* fill this */

        }
      }

      // Check if event is on a client
      for (/* loop through servers */) {
        for (/* loop through clients of this server */) {
          xps_client_t *curr_client = (xps_client_t *)(servers[i]->clients.data[j]);
          if (curr_client != NULL && curr_fd == curr_client->sock->fd) {

            // client with event found

            /* fill this */

          }
        }
      }

  }

}
```

:::

::: tip NOTE
Take a note of the type casting on client from server’s clients list to `xps_client_t` in the client loop.
:::

### Milestone #2

Time to test the code!

The following command can be used to compile all the code in stage 5:

```bash
gcc -g -o xps main.c network/xps_socket.c network/xps_server.c network/xps_client.c lib/vec/vec.c utils/xps_buffer.c utils/xps_logger.c
```

As we have a lot of files to compile this time around, we suggest using a script file to make the process easier. You will find a `build.sh` file in the `expserver/` directory. Copy over the command and use the following to run the script:

```bash
bash build.sh
```

Running the output file `./xps` should give you the following output:

```bash
[INFO] main() : Server listening on port 8001
[INFO] main() : Server listening on port 8002
[INFO] main() : Server listening on port 8003
[INFO] main() : Server listening on port 8004
```

Don’t worry if your code does the produce the expected output in the first attempt. Debugging and figuring out the error is as important as writing the code itself. The `xps_logger` utility and GDB are your best friends here.

## Conclusion

That’s it! We understand that this stage was longer and complex that the ones before. In the next stage, we will work on the core and loop modules; arguably the two most important modules for the functioning of eXpServer.
