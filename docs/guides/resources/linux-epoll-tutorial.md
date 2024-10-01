# Linux epoll Tutorial

## epoll 

*epoll* is an I/O event notification mechanism widely being used in modern web servers like Nginx. *epoll* stands for event poll and it is a Linux specific construct. 

Epoll refers to a kernel data structure. It maintains a list of file descriptors, which allows a process to get notifications whenever an I/O event is possible on any of these file descriptors. epoll_create(), epoll_ctl() and epoll_wait() are the three main system calls that deal with the implementation of epoll.  All these system calls are included in the sys/epoll.h header file.

## epoll_create()

epoll_create() is the system call used to create an epoll instance.  An epoll instance is identified by a file descriptor in linux. The epoll_create() returns a file descriptor that identify the newly created kernel data structure.

```c
#include <sys/epoll.h>
int epoll_create(int size);
```

**Arguments**

**size** - This is the only argument for epoll_create(). It is of integer type. It refers to the number of file descriptors that the process wants to monitor. The kernel decides the size required for the epoll instance(data structure) according to the value in size.

**Return value**

epoll_create() returns an integer which refers to the file descriptor of the created epoll instance.

### epoll_create1()

This system call is also used to create an epoll instance similar to epoll_create(), but the arguments differ.

```c
int epoll_create1(int flags)
```

Here the flags can be either 0 or EPOLL_CLOEXEC

if the flag is set to zero, this function behaves same as epoll_create()

when the flag is set to EPOLL_CLOEXEC, whenever a child process is forked from the current process it closes the epoll file descriptor in the child before starting its execution. So only the current process will have access to the epoll instance.

Since epoll instance is treated as a file descriptor, we use the close() system call in unistd.h header file to close an epoll instance.

## epoll_ctl()

An epoll instance can maintain a list of file descriptors that has to be monitored. All file descriptors registered with an epoll instance is collectively referred to as epoll list or interest list. Whenever any of the file descriptors become ready for I/O operations, they are added to the ready list. Ready list is a subset of interest list. epoll_ctl() system call is used to add, modify or delete file descriptors to be monitored in the interest list of epoll.

```c
#include<sys/epoll.h>
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
```

**Arguments**

1. **epfd** -   It is of integer type. It is the file descriptor of the epoll instance in the kernel.
2. **fd** - It is of integer type. It refers to the target file descriptor that has to be added or modified or deleted from the epoll instance referred to by the epfd.
3. **op** - It is of integer type. It refers to the operation to be performed on the target file descriptor(fd) in the epoll instance(epfd). Valid values that op can take include `EPOLL_CTL_ADD`, `EPOLL_CTL_MOD`, and `EPOLL_CTL_DEL` .
    
    `EPOLL_CTL_ADD` - Add a file decriptor (fd) to the interest list of epoll instance.
    
    `EPOLL_CTL_MOD`  - Change the setting associated with fd which is already in the interest list of epfd to new settings specified in the event argument.
    
    `EPOLL_CTL_DEL`  - Removes the target file descriptor(fd) from the interest list of epfd. If the fd has been added to multiple epoll instances, then closing it from will remove it from all the epoll interest lists to which it was a part of. 
    
4. **event** - It is of epoll_event type. 
    
    `epoll_event` structure is included in the `sys/epoll.h` header. The structure of epoll_event is shown below.
    
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
    
    The first field of `epoll_event` structure refers to the events that the fd is being monitored for. The major available event types include,
    
    `EPOLLIN` - used for read operations
    
    `EPOLLOUT` - used for write opeartions 
    
    `EPOLLLET` - requests edge triggered notifications for the fd
    
    The second field of `epoll_event` structure specifies the data that kernel should save and return when the file descriptor becomes ready. 
    

 **Return Value -** when successful, epol_ctl returns zero. When an error occurs, it returns -1 and errno is set to indicate the error.

## epoll_wait()

This system call is used to notify the process, when some event has occurred on the interest list of the epoll instance. It blocks the process until any of the descriptors being monitored becomes ready for I/O events.

```c
#include <sys/epoll.h>
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
```

**Arguments**

1. **epfd** - It is of type integer. It is the file descriptor that refers to the epoll instance.
2. **events** - It is an array of `epoll_event` structures. It is allocated by the calling process. The values in this array is filled when epoll_wait returns. It will have the list of file descriptors that are in ready state.  
3. **maxevents** - ****It is of integer type. It refers to the length of events array.
4. **timeout** - It is of integer type. It refers to the time in milliseconds for which epoll_wait() will block. If it is set to 0, epoll_wait() will not block and if it is set to -1, it will block forever.

 

**Return Value**

The return value is of an integer type. 

If one or more file descriptors in the interest list becomes ready, then returns a positive integer that denotes the number of file descriptors in the events array.

If timeout occurred before any file descriptor becomes ready, then returns 0.

If an error has occurred, then returns -1.