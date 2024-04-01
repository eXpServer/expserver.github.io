# HTTP

[RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110)

Hypertext Transfer Protocol (HTTP) is an application-layer protocol for transmitting hypermedia documents, such as HTML. It was designed for communication between web browsers and web servers.

HTTP follows a classical client-server model, with a client opening a connection to make a request, then waiting until it receives a response.

For eXpServer, we will be focusing on HTTP version 1.1

## HTTP messages

HTTP messages are how data is exchanged between a server and a client.

There are two types of HTTP messages:

1. HTTP request (client → server)
2. HTTP response (server → client)

Typically these messages are written by the web server (eg. eXpServer) and the web client (eg, web browser)

HTTP requests, and responses, share similar structure and are composed of:

1. **Start line** (request or response line depending upon the type of message)
2. (optional) **HTTP headers**
3. **Blank line**, to indicate that all meta-information has been sent
4. (optional) **Body** containing data associated with the request or response

![http-request](/assets/resources/http-request.png)

HTTP request

![http-response](/assets/resources/http-response.png)

HTTP response

### **HTTP request line**

The HTTP request line contains three elements:

1. HTTP method - describes the action to be performed
   1. GET
   2. PUT
   3. HEAD
   4. POST
   5. TRACE
   6. DELETE
   7. OPTIONS
   8. CONNECT
2. Request URI - typically the URL of the target resource. They can of different forms:
   - Relative path - `/folder/image.png?query=value`
   - Absolute path - `https://www.google.com`
   - Path with port - `http://localhost:3000`
3. HTTP version - indicates the structure of the message and the expected version to use for the HTTP response message.
   - HTTP/1.1

### **HTTP response line**

The HTTP response line contains three elements:

1. HTTP version
   - HTTP/1.1
2. [Status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status), indicating success or failure. Below are some common status codes:
   - 200
   - 301
   - 404
   - 500
3. Status text. Below are the status texts for the above status codes.
   - OK
   - Moved permanently
   - Not found
   - Internal server error

### Headers

HTTP headers provide additional information about the message or modify its behavior. These headers are key-value pairs included in the HTTP message's header section and serve various purposes. They are typically organized into four categories, each fulfilling distinct roles. Here are the four classifications along with examples:

1. General headers
   - `Connection: ...`
   - `Upgrade: ...`
2. Request headers (HTTP request message)
   - `Host: ...`
   - `User-Agent: ...`
3. Response headers (HTTP response message)
   - `Server: ...`
   - `Set-Cookie: ...`
4. Representation headers
   - `Encoding-Length: ...`
   - `Encoding-Type: ...`

### Body

Final part of the message is the body. This section is optional and is not present in all the messages. The HTTP headers and body is separated by a line space. This helps identify the starting point of the body.

## HTTP request message

```HTTP
GET / HTTP/2
Host: exposnitc.github.io
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Sec-Fetch-Dest: document
Sec-Fetch-Mode: navigate
Sec-Fetch-Site: none
Sec-Fetch-User: ?1
TE: trailers
If-Modified-Since: Fri, 05 Aug 2022 08:53:35 GMT
If-None-Match: W/"62ecda8f-5368"
```

## HTTP response message

```HTTP
HTTP/2 200
server: GitHub.com
content-type: text/html; charset=utf-8
permissions-policy: interest-cohort=()
last-modified: Fri, 05 Aug 2022 08:53:35 GMT
access-control-allow-origin: *
etag: W/"62ecda8f-5368"
expires: Tue, 12 Mar 2024 13:29:22 GMT
cache-control: max-age=600
content-encoding: gzip
x-proxy-cache: MISS
x-github-request-id: E880:1D9ECB:333BEA:3C70EB:65F0565A
accept-ranges: bytes
date: Tue, 12 Mar 2024 13:19:27 GMT
via: 1.1 varnish
age: 4
x-served-by: cache-maa10248-MAA
x-cache: HIT
x-cache-hits: 1
x-timer: S1710249567.493121,VS0,VE0
vary: Accept-Encoding
x-fastly-request-id: 5fde57c5822c12587e45d95930e5beee2ca931df
content-length: 5985
X-Firefox-Spdy: h2

<!DOCTYPE html>
<!--[if lt IE 7]> <html class="ie ie6 lt-ie9 lt-ie8 lt-ie7" lang="en"> <![endif]-->
<!--[if IE 7]>    <html class="ie ie7 lt-ie9 lt-ie8"        lang="en"> <![endif]-->
<!--[if IE 8]>    <html class="ie ie8 lt-ie9"               lang="en"> <![endif]-->
<!--[if IE 9]>    <html class="ie ie9"                      lang="en"> <![endif]-->
<!--[if !IE]><!-->
<html lang="en" class="no-ie">
...
```
