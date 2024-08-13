# Fork() system call

The Fork system call is used for creating a new process (child process) which runs concurrently with the process that makes the fork() call  (parent process). After a new child process is created, both processes will execute the next instruction following the fork() system call. With forking,the operating system creates a child process, which is an exact copy of the parent process. This includes copying the process's memory, file descriptors, and execution context.

- **`pid = fork()`**: This creates a new process. The return value is stored in `pid` (integer).
- **Child Process**:  `fork()` returns `0`.
- **Parent Process**:  `fork()` returns a positive value (the pid of the child process).
- **Error Handling**: If `fork()` returns a negative value, it indicates that the process creation failed.

**Some other system calls used along with fork()**

- **`wait(NULL)`**: The parent process waits for each child process to finish before proceeding. This ensures that all clients complete their work before the program ends.
- **`getpid()`**: This system call retrieves the process ID of the current process.