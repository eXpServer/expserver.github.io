# Stage 0: Setup

## Recap

- We have gone through the roadmap and the outline of what the course has to offer

## Setup

There are only 3 requirements that are needed for building eXpServer.

### Linux

Any distribution of Linux can be used.

### C compiler - gcc

Since we will be building the project primarily in C programming language, we will need a C compiler. We will stick with the popular `gcc` compiler for this purpose.

### GNU Debugger - GDB

::: warning TODO
Read the section on [GDB](/guides/resources/gdb) to learn how to use the GNU debugger.
:::

### Version control - Git

Use of a version control like [Git](https://git-scm.com/doc) is recommended.

### Tester

**eXpServer-Testbench** is an automated testing platform used throughout this course to validate your server implementations. Each stage has a corresponding set of tests that check whether your binary behaves as expected.

:::tip

- **Install** the tester by following the [Installation Guide](/tester/).
- **Use** it to verify your implementation at the end of each stage.
  :::

## Conclusion

That is all the setup that is needed to get started on eXpServer! Let us proceed to the next stage where we will build a basic, but functional TCP server on our own.
