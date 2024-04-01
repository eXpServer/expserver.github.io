# Stage 6: Core & Loop Modules

## Recap

- We created server and client modules

## Introduction

If you observe, we still have a lot of code in our `main.c` file. This is not ideal. In this stage, we will be modularizing the code even further by creating two new modules:

1. Core module
2. Loop module

You can probably predict what the loop module will contain. But core is something we have not heard of before.

The core module, as its name implies, serves as the central hub of the server, where all components will be connected to, including the loop. The `main()` function in `main.c` will create an instance of core and subsequently ‘start’ it. The core takes care of everything else from that point onwards.

Have a look at the `xps_core_s` and `xps_loop_s` structures.

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

The core contains an instance of the loop, and a list of servers. The loop instance stores the epoll file descriptor, a struct to store its events and list of handles attached to it. We’ll see what handles as we go further.

### File structure

![filestructure.png](/assets/stage-6/filestructure.png)

Get the `xps_utils` files from [here](/guides/references/xps_utils). Create appropriate files and place it in `expserver/utils`.

### Changes from previous stage

- `xps_server.h`
  - `xps_server_s` will have an instance of `xps_core_t *core`
  - `xps_server_create()` function takes in `xps_core_t *core` as a parameter
- `xps_client.h`
  - `xps_client_s` will have an instance of `xps_core_t *core`
  - `xps_client_create()` function takes in `xps_core_t *core` as a parameter
- `xps.h`

  - Has new structs and typedefs needed for this stage. Find the updated file below:
  - `expserver/xps.h`

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

    typedef enum {
      HANDLE_TCP_CLIENT,
      HANDLE_TCP_SERVER,
    } xps_loop_handle_type_t;

    struct xps_buffer_s;
    struct xps_socket_s;
    struct xps_server_s;
    struct xps_client_s;
    struct xps_core_s;
    struct xps_loop_s;
    struct xps_loop_handle_s;

    typedef struct xps_buffer_s xps_buffer_t;
    typedef struct xps_socket_s xps_socket_t;
    typedef struct xps_server_s xps_server_t;
    typedef struct xps_client_s xps_client_t;
    typedef struct xps_core_s xps_core_t;
    typedef struct xps_loop_s xps_loop_t;
    typedef struct xps_loop_handle_s xps_loop_handle_t;

    typedef void (*xps_server_connection_handler_t)(xps_server_t *server, int status);
    typedef void (*xps_client_read_handler_t)(xps_client_t *client, int status);

    #endif
    ```

## Implementation

Let’s have a clear picture before we move forward with the code.

![stage-6-core.png](/assets/stage-6/core.png)

- The main function will create a core instance and start the core, by providing it the number of ports the server wants to have.
- The core will be responsible for spinning up the servers starting the loop.
- The loop module will be the epoll, and have functions related to attaching and detaching events to loop, handling the events, etc.

Let’s modify some code that we wrote in the previous stages first before we move onto core and loop.

### `xps_server.c`

The `xps_server_create()` function now takes an additional parameter `xps_core_t *core`.

```c
xps_server_t *xps_server_create(xps_core_t *core, int port, xps_server_connection_handler_t connection_cb);
```

This parameter represents the core of the server. Assign the server’s core property (`server→core`) to the core parameter passed to the function.

In the previous stage, we attached the server to the loop in the main function after creating the server using `xps_server_create()`. Since we’ll be writing a separate loop module now, we will have a function `xps_loop_attach()` for this purpose and we can use that here to attach the created server to the loop.

Don’t forget about the destroy function! Detach the server from loop with `xps_loop_detach()` (we will be writing this later in the loop module). On top of that, set NULL in servers list of core.

### `xps_client.c`

Similar to the above, modify the `xps_client_create()` and `xps_client_destroy()` functions taking core into consideration.

---

### `xps_loop.h & xps_loop.c`

Recall in the last stage, we had code related to the epoll in the `main.c` file. It’s time to modularize that now and make a loop module.

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

Did you notice a new member in `xps_loop_s` i.e. `vec_void_t handles`?

```c
struct xps_loop_s {
  int epoll_fd;
  struct epoll_event events[MAX_EPOLL_EVENTS];
  vec_void_t handles; ****// [!code focus]
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

Each handle can be associated with either a TCP client or a TCP server. `xps_loop_handle_type_t type` is utilized for this purpose. `void *item` is a pointer to an object of `xps_server_t` or `xps_client_t`, depending on what the handle is created for.

Fill out the create and destroy functions associated with handles. The **function signatures** are given below.

> ::: tip NOTE
> A function signature outlines the essential details of a function including its name, parameters, return type, and a brief description of its purpose. This signature serves as a reference for how the function should be called and what it does, without detailing the implementation.
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

  	/* validate params */

  	// Alloc memory for handle instance
    xps_loop_handle_t *handle = (xps_loop_handle_t *)malloc(sizeof(xps_loop_handle_t));
    if (handle == NULL) {
      logger(LOG_ERROR, "xps_handle_create()",
             "failed to alloc memory for handle. malloc() returned NULL");
      return NULL;
    }

    handle->fd = fd;
    handle->item = item;
    handle->type = type;

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

Previously, our `loop_create()` function in Stage 5 was as simple as returning a new epoll instance. The function becomes a bit more sophisticated with the introduction of the `xps_loop_s` structure.

So the `xps_loop_create()` should create an object of `xps_loop_s` (`xps_loop_t *loop`), attach a new epoll instance and return the object.

> ::: tip
> Use `vec_init(&(loop->handles))` for memory allocation.
> :::

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

The `xps_loop_destroy()` function frees up memory from the loop object. It clears the memory taken by the handles by iterating through all the handles in the loop object, and destroying them with the help of `xps_handle_destroy()`.

> ::: tip
> Use `vec_deinit(&(loop->handles))` to deallocate memory.
> :::

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

Now that we can create a loop, lets create the functions to attach, `xps_loop_attach()`, and detach, `xps_loop_detach()`, items from the loop.

Since item of type `void`, typecast it to `xps_client_t` or `xps_server_t` depending on `type`. This will allow you to get the FD from it. Create a handle using `xps_handle_create()` and add it to list of handles in loop.

The detach function should destroy the handle using the `xps_handle_destroy()` function. Find the handle to delete from the list of handles in the loop. Set the handle in the handles list to NULL.

Doing this both will remove the handle from everywhere. All that's left is to remove the FD from the epoll.

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
  	...
  }

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
  	...
  }
  ```

> ::: tip NOTE
> While adding the epoll event to the loop, use `event.data.ptr` to point to the handle. This will help when we are handling the events in epoll.
> :::

In the previous stage, we had a `loop_run()` function that did the `epoll_wait()` and handled the events. Let’s rename it to`xps_loop_run()` and modify its code a bit to accommodate for the changes in the architecture.

The function `xps_loop_run()` orchestrates the event loop, initiating a continuous loop operation. It waits for events on epoll and handles events accordingly.

Handling the epoll events

> ::: warning
> while handling events, make sure handle still exists in the list of handles in loop
> :::

If the handle is a client handle, call the `xps_client_loop_read_handler()` function and if it is a server handle, call the `xps_server_loop_read_handler()` function.

- expserver/core/xps_loop.c
  ```c
  /**
   * @brief Runs the event loop for the given loop instance.
   *
   * This function continuously waits for events using epoll and handles them accordingly.
   *
   * @param loop Pointer to the loop instance.
   */
  void xps_loop_run(xps_loop_t *loop) {
  	...
  }
  ```

> ::: tip
> Use `vec_filter_null(&(loop->handles))` to remove all the handles that were converted to NULL during `xps_loop_detach()`.
> :::

---

### Milestone #1

---

### `xps_core.h & xps_core.c`

Lets start with `xps_core_create()` and `xps_core_destory()`. Take a look at the `xps_core_s` mentioned above or in the `xps_core.h` file as it’ll come in handy.

```c
xps_core_t *xps_core_create() {

	xps_core_t *core = /* allocate memory for core */

	xps_loop_t *loop = /* create an instance of loop using xps_loop_create() */

	/* assign values */

	return core;

}

void xps_core_destroy(xps_core_t *core) {

  /* loop through the servers and destroy them using xps_server_destroy() */

  /* destory loop using xps_loop_destroy() */

  /* free core */

}
```

### Milestone #2

## Conclusion
