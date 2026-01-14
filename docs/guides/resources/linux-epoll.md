# Linux Epoll

  

## Overview

  

Epoll is a Linux kernel feature used by programs to check when multiple file descriptors are ready for I/O.

Internally, epoll revolves around a kernel object called `eventpoll`.

  

### Key Components of `eventpoll` Object

The eventpoll structure is the main kernel data structure used to implement an epoll instance.

It contains several internal data structures that together manage file descriptor registration, event notification, and process sleeping and wake-up.

```c
struct eventpoll {

/* Wait queue for sys_epoll_wait() */
wait_queue_head_t wq;

/* List of ready file descriptors */
struct list_head rdlist;

/* Red-black tree root used to store monitored file descriptors */
struct rb_root_cached rbr;

/* Lock protecting eventpoll internal data structures from race conditions */
spinlock_t lock;

/* ... other fields ... */
};
```
The `lock` field is a spinlock used to serialize access to shared `eventpoll` state.
See **[Spinlock](#spinlock)** in the glossary for details.

### 1. The Wait Queue (`wq`)

The wait queue stores references to processes or threads that have called `epoll_wait()` and are currently blocked inside the kernel.

-   When a thread calls `epoll_wait()` and there are **no ready events**, the kernel:
    
    -   Adds the calling thread to this wait queue.
        
    -   Puts the thread to sleep.
        
-   The thread remains in the wait queue until one of the following occurs:
    
    -   An event happens on a monitored file descriptor.
        
    -   The timeout specified in `epoll_wait()` expires.
        
    -   The call is interrupted by a signal.

When an I/O event occurs on any monitored file descriptor:

-   The kernel wakes up the thread sleeping in this wait queue.
    
### 2. The Ready List (`rdlist`)

The ready list is a doubly linked list that contains entries for file descriptors that have pending events.

-   Each entry in the ready list corresponds to a monitored file descriptor for which at least one registered event condition is currently true (for example, data available to read).
    
-   When the kernel detects an event on a monitored file descriptor:
    
    -   The corresponding entry is added to the ready list (if it is not already present).

-   When `epoll_wait()` is called:
    
    -   The kernel checks whether the ready list is empty.
        
    -   If it is not empty, the kernel copies event information from the ready list into the user-provided buffer and returns immediately.
        
-   After events are reported:
    
    -   Entries may be removed from the ready list, depending on whether the file descriptor is using [level-triggered](#level-triggered-mode) or [edge-triggered mode](#edge-triggered-mode).

### 3. The Red-Black Tree (`rbr`)

The red-black tree stores **all file descriptors registered with the epoll instance**, regardless of whether they are currently ready.

-   Each node in the tree represents a monitored file descriptor along with the event mast specified by the user.
        
-   This tree allows the kernel to:
    
    -   Quickly find a file descriptor when an event occurs.
        
    -   Efficiently add, modify, or remove file descriptors.
        

Operations on this tree occur when `epoll_ctl()` is called:

-   `EPOLL_CTL_ADD` inserts a new node.
    
-   `EPOLL_CTL_MOD` updates an existing node.
    
-   `EPOLL_CTL_DEL` removes a node.
    

Because the structure is a red-black tree, these operations have **O(log n)** time complexity.

The red-black tree represents the **complete set of monitored file descriptors**, while the ready list represents only the subset that currently have events.


## How it works: The Lifecycle

  

### **Creating an Epoll instance**: `epoll_create1()`

  

```c
int  epoll_create1(int  flags)
```

  

This call returns a file descriptor representing the epoll instance. The descriptor is later used with epoll_ctl() to register file descriptors and with epoll_wait() to receive readiness events.

  

**flags** : The flags argument controls properties of the epoll file descriptor itself.

  

-  **EPOLL_CLOEXEC**: Sets the close-on-exec (FD_CLOEXEC) flag on the epoll file descriptor. When the process calls exec(), the kernel automatically closes the epoll descriptor,  it from being inherited by the new program image.

-  **0**: Creates the epoll instance without setting FD_CLOEXEC. In this case, the epoll file descriptor is inherited across fork() + exec(), which can unintentionally leak the  instance into child processes.  

**In almost all applications—especially servers and multi-process programs—EPOLL_CLOEXEC should be used to avoid file descriptor leaks.**

  
  

### **Registering a File Descriptor with Epoll**: `epoll_ctl()`

```c
#include<sys/epoll.h>
int  epoll_ctl(int  epfd, int  op, int  fd, struct epoll_event *event);
```

`epoll_ctl()` is used to add, modify, or remove a file descriptor from an epoll instance.  
It defines **which file descriptor to monitor** and **which I/O conditions on that file descriptor should generate events**.

### **Arguments**
-   **`epfd`**: A file descriptor referring to an epoll instance, as returned by `epoll_create()` or `epoll_create1()`.
    
-   **`op`**:  The operation to perform on the epoll instance:
    -   `EPOLL_CTL_ADD` – register a new file descriptor.
    -   `EPOLL_CTL_MOD` – change the event settings for an already registered file descriptor.
    -   `EPOLL_CTL_DEL` – remove a file descriptor from monitoring.
        
-   **`fd`**:  
    The target file descriptor to monitor.  
    This is typically a socket, pipe, or other I/O object that supports polling.
    
-   **`event`**  
    A pointer to a user-defined `struct epoll_event` that specifies:
    -   The **I/O conditions** the kernel should monitor for this file descriptor (for example, readiness for reading or writing), and
        
    -   A **user-defined value** that will be returned to user space when an event occurs. For example, an application may store the file descriptor itself or a pointer to another structure in `event->data`.
  

### User-Space Event Specification: `struct epoll_event`

  

The `epoll_event` structure is a data structure defined in `<sys/epoll.h>` that a program uses to tell the kernel which events it wants to monitor for a file descriptor and what data should be returned when those events occur.
  

```c
struct epoll_event {
	uint32_t events; /* Epoll events (eg: EPOLLIN,EPOLLOUT,EPOLLET) */
	epoll_data_t data; /* User data variable */
};

union epoll_data {
	void *ptr; /* Pointer to a user defined data structure */
	int fd; /* File descritor of the socket we are monitoring*/
	uint32_t u32; /* Not used within the scope of this project */
	uint64_t u64; /* Not used within the scope of this project */
};

typedef  union epoll_data epoll_data_t;
```

When `epoll_ctl()` is called:
-   The kernel **copies the contents** of this structure.
-   The copied data is stored internally as part of the epoll instance.
-   User space does not directly access or modify the kernel’s internal copy after registration.
  

### **The `events` Field**
The `events` field is a bitmask that specifies **which I/O readiness conditions should generate notifications** for the file descriptor.

Common event flags include:
-   **`EPOLLIN`**  
    Indicates that the file descriptor is ready for reading.  
    For example:
    -   Data is available to read on a socket.
    -   A read operation will not block.
        
-   **`EPOLLOUT`**  
    Indicates that the file descriptor is ready for writing.  
    For example:
    -   There is sufficient buffer space to send data.
    -   A write operation will not block.
        
-   **`EPOLLET`**  
    Enables edge-triggered notification behavior.  
    With this flag, events are reported only when the readiness state of the file descriptor changes.

Multiple event flags can be combined using the bitwise OR operator:
```c
event.events = EPOLLIN | EPOLLOUT | EPOLLET;
```

### **User Data Field: `epoll_data_t`**

The `data` field lets a program store certain values/struct along with a monitored file descriptor.

- The kernel does not use or modify this value/struct.
- The same value is returned by `epoll_wait()` when the file descriptor generates an event.
- The program uses this value to determine which file descriptor or connection caused the event.


--------------

  

### Kernel-Side Registration (`EPOLL_CTL_ADD`)

  

When a file descriptor is added using:

  

```c
epoll_ctl(epfd, EPOLL_CTL_ADD, fd, &event);`
```

The kernel performs the following steps:

1. Searches the epoll instance’s red-black tree to check whether the file descriptor is already registered.

2. If not found, allocates a new internal entry (`struct epitem`).

3. Copies the user-provided `struct epoll_event` into the kernel-owned `epitem`.

4. Inserts the new `epitem` into the red-black tree for efficient lookup.

5. Crucially, this `epitem` is registered to the target file's [`poll table`](#poll-table).
  
### Internal Kernel Representation: `struct epitem`

`struct epitem` is the kernel’s internal representation of a single file descriptor registered with an epoll instance.  
Each `epitem` corresponds to **one `(epoll instance, file descriptor)` pair**.

```c
struct epitem {
	struct rb_node rbn; // for red-black tree
	
	struct list_head rdllink; // for ready list

	struct epoll_filefd ffd; // target fd + file pointer

	struct eventpoll *ep; // back-pointer to eventpoll

	struct epoll_event event; // user's event mask

	struct list_head pwqlist; // poll wait queue links
};
```
### Field descriptions
-   **`rbn`**: Links the entry into the epoll instance’s red-black tree, which stores all registered file descriptors.

-   **`rdllink`**: Links the entry into the ready list when the file descriptor has pending events.

-   **`ffd`**: Stores the target file descriptor and its associated kernel file object.

-   **`ep`**: Points back to the epoll instance that owns this entry.

-   **`event`**: Contains a copy of the user-provided event mask and user data.

-   **`pwqlist`** : tracks the kernel callbacks that notify epoll of state changes for this file descriptor.

::: tip NOTE

The `epitem` structure is a completely internal kernel data structure.

It is not user-facing, not exposed through any system call or header, and exists solely for the kernel’s internal bookkeeping of monitored file descriptors within an epoll instance.

:::


### The Kernel Callback: `ep_poll_callback()` 

When a file descriptor is registered with epoll, the kernel registers an internal callback function, `ep_poll_callback()`, on the file’s poll wait queues. This callback is invoked by the kernel whenever the file’s I/O state changes, such as when data becomes available to read or when buffer space becomes available for writing.

The purpose of `ep_poll_callback()` is **not** to determine which specific event occurred or to return events to user space. Its role is limited to notifying the epoll subsystem that the state of a monitored file descriptor may have changed.

When `ep_poll_callback()` is invoked, it first identifies the `epitem` corresponding to the file descriptor where a state change occurred. It then checks whether this `epitem` has already been recorded as ready. If it has not, the callback inserts the `epitem` into the epoll instance’s ready list (`rdlist`). This step ensures that each ready file descriptor is recorded only once until it is processed by `epoll_wait()`.

After updating the ready list, the callback wakes up any processes or threads that are currently sleeping in `epoll_wait()` on the same epoll instance. This wakeup causes those processes to resume execution inside the kernel and recheck the ready list.

Importantly, `ep_poll_callback()` does not evaluate event flags such as `EPOLLIN` or `EPOLLOUT`. Instead, it merely signals that a state change has occurred.

In summary, `ep_poll_callback()` acts as a notification mechanism that records potential readiness and triggers wakeups, while the final event filtering and delivery are handled by `epoll_wait()`.  

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


### Internally: How `epoll_wait()` Works in the Kernel

When a process calls `epoll_wait()`, execution enters the kernel and operates on the `eventpoll` structure associated with the epoll file descriptor.
  
The kernel first acquires the epoll instance’s internal lock to serialize access to its shared state. It then checks the epoll instance’s ready list (`rdlist`), which contains entries (`epitem` objects) for file descriptors that have already been marked as ready by the kernel.

If the ready list is not empty, the kernel does not put the process to sleep. Instead, it immediately proceeds to copy event information from the ready list into the user-supplied `events` array. For each ready entry, the kernel copies the stored `struct epoll_event` from the corresponding `epitem` until either the ready list is exhausted or the `maxevents` limit is reached.

If the ready list is empty, the kernel prepares to block the calling process. The process is added to the epoll instance’s wait queue (`ep->wq`), and the scheduler puts the process to sleep. At this point, the process does not consume CPU time and remains blocked inside `epoll_wait()`.

While the process is sleeping, monitored file descriptors may change state. When such a change occurs, the kernel invokes the epoll callback function (`ep_poll_callback()`). This callback does not return events to user space directly. Instead, it marks the corresponding `epitem` as ready by inserting it into the epoll instance’s ready list and then wakes up any processes sleeping in the epoll wait queue.

Once the sleeping process is woken, execution resumes inside `epoll_wait()`. The kernel again acquires the epoll lock and rechecks the ready list. If entries are present, the kernel iterates over them and copies their associated `struct epoll_event` data into the user-space `events` array.

After copying events, the kernel updates the ready list based on the triggering mode. In level-triggered mode, entries may remain in the ready list if the file descriptor is still ready. In edge-triggered mode, entries are removed and will only be reinserted when a new state change occurs.

Finally, the kernel releases the epoll lock and returns to user space, with `epoll_wait()` returning the number of events copied into the `events` array.

Note: `epoll_wait()` itself does not detect I/O readiness; it only consumes events that were previously recorded in the ready list by kernel callbacks.

  

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

## Epitem Lifecycle

Each `epitem` (monitored FD) transitions through three stages:

| Stage | Description |
| :---- | :---- |
| **Registered** | In red-black tree, not ready yet |
| **Ready** | Added to ready list after kernel callback |
| **Delivered** | Returned by `epoll_wait()`, removed or re-queued |

## Lifecycle of an Epoll Readiness Event

When a socket receives new data:

1. The network stack updates its `sk_buff` queue.
2. The socket’s `poll()` function returns `POLLIN`.
3. Epoll’s registered callback (`ep_poll_callback`) runs.
4. The corresponding `epitem` moves to `rdlist`.
5. If a process is sleeping in `epoll_wait()`, it’s woken up.
6. Events are copied to user space, and control returns to the application.

## Summary Table

| Component | Data Structure | Purpose |
| :---- | :---- | :---- |
| Interest list | Red-black tree (`rbr`) | Store registered FDs |
| Ready list | Linked list (`rdlist`) | Store active events |
| Wait queue | `wait_queue_head_t` | Put sleeping processes |
| FD node | `epitem` | Connects file to eventpoll |
| Callback | `ep_poll_callback()` | Moves item to ready list + wakeup |

### Summary of chain of events:

When an application calls `epoll_wait()`, it essentially hands control to the kernel, asking it to monitor all file descriptors that were previously registered through `epoll_ctl()`. Inside the kernel, each epoll instance is represented by an eventpoll object, which contains three key components — a red-black tree (holding all registered file descriptors), a ready list (containing file descriptors that currently have pending I/O events), and a wait queue (where user processes sleep when there are no ready events). When `epoll_wait()` is invoked, if the ready list is empty, the calling process is put to sleep on the wait queue. Meanwhile, every file descriptor (socket, pipe, etc.) in the system maintains its own internal [`poll table`](#poll-table), a structure that records which epoll instances are interested in its state changes. When data arrives or an I/O state changes on any of those file descriptors, the kernel triggers the registered callback `ep_poll_callback()`. This callback runs in interrupt or softirq context, adds the corresponding `epitem` (representing that FD) to the eventpoll’s ready list, and then wakes up any processes sleeping on the epoll’s wait queue. Once the sleeping process wakes, `epoll_wait()` copies the list of ready events from the kernel’s ready list into user-space memory and returns control to the application with a list of file descriptors that are ready for I/O. 

Workflow of `epoll_wait()` :
![epoll_wait.png](/assets/resources/linux-epoll-wait.png)


# Glossary

## Callback

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

## Poll Table

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

## spinlock

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


## Interrupt Context (Hard Interrupt Context)

### Definition

**Interrupt context** is a kernel execution context entered when the CPU receives a hardware interrupt signal. Code running in interrupt context executes immediately, preempting the currently running task, and is subject to strict execution constraints.

----------

### How interrupt context is entered (step by step)

1.  The CPU is executing instructions (either user-space code or kernel code).
    
2.  A hardware device (e.g., network card, disk controller, timer) raises an interrupt signal.
    
3.  The CPU:
    
    -   Saves the current execution state (program counter, registers).
        
    -   Switches to kernel mode if not already in it.
        
    -   Jumps to a predefined interrupt handler registered by the kernel.
        
4.  The interrupt handler begins executing in **interrupt context**.
    
    
    ### What runs in interrupt context

-   Hardware interrupt handlers
    
-   Minimal device-handling code
    
-   Code that acknowledges the interrupt source
    
-   Code that schedules deferred work (such as softirqs)
    

Interrupt context code executes **without association to any user process or thread**.

### Execution rules in interrupt context

The following rules are **strictly enforced**:

-   ❌ Sleeping is forbidden
    
-   ❌ Blocking is forbidden
    
-   ❌ Mutexes and other sleep-based locks are forbidden
    
-   ❌ Accessing user-space memory is forbidden
    

Allowed operations include:

-   Acquiring spin locks
    
-   Modifying small kernel data structures
    
-   Scheduling deferred work

### Why sleeping is forbidden

Sleeping would require the kernel scheduler to:

-   Suspend the current execution
    
-   Switch to another runnable task
    

However, interrupt context:

-   Does not represent a schedulable task
    
-   Has no task state to save or resume
    

Sleeping in interrupt context would lead to kernel corruption or deadlock.

### Relation to epoll

When a device event occurs (e.g., network packet arrival):

-   The interrupt handler detects the event
    
-   It does **not** perform full processing
    
-   It schedules deferred work (usually a softirq)
    
-   Epoll callbacks are never allowed to sleep because they may be triggered from interrupt-related paths

## Softirq Context

### Definition

**Softirq context** is a kernel execution context used to perform deferred work that was triggered by a hardware interrupt but could not be safely or efficiently completed inside the interrupt handler itself.

----------

### Why softirq exists

Hardware interrupt handlers must execute **very quickly**.  
However, many kernel subsystems (especially networking) require additional processing that:

-   Takes longer than acceptable in interrupt context
    
-   Still must run soon
    
-   Must not sleep
    

Softirqs provide a controlled way to defer this work.

### How softirq context is entered 
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

### What runs in softirq context

-   Network packet processing
    
-   Block I/O completion handling
    
-   Timer expiration handling
    
-   Parts of socket readiness processing
    
-   Epoll readiness propagation
    

Like interrupt context, softirq context is **not associated with a user process**.

### Execution rules in softirq context

The rules are similar to interrupt context:

-   ❌ Sleeping is forbidden
    
-   ❌ Blocking is forbidden
    
-   ❌ Mutexes are forbidden
    

Allowed operations:

-   Acquiring spin locks
    
-   Iterating kernel queues
    
-   Updating kernel state
    
-   Waking sleeping processes
### Relation to epoll

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