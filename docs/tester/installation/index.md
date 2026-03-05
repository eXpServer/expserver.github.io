# eXpServer Tester Utility

A robust testing framework for server implementation, featuring an interactive UX and a scalable bakcend using WebSockets and Dockerized test execution. Designed to help students validate their server implementation through automated blackbox testing

## Overview

The project provides:
- Easy to use frontend interface for the student to submit and test their code
- A high-concurrency WebSocket-based backend architecture that executes student submitted binaries in isolated Docker containers and streams their test feedback

**Note** 
This system is built exclusively to act as a testing utility for [eXpServer](https://expserver.github.io/)

## Key Features
- Frontend
    - Real-time test progress visualization
    - Real-time CPU and MEM usage visualization
    - Student friendly interface for binary uploads
    - Results overview with pass/fail status and additional information

- Backend
    - WebSocket-based producer-subscriber architecture
    - Docker container isolation for each binary execution
    - Blackbox testing
    - Stage-wise validation
    - Concurrent test execution support
    - Heavy focus on availability



## Installation
- [Frontend](./frontend.md)
- [Backend](./backend.md)

## Authors
- [Diljith P D](https://github.com/th3bossc)
- [Mayank Gupta](https://github.com/71203mayank)