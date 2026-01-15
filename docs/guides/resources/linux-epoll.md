# Linux Epoll

## Overview

Epoll is not just a user-space API, it’s a kernel subsystem that maintains a persistent, event-driven mechanism to monitor I/O readiness of multiple file descriptors.

Internally, epoll revolves around a kernel object called `eventpoll`.

### Key Components of `eventpoll` Object

#### 1. The Wait Queue (`wq`)
This queue holds the list of processes/threads that are currently blocked in `epoll_wait()`, waiting for an event to occur. When an event happens, the kernel wakes up the processes in this queue.

#### 2. The Ready List (`rdlist`)

This is a **doubly linked list** that stores the file descriptors (FDs) that are currently "ready" (i.e., have data to read or space to write).

- When an event occurs on a monitored FD, it is added to this list.
- `epoll_wait()` simply checks this list. If it is not empty, it returns the events to the user.

#### 3. The Red-Black Tree (`rbr`)

This is a **Red-Black Tree** that stores all the file descriptors currently being monitored by this epoll instance.

- It allows for efficient **insertion, deletion, and search** of file descriptors (O(log n)).
- When you call `epoll_ctl()` to add or remove an FD, the kernel modifies this tree.

## How it works: The Lifecycle

### **Creating an Epoll instance**: `epoll_create1()`

```c
int  epoll_create1(int  flags)
```

This call returns a file descriptor representing the epoll instance. The descriptor is later used with epoll_ctl() to register file descriptors and with epoll_wait() to receive readiness events.

**flags** : The flags argument controls properties of the epoll file descriptor itself.

 - **EPOLL_CLOEXEC**:    Sets the close-on-exec (FD_CLOEXEC) flag on the epoll file
   descriptor. When the process calls exec(), the kernel automatically
   closes the epoll descriptor, preventing it from being inherited by
   the new program image.  

 - **0**:  Creates the epoll instance without setting FD_CLOEXEC. In this case,
   the epoll file descriptor is inherited across fork() + exec(), which
   can unintentionally leak the epoll instance into child processes.

**In almost all applications—especially servers and multi-process programs—EPOLL_CLOEXEC should be used to avoid file descriptor leaks.**

```c

struct eventpoll {

/* Wait queue for sys_epoll_wait() */
wait_queue_head_t wq;

/* List of ready file descriptors */
struct list_head rdlist;

/* Red-black tree root used to store monitored file descriptors */
struct rb_root_cached rbr; 

/* Lock for protecting the structure */
spinlock_t lock;

/* ... other fields ... */

};

```

**Why epoll_create1() Replaces epoll_create()** 

**The older API:**
```c
int epoll_create(int size);
```
 

The older API required a positive size argument that was originally intended as a hint for how many file descriptors the epoll instance would monitor. Modern Linux kernels ignore this parameter entirely, as the kernel dynamically manages epoll’s internal data structures and does not require an upfront size specification.

In addition, epoll_create() cannot set the close-on-exec (FD_CLOEXEC) flag atomically, which can lead to file descriptor leaks in multi-threaded or fork() + exec()-based programs.

epoll_create1() removes the obsolete size parameter, and allows FD_CLOEXEC to be applied atomically. As a result, epoll_create() is obsolete and should not be used in new code.


### **Registering a File Descriptor with Epoll**: `epoll_ctl()`

```c
#include<sys/epoll.h>
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
```

**Arguments:**

- `epfd`: The file descriptor of the epoll instance as returned by `epoll_create1()`. 
- `op`: The operation to be performed (e.g., `EPOLL_CTL_ADD`, `EPOLL_CTL_MOD`, `EPOLL_CTL_DEL`).
- `fd`: The target file descriptor to monitor.
- `event`: A pointer to an `epoll_event` structure that specifies the events to monitor (e.g., `EPOLLIN` - representing resource is ready for reading, `EPOLLOUT` - representing resource is ready for writing) and any user data associated with the file descriptor.

### User-Space Event Specification: `struct epoll_event`

The `epoll_event` structure is **user-facing** and defined in `<sys/epoll.h>`. It is the primary mechanism by which user space communicates event interest and user data to the kernel.  

```c
struct epoll_event {
  uint32_t      events;  /* Epoll events (eg: EPOLLIN,EPOLLOUT,EPOLLET) */
  epoll_data_t  data;    /* User data variable */
};

union epoll_data {
  void     *ptr;  /* Pointer to a user defined data structure */
  int       fd;   /* File descritor of the socket we are monitoring*/
  uint32_t  u32;  /* Not used within the scope of this project */
  uint64_t  u64;  /* Not used within the scope of this project */
};

typedef union epoll_data epoll_data_t;
```
The contents of `struct epoll_event` are copied by the kernel when `epoll_ctl()` is called and stored internally as part of the epoll bookkeeping. User space does not directly interact with kernel-internal structures after registration.

### Kernel-Side Registration (`EPOLL_CTL_ADD`)

When a file descriptor is added using:

```c
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &event);` 
```
The kernel performs the following steps:
1.  Searches the epoll instance’s red-black tree to check whether the file descriptor is already registered.
2.  If not found, allocates a new internal entry (`struct epitem`).
3.  Copies the user-provided `struct epoll_event` into the kernel-owned `epitem`.
4.  Inserts the new `epitem` into the red-black tree for efficient lookup.

### Internal Kernel Representation: `struct epitem`

```c
struct epitem {
    struct rb_node rbn;         // for red-black tree
    struct list_head rdllink;   // for ready list
    struct epoll_filefd ffd;    // target fd + file pointer
    struct eventpoll *ep;       // back-pointer to eventpoll
    struct epoll_event event;   // user's event mask
    struct list_head pwqlist;   // poll wait queue links
};
```
::: tip NOTE
The `epitem` structure is a completely internal kernel data structure.  
It is not user-facing, not exposed through any system call or header, and exists solely for the kernel’s internal bookkeeping of monitored file descriptors within an epoll instance.
:::


5. Crucially, this `epitem` is registered to the target file's [`poll table`](#poll-table).

::: tip NOTE
Every file descriptor in Linux (sockets, pipes, character devices, etc.) exposes a `poll` method through its `file_operations` (f_op->poll).
:::


### The Kernel Callback: `ep_poll_callback()` 

- Once a file descriptor is registered with epoll, the kernel associates it with an internal callback. When the state of that file descriptor changes—for example, when new data arrives    (`POLLIN`) or buffer space becomes available (`POLLOUT`)—the kernel invokes its own internal epoll callback function, `ep_poll_callback()`. 
- This callback:
  1. Enqueues the `epitem` into the **ready list** (`rdlist`) of the `eventpoll`.
  2. Wakes up any thread currently sleeping in `epoll_wait()` on this epoll instance.

### Waiting for Events: `epoll_wait()`

This system call blocks the process until any of the descriptors being monitored becomes ready for I/O events. And the process is woken up when the ready list is non-empty (via the kernel callback `ep_poll_callback()`).

```c
#include <sys/epoll.h>
int epoll_wait(int epfd, struct epoll_event *events, int maxevents, int timeout);
```

**Arguments:**

- `epfd`: The file descriptor of the epoll instance.
- `events`: A pointer to an array of `epoll_event` structures (this array need to be allocated in the user space). The kernel will store the events that occurred in this array.
- `maxevents`: The maximum number of events epoll_wait() may return in a single call. The kernel copies events from the epoll ready list (rdlist) until either the list is exhausted or maxevents entries have been filled. If more file descriptors are ready, they remain in the ready list and are returned by subsequent calls to epoll_wait().
- `timeout`: The maximum time (in milliseconds) to block. If `timeout` is `0`, the call will return immediately. If `timeout` is `-1`, the call will block indefinitely.


#### Internally:

1. **Kernel acquires the epoll lock and checks ready list**
   - If the `rdlist` (ready list) is non-empty, events are immediately returned.
   - Otherwise, the process goes to sleep in the `wait queue` (`ep->wq`).

2. **Sleep and wake mechanism**
   - If no events are ready, the process enters a sleep state via the kernel’s scheduler timeout mechanisms.
   - If any of the monitored FDs triggers its `poll` callback, the `ep_poll_callback()` runs.

When `epoll_wait()` wakes up, it iterates over the `rdlist`, copies the corresponding `epoll_event` structures to user space, and then clears or re-queues the `rdlist` depending on the trigger mode (LT or ET).

## Level triggered mode

In level-triggered mode, epoll reports a file descriptor as ready as long as the readiness condition persists. For EPOLLIN, readiness indicates that unread data is present in the kernel’s receive buffer; for EPOLLOUT, it indicates available space in the kernel’s send buffer. The file descriptor is returned by epoll_wait() on every call while these conditions remain true. Reading from the descriptor removes data from the receive buffer, and the descriptor continues to be reported until the buffer is fully drained. Similarly, writable events continue to be reported until the send buffer becomes full. 

As a result, level-triggered mode reflects the current I/O state of the file descriptor rather than changes in that state, which can lead to repeated notifications if the application does not complete the required I/O operations.

## Edge triggered mode

In edge-triggered mode, epoll reports events only when the readiness state changes (for example, when new data arrives on a socket that was previously empty). Once the event is delivered, epoll will not notify again until another state change occurs.

Because **ET does not repeat events**, the application must read or write until the operation returns `EAGAIN`; otherwise, data may remain unread with no further notifications.

ET reduces unnecessary wakeups and is useful for high-performance servers, but requires more careful programming. This mode is enabled by passing the `EPOLLET` flag when registering the file descriptor with `epoll_ctl()`.

::: tip NOTE
`EAGAIN` is a common error code returned by non-blocking I/O operations (e.g., `read`, `write`, `recv`, `send`) when the operation cannot be completed immediately without blocking the calling process. In the context of `epoll` with non-blocking sockets, especially in Edge-Triggered mode, receiving `EAGAIN` indicates that there is no more data to read or the write buffer is full, and you should stop attempting the operation until a new event is reported by `epoll_wait()`.
:::

## The Ready List Lifecycle

Each `epitem` (monitored FD) transitions through three stages:

| Stage          | Description                                      |
| :------------- | :----------------------------------------------- |
| **Registered** | In red-black tree, not ready yet                 |
| **Ready**      | Added to ready list after kernel callback        |
| **Delivered**  | Returned by `epoll_wait()`, removed or re-queued |

## Epoll’s Red-Black Tree (Interest List)

The red-black tree (`ep->rbr`) is used to maintain **unique FDs** with O(log n) lookups.
It ensures:

- No duplicate entries (`EPOLL_CTL_ADD` fails if already present).
- Fast modification (`EPOLL_CTL_MOD`).
- Quick removal (`EPOLL_CTL_DEL`).

The tree nodes (`rb_node`) are part of each `epitem`.
When you delete a file descriptor, the corresponding node is removed and freed.

## The Wait Queue (Process Sleep List)

Each `eventpoll` object has a `wait_queue_head_t wq`.
This queue holds all processes currently sleeping in `epoll_wait()`.

When `ep_poll_callback()` runs and pushes an event into `rdlist`, it calls:

```c
wake_up_interruptible(&ep->wq);
```

This triggers a scheduler wakeup for any sleeping threads, causing them to resume execution and return ready events.

## Performance and Locking

Epoll uses **[fine-grained spinlocks](#spin-lock)** (`ep->lock`) around its lists and trees.
Operations are O(1) per event and O(log n) for FD management.

This design ensures:

- Constant-time event delivery.
- Scalable to tens of thousands of FDs.

## Important Kernel Functions (for reference)

| Function                 | Purpose                                   |
| :----------------------- | :---------------------------------------- |
| `do_epoll_create()`      | Allocates and initializes `eventpoll`.    |
| `ep_insert()`            | Inserts new `epitem` into red-black tree. |
| `ep_remove()`            | Removes an `epitem` on `EPOLL_CTL_DEL`.   |
| `ep_poll_callback()`     | Called by kernel when FD becomes ready.   |
| `ep_send_events()`       | Copies ready events to user space.        |
| `ep_eventpoll_release()` | Cleans up on `close(epfd)` or `exit()`.   |

All defined in `fs/eventpoll.c` (Linux source).

## Lifecycle of an Epoll Readiness Event

When a socket receives new data:

1. The network stack updates its `sk_buff` queue.
2. The socket’s `poll()` function returns `POLLIN`.
3. Epoll’s registered callback (`ep_poll_callback`) runs.
4. The corresponding `epitem` moves to `rdlist`.
5. If a process is sleeping in `epoll_wait()`, it’s woken up.
6. Events are copied to user space, and control returns to the application.

## Summary Table

| Component     | Data Structure         | Purpose                           |
| :------------ | :--------------------- | :-------------------------------- |
| Interest list | Red-black tree (`rbr`) | Store registered FDs              |
| Ready list    | Linked list (`rdlist`) | Store active events               |
| Wait queue    | `wait_queue_head_t`    | Put sleeping processes            |
| FD node       | `epitem`               | Connects file to eventpoll        |
| Callback      | `ep_poll_callback()`   | Moves item to ready list + wakeup |

### Summary of chain of events:

When an application calls `epoll_wait()`, it essentially hands control to the kernel, asking it to monitor all file descriptors that were previously registered through `epoll_ctl()`. Inside the kernel, each epoll instance is represented by an eventpoll object, which contains three key components — a red-black tree (holding all registered file descriptors), a ready list (containing file descriptors that currently have pending I/O events), and a wait queue (where user processes sleep when there are no ready events). When `epoll_wait()` is invoked, if the ready list is empty, the calling process is put to sleep on the wait queue. Meanwhile, every file descriptor (socket, pipe, etc.) in the system maintains its own internal [`poll table`](#poll-table), a structure that records which epoll instances are interested in its state changes. When data arrives or an I/O state changes on any of those file descriptors, the kernel triggers the registered callback `ep_poll_callback()`. This callback runs in interrupt or softirq context, adds the corresponding `epitem` (representing that FD) to the eventpoll’s ready list, and then wakes up any processes sleeping on the epoll’s wait queue. Once the sleeping process wakes, `epoll_wait()` copies the list of ready events from the kernel’s ready list into user-space memory and returns control to the application with a list of file descriptors that are ready for I/O. 

Workflow of `epoll_wait()` :
![epoll_wait.png](/assets/resources/linux-epoll-wait.png)


## Glossary
### Callback

**Definition**  
A _callback_ is a kernel-registered function that the kernel invokes automatically when a specific internal event occurs.

**What happens in the Linux kernel**

-   During `epoll_ctl(EPOLL_CTL_ADD)`, epoll registers its internal function (`ep_poll_callback`) with the target file descriptor.
    
-   This registration occurs through the file’s poll mechanism.
    
-   The function pointer is stored inside kernel data structures associated with that file.
    
-   When the file’s readiness state changes (for example, data arrives on a socket), the kernel executes the callback directly.
    
-   The callback:
    
    1.  Adds the corresponding `epitem` to the epoll ready list.
        
    2.  Wakes up any thread sleeping in `epoll_wait()`.
        

**Important properties**

-   Executed entirely in kernel space.
    
-   Not explicitly called by user code.
    
-   May run in interrupt or softirq context.
    
-   Must not sleep.

### Poll Table

**Definition**  
A _poll table_ is a kernel data structure used to register interest in future readiness changes of a file descriptor.

**What happens in the Linux kernel**

-   When epoll registers a file descriptor, it calls the file’s `poll()` method.
    
-   A poll table object is passed to this method.
    
-   The file’s poll implementation:
    
    -   Adds epoll’s callback function to its internal wait queues.
        
-   These wait queues are monitored by the kernel.
    
-   When the file’s state changes, the kernel invokes all callbacks registered in the poll table.
    

**Why it exists**

-   It connects file state changes to epoll notifications.
    
-   It avoids repeated scanning of file descriptors.
    

----------

### Spin Lock

**Definition**  
A _spin lock_ is a low-level kernel lock that causes the CPU to repeatedly check a lock variable until it becomes available.

**What happens in the Linux kernel**

-   When a thread attempts to acquire a spin lock:
    
    -   If the lock is free, it is acquired immediately.
        
    -   If the lock is held, the CPU spins in a tight loop waiting for release.
        
-   The thread does not sleep while waiting.
    
-   Spin locks are used to protect short critical sections.
    

**Why epoll uses spin locks**

-   Epoll callbacks may run in interrupt or softirq context.
    
-   Sleeping is forbidden in these contexts.
    
-   Spin locks provide mutual exclusion without sleeping.
    

**Key constraints**

-   Must be held for very short durations.
    
-   Holding a spin lock for too long wastes CPU time.


### Interrupt Context (Hard Interrupt Context)

#### Definition

**Interrupt context** is a kernel execution context entered when the CPU receives a hardware interrupt signal. Code running in interrupt context executes immediately, preempting the currently running task, and is subject to strict execution constraints.

----------

#### How interrupt context is entered (step by step)

1.  The CPU is executing instructions (either user-space code or kernel code).
    
2.  A hardware device (e.g., network card, disk controller, timer) raises an interrupt signal.
    
3.  The CPU:
    
    -   Saves the current execution state (program counter, registers).
        
    -   Switches to kernel mode if not already in it.
        
    -   Jumps to a predefined interrupt handler registered by the kernel.
        
4.  The interrupt handler begins executing in **interrupt context**.
    
    
    #### What runs in interrupt context

-   Hardware interrupt handlers
    
-   Minimal device-handling code
    
-   Code that acknowledges the interrupt source
    
-   Code that schedules deferred work (such as softirqs)
    

Interrupt context code executes **without association to any user process or thread**.

#### Execution rules in interrupt context

The following rules are **strictly enforced**:

-   ❌ Sleeping is forbidden
    
-   ❌ Blocking is forbidden
    
-   ❌ Mutexes and other sleep-based locks are forbidden
    
-   ❌ Accessing user-space memory is forbidden
    

Allowed operations include:

-   Acquiring spin locks
    
-   Modifying small kernel data structures
    
-   Scheduling deferred work

#### Why sleeping is forbidden

Sleeping would require the kernel scheduler to:

-   Suspend the current execution
    
-   Switch to another runnable task
    

However, interrupt context:

-   Does not represent a schedulable task
    
-   Has no task state to save or resume
    

Sleeping in interrupt context would lead to kernel corruption or deadlock.

#### Relation to epoll

When a device event occurs (e.g., network packet arrival):

-   The interrupt handler detects the event
    
-   It does **not** perform full processing
    
-   It schedules deferred work (usually a softirq)
    
-   Epoll callbacks are never allowed to sleep because they may be triggered from interrupt-related paths

### Softirq Context

#### Definition

**Softirq context** is a kernel execution context used to perform deferred work that was triggered by a hardware interrupt but could not be safely or efficiently completed inside the interrupt handler itself.

----------

#### Why softirq exists

Hardware interrupt handlers must execute **very quickly**.  
However, many kernel subsystems (especially networking) require additional processing that:

-   Takes longer than acceptable in interrupt context
    
-   Still must run soon
    
-   Must not sleep
    

Softirqs provide a controlled way to defer this work.

#### How softirq context is entered 
1.  A hardware interrupt occurs.
    
2.  The interrupt handler:
    
    -   Performs minimal required work
        
    -   Schedules a softirq
        
3.  The interrupt handler returns.
    
4.  At a later point (often immediately after):
    
    -   The kernel executes the scheduled softirq
        
    -   This execution occurs in **softirq context**
        

Softirqs may execute:

-   On the same CPU
    
-   On a different CPU
    
-   Immediately after the interrupt
    
-   Or slightly later, depending on load
    

----------

#### What runs in softirq context

-   Network packet processing
    
-   Block I/O completion handling
    
-   Timer expiration handling
    
-   Parts of socket readiness processing
    
-   Epoll readiness propagation
    

Like interrupt context, softirq context is **not associated with a user process**.

#### Execution rules in softirq context

The rules are similar to interrupt context:

-   ❌ Sleeping is forbidden
    
-   ❌ Blocking is forbidden
    
-   ❌ Mutexes are forbidden
    

Allowed operations:

-   Acquiring spin locks
    
-   Iterating kernel queues
    
-   Updating kernel state
    
-   Waking sleeping processes
#### Relation to epoll

In the networking stack:

1.  A packet arrives → hardware interrupt
    
2.  Interrupt handler schedules networking softirq
    
3.  Softirq processes packet and updates socket state
    
4.  Socket becomes readable
    
5.  Epoll callback is triggered
    
6.  Epoll:
    
    -   Adds the corresponding `epitem` to the ready list
        
    -   Wakes sleeping processes in `epoll_wait()`
        

Because this chain runs through softirq context:

-   Epoll uses spin locks
    
-   Epoll callbacks never sleep
    
-   Epoll only performs minimal state updates
