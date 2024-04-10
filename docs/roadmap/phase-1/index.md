# Overview

Congratulations on completion of Phase 0! Let’s look at what we have done till now.

## Recap of Phase 0

- In stage 1, we built a simple TCP server that served a _netcat_ client
- In stage 2, we created our own TCP client and made it communicate with the TCP server
- In stage 3, we made our TCP server support multiple simultaneous clients using _epoll_ (concurrency)
- In stage 4, we created a UDP server that supports multiple simultaneous clients using threading.
- In stage 5, we converted our TCP server to act as a proxy server and made all client communications to the python file server go through it

## What to expect in Phase 1

## File structure

The code that we have written so far for Phase 0 is a standalone practice session. Going forward we will be starting to build the eXpServer. The file structure will change considerably with the modularisation of code into multiple files and folders.

In order to maintain consistency, we will be providing you with the expected file structure at the beginning of each stage.

### Phase 1 initial file structure

![filestructure.png](/assets/phase-1-overview/filestructure.png)

From Phase 1, we will be using a library called `vec` that provides dynamic array implementation. Read about `vec` more [here](/guides/references/vec). All the necessary header files will be given during the implementation.

## Memory management, error handling & logging

In phase 0, we prioritised readability and simplicity over proper error handling and memory management.

As a web server is a software that is expected to run for long intervals of time without shutting down, memory leaks in the code can lead to huge consumption of system resources, which is inefficient and can lead to the OS killing the process.

Web servers deal with a lot of asynchronous system calls and network communications. This can lead to a variety of errors and unexpected failures. If these errors are not properly handled, it can lead to the process exiting itself.

Thus, from this phase onwards,

- High importance is given to proper memory management. If memory is allocated, it has to deallocated before the server is shutdown.
- Errors from any function calls should be handled properly
- To help with debugging and understanding the order of function invocations, we will be thoroughly logging messages throughout the code using the provided `xps_logger` [utility](/guides/references/xps_logger).

::: tip
Third-party tools such as [**Valgrind**](https://en.wikipedia.org/wiki/Valgrind) can help to find any memory leaks in the application we write.
:::

## Naming convention

[Snake case](https://en.wikipedia.org/wiki/Snake_case) convention is used to name all identifiers, ie. small letters with underscores in place of spaces. eg: `my_server` , `xps_buffer.c` etc. File names, function names and type names are prefixed with `xps_`
