# Stage 18: IP Whitelist/Blacklist

## Recap

In Phase 2, we have made expServer HTTP compatible and dynamically configurable using JSON file. We have also implemented directory browsing as a fallback when no index file is present.

## Learning Objectives

- We will implement IP whitelist/blacklist functionality

:::tip PRE-REQUISITE READING

Read about [IP whitelist/blacklist](https://instasafe.com/blog/whitelisting-vs-blacklisting-whats-the-difference/)

:::

## Introduction

Security in web servers isn't just about encryption and passwords; it's also about controlling *who* can reach your server in the first place. **IP Whitelisting and Blacklisting** are foundational access control mechanisms that allow you to filter traffic based on the client's origin, either by creating a "trusted" circle of allowed addresses or by proactively shielding against known malicious actors, bots, and spam sources.

## Implementation

In this stage, we will be adding IP-based access control to the server, allowing or denying requests based on the client's IP address. This enhances security by restricting access to specific IPs.

### xps_config

#### `xps_config.h`
We extend the configuration structures to include IP lists.

- Add to `xps_config_route_s`:
  - `ip_whitelist (vec_void_t)`
  - `ip_blacklist (vec_void_t)`
- Add the same fields to `xps_config_lookup_s` as well

#### `xps_config.c`
Updated parsing logic to handle IP lists in the JSON configuration.

- In `parse_server()`: Initialize the `ip_whitelist` and `ip_blacklist` vectors of the `route` structure with `vec_init(&route->ip_whitelist)` and `vec_init(&route->ip_blacklist)`.

- The configuration handles IP lists with the following precedence:

  - **Whitelist only**: Only the specified IP addresses are granted access.
  - **Blacklist only**: All IP addresses are allowed except those specifically listed.
  - **Both present**: The whitelist takes priority. We will filter the `ip_whitelist` by removing any IPs that also appear in the `ip_blacklist`, ensuring only trusted, non-blocked addresses remain.

:::details expserver/src/config/xps_config.c `parse_route()`

```c
void parse_route(JSON_Object *route_object, xps_config_route_t *route) {
  
  ...
  
  JSON_Array *ip_whitelist = json_object_get_array(route_object,  "ip_whitelist");
  JSON_Array *ip_blacklist = /*fill this*/

  if(ip_whitelist && !ip_blacklist){
      for(size_t i = 0; i < /*iterate through ip_whitelist array*/; i++)
      vec_push(&(route->ip_whitelist), /*get ith IP from ip_whitelist array*/);
  }else if(ip_blacklist && !ip_whitelist){
      /*fill this*/
  }else if(ip_whitelist && ip_blacklist) {
      /*fill this*/
  }
}
```

:::



- In `xps_config_lookup()`: Copy the `ip_whitelist` and `ip_blacklist` pointers from the matched route into the lookup structure <br> (ie, by doing `lookup->ip_whitelist = route->ip_whitelist` etc..)


### xps_session

#### `xps_session.c`
In `session_process_request()`, we add IP filtering logic before processing the request.

1. Check if the client IP is in the whitelist (if **whitelist** exists).
2. Check if the client IP is in the blacklist (if b**lacklist** exists).
3. If access is denied, return `HTTP_FORBIDDEN (403)` status.

:::details expserver/src/core/xps_session.c `session_process_request()`

```c
void session_process_request(xps_session_t *session) { 

  ...

  session->lookup = lookup; 

  // check whitelist exist 
  if (lookup->ip_whitelist.length > 0) { 
    const char *client_ip = session->client->remote_ip; 
    bool is_allowed = false; 
    for (size_t i = 0; i < lookup->ip_whitelist.length; i++) { 
        const char *ip_w = lookup->ip_whitelist.data[i]; 
        if (strcmp(client_ip, ip_w) == 0) { 
        is_allowed = true; 
        break; 
      } 
    } 
    if (!is_allowed) {
        logger(LOG_DEBUG, "session_process_request()", "client ip %s is not whitelisted", client_ip); 
        xps_http_res_t *http_res = /*create http response with status code HTTP_FORBIDDEN*/
        xps_buffer_t *http_res_buff = /*serialize the http response*/
        /*set the response to client buffer*/
        /*destroy the http response*/
        return; 
    } 
  } 

  // check in blacklist 
  if (lookup->ip_blacklist.length > 0) { 
    const char *client_ip = /*fill this*/
    for (size_t i = 0; i < /*fill this*/; i++) { 
      const char *ip_b = /*fill this*/
      if (/*fill this*/) { 
        logger(LOG_DEBUG, "session_process_request()", "client ip %s is blacklisted", client_ip); 
        /*fill this*/
        return; 
      } 
    } 
  }

  ...
}
```
:::

With this we have implemented the whitelisting and blacklisting functionality to our expserver. 

## Milestone

By completing this stage, you have successfully added a vital security layer to your server. Verify your implementation by following the steps below:

Add `ip_whitelist` or `ip_blacklist` fields to your `xps_config.json` for specific routes. For example:
```json
{
  "routes": [
    {
     "req_path": "/",
     "type": "file_serve",
      "ip_whitelist": ["127.0.0.1", "0.0.0.0"],
      "ip_blacklist": ["127.0.0.2"]
    }
  ]
}

```

You can test all three scenarios directly from your terminal:
   - **Blacklist**: Add `127.0.0.1` to the blacklist and confirm you receive a `403 Forbidden`.
   - **Whitelist (Blocked)**: Set the whitelist to a dummy IP (e.g., `1.1.1.1`) and confirm access is denied.
   - **Whitelist (Allowed)**: Add `127.0.0.1` back to the whitelist and confirm a `200 OK`.

You can test with multiple IPs without the use of any VPNs. The entire `127.x.x.x` range points back to your machine. You can simulate requests from "different" users by forcing `curl` to bind to an alias IP:
   ```bash
   curl --interface 127.0.0.2 -i http://0.0.0.0:8001/sample.txt
   ```
   The `--interface` flag is used to specify the source IP address for the request and the `-i` flag is used to print the HTTP headers.
   If you add `127.0.0.2` to your blacklist, this command will trigger the 403 block perfectly.

With these tests passed, you are ready to move on to the next phase of optimization!

## Experiments

### Experiment #1


First, create a relatively large text file in your `public` directory. You can use the `yes` command to generate a 1MB file filled with repeated text:

```bash
# Generate a 1MB file of repeated text
yes "This is a long line of text for testing " | head -c 1048576 > public/large.txt
```

To see exactly what the server thinks it's sending, let's add a temporary `printf` in `xps_session.c` within the `session_process_request` function, specifically where we handle file serving:

Inside `session_process_request()`
```c

if (lookup->file_path) {
    ...
    session->file = file;
    printf("[Experiment] Serving file: %s | Size: %zu bytes\n", lookup->file_path, session->file->size); // [!code ++]
    ...
}
```


Start your server and use `curl` to request the file. We'll use the `-I` flag to see the headers:

```bash
curl -I http://localhost:8001/large.txt
```

In your server console, you should see:
```log
[Experiment] Serving file: public/large.txt | Size: 1048576 bytes

```

In the `curl` output, look for the `Content-Length` header:
`Content-Length: 1048576`

Currently, every single byte of the file is being sent over the wire, which is highly inefficient for larger files.

In the next stage, we will implement **Compression** to reduce this size and optimize data transfer. By compressing the response on the fly, we can minimize the amount of data sent over the wire, making our server faster and more bandwidth-efficient.


## Conclusion

With the implementation of IP-based access control, you have added a foundational security layer to eXpServer. By allowing or denying requests based on the client's IP, you can now protect sensitive routes or block malicious actors. However, keep in mind that IP filtering is just one part of a "defense-in-depth" strategy; in production, you should always complement it with HTTPS and proper authentication to protect against spoofing or proxy-based bypasses.

Now that we have secured our routes, it's time to focus on performance. In the next stage, we will learn how to compress our HTTP responses on the fly. By using compression algorithms, we can reduce the size of the data being sent over the wire. This not only saves bandwidth but also improves the loading speed for your users, making your server feel much more responsive and professional.