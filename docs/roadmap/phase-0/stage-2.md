# Stage 2: TCP Client

## Recap

- We built a simple TCP server using linux networking APIs

## Introduction

Recall the previous stage where we relied on a third-party client, _netcat_, to test the functionality of the TCP server. In this stage we will focus on writing our own TCP client to communicate with the TCP server.

Expect some code to echo the TCP server implementation, given the similarities in functionality.

::: tip NOTE
Code snippets will contain comments in between with a format like this: `/* todo */`. These are meant to be filled in as you go through the documentation and implement it.
:::

## Implementation

![implementation.png](/assets/stage-2/implementation.png)

Create a file `expserver/phase_0/tcp_client.c` . All the code from this stage will be written to it.

The header includes and defines required for this stage are given below.

```c
#include <arpa/inet.h>
#include <netdb.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define SERVER_PORT 8080
#define BUFF_SIZE 10000
```

How will the client connect to the server? That’s right, with the help of a socket! Let’s call it a _client socket_ for the sake of distinguishability.

```c
int main() {
  // Creating listening sock
  int client_sock_fd = /* create a socket of type SOCK_STREAM */
```

But where (or which server) does this client connect to? To establish a connection, the client must know the IP address and listening port of the server it intends to connect to. We can use an object of `struct sockaddr_in` for this purpose.

```c
  // Creating an object of struct socketaddr_in
  struct sockaddr_in server_addr;

  // Setting up server addr
  server_addr.sin_family = /* fill this */;
  server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");
  server_addr.sin_port = /* fill this */;
```

::: info
`server_addr.sin_addr.s_addr` is set to the IP address `127.0.0.1`. This IP stands for [localhost](http://localhost) ie. host machine. The `inet_addr()` function will convert string IP to required numeric format.
:::

Now that we have the client socket and and the server address (IP and port), connect the client to the server with the help of the `connect()` function. Use error handling to handle cases of unexpected failure. Refer [this linux man page](https://man7.org/linux/man-pages/man2/connect.2.html) to know more about `connect()` .

```c
  // Connect to tcp server
  if (connect(client_sock_fd, (struct sockaddr *)&server_addr, sizeof(server_addr)) != 0) {
    printf("[ERROR] Failed to connect to tcp server\n");
    exit(1);
  } else {
    printf("[INFO] Connected to tcp server\n");
  }
```

---

### Milestone #1

This is a good point to test the code you have written. Compile and start the TCP server that we wrote in Stage 1 and this TCP client on separate terminals.

::: warning
Make sure to run the server before you run the client.
:::

The terminal running the TCP server should display the following message:

```bash
[INFO] Client connected to server
```

The terminal running the TCP client should display the following message:

```bash
[INFO] Connected to tcp server
```

This confirms that the client has established a successful connection to the server!

---

Now let’s implement the functionality for the client to accept some input from the user, send it to the server and print the reversed string on the client terminal sent by the server.

```c
	while (1) {
    // Get message from client terminal
    char *line;
    size_t line_len = 0, read_n;
    read_n = /* read a line from the user using getline() */

    /* send message to tcp server using send() */

    /* create a char buffer of BUFF_SIZE and memset to 0 */

    // Read message from client to buffer
    read_n = recv(/* read message sent by server to client into buffer */)

    /* close the connection and exit if read_n <= 0 */

    // Print message from cilent
    printf("[SERVER MESSAGE] %s\n", buff);
  }

  return 0;
}
```

---

### Milestone #2

Again, start the TCP server and TCP client on separate terminals. You should get successful connection message on both terminals.

The terminal with the TCP server should display the following message:

```bash
[INFO] Client connected to server
```

Type some message in the terminal running the TCP client.

```bash
[INFO] Connected to tcp server
hello
```

The server would receive the message sent by the the client.

```bash
[CLIENT MESSAGE] hello
```

The client terminal should get a response message (reversed string) from the server as a receipt.

```bash
[INFO] Connected to tcp server
hello
olleh
```

## Conclusion

Congratulations! You have written a TCP client from the ground up which connected with a TCP server with the ability to send and receive messages.

But there is a big drawback with the server from Stage 1. Think about what it can be. You will find the answer to that question in the next stage.
