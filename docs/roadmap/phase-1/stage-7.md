# Stage 7: Core & Loop Modules

## Recap

- In Stage 6, we created the listener and connection modules
- The implementation of loop was done in `main.c` file
- Global variables were used for keeping track of listener and connection instances

## Learning Objectives

- Modularize event loop by creating the `xps_loop` module by shifting it out of the main.c file
- Create a module called `xps_core` which will encapsulate all the global data beloinging to eXpServer

## Introduction

In this stage, we will be modularizing the code further by adding two more modules so that when we add more code, it will be aligned with the overall architecture of eXpServer.

1. `xps_core` module
2. `xps_loop` module

With the integration of these modules, modifications to the `xps_listener` and `xps_connection` modules will be necessary. Furthermore, the `main.c` file will see a significant cleanup with the extraction of loop-related functions into a separate loop module.

### File structure

![filestructure.png](/assets/stage-7/filestructure.png)

## Design

Adding to the modularization of eXpServer, in this stage, we design and implement two new modules named `xps_core` and `xps_loop`.

`xps_core` acts as the central hub of eXpServer, managing all other modules. It is responsible for initializing the event loop, managing listeners and connections. It coordinates the startup, shutdown, and runtime behaviour of eXpServer. It’s design focuses on modularity and scalability.

The `xps_loop` module implements the event loop using the epoll mechanism for handling I/O events. It monitors FDs for read and write events, dispatching callbacks for event handling. Each `xps_loop` instance belongs to a core instance.

![design.png](/assets/stage-7/design.png)

## Implementation

Let’s have a clear picture before we move forward with the code.

- The main function will create a `xps_core` instance, and start it (In later stages we will spin up multiple core instances, that will run concurrently).
- The `xps_core` will be responsible for spinning up listeners and running the event loop, which is implemented `xps_loop` module
- The `xps_loop` module will include functions related to creating and destroying loop instances, running them, attaching and detaching events to the loop, and handling those events.
- **There is a one to one correspondence between core instance and loop instance**. That is, when a loop instance is created, we attach it to a core instance. So when the core is destroyed, the loop attached to it is destroyed along with it.

![implementation.png](/assets/stage-7/implementation.png)

### `xps.h`

Find below the updated `xps.h` file.

::: tip NOTE
Modifications to files we've worked with before will be indicated by the following:

```txt
Line added // [!code ++]
Line removed // [!code --]
```

:::

::: details **expserver/src/xps.h**

```c
#ifndef XPS_H
#define XPS_H

// Header files
#include <arpa/inet.h>
#include <assert.h>
#include <netdb.h>
#include <stdarg.h>
#include <stdbool.h>
#include <stdio.h>
#include <sys/epoll.h>
#include <sys/socket.h>
#include <unistd.h>
#include <signal.h> // [!code ++]

// 3rd party libraries
#include "lib/vec/vec.h" // https://github.com/rxi/vec

// Constants
#define DEFAULT_BACKLOG 64
#define MAX_EPOLL_EVENTS 32
#define DEFAULT_BUFFER_SIZE 100000 // 100 KB
#define DEFAULT_NULLS_THRESH 32 // [!code ++]

// Error constants
#define OK 0            // Success  // [!code ++]
#define E_FAIL -1       // Un-recoverable error  // [!code ++]
#define E_AGAIN -2      // Try again  // [!code ++]
#define E_NEXT -3       // Do next  // [!code ++]
#define E_NOTFOUND -4   // File not found  // [!code ++]
#define E_PERMISSION -5 // File permission denied  // [!code ++]
#define E_EOF -6        // End of file reached  // [!code ++]

// Data types
typedef unsigned char u_char;
typedef unsigned int u_int;
typedef unsigned long u_long;

// Structs
struct xps_core_s; // [!code ++]
struct xps_loop_s; // [!code ++]
struct xps_listener_s;
struct xps_connection_s;

// Struct typedefs
typedef struct xps_core_s xps_core_t;  // [!code ++]
typedef struct xps_loop_s xps_loop_t;  // [!code ++]
typedef struct xps_listener_s xps_listener_t;
typedef struct xps_connection_s xps_connection_t;

// Function typedefs
typedef void (*xps_handler_t)(void *ptr); // [!code ++]

// Temporary declarations // [!code --]
extern vec_void_t listeners; // [!code --]
extern vec_void_t connections; // [!code --]
int xps_loop_create(); // [!code --]
void xps_loop_attach(int epoll_fd, int fd, int events); // [!code --]
void xps_loop_detach(int epoll_fd, int fd); // [!code --]
void xps_loop_run(int epoll_fd); // [!code --]

 // xps headers
#include "core/xps_core.h"  // [!code ++]
#include "core/xps_loop.h"  // [!code ++]
#include "network/xps_connection.h"
#include "network/xps_listener.h"
#include "utils/xps_logger.h"
#include "utils/xps_utils.h"

#endif
```

:::

- Added `signal.h` header to use a [signal handler](https://en.wikipedia.org/wiki/C_signal_handling).
- Added error code constants, each representing a specific error condition.
- Added new structure declarations, typedefs and headers related to `xps_core` and `xps_loop` modules.
- Added a function type `xps_handler_t` which is the type for [callback functions](<https://en.wikipedia.org/wiki/Callback_(computer_programming)>) used throughout eXpServer.
- Removed temporary declarations.

::: tip NOTE
You are free to modify the code in any file you want, including the `xps.h` file. The documentation is to guide you in the right direction and not restrict you in any way. Feel free to add new functions, global variables, constants, structures etc.
:::

---

### `main.c`

In the previous stage, we had the implementation of the event loop inside the `main.c` file. This will be removed as we will be building a separate module for the event loop - `xps_loop`. Additionally, `xps_core` is the central hub to which all other instances will be attached.
So, now all `main.c` has to do is create `xps_core` instance and ‘start’ it:

```txt
main()
  create core instance
  start core
```

Implementation of this requires functions from the loop and core modules. So lets work on that first.

---

### `xps_loop` Module

`xps_loop` module which implements the event loop is one of the most important parts eXpServer. In this stage we will implement the basic form of `xps_loop`. It will be updated to support other modules when we build them in later stages.

#### `xps_loop.h`

The code below has the contents of the header file for `xps_loop`. Have a look at it and make a copy of it in your codebase.

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
  void *ptr;
};

typedef struct loop_event_s loop_event_t;

xps_loop_t *xps_loop_create(xps_core_t *core);
void xps_loop_destroy(xps_loop_t *loop);
int xps_loop_attach(xps_loop_t *loop, u_int fd, int event_flags, void *ptr, xps_handler_t read_cb);
int xps_loop_detach(xps_loop_t *loop, u_int fd);
void xps_loop_run(xps_loop_t *loop);

#endif
```

:::

`struct xps_loop_s` acts as a wrapper for all data related to a loop instance. Below are the members of the struct:

- `xps_core_t *core`: Pointer to the core instance to which the loop belongs to (we reiterate by saying there is a one-to-one correspondence between a core instance and a loop instance. Presently, we create only one core instance, and therefore only one loop instance).
- `u_int epoll_fd`: FD of the epoll instance
- `struct epoll_event epoll_events[MAX_EPOLL_EVENTS]`: Array to store events reported by epoll during `epoll_wait()`
- `vec_void_t events`: Array to hold pointers to `loop_event_t` structs (will be explained below).
- `u_int n_null_events`: Number of `NULL` events

Apart from this, we observe that there is a struct (`struct loop_event_s`) for loop events. Given below is an explanation of the structure’s fields. A more detailed explanation for `loop_event` is provided in the [xps_loop.c](/roadmap/phase-1/stage-7#xps-loop-c) section.

- `u_int fd`: FD associated with the event
- `xps_handler_t read_cb`: Callback function to be called when a read event occurs on the the associated FD
- `void *ptr`: It is a pointer to the instance which is attached to the loop. (Will be clear as we move further)

::: tip NOTE
`struct loop_event_s` will be used locally, i.e. within the loop module only. Thus we place the typedef to `loop_event_t` in `xps_loop.h` and not in `xps.h`.
:::

#### `xps_loop.c`

**loop_event_create()** & **loop_event_destroy()**

In the previous stage, when we get a notification from `epoll_wait()`, we would try to figure out if the FD with the event belongs to a listener instance or a connection instance by iterating through all listeners and connections. This is O(n) time complexity. However we can make this process more efficient. Let's look at how we can do that.

When adding a FD to be monitored by epoll using the `epoll_ctl()` function, we usually setup a variable of type `struct epoll_event` , say `struct epoll_event e`. We assign the FD to `e` by doing `e.data.fd = FD`.

In `struct epoll_event`, along with `e.data.fd`, there is another field named `e.data.ptr`. This is a void pointer. Void pointers can be typecasted to any other type, in our case, into `xps_listener_t` or `xps_connection_t`.

But how do we figure out what to typecast `ptr` to? This is where `struct loop_event_s` comes in. You would have seen its definition in the `xps_loop.h` file.

```c
// Present in xps_loop.h
struct loop_event_s { // [!code focus]
  u_int fd; // [!code focus]
  xps_handler_t read_cb; // [!code focus]
  void *ptr; // [!code focus]
}; // [!code focus]

typedef struct loop_event_s loop_event_t;

// Present in xps.h
typedef void (*xps_handler_t)(void *ptr);
```

`loop_event_t` is a container for information associated with an ‘event’ that is attached to the event loop. An instance of `loop_event_t` will be created inside `xps_loop_attach()` using `loop_event_create()` function.

- `fd`: FD to be attached to epoll
- `read_cb`: Callback function to be called when read event occurs
- `ptr`: Pointer to instance of `xps_listener_t` or `xps_connection_t`

A pointer to an instance to `loop_event_t` will be assigned to `e.data.ptr` . So, when we get a notification after `epoll_wait()` we can typecast `e.data.ptr` to `loop_event_t` and access the callback function(s).

Currently there is only the read callback. In upcoming stages we will be adding `write_cb` and `close_cb` both of type `xps_handler_t`. Looking at the typedef for `xps_handler_t` you can see that it is a function that takes a void pointer. We will pass the `ptr` from `loop_event_t` when we call the callback(s). The callback functions are assigned such that, they will know to typecast `ptr` appropriately to `xps_listener_t *` or `xps_connection_t *`. This will be more clear later in the stage where we talk about changes to listener and connection module.

Given below is the code for `loop_event_create()` and `loop_event_destory()`. These functions are called within the loop module and hence does not have the `xps_` prefix.

::: details **expserver/src/core/xps_loop.c**

```c
loop_event_t *loop_event_create(u_int fd, void *ptr, xps_handler_t read_cb) {
  assert(ptr != NULL);

  // Alloc memory for 'event' instance
  loop_event_t *event = malloc(sizeof(loop_event_t));
  if (event == NULL) {
    logger(LOG_ERROR, "event_create()", "malloc() failed for 'event'");
    return NULL;
  }

  /* set fd, ptr, read_cb fields of event */

  logger(LOG_DEBUG, "event_create()", "created event");

  return event;
}

void loop_event_destroy(loop_event_t *event) {
  assert(event != NULL);

  free(event);

  logger(LOG_DEBUG, "event_destroy()", "destroyed event");
}
```

:::

We can now move on to implement the _create_ and _destroy_ functions of `xps_loop`.

---

Function prototypes are given for each function in the `xps_loop.h` file. Try to implement them.

::: tip NOTE
A function prototype outlines the essential details of a function including its name, parameters and return type. This prototype serves as a reference for how the function should be called. From now onwards, you will be responsible for writing the function definitions according to the prototypes given in the header files. The documentation will describe the requirements for the functions and explain any new concepts required in its implementation.
:::

::: details **expserver/src/core/xps_loop.c**

```c
/**
 * Creates a new event loop instance associated with the given core.
 *
 * This function creates an epoll file descriptor, allocates memory for the xps_loop instance,
 * and initializes its values.
 *
 * @param core : The core instance to which the loop belongs
 * @return A pointer to the newly created loop instance, or NULL on failure.
 */
xps_loop_t *xps_loop_create(xps_core_t *core) {
  assert(core != NULL);

  /* fill this */

}

/**
 * Destroys the given loop instance and releases associated resources.
 *
 * This function destroys all loop_event_t instances present in loop->events list,
 * closes the epoll file descriptor and releases memory allocated for the loop instance,
 *
 * @param loop The loop instance to be destroyed.
 */
void xps_loop_destroy(xps_loop_t *loop) {
  assert(loop != NULL);

  /* fill this */

}

/**
 * Attaches a FD to be monitored using epoll
 *
 * The function creates an intance of loop_event_t and attaches it to epoll.
 * Add the pointer to loop_event_t to the events list in loop
 *
 * @param loop : loop to which FD should be attached
 * @param fd : FD to be attached to epoll
 * @param event_flags : epoll event flags
 * @param ptr : Pointer to instance of xps_listener_t or xps_connection_t
 * @param read_cb : Callback function to be called on a read event
 * @return : OK on success and E_FAIL on error
 */
int xps_loop_attach(xps_loop_t *loop, u_int fd, int event_flags, void *ptr, xps_handler_t read_cb) {
  assert(loop != NULL);
  assert(ptr != NULL);

  /* fill this */

}

/**
 * Remove FD from epoll
 *
 * Find the instance of loop_event_t from loop->events that matches fd param
 * and detach FD from epoll. Destroy the loop_event_t instance and set the pointer
 * to NULL in loop->events list. Increment loop->n_null_events.
 *
 * @param loop : loop instnace from which to detach fd
 * @param fd : FD to be detached
 * @return : OK on success and E_FAIL on error
 */
int xps_loop_detach(xps_loop_t *loop, u_int fd) {
  assert(loop != NULL);

  /* fill this */

}
```

:::

::: warning
Don’t forget to validate params, handle errors and use the logger!
:::

---

**xps_loop_run()**

With the addition of `loop_event_t` the way we deal with events from epoll has to change.

::: details **expserver/src/core/xps_loop.c**

```c
void xps_loop_run(xps_loop_t *loop) {
  /* Validate params */

  while (1) {
    logger(LOG_DEBUG, "xps_loop_run()", "epoll wait");
    int n_events = /* fill epoll_wait() */
    logger(LOG_DEBUG, "xps_loop_run()", "epoll wait over");

    logger(LOG_DEBUG, "xps_loop_run()", "handling %d events", n_events);

    // Handle events
    for (int i = 0; i < n_events; i++) {
      logger(LOG_DEBUG, "xps_loop_run()", "handling event no. %d", i + 1);

      struct epoll_event curr_epoll_event = loop->epoll_events[i];
      loop_event_t *curr_event = curr_epoll_event.data.ptr;

      // Check if event still exists. Could have been destroyed due to prev event
      int curr_event_idx = /* search through loop->events and get index of curr_event, set it to -1 if not found */
      // 🟡 Above can be optimized using an RB tree
      if (curr_event_idx == -1) {
        logger(LOG_DEBUG, "handle_epoll_events()", "event not found. skipping");
        continue;
      }

      // Read event
      if (curr_epoll_event.events & EPOLLIN) {
        logger(LOG_DEBUG, "handle_epoll_events()", "EVENT / read");
        if (curr_event->read_cb != NULL)
          // Pass the ptr from loop_event_t as a parameter to the callback
          curr_event->read_cb(/* fill this */);
      }
    }
  }
}
```

🟡 explain ptr a bit better

:::

Reading the `xps_loop_run()` function provides more clarity about how the callback function is invoked on receiving an event from epoll.

::: tip NOTE
Notice how we are searching through the list `loop→events` to see if `*curr_event` is present in it. This is because, a previous event that we have processed in the for loop could have resulted in a connection instance getting destroyed. Since the `loop→epoll_events` was populated when that connection instance was available, we have to keep checking `loop→events` after processing each event to see if it is still present or has been set to `NULL` on destruction.

🟡 explain the scenario where it can happen
:::

---

### Milestone #1

Quick recap:

- We have completed the implementation of `xps_loop` module with all its necessary functions

We will be creating a loop instance within the `xps_core_create()` function. There is a one to one mapping between loop and core instances. Each core instance has a loop instance and a loop instance belongs to one particular core instance. Currently we will create one _(core, loop)_ instance pair only. In later stages when implementing multithreaded form of eXpServer we will create multiple _(core, loop)_ instance pairs.

With that, lets move onto implementing the `xps_core` module.

---

### `xps_core` Module

`xps_core` is a module which is the container of all data related to eXpServer. An instance of `xps_core` can be thought of as an instance of eXpServer itself. We design other modules such as `xps_listener`, `xps_connection` etc. in such a way that it will directly or indirectly be attached to an `xps_core` instance. Hence destroying core instance will result in destruction of all associated instances attached to it. We will get more clarity after looking at the declarations in `xps_core.h`.

#### `xps_core.h`

The code below has the contents of the header file for `xps_core`. Have a look at it and make a copy of it in your codebase.

::: details **expserver/src/core/xps_core.h**

```c
#ifndef XPS_CORE_H
#define XPS_CORE_H

#include "../xps.h"

struct xps_core_s {
  xps_loop_t *loop;
  vec_void_t listeners;
  vec_void_t connections;
  u_int n_null_listeners;
  u_int n_null_connections;
};

xps_core_t *xps_core_create();
void xps_core_destroy(xps_core_t *core);
void xps_core_start(xps_core_t *core);

#endif
```

:::

`struct xps_core_s` acts as a wrapper for all data related to a core instance. Below are the members of the struct:

- `xps_loop_t *loop`: Pointer to loop instance associated to the core
- `vec_void_t listeners`: List of all the listener instances attached to the core
- `vec_void_t connections`: List of all the connection instances created by the listeners
- `u_int n_null_listeners`: Number of pointers in listener instances set to `NULL`
- `u_int n_null_connections`: Number of pointers in connection instances set to `NULL`

::: tip NOTE
`n_null_listeners` and `n_null_connections` are number of pointers in their respective lists set to `NULL` as mentioned in Stage 6. When the values of these variables go above `DEFAULT_NULLS_THRESH` from `xps.h`, we will clear all the `NULL` pointers from the lists within `xps_loop_run()` function. This `NULL` filtering will be done in a later stage.
:::

---

#### `xps_core.c`

**xps_core_create()**

Core comes with its own set of _create_ and _destroy_ functions. `xps_core_create()` allocates memory for the core instance, creates a loop instance using `xps_loop_create()` and initializes all the values for the core object.

::: details **expserver/src/core/xps_core.c**

```c
xps_core_t *xps_core_create() {

  xps_core_t *core = /* allocate memory using malloc() */
  /* handle error where core == NULL */

  xps_loop_t *loop = /* create xps_loop instance */
  /* handle error where loop == NULL */

  // Init values
  core->loop = /* fill this */
  vec_init(&(core->listeners));
  /* initialize core->connections */
  core->n_null_listeners = 0;
  /* initialize core->n_null_connections */

  logger(LOG_DEBUG, "xps_core_create()", "created core");

  return core;
}
```

:::

**xps_core_destroy()**

When a core is destroyed, our current implementation of eXpServer essentially goes down as we only have one core instance. Therefore, the destroy function of the core should destroy all listener and connection instances attached to the core, destroy the loop instance, and deallocate memory for the core instance itself.

::: details **expserver/src/core/xps_core.c**

```c
void xps_core_destroy(xps_core_t *core) {
  assert(core != NULL);

  // Destroy connections
  for (int i = 0; i < core->connections.length; i++) {
    xps_connection_t *connection = core->connections.data[i];
    if (connection != NULL)
      xps_connection_destroy(connection); // modification of xps_connection_destroy() will be look at later
  }
  vec_deinit(&(core->connections));

  /* destory all the listeners and de-initialize core->listeners */

  /* destory loop attached to core */

  /* free core instance */

  logger(LOG_DEBUG, "xps_core_destroy()", "destroyed core");
}
```

:::

**xps_core_start()**

As we saw in the `main()` function in `main.c`, we need a function to start the core. ‘Starting’ the core involves creating the listeners and running the event loop. From there the loop will take care of all the event handling.

::: details **expserver/src/core/xps_core.c**

```c
void xps_core_start(xps_core_t *core) {

  /* validate params */

  logger(LOG_DEBUG, "xps_start()", "starting core");

  /* create listeners from port 8001 to 8004 */

  /* run loop instance using xps_loop_run() */

}
```

:::

---

### Changes to `xps_listener` & `xps_connection`

In stage 6, the flow was as follows:

- We create a listener using `xps_listener_create()`, called by `main.c` and attach it the new listener instance to the loop to monitor for events.
- When the loop notifies us for events, the event could be from a listener (client trying to establish connection to the server) or from a connection (read event from a connected client).
- We determine if an event is from a listener or a connection with the help `sock_fd` and the list of listeners and connections we maintained.
  - If the event is from a listener, `xps_listener_connection_handler()` function is called. This function is defined in `xps_listener.c`.
  - If the event is from a connection, `xps_connection_read_handler()` function is called. This function is defined in `xps_connection.c`.

But as we mentioned before, everything is connected to the core. This includes the listeners and the connections.

To accommodate for this, `xps_listener_s` and `xps_connection_s` will have a pointer to core instance in it.

::: details **expserver/src/network/xps_listener.h**

```c
#ifndef XPS_LISTENER_H
#define XPS_LISTENER_H

#include "../xps.h"

struct xps_listener_s {
  int epoll_fd; // [!code --]
  xps_core_t *core; // [!code ++]
  const char *host;
  u_int port;
  u_int sock_fd;
};

xps_listener_t *xps_listener_create(int epoll_fd, const char *host, u_int port); // [!code --]
xps_listener_t *xps_listener_create(xps_core_t *core, const char *host, u_int port); // [!code ++]
void xps_listener_destroy(xps_listener_t *listener);
void xps_listener_connection_handler(xps_listener_t *listener); // [!code --]

#endif
```

:::

::: details **expserver/src/network/xps_connection.h**

```c
#ifndef XPS_CONNECTION_H
#define XPS_CONNECTION_H

#include "../xps.h"

struct xps_connection_s {
  int epoll_fd; // [!code --]
  xps_core_t *core; // [!code ++]
  u_int sock_fd;
  xps_listener_t *listener;
  char *remote_ip;
};

xps_connection_t *xps_connection_create(int epoll_fd, int sock_fd); // [!code --]
xps_connection_t *xps_connection_create(xps_core_t *core, u_int sock_fd);// [!code ++]
void xps_connection_destroy(xps_connection_t *connection);
void xps_connection_read_handler(xps_connection_t *connection); // [!code --]

#endif
```

:::

With the introduction of the core instance, functions associated with the listener and connections also changes, as indicated by the `.h` files.

When we create a listener and a connection, we have to do two things now:

- If it is listener instance:
  - Assign the core instance to the listener (`listener→core`)
  - Add it to the list of listeners in core (`core→listeners`)
- If it is a connection instance:
  - Assign the core instance to the connection (`connection→core`)
  - Add it to the list of connections in core (`core→connections`)

Another major change is seen in how/who calls the [callback functions](<https://en.wikipedia.org/wiki/Callback_(computer_programming)>) when an event occurs on either the listener or the connection sockets. Previously, the `xps_loop_run()` calls the appropriate functions depending on whether `sock_fd` belongs to a listener or a connection.

Now we pass the callback functions and pointer to the instance when calling `xps_loop_attach()`.

:::tip NOTE
We have renamed `xps_listener_connection_handler` to `listener_connection_handler` and `xps_connection_read_handler` to `connection_read_handler` as these two functions are no longer global.
:::

In the case of `xps_listener`:

::: details **expserver/src/network/xps_listener.c**

```c
// Function declaration for read callback of listener
void listener_connection_handler(void *ptr); // [!code ++]

// Other functions

xps_listener_t *xps_listener_create(...) {
  ...

  // Replace old xps_loop_attach with modified one
  xps_loop_attach(epoll_fd, sock_fd, EPOLLIN); // [!code --]
  xps_loop_attach(core->loop, sock_fd, EPOLLIN, listener, listener_connection_handler); // [!code ++]

  ...
}

/* modify xps_listener_destory() */

xps_listener_connection_handler(xps_listener_t *listener) { ... } // [!code --]
// Function definition for read callback for listener
void listener_connection_handler(void *ptr) { // [!code ++]
  assert(ptr != NULL); // [!code ++]
  xps_listener_t *listener = ptr; // [!code ++]

  /* same code logic from xps_listener_connection_handler() */

}
```

:::

::: details **expserver/src/network/xps_connection.c**

```c
// Function declaration for read callback of listener
void connection_loop_read_handler(void *ptr); // [!code ++]

// Other functions

xps_connection_t *xps_connection_create(...) {
  ...

  // Replace old xps_loop_attach with modified one
  xps_loop_attach(epoll_fd, sock_fd, EPOLLIN); // [!code --]
  xps_loop_attach(core->loop, sock_fd, EPOLLIN, connection, connection_loop_read_handler); // [!code ++]

  ...
}

/* modify xps_connection_destory() */

xps_connection_read_handler(...) { ... } // [!code --]
// Function definition for read callback for connection
void connection_loop_read_handler(void *ptr) { // [!code ++]
  assert(ptr != NULL); // [!code ++]
  xps_connection_t *connection = ptr; // [!code ++]

  /* same code from xps_connection_read_hadnler() */

}

```

:::

### `main.c` Continued

With the modules in place, implementation of `main.c` is straight forward.

When operating eXpServer, a common method to terminate the program is by pressing `Ctrl + C` on the keyboard. This action triggers a [signal](https://en.wikipedia.org/wiki/C_signal_handling) named `SIGINT` from the operating system, prompting the program to shutdown within the terminal.

We need a way to know when `Ctrl + C` is pressed so that we do a graceful shutdown by destroying the core instance which will inturn destroy all other instances. This is possible with the help of the [`signal()`](https://man7.org/linux/man-pages/man2/signal.2.html) function provided by `signal.h` header.

We pass a handler function (`signal_handler`) to the signal function, that will be called when the program receives a `SIGINT`.

When an interrupt signal is received, the program control will transfer to the handler function, causing the control flow to exit the event loop. Within `sigint_handler()`, the core is destroyed, resulting in the termination of all associated instances before exiting the process.

::: details **expserver/src/main.c**

```c
#include "xps.h"

xps_core_t *core;

void sigint_handler(int signum);

int main() {
  signal(SIGINT, sigint_handler);

  core = /* create core instane */

  /* 'start' core instance */

}

void sigint_handler(int signum) {
  logger(LOG_WARNING, "sigint_handler()", "SIGINT received");

  xps_core_destroy(core);

  exit(EXIT_SUCCESS);
}
```

:::

---

### Milestone #2

Time to test the code!

Since we did not modify the functionality of the server, this milestone will is similar to [Milestone #2 from Stage 6](/roadmap/phase-1/stage-6#milestone-2). Follow the same steps and make sure you get the same result.

## Experiment

### Experiment #1

- Create a C file `sender.c` with the following contents
  ::: details **expserver/sender.c**

  ```c
  #include <arpa/inet.h>
  #include <netdb.h>
  #include <netinet/in.h>
  #include <stdio.h>
  #include <string.h>
  #include <sys/socket.h>
  #include <sys/types.h>
  #include <unistd.h>

  #define PORT 8001
  #define BUFFER_SIZE 1024

  int main() {
  int sock = 0;
  struct sockaddr_in serv_addr;
  char buffer[BUFFER_SIZE] = {0};
  char input[BUFFER_SIZE];

  if ((sock = socket(AF_INET, SOCK_STREAM, 0)) < 0) {
  perror("Socket creation error");
  return -1;
  }

  serv_addr.sin_family = AF_INET;
  serv_addr.sin_port = htons(PORT);

  if (inet_pton(AF_INET, "127.0.0.1", &serv_addr.sin_addr) <= 0) {
  perror("Invalid address/ Address not supported");
  return -1;
  }

  if (connect(sock, (struct sockaddr *)&serv_addr, sizeof(serv_addr)) < 0) {
  perror("Connection failed");
  return -1;
  }

  while (1) {
  printf("Enter message to send: ");
  fgets(input, BUFFER_SIZE, stdin);

      // Send message to the server
      int send_result = send(sock, input, strlen(input), 0);
      if (send_result == -1)
        perror("Send failed");
      else
        printf("Message sent to server\n");

  }

  close(sock);
  return 0;
  }
  ```

  :::

- `sender.c` will connect to `localhost:8001`. It will then read from `stdin` and send it to the server listening on port `8001`. However, `sender.c` will not `recv()` any data.
- Build and run eXpServer in one terminal. It should be listening on ports 8001 to 8004.
- Compile `sender.c` using the command
  ```bash
  gcc sender.c -o sender
  ```
- Now run sender using the command `./sender`. Enter inputs into the `sender` and make sure they are getting printed in eXpServer.
  ![experiment1-1.png](/assets/stage-7/experiment1-1.png)
- Now open a _netcat_ client and connection to port 8002 in eXpServer. Then send some messages. It should work as expected.
  ![experiment1-2.png](/assets/stage-7/experiment1-2.png)
- Close the running `sender`. Now `cat` a big file (in the order of 5MB) and pipe it to `./sender` using the following command
  ```bash
  cat huge_file.dat | ./sender
  ```
  This should send a huge file to eXpServer and print a lot of random characters (binary data of the file) on the eXpServer terminal.
  ![experiment1-3.png](/assets/stage-7/experiment1-3.png)
- You should be able to notice that after a while the printing of random characters stops which neither the `sender` or eXpServer quitting.
- Now try to connect a _netcat_ TCP client like before and send a message.
  ![experiment1-4.png](/assets/stage-7/experiment1-4.png)
- You should be able to notice that the _netcat_ client did not receive a response back. And the eXpServer terminal did not print a INFO log that says a new connection was accepted.

**What is going on here?**

The `sender` only sends data to eXpServer. It does not `recv()` data. Thus, when eXpServer is trying to send the reversed string back, it is not getting received. This will cause the kernel buffer to fill up. When the kernel buffer is full, the call to `send()` will block the process as we are dealing with blocking network sockets. The process is blocked till the data in the kernel buffer is cleared. However this will not happen as `sender` does not receive any data. Thus the eXpServer process will block leading to no more connections being served.

In a real life situation where the rate at which eXpServer is writing to a TCP socket is more than the rate at which data is received by the TCP client, the kernel buffer can fill up resulting in the server process being blocked intermittently. This leads to inefficient serving of connections.

- Now quit the `sender` process. You should be able to see that eXpServer unblocked and served the connection from _netcat_ client.
  ![experiment1-5.png](/assets/stage-7/experiment1-5.png)

## Conclusion

- In this stage we created the `xps_loop` and `xps_core` modules.
- By doing Experiment #1 we found that blocking sockets causes inefficient connection handling.

In the next stage we will use network sockets in non-blocking mode to mitigate problem of eXpServer process being blocked.
