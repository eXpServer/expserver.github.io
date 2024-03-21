# Phase 1: Overview

Congratulations on completion of Phase 0! Let’s look at what we have done till now.

## Recap of Phase 0

- In stage 1, we built a simple TCP server that served a _netcat_ client
- In stage 2, we created our own TCP client and made it communicate with the TCP server
- In stage 3, we made our TCP server support multiple clients using _epoll_ (concurrency)
- In stage 4, we converted our TCP server to act as a proxy server and made all client communications to the python file server go through the proxy server

## What to expect in Phase 1

Phase 0 gave us an understanding of how servers work in general, and also gave us an idea of how the client-server communication takes place.

Now might be the right time to have a look at the overall architecture of eXpServer. Check it out [here](https://www.notion.so/Architecture-68bd371e04e340ce858597abb9cf12cf?pvs=21).

eXpServer is broken down into multiple modules. Below are the modules of eXpServer that we will tackle with building in Phase 1:

1. Core & loop module
2. TCP module
3. Server and client module
4. File module

There will be an apparent jump in the complexity of the code that we will be writing which is normal and expected. You will have to spend a bit more time than Phase 0 for this. Rest assured, this documentation will guide you throughout the process.

## Working directory and code

Find below the starting code that you’ll be working with.

Give code link here

### Understanding the file structure

Each module will require its own folder consisting of its related code. File structure will be given at the beginning of every stage to avoid any confusion.

The starting code will consist of the following:

![filestructure.png](/assets/phase-1-overview/filestructure.png)

## Memory handling

From this phase, high importance will be given to proper memory management. If memory is allocated, it has to deallocated before the server is shutdown. We cannot emphasise the importance of memory handling.

We will use using some third-party tools such as Valgrind.
