# Stage 1: TCP Server

## Recap

- We covered the Client-Server architecture in Phase 0 Overview

## Learning Objectives

In this stage, we will implement our own TCP server from the ground up.

::: tip PRE-REQUISITE READING

- Read about the [TCP/IP Model](/guides/resources/tcp-ip-model)
- Read about [Sockets](/guides/resources/sockets)

:::

## Introduction

A server functions by actively monitoring for incoming connections from clients. Upon receiving a connection request, the server accepts the connection and proceeds to execute specific operations or protocols based on the client's request.

To be able to listen for connections, the server needs **listening sockets**. Listening sockets are bound to a specific [IP address](https://en.wikipedia.org/wiki/IP_address) (interface) and a [port](<https://en.wikipedia.org/wiki/Port_(computer_networking)>). If any client wants to connect to the server, they have to direct their request to this particular `IP:port` combination that the server is listening on.

For example, let us assume we have a TCP server ‘running’ on our computer on port 8080. Running signifies that the server is ‘listening’ for any connections on port 8080. If a client wants to connect to the server, they would have to direct their request to `<IP_address_of_computer>:8080`.

Using this knowledge, let us build a simple TCP server from the ground up. Since this is just Stage 1, the documentation will guide us throughout the implementation with all the code given in the form of snippets.

## Implementation

![implementation.png](/assets/stage-1/implementation.png)

Before we begin, let us create a folder named `phase_0` inside `expserver` which will contain the files we will be creating in Phase 0.

For this stage, as we are creating a TCP server, create a file `tcp_server.c` and place it inside `expserver/phase_0`. All the code from this stage will go into this file.

Let us start by adding all the header includes and defines. The use of each header will be explained as we proceed further.

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
#define BUFF_SIZE 10000
#define MAX_ACCEPT_BACKLOG 5
```

**Setting up the server:**

The first step is to create a listening socket for the clients to be able to connect to the server. This is done using the [`socket()`](https://en.wikipedia.org/wiki/Berkeley_sockets#:~:text=the%20specified%20socket.-,socket,-%5Bedit%5D) function from the [`<sys/socket.h>`](https://pubs.opengroup.org/onlinepubs/7908799/xns/syssocket.h.html) header.

```c
int main() {
  // Creating listening sock
  int listen_sock_fd = socket(AF_INET, SOCK_STREAM, 0);
```

The `socket()` function creates a socket, and upon successful creation, returns a **socket file descriptor**. A [file descriptor](https://en.wikipedia.org/wiki/File_descriptor) is a unique integer that designates a socket and allows application programs to refer to it when needed.

The function takes three arguments:

- **domain**: This specifies the communication domain or address family used by the socket. In this case, `AF_INET` indicates the use of [IPv4 addresses](https://en.wikipedia.org/wiki/Internet_Protocol_version_4). IPv4 (Internet Protocol version 4) is the most widely used network layer protocol, providing the addressing scheme for internet traffic.
- **type:** This argument determines the communication semantics and the characteristics of the data transmission over the socket. `SOCK_STREAM` indicates a socket of type stream. Stream sockets provide a reliable, connection-oriented, and sequenced flow of data. They are typically used with the [Transmission Control Protocol (TCP)](https://en.wikipedia.org/wiki/Transmission_Control_Protocol), which ensures that data sent from one end of the connection is received correctly at the other end, with no loss, duplication, or corruption.
- **protocol:** This specifies the specific protocol to be used with the socket. When `0` is passed as the protocol, the system selects the default protocol for the given domain and type combination. For `AF_INET` and `SOCK_STREAM`, this typically results in TCP being chosen as the protocol, as it is the default protocol for stream sockets in the IPv4 domain.

Now that we've initialized our listening socket, it's crucial to ensure its proper functioning, especially in scenarios where the server is stopped and restarted frequently.

Assume that our server is up and running, listening on a particular `IP:port` combination. When we terminate the server program, the socket goes into a `TIME_WAIT` state. In the `TIME_WAIT` state, the socket remains open for a predetermined period to ensure that any lingering packets associated with the previous connection are properly handled.

While a socket is in the `TIME_WAIT` state, the operating system reserves the associated IP and port to prevent any new sockets from binding to the same combination.

When we restart the server quickly, it attempts to bind to the same IP and port to resume it is operation. However, if the IP and port are still reserved due to the previous socket being in the `TIME_WAIT` state, the server may encounter an error indicating that the address is already in use.

In the code snipped below, we'll set the socket option `SO_REUSEADDR` for the listening socket identified by the file descriptor `listen_sock_fd`. This option allows us to reuse local IPs and ports, even if they are in the `TIME_WAIT` state.

```c
  // Setting sock opt reuse addr
  int enable = 1;
  setsockopt(listen_sock_fd, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof(int));
```

The next step is to assign an address (consisting of an IP address and a port) to our socket, allowing it to listen for incoming connections. To accomplish this, we'll employ a data structure called [`struct sockaddr_in`](https://man7.org/linux/man-pages/man3/sockaddr.3type.html), provided by the [`<netinet/in.h>`](https://pubs.opengroup.org/onlinepubs/009695399/basedefs/netinet/in.h.html) header.

This data structure is used for for IPv4 addresses only; have a look at it below:

::: details struct sockaddr_in

```c
struct sockaddr_in {
  sa_family_t     sin_family;     /* AF_INET */
  in_port_t       sin_port;       /* Port number */
  struct in_addr  sin_addr;       /* IPv4 address */
};
```

:::

```c
  // Creating an object of struct socketaddr_in
  struct sockaddr_in server_addr;

  // Setting up server addr
  server_addr.sin_family = AF_INET;
  server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
  server_addr.sin_port = htons(PORT);
```

- `server_addr.sin_family = AF_INET`: Configures the socket to utilize the IPv4 address format, indicating that the socket will operate within the context of IPv4 networking.
- `server_addr.sin_addr.s_addr = htonl(INADDR_ANY)`: Assigns the IP address to which the server will bind. The constant `INADDR_ANY` represents any available IP address on the host machine and is defined in the [`<netinet/in.h>`](https://pubs.opengroup.org/onlinepubs/009695399/basedefs/netinet/in.h.html) header. Using this constant for the server address allows the server to bind to all network interfaces present on the machine. This includes all IP addresses associated with those interfaces. Clients can connect to any one of these IP addresses by specifying the appropriate address when attempting to establish a connection. The `htonl()` function is then used to convert the IP address from host byte order to network byte order, ensuring consistency across different architectures.
- `server_addr.sin_port = htons(PORT)`: Sets the port number that the server will listen on. The variable `PORT`, that we defined globally at the top of the file, holds the desired port number. The `htons()` function is employed to convert the port number from host byte order to network byte order for consistency in network communication across different platforms.

Now that we've configured the server address, the next step is to bind the listening socket to the specified port. This is achieved through the [`bind()`](https://en.wikipedia.org/wiki/Berkeley_sockets#:~:text=newly%20assigned%20descriptor.-,bind,-%5Bedit%5D), which is provided by the [`<sys/socket.h>`](https://pubs.opengroup.org/onlinepubs/7908799/xns/syssocket.h.html) header. By invoking `bind()`, we establish a connection between our listening socket and the specified port, effectively reserving it for our server's use.

Following the binding process, we initiate the listening phase by calling the [`listen()`](https://en.wikipedia.org/wiki/Berkeley_sockets#:~:text=an%20error%20occurs.-,listen,-%5Bedit%5D) function, also provided by [`<sys/socket.h>`](https://pubs.opengroup.org/onlinepubs/7908799/xns/syssocket.h.html). This function instructs the operating system to start listening for incoming connections on the socket that has been bound to the specified port.

```c
  // Binding listening sock to port
  bind(listen_sock_fd, (struct sockaddr *)&server_addr, sizeof(server_addr));

  // Starting to listen
  listen(listen_sock_fd, MAX_ACCEPT_BACKLOG);
  printf("[INFO] Server listening on port %d\n", PORT);
```

The `listen()` function marks the socket as a passive socket, meaning it is ready to accept incoming connection requests. Along with this readiness, `listen()` also specifies the maximum length of the queue for pending connections. When a client attempts to connect to a server, the server may not be immediately available to accept the connection. In such cases, the connection request is placed in a queue. The `MAX_ACCEPT_BACKLOG` constant, that we defined globally, defines the maximum size of this queue. If the queue is full, any additional connection attempts will be rejected until space becomes available in the queue.

---

**Accepting & processing client connections:**

When a client tries to connect to a server, the server's listening socket detects the incoming connection request. The server then has to ‘accept’ this connection, and create a new socket specifically for communication with that client.

To handle an incoming client connection and gather details about the client's address, we'll create another instance of `struct sockaddr_in`.

```c
  // Creating an object of struct socketaddr_in
  struct sockaddr_in client_addr;
  int client_addr_len;

  // Accept client connection
  int conn_sock_fd = accept(listen_sock_fd, (struct sockaddr *)&client_addr, &client_addr_len);
  printf("[INFO] Client connected to server\n");
```

The [`accept()`](https://en.wikipedia.org/wiki/Berkeley_sockets#:~:text=1%20is%20returned.-,accept,-%5Bedit%5D) function, defined in the [`<sys/socket.h>`](https://pubs.opengroup.org/onlinepubs/7908799/xns/syssocket.h.html) header, accepts the incoming client connection and creates a new socket for the same.

- `listen_sock_fd`: The file descriptor of the listening socket.
- `(struct sockaddr *)&client_addr`: A pointer to the `client_addr` structure where information about the client's address will be stored.
- `&client_addr_len`: A pointer to the variable storing the size of the client address structure. Upon successful execution, `accept()` updates this variable with the actual size of the client address structure. This is required because the size of the sockaddr structure may vary depending on whether it's an IPv4 or [IPv6](https://en.wikipedia.org/wiki/IPv6) address.

After `accept()` completes successfully, the server can use the `conn_sock_fd` file descriptor to communicate with the client over the newly established connection.

::: tip NOTE
When accept() is called, it initiates a blocking system call, causing the program execution to enter a state wait state until a connection request is received from a client.

So when the server runs and reaches the accept() function call, it will the pause execution at this line, waiting until it receives a connection request from a client. Once a client attempts to connect, the accept() function will return, allowing the server to proceed with handling the client connection.
:::

Let us pause for a bit and recap what just happened:

- We created a socket using `socket()` function
- We bound that socket to a port with `bind()` function
- The socket is made to listen for connections on that port using `listen()` function
- The socket accepts a connection from a client with the `accept()` function

---

### Milestone #1

We can now do a small test and check how our code performs.

Compile the code with the following command:

```bash
gcc tcp_server.c -o tcp_server
```

To start the server, use the following command:

```bash
./tcp_server
```

Upon running the TCP server, the server will display the following message:

```bash
[INFO] Server listening on port 8080
```

But what/who is going to connect to the server? Since we have not created a TCP client yet, let us use a networking utility tool called **_[netcat](https://en.wikipedia.org/wiki/Netcat)_**.

::: info
netcat is a versatile tool that has a wide range of functionalities including the ability to act as a TCP client.
:::

netcat takes an IP address and a port to connect to. In our case, since the server is running on the same machine, we can use `localhost` as the IP address and 8080 as the port number: `localhost:8080`.

Open another terminal in parallel and type the following command to start a netcat TCP client:

```bash
nc localhost 8080
```

When the client connection to the server is successful, the server will show the following message:

```bash
[INFO] Server listening on port 8080
[INFO] Client connected to server
```

This confirms that the server is able to accept incoming connections from a client.

---

Let us continue with the implemetation of the server. Till now we have only accepted the client connection. What happens after that?

Once a connection is established, it acts as a two-way communication channel between the client and the server. Data is sent to each other through this channel in the form of **byte streams**. Byte streams represent data as a linear sequence of bytes, where each byte follows the previous one without any inherent structure or boundaries.

Typically a connection is established by the client to request some resource from the server. In this case, let us say the server acts as a string reverser, i.e. if a client sends a string of characters, the server should reverse the string and send it back to the client.

Initialize a `char` **buffer** to store the client message. A buffer is a region of memory used to temporarily hold data while it is being transferred from one place to another or while it is being processed.

```c
  while (1) {
    // Create buffer to store client message
    char buff[BUFF_SIZE];
    memset(buff, 0, BUFF_SIZE);
```

The `memset` function is initialize the value of `buff` to 0.

```c
    // Read message from client to buffer
    int read_n = recv(conn_sock_fd, buff, sizeof(buff), 0);
```

The [`recv()`](https://man7.org/linux/man-pages/man2/recv.2.html) function is used to receive data from the connected socket. This function reads incoming data from the client and stores it in the character buffer `buff`. Upon successful reception, `recv()` returns the number of bytes received, which is stored in the variable `read_n`.

Let's ensure we handle any unexpected failures by implementing error handling.

```c
    // Client closed connection or error occurred
    if (read_n <= 0) {
      printf("[INFO] Client disconnected. Closing server\n");
      close(conn_sock_fd);
      exit(1);
    }

    // Print message from client
    printf("[CLIENT MESSAGE] %s", buff);
```

If the value of `read_n` is less than or equal to 0, it indicates that either the client has closed the connection or an error has occurred during data reception. In such cases, we print a message indicating that the client has disconnected, close the connection socket (`conn_sock_fd`), and exit the server program.

Given that `buff` contains the message sent by the client, the server has to reverse this message string and send it back to the client. Let us write a quick and simple string reversal function to take care of this and place it outside of the `main()` function.

```c
// Function to reverse a string in-place
void strrev(char *str) {
  for (int start = 0, end = strlen(str) - 2; start < end; start++, end--) {
    char temp = str[start];
    str[start] = str[end];
    str[end] = temp;
  }
}
```

Now that `buff` has the reversed string, it is time to send it to the client. We can use the [`send()`](https://man7.org/linux/man-pages/man2/send.2.html) function provided by the [`<sys/socket.h>`](https://pubs.opengroup.org/onlinepubs/7908799/xns/syssocket.h.html) header to achieve this.

```c
  	// Sting reverse
    strrev(buff);

    // Sending reversed string to client
    send(conn_sock_fd, buff, read_n, 0);
  }
}
```

- `conn_sock_fd`: The file descriptor of the connected socket, representing the communication channel between the server and the client.
- `buff`: The buffer containing the data to be sent. In this case, `buff` holds the reversed message string.
- `read_n`: The number of bytes to send from the buffer. This value corresponds to the length of the reversed message string.

---

The final code should look like this.

::: details expserver/phase_0/tcp_server.c

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
#define BUFF_SIZE 10000
#define MAX_ACCEPT_BACKLOG 5

// Function to reverse a string
void strrev(char *str) {
  for (int start = 0, end = strlen(str) - 2; start < end; start++, end--) {
    char temp = str[start];
    str[start] = str[end];
    str[end] = temp;
  }
}

int main() {
  // Creating listening sock
  int listen_sock_fd = socket(AF_INET, SOCK_STREAM, 0);

  // Setting sock opt reuse addr
  int enable = 1;
  setsockopt(listen_sock_fd, SOL_SOCKET, SO_REUSEADDR, &enable, sizeof(int));

  // Creating an object of struct socketaddr_in
  struct sockaddr_in server_addr;

  // Setting up server addr
  server_addr.sin_family = AF_INET;
  server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
  server_addr.sin_port = htons(PORT);

  // Binding listening sock to port
  bind(listen_sock_fd, (struct sockaddr *)&server_addr, sizeof(server_addr));

  // Starting to listen
  listen(listen_sock_fd, MAX_ACCEPT_BACKLOG);
  printf("[INFO] Server listening on port %d\n", PORT);

  // Creating an object of struct socketaddr_in
  struct sockaddr_in client_addr;
  int client_addr_len;

  // Accept client connection
  int conn_sock_fd = accept(listen_sock_fd, (struct sockaddr *)&client_addr, &client_addr_len);
  printf("[INFO] Client connected to server\n");

  while (1) {
    // Create buffer to store client message
    char buff[BUFF_SIZE];
    memset(buff, 0, BUFF_SIZE);

    // Read message from client to buffer
    int read_n = recv(conn_sock_fd, buff, sizeof(buff), 0);

    // Client closed connection or error occurred
    if (read_n <= 0) {
      printf("[INFO] Client disconnected. Closing server\n");
      close(conn_sock_fd);
      exit(1);
    }

    // Print message from client
    printf("[CLIENT MESSAGE] %s", buff);

    // Sting reverse
    strrev(buff);

    // Sending reversed string to client
    send(conn_sock_fd, buff, read_n, 0);
  }
}
```

:::

### Milestone #2

It is time to test the server! As before, open 2 terminals, one for the TCP server that we just wrote and another for the netcat client. Start the server followed by the client.

Upon the successful connection of the client to the server, the server terminal should display:

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

Congratulations! We have just written our own TCP server from scratch. In the next stage, instead of using a third-party client, we will write our own TCP client.
