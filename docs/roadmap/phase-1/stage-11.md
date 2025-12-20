# Stage 11: Upstream Module

## Recap

In the last stage we have seen how to use pipes for data transmission between source and sink. 

## Learning Objective

In this stage we will be implementing an upstream module with the help of pipes as discussed in stage 10.

## Introduction

In the previous stages, we have seen that all the requests coming from the clients were directly being handled by the server. But in most of the modern day web servers that handles large scale client requests, upstream servers are being used for the same. An upstream server is a server that provides service to another server. So whatever requests are coming to the server from a client, is then forwarded to a corresponding upstream server which can handle it. Upstream servers can be specialized servers which can perform some specific tasks. Since the client requests are getting distributed across different upstream servers, it controls the traffic at the server and improves the overall performance. In this stage we are implementing an upstream module, that helps in handling the client requests by forwarding to an upstream server. We will be making use of pipes discussed in stage 10, for implementing the upstream module.

### File structure for stage 11
![filestructure.png](/assets/stage-11/filestructure.png)

## Design

In this stage we are creating a new module named `xps_upstream`. An upstream module acts as an intermediary between client requests and an upstream server. From this stage on wards all the requests coming on port 8001 will be directed to an upstream server. Here our upstream server will be a python file server, serving a folder on our local hard drive. Pipes are used between client connection instance and upstream module for exchanging data. So whenever any client request is received on port 8001, an upstream module is created, which is then connected to the upstream server. An upstream module is essentially a connection instance which has it’s own source, sink. The data transmission between client and upstream is done via pipes. A pipe is created between client source and upstream sink for data transmission from client to upstream and another pipe is created between upstream source and client sink for upstream to client data transmission.

## Implementation

![implementation.png](/assets/stage-11/implementation.png)

In this stage a new module named `xps_upstream` is added. The following existing modules are also modified.

- `xps_listener`

### `xps_upstream` Module

This module is responsible for creating a connection instance with the upstream server for each of the client requests(on port 8001).

`xps_upstream.h`

The below is the code for the header file `xps_upstream.h`. Have a look at it and make a copy of it in your code base.

::: details **expserver/src/network/xps_upstream.h**
    
```c
#ifndef XPS_UPSTREAM_H
#define XPS_UPSTREAM_H

#include "../xps.h"

xps_connection_t *xps_upstream_create(xps_core_t *core, const char *host, u_int port);

#endif
```
:::    

`xps_upstream.c` 

`xps_upstream` module currently contains a single function named `xps_upstream_create()`. This function takes core, host address and port number as arguments. It first creates an upstream socket. Then the socket is connected to the upstream server using connect() system call. `xps_getadrrinfo()` function is used to get the socket address of upstream server, which is to be passed in the connect(). After successfully connecting to the upstream server, a connection instance is created using `xps_connection_create()` function. After successful creation of the upstream connection instance, it is then returned from `xps_upstream_create()`.

```c
xps_connection_t *xps_upstream_create(xps_core_t *core, const char *host, u_int port) {
  /* validate parameter */

  /* create a socket and connect to host and port to upstream using xps_getaddrinfo and connect function */

  if (!(connect_error == 0 || errno == EINPROGRESS)) {
    logger(LOG_ERROR, "xps_upstream_create()", "connect() failed");
    perror("Error message");
    close(sock_fd);
    return NULL;
  }
  
 /* create a connection to upstream with core and sock_fd*/
  

  return connection;
}
```
:::warning  
 Dont forget to free the addrinfo object after use
:::

## Modifications to listener module

In `xps_listener` the `listener_connection_handler()` function is having modifications. If the client requests are on port number 8001, an upstream connection instance is created using `xps_upstream_create()`  function. Further using `xps_pipe_create()` pipes are created between client source and upstream sink as well as between upstream source and client sink. So the changes are as follows,

- An upstream connection instance is created if `listener→port` is 8001.
- A pipe is created between client source and upstream sink.
- A pipe is created between upstream source and client sink.

```c
void listener_connection_handler(void *ptr) {
  assert(ptr != NULL);
  xps_listener_t *listener = ptr;

  while (1) {
    

    // Accepting connection
    ...

    // Making socket non blocking
    ...

    // Creating connection instance
    ...

    // TEMP
    if (listener->port == 8001) {
     
      /* create upstream connection */
      /*create pipe connection to  client source and upstream sink for the listener*/
      /*create pipe connection to upstream source and client sink for the listener*/
    } else {
    /* same as previous stages*/

    }
    

    logger(LOG_INFO, "listener_connection_handler()", "new connection");
  }
}
```

So these are the major changes required in this stage.

## Milestone #1

Now we have made the required changes for using the upstream module functionality. Let’s test out the changes. 

First modify the `build.sh` to include the `xps_upstream` module. 

Now start the python file server to serve the current working directory as shown below

`python -m http.server 3000`

If file server is successfully operational it will display a message like the one below
`Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...`

In another terminal compile and run the eXpServer code. It will start like this,

```bash
[INFO] xps_core_start() : Server listening on [http://0.0.0.0:8001](http://0.0.0.0:8001/)
[INFO] xps_core_start() : Server listening on [http://0.0.0.0:8002](http://0.0.0.0:8002/)
[INFO] xps_core_start() : Server listening on [http://0.0.0.0:8003](http://0.0.0.0:8003/)
[INFO] xps_core_start() : Server listening on [http://0.0.0.0:8004](http://0.0.0.0:8004/)
```

Now the python file server and our eXpServer are both running. If the implementation was correct then accessing `localhost:8001`  will now show the files present in the current working directory. Whenever any files are selected on `localhost:8001` the corresponding request details can be seen as log in the terminal running the python server.

So now we have seen that all requests coming on port 8001 is being served by the python file server which acts as the upstream server here. 

Thus we have successfully implemented the upstream module.

## Conclusion

So now we have implemented an upstream module. We have dedicated the port 8001, for using upstream module. All the requests coming on port 8001 gets forwarded to the upstream server, which is the python file server in this case with the help of upstream module. We have used pipes for sending data to upstream server and for receiving data back to client. In the next stage we will see how to implement a file server, which deals with accessing and delivering of files over a network.
