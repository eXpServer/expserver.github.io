# Overview

Congratulations on completion of Phase 0! Let’s look at what we have done till now.

## Recap of Phase 0

- In stage 1, we built a simple TCP server that served a _netcat_ client
- In stage 2, we created our own TCP client and made it communicate with the TCP server
- In stage 3, we made our TCP server support multiple simultaneous clients using _epoll_ (concurrency)
- In stage 4, we converted our TCP server to act as a proxy server and made all client communications to the python file server go through it

## What to expect in Phase 1

Phase 0 gave us an introduction to Linux socket programming and an understanding of how client-server communications take place.

Now is a good time to have a look at the overall architecture of eXpServer. Check it out [here](/guides/resources/architecture).

eXpServer is broken down into multiple modules. Given below are the modules that we will be tackling in Phase 1:

1. Server & Client modules
2. Core & Loop modules
3. TCP module
4. Upstream module
5. File module

![modules.png](/assets/phase-1-overview/modules.png)

There will be an apparent jump in the complexity of the code that we will be writing which is normal and expected. You will have to spend a bit more time than Phase 0 for this. Rest assured, this documentation will guide you throughout the process.

## File structure

The code that we have written so far for Phase 0 is a standalone practice session. Going forward we will be starting to build the eXpServer. The file structure will change drastically with the modularisation of code into multiple files and folders.

In order to maintain consistency, we will be providing you with the expected file structure at the beginning of each stage.

### Phase 1 initial file structure

![filestructure.png](/assets/phase-1-overview/filestructure.png)

From Phase 1, we will be using a library called `vec` that provides dynamic array implementation. Read about `vec` more [here](/guides/references/vec).

## Memory management, error handling & logging

In phase 0, we prioritised readability and simplicity over proper error handling and memory management.

As a web server is a software that is expected to run for long intervals of time without shutting down, memory leaks in the code can lead to huge consumption of system resources, which is inefficient and can lead to the OS killing the process.

As a web server deals with a lot of asynchronous system calls and network communications, it can lead to a variety of errors and unexpected failures. If these errors are not properly handled, it can lead to the process exiting itself.

Thus, from this phase onwards,

- High importance is given to proper memory management. If memory is allocated, it has to deallocated before the server is shutdown.
- Errors from any function calls should be handled properly
- To help with debugging and understanding the order of function invocations, we will be thoroughly logging messages throughout the code using the provided `xps_logger` utility. Read more about `xps_logger` [here](/guides/references/xps_logger).

::: tip
Third-party tools such as **Valgrind** can help to find any memory leaks in the application we write.
:::

## Naming convention

Snake case convention is used to name all identifiers, ie. small letters with underscores in place of spaces. eg: `my_server` , `xps_buffer.c` etc. File names, function names and type names are prefixed with `xps_`
