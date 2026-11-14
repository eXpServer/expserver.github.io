# Stage 21: Request Timeouts

## Recap

In the previous stages, we extended eXpServer with several features to improve its HTTP request handling and reverse proxy capabilities. We implemented load balancing in Stage 20, allowing the reverse proxy to distribute incoming requests across multiple upstream servers using round-robin and IP-hash strategies.

However, there was still an important problem with request processing. A client session could remain active even when its request stopped making progress. For example, a request could become stuck while waiting for an intermediate processing operation to complete.

Without a timeout mechanism, such sessions could continue occupying server resources indefinitely.

In this stage, we implement **request timeout support** by introducing a timer module and integrating it with the existing event loop. The timer monitors session activity and allows the server to destroy sessions that remain inactive beyond a specified duration.

## Learning Objectives

- Understand why request timeouts are necessary in a web server.
- Implement a timer module to manage timer creation, destruction, and updates.
- Integrate timer management with the existing event loop.
- Calculate event loop timeouts based on the nearest timer expiration.
- Implement session timeout handling.
- Reset session timers when client activity occurs.
- Understand how timeouts prevent sessions from remaining stuck during request processing.

## Introduction

Consider a situation where a client sends an HTTP request to eXpServer.

The request enters the server's processing pipeline and passes through different stages. During processing, the session might have to wait for an operation to complete before it can proceed.

If an intermediate stage gets stuck and no further client activity occurs, the session may remain allocated without making progress.

This can lead to unnecessary resource consumption, particularly when multiple sessions become stuck simultaneously.

To address this problem, we introduce a **session-level request timeout mechanism**.

A timeout specifies the maximum period for which a session can remain inactive before the server terminates it.

In this stage, we introduce a default timeout of 60 seconds.

The general flow is:

![flow.png](/assets/stage-21/flow.png)

The timer is associated with the client session. Whenever the relevant client-side read or write activity occurs, the timer is reset.

If the session remains inactive until the timer expires, the associated callback destroys the session.

**Note:** This implementation uses one timer per session. It does not create a separate timer for every intermediate processing stage. It provides a timeout boundary for a session that stops making progress.

## Implementation

### Timer Module

We create a new module called `xps_timer` to manage timers within the server.

The timer module provides functions to create, destroy, and update timers. These timers are maintained by the core and processed as part of the event loop.

#### `src/core/xps_timer.h`

This header file contains the definition of the `xps_timer_t` structure and declarations of the timer-related functions.

The timer module provides the following functions:

- `xps_timer_create()` - Allocates and initializes a timer.
- `xps_timer_destroy()` - Destroys a timer, releases its resources, and handles its removal from the core.
- `xps_timer_update()` - Resets the timer expiration based on the current time.

The timer structure maintains information such as:

- A pointer to the core managing the timer.
- The expiration time.
- The associated session or object.
- The callback to invoke when the timer expires.
- Time-related information used by the timer implementation.

#### `src/core/xps_timer.c`

This file contains the implementation of the timer operations.

**`xps_timer_create()`**

This function creates a new timer and associates it with the server core.

The timer's initial expiration is calculated using the current time maintained by the core and the requested duration.

Once initialized, the timer is registered in the core's timer list so that the event loop can monitor it.

**`xps_timer_destroy()`**

This function destroys a timer and releases its allocated memory.

It also handles removing the timer from the core's timer list.

Instead of necessarily removing an element from the middle of the vector, the implementation can mark its entry as `NULL` and maintain a count of null entries.

This allows timer cleanup to be handled without unnecessarily shifting the remaining vector elements.

**`xps_timer_update()`**

This function resets the expiration time of an existing timer.

The new expiration is calculated using the current time maintained by the core and the specified duration.

This allows a session to extend its timeout whenever relevant activity occurs.

---

### `src/core/xps_core.h`

The core structure is responsible for maintaining the server's runtime state.

We extend `xps_core_t` with additional fields required for timer management and time tracking.

The following fields are added:

```c
vec_void_t timers;

u_long curr_time_msec;
u_long init_time_msec;
```

- `timers` - Maintains the list of timers associated with the core.
- `curr_time_msec` - Stores the current time in milliseconds. This value is cached and updated during event loop iterations.
- `init_time_msec` - Stores the server initialization time in milliseconds.

These fields allow the core to maintain a centralized timer list and provide a common time reference for timer operations.

### `src/core/xps_core.c`

In this file, we introduce a new function to update the current time maintained by the core.

**`xps_core_update_time()`**

This function retrieves the current system time using `gettimeofday()` and updates `curr_time_msec`.

```c
xps_core_update_time();
```

Instead of retrieving the system time independently whenever a timer operation is performed, the core maintains a cached time value that can be reused during the current event loop iteration.

We also update the core creation and destruction functions to initialize and release the timer list.

- During core creation, the timer list and time-related fields are initialized.
- During core destruction, the active timers and timer list are cleaned up.

---

### `src/core/xps_loop.c`

The event loop is responsible for monitoring file descriptors and dispatching events using `epoll`.

In this stage, we extend the event loop to handle timer expiration.

#### Updating Time

We call `xps_core_update_time()` at two places:

- At the beginning of `xps_loop_run()`.
- Immediately after `epoll_wait()` returns.

This ensures that the core maintains an updated time value while processing events.

#### `handle_timers()`

We introduce a function called `handle_timers()` to process active timers.

This function iterates through the core's timer list and checks whether any timer has expired.

When a timer expires, its associated callback function is invoked.



For a session timer, the callback is responsible for handling the timed-out session.

Care must be taken when invoking callbacks because a callback may destroy the timer or the associated session. The timer iteration must therefore handle changes to the timer list safely.

#### Calculating `epoll_wait()` Timeout

Previously, the event loop could wait for events without considering pending timer expirations.

Now, we calculate the timeout argument passed to `epoll_wait()` based on the nearest timer expiration.

This ensures that the event loop wakes up when the next timer is due, even if no file descriptor events occur.

The timeout is determined by comparing the nearest timer expiration with the current time.



After `epoll_wait()` returns, the current time is updated and `handle_timers()` checks for expired timers.

---

### `src/core/xps_session.h`

We extend the `xps_session_t` structure by adding a timer pointer.

```c
xps_timer_t *timer;
```

This associates a timer with each client session.

The timer monitors the inactivity period of the corresponding session during request processing.

### `src/core/xps_session.c`

In this file, we integrate timer management with the session lifecycle and client event handlers.

#### Initializing the Session Timer

When a new session is created, we initialize a timer using the default HTTP request timeout.

```c
DEFAULT_HTTP_REQ_TIMEOUT_MSEC
```

The default timeout is 60 seconds (60000 milliseconds).

The timer is associated with the session and configured with `session_timer_handler()` as its callback.

If timer creation fails, the session creation process must handle the failure and release any resources that have already been allocated.

#### `session_timer_handler()`

This function is invoked when the session timer expires.

It receives the associated session through the callback argument.

When the timeout occurs, the handler logs the timeout event and destroys the corresponding session.

This ensures that a session that remains inactive during request processing does not occupy server resources indefinitely.

#### Resetting the Timer

We reset the session timer whenever relevant client-side activity occurs.

This is implemented through calls to `xps_timer_update()` in the following event handlers:

- **`client_sink_handler()`** - Resets the timer when data is read from the client.
- **`client_source_handler()`** - Resets the timer when data is written to the client.

Therefore, the session receives a fresh timeout period when these client-side operations take place.

The overall flow is:

```text
             Session Created
                    |
                    v
              Start 60s Timer
                    |
                    v
             Request Processing
                    |
                    v
          Intermediate Processing
                    |
             +------+------+
             |             |
          Activity      No Activity
             |             |
             v             v
        Reset Timer    Timer Expires
                           |
                           v
                     Invoke Callback
                           |
                           v
                    Destroy Session
```

---

### `src/xps.h` and `src/utils/xps_utils.c`

We make utility-level changes to support time tracking.

#### Header Updates

The following headers are added to `src/xps.h`:

```c
#include <sys/time.h>
#include <time.h>
```

These provide the time-related structures and functions required by the timer implementation.

#### Default Timeout Constant

We introduce a constant to define the default HTTP request timeout:

```c
#define DEFAULT_HTTP_REQ_TIMEOUT_MSEC 60000
```

The value is specified in milliseconds.

Therefore:

```text
60000 milliseconds = 60 seconds
```

#### `timeval_to_msec()`

We introduce a helper function in `xps_utils.c` to convert a `struct timeval` into milliseconds.

The `gettimeofday()` function provides time in seconds and microseconds.

This helper converts that representation into milliseconds so that the timer module can perform its time calculations using a consistent unit.

---

## Milestone #1

Build the server with the newly implemented timer module.

Run eXpServer and establish a client connection.

Verify that the server initializes a 60-second timer for the newly created session.

Keep the session inactive and observe whether the server destroys it after the timeout expires.

If the implementation is correct, inactive sessions should be automatically destroyed when their timers expire.

## Experiments

### Experiment #1: Idle Session Timeout

Test the default session timeout.

1. Start the server.
2. Establish a client connection.
3. Do not send any data.
4. Wait for approximately 60 seconds.
5. Observe the server logs.

**Expected behavior:** The server automatically closes the inactive client session after the configured timeout.

### Experiment #2: Client Activity Resets the Timer

Test whether client activity resets the session timer.

1. Establish a client connection.
2. Allow some time to pass without sending data.
3. Before the timeout expires, send a complete HTTP request.
4. Observe whether the request is processed successfully.

For example, if the client sends a request after 30 seconds, the server should process the request and the corresponding client-side read activity should update the session timer.

**Expected behavior:** The request should be processed successfully. The timer update should be triggered by the client activity.

Note that this experiment does not require the connection to remain open after the HTTP response. The server can close the connection according to its existing request lifecycle.

### Experiment #3: Timeout During a Stuck Intermediate Processing Stage

Test whether the timeout mechanism can clean up a session when request processing becomes stuck at an intermediate stage.

1. Start the server with the timeout mechanism enabled.
2. Trigger a request that reaches the intermediate processing stage being tested.
3. Make the intermediate stage remain blocked or prevent it from making further progress.
4. Observe the session and timer behavior.
5. Wait for the configured timeout period.

**Expected behavior:** If the session receives no relevant client-side activity and its timer is not reset, the timer should expire and the associated callback should destroy the session.

This experiment verifies that the timeout mechanism prevents a stalled request-processing session from remaining allocated indefinitely.

### Experiment #4: Multiple Independent Sessions

Test timeout handling with multiple client sessions.

1. Establish multiple client connections.
2. Allow them to remain inactive.
3. Observe the expiration of their respective timers.
4. Verify that the expiration of one session does not affect the other sessions.

**Expected behavior:** Each session is managed independently. When a session's timer expires, only its associated session should be destroyed.

---

## Conclusion

In this stage, we implemented request timeout support in eXpServer by introducing a dedicated timer module and integrating it with the existing event loop.

We extended the core structure to maintain active timers and track the current time. We also modified the event loop to identify expired timers and dynamically calculate the timeout for `epoll_wait()` based on the nearest timer expiration.

At the session level, we introduced a default timeout of 60 seconds. Each session maintains its own timer, which is updated whenever relevant client-side read or write activity occurs.

If a session remains inactive and its request processing becomes stuck, the timer eventually expires and the corresponding callback destroys the session.

With this implementation, eXpServer can detect stalled sessions and release their resources instead of allowing them to remain allocated indefinitely.