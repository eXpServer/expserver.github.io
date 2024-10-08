# Stage 10: Pipe Module

## Recap

- In the last stage we started using epoll in edge triggered mode to handle the CPU utilization problem.

## Learning Objectives

- Use pipes for data transmission between source and destination, hence reducing the memory usage.

## Introduction

 In the previous stage, we implemented an edge-triggered epoll which ensures  optimal CPU utilization by triggering notifications only when the state of the file descriptor changes. Thus the issue mentioned in Experiment #1 of Stage 8 is resolved. However, the problem of high memory usage still persists.

Reason for high memory usage is as follows:

- The data only being send by the server and not receiving at the other end by the client leads to the kernel buffering this data into its internal buffer.
- Kernel buffer has a limited size and once its full, the data gets filled up in the user - space buffer
- Since there is no size limit for the `write_buff_list`, data gets accumulated in this user-space buffer which eventually leads to higher memory utilization

The solution to this problem is assigning a maximum threshold for the `write_buff_list` size. By enforcing a limit on the buffer size, the uncontrolled accumulation of data in memory is prevented. Once the buffer is full, the sender won't be able to write any more data unless some of the data is received by the recipient.

In the above scenario, **pipes** play a crucial role in managing the flow of data between the incoming stream (data being read from the socket) and the outgoing stream (data being written back to the socket).

- Pipes act as an intermediary between the **source** (which reads data from the socket) and the **sink** (which writes data back to the socket).
- Data read from the socket is stored in a pipe’s buffer (`buff_list`), which can then be processed and written back to the client at an appropriate rate.
- **Source**: Reads data from the client and stores it in the pipe’s buffer.
- **Sink**: Reads data from the pipe’s buffer and sends it back to the client.
- Pipes allow the system to temporarily store data when the sink is not ready to process it.

## Design

Along with modifying the existing modules to enable data transfer through pipes, a new module (`xps_pipe`) is added. This enables creation of a  source-sink system for transferring data through pipes in an event-driven mode.

Three new structs are introduced here. The `xps_pipe_s`  struct includes the buffer and the maximum threshold. The `xps_pipe_source_s` and `xps_pipe_sink_s` structs includes the `ready`/`active` flags and callback functions. Earlier the callback functions were called based on the `read_ready` / `write_ready` flags of connection , here it would be based on the status of source/sink and whether the pipe is readable/writable. A pipe is readable if the length of `buff_list` greater than `0` and writable if its length less than the maximum threshold.

The callback functions in `connection.c` are modified to ensure the working of source-sink system. The `connection_source_handler()` reads the data using `recv()` and writes it to pipe, whereas the `connection_sink_handler()` reads the data from pipe and `send()`.

Here, the timeout in the `epollwait()` is set according to the existence of ready pipes. A ready pipe indicates that some operation has to be done on that - write into, read from , destroy. The availability of ready pipe leads to the timeout being set to 0, which results in a non-blocking call as discussed earlier.

In Stage 6, we have discussed the issue of accumulating nulls in the events,connections and listeners list, here we would be filtering those.

## Implementation

A new module `xps_pipe` is added and the existing modules are modified.

Modifications are carried out in the following order :

- `xps_connection`
- `xps_listener`
- `xps_loop`
- `xps_core`

## `xps_pipe` Module

We are introducing pipes in this module. This will be connected to the core itself and will be implemented in a similar way how connections and listeners were implemented.

`xps_pipe.h`

The code below has the contents of the header file for `xps_pipe`. Have a look at it and make a copy of it in your codebase.

::: details **expserver/src/core/xps_pipe.h**
    
```c
#ifndef XPS_PIPE_H
#define XPS_PIPE_H

#include "../xps.h"

struct xps_pipe_s {
    xps_core_t *core;
    xps_pipe_source_t *source;
    xps_pipe_sink_t *sink;
    xps_buffer_list_t *buff_list;
    size_t buff_thresh;
};

struct xps_pipe_source_s {
    xps_pipe_t *pipe;
    bool ready;
    bool active;
    xps_handler_t handler_cb;
    xps_handler_t close_cb;
    void *ptr;
};

struct xps_pipe_sink_s {
    xps_pipe_t *pipe;
    bool ready;
    bool active;
    xps_handler_t handler_cb;
    xps_handler_t close_cb;
    void *ptr;
};

/* xps_pipe */
xps_pipe_t *xps_pipe_create(xps_core_t *core, size_t buff_thresh, xps_pipe_source_t *source,
                            xps_pipe_sink_t *sink);
void xps_pipe_destroy(xps_pipe_t *pipe);
bool xps_pipe_is_readable(xps_pipe_t *pipe);
bool xps_pipe_is_writable(xps_pipe_t *pipe);
int xps_pipe_attach_source(xps_pipe_t *pipe, xps_pipe_source_t *source);
int xps_pipe_detach_source(xps_pipe_t *pipe);
int xps_pipe_attach_sink(xps_pipe_t *pipe, xps_pipe_sink_t *sink);
int xps_pipe_detach_sink(xps_pipe_t *pipe);

/* xps_pipe_source */
xps_pipe_source_t *xps_pipe_source_create(void *ptr, xps_handler_t handler_cb,
                                            xps_handler_t close_cb);
void xps_pipe_source_destroy(xps_pipe_source_t *source);
int xps_pipe_source_write(xps_pipe_source_t *source, xps_buffer_t *buff);

/* xps_pipe_sink */
xps_pipe_sink_t *xps_pipe_sink_create(void *ptr, xps_handler_t handler_cb, xps_handler_t close_cb);
void xps_pipe_sink_destroy(xps_pipe_sink_t *sink);
xps_buffer_t *xps_pipe_sink_read(xps_pipe_sink_t *sink, size_t len);
int xps_pipe_sink_clear(xps_pipe_sink_t *sink, size_t len);

#endif
```
:::
    

The following are the structs included and its fields

- `xps_pipe_s`
    - `xps_core_t *core` : Represents the core system the pipe belongs to
    - `xps_pipe_source_t *source` : A pointer to the source side of the pipe
    - `xps_pipe_sink_t *sink` : A pointer to the sink side of the pipe
    - `xps_buffer_list_t *buff_list` : The buffer that holds the data being transferred.
    - `size_t buff_thresh` : The maximum threshold size of the buffer
- `xps_pipe_source_s`/`xps_pipe_sink_s`
    - `xps_pipe_t *pipe` : A pointer to the pipe to which source/sink is attached.
    - `bool ready` : For source, it indicates the readiness to write data to pipe and for sink, the readiness to read data from pipe.
    - `bool active` : Whether source/sink is currently in operation
    - `xps_handler_t handler_cb` : Callback function of source/sink to handle data through pipe.
    - `xps_handler_t close_cb` : Callback function to close source/sink
    - `void *ptr` : A pointer to the connection corresponding to source/sink

`xps_pipe.c`

Contains functions for creation and destruction of pipes,source/sink , for attaching and detaching source/sink to pipe, for reading from and writing into the pipe. A short description of the functions included are as follows:

### **1. Pipe Creation and Destruction:**

**`xps_pipe_create`**

- Allocates memory and initialize the pipe instance.
- Adds the created pipe to the core’s pipe list.
- Attach source and sink.
- Returns the created pipe or NULL on failure.

**`xps_pipe_destroy`**

- Removes the pipe from the core’s pipe list.
- Destroy the buffer list of the pipe and free the pipe itself.
::: details **expserver/src/core/xps_pipe.c - `xps_pipe_create()`, `xps_pipe_destroy()`**
    
```c
xps_pipe_t *xps_pipe_create(xps_core_t *core, size_t buff_thresh, xps_pipe_source_t *source,
                            xps_pipe_sink_t *sink) {
    assert(core != NULL);
    assert(buff_thresh > 0);
    assert(source != NULL);
    assert(sink != NULL);

    // Alloc memory for pipe instance
    xps_pipe_t *pipe = /*fill this*/
    if (pipe == NULL) {
    logger(LOG_ERROR, "xps_pipe_create()", "malloc() failed for 'pipe'");
    return NULL;
    }

    /*Create buff_list instance*/

    // Init values 
    pipe->core = /*fill this*/
    pipe->source = NULL;
    pipe->sink = NULL;
    pipe->buff_list = /*fill this*/
    pipe->buff_thresh = /*fill this*/

    /* Add pipe to 'pipes' list of core*/
    
    /*Attach source and sink to pipe*/
    
    logger(LOG_DEBUG, "xps_pipe_create()", "created pipe");

    return pipe;
}

void xps_pipe_destroy(xps_pipe_t *pipe) {
    assert(pipe != NULL);

    /*Set NULL in 'pipes' list of core and increment n_null_pipes*/

    /*Destroy the buff_list of pipe*/
    /*Free the pipe*/
    logger(LOG_DEBUG, "xps_pipe_destroy()", "destroyed pipe");
}
```
:::
    

### **2. Pipe Readiness Checking:**

**`xps_pipe_is_readable`**

- Returns whether the pipe’s buffer has data (ie `buff_list->len` > 0).

**`xps_pipe_is_writable`**

- Checks if the buffer list length is below the buffer threshold, allowing new data to be written.
::: details **expserver/src/core/xps_pipe.c - `xps_pipe_is_readable()`, `xps_pipe_is_writable()`**
    
```c
bool xps_pipe_is_readable(xps_pipe_t *pipe) { return /*fill this*/ }

bool xps_pipe_is_writable(xps_pipe_t *pipe) { return /*fill this*/ }
```
:::

### **3. Source/Sink Attachment and Detachment:**

**`xps_pipe_attach_source` and `xps_pipe_attach_sink`**

- Attach a source or sink to a pipe, ensuring only one source or sink can be attached at a time.
- Return error if a source/sink is already attached.

**`xps_pipe_detach_source` and `xps_pipe_detach_sink`**

- Detach the source/sink(if present) by clearing the pipe pointer in the respective structures.
::: details **expserver/src/core/xps_pipe.c - `xps_pipe_attach_source()` ,  `xps_pipe_attach_sink()`,  `xps_pipe_detach_source()` ,  `xps_pipe_detach_sink()`**
    
```c
int xps_pipe_attach_source(xps_pipe_t *pipe, xps_pipe_source_t *source) {
    /*assert pipe and source not null*/
    /*check whether pipe already has a source and return E_FAIL*/
    
    pipe->source = /*fill this*/
    source->pipe = /*fill this*/

    return OK;
}

int xps_pipe_detach_source(xps_pipe_t *pipe) {
    /*assert pipe not null*/

    /*check whether pipe has no source and return E_FAIL*/

    pipe->source->pipe = NULL;
    pipe->source = NULL;

    return OK;
}

int xps_pipe_attach_sink(xps_pipe_t *pipe, xps_pipe_sink_t *sink) {
    /*assert pipe and sink not null*/

    /*check whether pipe already has a sink and return E_FAIL*/

    pipe->sink = /*fill this*/
    sink->pipe = /*fill this*/

    return OK;
}

int xps_pipe_detach_sink(xps_pipe_t *pipe) {
    /*assert pipe not null*/

    /*check whether pipe has no sink and return E_FAIL*/

    pipe->sink->pipe = NULL;
    pipe->sink = NULL;

    return OK;
}
```
::: 
    

### **4. Source Functions:**

**`xps_pipe_source_create`**

- Allocates and initializes a source. Source is intially not `ready`.

**`xps_pipe_source_destroy`**

- Detaches the source from the pipe and frees the memory.

**`xps_pipe_source_write`**

- Checks if the pipe is writable and writes to the pipe
::: details **expserver/src/core/xps_pipe.c - `xps_pipe_source_create()`, `xps_pipe_source_destroy()`, `xps_pipe_source_write()`**
    
```c
xps_pipe_source_t *xps_pipe_source_create(void *ptr, xps_handler_t handler_cb,
                                            xps_handler_t close_cb) {
    /*assert ptr, handler_cb, close_cb not null*/                                       
    
    /*Allocate memory for 'source' instance, if null returned log the error and return*/
    
    // Init values
    source->pipe = NULL;
    source->ready = false;
    source->active = true;
    /*similarly initialise the remaining fields of source instance*/

    logger(LOG_DEBUG, "xps_pipe_source_create()", "create pipe_source");

    return source;
}

void xps_pipe_source_destroy(xps_pipe_source_t *source) {
    /*assert source not null*/

    // Detach from pipe
    if (source->pipe != NULL)
    /*detach source from pipe*/

    free(source);

    logger(LOG_DEBUG, "xps_pipe_source_destroy()", "destroyed pipe_source");
}

int xps_pipe_source_write(xps_pipe_source_t *source, xps_buffer_t *buff) {
    /*assert source, buff not null*/

    if (/*Check if source not have a pipe*/) {
    logger(LOG_ERROR, "xps_pipe_source_write()", "source is not attached to a pipe");
    return E_FAIL;
    }

    
    if (/*Check whether pipe is not writable*/) {
    logger(LOG_ERROR, "xps_pipe_source_write()", "pipe is not writable");
    return E_FAIL;
    }

    // Duplicate buffer
    xps_buffer_t *dup_buff = xps_buffer_duplicate(buff);
    if (dup_buff == NULL) {
    logger(LOG_ERROR, "xps_pipe_source_write()", "xps_buffer_duplicate() failed");
    return E_FAIL;
    }

    /*Append dup_buff to buff_list of pipe*/
    return OK;
}

```
::: 
    

### **5. Sink Functions:**

**`xps_pipe_sink_create`**

- Allocates and initializes a sink. Sink is initially not `ready`.

**`xps_pipe_sink_destroy`**

- Detaches the sink from the pipe and frees the memory.

**`xps_pipe_sink_read`**

- Reads a specified length of data from the pipe’s buffer list, ensuring the pipe is attached and has sufficient data available. The length of data to be read is given as input.

**`xps_pipe_sink_clear`**

- Clears the specified length of data from the pipe’s buffer list, ensuring the data is available to clear.
::: details **expserver/src/core/xps_pipe.c - `xps_pipe_sink_create()`, `xps_pipe_sink_destroy()`, `xps_pipe_sink_read()`, `xps_pipe_sink_clear()`**
    
```c
xps_pipe_sink_t *xps_pipe_sink_create(void *ptr, xps_handler_t handler_cb, xps_handler_t close_cb) {
    /*refer to xps_pipe_source_create() and fill accordingly*/
}

void xps_pipe_sink_destroy(xps_pipe_sink_t *sink) {
    /*refer to xps_pipe_source_destroy() and fill accordingly*/
}

xps_buffer_t *xps_pipe_sink_read(xps_pipe_sink_t *sink, size_t len) {
    /*assert sink not null and len greater than 0*/
    
    if (/*Check if sink not have a pipe*/) {
    logger(LOG_ERROR, "xps_pipe_sink_read()", "sink is not attached to a pipe");
    return NULL;
    }

    if (/*Check if requested length is not available*/) {
    logger(LOG_ERROR, "xps_pipe_sink_read()", "requested length more than available");
    return NULL;
    }

    xps_buffer_t *buff = xps_buffer_list_read(sink->pipe->buff_list, len);
    if (buff == NULL) {
    logger(LOG_ERROR, "xps_pipe_sink_read()", "xps_buffer_list_read() failed");
    return NULL;
    }

    return buff;
}

int xps_pipe_sink_clear(xps_pipe_sink_t *sink, size_t len) {
    assert(sink != NULL);
    assert(len > 0);

    if (/*Check if sink not have a pipe*/) {
    logger(LOG_ERROR, "xps_pipe_sink_clear()", "sink is not attached to a pipe");
    return E_FAIL;
    }

    if (/*Check whether requested length not available*/) {
    logger(LOG_ERROR, "xps_pipe_sink_clear()", "requested length more than available");
    return E_FAIL;
    }

    if (xps_buffer_list_clear(/*fill this*/) != OK) {
    logger(LOG_ERROR, "xps_pipe_sink_clear()", "xps_buffer_list_clear() failed");
    return E_FAIL;
    }

    return OK;
}
```
::: 
    

## `xps_connection` Module - Modifications

`xps_connection.h`

As we are not invoking the callback functions depending on the ready state of connection but based on the pipe availability and source/sink status , the flags `read_ready` and `write_ready` are removed. The existing callback functions are also changed.  Add `source` and `sink` to `xps_connection_s` struct.

::: details **expserver/src/network/xps_connection.h**
    
```c
struct xps_connection_s {
    xps_core_t *core;
    u_int sock_fd;
    xps_listener_t *listener;
    char *remote_ip;
    xps_buffer_list_t *write_buff_list;//--
    
    xps_pipe_source_t *source;//++
    xps_pipe_sink_t *sink;//++

    bool read_ready;//--
    bool write_ready;//--
    xps_handler_t send_handler;//--
    xps_handler_t receive_handler;//--
};
```
::: 
    

`xps_connection.c`

The existing callback functions `connection_read_handler()` and `connection_write_handler()` are removed and new ones added in accordance with the source-sink system.

```c
void connection_read_handler(void *ptr);// [!code --]
void connection_write_handler(void *ptr);// [!code --]

void connection_source_handler(void *ptr);// [!code ++]
void connection_source_close_handler(void *ptr);// [!code ++]
void connection_sink_handler(void *ptr);// [!code ++]
void connection_sink_close_handler(void *ptr);// [!code ++]
void connection_close(xps_connection_t *connection, bool peer_closed);// [!code ++]
```

Functions Modified

- `xps_connection_create()` - source and sink are attached during connection creation
- `xps_connection_destroy()` - source and sink are dettached during connection destruction
- `connection_loop_read_handler()` - set source as ready instead of connection, thus indicating the source is ready to receive data and write to pipe.
- `connection_loop_write_handler()` - set sink as ready instead of connection, thus indicating the sink is ready to read data from pipe and sent.
- `connection_loop_close_handler()` - invokes `connection_close()` (explained below)
::: details **expserver/src/network/xps_connection.c - modified functions**
    
```c
xps_connection_t *xps_connection_create(xps_core_t *core, u_int sock_fd) {
    assert(core != NULL);

    // Allocate memory for connection instance
    ...
    /*Create source instance*/
    if (source == NULL) {
    logger(LOG_ERROR, "xps_connection_create()", "xps_pipe_source_create() failed");
    free(connection);
    return NULL;
    }

    /*Create sink instance*/
    if (sink == NULL) {
    logger(LOG_ERROR, "xps_connection_create()", "xps_pipe_sink_create() failed");
    xps_pipe_source_destroy(source);
    free(connection);
    return NULL;
    }

    // Init values
    ...
    connection->source = /*fill this*/;
    connection->sink = /*fill this*/;
    ...

    // Attach connection to loop
    if ((...) != OK) {
    logger(LOG_ERROR, "xps_connection_create()", "xps_loop_attach() failed");
    /*destroy source*/
    /*destroy sink*/
    free(connection);
    return NULL;
    }
...
}

void xps_connection_destroy(xps_connection_t *connection) {
    assert(connection != NULL);

    // Detach connection from loop
    ...
    /*destroy source*/
    /*destroy sink*/
    ...
}

void connection_loop_read_handler(void *ptr) {
    ..
    /*ready flag of source*/ = true;
}

void connection_loop_write_handler(void *ptr) {
    ...
    /*ready flag of sink*/ = true;
}

void connection_loop_close_handler(void *ptr) {
    ...
    xps_connection_destroy(connection);// [!code --]
    connection_close(connection, true);// [!code ++]
}
```
::: 
    

Functions Added

- `connection_source_handler()` - read data using `recv()` and upon successful reading, writes the buffer to pipe using `xps_pipe_source_write()`.
- `connection_source_close_handler()` - call back for closing the source. If both the source and sink not active the connection is closed.
- `connection_sink_handler()` - read data from the pipe using `xps_pipe_sink_read()` and sent using `send()`. Upon successful sending, clears the data sent from the pipe buffer.
- `connection_sink_close_handler()` - call back for closing the sink. If both the source and sink not active the connection is closed.
- `connection_close()` - prints whether connection is closing because the peer is closed. Destroys the connction using `xps_connection_destroy()`.
::: details **expserver/src/network/xps_connection.c - added functions**
    
```c
void connection_source_handler(void *ptr) {
    /*assert ptr not null*/
    xps_pipe_source_t *source = ptr;
    xps_connection_t *connection = source->ptr;

    xps_buffer_t *buff = /*create a buffer*/
    if (buff == NULL) {
    logger(LOG_DEBUG, "connection_source_handler()", "xps_buffer_create() failed");
    return;
    }

    /*Read from socket using recv()*/
    buff->len = read_n;

    // Socket would block
    if (read_n < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) {
    xps_buffer_destroy(buff);
    /*ready flag of source*/ = false;
    return;
    }

    // Socket error
    if (read_n < 0) {
    /*destroy buff*/
    logger(LOG_ERROR, "connection_source_handler()", "recv() failed");
    connection_close(connection, false);
    return;
    }

    // Peer closed connection
    if (read_n == 0) {
    /*destroy buff*/
    /*close connection*/
    return;
    }

    if (/*write into pipe*/ != OK) {
    logger(LOG_ERROR, "connection_source_handler()", "xps_pipe_source_write() failed");
    /*destroy buff*/
    /*close connection*/
    return;
    }

    xps_buffer_destroy(buff);
}

void connection_source_close_handler(void *ptr) {
    /*assert*/
    xps_pipe_source_t *source = ptr;
    xps_connection_t *connection = source->ptr;

    if (/*source not active AND sink not active*/)
    /*close connection*/
}

void connection_sink_handler(void *ptr) {
    /*assert*/
    xps_pipe_sink_t *sink = ptr;
    xps_connection_t *connection = sink->ptr;

    xps_buffer_t *buff = /*read from pipe*/
    if (buff == NULL) {
    logger(LOG_ERROR, "connection_sink_handler()", "xps_pipe_sink_read() failed");
    return;
    }

    // Write to socket
    int write_n = send(/*fill this*/, MSG_NOSIGNAL);

    /*destroy buff*/

    // Socket would block
    if (write_n < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) {
    /*sink made not ready*/
    return;
    }

    // Socket error
    if (write_n < 0) {
    logger(LOG_ERROR, "connection_sink_handler()", "send() failed");
    /*close connection*/
    return;
    }

    if (write_n == 0)
    return;

    if (/*Clear write_n length from pipe buff_list*/ != OK)
    logger(LOG_ERROR, "connection_sink_handler()", "failed to clear %d bytes from sink", write_n);
}

void connection_sink_close_handler(void *ptr) {
    /*assert*/
    xps_pipe_sink_t *sink = ptr;
    xps_connection_t *connection = sink->ptr;

    if (/*source not active AND sink not active*/)
    /*close connection*/
}

void connection_close(xps_connection_t *connection, bool peer_closed) {
    /*assert*/
    logger(LOG_INFO, "connection_close()",
            peer_closed ? "peer closed connection" : "closing connection");
    /*destroy connection*/
}
```
:::
    

## `xps_listener` Module - Modifications

Functions Modified

- `listener_connection_handler()`  - For each connection created , a pipe is also created. The source and sink are added to the connection in `xps_connection_create()`.  `xps_pipe_create()` creates pipe and attaches the source and sink to the created pipe.

```c
void listener_connection_handler(void *ptr) {
  .....
  while (1) {
    ....
    // Accepting connection
    ...
    //No incoming connections
    ...
		// Making socket non blocking
    ....
    // Creating connection instance
    ...
    //Creates pipe for the connection created
    xps_pipe_create(listener->core, DEFAULT_PIPE_BUFF_THRESH, client->source, client->sink);// [!code ++]
    ....
  }
}
```

## `xps_loop` Module - Modifications

`xps_loop.c` 

We replace current `handle_connections()` function to `handle_pipes()` as we will be setting `timeout` based on the pipes instead of connections.

```c
bool handle_connections(xps_loop_t *loop);// [!code --]
void handle_epoll_events(xps_loop_t *loop, int n_events);// [!code ++]
bool handle_pipes(xps_loop_t *loop);// [!code ++]
void filter_nulls(xps_core_t *core);// [!code ++]
```

Functions Added

- `handle_pipes()`  - Here, we are replacing the `handle_connections()` with `handle_pipes()`, as the callback functions were invoked based on the `read_ready` and `write_ready` flags of the connection earlier but now it would be based on the status of source, sink and pipe. There are two iterations over the pipe. The first one is for invoking the callback functions and second for checking the existence of ready pipes. Checking for ready pipes can't be done in the first iteration itself as callbacks on current pipe could affect previously iterated pipes making them ready. It returns `true` if ready pipes exist.
::: details **expserver/src/core/xps_loop.c - `handle_pipes()`**
    
```c
bool handle_pipes(xps_loop_t *loop) {
    assert(loop != NULL);
    for (int i = 0; i < loop->core->pipes.length; i++) {
    xps_connection_t *pipe = loop->core->pipes.data[i];
    if (pipe == NULL)
        continue;
        
        /*Destroy the pipe if it has no source and sink and continue*/
        
        if (/*Pipe has source AND source is ready AND pipe is writable*/){       
        pipe->source->handler_cb(pipe->source);//call connection_source_handler to write into  pipe
    }
    
    if (/*Pipe has sink AND sink is ready AND pipe is readable*/) {
        pipe->sink->handler_cb(pipe->sink);//call connection_sink_handler to read from pipe
    }
    
    if (/*Pipe has source and no sink*/) {
        pipe->source->active = false;
        pipe->source->close_cb(pipe->source);
    }

    if (/*Pipe has sink and no source and pipe is not readable*/) {
        pipe->sink->active = false;
        pipe->sink->close_cb(pipe->sink);
    }
    
    }

    for (int i = 0; i < loop->core->pipes.length; i++) {
    xps_connection_t *pipe = loop->core->pipes.data[i];
    if (pipe == NULL){
        logger(LOG_DEBUG, "handle_pipes", "pipe is null");
        continue;
    }
        if (/*Pipe has source AND source is ready AND pipe is writable*/){       
                return true;
    }
    if (/*Pipe has sink AND sink is ready AND pipe is readable*/) {
                return true;
    }
    if (/*Pipe has source and no sink*/) {
        return true;
    }
    if (/*Pipe has sink and no source and pipe is not readable*/) {
        return true;
    }
    }
    return false;
}
```
::: 
    
        
    

- `filter_nulls`  - Filters the null accumulated in events , listeners, connections, pipes list
::: details **expserver/src/core/xps_loop.c - `filter_nulls()`**
    
```c
void filter_nulls(xps_core_t *core) {
/*check whether number of nulls in each of events, listeners, connections, pipes list
    exceeds DEFAULT_NULLS_THRESH and filter nulls using vec_filter_null() and set
    number of nulls in each list to 0*/

}
```
:::    

- `handle_epoll_events()`  -  Replaces the existing `xps_loop_run()`,  this function would be invoked from the new `xps_loop_run()`. It iterates thorough the events and corresponding call back functions are called based on epoll notification. This is added to simplify the new `xps_loop_run()`.
::: details **expserver/src/core/xps_loop.c -** `handle_epoll_events()`
    
```c
void handle_epoll_events(xps_loop_t *loop, int n_events) {
    logger(LOG_DEBUG, "handle_epoll_events()", "handling %d events", n_events);

    for (int i = 0; i < n_events; i++) {
    logger(LOG_DEBUG, "handle_epoll_events()", "handling event no. %d", i + 1);
                /*Handle events as given in existing xps_loop_run()*/
    }
}
```
::: 
    

Functions Modified

- `xps_loop_run()`  - This function is modified to check the existence of ready pipes , setting the `timeout` of `epollwait()` accordingly, handling the epoll events and filtering nulls from the lists attached to core. If there are ready pipes, it sets `timeout` to `0`, meaning `epoll_wait()` will be non-blocking. If there are no ready pipes, it sets `timeout` to `-1`, meaning `epoll_wait()` will block indefinitely until an event occurs. This ensures that if there are pipes ready for immediate processing, the program doesn’t block waiting for other events.
::: details **expserver/src/core/xps_loop.c -** `xps_loop_run()`
    
```c
void xps_loop_run(xps_loop_t *loop) {
    assert(loop != NULL);

    logger(LOG_DEBUG, "xps_loop_run()", "starting to run loop");

    while (1) {
    logger(LOG_DEBUG, "xps_loop_run()", "loop top");

    // Handle pipes
    bool has_ready_pipes = handle_pipes(loop);

    int timeout = /*set timeout as described above*/

    logger(LOG_DEBUG, "xps_loop_run()", "epoll waiting");
    int n_events = /*fill this*/
    logger(LOG_DEBUG, "xps_loop_run()", "epoll wait over");

    if (n_events < 0)
        logger(LOG_ERROR, "xps_loop_run()", "epoll_wait() error");

    // Handle epoll events
    if (n_events > 0)
        handle_epoll_events(loop, n_events);

    // Filter NULLs from vec lists
    filter_nulls(loop->core);
    }
}
```
::: 
    

## `xps_core` Module - Modifications

`xps_core.h` 

Similar to listeners and connections list in the struct `xps_core_s`, add a list for `pipes` and add `n_null_pipes` to track the number of pointers in `pipes` list set to `NULL`.

`xps_pipe.c`

Functions Modified

- `xps_core_create()`  - Initialise the `core→pipes` and `n_null_pipes`
- `xps_core_destroy()`  - Similar to destroying each connections and listeners attached to the core instance while destroying the core, the pipes attached should also be destroyed. The source and sink, if present, are closed before destroying the corresponding pipe. De-initialise the `core→pipes` list

## Experiment #1

Repeat the Experiment #2 of Stage8 and ensure memory utilization is reduced.

## Conclusion

We have now solved both the issues specified in the Experiments of Stage8. The high CPU utilization was solved in stage 9 using edge-triggered epoll. In this stage, we have reduced the memory utilization by managing data flow through pipes. In the next stage, we would be implementing an upstream module.
