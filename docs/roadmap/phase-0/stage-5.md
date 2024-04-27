# Stage 5: TCP Proxy

## Recap

- In the previous stage, we modified our TCP server code to handle multiple clients simultaneously using epoll

## Learning Objectives

- We will combine the functionalities of a TCP server from [Stage 1](/roadmap/phase-0/stage-1) and client from [Stage 3](/roadmap/phase-0/stage-3) to make a TCP [proxy](https://en.wikipedia.org/wiki/Proxy_server) which will relay communication between a web browser and a python file server.

## Introduction

[Proxy](https://en.wikipedia.org/wiki/Proxy_server) is a intermediary which sits in between a client and an [upstream server](https://en.wikipedia.org/wiki/Upstream_server) and relays communication between them. When a client makes a request to access a resource (such as a website or a file), it connects to the proxy server instead of directly connecting to the target server. The proxy server then forwards the client's request to the target server, retrieves the response, and sends it back to the client.

In this stage, our client will be a web browser and upstream server will be a python file server serving a folder on our local hard drive. Instead of the web browser directly connecting with the python file server, it makes a connection to the proxy which in turn will connect to the python server to relay the request from the browser.

![tcp-proxy.png](/assets/stage-4/tcp-proxy.png)

Before we get into the implementation of the proxy, lets have a look at what we are trying to achieve. We will start by running a python file server.

Open a terminal and navigate to the folder you want to serve. Run the following command below to start a simple python file server:

This command starts [Python's inbuilt HTTP server module](https://docs.python.org/3/library/http.server.html) which will serve the files in the folder it started in.

```bash
python -m http.server 3000
```

Now that the local file server is running on port 3000, we can connect to it using a browser by going to `localhost:3000`.

![python-server.png](/assets/stage-4/python-server.png)

Right now, the client (web browser), is directly accessing the file server. Our goal is to modify the TCP server code from Stage 3 to turn it into a TCP proxy server, so that all the communication between the client and upstream server goes though the proxy.

## Implementation

![implementation.png](/assets/stage-4/implementation.png)

There will be few major changes in the structure of the code from previous stage where we wrote the entire implementation in `main()`. Thus, for this stage, we recommended working on a new separate file; let’s call it `tcp_proxy.c`.

In addition to the previous definitions in `tcp_server.c`, add a global definition at the top of the file for the upstream port number that we will be serving the python file server from.

::: tip NOTE
Add this to global definitions

```c
#define UPSTREAM_PORT 3000
```

:::

We’ll start with encapsulation of the code written in the previous stage by placing them in different functions. Copy over the code from `tcp_server.c` and place it in the appropriate functions:

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
  /* infinite loop and processing epoll events */
}
```

Let’s focus on `loop_run(int epoll_fd)` now. In the previous stage, we had epoll events from two sources; the listen socket and the connection socket. Now there will be another socket that we will be adding to our epoll called as the **upstream socket**.

The python file server is the upstream server in our case. When a user connects to the TCP proxy server to access files from the upstream server, the TCP proxy server will open a connection to the upstream server. All the communication sent to the proxy by the client will be relayed to the file server, and similarly data sent by the file server to the proxy (intended for the client) will be sent through this connection.

The figure below illustrates the three different events that could occur in epoll, and how we should handle each one of them:

![events.png](/assets/stage-4/events.png)

```c
void loop_run(int epoll_fd) {
	while (1) {
		printf("[DEBUG] Epoll wait\n");

		/* epoll wait */

		for (...) {
			if (/* event is on listen socket*/)
				accept_connection(); // we will implement this later
			else if (/* event is on connection socket */)
				handle_client(); // we will implement this later
			else if (/* event is on upstream socket */)
				handle_upstream(); // we will implement this later

		}
	}
}
```

Since we are aiming for concurrency, for each new client that connects to the proxy server, we need to create a new upstream link to connect with the file server. How can we effectively monitor the association between clients and their respective upstream links in scenarios where there are multiple clients?

This is where [**route tables**](https://en.wikipedia.org/wiki/Routing_table) come into play. We store the connection socket FD and its corresponding upstream socket FD in a pair wise manner.

Here are some global variables that could come handy:

::: tip NOTE
Add this to global variables:

```c
int listen_sock_fd, epoll_fd;
struct epoll_event events[MAX_EPOLL_EVENTS];
int route_table[MAX_SOCKS][2], route_table_size = 0;
```

:::

<!-- There is another problem that that might have popped up while reading the above code block.

::: danger QUESTION
Since we have only one listening socket we could easily check whether the event is on the listen socket (we did this in Stage 3). But since we can have multiple connection sockets and multiple upstream sockets, how will we determine if the event is on a connection socket or an upstream socket?
::: -->

Now that we have that, we are ready to start accepting connection; so lets write the `accept_connection()` function.

### `accept_connection()`

`accept_connection()` takes `listen_sock_fd` as a param and do the following

- Accept the client connection and create the connection socket FD `conn_sock_fd`
- Add the connection socket to epoll to monitor for events using `epoll_ctl()`
- Open up a connection to the upstream server using `connect_upstream()`, and add it to the epoll
- An entry will be added to the route table with the `conn_sock_fd` and it's corresponding `upstream_sock_fd`

```c
void accept_connection(int listen_sock_fd) {

  int conn_sock_fd = /* accept client connection */

  /* add conn_sock_fd to loop using loop_attach() */

  // create connection to upstream server
  int upstream_sock_fd = connect_upstream();

  /* add upstream_sock_fd to loop using loop_attach() */

  // add conn_sock_fd and upstream_sock_fd to routing table
  route_table[route_table_size][0] = /* fill this */
  route_table[route_table_size][1] = /* fill this */
  route_table_size += 1;

}
```

Try and implement the function `connect_upstream()` to create a connection to the upstream server.

```c
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

- There are three different events that the proxy has to handle:
  - Event on the listen socket when a client tries to connect with the proxy (intended to communicate with the upstream server) - `accept_connection()`
  - Event on the connection socket when client sends message to proxy (intended for the upstream server) - `handle_client()`
  - Event on the upstream socket when the upstream server sends message to proxy (intended for the client) - `handle_upstream()`

---

Now that we have accepted the clients, we need to handle. We will create the `handle_client()` function to receive the messages from the client, and send it to the upstream server.

### `handle_client()`

This implementation is similar to how we handled clients in the previous stages with a few changes.

```c
void handle_client(int conn_sock_fd) {

  int read_n = /* read message from client to buffer using recv */

  // client closed connection or error occurred
  if (read_n <= 0) {
    close(conn_sock_fd);
    return;
  }

  /* print client message (helpful during milestone#2) */

  /* find the right upstream socket from the route table */

  // sending client message to upstream
  int bytes_written = 0;
  int message_len = read_n;
  while (bytes_written < message_len) {
    int n = send(/* found upstream socket */, buff + bytes_written, message_len - bytes_written, 0);
    bytes_written += n;
  }

}
```

Find the upstream socket associated with `conn_sock_fd` and route table and start sending the message that we received from the client.

::: tip NOTE
There is a noticeable change to the `send()` function compared to the last stage. The drawback with the old approach will appear when we are sending large amounts of data due to limitations in buffer size and network conditions. We will look into this in an exercise at the end.

The new approach allows us to handle large data by sending it in smaller chunks, and lets us handle any errors.
:::

---

When there are messages to be read from the upstream server, the `handle_upstream()` function kicks in and takes over.

### `handle_upstream()`

This function will be strikingly similar to `handle_client()` with few obvious changes. `handle_upstream()` will be responsible to receive messages from the upstream, find the matching connection, and send the message to the client.

```c
void handle_upstream(int upstream_sock_fd) {

  int read_n = /* read message from upstream to buffer using recv */

  // Upstream closed connection or error occurred
  if (read_n <= 0) {
    close(upstream_sock_fd);
    return;
	}

  /* find the right client socket from the route table */

  /* send upstream message to client */

}
```

---

With encapsulation of code into multiple functions, our main function will look very minimal and it will be responsible for setting up and making the proxy run.

```c
int main() {

	listen_socket_fd = /* create server using server_create() */

	epoll_fd = /* create loop instance using loop_create() */

	/* attach server to event loop using loop_attach() */

	/* start event loop with loop_run() */

}
```

At the end, our code will have a structure similar to this:

::: details expserver/tcp_proxy.c

```c
/* includes, defines and global variables */

/* any helper functions you might write */

int connect_upstream() {
	/* connect to upstream server */
}

void accept_connection(int listen_sock_fd) {
	/* accept client connection */
}

void handle_client(int conn_sock_fd) {
	/* handle client */
}

void handle_upstream(int upstream_sock_fd) {
	/* handle upstream */
}

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
	/* initialize proxy */
}
```

:::

::: warning
There is no restriction to just these functions. Feel free to create additional helper functions as needed to suit your requirements.
:::

---

### Milestone #2

To test our code, we will essentially try to replicate what we saw in the introduction, i.e. a Python file server. But there, our browser being the client, had a direct connection to the file server.

Right now, we want our browser to connect to the proxy server, which in turn will proxy the request to the python server.

Start the python file server to serve the `expserver/` directory:

```bash
python -m http.server 3000
```

The file server will start with the following message if successful:

```bash
Serving HTTP on 0.0.0.0 port 3000 (http://0.0.0.0:3000/) ...
```

Compile and run `tcp_server.c`. The terminal should output the following:

```bash
[INFO] Server listening on port 8080
[DEBUG] Epoll wait
```

Now, the fileserver is active on port `3000` and the proxy is running on port `8080`. In the introduction demo, we connected to the file server directly by accessing `localhost:3000` from our browser (client). This time, we’ll connect to the proxy by looking up `localhost:8080` in the browser.

Both links should lead to the same file server; they're just different paths. If this works as expected, it indicates that our proxy is functioning perfectly!

If you included a `printf` statement in `handle_client()` to print the client message, you would get a [HTTP](https://nl.wikipedia.org/wiki/Hypertext_Transfer_Protocol) request message in the proxy terminal when the client visits `localhost:8080`.

```bash
[CLIENT MESSAGE] GET / HTTP/1.1
Host: localhost:8080
Connection: keep-alive
sec-ch-ua: "Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "Windows"
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7
Sec-Fetch-Site: none
Sec-Fetch-Mode: navigate
Sec-Fetch-User: ?1
Sec-Fetch-Dest: document
Accept-Encoding: gzip, deflate, br
Accept-Language: en-US,en;q=0.9
```

The proxy should go back to the `epoll_wait` state and wait for more events.

```bash
[DEBUG] Epoll wait
```

Keep testing the code by navigating across the file sever, and opening files. Make sure the proxy does not exit out of the program.

## Experiments

### Experiment #1

In our `handle_client()` function, we modified the send() functionality. Try switching this out for the old approach that we used in Stage 3 and test if everything works properly.

## Conclusion

This marks the end of Phase 0.

The learning doesn't stop here though as in the next phase, as we’ll start building eXpServer. Phase 0 laid the foundation as to what is about to come next. Read more about Phase 1 [here](/roadmap/phase-1/).
