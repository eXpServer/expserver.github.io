# Phase 1 Overview

Congratulations on completion of Phase 0! Let’s take a look at what we have done till now.

## Recap of Phase 0

- In stage 1, we built a simple TCP server that served a _netcat_ client
- In stage 2, we created our own TCP client and made it communicate with the TCP server
- In stage 3, we made our TCP server support multiple simultaneous clients using _epoll_ (concurrency)
- In stage 4, We experimented with UDP and multi-threading
- In stage 5, we combined the functionality of a TCP server and client to create a TCP proxy and made browser requests to the python file server go through it

## What to expect in Phase 1

Phase 0 gave us an introduction to Linux socket programming and an understanding of how client-server communications take place. Using this knowledge, from Phase 1 onwards we will start to build the actual eXpServer.

::: tip PRE-REQUISITE READING
Now is a good time to understand the capabilities and architecture of eXpServer. Read the following [Architecture](/guides/resources/architecture) document before proceeding further.
:::

There will be an apparent jump in the complexity of the code that we will be writing which is normal and expected. We will have to spend a bit more time than Phase 0 for this. Rest assured, this documentation will guide us throughout the process.

## File Structure

The code that we have written so far for Phase 0 is a standalone practice session. Going forward we will be starting to build the eXpServer. The file structure will change considerably with the modularisation of code into multiple files and folders.

In order to maintain consistency, the documentation will be providing the expected file structure at the beginning of each stage.

### Phase 1 Initial File Structure

![filestructure.png](/assets/phase-1-overview/filestructure.png)

- We will be using a library called `vec` that provides dynamic array implementation. Read about and get the source code for `vec` [here](/guides/references/vec).
- `xps_buffer` is a module used to create instances of data buffers. Read about and get the source code for `xps_buffer` [here](/guides/references/xps_buffer).
- `xps_logger` is a module that provides a function to print log messages for debugging another purposes. Read about and get the source code for `xps_logger` [here](/guides/references/xps_logger).

## Memory Management, Error Handling & Logging

In Phase 0, we did not look into error handling and memory management. We will address these going further.

As a web server is a software that is expected to run for long intervals of time without shutting down, memory leaks in the code can lead to huge consumption of system resources, which is inefficient and can lead to the OS killing the process.

As a web server deals with a lot of asynchronous system calls and network communications, it can lead to a variety of errors and unexpected failures. If these errors are not properly handled, it can lead to the process exiting itself.

Thus, from this phase onwards,

- If memory is allocated, it has to be freed after its use.
- Errors from any function calls should be handled properly
- To help with debugging and understanding the order of function invocations, we will be logging messages throughout the code using the provided `xps_logger` utility. Read about it and get the source code for `xps_logger` [here](/guides/references/xps_logger).

::: tip
Third-party tools such as [Valgrind](https://en.wikipedia.org/wiki/Valgrind) can help to find any memory leaks in the application we write.
:::

## Naming convention

[Snake case](https://en.wikipedia.org/wiki/Snake_case) convention is used to name all identifiers, ie. small letters with underscores in place of spaces. eg: `my_server` , `xps_buffer.c` etc. File names, function names and type names are prefixed with `xps_`
