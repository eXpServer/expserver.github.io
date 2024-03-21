# Stage 2: A Basic TCP Client

## Recap

- We built a simple TCP server using linux networking APIs

## Introduction

Recall the previous stage where we relied on a third-party client, _netcat_, to test the functionality of the TCP server. In this stage we will focus on writing our own TCP client to communicate with the TCP server.

Expect some code to echo the TCP server implementation, given the similarities in functionality.

## Implementation

![stage-2.png](../../assets/phase-0/stage-2.png)

Create a file named `tcp_client.c` in the same directory as `tcp_server.c`. All the code from this stage will be written to it.

The header files required for this stage are given below.

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
  int client_sock_fd = /* create a socket of type SOCK_STREAM */
```

But where (or which server) does this client connect to? To establish a connection, the client must know the IP address and listening port of the server it intends to connect to. We can use an object of `struct sockaddr_in` for this purpose.

```c
 	struct sockaddr_in server_addr;
  server_addr.sin_family = /* fill this */;
  server_addr.sin_addr.s_addr = /* fill this */;
  server_addr.sin_port = /* fill this */;
```

Now that we have the client socket and and the server address (IP and port), connect the client to the server with the help of the `connect` function. Use error handling to handle cases of unexpected failure.

Refer [this](https://pubs.opengroup.org/onlinepubs/009695399/functions/connect.html) to read up on the `connect` function call.

```c
  // connect to tcp server
	if (connect(/* fill this */) {
    printf("[ERROR] Failed to connect to tcp server\n");
    exit(1);
  } else
    printf("[INFO] Connected to tcp server\n");
```

### Milestone #1

This is a good point to test the code you have written. Compile and start the TCP server that we wrote in Stage 1 and start this TCP client on separate terminals.

The terminal running the TCP server should display the following message:

```
[INFO] Client connected to server
```

The terminal running the TCP client should display the following message:

```
[INFO] Connected to tcp server
```

This confirms that the client has established a successful connection to the server!

---

Now let’s implement the functionality for the client to accept some input from the user, send it to the server and print the reversed string on the client terminal sent by the server.

```c
	while (1) {
    char *line;
    size_t line_len = 0, read_n;

		read_n = /* read a line from the user using getline() */

		/* send message to tcp server using send() */

		/* create a char buffer of BUFF_SIZE and memset to 0 */

		read_n = recv(/* read message sent by server to client into buffer */)

		/* close the connection if read_n <= 0 */

		// print message from cilent
    printf("[SERVER MESSAGE] %s\n", buff);
	}
	return 0;
}
```

### Milestone #2

Again, start the TCP server and TCP client on separate terminals. You should get successful connection message on both terminals.

The terminal with the TCP server should display the following message:

```c
[INFO] Client connected to server
```

The server will receive the message sent by the the client.

```bash
[CLIENT MESSAGE] hello
```

Type some message in the terminal running the TCP client.

```c
[INFO] Connected to tcp server
hello
```

The client terminal should get a response message (reversed string) from the server as a receipt.

```c
[INFO] Connected to tcp server
hello
olleh
```

## Conclusion

Congratulations! You have written a TCP client from the ground up which connected with a TCP server with the ability to send and receive messages.

But there is a big drawback with the server from Stage 1. Think about what it can be. You will find the answer to that question in the next stage!
