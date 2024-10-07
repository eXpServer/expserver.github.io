# Stage 9: epoll Edge Triggered
## Recap

- In stage 8, we have started using network sockets in non-blocking mode.
- There were issues regarding high CPU and memory utilization
- The repeated notifications from epoll regarding write events resulted in high CPU utilization.
- The filling up of data in the kernel buffer has resulted in increased memory usage.

## Learning Objectives

- Use epoll in edge triggered mode to mitigate CPU utilization problem

## Introduction

From the experiments in the previous stage, we found that there was a high CPU and memory utilization, while running the server. We will solve the CPU utilization problem in this stage and memory utilization problem in the next stage. From the experiment 1 in stage 8, we noticed that the CPU usage for an idle TCP connection was very high. This was due to epoll repeatedly notifying about write events on the socket. During an idle connection, we are not writing anything to the socket, thus the send kernel buffer will be empty and it is available to be written to. Epoll in level triggered mode(default mode) will keep on notifying about this. As a result CPU usage rises. So if we are able to avoid these repeated notifications being sent by the epoll, we can improve the CPU usage.

**What change in behaviour of epoll can help us in solving this problem?**

What if epoll notifies only if there has been some I/O activity since the previous call to epoll_wait() ?

- Notify process of a read event only when some data arrives in kernel receive buffer and not when data is already present in it.
- Notify process of a write event only when the kernel send buffer state changes, instead of keep on dispatching write events whenever kernel send buffer is available for write.

This behavior would solve the problem of repeated notifications. In level triggered mode we will continue to receive events as long as the underlying file descriptor is in ready state. But in epoll edge triggered mode we will receive events only when state of the corresponding file descriptor changes. 

## Design

In this stage we will implement edge-triggered epoll. In edge triggered epoll, epoll_wait() will block until there are no I/O events since the previous call to epoll_wait(). So we have to keep track of any read or write events that are ready on the socket. To keep track of the readiness of a connection socket to read or write, we will be using two flags named `read_ready` and `write_ready` respectively. These two flags are added to the `xps_conection_s` structure. We will be also adding two handlers `send_handler` and `recv_handler` to the `xps_connection_s` structure which will manage the sending and receiving of data in a connection. 

We will also add a new function called `handle_connections()` in `xps_loop` module. This will check if any connections are ready for some read or write events currently. If no ready connections are available, then the timeout is set to -1 in epoll_wait(). Otherwise timeout is set to 0. If the timeout argument in epoll_wait() is set to 0, epoll_wait() does not block. It returns after checking the ready FD’s in the interest list of epoll. If timeout is set to -1, epoll_wait() will block until some events occur or until some exceptions happen on the FD’s in the interest list of epoll. 

## Implementation

In this stage we will be modifying the following modules in the given order: 

- `xps_connection`
- `xps_loop`

### Modifications to `xps_connection` module:

Start by modifying the existing `xps_connection_s` structure by adding flags and the necessary callbacks. 

```c
struct xps_connection_s {
    xps_core_t* core;
    int sock_fd;
    xps_listener_t* listener;
    char* remote_ip;
    xps_buffer_list_t* write_buff_list;

    bool read_ready; // [!code ++]
    bool write_ready; // [!code ++]
    xps_handler_t send_handler; // [!code ++]
    xps_handler_t recv_handler; // [!code ++]
};
```

Flags are boolean values used to inform whether the connection socket is ready to read or write. Initialize read_ready and write_ready to false while creating a connection in the `xps_connection_create` function.

Till now in level triggering mode the loop handler callbacks were directly sending or receiving data. Now we will modify these functions to also set the read or write flags. We will first rename the existing `connection_loop_read_handler` to `connection_read_handler` and `connection_loop_write_handler`  to `connection_write_handler` and at the same time create new functions with the former names that will perform the below functions. 

```c
void connection_loop_read_handler(void* ptr) {
    assert(ptr != NULL);
	  /*set read_ready flag to true*/
}

void connection_loop_write_handler(void* ptr) {
    assert(ptr != NULL);
   /*set write_ready flag to true*/
}
```

In the `connection_read_handler` and `connection_write_handler` if recv() or send() is returning an error (EAGAIN or EWOULDBLOCK), then we will have to set the corresponding flag to false. EAGAIN and EWOULDBLOCK means that a non-blocking operation cannot be completed immediately. This essentially implies that no data is available for reading or the buffer is full so that no writting can take place.

```c
void connection_read_handler(void* ptr) {
    ...
    
    if (read_n < 0){ 
	    xps_connection_destroy(connection); // [!code --]
      return; // [!code --]
	    if(errno == EAGAIN || errno == EWOULDBLOCK){
        xps_connection_destroy(connection); // [!code --]
        connection->read_ready = false;  // [!code ++]
        return;
      }
      else{ //if error is something else
	      xps_connection_destroy(connection); // [!code ++]
	      return; // [!code ++]
      }
    }
    ...
 }
```

```c

void connection_write_handler(void* ptr) {
    assert(ptr != NULL); 
    ... 
    if (write_n == -1){
	    xps_connection_destroy(connection); // [!code --]
      return; // [!code --]
	    if(errno == EAGAIN || errno == EWOULDBLOCK){
        xps_connection_destroy(connection); // [!code --]
        connection->write_ready = false;  // [!code ++]
        return;
      }
      else{ //if error is something else
	      xps_connection_destroy(connection); // [!code ++]
	      return; // [!code ++]
      }
    }   
   ...
}
```

Initialize `send_handler` and `recv_handler` fields of the `xps_connection_s`  structure in the `xps_connection_create` function using `connection_read_handler` and `connection_write_handler` callbacks .

To enable epoll edge triggering mode we have to set the EPOLLET flag.  EPOLLET flag is used to explicitly request the epoll to notify only when an FD changes its state. We have to pass EPOLLET along with EPOLLIN and EPOLLOUT flags in `xps_loop_attach` .

```c
xps_connection_t* xps_connection_create(xps_core_t* core, int sock_fd) {
	
		...
		/*initialize the flags and handlers appropriately*/ 
		
    xps_loop_attach(core->loop, sock_fd, EPOLLIN | EPOLLOUT, connection, connection_loop_read_handler, connection_loop_write_handler, connection_loop_close_handler); // [!code --]
    xps_loop_attach(core->loop, sock_fd, EPOLLIN | EPOLLOUT | EPOLLET, connection, connection_loop_read_handler, connection_loop_write_handler, connection_loop_close_handler); // [!code ++]

	  ...
}
```

::: tip NOTE

Modify the `xps_loop_attach` in `xps_listener_create` function similarly

:::

## Modifying `xps_loop` module

 

In `xps_loop` module we will be adding a new function called `handle_connections()` . 

```c
bool handle_connections(xps_loop_t* loop); // [!code ++]
```

This function will iterate through all the connections in the core and will call the send and recv handlers based on the flags. If the `read_ready` flag is true, it will call the `recv_handler` on the connection and if the `write_ready` flag is true and there is some data to be written to, it will call the `send_handler` on the connection.  

```c
bool handle_connections(xps_loop_t* loop) {

    for (/*iterate through all the connections*/) {
        xps_connection_t* connection = /*fill this*/;

        if (connection->read_ready == true)
            connection->recv_handler(connection);
             
            //check if connection still exists 

        if (connection->write_ready == true && connection->write_buff_list->len > 0)
            connection->send_handler(connection);
    }

    for (/* iterate through all connections once again until we find a ready connection */) {
        xps_connection_t* connection = /*fill this*/;
				
				/*check if connection is NULL and continue if it is*/
				
        if (connection->read_ready == true)
            return true;

        if (connection->write_ready == true && connection->write_buff_list->len > 0)
            return true;
    }

    return false;
}
```

In `handle_connections()` we are iterating through the connections twice. In the first iteration we check whether there are any read or write events ready for each connection and if so the appropriate handlers will be called. The second iteration is to verify that there are no more events ready in any of the connections. This is required because as we use edge triggering right now, we will only be notified once about a particular event. The problem arises when we are not instantly handling that event. Thus the second iteration would catch any such cases.

We will be calling `handle_connections()` from `xps_loop_run` . If `handle_connections()` returns true, set the timeout value to 0. If `handle_connections()` returns false, set the timeout value to -1. In previous stages for level triggering, the timeout parameter was set to -1 indicating that `epoll_wait` will block indefinitely until a new event comes up. 

```c
void xps_loop_run(xps_loop_t* loop) {
	/*check parameter validity */
	
	while(1){
		bool has_ready_connections = handle_connections(loop);
		/*set timeout to 0 if there are any ready connections else set to -1*/         
		int n_events = epoll_wait(loop->epoll_fd, loop->epoll_events, MAX_EPOLL_EVENTS, -1); // [!code --]
		int n_events = epoll_wait(loop->epoll_fd, loop->epoll_events, MAX_EPOLL_EVENTS, timeout); // [!code ++]
		
		...
	}  
}
```

So now we have successfully made the required changes to enable epoll edge triggering.  

## Experiment #1

Now we will check for the CPU utilization as done in the previous stage. First compile and run the eXpServer. Then in a new terminal run the htop utility. Now connect a netcat client to the server and observe the trend in CPU utilization.

Here we can observe that as compared to the previous stage the CPU utilization has reduced drastically. Since there are no repeated notifications as in level triggered mode, the TCP idle connection is no more consuming more CPU cycles. Thus through edge triggered epoll we are now able to optimize CPU utilization. 



## Conclusion

In this stage we have optimized the CPU utilization with the implementation of edge triggered epoll. We have introduced read and write flags to know whether any event is ready in a connection. The timeout parameter in the epoll_wait() is then set to 0 or -1 by looking through the flags in all connections. 

Edge triggered epoll has significantly reduced the CPU usage. In the next stage we will see how to improve the memory utilization while running eXpServer. We will be adding a new module named `xps_pipe` in the next stage for solving the issue.