# Stage 4: TCP Proxy

## Recap

- We modified the TCP server code to handle multiple clients simultaneously using epoll

## Introduction

In this stage, we will combine the functionalities of a TCP server and client to make a TCP **proxy**.

Proxy is a intermediary which sits in between a client and a server and relays communication between them. When a client makes a request to access a resource (such as a website or a file), it connects to the proxy server instead of directly connecting to the target server. The proxy server then forwards the client's request to the target server, retrieves the response, and sends it back to the client.

In this stage, our client will be a web browser and server will be a python file server serving a folder on our local hard drive. Instead of the web browser directly connecting with the python file server, it makes a connection to the proxy which in turn will connect to the python server to relay the request from the browser.

![tcp-proxy.png](/assets/stage-4/tcp-proxy.png)

Before we get into the implementation of the proxy, lets have a look at what we are trying to achieve. We will start by running a python file server.

Open a terminal and navigate to the folder you want to serve. Run the following command below to start a simple python file server:

```bash
python3 -m http.server 3000
```

Now that the local file server is running on port 3000, we can connect to it using a browser by going to `[localhost:3000](http://localhost:3000)`.

![python-server.png](/assets/stage-4/python-server.png)

Right now, the client (web browser), is directly accessing the file server. We will modify our TCP server code from Stage 3 to turn it into a TCP proxy server.

## Implementation

We’ll start with modularization of the code written in the previous stage by placing them in different functions:

```c
int create_loop() {
	/* return new epoll instance */
}

void loop_attach(int epoll_fd, int fd, int events) {
	/* attach fd to epoll */
}

int create_server() {
	/* create listening socket and return it */
}

void loop_run(int epoll_fd) {
	/* infinite loop and for loop*/
}
```

Let’s focus on `loop_run(int epoll_fd)` now. In the previous stage, we had epoll events from two sources; the listen socket and the connection socket. Now there will be another socket that we will be adding to our epoll called as the **upstream socket**.

The python file server is the **upstream server** in our case. When a user connects to the TCP proxy server to access files from the upstream server, the TCP proxy server will open a connection to the upstream server. All the communication sent to the proxy by the client will be relayed to the file server, and similarly data sent by the file server to the proxy (intended for the client) will be sent through this connection.

![tcp-proxy-2.png](/assets/stage-4/tcp-proxy-2.png)

```c
void loop_run(int epoll_fd) {
	while (1) {
		/* epoll wait */

		for (...) {
			if (/* event is on listen socket*/)
				accept_connection();
			else if (/* event is on connection socket */)
				handle_client();
			else if (/* event is on upstream socket */)
				handle_upstream();
		}
	}
}
```

Since we are aiming for concurrency, for each new client that connects to the proxy server, we need to create a new upstream link to connect with the file server. But how do we know which client is connected to which upstream link when we have multiple clients?

This is where **route tables** come into play. We store the connection socket FD and its corresponding upstream socket FD in a pair wise manner; `int route_table[MAX_SOCKS][2]`.

Now that we have that, we are ready to start accepting connection; so lets write the `accept_connection()` function.

### `accept_connection()`

With the listen socket FD as input, it accepts the client connection and creates the connection socket FD. Add the connection socket to epoll to monitor for events on it.

Now, create a function `connect_upstream()` to create a connection to the upstream server.

```c
void accept_connection(int listen_sock_fd) {

  int conn_sock_fd = /* accept client connection */

  /* add conn_sock_fd to loop using loop_attach() */

  // add connection socket to conn_socks array
  conn_socks[conn_socks_size] = conn_sock_fd;
  conn_socks_size += 1;

  // create connection to upstream server
  int upstream_sock_fd = connect_upstream();

  /* add upstream_sock_fd to loop using loop_attach() */

  // add upstream socket to upstream_socks array
  upstream_socks[upstream_socks_size] = upstream_sock_fd;
  upstream_socks_size += 1;

  // add conn_sock_fd and upstream_sock_fd to routing table
  rout_table[rout_table_size][0] = /* fill this */
  rout_table[rout_table_size][1] = /* fill this */
  rout_table_size += 1;

}

int connect_upstream() {

  int upstream_sock_fd = /* create a upstrem socket */

  struct sockaddr_in upstream_addr;
  /* add upstream server details */

  connect(/* connect to upstream server */);

  return upstream_sock_fd;
}
```

### Milestone #1

Quick recap!

Fill this

---

Now that we have accepted the clients, time to handle them. We will create the `handle_client()` function to receive the messages from the client, and send it to the upstream server.

### `handle_client()`

This implementation is similar to how we handled clients in the previous stages with few changes.

First we have to find the correct upstream server to send the client message to. The route table we created earlier will come in handy. Let’s write a small function `find_matching_upstream()` for this purpose.

```c
int find_matching_upstream(int conn_sock_fd) {

  /* cycle through the route table entries and return the corresponding upstream_sock_fd */

}
```

Once we have found the right upstream server, we can now start sending the message that we received from the client.

But here comes the second problem. What if there is a read and write speed mismatch between the client and the server? Or to be specific, the proxy and the upstream server?

Let’s take an example to understand this better:

- A sends message at 100 words/min to B
- B can read messages sent by A at 80 words/min

This means that there is a 20 words/min speed difference. There are few ways to overcome this problem:

- A can restrict the speed at which it is sending to B
- Or A can send with 100 words/min and B has some way to respond to A saying it only received 80 words. Then A the next time will send 100 words which will include the previous 20 words that B missed earlier.

Conveniently, the `send()` function that we were using earlier actually returns the number of bytes sent. We can use this to keep sending the entire message in a while loop.

```c
void handle_client(int conn_sock_fd) {

	int read_n = /* read message from client to buffer using recv */

  // client closed connection or error occurred
  if (read_n <= 0)
    close(conn_sock_fd);

  int matching_upstream_sock = find_matching_upstream(conn_sock_fd);

  // sending client message to upstream
  int bytes_written = 0;
  int message_len = read_n;
  while (bytes_written < message_len) {
    int n = /* send message from buffer to upstream using send() */
    bytes_written += n;
  }

}
```

---

To handle what happens on the upstream server, let’s create a function `handle_upstream()`.

### `handle_upstream()`

This function will be strikingly similar to `handle_client()` with few obvious changes. `handle_upstream()` will be responsible to receive messages from the upstream, find the matching connection, and send the message to it.

```c
void handle_upstream(int upstream_sock_fd) {

  int read_n = /* read message from upstream to buffer using recv */

  // upstream closed connection or error occurred
  if (read_n <= 0)
    close(upstream_sock_fd);

  int matching_conn_sock = find_matching_conn(upstream_sock_fd);

  /* send upstream message to client */

}

int find_matching_conn(int upstream_sock_fd) {

  /* cycle through the route table entries and return the corresponding conn_sock_fd */

}
```

---

### Milestone #2

---

## Conclusion

At the end, your code will have a structure similar to this:

```c
int is_conn_sock(int fd) {}

int is_upstream_sock(int fd) {}

int find_matching_upstream(int conn_sock_fd) {}

int find_matching_conn(int upstream_sock_fd) {}

int connect_upstream() {}

void accept_connection(int listen_sock_fd) {}

void handle_client(int conn_sock_fd) {}

void handle_upstream(int upstream_sock_fd) {}

int create_loop() {
	/* return new epoll instance */
}

void loop_attach(int epoll_fd, int fd, int events) {
	/* attach fd to epoll */
}

int create_server() {
	/* create listening socket and return it */
}

void loop_run(int epoll_fd) {
	/* infinite loop and for loop*/
}

int main() {
	/* listen_socket_fd = call create_server */

	/* epoll_fd = call create_loop */

	/* call loop attach */

	/* call loop run */
}
```
