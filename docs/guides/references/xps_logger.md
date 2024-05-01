# xps_logger

`xps_logger` is a utility designed to provide logging functionality to aid in the development of eXpServer. It includes a `logger()` function that enables logging messages at different levels and supports colored output depending on the error level.

## Source files

The `xps_logger.h` and `xps_logger.c` files can be dropped into your existing C project and compiled along with it.

::: details **expserver/src/utils/xps_logger.h**

```c
#ifndef XPS_LOGGER_H
#define XPS_LOGGER_H

#include "../xps.h"

// Basic text colors
#define BLACK_TEXT "\x1b[30m"
#define RED_TEXT "\x1b[31m"
#define GREEN_TEXT "\x1b[32m"
#define YELLOW_TEXT "\x1b[33m"
#define BLUE_TEXT "\x1b[34m"
#define MAGENTA_TEXT "\x1b[35m"
#define CYAN_TEXT "\x1b[36m"
#define WHITE_TEXT "\x1b[37m"

// Extended text colors (256 colors)
#define EXTENDED_TEXT(x) "\x1b[38;5;" #x "m"

// Basic background colors
#define BLACK_BG "\x1b[40m"
#define RED_BG "\x1b[41m"
#define GREEN_BG "\x1b[42m"
#define YELLOW_BG "\x1b[43m"
#define BLUE_BG "\x1b[44m"
#define MAGENTA_BG "\x1b[45m"
#define CYAN_BG "\x1b[46m"
#define WHITE_BG "\x1b[47m"

// Extended background colors (256 colors)
#define EXTENDED_BG(x) "\x1b[48;5;" #x "m"

#define RESET_COLOR "\x1b[0m"

#define BOLD_START "\033[1m"
#define BOLD_END "\033[0m"

typedef enum { LOG_ERROR, LOG_INFO, LOG_DEBUG, LOG_WARNING, LOG_HTTP } xps_log_level_t;

void logger(xps_log_level_t level, const char *function_name, const char *format_string, ...);

#endif
```

:::

::: details **expserver/src/utils/xps_logger.c**

```c
#include "../xps.h"

void logger(xps_log_level_t level, const char *function_name, const char *format_string, ...) {
  char *XPS_DEBUG = getenv("XPS_DEBUG");

  if ((XPS_DEBUG == NULL || strcmp(XPS_DEBUG, "1") != 0) && level == LOG_DEBUG)
    return;

  const char *log_level_strings[] = {"ERROR", "INFO", "DEBUG", "WARNING", "HTTP"};
  const char *log_level_colors[] = {RED_BG, BLUE_BG, MAGENTA_TEXT, YELLOW_BG, GREEN_BG};

  va_list args;
  va_start(args, format_string);

  printf("%s" BOLD_START " %s " BOLD_END RESET_COLOR " " GREEN_TEXT "%s" RESET_COLOR " : ",
         log_level_colors[level], log_level_strings[level], function_name);
  vprintf(format_string, args);
  printf("\n");

  fflush(stdout);

  va_end(args);
}
```

:::

## **Usage**

To log messages, you can use the `logger()` function provided by the module. Here's a basic example:

```c
void logger(xps_log_level_t level, const char *function_name, const char *format_string, ...);
```

- `level`: Log level of the message of type `xps_log_level_t`
- `function_name`: Name of the function logging the message
- `format_string`: Format string for the message
- Additional arguments can be passed similar to `printf` format

### **Environment Variable for Debugging**

Logging behavior can be controlled using the `XPS_DEBUG` environment variable. Log messages of level `DEBUG` will be printed on the terminal only when `XPS_DEBUG` env var is set to “1”.

```bash
export XPS_DEBUG=1
```

You can unset it using the following command:

```bash
unset XPS_DEBUG
```

### Examples

Examples of logging errors of different levels:

```c
// ERROR
logger(LOG_ERROR, "xps_loop_create()", "epoll_create1() failed");

// INFO
logger(LOG_INFO, "listener_connection_handler()", "new connection");

// DEBUG
logger(LOG_DEBUG, "listener_connection_handler()", "make_socket_non_blocking() failed");

// WARNING
logger(LOG_WARNING, "sigint_handler()", "SIGINT received");

// HTTP
logger(LOG_HTTP, "xps_http()", "%s %s", http_req->method, http_req->path);
```

![logger.png](/assets/references/logger.png)

### Error levels

`xps_logger` provides predefined error levels with corresponding colors:

| Level   | Color        |
| ------- | ------------ |
| ERROR   | RED_BG       |
| INFO    | BLUE_BG      |
| DEBUG   | MAGENTA_TEXT |
| WARNING | YELLOW_BG    |
| HTTP    | GREEN_BG     |

## Extendibility

Users can extend `xps_logger` further by altering `xps_logger.h` and `xps_logger.c` to include additional logging error levels or alter existing ones.
