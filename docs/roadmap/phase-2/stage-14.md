# Stage 14: HTTP Request Module

## Recap

## Introduction

You’ve made it to Phase 2! Till now, we only focused on TCP. But this phase will focus on HTTP connections. All the client requests and server responses will be HTTP messages.

But what is HTTP you may ask. We have made a short and concise description for the same [here](https://www.notion.so/HTTP-e93e4b23676d4d5c9e939e7ae835237a?pvs=21). It is imperative that you have a clear understanding of the structure of HTTP messages as this stage will completely focus on writing a HTTP parser from the ground up!

For eXpServer, we would only need to parse HTTP request messages.

As eXpServer IS THE server, it would be the one to generate the HTTP response messages, not read them. But what about the cases when the server acts as a proxy? We will discuss about this in the next stage.

Let us take an example HTTP request message and see how the parser will work.

```
GET https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages/httpmsg2.png HTTP/1.1
Host: developer.mozilla.org
User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0
Accept: image/avif,image/webp,*/*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages
```

We will split the parser into 2:

1. Request line parser
2. Request headers parser

To assist us with the parsing process, we will use `struct *xps_http_req_s`.\*

### Request line parser

The general structure of the an HTTP request line is the following:

- Request method - GET
- Space
- Request URI - https://developer.mozilla.org/en-US/docs/Web/HTTP/Messages/httpmsg2.png
- Space
- Request HTTP version - HTTP/1.1

The request URI can be of different types (refer the HTTP section). And each request URI has multiple subparts within it such as:

- Schema - https
- Host - developer.mozilla.org
- Port - 443 (since its https, and a specific port is not mentioned in the URI)
- Path - /en-US/docs/Web/HTTP/Messages/httpmsg2.png
- Pathname

The job of the parser is to take _any_ HTTP request message and be able to:

1. Check if the HTTP request message is a valid
2. Split the message into different parts as mentioned above

### Request headers parser

The structure of a request header is the following:

- Header key
- Semicolon
- Space
- Header value

Similar to the request line parser, the request header parser should split each header into key-value pairs. We will store all the key-value pairs in a `vec_void_t headers`, which is part of `struct *xps_http_req_s`.\*

## Implementation

Like we mentioned before, we’ll split the HTTP request parser into two parts:

1. `xps_http_parse_request_line` - to parse the request line
2. `xps_http_parse_header_line` - to parse the each header line

```c
u_int xps_http_parse_request_line(xps_http_req_t *http_req, xps_buffer_t *buff) {
	...
}

u_int xps_http_parse_header_line(xps_http_req_t *http_req, xps_buffer_t *buff) {
	...
}
```

`xps_buffer_t *buff` contains the HTTP request message that we need to parse. `xps_http_req_t *http_req` is an instance of the struct that we will use for parsing the message.

If you look into `xps_http_req_t`, we can see that it mostly contains u_char\* pointers. The idea is simple:

Iterate through the characters one by one. We are aware of the syntax of a standard HTTP request line. We use that to figure out where we are in the iteration step.

Suppose we are parsing the request line, and the first character the first character. We know that this will be start of the request line, so we set a pointer there.

```c
http_req->request_line_start = buff[0];
```

We also know that the request line starts with the request method (GET, POST, PUT etc.). Therefore we can also set the request method start to the same position.

```c
http_req->method_start = buff[0];
```

We also know that the character HAS TO BE in the range(A to Z). We can use rules like these to validate and verify if the request message that we are receiving is of the correct format.

> ::: tip
> Make use of parser_state (part of `http_req`) defined in `xps_http_parser.h` to keep track of where you are in the parsing process.  
> :::

Here is some starting code that you can use to write the function.

```c
#define LF (u_char)'\n'
#define CR (u_char)'\r'
#define CRLF "\r\n"

u_int xps_http_parse_request_line(xps_http_req_t *http_req, xps_buffer_t *buff) {
  u_char *p_ch;
  u_int parser_state = http_req->parser_state;

  p_ch = buff->pos;

  for (u_int i = 0; i < buff->len; i++) {
    if (i != 0)
      p_ch += 1;
    u_char ch = *p_ch;

    if (parser_state == RL_START) {
      http_req->request_line_start = p_ch;
      if (ch == CR || ch == LF)
        continue;
      if (ch < 'A' || ch > 'Z')
        return XPS_HTTP_PARSE_INVALID_METHOD;

      http_req->method_start = p_ch;
      parser_state = RL_METHOD;
      continue;
    }

		else if (parser_state == RL_METHOD) {
			...
		}

		...

		else if (parser_state == RL_LF) {
      buff->pos = p_ch + 1;
      if (http_req->request_line_end == NULL)
        http_req->request_line_end = p_ch;

      http_req->parser_state = RL_START;
      buff->pos = p_ch;
      return OK;
    }
	}
}
```

You are not restricted to use the above mentioned approach. Coming up with your own type of implementation is well appreciated.

---

### Milestone #1

Half way there! We can check if what we wrote can actually parse any HTTP request line.

---

Similarly, we can now write the parser for the HTTP request header line.

```c
u_int xps_http_parse_header_line(xps_http_req_t *http_req, xps_buffer_t *buff) {
	...
}
```

This should be smaller than the other function, and should take very less time.

---

### Milestone #2

Let’s check this with some test cases.

## Conclusion
