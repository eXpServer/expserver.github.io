# Stage 20: Load Balancing

## Recap

In the previous stages, we have implemented various features in our webserver. Stage 16 focused on the configuration module, where we used a JSON file to configure the server and implemented reverse proxy and URL redirection. In Stage 17, we implemented directory browsing, allowing the server to generate a directory listing when an index file is not available. In the subsequent stages, we extended the server with additional request-handling and access-control functionality.

In this stage, we are going to implement **load balancing** for the reverse proxy. Load balancing allows the reverse proxy to distribute incoming requests across multiple upstream servers instead of forwarding all requests to a single server.

## Learning Objectives

* Understand the concept of load balancing in a reverse proxy
* Configure multiple upstream servers for a route
* Implement round-robin load balancing
* Implement IP-hash based load balancing
* Select an upstream server based on the configured load balancing strategy

## Introduction

Load balancing is a technique used to distribute incoming requests across multiple servers. In our reverse proxy implementation, we can configure multiple upstream servers for the same route.

For example, instead of forwarding all requests to a single server:

```text
Client
   |
   v
eXpServer
   |
   v
localhost:3000
```

we can configure multiple upstream servers:

```text
                    +--> localhost:3000
                    |
Client --> eXpServer+--> localhost:3001
                    |
                    +--> localhost:3002
```

The reverse proxy selects one of these upstream servers whenever a request is received.

In this stage, we implement two load balancing strategies:

* **`round_robin`** - Selects upstream servers sequentially.
* **`ip_hash`** - Uses the client IP address to select an upstream server.

### Round Robin

The round-robin strategy distributes requests sequentially among the configured upstream servers.

For example, if there are three upstream servers:

```text
localhost:3000
localhost:3001
localhost:3002
```

the requests will be distributed as:

```text
Request 1 -> localhost:3000
Request 2 -> localhost:3001
Request 3 -> localhost:3002
Request 4 -> localhost:3000
Request 5 -> localhost:3001
Request 6 -> localhost:3002
```

The upstream index is calculated using:

```c
index = counter++ % upstreams.length;
```

The counter is incremented after each request.

### IP Hash

The IP-hash strategy uses the client's IP address to determine which upstream server should handle the request.

The client IP is converted using `inet_pton()` and the resulting value is used to calculate the upstream index:

```c
index = inet_pton(client_ip) % upstreams.length;
```

This allows requests from the same client IP to consistently select the same upstream server.

## Implementation

In this stage, we need to modify the configuration structure and configuration lookup logic.

The following files are modified:

```text
config/xps_config.h
config/xps_config.c
```

### `config/xps_config.h`

We need to add two new fields to the `xps_config_route_s` structure.

```c
const char *load_balancing;
u_long _round_robin_counter;
```

The `load_balancing` field stores the load balancing strategy configured for the route.

It can contain:

```text
round_robin
```

or

```text
ip_hash
```

The `_round_robin_counter` is an internal counter used by the round-robin strategy to keep track of which upstream server should be selected next.

---

### `config/xps_config.c`

In this file, we need to make changes in `parse_server()`, `parse_route()` and `xps_config_lookup()`.

### `parse_server()`

When the server configuration is initialized, we set the default load balancing strategy to `round_robin`.

We also initialize the round-robin counter to zero.

```c
load_balancing = "round_robin";
_round_robin_counter = 0;
```

This means that if no load balancing strategy is specified in the configuration, the server will use round-robin load balancing by default.

---

### `parse_route()`

The `load_balancing` value is read from the route configuration JSON.

For example, if the configuration contains:

```json
{
    "req_path": "/",
    "type": "reverse_proxy",
    "upstreams": [
        "localhost:3000",
        "localhost:3001",
        "localhost:3002"
    ],
    "load_balancing": "round_robin"
}
```

the value:

```text
round_robin
```

is stored in the `load_balancing` field of the corresponding route.

Similarly, the following configuration selects IP hashing:

```json
{
    "req_path": "/",
    "type": "reverse_proxy",
    "upstreams": [
        "localhost:3000",
        "localhost:3001",
        "localhost:3002"
    ],
    "load_balancing": "ip_hash"
}
```

---

### `xps_config_lookup()`

The actual upstream selection is performed in `xps_config_lookup()`.

When a request matches a reverse proxy route, we have multiple upstream servers available. Based on the value of `load_balancing`, we select one of these upstreams.

For the `round_robin` strategy:

```c
index = route->_round_robin_counter++ % upstreams.length;
```

For example, if there are three upstream servers, the counter produces the following indexes:

```text
0 % 3 = 0
1 % 3 = 1
2 % 3 = 2
3 % 3 = 0
4 % 3 = 1
5 % 3 = 2
```

Therefore, the upstream selection becomes:

```text
0 -> 1 -> 2 -> 0 -> 1 -> 2 -> ...
```

For the `ip_hash` strategy, the client IP is used to calculate the upstream index:

```c
index = inet_pton(client_ip) % upstreams.length;
```

The selected index is then used to select the corresponding upstream server from the upstream list.

:::tip NOTE

The `ip_hash` strategy is intended to consistently route requests from the same client IP to the same upstream server. The mapping depends on the configured upstream list, so changing the number or ordering of upstreams can change the resulting mapping.
::::
## Config Example

The reverse proxy configuration can now contain multiple upstream servers and a load balancing strategy.

```json
{
    "req_path": "/",
    "type": "reverse_proxy",
    "upstreams": [
        "localhost:3000",
        "localhost:3001",
        "localhost:3002"
    ],
    "load_balancing": "round_robin"
}
```

Here we have configured three upstream servers:

```text
localhost:3000
localhost:3001
localhost:3002
```

and selected:

```text
round_robin
```

as the load balancing strategy.

The same configuration can be changed to:

```json
"load_balancing": "ip_hash"
```

to use IP-based load balancing.

## Milestone #1

Build the server and run it with the updated configuration.

Start three upstream servers on:

```text
localhost:3000
localhost:3001
localhost:3002
```

Configure eXpServer to listen on port `8002` and forward requests to these upstream servers using the `round_robin` strategy.

Now send multiple requests:

```bash
curl http://localhost:8002/
curl http://localhost:8002/
curl http://localhost:8002/
```

If the implementation is correct, the requests should be distributed between the three upstream servers in sequential order.

## Experiments

### Experiment #1

Test the **round-robin** load balancing strategy.

Use the following configuration:

```json
{
    "req_path": "/",
    "type": "reverse_proxy",
    "upstreams": [
        "localhost:3000",
        "localhost:3001",
        "localhost:3002"
    ],
    "load_balancing": "round_robin"
}
```

Send multiple requests:

```bash
curl http://localhost:8002/
curl http://localhost:8002/
curl http://localhost:8002/
curl http://localhost:8002/
curl http://localhost:8002/
curl http://localhost:8002/
```

Observe the upstream server handling each request.

The expected sequence is:

```text
localhost:3000
localhost:3001
localhost:3002
localhost:3000
localhost:3001
localhost:3002
```

This demonstrates that the round-robin counter is used to select the next upstream server for every request.

### Experiment #2

Test the **IP-hash** load balancing strategy.

Change the configuration to:

```json
{
    "req_path": "/",
    "type": "reverse_proxy",
    "upstreams": [
        "localhost:3000",
        "localhost:3001",
        "localhost:3002"
    ],
    "load_balancing": "ip_hash"
}
```

Now send requests using different client IP addresses:

```bash
curl --interface 127.0.0.1 http://localhost:8002/
curl --interface 127.0.0.2 http://localhost:8002/
```

Repeat the request using the same IP address:

```bash
curl --interface 127.0.0.1 http://localhost:8002/
curl --interface 127.0.0.1 http://localhost:8002/
```

Requests originating from the same client IP should select the same upstream according to the configured IP-hash calculation.

### Experiment #3

Remove the `load_balancing` field from the configuration:

```json
{
    "req_path": "/",
    "type": "reverse_proxy",
    "upstreams": [
        "localhost:3000",
        "localhost:3001",
        "localhost:3002"
    ]
}
```

Since the default strategy is initialized as:

```text
round_robin
```

the server should continue to distribute requests across the upstream servers using round-robin load balancing.

## Conclusion

In this stage, we implemented **load balancing support for the reverse proxy**.

The reverse proxy can now distribute requests across multiple upstream servers using two different strategies: `round_robin` and `ip_hash`.

The `round_robin` strategy rotates through the configured upstream servers sequentially, while the `ip_hash` strategy uses the client IP address to select an upstream server.

We also modified the route configuration structure to store the selected load balancing strategy and maintain an internal counter for round-robin selection.

With this implementation, eXpServer can now distribute reverse proxy requests across multiple upstream servers instead of forwarding every request to a single backend server.

:::
