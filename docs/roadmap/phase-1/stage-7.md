# Stage 7: Core & Loop Modules

## Recap

- We created server and client modules

## Introduction

In this stage, we will be modularizing the code further by creating two new modules:

1. Core module
2. Loop module

The core module, as its name implies, will act as the central hub of the server, where all components will be connected to, including the loop. The `main()` function in `main.c` will create an instance of core and subsequently ‘start’ it. The core should take care of everything else from that point onwards.

You can probably predict what the loop module will contain.

New modules comes with new structures, thus `xps_core_s` and `xps_loop_s` have been added to core and loop header files.

```c
// From xps_core.h
struct xps_core_s {
  xps_loop_t *loop;
  vec_void_t servers;
};

// From xps_loop.h
struct xps_loop_s {
  int epoll_fd;
  struct epoll_event events[MAX_EPOLL_EVENTS];
  vec_void_t handles;
};
```

### File structure

![filestructure.png](/assets/stage-6/filestructure.png)

Find below the updated `xps.h` file. New additions to the file are indicated in green:

- expserver/xps.h

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

  typedef enum { // [!code ++]
    HANDLE_TCP_CLIENT, // [!code ++]
    HANDLE_TCP_SERVER, // [!code ++]
  } xps_loop_handle_type_t; // [!code ++]

  struct xps_buffer_s;
  struct xps_socket_s;
  struct xps_server_s;
  struct xps_client_s;
  struct xps_core_s; // [!code ++]
  struct xps_loop_s; // [!code ++]
  struct xps_loop_handle_s; // [!code ++]

  typedef struct xps_buffer_s xps_buffer_t;
  typedef struct xps_socket_s xps_socket_t;
  typedef struct xps_server_s xps_server_t;
  typedef struct xps_client_s xps_client_t;
  typedef struct xps_core_s xps_core_t; // [!code ++]
  typedef struct xps_loop_s xps_loop_t; // [!code ++]
  typedef struct xps_loop_handle_s xps_loop_handle_t; // [!code ++]

  typedef void (*xps_server_connection_handler_t)(xps_server_t *server, int status);
  typedef void (*xps_client_read_handler_t)(xps_client_t *client, int status);

  #endif
  ```

> ::: tip NOTE
> You are free to modify the code in any file you want, including the `xps.h` file. The documentation is just a here to guide and nudge you in the right direction and not restrict you in any way. Feel free to add new functions, global variables, constants, structs. Just make sure you retain the content you write when you are copying code snippets like above.
> :::

## Implementation

Let’s have a clear picture before we move forward with the code.

<!-- ![core.png](/assets/stage-6/core.png) -->

- The main function will create an instance of a core, and start it by providing the number of listening sockets.
- The core will be responsible for spinning up the servers and starting the loop.
- The loop module will contain the epoll, and have functions related to creating and destroying the loop instance, starting it, attaching and detaching events to loop, handling the events, etc.
- **A loop belongs to a core.** So when we create a loop instance, attach it to the core instance.

> ::: tip NOTE
> Each server instance will have its own listening socket. We know that we can spin up multiple servers, i.e. multiple listen sockets. From now onwards, these collection of servers running on different ports will be collectively called the **server**.
> :::

Let’s start with the loop module and move onto the core module.

### `xps_loop.h & xps_loop.c`

Recall in the last stage, we had code related to the epoll in the `main.c` file. Let’s make a module for it now.

The code below has the contents of the header file for `xps_loop`. Have a look at it and make a copy of it in your codebase.

- expserver/core/xps_loop.h

  ```c
  #ifndef XPS_LOOP_H
  #define XPS_LOOP_H

  #include <sys/epoll.h>

  #include "../lib/vec/vec.h"
  #include "../xps.h"

  struct xps_loop_handle_s {
    int fd;
    void *item;
    xps_loop_handle_type_t type;
  };

  struct xps_loop_s {
    int epoll_fd;
    struct epoll_event events[MAX_EPOLL_EVENTS];
    vec_void_t handles;
  };

  xps_loop_t *xps_loop_create();
  void xps_loop_destroy(xps_loop_t *loop);
  int xps_loop_attach(xps_loop_t *loop, xps_loop_handle_type_t type, void *item);
  int xps_loop_detach(xps_loop_t *loop, xps_loop_handle_type_t type, int fd);
  void xps_loop_run(xps_loop_t *loop);

  #endif
  ```

Did you notice something new in `xps_loop_s` i.e. `vec_void_t handles`?

```c
struct xps_loop_s {
  int epoll_fd;
  struct epoll_event events[MAX_EPOLL_EVENTS];
  vec_void_t handles; // [!code focus]
};
```

Think of a **handle** as a wrapper around a file descriptor associated with a particular resource (TCP client or TCP server). It provides a convenient way to manage and interact with these resources within the event loop.

Each handle is an object of `struct xps_loop_handle_s`.

```c
struct xps_loop_handle_s {
  int fd;
  void *item;
  xps_loop_handle_type_t type;
};

typedef enum {
  HANDLE_TCP_CLIENT,
  HANDLE_TCP_SERVER,
} xps_loop_handle_type_t;
```

Each handle can be associated with either a TCP client or a TCP server, as mentioned before. But how do we figure out which one of them the handle represents? `xps_loop_handle_type_t type` is utilized for this purpose. `void *item` is a pointer to an instance of `xps_server_t` or `xps_client_t`, depending on what the handle is created for.

So instead of using objects of `xps_server_t` and `xps_client_t`, we will use `xps_loop_handle_s`. We can typecast `void *item` member in the object of `xps_loop_handle_s` to `xps_server_t` or `xps_client_t` depending on `xps_loop_handle_type_t type`.

With this information, try to fill out the create and destroy functions associated with handles. The **function signatures** are given below.

> ::: tip NOTE
> A function signature outlines the essential details of a function including its name, parameters, return type, and a brief description of its purpose. This signature serves as a reference for how the function should be called and what it does, without detailing the implementation. You will be seeing a lot of these from now onwards.
> :::

- expserver/core/xps_loop.c

  ```c
  /**
   * @brief Creates a handle for the given file descriptor, handle type, and item.
   *
   * This function creates a handle for the specified file descriptor, handle type, and item.
   *
   * @param fd The file descriptor.
   * @param type The type of the handle.
   * @param item Pointer to the item associated with the handle.
   * @return Pointer to the created handle, or NULL if an error occurs.
   */
  xps_loop_handle_t *xps_handle_create(int fd, xps_loop_handle_type_t type, void *item) {

  	// Alloc memory for handle instance
    xps_loop_handle_t *handle = (xps_loop_handle_t *)malloc(sizeof(xps_loop_handle_t));
    if (handle == NULL) {
      logger(LOG_ERROR, "xps_handle_create()",
             "failed to alloc memory for handle. malloc() returned NULL");
      return NULL;
    }

    /* assign values to handle */

    logger(LOG_DEBUG, "xps_handle_create()", "created handle");

    return handle;

  }

  /**
   * @brief Destroys a handle.
   *
   * This function destroys the handle and frees the memory associated with it.
   *
   * @param handle Pointer to the handle to be destroyed.
   */
  void xps_handle_destroy(xps_loop_handle_t *handle) {
    ...
  }
  ```

> ::: warning
> Don’t forget to handle params and other errors!
> :::

Let’s move onto loop functions. Previously, our `loop_create()` function in Stage 5 was as simple as returning a new epoll instance. The function becomes a bit more sophisticated with the introduction of the `xps_loop_s` structure.

The new `xps_loop_create()` function should create an object of `xps_loop_s` (`xps_loop_t *loop`), attach a new epoll instance and return the object.

- expserver/core/xps_loop.c
  ```c
  /**
   * @brief Creates a new event loop.
   *
   * This function creates a new event loop and initializes its epoll instance.
   *
   * @return xps_loop_t* Pointer to the created event loop, or NULL if an error occurs.
   */
  xps_loop_t *xps_loop_create() {
  	...
  }
  ```

> ::: tip
> Use `vec_init(&(loop->handles))` for memory allocation.
> :::

The `xps_loop_destroy()` function frees up memory from the loop object. It clears the memory taken by the handles by iterating through all the handles in the loop object, and destroying them with the help of `xps_handle_destroy()`.

- expserver/core/xps_loop.c
  ```c
  /**
   * @brief Destroys an event loop.
   *
   * This function destroys the specified event loop and releases all associated resources.
   *
   * @param loop Pointer to the event loop to destroy.
   */
  void xps_loop_destroy(xps_loop_t *loop) {
  	...
  }
  ```

> ::: tip
> Use `vec_deinit(&(loop->handles))` to deallocate memory.
> :::

Now that we've established the ability to create a loop, let's proceed to implement the functions for attaching and detaching items from the loop. We'll define `xps_loop_attach()` and `xps_loop_detach()` for this purpose.

`xps_loop_attach()` takes in a parameter `void *item`. This object could be an instance of client or server; typecast it to `xps_client_t` or `xps_server_t` depending on the `type` parameter. This will allow you to access the FD in it. After you get the FD, you can create a handle using `xps_handle_create()` and add it to list of handles in loop.

- expserver/core/xps_loop.c

  ```c
  /**
   * @brief Attaches an item to the event loop.
   *
   * This function attaches the specified item to the event loop based on its type.
   *
   * @param loop Pointer to the event loop.
   * @param type Type of the handle.
   * @param item Pointer to the item to attach.
   * @return int E_FAIL if an error occurs, OK otherwise.
   */
  int xps_loop_attach(xps_loop_t *loop, xps_loop_handle_type_t type, void *item) {

  	/* handle params */

  	int fd = -1;

  	if (type == HANDLE_TCP_CLIENT) {
      xps_client_t *client = (xps_client_t *)item;
      fd = client->sock->fd;
    }

    else if (/* TCP server */) {
  	  /* fill this */
  	}

  	xps_loop_handle_t *handle = /* create handle */

  	// Add socket to epoll
  	struct epoll_event event;
    event.events = /* fill this */
    event.data.fd = /* fill this */
    event.data.ptr = (void *)handle;

    /* attach event to epoll using epoll_ctl() */

    vec_push(&(loop->handles), (void *)handle);

    logger(LOG_DEBUG, "xps_loop_attach()", "attached item to loop");

    return OK;

  }
  ```

`xps_loop_detach()` takes in a FD that has to be detached from the loop. There are three things to do in `xps_loop_detach()` function:

- Find the handle to be deleted from the list of handles in the loop and set it to NULL
- Destroy the handle using `xps_handle_destroy()`
- Remove FD from the epoll

Doing the first two will remove the handle from everywhere.

- expserver/core/xps_loop.c

  ```c
  /**
   * @brief Detaches an item from the event loop.
   *
   * This function detaches an item with the specified file descriptor from the event loop.
   *
   * @param loop Pointer to the event loop.
   * @param type Type of the handle.
   * @param fd File descriptor of the item to detach.
   * @return int E_FAIL if an error occurs, OK otherwise.
   */
  int xps_loop_detach(xps_loop_t *loop, xps_loop_handle_type_t type, int fd) {

  	/* handle params */

  	vec_void_t *handles = &(loop->handles);

    int handle_index = -1;
    for (/* iterate through all the handles */) {
      xps_loop_handle_t *handle = (xps_loop_handle_t *)((*handles).data[i]);
      /* fill this */
    }

    // Setting NULL in handles list
    (*handles).data[handle_index] = NULL;

    xps_loop_handle_t *handle = (xps_loop_handle_t *)((*handles).data[handle_index]);

    /* destroy handle using xps_handle_destroy() */

    /* remove fd from epoll */

    logger(LOG_DEBUG, "xps_loop_detach()", "detached item from loop");

    return OK;

  }
  ```

Time to start the loop and handle the events. As we’ve done this multiple, you would be aware of what `xps_loop_run()` is responsible for. Refer to the previous stages if you want a recap.

In Stage 5, determining whether an FD belongs to a server or client used to require iterating through all servers and clients. However, with handles, our task has significantly simplified.

- expserver/core/xps_loop.c

  ```c
  /**
   * @brief Runs the event loop.
   *
   * This function runs the event loop and handles the events on it continuously
   *
   * @param loop Pointer to the event loop to run.
   */
   void xps_loop_run(xps_loop_t *loop) {

  	 /* handle params */

  	 while (loop) {

  		 /* epoll wait */

  		 for(/* loop through epoll events */) {

  			 struct epoll_event curr_event = loop->events[i];

  			 xps_loop_handle_t *curr_handle = (xps_loop_handle_t *)curr_event.data.ptr;

  			 /* check if handle still exists */

  			 if(/* handle is of client type */) {
  				 /* fill this */
  			 }
  			 else if(/* handle if of server type */) {
  				 /* fill this */
  			 }

  		 }

   }
  ```

Explain why the handle might not exist

> ::: tip
> Use `vec_filter_null(&(loop->handles))` to remove all the handles that were converted to NULL during `xps_loop_detach()`.
> :::

---

### Milestone #1

Recap:

- ***

Core being the most important module, will keep changing as we build more modules to eXpServer.

The `main()` function in the`main.c` file will create an instance of core with `xps_core_create()` and start it using `xps_core_start()`. From there, the core takes over. The `xps_core_start()` takes in the core instance and also the ports for the listening sockets for the server.

### `xps_core.h & xps_core.c`

With the ports it receives, create server instances with the `xps_server_create()` function. Don’t forget to add the servers to the core’s list of servers. Start the loop using `xps_loop_run()` at the end.

- expserver/core/xps_core.c
  ```c
  /**
   * @brief Starts the XPS core.
   *
   * This function starts the XPS core by creating servers for the specified ports and running the
   * event loop.
   *
   * @param core Pointer to the XPS core.
   * @param ports Array of port numbers to listen on.
   * @param n_ports Number of ports in the array.
   */
  void xps_core_start(xps_core_t *core, int *ports, int n_ports) {
  	...
  }
  ```

But wait. We didn’t create the loop anywhere yet. And the core too. Let’s do that in `xps_core_create()`. Make use of `xps_loop_create()` for creating the loop. Attach the loop to the core instance.

While you are at it, finish the `xps_core_destroy()` function, which destroys all the servers and loop associated with the core.

- expserver/core/xps_core.c

  ```c
  /**
   * @brief Creates a new XPS core instance.
   *
   * This function creates a new XPS core instance and initializes its event loop.
   *
   * @return Pointer to the created XPS core, or NULL if an error occurs.
   */
  xps_core_t *xps_core_create() {
  	...
  }

  /**
   * @brief Destroys an XPS core instance.
   *
   * This function destroys the specified XPS core instance and releases all associated resources.
   *
   * @param core Pointer to the XPS core to destroy.
   */
  void xps_core_destroy(xps_core_t *core) {
  	...
  }
  ```

> ::: warning
> There will be some changes to the server and client module to take core into account. We will work on them after we are done with `xps_core`.
> :::

> ::: danger QUESTION
> We used `xps_server_connection_handler()` to handle a new client connection and `xps_client_read_handler()` when there is data available to read. Would there be any changes to these?
> :::

### `xps_server.c & xps_client.c`

## Conclusion
