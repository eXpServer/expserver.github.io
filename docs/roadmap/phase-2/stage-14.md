# Stage 14: HTTP Request Module

## Recap

- In the previous phase, we have implemented a server with upstream and file server features on certain ports with the help of pipe and session mechanisms.

## Learning Objectives

- We will learn about HTTP and its message format
- We will implement a HTTP Request parser from the ground up

::: tip PRE-REQUISITE READING

- Read about [HTTP](/guides/resources/http)
  :::

## Introduction

Before proceeding further, make sure you have a thorough understanding of the HTTP structure as we would be implementing a HTTP parser from scratch. From this stage onwards the server would be receiving input as HTTP requests and output would be sent as HTTP responses. A parser enables retrieving various components from a HTTP message and also validates the format. As we know, HTTP response messages consist of three parts - request line, request headers, request body. A HTTP request parser needs to parse the request line and the headers only. The optional body consists of data associated with the request and does not need any parsing. Thus once a HTTP request is received, it should be broken down to request line and request headers. We would be implementing separate parsers for request line and headers. Let us take an example to see how the parsing works on a high level.

HTTP request:

```
GET /index.html HTTP/1.1
Host: example.com
Content-Type: text/html
Content-Length: 123
```

1. **Request Line Parsing**

The first line contains the HTTP request line. On parsing the following information is retrieved

Method: `GET`

URI/Path: `/index.html`

HTTP Version: `HTTP/1.1`

2. **Header Parsing**

The next part of the HTTP request contains headers. For each header, the parser extracts the key-value pairs(Host, Content-Type, Content-Length), for eg, the key ‘Host’ has value ‘example.com’.

The request line and the headers are collectively known as the head of the request.

In this stage, we would be only parsing HTTP request messages. The parsing of HTTP response messages would be done in the next stage. The server won't be able to act as a proxy server as it cannot parse the HTTP response message from the upstream. Thus, in this stage upstream server is not implemented and irrespective of the connection port number the server acts as a file server.

## File Structure

![filestructure.png](/assets/stage-14/filestructure.png)

## Design

Two new modules `xps_http` and `xps_http_req` are created. `xps_http` module contains functions for request line parsing(`xps_http_parse_request_line`), header parsing(`xps_http_parse_request_line`), retrieving the value of a header(`xps_http_get_header`) and serializing the  headers into a buffer(`xps_http_serialize_headers`). Parsing is done in multiple stages, managed through a state machine. Each state represents a specific point in the parsing process. When parsing an HTTP request, the parser transitions between these states based on the characters it reads.

In `xps_http_req module`, a `xps_http_req_s` struct is introduced. This structure is a container for storing the parsed components of an HTTP request. As the parser processes the request, it populates this structure with the related information such as method, URI, headers. This module deals with the creation and destruction of `xps_http_req_s` struct object. It also have functions for processing and serializing the parsed request.

In session module, a new field `http_req` is added to the `xps_session_s` struct for enabling the session management based on the parsed HTTP request. client_sink_handler is modified for parsing and processing the http request. session_process_request implements the functionality of a file server and formulates the http response message.

## Implementation

![implementation.png](/assets/stage-14/implementation.png)

The following modules are added/modified:

- `xps_http_req`
- `xps_http`
- `xps_session`

Create a new folder http in src, this would be used for adding necessary modules required for http messages.The two modules included are `xps_http_req` and `xps_http`.

## `xps_http_req` Module

### `xps_http_req.h`

The code below has the contents of the header file for `xps_http_req`. Have a look at it and make a copy of it in your codebase.

:::details **expserver/src/http/xps_http_req.h**

```c
#ifndef XPS_HTTP_REQ_H
#define XPS_HTTP_REQ_H

#include "../xps.h"

struct xps_http_req_s {
  xps_http_parser_state_t parser_state;

  xps_http_method_t method_n;

  char *request_line; // POST https://www.devdiary.live:3000/api/problems HTTP/1.1
  u_char *request_line_start;
  u_char *request_line_end;

  char *method; // POST
  u_char *method_start;
  u_char *method_end;

  char *uri; // https://www.devdiary.live:3000/api/problems?key=val
  u_char *uri_start;
  u_char *uri_end;

  char *schema; // https
  u_char *schema_start;
  u_char *schema_end;

  char *host; // www.devdiary.live
  u_char *host_start;
  u_char *host_end;

  int port; // 3000
  u_char *port_start;
  u_char *port_end;

  char *path; // /api/problems?key=val
  u_char *path_start;
  u_char *path_end;

  char *pathname; // /api/problems
  u_char *pathname_start;
  u_char *pathname_end;

  char *http_version; // 1.1
  u_char *http_major;
  u_char *http_minor;

  vec_void_t headers;

  u_char *header_key_start;
  u_char *header_key_end;
  u_char *header_val_start;
  u_char *header_val_end;

  size_t header_len;
  size_t body_len;
};

xps_http_req_t *xps_http_req_create(xps_core_t *core, xps_buffer_t *buff, int *error);
void xps_http_req_destroy(xps_core_t *core, xps_http_req_t *http_req);
xps_buffer_t *xps_http_req_serialize(xps_http_req_t *http_req);

#endif
```

:::

A struct `xps_http_req_s` is introduced, which stores the information retrieved through parsing. The fields of the struct are briefly explained:

- `parser_state`: Holds the current state of the HTTP request parsing process.
- `method_n`: Stores the parsed HTTP method (HTTP_POST, etc.).
- `request_line`: Holds the full request line, such as `POST https://www.devdiary.live:3000/api/problems HTTP/1.1`.
- `method`: Stores the HTTP method (e.g., POST).
- `uri`: Holds the full URI (e.g., `https://www.devdiary.live:3000/api/problems?key=val`).
- `schema`: Stores the URI schema (e.g., https).
- `host`: Stores the host part of the URI (e.g., `www.devdiary.live`).
- `port`: Stores the port number extracted from the URI (e.g., 3000).
- `path`: Contains the full path (e.g., `/api/problems?key=val`).
- `pathname`: Contains just the path without any query parameters (e.g., `/api/problems`).
- `http_version`: Stores the HTTP version (e.g., 1.1). `http_major` and `http_minor` point to the start of the major and minor version numbers in the buffer.
- `headers`: Holds the parsed headers. Each header will be stored as a key-value pair in this vector.
- `header_key_start`, `header_key_end`, `header_val_start`, `header_val_end`: These pointers are used during header parsing to mark the start and end of the key and value of each header.
- `header_len`: Stores the length of the headers section.
- `body_len`: Stores the length of the body, if any.

The HTTP requset to be parsed would be present in a buffer. The start and end fields for each component stores pointers marking the beginning and ending of that component in this buffer. For eg: `request_line_start` and `request_line_end` are pointers marking the start and end of the request line in the buffer.

By maintaining specific pointers to different sections of the HTTP request (like the start and end of the method, URI, and headers), the structure allows efficient access and manipulation of the request data without needing to copy or modify the raw input buffer unnecessarily.

We would be completing this module after implementation of the parsing functions, thus now we would be looking into the `xps_http` module.

## `xps_http` Module

### `xps_http.h`

The code below has the contents of the header file for `xps_http`. Have a look at it and make a copy of it in your codebase.

:::details **expserver/src/http/xps_http.h**

```c
#ifndef XPS_HTTP_H
#define XPS_HTTP_H

#include "../xps.h"

#define CR '\r'
#define LF '\n'

typedef enum {
  HTTP_GET,
  HTTP_HEAD,
  HTTP_POST,
  HTTP_PUT,
  HTTP_DELETE,
  HTTP_OPTIONS,
  HTTP_TRACE,
  HTTP_CONNECT,
} xps_http_method_t;

typedef enum {
  HTTP_OK = 200,
  HTTP_CREATED = 201,

  HTTP_MOVED_PERMANENTLY = 301,
  HTTP_MOVED_TEMPORARILY = 302,
  HTTP_NOT_MODIFIED = 304,
  HTTP_TEMPORARY_REDIRECT = 307,
  HTTP_PERMANENT_REDIRECT = 308,

  HTTP_BAD_REQUEST = 400,
  HTTP_UNAUTHORIZED = 401,
  HTTP_FORBIDDEN = 403,
  HTTP_NOT_FOUND = 404,
  HTTP_REQUEST_TIME_OUT = 408,
  HTTP_TOO_MANY_REQUESTS = 429,

  HTTP_INTERNAL_SERVER_ERROR = 500,
  HTTP_NOT_IMPLEMENTED = 501,
  HTTP_BAD_GATEWAY = 502,
  HTTP_SERVICE_UNAVAILABLE = 503,
  HTTP_GATEWAY_TIMEOUT = 504,
  HTTP_HTTP_VERSION_NOT_SUPPORTED = 505
} xps_http_status_code_t;

typedef enum {
  /* Request line states */
  RL_START = 0,
  RL_METHOD,
  RL_SP_AFTER_METHOD,

  RL_SCHEMA,
  RL_SCHEMA_SLASH,
  RL_SCHEMA_SLASH_SLASH,
  RL_HOST_START, // maybe Ipv4 or Ipv6
  RL_HOST,
  RL_HOST_END,
  RL_HOST_IP_LITERAL, // Ipv6; map to RL_HOST_END
  RL_PORT,
  RL_SLASH, // path
  RL_CHECK_URI,
  RL_PATH,
  RL_PATHNAME,
  RL_SP_AFTER_URI,

  RL_VERSION_START,
  RL_VERSION_H,
  RL_VERSION_HT,
  RL_VERSION_HTT,
  RL_VERSION_HTTP,
  RL_VERSION_HTTP_SLASH,
  RL_VERSION_MAJOR,
  RL_VERSION_DOT,
  RL_VERSION_MINOR,
  RL_CR,
  RL_LF,

  /* Header states */
  H_START = 0,
  H_NAME,
  H_COLON,
  H_SP_AFTER_COLON,
  H_VAL,
  H_CR,
  H_LF,
  H_LF_CR,
  H_LF_LF,
  H_LF_CR_LF,

} xps_http_parser_state_t;

int xps_http_parse_request_line(xps_http_req_t *http_req, xps_buffer_t *buffer);
int xps_http_parse_header_line(xps_http_req_t *http_req, xps_buffer_t *buffer);

const char *xps_http_get_header(vec_void_t *headers, const char *key);
xps_buffer_t *xps_http_serialize_headers(vec_void_t *headers);

#endif
```

:::

Following enumerations are available in the above header file:

- `xps_http_method_t`: defines the supported HTTP methods(eg: GET, POST, etc)
- `xps_http_status_code_t`: \*\*\*\*defines various HTTP status codes that the server can respond with.
- `xps_http_parser_state_t`: defines the different states of the HTTP request parsing process, split into two main sections: request line states and header states. Each of these states would be explained in detail while implementing the parsing functions.

### `xps_http.c`

The parsing of HTTP messages are divided into two parts, request line parsing and request header parsing.

Here is a brief idea of how the parser will work:

- Iterate through the message, character by character
- As we are aware of the syntax of a valid HTTP request message, we can use that to determine if the syntax is valid and also where we are currently in the parsing step
- Place pointers at appropriate locations of the message for further processing later

The codes used to return the status of parsing are as follows:

- `E_FAIL`: Parsing failed.
- `E_AGAIN`: Incomplete data, indicating that more data is needed for successful parsing.
- `E_NEXT`: The current header has been parsed successfully, and the parser is ready to start the next header line.
- `OK`: Parsing succeeded.

Let us go through each of the parsing functions separately.

- **`xps_http_parse_request_line()`**

Parses a single HTTP request line from a buffer, extracting various components such as the HTTP method, URI, host, port, and HTTP version. It also verifies the request line is of a valid format(i.e follows RFC conventions). `http_req` is a pointer to a structure where parsed information will be stored. `buff` is a pointer to a buffer containing the request data to be parsed. Let us take an example for demonstrating request line parsing. Consider a request line:

```
GET http://localhost:8080/path/to/resource HTTP/1.1
```

At the end of the parsing, the start and end pointers for each of the components in the `buff` would be assigned, thus enabling us to make following inferences:

```
Method: GET
URI: http://localhost:8080/path/to/resource
Host: localhost
Port: 8080
HTTP Version: 1.1
```

There would be different formats for the request line, for eg:

```
GET /path/to/resource HTTP/1.1
GET http://localhost:8080/path/to/resource HTTP/1.1
```

Our parser should be able to parse all the valid request line formats.

The parser is implemented as a state machine which changes state while traversing `buff` on encountering certain characters. Each of the states of request line parser are briefly explained:

- `RL_START`: this is the initial state of the parser. Ignore leading `CR` (’\r’) or `LF` (’\n’) characters and detect the beginning of the HTTP method.
- `RL_METHOD`: reads the HTTP method until a space character is encountered (e.g., `GET`, `POST`).
- `RL_SP_AFTER_METHOD`: processes the space after the HTTP method and determines whether the next part is the path(starts with `/`)or a schema(starts with a letter ie `http://`)
- `RL_SCHEMA`: reads the schema part of the URI (e.g., `http` or `https`). Moves to next state on encoutering `:`
- `RL_SCHEMA_SLASH`: verify that the schema is correctly followed by a `/`
- `RL_SCHEMA_SLASH_SLASH`: expects the second `/` after the schema
- `RL_HOST`: reads the host part of the URI (e.g., `example.com`)
- `RL_PORT`: reads the port number
- `RL_PATH`: reads the path part of the URI (e.g., `/index.html`).
- `RL_PATHNAME`: handles the pathname part of the URI, which can include query parameters (e.g., `/index.html?name=value`).
- `RL_VERSION_START`, `RL_VERSION_H`, `RL_VERSION_HT`, `RL_VERSION_HTT`, `RL_VERSION_HTTP`, `RL_VERSION_HTTP_SLASH`: reads the `HTTP/` part before the version number.
- `RL_VERSION_MAJOR`, `RL_VERSION_DOT`, `RL_VERSION_MINOR`: reads the version number of HTTP.
- `RL_CR`: expects a line feed (`LF`) after a carriage return (`CR`).
- `RL_LF`: indicates the successful completion of the request line. Parser moves to the `H_START` state (start of header parsing)

For each component the start pointer is assigned on beginning and and end pointer is assigned while the component ends. The pointer is made to the current position of `buff`.

:::details **expserver/src/http/xps_http.c -** `xps_http_parse_request_line()`

```c

bool http_strcmp(u_char *str, const char *method, size_t length){
  /* complete this */
}

int xps_http_parse_request_line(xps_http_req_t *http_req, xps_buffer_t *buff) {
  /*get current parser state*/
  u_char *p_ch = buff->pos;//current buffer postion

  for (/*traverse through buffer and also increment buffer position*/) {
    char ch = *p_ch;
    switch (parser_state) {
      case RL_START:
        /*assign request_line_start, ignore CR and LF, fail if not upper case, assign method_start*/
        parser_state = RL_METHOD;
        break;

      case RL_METHOD:
        if (ch == ' ') {
          size_t method_len = p_ch - http_req->method_start;
          if (method_len == 3 && http_strcmp(http_req->method_start, "GET", 3))
            http_req->method_n = HTTP_GET;
          /*similarly check for other methods PUT, HEAD, etc*/
          /*assign method_end*/
          parser_state = RL_SP_AFTER_METHOD;
        }
        break;

      case RL_SP_AFTER_METHOD:
        if (ch == '/') {
          /*assign start and end of schema,host,port and start of uri,path,pathname*/
          /*next state is RL_PATH*/
        } else {
          char c = ch | 0x20; //convert to lower case
          /*if lower case alphabets, assign start of schema and uri, next state is RL_SCHEMA*/
          /*if not space(''), fails*/
        }
        break;

      case RL_SCHEMA:
        /*on lower case alphabets break ie schema can have lower case alphabets*/
        /*schema ends on ':' ,next state is RL_SCHEMA_SLASH*/
        /*fails on all other inputs*/
        break;

      case RL_SCHEMA_SLASH:
        /*on '/' assign next state, fails on all other inputs*/
        break;

      case RL_SCHEMA_SLASH_SLASH:
        /*on '/' - assign next state, for start of host assign next position, fails on all other inputs*/
        break;

      case RL_HOST:
        /*host can have lower case alphabets, numbers, '-', '.' */
        /*on ':' - host ends, for start of port assign next position, next state is RL_PORT*/
        /*on '/' - host ends, assign start of path,pathname, end of port, next state is RL_PATH*/
        /*on ' ' - host ends, assign end of uri, start and end of port,path,pathname, next state is RL_VERSION_START*/
        /*on all other input, fails*/
        break;

      case RL_PORT:
        /*port can only have numbers */
        /*on '/' - port ends, assign start of path,pathname, next state is RL_PATH*/
        /*on ' ' - port ends, assign end of uri, start and end of path,pathname, next state is RL_VERSION_START*/
        /*on all other input, fails*/
        break;

      case RL_PATH:
        /*on ' ' - path ends, assign end of path,pathname,uri next state is RL_VERSION_START*/
        /*on '?'or'&'or'='or'#' - assign end of pathname, next state is RL_PATHNAME*/
        /*on CR or LF, fails*/
        break;

      case RL_PATHNAME:
        /*on ' ' - assign end of uri,path, next state is RL_VERSION_START*/
        /*on CR or LF, fails*/
        break;

      case RL_VERSION_START:
        /*can have space*/
        /*on 'H' - next state is RL_VERSION_H*/
        /*fails on all other input*/
        break;

      case RL_VERSION_H:
        /*fill this*/
        break;

      case RL_VERSION_HT:
        /*fill this*/
        break;

      case RL_VERSION_HTT:
        /*fill this*/
        break;

      case RL_VERSION_HTTP:
        /*fill this*/
        break;

      case RL_VERSION_HTTP_SLASH:
        /*on '1' - assign major, next state is RL_MAJOR, fails on all other inputs*/
        break;

      case RL_VERSION_MAJOR:
        /*fill ths*/
        break;

      case RL_VERSION_DOT:
        /*on '0' or '1' - assign minor to next position, next state is RL_VERSION_MINOR, fails on other inputs*/
        break;

      case RL_VERSION_MINOR:
        if (ch == CR) {
          parser_state = RL_CR;
        } else if (ch == LF) {
          parser_state = RL_LF;
        } else {
          return E_FAIL;
        }
        break;

      case RL_CR:
        /*fill this*/
        break;

      case RL_LF:
        if (http_req->request_line_end == NULL) {
          http_req->request_line_end = p_ch;
        }
        http_req->parser_state = H_START;
        buff->pos = p_ch;
        return OK;

      default:
        return E_FAIL;
    }
  }

  return E_AGAIN;
}

```

:::

Let us walk though an example on how state transitions occur during parsing:

```
GET http://example.com/index.html HTTP/1.1
```

1. Initial State: RL_START

- The parser starts in the `RL_START` state.
- It reads the first character, which is `'G'`. The method starts at this position. Since it is a valid character for an HTTP method, it moves to the `RL_METHOD` state.

2. State: RL_METHOD

- The parser continues reading characters until it hits a space (`' '`), which signifies the end of the HTTP method.
- It calculates the method length (`p_ch - http_req->method_start`) and compares it with known methods. In this case, the method is `"GET"`, so `http_req->method_n` is set to `HTTP_GET`.
- Now, the state transitions to `RL_SP_AFTER_METHOD`.

3. State: RL_SP_AFTER_METHOD

- The next character is `'h'`, which indicates the start of the schema. The state changes to `RL_SCHEMA`.

4. State: RL_SCHEMA

- The parser reads each character of the schema (`http`). Once it encounters a colon (`':'`), it marks the end of the schema and moves to the `RL_SCHEMA_SLASH` state.

5. State: RL_SCHEMA_SLASH

- The next character is `'/'`, so the state changes to `RL_SCHEMA_SLASH_SLASH`.

6. State: RL_SCHEMA_SLASH_SLASH

- Another `'/'` is found, indicating the start of the host. The parser moves to the `RL_HOST` state and sets start of host to the next character.

7. State: RL_HOST

- The parser reads the characters of the host (`example.com`). When it encounters a `/`, it marks the end of the host and switches to the `RL_PATH` state.

8. State: RL_PATH

- The parser continues reading characters, this time representing the path (`/index.html`). When it encounters a space (`' '`), it marks the end of the path and moves to the `RL_VERSION_START` state.

9. State: RL_VERSION_START

- The next character is `'H'`, indicating the start of the HTTP version. The parser moves through the various version states (`RL_VERSION_H`, `RL_VERSION_HT`, etc.) until it reaches the version `HTTP/1.1`.

10. State: RL_LF

- After reading the version and encountering a newline (`LF`), the parser sets the state to `H_START` to begin parsing headers.

::: tip TRY

- Similarly, try tracing the states for two request line examples provided earlier.
  :::

Once the request line parsing is done, we would start the request headers pasring.

- **`xps_http_parse_header_line()`**

Parse a single line of an HTTP header from a buffer. It also verifies the header is of a valid format. `http_req` holds the current state of the HTTP request parsing, such as the parser state. The start and end of parsed header key and value are to be stored in this struct. `buff` is a pointer to an the buffer with the HTTP header data which has to be parsed.

Similar to request line parsing, here also the function goes through the buffer character by character and uses a state machine to determine how to process each character based on the current parsing state.

Let us look into the states in header parsing:

- `H_START`: Beginning of a new header line. If the character is a valid alphabetic character, the parser moves to the `H_NAME` state to start reading the header's name. Otherwise, it returns `E_FAIL` for incorrect syntax.
- `H_NAME`: Parsing the header name. It continues as long as the character is alphabetic or a hyphen (`-`). If it encounters a colon (`:`), it transitions to `H_COLON` and marks the end of the header name. Any other character results in `E_FAIL`.
- `H_COLON`: After parsing the header name, the parser expects a colon. If the next character is a space, it moves to `H_SP_AFTER_COLON`, where spaces are skipped. If it’s not a space and not a newline, it starts reading the header value.
- `H_SP_AFTER_COLON`: This state skips spaces after the colon. Once non-space characters appear, it moves to `H_VAL` to start reading the header value.
- `H_VAL`: Reading the header value. If a carriage return or line feed is encountered, it marks the end of the header value and transitions to either `H_CR` or `H_LF`.
- `H_CR`: The parser expects a line feed after the carriage return. If the `LF` is found, it moves to `H_LF`. Any other character is treated as incorrect syntax.
- `H_LF`: Indicates the end of the current header line. If a second line feed is encountered, it moves to `H_LF_LF`, indicating that the entire header section is done. Otherwise, it moves back to `H_START` to process the next header.
- `H_LF_LF` and `H_LF_CR`: These states signify the end of the HTTP header section. If they reach the correct termination character sequence, the function returns `OK`.
  :::details **expserver/src/http/xps_http.c -** `xps_http_parse_header_line()`
  ```c
  int xps_http_parse_header_line(xps_http_req_t *http_req, xps_buffer_t *buff) {
    assert(http_req != NULL);
    assert(buff != NULL);

    u_char *p_ch = buff->pos;
    xps_http_parser_state_t parser_state = http_req->parser_state;

    for (/*iterarte though buffer, also increments the buffer position*/) {
      char ch = *p_ch;

      switch (parser_state) {
        case H_START:
          /*fill this*/
          break;

        case H_NAME:
          /*fill this*/
          break;

        case H_COLON:
          /*fill this*/
          break;

        case H_SP_AFTER_COLON:
          /*fill this*/
          break;

        case H_VAL:
          if (ch == CR || ch == LF) {
            /*fill this*/
            parser_state = (ch == CR) ? H_CR : H_LF;
          }
          break;

        case H_CR:
          /*fill this*/
          break;

        case H_LF:
          if (ch == LF) {
            /*fill this*/
          } else if (ch == CR) {
            /*fill this*/
          } else {
            /*fill this*/
            return E_NEXT; // This header is done, repeat for the next
          }
          break;

        case H_LF_LF:
          buff->pos = p_ch;
          http_req->parser_state = H_START;
          return OK; // HTTP complete header section done

        case H_LF_CR:
          if (ch == LF) {
            buff->pos = p_ch;
            http_req->parser_state = H_START;
            return OK; // HTTP complete header section done
          } else {
            return E_FAIL;
          }
          break;

        default:
          return E_FAIL;
      }
    }

    return E_AGAIN;
  }

  ```
  :::

Let us walk through an example, the headers be as given below:

```c
Host: example.com
Content-Type: text/html
Content-Length: 123
```

After parsing, key-value can be retrieved. For the first header key is `Host` and value is `example.com`. Similarly the other headers would also be parsed. The key and value are found from the start and end pointers we have assigned while parsing. For the first header, the state transitions occur as follows:

1. Initial State: H_START

- The parser starts at `H_START`.
- It reads the first character `‘H’` , sets start of key and moves to `H_NAME` state.

2. State: H_NAME

- The parser continues reading the characters of the header name (`Host`) until it encounters a colon (`':'`), which signifies the end of the header name.
- It sets end of key and moves to the `H_COLON` state.

3. State: H_COLON

- The parser reads the colon and expects either a space or the start of the header value. In this case, it encounters a space.
- The parser moves to the `H_SP_AFTER_COLON` state.

4. State: H_SP_AFTER_COLON

- After the space, the parser encounters the first character of the header value, which is `'e'` for `example.com`.
- The parser moves to the `H_VAL` state and sets start of value.

5. State: H_VAL

- The parser continues reading the characters of the header value (`example.com`) until it encounters a newline character (either `CR` or `LF`).
- It sets end of value and moves to either `H_CR` or `H_LF`, depending on the newline sequence.

6. State: H_CR / H_LF

- If the parser encounters `CR`, it expects an `LF` next and moves to the `H_LF` state. If it directly encounters `LF`, the header is complete.
- After processing the `LF`, the parser is ready to handle the next header by returning `E_NEXT`, which signals that the current header is done and the next can be processed.

At this point, the first header (`Host: example.com`) is fully parsed, and the parser is prepared to start parsing the next header.

- **`xps_http_get_header()`**

Returns the header value for a given header key from the list of headers provided.

```c
const char *xps_http_get_header(vec_void_t *headers, const char *key) {
  /*Validate params*/
  for (int i = 0; i < headers->length; i++) {
    xps_keyval_t *header = /*fill this*/
    if (strcmp(header->key, key) == 0)
      /*fill this*/
  }
	return NULL;
}
```

::: tip TRY

- Try to do a case insensitive comparison of key in the above function.
  :::

- **`xps_http_serialize_headers()`**

Serialize a list of HTTP headers(key-value pairs) into a buffer. The serialized headers will be formatted as a string, where each header is in the format - key: value\n. The function `sprintf` is used to format and store a string into a character buffer. For header size, along with size of key and value, a +5 is added to account for the colon (`:`), space ( ``), newline (`\n`), and null terminator (`\0`).

```c
xps_buffer_t *xps_http_serialize_headers(vec_void_t *headers) {
  /*assert*/
	/*create a buffer and initialize first byte to null terminator*/
  for (/*traverse through headers*/) {
	  /*get required length to store a header*/
    char header_str[header_str_len];
    sprintf(header_str, "%s: %s\n", header->key, header->val);
    if ((buff->size - buff->len) < header_str_len) { //buffer is small
      u_char *new_data = /*realloc() buffer to twice size*/
      /*handle error*/
      /*update buff->data and buff->size*/
    }
    strcat(buff->data, header_str);
    buff->len = strlen(buff->data);
  }
	return buff;
}
```

Now we would be completing the `xps_http_req` module.

## `xps_http_req` Module - Continue

We would be implementing functions for processing the parsed http request, serializing the parsed information and the creation and destruction of `xps_http_req_s` struct object.

### `xps_http_req.c`

Let us go through each of the functions to be implemented:

- **`http_process_request_line()`**

Processes the HTTP request line by calling `xps_http_parse_request_line()` and populating the relevant fields of `http_req` object. `str_from_ptrs()` takes two pointers, and creates a new string containing the characters between them.

```c
int http_process_request_line(xps_http_req_t *http_req, xps_buffer_t *buff) {
	int error = /*parse request line*/
  if (error != OK)
    return error;
  http_req->request_line = str_from_ptrs(http_req->request_line_start, http_req->request_line_end);
  /*similarly assign method, uri, schema, host, path, pathname*/
  http_req->http_version = str_from_ptrs(http_req->http_major, http_req->http_minor);
  http_req->port = -1;
  /*find port_str from port start and end pointers*/
  /*if port_str is null assign default port number 80 for http and 443 for https
  if not null assign atoi(port_str)*/
  /*free port_str*/
  return OK;
}
```

Add the `str_from_ptrs()` utility function. Update `xps_utils.h` accordingly.

- `expserver/src/utils/xps_utils.c`
  ```c
  char *str_from_ptrs(const char *start, const char *end) {
    assert(start != NULL);
    assert(end != NULL);
    assert(start <= end);

    size_t len = end - start;

    char *str = malloc(sizeof(char) * (len + 1));
    if (str == NULL) {
      logger(LOG_ERROR, "str_from_ptrs()", "malloc() failed for 'str'");
      return NULL;
    }

    memcpy(str, start, len);
    str[len] = '\0';

    return str;
  }
  ```
- **`http_process_headers()`**

Processes the headers of the HTTP request by repeatedly calling `xps_http_parse_header_line()` to parse each header line.

```c
int http_process_headers(xps_http_req_t *http_req, xps_buffer_t *buff) {
  /*assert*/
  /*initialize headers list of http_req*/
  int error;
  while (1) {
    error = /*parse header*/
    if (error == E_FAIL || error == E_AGAIN)
      break;
    if (error == OK || error == E_NEXT) {
      /* Alloc memory for new header*/
      /*assign key,val from their corresponding start and end pointers*/
      /*push this header into headers list of http_req*/
      /*if error is E_NEXT continue*/
    }
		return OK;
    }
    /*error occurs, thus iterate through header list, free each header*/
    /*deinitialize headers list*/
  }

```

- **`xps_http_req_serialize()`**

Serializes the parsed HTTP request (request line and headers) into a buffer. The header alone is serialized into a buffer before serializing the whole request.

```c
xps_buffer_t *xps_http_req_serialize(xps_http_req_t *http_req) {
  assert(http_req != NULL);
  /* Serialize headers into a buffer headers_str*/
  size_t final_len = strlen(http_req->request_line) + 1 + headers_str->len + 1;   /*Calculate length for final buffer*/
  /*Create instance for final buffer*/
  /*Copy everything to final buffer*/
  memcpy(buff->pos, http_req->request_line, strlen(http_req->request_line));
  buff->pos += strlen(http_req->request_line);
  /*similarly copy "\n", headers_str, "\n"*/
	/*destroy headers_str buffer*/
  return buff;
}
```

- **`xps_http_req_create()`**

Creates a new HTTP request object, processes the request line and headers, and sets up the request structure. The initial parser state is `RL_START`, indicating the starting of request line parsing. `buff` is the input buffer holding the HTTP request data which has to be parsed.

```c
xps_http_req_t *xps_http_req_create(xps_core_t *core, xps_buffer_t *buff, int *error) {
	/*assert*/
  *error = E_FAIL;
	/* Alloc memory for http_req instance*/
  memset(http_req, 0, sizeof(xps_http_req_t));
	/*Set initial parser state*/
  /*Process request line and handle possible errors*/
  /*Process headers and handle possible errors*/
	// Header length
  http_req->header_len = (size_t)(buff->pos - buff->data);
	// Body length is retrieved from header Content-Length
  http_req->body_len = 0;
  const char *body_len_str = /*get header value for key Content-Length*/
  /*assign body_len*/
	*error = OK;
	return http_req;
}
```

- **`xps_http_req_destroy()`**

Frees the memory and resources allocated for the HTTP request object.

```c
void xps_http_req_destroy(xps_core_t *core, xps_http_req_t *http_req) {
  assert(http_req != NULL);
  /*Frees memory allocated for various components of the HTTP request line(request line, method,etc)*/
  /*iterate through the headers list of http_req and free the memory*/
  /*de-intialize the headers list*/
  /*free http_req*/
}
```

Now we have implemented the modules required for parsing HTTP request. We have to make changes in `xps_session` module as the server now acts only as a file server and upstream functionality is not implemented in the present stage as discussed earlier.

## `xps_session` Module - Modifications

### `xps_session.h`

In the `xps_session_s` struct, a new field `xps_http_req_t *http_req` is added, for enabling us to manage session with respect to HTTP request message recieved.

### `xps_session.c`

In `xps_session_create()`, initialize the `http_req` field also. We are not implementing upstream and file servers based on port, but instead only a file server irrespective of port number. Thus, the pipe creation based on port number can be removed.

```c
if (client->listener->port == 8001) {// [!code --]
    ...// [!code --]
  }// [!code --]
else if (client->listener->port == 8002) {// [!code --]
    ...// [!code --]
  }// [!code --]
```

In `xps_session_destroy()`, destroy the attached `http_req`.

A new function `session_process_request()` is added for processing the HTTP request i.e it deals with formulating HTTP response message on the basis of HTTP request message recieved. It implements the functionality of a file server.

```c
void session_process_request(xps_session_t *session) {
  assert(session != NULL);
  /*allocate a reply buffer that will store response*/
  // BAD REQUEST
  if (/*http_req is null*/) {
    sprintf(reply, "HTTP/1.1 400 Bad Request\n");
    xps_buffer_t *buff = xps_buffer_create(strlen(reply), strlen(reply), reply);
    /*set buff to to_client_buff*/
    return;
  }
	if (session->http_req->path) {
    char file_path[DEFAULT_BUFFER_SIZE];
    strcpy(file_path, "../public");
    strcat(file_path, session->http_req->path); //the path from http_req is taken as file to be opened
    int error;
    /*create file for above path and attach to file field of session*/
		/*handle all possible errors on file creation (E_PERMISSION,E_NOTFOUND,any other)
		by giving corresponding http response messages*/
    if (session->file->mime_type) {
      sprintf(reply,
              "HTTP/1.1 200 OK \nServer: eXpServer\nAccess-Control-Allow-Origin: "
              "*\nContent-Length: %zu\nContent-Type: %s\n\n",
              session->file->size, session->file->mime_type);
    }
    xps_buffer_t *buff = xps_buffer_create(strlen(reply), strlen(reply), reply);
    /*set buff to to_client_buff*/
    /*create pipe with session->file->source and session->file_sink*/
  }
}

```

In `client_sink_handler()`, the http request parsing is done and the request is processed accordingly.

```c
void client_sink_handler(void *ptr) {
  ...
  //read from pipe
  ...
  if (session->http_req == NULL) { //http requset is not recieved till now// [!code ++]
    int error;// [!code ++]
    // create http_req for the buff read from pipe and destroy the buff // [!code ++]
    if (error == E_FAIL) {// [!code ++]
	    // process the session and return //[!code ++]
    }// [!code ++]
	// handle E_AGAIN // [!code ++]
    session->http_req = http_req;// [!code ++]
    // serialize http_req into buffer http_req_buff // [!code ++]
    // set http_req_buff to from_client_buff and clear the pipe // [!code ++]
    // process the session  // [!code ++]
  } else {// [!code ++]
  set_from_client_buff(session, buff);
  xps_pipe_sink_clear(sink, buff->len);
  }
}
```

Update `xps.h` to reflect new modules and structs.

## Milestone #1

First we would be verifying the request line parsing.

For this, in the `http_process_request_line()` function, print each parsed components of `http_req`.

```c
printf("REQUEST LINE: %s\n", http_req->request_line);
/*similarly print method,uri,...etc*/
```

Start the server. Open a browser tab and enter a HTTP request for eg: `http://localhost:8001/example.com`

Verify the following output is printed in terminal thus ensuring the parsing of request line

![milestone1.png](/assets/stage-14/milestone1.png)

## Milestone #2

Now let us verify the request header parsing.

In the `http_process_headers()`, after parsing all the headers, iterarte thorugh the headers list and print the key and value of each header.

```c
printf("HEADERS\n");
      for (int i = 0; i < http_req->headers.length; i++) {
        xps_keyval_t *header = http_req->headers.data[i];
        /*print key and val*/
      }
```

Start the server and enter the link given earlier in browser. Verify that header key-value pairs are printed in terminal. For eg:

![milestone2.png](/assets/stage-14/milestone2.png)

## Milestone #3

We have already verified the parsing of HTTP request (both request line and header), now let us verify that the file serving functionality is working as intended. In the earlier file server implementation, the file to be opened (../public/sample.txt) was hardcored while calling `xps_file_create()`, for eg:

```c
xps_file_t *file = xps_file_create(core, "../public/sample.txt", &error);
```

But in this stage, the name of the file to be opened can be taken from the path of HTTP request. We have alredy implemented this in `session_process_request()` as below:

```c
strcpy(file_path, "../public");
strcat(file_path, session->http_req->path);
```

As in the previous file server implementation, the file to be opened should be present in the public folder.

We can verify the modification by requesting the file through browser. Start the server and in browser, enter http request message for getting the file. For eg: `http://localhost:8001/sample.txt` . Here, sample.txt is the file to be opened and it is present in the public folder. Verify that the contents of file are displayed in browser.

Now try how the browser responds if the file is not present in public folder.

## Experiment #1

In the previous file server implementation, the outputs were printed in terminal and we encountered problem in opening image files as mentioned in Experiment #1 of stage12.

Try to open image files through the browser as mentioned in Milestone #3 above, and verify that images are displayed correctly in browser. You can now try opening any file with a valid MIME type. Also try opening files from different ports other than 8001 used above.

## Conclusion

We are now able to recieve HTTP request messages and respond with HTTP response messages by implementing a parser for HTTP request messages. We have implemented parsing, processing and serailizing of HTTP request messages. In this stage, only file server functionality is achieved with the http messages. In the next stage, we would be implementing a parser for HTTP response message also thus enabling our server to act as a proxy server as well.
