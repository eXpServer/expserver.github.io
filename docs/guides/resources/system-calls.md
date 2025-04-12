# System calls

This page briefly describes the programming interface of some of the Unix/Linux system calls that will be used in the eXpServer project.   

## fork()

The [`fork`](https://en.wikipedia.org/wiki/Fork_(system_call)) system call is used for creating a new process (child process) which runs concurrently with the process that makes the `fork() call`  (parent process). With forking, the operating system creates a child process, which is an exact copy of the parent process. This includes copying the process's memory, file descriptors, and execution context (register values), stack and heap. The parent process and child process run in separate memory address spaces. After a new child process is created, both processes will execute the next instruction following the `fork()` system call.

```c
#include <unistd.h>
pid_t fork(void);
```

The return type of fork() is of `pid_t` data type, which is a signed integer, defined in the `<sys/types.h>` header. This is a data type specifically used to represent process IDs (PIDs). 

The `fork()` system call does not take any arguments. When `fork()` is called, OS creates a copy of the calling process and assigns it a new **process ID (PID)**. This new process is the child process. Then both the parent and child process executes concurrently. The return value of `fork()` helps to differentiate between the parent and child process. In the parent process `fork()` returns the PID of the newly created child process. In the child process `fork()` returns 0. If the process is not able to create a child process due to some errors it will return -1. (The possible errors can be insufficient memory for the new process, system has already reached the maximum limit of processes that can exist on it etc.) 

- **Child Process**:  `fork()` returns `0`
- **Parent Process**:  `fork()` returns a positive value (the PID of the child process)
- **Error Handling**: If `fork()` returns -1, it indicates that the process creation has failed.

**Use Case**:

- The `fork()` system call is often used in server applications to handle multiple clients concurrently by creating a new process that handles communication with each client.

```c
while (1) {//for handling multiple connections till the server terminates
       // Accept clients using accept() and
			 // Creates a child process
        if ((childpid = fork()) == 0) { //for handling the new connection
					// child process handles the communication      
        }
        else { 
             continue;       
        // In this example, parent handle concurrent client connections
        // Each client is handled by forking a separete child process 
        }  
}
```

## wait()

The `wait()` system call is used to make the parent process wait for state changes in any of its child processes. A state change include either termination of a child, stopping of a child by a signal or  resumption of a child on a signal. When the parent calls `wait()`, the system call blocks the parent process. It will not proceed until one of its child processes has undergone a state change. If there are multiple child processes, `wait()` will return as soon as any of the child changes state, and the parent can check which child it was. If the parent is only concerned about any one of its child process with a known pid, then `waitpid()` system call can be used, which explicitly specifies the pid of the child to be monitored. When a process calls `wait()`, then the OS checks if any of the child processes have already been terminated. If a child has already terminated by the time wait is called, then it will immediately return and collect the exit status without blocking the calling process. If there are no child processes, then also `wait()` will return immediately with an error (`ECHILD`). 

`wait()` system call helps in ensuring resource clean up, handling zombie processes, synchronizing parent and child processes etc. `wait()` is mainly used to identify child process terminations. When a child process terminates (either by normal exit or due to a signal), the parent can use `wait()` to collect the child's exit status and prevent it from becoming a **zombie process**. (A zombie process is a terminated process which still has an entry in the process table. If not handled properly it can cause resource depletion). 

```c
#include <sys/wait.h>
pid_t wait(int *status);
```

`wait()` system call has a single argument, which is a pointer to an integer where the exit status of the child process will be stored. This **exit status** can be used to determine how the child process terminated. The parent process (caller of wait) is responsible for declaring and allocating space for the status variable. The kernel will populate this variable with the exit status of the child. If the parent is not concerned about the exit status of the child then it can pass NULL as the argument. (`wait(NULL)` will block until one of the child processes terminates, but the exit status will not be returned.) 

The return value of `wait()` is of `pid_t` type, which returns the PID of the terminated child process. If there were no child processes or some error occurs, then -1 is returned.  

 

Use case of `wait()`
```c
while (1) {//for handling multiple connections till the server terminates
       // Accept clients using accept() and
			 // Creates a child process
        if ((childpid = fork()) == 0) { //for handling the new connection
					// child process handles the communication      
        }  
        else{   // Here we accept only one client connection at a time.  
	          wait(NULL);//parent waits for child to terminate 
	          continue;  
        // When the child terminates, parent continues in the while loop 
        // for accepting other clients 
        }  
    }
```

## getpid()

```c
#include <unistd.h>
pid_t getpid(void);
```

`getpid()` returns the process id (PID) of the calling process.

## pthread_create()

`pthread_create()` function is used to create a new thread in a process. It is included in the `#include <pthread.h>` header. The function signature is as follows.

```c
int pthread_create(pthread_t * thread,
                   const pthread_attr_t * attr,
                   void * (*start_routine)(void *),
                   void *arg);                   
```

**The arguments of the function are as follows:**

- `pthread_t *thread`  -  A pointer to a variable of type `pthread_t`. The caller is responsible for declaring and allocating space for this variable. The `pthread_create()` function will fill this variable with the thread ID of the newly created thread. This thread ID is used to uniquely identify the thread created.   (`pthread_t` is defined as an opaque data type. The exact definition is abstracted. The abstraction could be a struct or an integer. The internals depend on the platform being used)
- `const pthread_attr_t * attr` -  A pointer to a structure that specifies the thread attributes. If default attributes are being used, then NULL can be used. If custom attributes are to be used then certain functions have to be used to set the fields of `pthread_attr_t` structure. Details are given below.

The `pthread_attr_t` is a structure used to define thread attributes. It is declared in the `pthread.h` header. `pthread_attr_t` is described as opaque type. This means that the internal structure is not exposed to the users, whereas the programmer interacts with `pthread_attr_t` through functions that can manipulate the fields of the structure. The common fields in `pthread_attr_t` include those like detach state of thread, stack size for thread, stack address for thread, scheduling policy for thread, scheduling parameters for thread etc. In addition to these there can be certain other platform specific fields. The programmer will  have to use the specific functions for setting the fields for `pthread_attr_t`. The major functions include:

- `pthread_attr_init(pthread_attr_t *attr)`  -   this is used to initialize with default values (set by the OS). This function must be used before using the attribute object.
- `pthread_attr_setdetachstate(pthread_attr_t *attr, int detachstate)` - this function is used to set the detach state for the thread. The detachstate argument can be either `PTHREAD_CREATE_JOINABLE` or `PTHREAD_CREATE_DETACHED`
- `pthread_attr_setstacksize(pthread_attr_t *attr, size_t stacksize)`  - this function is used to set the stack size for the thread.
- `pthread_attr_setschedpolicy(pthread_attr_t *attr, int policy)`  - this function sets the scheduling policy for the thread. The policy can be `SCHED_FIFO`, `SCHED_RR` etc.
- `pthread_attr_destroy(pthread_attr_t *attr)`  - this function destroys the `pthread_attr_t` object, freeing any resources that were allocated for it. It is recommended to use this function once the object is no longer needed.

So these are some of the major functions that are used to set the thread attributes.

- `void * (*start_routine)(void *)`  - a pointer to a subroutine (function pointer) that is executed by the thread. The return type and parameter type of the subroutine must be of type `void *`. The function accepts a single argument of type `void` . If multiple values need to be passed to the function, the arguments must be placed in a structure and the pointer is passed.
- `void *arg` - A void pointer that contains the arguments to the function defined in the `start_routine`.  Typically a structure pointer with values of arguments to the `start_routine` is passed in practice.

**Return Value**

The `pthread_create()` function returns 0 if the call was success and a new thread is created. If a new thread is not created then it will return a non zero error code that indicates the reason for the error.

use case of `pthread_create()`:
```c
pthread_attr_t attr;
pthread_attr_init(&attr);                            // Initialize thread attributes
pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED); // Set thread to detached state

while (1) { // For handling multiple connections until the server terminates
    // Accept clients using accept() (not shown here)
    // and create a concurrent thread for each client connection.

    if (pthread_create(&threadid, &attr, start_routine, NULL) != 0) {
        /* pthread_create returns non-zero value if there's an error.
           Handle errors here, e.g., log them or take appropriate action. */
    } 

    // The process continues in the while loop for the next client
    continue;  
}

// Destroy the thread attributes object after the server shuts down
pthread_attr_destroy(&attr);

```

## **pthread_exit()**

`pthread_exit()` function is used to terminate the calling thread and make available the exit status of the calling thread to other threads or parent process. `pthread_exit()` convert the state of the calling thread from running to terminated. For detached threads, after calling `pthread_exit()`, the thread becomes terminated, and its resources (such as memory and thread table entries) are automatically cleaned up by the system. For joinable threads, the exit status obtained from `pthread_exit()` is used by the thread that calls `pthread_join()` on it, and once the status is collected, the system eventually cleans up the thread's resources. (A thread must be detached before calling `pthread_exit()`, or else it will leave a **zombie state** if no one calls `pthread_join()` on it.) 

pthread_exit() is included in the `pthread.h` header. The function signature is as follows:

`void pthread_exit(void *status);` 

**The arguments of the function are as follows**

There is a single argument to the function, which is a pointer to the value that the thread wants to return. It is of type `void*`. Thus a pointer to any data type can be used. Usually we have to typecast the data (generally integer type) to `void*` before passing it in the `pthread_exit()` function and while retrieving the data (generally while using `pthread_join()`) we will have to typecast the `void*` pointer back to original data type. If no value has to be returned then NULL can be used.

**Return Value** 

The function does not return anything to the calling thread. Once the thread calls `pthread_exit()` it terminates, and the return value can be retrieved by another thread using `pthread_join()`, if desired.

## pthread_detach()

**Header** : `#include <pthread.h>`

`int pthread_detach(pthread_t thread);`

**Description** : The `pthread_detach()` function marks the thread identified by *thread* as detached.  When a detached thread terminates, TCB and all other resources related to the thread (such as its stack and registers) are **immediately de allocated** by the operating system without the need for another thread to join with the terminated thread. Attempting to detach an already detached thread results in unspecified behavior.

**The arguments of the function are as follows**

The only argument for `pthread_detach()` is the thread id of the thread which is to be detached. 

**Return Value**

On success pthread_detach() returns 0. On failure returns a non-zero error code indicating the reason for failure.

use case of `pthread_detach()`:
```c
while (1) {//for handling multiple connections till the server terminates
       // Accept clients using accept() and
			 // create a thread for each client connection
       if (pthread_create(&thread_id, NULL, start_routine, NULL)!= 0)
        {
 		            /* pthread_create returns non zero value if error
 		             Any error handling code must be written here 
 		             If no error, a new thread is created for executing 
 		             start_routine, which will execute concurrently */                
        }
        pthread_detach(thread_id);		 
        continue;  
        // The current process continues in the while loop for next client  
    }
```    

## pthread_join()

`pthread_join()` function allows one thread to wait for the termination of another thread. It enables synchronization of threads and ensures that the resources used by the terminated thread are cleaned up properly. As seen before a detached thread will automatically release its resources after termination. But for joinable threads (by default threads are created in joinable state) `pthread_join` should be called to release its resources, otherwise zombie threads will be created. The calling thread will block until the specified thread terminates. `pthread_join()` also allows to retrieve the exit status of the terminated thread. This function is included in the `pthread.h` header. The function signature is as follows:

`int pthread_join(pthread_t thread, void **retval);` 

**The arguments of the function are as follows**

- `pthread_t thread` - the thread id of the target thread which the calling thread has to wait for. It is the thread id obtained while the target thread was created using the `pthread_create()` function.
- `void retval`  - the pointer to the location where the exit status of the target thread will be stored. If the exit status of the terminated thread is not required, then NULL can be passed.

**Return Value:**

On success `pthread_join()` returns 0 and on failure it returns a non zero error number indicating the reason for failure.

use case of `pthread_join()`:
```c
while (1) {//for handling multiple connections till the server terminates
       // Accept clients using accept() and
			 // create a concurrent thread for each client connection
			 
       if (pthread_create(&threadid, NULL, start_routine, NULL)!= 0)
        {
 		            /* pthread_create returns non zero value if error.
 		             Any error handling code must be written here.  
 		             If no error, a new thread is created for executing 
 		             start_routine, which will execute concurrently  */               
        }	
        if(pthread_join(thread_id, NULL)!=0){
                /*pthread join has failed*/
                exit(1)
        }	 
        continue;  
        /* The server is now ready to handle the next client.
        The process continues in the while loop for next client  */
    }
```
