# xps_utils

`xps_utils` is a module containing a collection of utility functions that will be utilized throughout the project. Additional utility functions will be implemented as needed according to the project roadmap.

## Usage

Utility code and functions are defined inside `xps_utils.c` and `xps_utils.h` placed in `expserver/src/utils`.

::: details **expserver/src/utils/xps_utils.h**

```c
#ifndef XPS_UTILS_H
#define XPS_UTILS_H

#include "../xps.h"

// Sockets
bool is_valid_port(u_int port);
int make_socket_non_blocking(u_int sock_fd);
struct addrinfo *xps_getaddrinfo(const char *host, u_int port);
char *get_remote_ip(u_int sock_fd);

// Other functions

#endif
```

:::

## Functions

### `is_valid_port()`

Checks if a port number is within the valid range of 0 to 65535 (inclusive).

```c
bool is_valid_port(u_int port) { return port >= 0 && port <= 65535; }
```

### `xps_getaddrinfo()`

Resolves the given host and port to an IPv4 address using [`getaddrinfo()`](https://man7.org/linux/man-pages/man3/getaddrinfo.3.html), and returns a pointer to the resulting `addrinfo` structure.

The `getaddrinfo()` function provided by the [<netdb.h>](https://pubs.opengroup.org/onlinepubs/009695399/basedefs/netdb.h.html) header used to perform [DNS](https://en.wikipedia.org/wiki/Domain_Name_System) lookup to resolve a hostname and service name to a set of socket addresses.

```c
struct addrinfo {
  int              ai_flags;
  int              ai_family;
  int              ai_socktype;
  int              ai_protocol;
  socklen_t        ai_addrlen;
  struct sockaddr *ai_addr;
  char            *ai_canonname;
  struct addrinfo *ai_next;
};
```

Given above is the definintion for `struct addrinfo`. A call to `getaddrinfo(host, port_str, &hints, &result)` will return a linked list of all the resolved addresses. A given `host` and `port` combination could have multiple addresses. For example, the host `google.com` could resolve to multiple IP addresses.

We are only interested in the `ai_addr` field as it is taken by `bind()` system call to bind to the particular addresss.

[`inet_ntop()`](https://man7.org/linux/man-pages/man3/inet_ntop.3.html) provided by [<arpa/inet.h>](https://pubs.opengroup.org/onlinepubs/7908799/xns/arpainet.h.html) converts the IPv4 address in binary form to text form.

The memory for `struct addrinfo *` is dynamically allocated by `getaddrinfo()`. Hence a corresponding free funciton, `freeaddrinfo()` is used to free the memory.

```c
struct addrinfo *xps_getaddrinfo(const char *host, u_int port) {
  assert(host != NULL);
  assert(is_valid_port(port));

  struct addrinfo hints, *result;
  memset(&hints, 0, sizeof(struct addrinfo));
  hints.ai_family = AF_INET;
  hints.ai_socktype = SOCK_STREAM;

  char port_str[20];
  sprintf(port_str, "%u", port);

  int err = getaddrinfo(host, port_str, &hints, &result);
  if (err != 0) {
    logger(LOG_ERROR, "xps_getaddrinfo()", "getaddrinfo() error");
    return NULL;
  }

  char ip_str[30];
  struct sockaddr_in *ipv4 = (struct sockaddr_in *)result->ai_addr;
  if (inet_ntop(result->ai_family, &(ipv4->sin_addr), ip_str, sizeof(ip_str)) == NULL) {
    logger(LOG_ERROR, "xps_getaddrinfo()", "inet_ntop() failed");
    perror("Error message");
    freeaddrinfo(result);
    return NULL;
  }

  logger(LOG_DEBUG, "xps_getaddrinfo()", "host: %s, port: %u, resolved ip: %s", host, port, ip_str);

  return result;
}
```

### `make_socket_non_blocking()`

Makes a socket non-blocking by modifying its file descriptor flags using the [`fcntl`](https://man7.org/linux/man-pages/man2/fcntl.2.html) system call. It returns an error code if unsuccessful.

```c
int make_socket_non_blocking(u_int sock_fd) {
  // Get the current socket flags
  int flags = fcntl(sock_fd, F_GETFL, 0);
  if (flags < 0) {
    logger(LOG_ERROR, "make_socket_non_blocking()", "failed to get flags");
    perror("Error message");
    return E_FAIL;
  }

  // Set flags with O_NONBLOCK
  if (fcntl(sock_fd, F_SETFL, flags | O_NONBLOCK) < 0) {
    logger(LOG_ERROR, "make_socket_non_blocking()", "failed to set flags");
    perror("Error message");
    return E_FAIL;
  }

  return OK;
}
```

### `get_remote_ip()`

Retrieves the IP address of the remote peer connected to the given socket file descriptor `sock_fd`. It uses [`getpeername()`](https://man7.org/linux/man-pages/man2/getpeername.2.html) to get the peer's address, then converts it from binary to text using [`inet_ntop()`](https://man7.org/linux/man-pages/man3/inet_ntop.3.html).

```c
char *get_remote_ip(u_int sock_fd) {
  struct sockaddr_in addr;
  socklen_t addr_len = sizeof(addr);
  char ipstr[INET_ADDRSTRLEN];

  if (getpeername(sock_fd, (struct sockaddr *)&addr, &addr_len) != 0) {
    logger(LOG_ERROR, "get_remote_ip()", "getpeername() failed");
    perror("Error message");
    return NULL;
  }

  char *ip_str = malloc(INET_ADDRSTRLEN);
  if (ip_str == NULL) {
    logger(LOG_ERROR, "get_remote_ip()", "malloc() failed for 'ip_str");
    return NULL;
  }

  inet_ntop(AF_INET, &addr.sin_addr, ip_str, INET_ADDRSTRLEN);

  return ip_str;
}

```
