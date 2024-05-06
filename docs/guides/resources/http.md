# HTTP

Hypertext Transfer Protocol (HTTP) is an application-layer protocol for transmitting hypermedia documents, such as HTML. It was designed for communication between web browsers and web servers.

HTTP follows a classical client-server model, with a client opening a connection to make a request, then waiting until it receives a response.

For eXpServer, we will be focusing on HTTP version 1.1

## HTTP messages

HTTP messages are how data is exchanged between a server and a client. There are two types of HTTP messages:

1. **HTTP Request** (client → server)
2. **HTTP Response** (server → client)

HTTP Requests, and Responses, share similar structure and are composed of:

1. **Start line** (request line / status line depending upon the type of message)
2. (optional) **HTTP headers**
3. **Blank line** to indicate that all meta-information has been sent
4. (optional) **Message body** containing data associated with the request or response

![http.png](/assets/resources/http.png)

Let us look at each one of them in detail.

### HTTP Request

A HTTP Request message is made up of 4 sections:

1. [Request line](#request-line)
2. [Headers (optional)](#headers-optional)
3. [Blank line](#blank-line)
4. [Message body (optional)](#message-body-optional)

::: details _Example (From RFC9110)_

```HTTP
GET /hello.txt HTTP/1.1 User-Agent: curl/7.64.1 Host: www.example.com Accept-Language: en, mi
```

:::

#### **Request line**

Request line has three parts as indicated below:

```HTTP
method request-target HTTP-version // Example GET /index.html HTTP/1.1
```

1. **Method:** describes the action to be performed. Description of each can be found [here](https://www.rfc-editor.org/rfc/rfc9110#table-4). Below are all the headers supported by HTTP 1.1:
   - `GET`
   - `HEAD`
   - `POST`
   - `PUT`
   - `DELETE`
   - `CONNECT`
   - `OPTIONS`
   - `TRACE`
2. **Request target:** URL or absolute path of the protocol, port and domain. Read about the exact format from [here](https://www.rfc-editor.org/rfc/rfc9110#section-4.1-3). Below are some examples:
   - `/`
   - `/background.png`
   - `/test.html?query=alibaba`
   - `https://expserver.github.io/roadmap/`
   - `developer.google.com:80`
   - `*`
3. **HTTP version:** Indicates the HTTP version used. Acts as an indicator of the expected version to use for the response. Out parser only needs to support `HTTP/1.0` and `HTTP/1.1`.
   - `HTTP/1.0`
   - `HTTP/1.1`
   - `HTTP/2`
   - `HTTP/3`

#### **Headers (optional)**

Headers let the client and the server pass additional information with an HTTP request. Have a look at their syntax below:

```HTTP
header-key: header-value // Example Host: www.example.com
```

Below are some examples of headers, specific to HTTP Request:

- `Accept`
- `Connection`
- `Date`

HTTP messages from the client could have custom Headers. eXpServer should be able to parse all of them, granted that they follow the syntax provided in the RFC.

#### **Blank line**

Blank line to separate HTTP Request head (Request line + Headers) from body ([CRLF](https://en.wikipedia.org/wiki/Newline)).

#### **Message body (optional)**

Body contains data associated with the request. For example, data from HTML form. The length of the body is indicated by `Content-Length` header in Headers.

### HTTP Response

A HTTP Response message is made up of 4 sections:

1. [Status line](#status-line)
2. [Headers (optional)](#headers-optional-1)
3. [Blank line](#blank-line-1)
4. [Message body (optional)](#message-body-optional-1)

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
HTTP-version status-code status-text // Example HTTP/1.1 200 OK
```

1. **HTTP version:** Indicates the HTTP version used. Out parser only needs to support `HTTP/1.0` and `HTTP/1.1`.
   - `HTTP/1.0`
   - `HTTP/1.1`
   - `HTTP/2`
   - `HTTP/3`
2. **Status codes:** Three digit integer codes that describes the result of the request and the semantics of the response. Learn more about there [here](https://www.rfc-editor.org/rfc/rfc9110#section-15). Here are some examples:
   - `200`
   - `301`
   - `404`
   - `500`
3. **Status text:** Brief description of the status code. Below are some examples:
   - `OK` - 200
   - `Moved permanently` - 301
   - `Not found` - 404
   - `Internal server error` - 500

#### **Headers (optional)**

Response headers follow the same syntax as Request headers. Below are some examples of headers, specific to HTTP Response:

- `Age`
- `Location`
- `Server`

#### **Blank line**

Blank line to separate HTTP Response head (Response line + Headers) from body ([CRLF](https://en.wikipedia.org/wiki/Newline)).

#### **Message body (optional)**

Body contains data associated with the response. For example, a HTML document. The length of the body is indicated by `Content-Length` header in Headers.
