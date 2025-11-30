# Linux Epoll

## Overview

Epoll is not just a user-space API, it’s a kernel subsystem that maintains a persistent, event-driven mechanism to monitor I/O readiness of multiple file descriptors.

Internally, epoll revolves around a kernel object called `eventpoll`.

### Key Components of `eventpoll` Object

#### 1. The Wait Queue (`wq`)
This queue holds the list of processes (threads) that are currently blocked in `epoll_wait()`, waiting for an event to occur. When an event happens, the kernel wakes up the processes in this queue.

#### 2. The Ready List (`rdlist`)
This is a **doubly linked list** that stores the file descriptors (FDs) that are currently "ready" (i.e., have data to read or space to write).
- When an event occurs on a monitored FD, it is added to this list.
- `epoll_wait()` simply checks this list. If it's not empty, it returns the events to the user.

#### 3. The Red-Black Tree (`rbr`)
This is a **Red-Black Tree** that stores all the file descriptors currently being monitored by this epoll instance.
- It allows for efficient **insertion, deletion, and search** of file descriptors (O(log n)).
- When you call `epoll_ctl()` to add or remove an FD, the kernel modifies this tree.

## How it works: The Lifecycle

### **Creating an Epoll instance**: `epoll_create()`

```c
int epoll_create1(int flags)
```

Here the flags can be either `0` or `EPOLL_CLOEXEC`

If the flag is set to zero, this function behaves like the older `epoll_create()` API, but without its obsolete size argument (as size is now dynamically managed by kernel).

If the flag is set to `EPOLL_CLOEXEC`, it will inform the kernel to set the close-on-exec (`FD_CLOEXEC`) flag on this epoll file descriptor. So if your process later calls `exec()` (e.g., `execvp()` after a `fork()`), the epoll FD will automatically be closed in the child process. This prevents leaking file descriptors into executed programs.

When you call `epoll_create1(0)`, the kernel allocates a new `eventpoll` object in kernel memory. This object is the heart of the epoll instance and contains the following key members:

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

Finally, a file descriptor is returned to the user-space referencing this `eventpoll` object. Applications can use this descriptor with `epoll_ctl()` and `epoll_wait()` to manage monitored file descriptors and retrieve events. 

### **Registering a File Descriptor with Epoll**: `epoll_ctl()`

```c
#include<sys/epoll.h>
int epoll_ctl(int epfd, int op, int fd, struct epoll_event *event);
```
**Arguments:**

- `epfd`: The file descriptor of the epoll instance.
- `op`: The operation to be performed (e.g., `EPOLL_CTL_ADD`, `EPOLL_CTL_MOD`, `EPOLL_CTL_DEL`).
- `fd`: The target file descriptor to monitor.
- `event`: A pointer to an `epoll_event` structure that specifies the events to monitor (e.g., `EPOLLIN`, `EPOLLOUT`) and any user data associated with the file descriptor.


When you add a file descriptor using `epoll_ctl(..., EPOLL_CTL_ADD, ...)`:

1. The kernel searches the **Red-Black Tree** to see if the FD is already registered.
2. If not found, it creates a new entry (an `epitem` structure) and inserts it into the tree.

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

3. Crucially, this `epitem` is registered to the target file's `poll` table via a function `ep_ptable_queue_proc()`. This function is what bridges the gap between the hardware/driver and epoll.

::: tip NOTE
Every file descriptor in Linux (sockets, pipes, character devices, etc.) exposes a `poll` method through its `file_operations` (f_op->poll).
:::

4. On successful completion, `epoll_ctl()` returns `0`.

### **The Kernel Callback**: `ep_poll_callback()`

This is the magic glue.
- Once a file registered with epoll, any time the file’s state changes, e.g., new data arrives (`POLLIN`) or buffer space becomes available (`POLLOUT`), the kernel invokes epoll’s callback: `ep_poll_callback()`.
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
- `maxevents`: The maximum number of events to return. This is the size of the `events` array.
- `timeout`: The maximum time (in milliseconds) to block. If `timeout` is `0`, the call will return immediately. If `timeout` is `-1`, the call will block indefinitely.

When your process calls `epoll_wait(epfd, events, maxevents, timeout)`, the kernel will execute:

```c
SYSCALL_DEFINE4(epoll_wait, int, epfd, struct epoll_event __user *, events, int, maxevents, int, timeout)
```

#### Internally:

1. **Kernel acquires lock and checks ready list**
   - If the `rdlist` (ready list) is non-empty, events are immediately returned.
   - Otherwise, the process goes to sleep in the `wait queue` (`ep->wq`).

2. **Sleep and wake mechanism**
   - If no events are ready, the process enters a sleep state via the kernel’s scheduler timeout mechanisms.
   - If any of the monitored FDs triggers its `poll` callback, the `ep_poll_callback()` runs.

When `epoll_wait()` wakes up, it iterates over the `rdlist`, copies the corresponding `epoll_event` structures to user space, and then clears or re-queues the `rdlist` depending on the trigger mode (LT or ET).

## Level triggered mode

In level-triggered mode, epoll reports an event as long as any of the file descriptors in the `rdlist` of epoll is ready. If a socket has unread data in its receive buffer, every call to `epoll_wait()` will continue to return it until the data is consumed.

This mode is easier to use and ensures events are not missed, but may generate repeated notifications if the application does not fully drain the file descriptor.

## Edge triggered mode

In edge-triggered mode, epoll reports events only when the readiness state changes (for example, when new data arrives on a socket that was previously empty). Once the event is delivered, epoll will not notify again until another state change occurs.

Because **ET does not repeat events**, the application must read or write until the operation returns `EAGAIN`; otherwise, data may remain unread with no further notifications.

ET reduces unnecessary wakeups and is useful for high-performance servers, but requires more careful programming. This mode is enabled by passing the `EPOLLET` flag when registering the file descriptor with `epoll_ctl()`. 

::: tip NOTE
`EAGAIN` is a common error code returned by non-blocking I/O operations (e.g., `read`, `write`, `recv`, `send`) when the operation cannot be completed immediately without blocking the calling process. In the context of `epoll` with non-blocking sockets, especially in Edge-Triggered mode, receiving `EAGAIN` indicates that there is no more data to read or the write buffer is full, and you should stop attempting the operation until a new event is reported by `epoll_wait()`.
:::

## The Ready List Lifecycle

Each `epitem` (monitored FD) transitions through three stages:

| Stage | Description |
| :---- | :---- |
| **Registered** | In red-black tree, not ready yet |
| **Ready** | Added to ready list after kernel callback |
| **Delivered** | Returned by `epoll_wait()`, removed or re-queued |

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

## Recursive Epoll (Nested Instances)

Linux allows **epoll of epoll** (monitoring another epoll FD).
The kernel prevents deadlocks and loops by marking epoll files with flags (`EPOLLWAKEUP`, `EPOLLEXCLUSIVE`) and limiting recursion depth.

This is handled carefully in `fs/eventpoll.c` using checks like:

```c
if (is_file_epoll(file))
    error = -EINVAL;
```

unless explicit recursion is enabled.

## Performance and Locking

Epoll uses **fine-grained spinlocks** (`ep->lock`) around its lists and trees.
Operations are O(1) per event and O(log n) for FD management.

This design ensures:

- Constant-time event delivery.
- Scalable to tens of thousands of FDs.
- Lock contention only on wakeups (not on every syscall).

## Important Kernel Functions (for reference)

| Function | Purpose |
| :---- | :---- |
| `do_epoll_create()` | Allocates and initializes `eventpoll`. |
| `ep_insert()` | Inserts new `epitem` into red-black tree. |
| `ep_remove()` | Removes an `epitem` on `EPOLL_CTL_DEL`. |
| `ep_poll_callback()` | Called by kernel when FD becomes ready. |
| `ep_send_events()` | Copies ready events to user space. |
| `ep_eventpoll_release()` | Cleans up on `close(epfd)` or `exit()`. |

All defined in `fs/eventpoll.c` (Linux source).

## Understanding Readiness Propagation

When a socket receives new data:

1. The network stack updates its `sk_buff` queue.
2. The socket’s `poll()` function returns `POLLIN`.
3. Epoll’s registered callback (`ep_poll_callback`) runs.
4. The corresponding `epitem` moves to `rdlist`.
5. If a process is sleeping in `epoll_wait()`, it’s woken up.
6. Events are copied to user space, and control returns to the application.

This cycle is **non-blocking** and **fully asynchronous** — the kernel only wakes up the process when there’s meaningful work to do.

## Closing the Loop

When the application closes a monitored FD:

- The kernel calls `ep_remove()` to unlink its `epitem` from all lists.
- The callback hooks are detached.
- Memory is freed safely even if wakeups are pending.

## Summary Table

| Component | Data Structure | Purpose |
| :---- | :---- | :---- |
| Interest list | Red-black tree (`rbr`) | Store registered FDs |
| Ready list | Linked list (`rdlist`) | Store active events |
| Wait queue | `wait_queue_head_t` | Put sleeping processes |
| FD node | `epitem` | Connects file to eventpoll |
| Callback | `ep_poll_callback()` | Moves item to ready list + wakeup |

### Summary of chain of events:

When an application calls `epoll_wait()`, it essentially hands control to the kernel, asking it to monitor all file descriptors that were previously registered through `epoll_ctl()`. Inside the kernel, each epoll instance is represented by an eventpoll object, which contains three key components — a red-black tree (holding all registered file descriptors), a ready list (containing file descriptors that currently have pending I/O events), and a wait queue (where user processes sleep when there are no ready events). When `epoll_wait()` is invoked, if the ready list is empty, the calling process is put to sleep on the wait queue. Meanwhile, every file descriptor (socket, pipe, etc.) in the system maintains its own internal `poll table`, a structure that records which epoll instances are interested in its state changes. When data arrives or an I/O state changes on any of those file descriptors, the kernel triggers the registered callback `ep_poll_callback()`. This callback runs in interrupt or softirq context, adds the corresponding `epitem` (representing that FD) to the eventpoll’s ready list, and then wakes up any processes sleeping on the epoll’s wait queue. Once the sleeping process wakes, `epoll_wait()` copies the list of ready events from the kernel’s ready list into user-space memory and returns control to the application with a list of file descriptors that are ready for I/O. 

Thus, the sequence forms a complete chain: the application waits → the kernel monitors the interest list → a file event triggers the callback → the ready list is updated → the process is woken up → and finally, ready events are delivered back to the user space.