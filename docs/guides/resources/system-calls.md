# System calls

This page briefly describes the programming interface of some of the Unix/Linux system calls that will be used in the eXpServer project.   

## Fork()

The [`Fork()`](https://en.wikipedia.org/wiki/Fork_(system_call)) system call is used for creating a new process (child process) which runs concurrently with the process that makes the `fork()` call  (parent process). With forking, the operating system creates a **child process**, which is an exact copy of the **parent process**. This includes copying the process's memory, file descriptors, and execution context, stack and heap. The parent process and child process run in separate memory address spaces. After a new child process is created, both processes will execute the next instruction following the `fork()` system call.

```c
#include <unistd.h>
pid_t fork(void);
```

- **`pid = fork()`**: This creates a new process. The return value is stored in `pid` (integer).
- **Child Process**:  `fork()` returns `0`
- **Parent Process**:  `fork()` returns a positive value (the PID of the child process)
- **Error Handling**: If `fork()` returns a negative value, it indicates that the process creation is failed.

**Use Case**:

- The `fork()` system call is often used in server applications to handle multiple clients concurrently by creating a new process that handles communication with each client.

## wait()

`wait()` blocks the calling process until one of its child processes exits or a [signal](https://en.wikipedia.org/wiki/C_signal_handling) is received. If `wait()` returns after some child process terminates, the PID of the child is returned by `wait()`  (If a process unblocks from `wait()` due to a signal, -1 is the return value.  We don't need this case in our project).  After return from `wait()`, the parent continues its execution from the next instruction after the `wait()` system call. `wait()` requires an integer pointer argument in which the exit status of the child is stored (relevant only if `wait()` unblocks due to termination of a child). The caller is supposed to allocate the memory for the pointer argument before the calls. In this project, we will not require the [exit status](https://en.wikipedia.org/wiki/Exit_status) of the child and will pass NULL instead.    

```c
#include <sys/wait.h>
pid_t wait(int *);
```

## getpid()

```c
#include <unistd.h>
pid_t getpid(void);
```

getpid() returns the process id (PID) of the calling process.

## pthread_create()

**Header :** `#include <pthread.h>`

```c
int pthread_create(pthread_t * thread,
                   const pthread_attr_t * attr,
                   void * (*start_routine)(void *),
                   void *arg);                   
```

**Description :** The `pthread_create()` function shall create a new thread, with attributes specified by *attr*, within a process.

**Return Value :** On success, `pthread_create()` returns 0; on error, it returns an error number, and the contents of *thread are undefined. Upon successful completion, `pthread_create()` shall store the ID of the created thread in the location referenced by *thread*.

| Argument Name | Argument Type | Description |
| --- | --- | --- |
| thread | `pthread_t *` | pointer to an unsigned integer value that returns the thread id of the thread created. If the call is successful,  `pthread_create()` will populate the pointer with the address of the location storing the thread ID of the process. If the call fails, the value is undefined.    |
| attr | `const pthread_attr_t *` | pointer to a structure that is used to define thread attributes. The thread attributes includes a) detached state which controls whether the thread created is in a joinable or detached state, b) stack address which is used to set a specific memory location as the base address of stack for the thread, c) scheduling policy etc. Here we set to NULL for default thread attributes (i.e default stack size, default scheduling policy, joinable thread (the thread will not be detached by default)). |
| start_routine | `void *` | pointer to a subroutine (function pointer) that is executed by the thread. The return type and parameter type of the subroutine must be of type `void *`. The function has a single attribute,  but if multiple values need to be passed to the function, a structure can be used. |
| arg | `void *` | pointer to void that contains the arguments to the function defined in the start_routine.  Typically a structure pointer with values of arguments to the start_routine are passed in practice.   |

## **pthread_exit()**

**Header**: `#include <pthread.h>`

`void pthread_exit(void *status);`

**Description** : Ends the calling thread and makes *status* available to any thread that calls `pthread_join()` with the thread ID of the terminating thread.

**Return value :** The function’s return type is void however the return status of the terminated thread is stored in *status* which is defined as a pointer (`void *`), so it can point to any data type, including a simple integer or a more complex structure. The scope of this variable must be global so that any thread waiting to join this thread may read the return status.

## pthread_detach()

**Header** : `#include <pthread.h>`

`int pthread_detach(pthread_t thread);`

**Description** : The `pthread_detach()` function marks the thread identified by *thread* as detached.  When a detached thread terminates, TCB and all other resources related to the thread (such as its stack and registers) are **immediately de allocated** by the operating system without the need for another thread to join with the terminated thread. Attempting to detach an already detached thread results in unspecified behavior.

**Return value**: on success, returns 0.If error occurs returns an error number

- **thread:** thread id of the thread that must be detached.
