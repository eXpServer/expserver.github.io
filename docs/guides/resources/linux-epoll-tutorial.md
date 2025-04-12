# Linux epoll Tutorial

## epoll 
Efficiently handling thousands of concurrent client connections is one of the most challenging aspects of server design.  Over the years many approaches have been used to manage concurrent client requests. Multi-threading and multi-programming were two such prominent methods. In the multi-threading/multi-programming approach, the server creates a new thread/process for each incoming client connection. However, as the number of threads/processes increases, the system faces overhead from their switching and synchronization, which can strain CPU resources and degrade performance. To overcome this limitation, event-driven mechanisms were later used to optimize resource usage and improve efficiency. The major  [event-driven](https://en.wikipedia.org/wiki/Event-driven_programming) mechanisms include `select()` (introduced in the early 1980s in Unix System V), `poll()` (1997, Linux version 2.1), and `epoll()` (2002, Linux version 2.5). Both `select()` and `poll()` are system calls that allow a single process to multiplex and monitor multiple file descriptors for events such as reading or writing  (In Unix-based systems, sockets are treated as file descriptors).  When using `select()` or `poll()`, the programmer provides a set of file descriptors and specifies the types of events to monitor (e.g., read, write). Upon returning, `select()` or `poll()` indicate which file descriptors are ready for I/O, allowing the server to handle those specific events.

However, a key drawback of this approach is that each time `select()` or `poll()` is called, the process must pass the entire list of interested file descriptors to the kernel. The kernel then iterates through all the file descriptors to identify those that are ready, even if only a few are active. This requires the kernel to check each file descriptor individually. This approach becomes inefficient when handling a large number of file descriptors, making it unsuitable for applications that require managing high volumes of concurrent connections. Additionally, `select()` has a limit on the maximum number of file descriptors that can be monitored simultaneously. To address the inefficiencies of `select()` and `poll()`, an event-driven mechanism called `epoll` was introduced in Linux kernel version 2.5.44, released in 2002. Unlike `select()` and `poll()`, which are system calls that require repeatedly passing file descriptors to the kernel, `epoll` uses a set of kernel-maintained data structures to track registered file descriptors, so that the application does not have to pass the list every time through the system call interface.     These data structures allow the kernel to quickly identify list of ready file descriptors on which I/O operations are possible at a given instance (from among all the registered file descriptors).   Hence the kernel can pass this information to an application process that requests the kernel for list of ready descriptors.   `epoll` is particularly efficient for handling large numbers of concurrent connections . As a result, it is widely used in modern, high-performance web servers such as **Nginx**. 

## The working of Epoll

Epoll is a Linux specific construct. Unlike `select()` and `poll()` , epoll itself is not a system call. It is essentially a kernel data structure, that keep track of file descriptors. There are mainly three system calls that enable the use of epoll. All these functions are included within the `epoll.h` header file. The three system calls include, `epoll_create()`, `epoll_ctl()`, `epoll_wait()`.

When a process wants to use `epoll`, it must first **create an epoll instance** using the `epoll_create()` (or `epoll_create1()`) system call. This system call **allocates memory** for the epoll instance and initializes essential kernel data structures to manage event-driven I/O efficiently. At the **kernel level**, a structure is created, which is responsible for managing the epoll instance. This structure has two main components: Interest list and Ready list. The **interest list** maintains all file descriptors (FDs) that the process wants to monitor for events such as read, write, or error conditions. The interest list in internally implemented as a red-black tree. The Red-Black Tree ensures that insertions, deletions, and lookups of FDs occur in O(log n) time, making it more efficient than linear searches. The ready list is a subset of the interest list that contain the set of descriptors which are ready for some I/O. The ready list is internally implemented as a doubly linked list. 

During the creation of an epoll instance, both the interest list and the ready list are initially empty. To register file descriptors (FDs) for monitoring, the `epoll_ctl()` system call must be used, allowing the addition, deletion, or modification of FDs in the interest list. The `EPOLL_ADD` flag is used to add an FD, `EPOLL_DEL` removes an FD, and `EPOLL_MOD` modifies an existing FD. When `epoll_ctl()` is called with the `EPOLL_ADD` flag, the specified FD is added to the interest list. Whenever an event occurs on this FD, it is automatically added to the ready list. As a result, FDs remain in the interest list while also appearing in the ready list when events occur, ensuring efficient event-driven monitoring.

Whenever the server needs to be notified about events that have occurred on any of the registered file descriptors (FDs), it can call `epoll_wait()`. This function retrieves the ready list, which consists of the FDs on which events, such as data being available to read or the socket being ready for writing, have occurred. `epoll_wait()` will block until at least one FD becomes ready, ensuring that the server only processes FDs that are actively involved in I/O operations. The function can also be configured with a timeout to limit the blocking period, but by default, it blocks indefinitely until an event occurs. Thus, `epoll()` enhances concurrent client handling by efficiently monitoring multiple file descriptors in constant time.

`epoll_create()`, `epoll_ctl()` and `epoll_wait()` are the three main system calls that deal with the implementation of epoll.  All these system calls are included in the `<sys/epoll.h>` header file.

## `epoll_create()`

`epoll_create()` is the system call used to create an epoll instance. An epoll instance is identified by a file descriptor in linux. The `epoll_create()` returns a file descriptor that identify the newly created kernel data structure.

```c
#include <sys/epoll.h>
int epoll_create(int size);
```

**Arguments**

**size** - This is the only argument for `epoll_create()`. It is of integer type. It refers to the number of file descriptors that the process wants to monitor. The kernel decides the memory required for the epoll instance(data structure) according to the value in size. However, the value of size is not strictly used by the kernel anymore to allocate memory for the epoll instance. The kernel now typically ignores this value for modern implementations as the kernel is capable of dynamically allocating space according to the requirements. Starting from Linux 2.6.8, the kernel no longer uses this argument, and any positive value would be accepted. 

**Return value**

On success returns an integer which is the file descriptor of the created epoll instance. If any error is encountered it returns -1 and set the global constant errno to indicate the cause for failure.

### `epoll_create1()`

`epoll_create1()` is used to create an epoll instance, just like `epoll_create()`, but it provides additional control over the behavior of the epoll instance through the flags argument. This makes it more flexible and is generally preferred over `epoll_create()` in modern applications. In the eXpServer project we will be using `epoll_create1()`.
```c
int epoll_create1(int flags)
```

Here the flags can be either `0` or `EPOLL_CLOEXEC`

If the flag is set to zero, this function behaves same as `epoll_create()` where there is no need to mention size as it is dynamically controlled by the kernel.

When the flag is set to `EPOLL_CLOEXEC`, whenever a child process is forked from the current process it closes the epoll file descriptor in the child before starting its execution. So only the current process will have access to the epoll instance. This flag is useful for ensuring that file descriptors are not unintentionally shared with child processes.

On success, `epoll_create1()` returns a file descriptor referencing the epoll instance and returns -1 and set the errno on failure similar to `epoll_create()`.

Since epoll instance is treated as a file descriptor, we use the `close()` system call in `<unistd.h>` header file to close an epoll instance.

## `epoll_ctl()`

As mentioned earlier, an epoll instance can maintain a list of file descriptors that has to be monitored. All file descriptors registered with an epoll instance is collectively referred to as epoll list or **interest list**. `epoll_ctl()` system call is used to add, modify or delete file descriptors to be monitored in the interest list of epoll.

```c
#include<sys/epoll.h>
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
```

**Arguments**

1. `int epfd` -   The file descriptor of the epoll instance, that is returned by `epoll_create()` or `epoll_create1()`. This argument specifies the epoll instance to which the operation is applied. 
2. `fd` - The file descriptor to be added, modified, or deleted from the epoll instance. This is the target file descriptor (e.g., a socket or regular file) that you want to monitor for events.
3. `op` - It is of integer type. It refers to the operation to be performed on the target file descriptor(fd) in the epoll instance(epfd). Valid values that op can take include `EPOLL_CTL_ADD`, `EPOLL_CTL_MOD`, and `EPOLL_CTL_DEL` .
    
    `EPOLL_CTL_ADD` - Add a file decriptor (fd) to the interest list of epoll instance.
    
    `EPOLL_CTL_MOD`  - Change the setting associated with fd which is already in the interest list of epfd to new settings specified in the event argument.
    
    `EPOLL_CTL_DEL`  - Removes the target file descriptor(fd) from the interest list of epfd. If the fd has been added to multiple epoll instances, then closing it from will remove it from all the epoll interest lists to which it was a part of. 
    
4. `struct epoll_event *event` - A pointer to an `epoll_event` structure that specifies the events to be monitored on the file descriptor. This argument is used while adding and modifying the FDs. While deleting any FD, this argument is generally ignored and set to NULL. The caller is responsible for initializing and allocating the fields for `epoll_event` structure. 
    
    `epoll_event` structure is included in the `<sys/epoll.h>` header. The structure of `epoll_event` is shown below.
    
    ```c
    struct epoll_event 
    {
    				uint32_t      events;/* Epoll events */
    				epoll_data_t  data;/* User data variable */
    }
    
    union epoll_data {
    				void     *ptr;
            int       fd;
            uint32_t  u32;
            uint64_t  u64;
           };
           
    typedef union epoll_data  epoll_data_t;       
    ```
    
    The fields of the `epoll_event` structure are as follows:

- **events** - It is of type `uint32_t`, which refers to an unsigned 32 bit integer. This field is used to specify which events the file descriptor (FD) should be monitored for in the epoll instance. The major available events include,
    
    `EPOLLIN` - used for read operations
    
    `EPOLLOUT` - used for write operations 
    
    `EPOLLLET` - requests edge triggered notifications for the FD
    
- **data** - This field is a union that specifies the data that kernel should save and return when the file descriptor becomes ready.

      The fields of the union `epoll_data` are as follows: 

- **void *ptr** - A pointer to some user-defined object or data. This is useful when we need to store a reference to a custom object (such as a structure) that is associated with the event.
- **int fd** - The file descriptor we are interested in and on which events are being monitored.
- **uint32_t u32** - A 32 bit unsigned integer which is used to store flags or timeout values.
- **uint64_t u64** - A 64 bit unsigned integer that can store large values required for specific event processing flags or timeout values.

When the `epoll_ctl()` function call is successful, it returns `0`. If an error occurs, it returns `-1`, and the global variable `errno` is set to indicate the specific error that occurred. Some common errors include

 `EBADF` - This error is set if either the `epoll` fd or the file descriptor to monitor is invalid.

 `EEXIST` - This error occurs when adding an already registered FD to the `epoll` instance.

 `EINVAL` - This error happens when one or more of the arguments passed to `epoll_ctl()` are invalid.

## `epoll_wait()`

This system call is used to notify the process, when some event has occurred on the interest list of the epoll instance. It blocks the process until any of the descriptors being monitored becomes ready for I/O events.

```c
#include <sys/epoll.h>
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
```

**Arguments**

1. `int epfd` - It is of type integer. It is the file descriptor that refers to the epoll instance.
2. `struct epoll_event *events` - It is an array of `epoll_event` structures. It is allocated by the calling process. The values in this array is filled when `epoll_wait` returns. It will have the list of file descriptors that are in ready state.  
3. `int maxevents` - It is of integer type. It refers to the length of events array.
4. `int timeout` - It is of integer type. It refers to the time in milliseconds for which `epoll_wait()` will block. If it is set to 0, `epoll_wait()` will not block and if it is set to -1, it will block forever.

 

**Return Value**

The return value is of an integer type. 

If one or more file descriptors in the interest list becomes ready, then returns a positive integer that denotes the number of file descriptors in the events array.

If timeout occurred before any file descriptor becomes ready, then returns 0.

If an error has occurred, then returns -1.

## Epoll triggering modes

There are two different modes available for using with epoll. Level triggered mode and Edge triggered mode. By default epoll works in level triggered mode.

**Level triggered mode**

In this mode of operation, if any of the file descriptors in the interest list of epoll is ready, then notifications are being send. As long as there is some ready FDs, `epoll_wait()` will keep on sending notifications in level triggered mode. This is the default mode for epoll. This mode is easier to implement. Since repeated notifications are sent, it ensures that events are not getting missed. It’s useful when FDs are frequently ready and wants to handle the events consistently. But in case of idle connections, since the kernel send buffer is empty, level triggered mode will repeatedly notify this and as a result the CPU cycles also increases. To avoid such unnecessary notifications, we can use epoll in edge triggered mode.

**Edge triggered mode**

In this mode notifications are send by `epoll_wait()` only if there has been some change in the state of any of the FDs being monitored. In edge triggered mode notifications are send only if there has been some I/O activity since the previous call to `epoll_wait()`. This mode of operation avoids the unnecessary repeated notifications as in level triggered mode. For using edge triggering, we have to use the `EPOLLET` flag while registering an FD with the epoll instance using `epoll_ctl()`.