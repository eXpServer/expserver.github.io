# MULTI-THREADING

Thread is the smallest unit of execution within a process. Threads within the same process share memory and resources, facilitating communication and data sharing. Multi-threading is the ability of a program or an operating system to enable more than one user at a time without requiring multiple copies of the program running on the computer. 

Creating a thread is less expensive than creating a new process because the newly created thread uses the current process address space. 

**Concurrency**: Multiple threads are making progress at the same time. This is more about dealing with multiple tasks at once rather than running them simultaneously.

**Non-blocking Operations**: Threads enable non-blocking I/O operations, where one thread can handle input/output operations while other threads continue executing without waiting.

**Faster Response Times**: With the ability to process multiple requests concurrently, client requests can be handled more quickly, reducing the time each client waits for a response.

**Handling High Loads**: Concurrent servers can scale to handle a large number of simultaneous connections, making them suitable for high-traffic applications like web servers, email servers, and database servers.

![multi-threading.png](/assets/resources/multi-threading.png)