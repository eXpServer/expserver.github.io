# Stage 6: Listener & Connection Modules

## Recap

- In Phase 1 overview we familiarised ourselves with eXpServer's [Architecture](/guides/resources/architecture) and [Coding Conventions](/guides/resources/coding-conventions)

## Learning Objectives

- Understand the structure of a module in eXpServer
- Implement rudimentary forms of listener & connection modules
- Get familiar with memory management, error handling, logging and other coding conventions.
- Make eXpServer listen on multiple ports, receive client messages, reverse the strings and send them back

## Introduction

As we’ve seen in the Overview of Phase 1, from this phase onwards we start building eXpServer from the ground up. We will be utilizing our learning from Phase 0 to implement a more sophisticated web server.

At the end of Phase 0, we were able to serve multiple clients simultaneously using Linux epoll. The server was bound to a single port, and all incoming connections were through that particular port. However, web servers are generally capable of listening on multiple ports concurrently.

In this stage we will create a module called `xps_listener` which will allow eXpServer to listen on multiple ports simultaneously. We achieve this by introducing the concept of ‘listeners’. A 'listener' can be thought of as a TCP server (from Phase 0), bound to a single port.

We will utilize _netcat_ as a client for this stage to connect to eXpServer to send messages.

### File Structure for Stage 6

![filestructure.png](/assets/stage-6/filestructure.png)

We will group listener and connection modules under the category _network_. Create a folder named `network` inside the `expserver/src` folder.

## Design

The main objective of Stage 6 is to enable eXpServer to listen on multiple ports simultaneously. This involves designing and implementing a module called `xps_listener`. Each instance of `xps_listener` module contains a socket which is bound to a specific host and port, and it is responsible for listening to incoming network connections on it.

This modularization will allow eXpServer to create multiple listeners each bound to different ports.

When an `xps_listener` instance gets a client connection, an instance of `xps_connection` is created. `xps_connection` module is responsible for managing individual TCP connections between the server and clients. It encapsulates functionality related to creating, managing, and destroying connection instances.

<!-- ![design.png](/assets/stage-6/design.png) -->

## Implementation

![implementation.png](/assets/stage-6/implementation.png)

### `xps.h`

`xps.h` serves as a global header file and contains declarations common to all modules. Create a file named `xps.h` under the `expserver/src` folder and copy the following content into it.

::: details **expserver/src/xps.h**

```c
#ifndef XPS_H
#define XPS_H

// Header files
#include <arpa/inet.h>
#include <assert.h>
#include <netdb.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdarg.h>
#include <sys/epoll.h>
#include <sys/socket.h>
#include <unistd.h>

// 3rd party libraries
#include "lib/vec/vec.h" // https://github.com/rxi/vec

// Constants
#define DEFAULT_BACKLOG 64
#define MAX_EPOLL_EVENTS 32
#define DEFAULT_BUFFER_SIZE 100000 // 100 KB

// Data types
typedef unsigned char u_char;
typedef unsigned int u_int;
typedef unsigned long u_long;

// Structures
struct xps_listener_s;
struct xps_connection_s;

// Struct typedefs
typedef struct xps_listener_s xps_listener_t;
typedef struct xps_connection_s xps_connection_t;

// Temporary declarations
extern vec_void_t listeners;
extern vec_void_t connections;
int xps_loop_create();
void xps_loop_attach(int epoll_fd, int fd, int events);
void xps_loop_detach(int epoll_fd, int fd);
void xps_loop_run(int epoll_fd);

// xps headers
#include "network/xps_connection.h"
#include "network/xps_listener.h"
#include "utils/xps_logger.h"
#include "utils/xps_utils.h"

#endif
```

:::

Let us have a brief look at what are included in the file:

- `#ifndef XPS_H` & `#define XPS_H`:
  This is called an [include guard](https://en.wikipedia.org/wiki/Include_guard) in C programming. It is a common technique used to prevent multiple inclusions of the same header file while compiling.
- **Standard header files:**
  Headers files from [C standard library](https://en.wikipedia.org/wiki/C_standard_library). The use of each header will be explained at appropriate parts of the stage.
- **3rd party libraries:**
  External libraries we will be using in the development of eXpServer. They will be put in the `expserver/src/lib` folder.
- **Constants:**
  Usage of these will be explained at appropriate parts of the stage.
- **Data types:**
  - We use `u_char` for data buffers (array of bytes). For example: `u_char buff[1000];`
  - `u_int` and `u_long` are used if the values of the integer cannot be < 0.
- **Structures:**
  Declarations of various structures that we use to encapsulate data associated with a module. Presently, we have these two structures, i.e. `struct xps_listener_s` and `struct xps_connection_s`.
- [**Typedefs' for structures:**](https://en.wikipedia.org/wiki/Typedef#Structures_and_structure_pointers)
  In order to reduce code length we typedef structure names. For instance, instead of writing `struct xps_listener_s` we can simply write `xps_listener_t` once it is typedef'd.
- [**Typedefs' for functions**](https://en.wikipedia.org/wiki/Typedef#Function_pointers)
- **Temporary declarations:**
  Declarations of global variables and functions defined in `main.c` that will be used in other files. These declarations will be eventually moved to its corresponding module header files in later stages.
- **xps headers:**
  Header files created by us for the modules that we write.

As `xps.h` has all the headers and declarations that we need for all the modules, we will only have to import `xps.h` into each file instead of importing individual headers.

We will be constantly modifying/adding to this file in each stage to accommodate for newer functions, structures, types, constants, headers etc.

---

### `main.c`

`main.c` will contain the following:

- `main()`; starting point of eXpServer. It’s main objective is to spin up listener(s) and run the event loop.
- Implementation of event loop and its functions.

Let us have a look at the high level outline of `main.c`:

```txt
main()
  create event loop
  create listeners, each listening on different ports
  run event loop

loop_create()
  create event loop instance and return it

loop_attach()
  attach FD to event loop

loop_detach()
  detach FD from event loop

loop_run()
  run event loop
```

Implementation of `main.c` requires functions from the listener module and the connection module. So lets work on those modules first and come back to this.

### `xps_listener` Module

An `xps_listener` is an instance of a listening socket in eXpServer. It listens for incoming client connections, accepts them and creates `xps_connection` instances.

#### `xps_listener.h`

The code below has the contents of the header file for `xps_listener`. Have a look at it and make a copy of it in your codebase.

::: details **expserver/src/network/xps_listener.h**

```c
#ifndef XPS_LISTENER_H
#define XPS_LISTENER_H

#include "../xps.h"

struct xps_listener_s {
  int epoll_fd;
  const char *host;
  u_int port;
  u_int sock_fd;
};

xps_listener_t *xps_listener_create(int epoll_fd, const char *host, u_int port);
void xps_listener_destroy(xps_listener_t *listener);
void xps_listener_connection_handler(xps_listener_t *listener);

#endif
```

:::

`struct xps_listener_s` acts as a wrapper for data associated with a listener instance. Below the struct are the function prototypes that are related to listener.

Each listener instance has the following data:

- `int epoll_fd`: epoll FD that the listener is attached to
- `const char *host`: String IP address of host (interface) the listener is bound to
- `u_int port`: Port the server is listening on
- `u_int sock_fd`: FD of the listening socket

---

#### `xps_listener.c`

Create a file named `xps_listener.c` under `expserver/src/network`. This file will contain the definitions of all functions related to `xps_listener` module.

As we know, each module will have create and destroy functions. The purpose of `xps_listener_create()` is to:

- Create and setup a socket
- Allocate memory and initialize `xps_listener_t` instance
- Attach the listener to loop

The function takes in an epoll FD, host address (IP) and port and returns a pointer of type `xps_listener_t` on success or `NULL` on error.

::: details **expserver/src/network/xps_listener.c** : `xps_listener_create()`

```c
xps_listener_t *xps_listener_create(int epoll_fd, const char *host, u_int port) {
  assert(host != NULL);
  assert(is_valid_port(port)); // Will be explained later

  // Create socket instance
  int sock_fd = socket(AF_INET, SOCK_STREAM | SOCK_NONBLOCK, 0);
  if (sock_fd < 0) {
    logger(LOG_ERROR, "xps_listener_create()", "socket() failed");
    perror("Error message");
    return NULL;
  }

  // Make address reusable
  const int enable = 1;
  if (/* make socket address reusable using setsockopt() */) < 0) {
    logger(LOG_ERROR, "xps_listener_create()", "setsockopt() failed");
    perror("Error message");
    close(sock_fd);
    return NULL;
  }

  // Setup listener address
  struct addrinfo *addr_info = xps_getaddrinfo(host, port); // Will be explained later
  if (addr_info == NULL) {
    logger(LOG_ERROR, "xps_listener_create()", "xps_getaddrinfo() failed");
    close(sock_fd);
    return NULL;
  }

  // Binding to port
  if (bind(sock_fd, addr_info->ai_addr, addr_info->ai_addrlen) < 0) {
    logger(LOG_ERROR, "xps_listener_create()", "failed to bind() to %s:%u", host, port);
    perror("Error message");
    freeaddrinfo(addr_info); // Will be explained later
    close(sock_fd);
    return NULL;
  }
  freeaddrinfo(addr_info); // Will be explained later

  // Listening on port
  if (listen(sock_fd, DEFAULT_BACKLOG) < 0) {
    logger(LOG_ERROR, "xps_listener_create()", "listen() failed");
    perror("Error message");
    close(sock_fd);
    return NULL;
  }

  // Create & allocate memory for a listener instance
  xps_listener_t *listener = malloc(sizeof(xps_listener_t));
  if (listener == NULL) {
    logger(LOG_ERROR, "xps_listener_create()", "malloc() failed for 'listener'");
    close(sock_fd);
    return NULL;
  }

  // Init values
  listener->epoll_fd = /* fill this */
  listener->host = /* fill this */
  listener->port = /* fill this */
  listener->sock_fd = /* fill this */

  // Attach listener to loop
  xps_loop_attach(epoll_fd, sock_fd, EPOLLIN);

  // Add listener to global listeners list
  vec_push(&listeners, listener);

  logger(LOG_DEBUG, "xps_listener_create()", "created listener on port %d", port);

  return listener;
}
```

:::

After creating the socket, allocating memory for listener and initializing values, we use `xps_loop_attach()` function (will be implemented in `main.c`) to attach the listener instance to the event loop.

Additionally, to keep track of all the created listeners, we add the created listeners to a list we maintain named `vec_void_t listeners` in `main.c`, defined globally and declared under _temporary declarations_ in `xps.h`. The purpose of this will be apparent when we implement `xps_loop_run()` in `main.c`.

In the above code, we see the use of two utility functions. These functions are defined in `xps_utils.c`.

- `is_valid_port(port)`: Utility function to check if a port number is valid. Read more from [here](/guides/references/xps_utils#is-valid-port).
- `xps_getaddrinfo(host, port)`: Utility function to do a DNS query and get address for given host and port combination. Read more from [here](/guides/references/xps_utils#xps-getaddrinfo).

---

Let us move onto the `xps_listener_destroy()` function. When a listener instance is provided, the function destroys the instance and frees up the memory. To destroy an instance of listener, we have to:

- Detach it from the loop
- Set the listener to `NULL` in the listeners list
- Close the socket associated with the listener
- Free the memory for listener instance

::: details **expserver/src/network/xps_listener.c** : `xps_listener_destroy()`

```c
void xps_listener_destroy(xps_listener_t *listener) {

  // Validate params
  assert(listener != NULL);

  // Detach listener from loop
  xps_loop_detach(listener->epoll_fd, listener->sock_fd);

  // Set listener to NULL in 'listeners' list
  for (int i = 0; i < listeners.length; i++) {
    xps_listener_t *curr = listeners.data[i];
    if (curr == listener) {
      listeners.data[i] = NULL;
      break;
    }
  }

  // Close socket
  close(listener->sock_fd);

  logger(LOG_DEBUG, "xps_listener_destroy()", "destroyed listener on port %d", listener->port);

  // Free listener instance
  free(listener);

}
```

:::

::: warning **Why are we setting `NULL` in the listeners list?**
You might have thought why it is necessary to set to `NULL` in the listeners list instead of removing the listener pointer from the list altogether. The reason is that, the _listeners_ list could be accessed from another part of the code. We will see the use of this in the next stage.

**But how would we stop the `NULL` entries from accumulating?**

We will keep track of a `NULL` counter eg: `n_null_listeners` and increment it every time we set an item to `NULL` in the list. When the count goes above a certain threshold we will do a _compaction_ on the list by clearing all the `NULL` entries when it is safe to do so. This functionality is not part of the current stage and will be implemented in the upcoming stages.
:::

With the listeners attached to the event loop using `xps_loop_attach()`, when a client tries to connect to a listener, we will get a notification from the epoll. To handle this, we’ll create a function `xps_listener_connection_handler()`. This function is responsible to accept the incoming client connection and to create an instance of `xps_connection_t` using `xps_connection_create()` function. Think about where `xps_listener_connection_handler()` may be called.

::: details **expserver/src/network/xps_listener.c** : `xps_listener_connection_handler()`

```c
void xps_listener_connection_handler(xps_listener_t *listener) {
  assert(listener != NULL);

  struct sockaddr conn_addr;
  socklen_t conn_addr_len = sizeof(conn_addr);

  // Accepting connection
  int conn_sock_fd = /* accept connection using accept() */
  if (conn_sock_fd < 0) {
    logger(LOG_ERROR, "xps_listener_connection_handler()", "accept() failed");
    perror("Error message");
    return;
  }

  // Creating connection instance
  xps_connection_t *client = xps_connection_create(listener->epoll_fd, conn_sock_fd); // Will be implemented later
  if (client == NULL) {
    logger(LOG_ERROR, "xps_listener_connection_handler()", "xps_connection_create() failed");
    close(conn_sock_fd);
    return;
  }
  client->listener = listener;

  logger(LOG_INFO, "xps_listener_connection_handler()", "new connection");
}
```

:::

With that, the listener module is done. Let us have a quick recap of what we have done till now.

---

### Milestone #1

- We have created an `xps_listener` module with three functions:
  - `xps_listener_create()` takes a host and port and creates a listener instance.
  - `xps_listener_destroy()` takes in a listener instance, de-allocates the memory, closes the associated socket and performs other related operations.
  - `xps_listener_connection_handler()` is responsible for accepting client connections.
- To create multiple listeners, all we have to do is call `xps_listener_create()` with different ports.

---

### `xps_connection` Module

`xps_connection` module is the encapsulation of all TCP connection related functionalities in eXpServer. In this stage we will implement a rudimentary form of the connection module and will expand on it in the later stages.

#### `xps_connection.h`

The code below has the contents of the header file for `xps_connection`. Have a look at it and make a copy of it in your codebase.

::: details **expserver/src/network/xps_connection.h**

```c
#ifndef XPS_CONNECTION_H
#define XPS_CONNECTION_H

#include "../xps.h"

struct xps_connection_s {
  int epoll_fd;
  int sock_fd;
  xps_listener_t *listener;
  char *remote_ip;
};

xps_connection_t *xps_connection_create(int epoll_fd, int sock_fd);
void xps_connection_destroy(xps_connection_t *connection);
void xps_connection_read_handler(xps_connection_t *connection);

#endif
```

:::

Each connection instance has the following data:

- `int epoll_fd`: epoll FD that the connection socket is attached to
- `int sock_fd`: Socket FD of the connection
- `xps_listener_t *listener`: Pointer to the listener instance associated with the connection instance
- `char *remote_ip`: String representation of the client’s IP address

#### `xps_connection.c`

Let us begin with the _create_ and _destroy_ functions. Hopefully you have a general idea of what it is responsible for:

- `xps_connection_t *xps_connection_create()` is responsible for creating a connection instance by allocating it the required memory and attaching the created instance to the event loop.
- `void xps_connection_destroy()` takes in a connection and destroys it by detaching it from the loop and de-allocating the memory consumed by it.

::: details **expserver/src/network/xps_connection.c**

```c
xps_connection_t *xps_connection_create(int epoll_fd, int sock_fd) {

  xps_connection_t *connection = /* allocate memory dynamically */
  if (connection == NULL) {
    logger(LOG_ERROR, "xps_connection_create()", "malloc() failed for 'connection'");
    return NULL;
  }

  /* attach sock_fd to epoll */

  // Init values
  connection->epoll_fd = epoll_fd;
  connection->sock_fd = sock_fd;
  connection->listener = NULL;
  connection->remote_ip = get_remote_ip(sock_fd);

  /* add connection to 'connections' list */

  logger(LOG_DEBUG, "xps_connection_create()", "created connection");
  return connection;

}

void xps_connection_destroy(xps_connection_t *connection) {

  /* validate params */

  /* set connection to NULL in 'connections' list */

  /* detach connection from loop */

  /* close connection socket FD */

  /* free connection->remote_ip */

  /* free connection instance */

  logger(LOG_DEBUG, "xps_connection_destroy()", "destroyed connection");

}
```

:::

- `get_remote_ip()`: Utility function that takes in a socket FD and returns the IP address string using [`getpeername()`](https://man7.org/linux/man-pages/man2/getpeername.2.html) function. Read more about the utility [here](/guides/references/xps_utils#get-remote-ip).

::: warning
When you have a struct containing dynamically allocated memory, free any pointers inside the struct before freeing the struct instance itself. Notice what we did for the connection instance above.

`epoll_fd` and `sock_fd` are of type int (not dynamically allocated) and need not be freed. The `listener` instance also shouldn't be destroyed as it may be serving other connections. Whereas `remote_ip` is a dynamically allocated character string, which needs to be de-allocated before we free the connection instance.
:::

With the connection instances attached to the epoll, we will get notification from the event loop if there is a read event. To handle this, we’ll create a function `xps_connection_read_handler()` to receive data from the client, reverse the string and send it back; similar to what we did in Phase 0. Think about where `xps_connection_read_handler()` will be called.
::: details **expserver/src/network/xps_connection.c** : `xps_connection_read_handler()`

```c
void xps_connection_read_handler(xps_connection_t *connection) {

  /* validate params */

  long read_n = /* read data from client using recv() */

  if (read_n < 0) {
    logger(LOG_ERROR, "xps_connection_read_handler()", "recv() failed");
    perror("Error message");
    xps_connection_destroy(connection);
    return;
  }

  if (read_n == 0) {
    logger(LOG_INFO, "connection_read_handler()", "peer closed connection");
    xps_connection_destroy(connection);
    return;
  }

  buff[read_n] = '\0';

  /* print client message */

  /* reverse client message */

  // Sending reversed message to client
  long bytes_written = 0;
  long message_len = read_n;
  while (bytes_written < message_len) {
    long write_n = /* send message using send() */
    if (write_n < 0) {
      logger(LOG_ERROR, "xps_connection_read_handler()", "send() failed");
      perror("Error message");
      xps_connection_destroy(connection);
      return;
    }
    bytes_written += write_n;
  }

}
```

:::

::: tip NOTE
Observe the use of `xps_connection_destroy()` when an error occurs.
:::

---

### `main.c` - Continued

With the listener and connection modules in place, we can continue with `main.c`'s implementation.

::: details **expserver/src/main.c**

```c
#include "xps.h"

// Global variables
int epoll_fd;
struct epoll_event events[MAX_EPOLL_EVENTS];
vec_void_t listeners;
vec_void_t connections;

int main() {

  epoll_fd = /* create an event loop instance using xps_loop_create() */

  // Init lists
  vec_init(&listeners);
  vec_init(&connections);

  // Create listeners on ports 8001, 8002, 8003
  for (int port = 8001; port <= 8003; port++) {
    /* create listener instance using xps_listener_create() */
    logger(LOG_INFO, "main()", "Server listening on port %u", port);
  }

  /* run the event loop using xps_loop_run() */

}

int xps_loop_create() {
  /* create a loop instance and return epoll FD */
}

void xps_loop_attach(int epoll_fd, int fd, int events) {
  /* attach fd to epoll */
}

void xps_loop_detach(int epoll_fd, int fd) {
  /* detach fd from epoll */
}

void xps_loop_run(int epoll_fd) {
  /* run the event loop */
}
```

:::

The global variables are temporary declarations that we saw in `xps.h` file.

- `vec_void_t listeners`: List to store all the listeners created by us
- `vec_void_t connections`: List to store the connection instances accepted by the listeners

The use of these lists will be explained subsequently.

There are four functions associated with the loop, all of which we have seen in Phase 0. We rename them according to our coding convention:

- `loop_create()` → `xps_loop_create()`
- `loop_attach()` → `xps_loop_attach()`
- `loop_detach()` → `xps_loop_detach()`
- `loop_run()` → `xps_loop_run()`

The implementation of all these functions remain the same except for `xps_loop_run()`.

#### `xps_loop_run()`

In Stage 5, we had three types of events that could occur in epoll:

- Read event on the listen socket
- Read event on the connection socket
- Read event on the upstream socket

Since this stage involves receiving a message from the client, reversing it and sending it back, we won’t not be needing upstream. We will work on the first two types of events:

::: tip NOTE
Upstream will have its own module (`xps_upstream`) and will be implemented in Stage 11.
:::

- **Read event on listening socket:**
  When a read event occurs on a listener, we call `xps_listener_connection_handler()` to handle it. This function is responsible for accepting the connection and creating an instance of `xps_connection`.
- **Read event on connection socket:**
  When a read event occurs on a connection, we call a function `xps_connection_read_handler()` to handle it. This function will read the message from the client, and send back the reversed string.

But how do we figure out if an event is from a listening socket or a connection socket in `xps_loop_run()`?

To distinguish between them, we rely on the lists of listeners (`vec_void_t listeners`) and connections (`vec_void_t connections`) that we maintain as global variables. All instances of listeners and connections are added to these lists within their respective _create_ functions.

We will search through the `listeners` and `connections` list to find a matching FD we received from the epoll event.

::: details **expserver/src/main.c** : `xps_loop_run()`

```c
void xps_loop_run(int epoll_fd) {
  while (1) {
    logger(LOG_DEBUG, "xps_loop_run()", "epoll wait");
    int n_ready_fds = epoll_wait(epoll_fd, events, MAX_EPOLL_EVENTS, -1);
    logger(LOG_DEBUG, "xps_loop_run()", "epoll wait over");

    // Process events
    for (int i = 0; i < n_ready_fds; i++) {
      int curr_fd = events[i].data.fd;

      // Checking if curr_fd is of a listener
      xps_listener_t *listener = NULL;
      for (int i = 0; i < listeners.length; i++) {
        xps_listener_t *curr = listeners.data[i];
        if (curr != NULL && curr->sock_fd == curr_fd) {
          listener = curr;
          break;
        }
      }
      if (listener) {
        xps_listener_connection_handler(listener);
        continue;
      }

      // Checking if curr_fd is of a connection
      xps_connection_t *connection = NULL;

      /* iterate through the connections and check if curr_fd is of a connection */

      if (connection)
        xps_connection_read_handler(connection);
    }
  }
}
```

:::

---

### Milestone #2

Time to test the code!

The following command can be used to compile all the code in stage 6:

```bash
gcc -g -o xps main.c lib/vec/vec.c network/xps_connection.c network/xps_listener.c utils/xps_logger.c utils/xps_utils.c
```

To prevent typing the command again and again, create a `build.sh` file in `expserver/src`. Copy over the command into the script file and use the following commands to change the file permission and run the script in the terminal.

```bash
chmod +x build.sh
./build.sh
```

After compiling, it should give an output file named `xps`. Start eXpServer using `./xps`. You should get the following output:

```bash
[INFO] main() : Server listening on port 8001
[INFO] main() : Server listening on port 8002
[INFO] main() : Server listening on port 8003
```

::: tip NOTE
Utilize the `xps_logger` utility and GDB to debug your code. The debug logs will not show up unless the environment variable `XPS_DEBUG` is set to “1”.
Use the following command to set `XPS_DEBUG`:

```bash
export XPS_DEBUG=1
```

You can unset it using the command:

```bash
unset XPS_DEBUG
```

:::

Let us do a detailed test to check if everything works as expected.

1. Open four terminals. One terminal is for eXpServer and the others will be _netcat_ clients connecting to the server. Start a netcat client on port 8001, and send a message to the server. The server will receive the message and send the reversed message back to the client.

   ![milestone2-1.png](/assets/stage-6/milestone2-1.png)

2. Start another netcat client on port 8002, and send a message. The server will receive the message and send the reversed message back to the client.

   ![milestone2-2.png](/assets/stage-6/milestone2-2.png)

3. Now, to check if another client can connect to a port that is being used by a client, start a netcat client and connect it to either 8001 or 8002 and observe. Sending a message will give the same result as the above two cases.

   ![milestone2-3.png](/assets/stage-6/milestone2-3.png)

4. Try sending more messages from all the clients to verify if the clients are still connected to the server, and if the appropriate clients are receiving the reversed messages.

   ![milestone2-4.png](/assets/stage-6/milestone2-4.png)

5. And finally, disconnect clients from the server and check if the server is still up and running, ready to accept more client connections.

   ![milestone2-5.png](/assets/stage-6/milestone2-5.png)

::: danger Test
Try the same test with 4 clients and 3 ports.
:::

### Function Call Order

Here is the rough function call order for Stage 6. This will provide an informal overview of how the code will execute. Keep in mind this is not the actual execution order as it is dependent on external factors such as client connections. _Function Call Orders_ will be provided at the beginning of each stage from now on so that we can have a rough idea of the code flow.

```txt
main()
  loop_create()
  xps_listener_create()
    xps_loop_attach()
  xps_loop_run()
  epoll_wait()
    xps_listener_connection_handler()
      xps_connection_create()
    xps_connection_read_handler()
      send()
      recv()
      xps_connection_destroy()
```

## Conclusion

With that, we have completed the modularization of listeners and connections. In the next stage, we will create the loop and core modules.
