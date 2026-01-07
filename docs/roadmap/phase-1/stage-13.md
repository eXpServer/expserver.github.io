# Stage 13: Session Module

## Recap

- In the last three stages we have created pipe module, upstream module and file module.

## Learning Objectives

- In this stage we will implement a session module.

## Introduction

In the previous stages we have implemented upstream and file modules. Whenever any client requests are received on port 8001, we created an upstream module which will interact with the upstream server. Similarly for requests received on port 8002, a file module was created which will serve the static files. Now we are introducing a new module named session module. Session module will play the role of an intermediary in handling client requests. From this stage on wards all the client requests will be first directed to the session module. Session module will decide whether it should serve a file or reverse the proxy. In the current stage, session module makes this decision based on the port on which the requests were received. In the later stages an xps_http module will be used, which will parse the incoming client requests. Session will then look at the configuration, based on the parsed HTTP request, to make the decision.

### File Structure for stage 13

![filestructure.png](/assets/stage-13/filestructure.png)

## Design

We design and implement a new module named `xps_session` in this stage. `xps_session` acts as an intermediary between client requests and either `xps_upstream` or `xps_file` depending on whether request is to reverse proxy or to serve a static file. A session instance is created for every connection. All the communications from client passes through the session instance. Pipes are used for data exchange between various modules. Pipe between client source and session sink enables communication from client to session and that between session source and client sink enables session to client communication. Similarly pipes are there from session source to upstream sink, upstream source to session sink and file source to session sink.

:::tip NOTE

Having a clear understanding about the pipe sources and sinks attached to session is essential for doing this stage. Revisit the architecture of eXpServer to have a good understanding of the structure of session and pipes attached to it.

Session has a client_source, client_sink, upstream_source, upstream_sink and a file_sink.

Data exchange takes place between session to client, client to session, upstream to session, session to upstream and file to session

:::

## Implementation

![implementation.png](/assets/stage-13/implementation.png)

Let’s have a clear picture about the changes required in this stage before proceeding further.

- A new module named `xps_session` is created.
- Modifications to the existing modules such as `xps_core`, `xps_loop` and `xps_listener` .

## `xps_session` Module

The code below has the contents of xps_session.h. Have a look at it and make a copy of it in your code base.

::: details **expserver/src/core/xps_session.h**
    
```c
#ifndef XPS_SESSION_H
#define XPS_SESSION_H
    
#include "../xps.h"
    
struct xps_session_s {
  xps_core_t *core;
  xps_connection_t *client;
  xps_connection_t *upstream;
  bool upstream_connected;
  bool upstream_error_res_set;
  u_long upstream_write_bytes;
  xps_file_t *file;
  xps_pipe_source_t *client_source;
  xps_pipe_sink_t *client_sink;
  xps_pipe_source_t *upstream_source;
  xps_pipe_sink_t *upstream_sink;
  xps_pipe_sink_t *file_sink; 
  xps_buffer_t *to_client_buff;
  xps_buffer_t *from_client_buff;
};
    
xps_session_t *xps_session_create(xps_core_t *core, xps_connection_t *client);
void xps_session_destroy(xps_session_t *session);

#endif
```
:::    

`xps_session.h`

struct `xps_session_s` contains all the details associated with a session instance. The members of the struct are explained below:

- `xps_core_t *core` : pointer to the core instance
- `xps_connection_t *client` : pointer to the client connection instance
- `xps_connection_t *upstream` : pointer to the upstream connection instance.
- `bool upstream_connected` : boolean value that denotes whether upstream is connected to the session or not
- `bool upstream_error_res_set` : boolean value that shows whether upstream error is set or not
- `u_long upstream_write_bytes` : the number of bytes that can be written to upstream
- `xps_file_t *file` : pointer to the file instance.
- `xps_pipe_source_t *client_source` , `xps_pipe_source_t *upstream_source`: pipe source for client connection and upstream connection.
- `xps_pipe_sink_t *client_sink`, `xps_pipe_sink_t *upstream_sink` , `xps_pipe_sink_t *file_sink`  : pipe sink for client, upstream and file.
- `xps_buffer_t *to_client_buff` : the buffer that stores the data to be written to the pipe from session to client
- `xps_buffer_t *from_client_buff` : the buffer carrying the data that is read from the pipe between client and session.

`xps_session.c`

There are two main functions associated with a session instance. They are session create and session destroy functions. Let’s see them in more detail.

**xps_session_create()**

This function is responsible for creating a session instance. It is called from the `listener_connection_handler()` function. On accepting a connection on the listening socket, the `listener_connection_handler()` will create a connection instance as well as a session instance. Further all the communications between client and either upstream or file module takes place through this session instance. 

An overview of `xps_session_create()` function is as follows:

- Allocates memory and initializes session instance
- While initializing, the `to_client_buffer` and `from_client_buffer` are set to NULL and the `upstream_connected` and `upstream_error_res_set` flags are set to false. Also the ready flags for session’s client_sink, upstream_sink and file_sink should be set to true.
- Add the session instance to core’s session list
- Create pipe between `session->client_source` and `client->sink`, as well as between `client->source` and `session->client_sink`
- If listener port is 8001, create an upstream module and then creates a pipe between `session->upstream_source` and `upstream->sink` as well as between `upstream->source` and `session->upstream_sink`
- If listener port is 8002, create a file module and then creates a pipe between `file->source` and `session->file_sink`

:::details  **expserver/src/core/xps_session.c  `xps_session_create()`**
    
```c
xps_session_t *xps_session_create(xps_core_t *core, xps_connection_t *client) {
  /* validate parameters */

  // Alloc memory for session instance
  xps_session_t *session = /* fill this */
  if (session == NULL) {
    logger(LOG_ERROR, "xps_session_create()", "malloc() failed for 'session'");
    return NULL;
  }

  session->client_source =
    xps_pipe_source_create(session, client_source_handler, client_source_close_handler);
  session->client_sink = /* fill this */
  session->upstream_source = /* fill this */
  session->upstream_sink = /* fill this */
  session->file_sink = /* fill this */

  if (!(session->client_source && session->client_sink && session->upstream_source &&
        session->upstream_sink && session->file_sink)) {
    logger(LOG_ERROR, "xps_session_create()", "failed to create some sources/sinks");

    if (session->client_source)
      xps_pipe_source_destroy(session->client_source);
    if (session->client_sink)
      /* fill this */
    if (session->upstream_source)
      /* fill this */
    if (session->upstream_sink)
      /* fill this */
    if (session->file_sink)
      /* fill this */

    free(session);
    return NULL;
  }

  // Init values
  session->core = /* fill this */
  session->client = /* fill this */
  session->upstream = /* fill this */
  session->upstream_connected = /* fill this */
  session->upstream_error_res_set = /* fill this */
  session->upstream_write_bytes = 0;
  session->file = /* fill this */
  session->to_client_buff = /* fill this */
  session->from_client_buff = /* fill this */
  session->client_sink->ready = /* fill this */
  session->upstream_sink->ready = /* fill this */
  session->file_sink->ready = /* fill this */

  // Add to 'sessions' list of core
  /* fill this */

  // Attach client
  if (xps_pipe_create(core, DEFAULT_PIPE_BUFF_THRESH, client->source, session->client_sink) ==
        NULL ||
      xps_pipe_create(core, DEFAULT_PIPE_BUFF_THRESH, session->client_source, client->sink) ==
        NULL) {
    logger(LOG_ERROR, "xps_session_create()", "failed to create client pipes");

    if (session->client_source)
      xps_pipe_source_destroy(session->client_source);
    if (session->client_sink)
      /* fill this */
    if (session->upstream_source)
      /* fill this */
    if (session->upstream_sink)
      /* fill this */
    if (session->file_sink)
      /* fill this */

    free(session);
    return NULL;
  }

  logger(LOG_DEBUG, "xps_session_create()", "created session");

  if (client->listener->port == 8001) {
    xps_connection_t *upstream = /* fill this */
    if (upstream == NULL) {
      logger(LOG_ERROR, "xps_session_create()", "xps_upstream_create() failed");
      perror("Error message");
      /* destroy session */
      return NULL;
    }
    session->upstream = /* fill this */;
    xps_pipe_create(/* fill this */);
    xps_pipe_create(/* fill this */);
  }

  else if (client->listener->port == 8002) {
    int error;
    xps_file_t *file = xps_file_create(/* fill this */);
    if (file == NULL) {
      logger(LOG_ERROR, "xps_session_create()", "xps_file_create() failed");
      perror("Error message");
      /*destory session*/
      return NULL;
    }
    /* assign to the file member */
    xps_pipe_create(/* fill this */);
  }

  return session;
}
```
:::    

In `xps_session.c` several handler functions are there for handling various events, they are as follows

- `void client_source_handler()` :  is used while writing data from session instance to client connection instance( `session->client_source`  to `client->sink` ). Whatever data is stored in `session->to_client_buff` is written into the pipe. After successful write, the `session->to_client_buff` is set to NULL.

- `void client_sink_handler()` :  is used when data is read from client connection instance to session instance(`client->source` to  `session->client_sink`  ). The read data from pipe is then stored into `session->from_client_buff` .

- `void upstream_source_handler()`  : is used when data is written from session to upstream. Whatever data is stored in `session->from_client_buff` is written into the pipe. After successful write the `session->from_client_buff` is set to NULL. The `upstream_connected` flag is set to true, if some data has been moved from session to upstream.

- `void upstream_sink_handler()` :  deals with reading of data from upstream to session. Here the `session->upstream_connected` is set to true. After successfully reading the data, it is then stored in the `session->to_client_buff` .

- `void file_sink_handler()` :  is similar to `upstream_sink_handler()` . Here data is read from file to session and it is stored in `session->to_client_buff` .

- `void client_source_close_handler()`, `void client_sink_close_handler()`, `void upstream_source_close_handler()`, `void upstream_sink_close_handler()`, `void file_sink_close_handler()` : all these are sink/source close handlers, which deals with closing of the session instance. In the upstream source/sink close handlers, if upstream is not connected and `upstream_error_res_set` flag is not set, then  `upstream_error_res_set` is set to true.

- `void upstream_error_res()`  is used to set the `session->upstream_error_res_set` as true.

- `set_to_client_buff()` : This function plays an important role in setting the ready flags for source and sink for the session, upstream and file. Here if the `session->to_client_buff`  is found to be null, then it implies that data has been already written into the pipe. So now session is ready to receive data from upstream or file. Therefore, `session->client_source->ready` is set to false and then `session->upstream_sink->ready` and `session->file_sink->ready` are set to true.

- `set_from_client_buff()` : This function also sets the source and sink ready flags. Here if the `session->from_client_buf` is found to be null, then it implies that no data has been read from client to session. Session is now ready to accept data from client. Therefore `session->client_sink->ready` is set to true and `session->upstream_source->ready` is set to false.

- `session_check_destroy()` : This function checks whether the session instance is working properly or whether it has to be destroyed. In this function various data flows are checked for verifying whether session is working or not. They are:
    1. client to upstream flow : If `session->upstream_source` is active and either `session - >client_sink` is active or if there is some data in `from_client_buff`, then it implies there can be a data flow from client to upstream. 
    2. upstream to client flow : If `session->client_source` is active and either `session->upstream_sink` is active or there is some data in `to_client_buff`, then there is a data flow possible between upstream and client.
    3. file to client flow : If `session->client_source` is active and either `session->file_sink` is active or there is some data in `to_client_buff`, then there is a data flow possible between file and client.
    
    If none of these flows are present then session instance gets destroyed.
    
::: details **expserver/src/core/xps_session.c  - handler functions**

```c
void client_source_handler(void *ptr) {
  /* validate parameters */

  xps_pipe_source_t *source = ptr;
  xps_session_t *session = source->ptr;

  // write to session->to_client_buff
  if (xps_pipe_source_write(/* fill this */) != OK) {
    logger(LOG_ERROR, "client_source_handler()", "xps_pipe_source_write() failed");
    return;
  }
  xps_buffer_destroy(/* fill this */);

  set_to_client_buff(session, NULL);
  session_check_destroy(session);
}

void client_source_close_handler(void *ptr) {
  assert(ptr != NULL);

  xps_pipe_source_t *source = /* fill this */;
  xps_session_t *session = /* fill this */;

  session_check_destroy(session);
}

void client_sink_handler(void *ptr) {
  assert(ptr != NULL);

  xps_pipe_sink_t *sink = /* fill this */;
  xps_session_t *session = /* fill this */;

  xps_buffer_t *buff = xps_pipe_sink_read(/* fill this */);
  if (buff == NULL) {
    logger(LOG_ERROR, "client_sink_handler()", "xps_pipe_sink_read() failed");
    return;
  }

  set_from_client_buff(/* fill this */);
  xps_pipe_sink_clear(/* fill this */);
}

void client_sink_close_handler(void *ptr) {

  /* fill this */
  
}

void upstream_source_handler(void *ptr) {
  /* fill this */

  if (xps_pipe_source_write(source, session->from_client_buff) != OK) {
    logger(LOG_ERROR, "upstream_source_handler()", "xps_pipe_source_write() failed");
    return;
  }

  // Checking if upstream is connected
  if (session->upstream_connected == false) {
    session->upstream_write_bytes += session->from_client_buff->len;
    if (session->upstream_write_bytes > session->upstream_source->pipe->buff_list->len)
      session->upstream_connected = true;
  }

  xps_buffer_destroy(/* fill this */);

  set_from_client_buff(/* fill this */);
  session_check_destroy(/* fill this */);
}

void upstream_source_close_handler(void *ptr) {
  /* fill this */

  if (!session->upstream_connected && !session->upstream_error_res_set) {
    upstream_error_res(session);
  }

  /* fill this */
}

void upstream_sink_handler(void *ptr) {
  
  /* fill this */

  session->upstream_connected = true;

  xps_buffer_t *buff = xps_pipe_sink_read(/* fill this */);
  if (buff == NULL) {
    logger(LOG_ERROR, "upstream_sink_handler()", "xps_pipe_sink_read() failed");
    return;
  }

  set_to_client_buff(/* fill this */);
  xps_pipe_sink_clear(/* fill this */);
}

void upstream_sink_close_handler(void *ptr) {
  /* fill this */

  if (!session->upstream_connected && !session->upstream_error_res_set) {
    upstream_error_res(session);
  }

  /* fill this */
}

void upstream_error_res(xps_session_t *session) {
  assert(session != NULL);

  session->upstream_error_res_set = true;
}

void file_sink_handler(void *ptr) {
  
  /* fill this */

  xps_buffer_t *buff = xps_pipe_sink_read(/* fill this */);
  if (buff == NULL) {
    logger(LOG_ERROR, "file_sink_handler()", "xps_pipe_sink_read() failed");
    return;
  }

  set_to_client_buff(/* fill this */);
  xps_pipe_sink_clear(/* fill this */);
}

void file_sink_close_handler(void *ptr) {
  
  /* fill this */
  
}

void set_to_client_buff(xps_session_t *session, xps_buffer_t *buff) {
  /* validate parameters */

  session->to_client_buff = buff;

  if (buff == NULL) {
    session->client_source->ready = /* fill this */;
    session->upstream_sink->ready = /* fill this */;
    session->file_sink->ready = /* fill this */;
  } else {
    session->client_source->ready = /* fill this */;
    session->upstream_sink->ready = /* fill this */;
    session->file_sink->ready = /* fill this */;
  }
}

void set_from_client_buff(xps_session_t *session, xps_buffer_t *buff) {
  /* validate parameters */

  session->from_client_buff = buff;

  if (buff == NULL) {
    session->client_sink->ready = /* fill this */;
    session->upstream_source->ready = /* fill this */;
  } else {
    session->client_sink->ready = /* fill this */;
    session->upstream_source->ready = /* fill this */;
  }
}

void session_check_destroy(xps_session_t *session) {
  /* validate parameters */

  bool c2u_flow =
    session->upstream_source->active && (session->client_sink->active || session->from_client_buff);

  bool u2c_flow = /* fill this */;

  bool f2c_flow = /* fill this */;

  bool flowing = c2u_flow || u2c_flow || f2c_flow;

  if (!flowing)
    xps_session_destroy(/* fill this */);
}
```
:::        
    

 Now let’s see the next function in `xps_session` module,

**xps_session_destroy()**

This function is responsible for destroying the session instance. It is similar to the destroy functions of other modules. The overview of the function is as follows:

- Destroy the source and sink associated with `session->client` , `session->upstream` and `session->file` .
- Destroy the buffers, `session->to_client_buff` and `session->from_client_buff` .
- Set the entry for session in `core->sessions` as NULL.
- Free the session instance.
::: details **expserver/src/core/xps_session.c  `xps_session_destroy()`**
    
```c
void xps_session_destroy(xps_session_t *session) {
  /* validate parameters */

  /* destroy client_source, client_sink, upstream_source, upstream_sink and file_sink attached to session */
  
  if (session->to_client_buff != NULL)
    xps_buffer_destroy(session->to_client_buff);
  if (session->from_client_buff != NULL)
    /* fill this */

  // Set NULL in core's list of sessions
  /* fill this */

  free(session);

  logger(LOG_DEBUG, "xps_session_destroy()", "destroyed session");
}
```
:::   

## Modifications to `xps_core` Module

`xps_core.h`

In the struct `xps_core_s` , similar to listeners, connections and pipes we have to add a list for `session` and `n_null_sessions` to keep track of number of NULL pointers in sessions list.

`xps_core.c` 

- `xps_core_create()`  -  initialize `core->sessions` and set `n_null_sessions` to 0.
- `xps_core_destroy()`  -  destroy the sessions created. De-initialise the `core->sessions`  list.

## Modifications to `xps_loop` Module

`void filter_nulls()` 

In this function similar to pipes, listeners and connections filter out the number of null session instances from `core->sessions` . Set `core->n_null_sessions`  to 0.

## Modifications to `xps_listener` Module

Till the previous stages we have seen that on accepting a connection on the listening socket, the `listener_connection_handler()` will call the `xps_connection_create()` to create a connection instance for the incoming client connection. Further depending on the port on which the client request is received, either upstream module or file module are created using `xps_upstream_create()` or `xps_file_create()` . From this stage onwards, instead of directly calling upstream create and file create form `listener_connection_handler()`, we will be calling `xps_session_create()`, which will further decide on whether to create upstream or file modules. On accepting a connection on the listening socket, the `listener_connection_handler()` will create a connection instance as well as a session instance.

```c
void listener_connection_handler(void *ptr) {
  /* validate parameters */

  while (1) {
    struct sockaddr conn_addr;
    socklen_t conn_addr_len = sizeof(conn_addr);

    // Accepting connection
    /* accept connection and error checking */

    // Making socket non blocking
    /* make the socket non-blocking*/

    // Creating connection instance
    xps_connection_t *client = xps_connection_create(/* fill this */);
    if (client == NULL) {
      logger(LOG_ERROR, "listener_connection_handler()", "xps_connection_create() failed");
      close(conn_sock_fd);
      continue;
    }
    client->listener = listener;
    
    xps_session_t *session = /* fill this */ ;
    if (session == NULL) {
      logger(LOG_ERROR, "listener_connection_handler()", "xps_session_create() failed");
      xps_connection_destroy(client);
      return;
    }

    logger(LOG_INFO, "listener_connection_handler()", "new connection");
  }
}
```
So we have made all the necessary changes required for this stage. Now it’s time to test the code.

## Milestone #1

So now we have implemented the session module. Let’s check whether session module is properly acting as an intermediary for transferring client requests correctly to either upstream or file modules. 

- First modify the `build.sh` to include the `xps_session` module.
- Open a terminal, then compile and run the eXpServer.
- Start the python file server, which acts as the upstream server in a new terminal.
- Open two another terminals. Try connecting a netcat client on port 8001 and on port 8002.
- Check whether the client connected from port 8001 is accessing the upstream server and client from port 8002 being served with the static file. If so, our session module is working properly.

## Conclusion

We have successfully created and implemented the session module. Session module acts as a link between client_connection module, upstream module and file module. Session module is responsible for directing the client requests to corresponding modules. In this stage session module is directing all the requests received on port 8001 to upstream and those on 8002 to file modules. From next stage on wards, session will do this based on the HTTP request received. We will implement a new module named `xps_http` in the next stage. When an HTTP request is received, the incoming bytes get parsed by `xps_http` module. The session module will decide whether to serve a file or reverse proxy the request, based on the parsed HTTP request.