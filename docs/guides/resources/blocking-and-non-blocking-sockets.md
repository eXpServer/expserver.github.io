# Blocking & Non-Blocking Sockets
Sockets can operate in two modes namely blocking or non-blocking. When a blocking socket performs an I/O operation, the program will pause and wait until the operation is completed. But in case of non-blocking sockets the program will immediately return with an error, even if the operation is not completed. For example, during `send()` the data from user buffer is copied to kernel buffer, But if the kernel buffer is full, then in case of blocking sockets the program will gets blocked (it means the program gets paused and will be in waiting state) until space is available in the kernel buffer. In case of non-blocking sockets if kernel buffer is full and `send()` cant be performed, then it will immediately return with an error instead of waiting until space becomes available. 

Generally all the sockets created using `socket()` system call are in blocking mode. In Unix like systems, fcntl system call can be used to set a socket to non blocking mode. After `socket()` creation add the `O_NONBLOCK` flag using `fcntl()` to make the socket non blocking.
```c
int sockfd = socket(AF_INET, SOCK_STREAM, 0);
int flags = fcntl(sockfd, F_GETFL, 0);
if (flags == -1) {
    perror("fcntl F_GETFL");
    exit(EXIT_FAILURE);
}
if (fcntl(sockfd, F_SETFL, flags | O_NONBLOCK) == -1) {
    perror("fcntl F_SETFL O_NONBLOCK");
    exit(EXIT_FAILURE);
}
```