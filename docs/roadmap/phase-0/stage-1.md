# Stage 1: A Basic TCP Server

## Recap

- We learnt about the Client-Server architecture.
- We learnt about the TCP protocol.
- We learnt how sockets facilitate the communication between clients and servers.

## Introduction

How does a server function? It listens for any connections, i.e. clients that are trying to connect to the server, and based on the request from the client, it does some specific operation.

To be able to listen for connections, it needs **listening sockets**. Listening \*\*\*\*sockets are bound to a specific IP address and a port. If any client wants to connect to the server, they have to direct their request to this particular IP:port combo that the server is listening to.

For eg. Let us assume you have a TCP server ‘running’ on your computer on port 8000. Running signifies that the server is ‘listening’ for any connections on port 8000. If a client wants to connect to the server, they would have to direct their request to `<IP_address_of_computer>:8000`.

Using this knowledge, let us build a simple TCP server from the ground up. Since this is just Stage 1, you will be guided throughout the implementation with all the code given in the form of snippets.

Create an illustration of the working of server.

## Implementation

![implementation.png](/assets/stage-1/implementation.png)

All the code from this stage will be written in `stage1/tcp_server.c`.

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

For the clients to be able to connect to the server, let us create a listening socket using the `socket()` function from the `<sys/socket.h>` library.

```c
int main() {
  // creating a listening socket
  int listen_sock_fd = socket(AF_INET, SOCK_STREAM, 0);
```

The `socket()` function creates a socket, and upon successful creation, returns a **socket file descriptor**. A file descriptor is a unique integer that designates a socket and allows application programs to refer to it when needed.

The function takes three arguments:

- domain: `AF_INET` - IPv4
- type: `SOCK_STREAM` - TCP
- protocol: `0` - allows system to choose the appropriate protocol based on domain and type

```c
  // setting sock opt reuse addr
  int enable = 1;
  setsockopt(listen_sock_fd, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof(int));
```

This is optional but it will help us bypass the `TIME_WAIT` state that the address and port combination enters when the server is shutdown, thus allowing us to reuse the same address and port.

Now that we have created a socket, we need to specify the address that it needs to listen to. For this we will use an object of `struct socketaddr_in` provided by the `<netinet/in.h>` library.

```c
  // creating an object of struct socketaddr_in
  struct sockaddr_in server_addr;

  // setting up server addr
  server_addr.sin_family = AF_INET;
  server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
  server_addr.sin_port = htons(PORT);
```

- `server_addr.sin_family = AF_INET` - socket will use the IPv4 address format
- `server_addr.sin_addr.s_addr = htonl(INADDR_ANY)` - allows the server to accept connections from any client (explain htonl)
- `server_addr.sin_port = htons(PORT)` - sets the port number (explain htons)

```c
  // binding listening sock to port
  bind(listen_sock_fd, (struct sockaddr *)&server_addr, sizeof(server_addr));

  // starting to listen
  listen(listen_sock_fd, MAX_ACCEPT_BACKLOG);
	printf("[INFO] Server listening on port %d\n", PORT);
```

The `bind()`function, provided by the `<sys/socket.h>` library, will bind the listening socket to the provided port. The `listen()` function marks the socket as a passive socket, ready to accept incoming connection requests.

---

Now that the server is listening on the port, what happens when a client tries to connect to the server?

We need to get the address of the clients that are connecting to the server. For this lets create another object of `struct sockaddr_in`.

```c
  // creating an object of struct socketaddr_in
  struct sockaddr_in client_addr;
  int client_addr_len;

  int conn_sock_fd = accept(listen_sock_fd, (struct sockaddr *)&client_addr, &client_addr_len);
	printf("[INFO] Client connected to server\n");
```

The `accept()` function accepts the incoming client connection and creates a new socket for the same.

Let’s pause for a bit and recap what just happened.

- We created a socket using `socket()` function
- We bound that socket to a port with `bind()` function
- The socket is made to listen for connections on that port using `listen()` function
- The socket accepts a connection from a client with the `accept()` function

### Milestone #1

We can now do a small test and check how the code performs.

Compile the code using the following command:

```bash
gcc tcp_server.c -o tcp_server
```

To start the server, use the following command:

```bash
./tcp_server
```

On running the TCP server, it will display the following message:

```bash
[INFO] Server listening on port 8080
```

But what/who is going to connect to the server? Since we have not created a TCP client yet, lets use a networking utility tool called _netcat_. netcat is a versatile tool that has a wide range of functionalities including the ability to act as a TCP client.

netcat takes an IP address and a port to connect to. In our case, since the server is running on the same machine, we can use `[localhost](http://localhost)` as the IP address and 8080 as the port number.

Open another terminal in parallel and type the following command to start a netcat TCP client:

```bash
nc localhost 8080
```

When the client connection to the server is successful, it will show the following message:

```bash
[INFO] Server listening on port 8080
[INFO] Client connected to server
```

This confirms that the server is able to accept incoming connections from a client.

---

What happens when a client connection is accepted? Once a connection is established, it acts as a two-way communication channel between the client and the server. Data is sent to each other through this channel in the form of byte streams.

Typically a connection is established by the client to request some resource from the server. In this case, let us say the server acts as a string reverser, i.e. if a client sends a string of characters, the server should reverse the string and send it back to the client.

Initialize a `char` buffer to store the client message.

```c
  while (1) {
    char buff[BUFF_SIZE];
    memset(buff, 0, BUFF_SIZE);
```

The `memset` function is initialize the value of `buff` to 0.

```c
    // read message from client to buffer
    int read_n = recv(conn_sock_fd, buff, sizeof(buff), 0);
```

The `recv()` function is used to receive data from the connected socket. The received data is stored in the character buffer `buff`. Upon successful reception, the function returns the number of bytes received (`read_n`) and stored in `buff`.

Let’s take care of some error handling in case of unexpected failure.

```c
    // client closed connection or error occurred
    if (read_n <= 0) {
			printf("[INFO] Client disconnected. Closing server\n");
      close(conn_sock_fd);
      exit(1);
    }

    // print message from cilent
    printf("[CLIENT MESSAGE] %s\n", buff);
```

`buff` now contains the message sent by the client. The server has to reverse the message string and send it back to the client. Let us write a quick and simple string reversal function to take care of this and place it outside of the main function.

```c
// function to reverse a string
void strrev(char *str) {
  for (int start = 0, end = strlen(str) - 2; start < end; start++, end--) {
    char temp = str[start];
    str[start] = str[end];
    str[end] = temp;
  }
}
```

Now that `buff` has the reversed string, its time to send it to the client. We can use the `send()` function provided by the `<sys/socket.h>` library to achieve this.

```c
  	// string reverse
		strrev(buff);

    // sending client message to server
    send(conn_sock_fd, buff, read_n, 0);
  }
}
```

---

The final code should look like this.

```c
#include <arpa/inet.h>
#include <netdb.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define PORT 8080
#define BUFF_SIZE 10096
#define MAX_ACCEPT_BACKLOG 5

// function to reverse a string
void strrev(char *str) {
  for (int start = 0, end = strlen(str) - 2; start < end; start++, end--) {
    char temp = str[start];
    str[start] = str[end];
    str[end] = temp;
  }
}

int main() {
  // creating listening sock
  int listen_sock_fd = socket(AF_INET, SOCK_STREAM, 0);

  // setting sock opt reuse addr
  int enable = 1;
  setsockopt(listen_sock_fd, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof(int));

  // creating an object of struct socketaddr_in
  struct sockaddr_in server_addr;

  // setting up server addr
  server_addr.sin_family = AF_INET;
  server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
  server_addr.sin_port = htons(PORT);

  // binding listening sock to port
  bind(listen_sock_fd, (struct sockaddr *)&server_addr, sizeof(server_addr));

  // starting to listen
  listen(listen_sock_fd, MAX_ACCEPT_BACKLOG);
  printf("[INFO] Server listening on port %d\n", PORT);

  // creating an object of struct socketaddr_in
  struct sockaddr_in client_addr;
  int client_addr_len;

  int conn_sock_fd = accept(listen_sock_fd, (struct sockaddr *)&client_addr, &client_addr_len);
  printf("[INFO] Client connected to server\n");

  while (1) {
    // create buffer to store client message
    char buff[BUFF_SIZE];
    memset(buff, 0, BUFF_SIZE);

    // read message from client to buffer
    int read_n = recv(conn_sock_fd, buff, sizeof(buff), 0);

    // client closed connection or error occurred
    if (read_n <= 0) {
      printf("[INFO] Client disconnected. Closing server\n");
      close(conn_sock_fd);
      exit(1);
    }

    // print message from client
    printf("[CLIENT MESSAGE] %s", buff);

    // sting reverse
    strrev(buff);

    // sending client message to server
    send(conn_sock_fd, buff, read_n, 0);
  }
}
```

### Milestone #2

It’s time to test the server! Similar to last time, open 2 terminals, one for the TCP server that we just wrote and another for the netcat client. Start the server followed by the client.

Upon successful connection of the client to the server, the server terminal should look like this:

```bash
[INFO] Server listening on port 8080
[INFO] Client connected to server
```

Let us try to send a string from the client terminal:

```bash
hello
```

The server will receive the message sent by the client, and should send a response back to the client with the reversed string.

```bash
[CLIENT MESSAGE] hello
```

The client will receive the reversed string.

```bash
olleh
```

## Conclusion

Congratulations! You have just written you own TCP server from the ground up. In the next stage, instead of using a third-party client, we will write our own TCP client.
