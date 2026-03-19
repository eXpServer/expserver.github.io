# HTTP

[Hypertext Transfer Protocol (HTTP)](https://en.wikipedia.org/wiki/HTTP) is an application-layer protocol for transmitting [hypermedia](https://en.wikipedia.org/wiki/Hypermedia) documents, such as HTML. It was designed for communication between web browsers and web servers.

HTTP follows a classical client-server model, with a client opening a connection to make a request, then waiting until it receives a response.

For eXpServer, we will be focusing on HTTP version 1.1

## HTTP messages

HTTP messages define how data is exchanged between a server and a client. There are two types of HTTP messages:

1. **HTTP Request** (client → server)
2. **HTTP Response** (server → client)

HTTP Requests and Responses share similar structure, and are composed of:

1. **Start line** (request line / status line depending upon the type of message)
2. (optional) **HTTP headers**
3. **Blank line** to indicate that all meta-information has been sent
4. (optional) **Message body** containing data associated with the request or response

![http.png](/assets/resources/http.png)

Let us look at each one of them in detail.

### HTTP Request

A HTTP Request message is made up of 4 sections:

1. Request line
2. Headers (optional)
3. Blank line
4. Message body (optional)

::: details _Example (From RFC9110)_

```HTTP
GET /hello.txt HTTP/1.1 User-Agent: curl/7.64.1 Host: www.example.com Accept-Language: en, mi
```

:::

#### **Request line**

Request line has three parts as indicated below:

```HTTP
method request-target HTTP-version /* Example: GET /index.html HTTP/1.1 */
```

1. **Method:** describes the action to be performed. Description of each can be found [here](https://www.rfc-editor.org/rfc/rfc9110#table-4). Below are all the methods supported by HTTP 1.1:

   | Method Name | Description |
   | :--- | :--- |
   | GET | Retrieves a representation of the specified resource. |
   | HEAD | Retrieves the headers of the specified resource. |
   | POST | Submits an entity to the specified resource. |
   | PUT | Replaces the representation of the target resource with the request payload. |
   | DELETE | Deletes the specified resource. |
   | CONNECT | Establishes a tunnel to the server identified by the target resource. |
   | OPTIONS | Describes the communication options for the target resource. |
   | TRACE | Performs a message loop-back test along the path to the target resource. |

2. **Request target:** URL or absolute path of the protocol, port and domain. Read about the exact format from [here](https://www.rfc-editor.org/rfc/rfc9110#section-4.1-3). Below are some examples:
   - `/`
   - `/background.png`
   - `/test.html?query=alibaba`
   - `https://expserver.github.io/roadmap/`
   - `developer.google.com:80`
   - `*`

3. **HTTP version:** Indicates the HTTP version used. Acts as an indicator of the expected version to use for the response. Our parser only needs to support `HTTP/1.0` and `HTTP/1.1`.
   - **`HTTP/1.0`**
   -- The first widely used version of HTTP.
   Uses a simple request–response model.
    Opens a new TCP connection for each request, making it slower.
    Does not support persistent connections by default.

   - **`HTTP/1.1`**
  -- Improved version of HTTP/1.0 and still widely used.
   Supports persistent connections (keep-alive), allowing multiple requests over a single connection.
   Introduces the mandatory [**`Host`**](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Host) header for virtual hosting. **Example:** `Host: www.example.com`
   Provides better caching and performance optimizations.

   - **`HTTP/2`**
  -- A major performance upgrade over HTTP/1.1.
   Uses a binary format instead of text.
   Supports multiplexing (multiple requests and responses over a single connection simultaneously).
   Includes header compression and server push features.

   - **`HTTP/3`**
  -- The latest version of HTTP.
   Built on QUIC, which uses UDP instead of TCP.
   Offers faster connection setup and lower latency.
   Performs better on unreliable networks (e.g., mobile networks).

#### **Headers (optional)**

:::tip READ
Before proceeding further, take a look at the various HTTP request and response headers listed [here](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields).
:::

Headers let the client and the server pass additional information with an HTTP request. Have a look at their syntax below:

```HTTP
header-key: header-value /* Example: Host: www.example.com */
```

Below are some examples of headers, specific to HTTP Request:

- [**`Accept`**](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Accept)
  Specifies the media types that the client is willing to receive in the response. It allows the server to choose the most appropriate format, such as HTML or JSON.

  **Examples:** `Accept: text/html`, `Accept: application/json`, `Accept: */*`
- [**`Host`**](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Host)
  Specifies the domain name of the server and (optionally) the TCP port number on which the server is listening. It is mandatory in HTTP/1.1.

  **Example:** `Host: www.example.com`
- [**`Connection`**](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Connection)
  Controls whether the network connection should remain open after the current request. For example, `keep-alive` keeps the connection open for multiple requests, while `close` terminates it.

  **Examples:** `Connection: keep-alive`, `Connection: close`
- [**`Date`**](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Date)
  Represents the date and time at which the message was originated. It helps in caching, synchronization, and debugging of requests and responses.

  **Example:** `Date: Mon, 27 Jul 2009 12:28:53 GMT`

HTTP messages from the client could have custom Headers. eXpServer should be able to parse all of them, granted that they follow the syntax provided in the RFC.

#### **Blank line**

Blank line to separate HTTP Request head (Request line + Headers) from body ([CRLF](https://en.wikipedia.org/wiki/Newline)).

#### **Message body (optional)**

Body contains data associated with the request. For example, data from an HTML form. The length of the body is indicated by [`Content-Length`](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Content-Length) header in Headers.

::: tip NOTE
   [`Content-Length`](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Content-Length) specifies the size of the message body in bytes. It helps the client know how much data to expect in the response, ensuring the complete message is received correctly. 
   **Example:** `Content-Length: 51`
:::


### HTTP Response

A HTTP Response message is made up of 4 sections:

1. Status line
2. Headers (optional)
3. Blank line
4. Message body (optional)  

::: details _Example (From RFC9110)_

```HTTP
HTTP/1.1 200 OK Date: Mon, 27 Jul 2009 12:28:53 GMT Server: Apache Last-Modified: Wed, 22 Jul 2009
19:15:56 GMT ETag: "34aa387-d-1568eb00" Accept-Ranges: bytes Content-Length: 51 Vary:
Accept-Encoding Content-Type: text/plain Hello World! My content includes a trailing CRLF.
```

:::

#### **Status line:**

Response line has three parts as indicated below:

```HTTP
HTTP-version status-code status-text  /*Example: HTTP/1.1 200 OK*/
```

1. **HTTP version:** Indicates the HTTP version used. Out parser only needs to support `HTTP/1.0` and `HTTP/1.1`.
   - `HTTP/1.0`
   - `HTTP/1.1`
   - `HTTP/2`
   - `HTTP/3`

2. **Status codes and Status texts** Three digit integer codes that describes the result of the request and the semantics of the response. Learn more about there [here](https://www.rfc-editor.org/rfc/rfc9110#section-15). Here are some examples:
    - **`200`**: Status Text **`'OK'`**. The request was successful.
     The server has returned the requested resource.

   - **`301`**: Status Text **`Moved Permanently`**. The requested resource has been permanently moved to a new URL. Clients should use the new URL for future requests.

   - **`404`**: Status Text **`Not Found`**. The requested resource could not be found on the server.
     This usually means the URL is incorrect or the resource no longer exists.

   - **`500`**: Status Text **`Internal Server Error`**. The server encountered an unexpected error.
     The request could not be completed due to a problem on the server side.

#### **Headers (optional)**

Response headers follow the same syntax as Request headers. Below are some examples of headers, specific to HTTP Response:

- [**`Age`**](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Age)
  Indicates the time in seconds that the response has been stored in a cache. It helps clients understand how fresh or stale the cached response is before using it.

  **Example:** `Age: 12`
- [**`Location`**](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Location)
  Specifies the URL to which the client should redirect for further action. It is mainly used with redirection responses to guide the client to a new resource.

  **Example:** `Location: /index.html`
- [**`Server`**](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Server)
  Provides information about the software used by the origin server to handle the request. It may include the server name and version, which can help in debugging or diagnostics.

  **Example:** `Server: Apache/2.4.1 (Unix)`

#### **Blank line**

Blank line to separate HTTP Response head (Response line + Headers) from body ([CRLF](https://en.wikipedia.org/wiki/Newline)).

#### **Message body (optional)**

Body contains data associated with the response. For example, a HTML document. The length of the body is indicated by `Content-Length` header in Headers.
