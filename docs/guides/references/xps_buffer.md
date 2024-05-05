# xps_buffer

The `xps_buffer` module provides functionalities for managing buffers in your C project.

## Source files

The `xps_buffer.h` and `xps_buffer.c` files can be dropped into your existing C project and compiled along with it.

::: details expserver/src/utils/xps_buffer.h

```c
#ifndef XPS_BUFFER_H
#define XPS_BUFFER_H

#include "../xps.h"

struct xps_buffer_s {
  size_t size;
  size_t len;
  u_char *pos;
  u_char *data;
};

struct xps_buffer_list_s {
  vec_void_t list;
  size_t len;
};

// xps_buffer
xps_buffer_t *xps_buffer_create(size_t size, size_t len, u_char *data);
void xps_buffer_destroy(xps_buffer_t *buff);
xps_buffer_t *xps_buffer_duplicate(xps_buffer_t *buff);

// xps_buffer_list
xps_buffer_list_t *xps_buffer_list_create();
void xps_buffer_list_destroy(xps_buffer_list_t *buff_list);
void xps_buffer_list_append(xps_buffer_list_t *buff_list, xps_buffer_t *buff);
xps_buffer_t *xps_buffer_list_read(xps_buffer_list_t *buff_list, size_t len);
int xps_buffer_list_clear(xps_buffer_list_t *buff_list, size_t len);

#endif
```

:::

::: details expserver/src/utils/xps_buffer.c

```c
#include "../xps.h"

// xps_buffer

xps_buffer_t *xps_buffer_create(size_t size, size_t len, u_char *data) {
  assert(size > 0);

  // Alloc memory for instance
  xps_buffer_t *buff = malloc(sizeof(xps_buffer_t));
  if (buff == NULL) {
    logger(LOG_ERROR, "xps_buffer_create()", "malloc() failed for 'buff'");
    return NULL;
  }

  // Alloc memory for 'data' if it is NULL
  if (data == NULL)
    data = malloc(size);

  if (data == NULL) {
    logger(LOG_ERROR, "xps_buffer_create()", "malloc() failed for 'data'");
    free(buff);
    return NULL;
  }

  // Init values
  buff->size = size;
  buff->len = len;
  buff->data = data;
  buff->pos = data;

  return buff;
}

void xps_buffer_destroy(xps_buffer_t *buff) {
  assert(buff != NULL);
  free(buff->data);
  free(buff);
}

xps_buffer_t *xps_buffer_duplicate(xps_buffer_t *buff) {
  assert(buff != NULL);

  xps_buffer_t *dup_buff = xps_buffer_create(buff->size, buff->len, NULL);
  if (dup_buff == NULL) {
    logger(LOG_ERROR, "xps_buffer_duplicate()", "xps_buffer_create() failed");
    return NULL;
  }

  // Set 'pos' of dup_buff
  dup_buff->pos = dup_buff->data + (buff->pos - buff->data);

  // Copy over data
  memcpy(dup_buff->data, buff->data, dup_buff->len);

  return dup_buff;
}

// xps_buffer_list

xps_buffer_list_t *xps_buffer_list_create() {
  // Alloc memory for instance
  xps_buffer_list_t *buff_list = malloc(sizeof(xps_buffer_list_t));
  if (buff_list == NULL) {
    logger(LOG_ERROR, "xps_buffer_list_create()", "malloc() failed for 'buff_list'");
    return NULL;
  }

  // Init values
  vec_init(&(buff_list->list));
  buff_list->len = 0;

  return buff_list;
}

void xps_buffer_list_destroy(xps_buffer_list_t *buff_list) {
  assert(buff_list != NULL);

  // Destroy buffers in the list
  for (int i = 0; i < buff_list->list.length; i++) {
    xps_buffer_t *curr_buff = buff_list->list.data[i];
    xps_buffer_destroy(curr_buff);
  }
  vec_deinit(&(buff_list->list));

  free(buff_list);
}

void xps_buffer_list_append(xps_buffer_list_t *buff_list, xps_buffer_t *buff) {
  assert(buff_list != NULL);
  assert(buff != NULL);

  vec_push(&(buff_list->list), (void *)buff);

  buff_list->len += buff->len;
}

xps_buffer_t *xps_buffer_list_read(xps_buffer_list_t *buff_list, size_t len) {
  assert(buff_list != NULL);
  assert(len > 0);

  // Check if requested length is available
  if (buff_list->len < len) {
    logger(LOG_ERROR, "xps_buffer_list_read()", "requested length not available");
    return NULL;
  }

  // Buffer to be returned
  xps_buffer_t *buff = xps_buffer_create(len, len, NULL);
  if (buff == NULL) {
    logger(LOG_ERROR, "xps_buffer_list_read()", "xps_buffer_create() failed");
    return NULL;
  }

  size_t curr_len = 0;
  for (int i = 0; i < buff_list->list.length && curr_len < len; i++) {
    xps_buffer_t *curr_buff = buff_list->list.data[i];

    // Condition where full buffer can be copied
    if ((curr_len + curr_buff->len) <= len) {
      memcpy(buff->data + curr_len, curr_buff->data, curr_buff->len);
      curr_len += curr_buff->len;
    }
    // Condition where partial buffer has to be copied
    else {
      size_t len_diff = len - curr_len;
      memcpy(buff->data + curr_len, curr_buff->data, len_diff);
      curr_len += len_diff;
    }
  }

  return buff;
}

int xps_buffer_list_clear(xps_buffer_list_t *buff_list, size_t len) {
  assert(buff_list != NULL);

  if (len == 0)
    return OK;

  // Check if requested length is available
  if (buff_list->len < len) {
    logger(LOG_ERROR, "xps_buffer_list_clear()", "requested length not available");
    return E_FAIL;
  }

  size_t to_clear_len = len;
  for (int i = 0; i < buff_list->list.length && to_clear_len > 0; i++) {
    xps_buffer_t *curr_buff = buff_list->list.data[i];

    // Condition where full buffer can be destroyed
    if (to_clear_len >= curr_buff->len) {
      to_clear_len -= curr_buff->len;
      xps_buffer_destroy(curr_buff);
      buff_list->list.data[i] = NULL;
    }
    // Condition where partial buffer has to be cleared
    else {
      memmove(curr_buff->data, curr_buff->data + to_clear_len, curr_buff->len - to_clear_len);
      curr_buff->len -= to_clear_len;
      to_clear_len = 0;
    }
  }

  buff_list->len -= len;
  vec_filter_null(&(buff_list->list));

  return OK;
}
```

:::

## Structures

### `xps_buffer_s`

Structure representing an individual buffer:

- `size_t size`: Total allocated size of the buffer
- `size_t len`: Current length of data in the buffer
- `u_char *pos`: Pointer to the current position in the buffer
- `u_char *data`: Pointer to the buffer data

### `xps_buffer_list_s`

Structure representing a list of buffers:

- `vec_void_t list`: List of all buffers
- `size_t len`: Total length of data across all buffers in the list

## Usage

Here are some basics examples of the `xps_buffer` module:

```c
// Create a buffer list
xps_buffer_list_t *buff_list = xps_buffer_list_create();

// Create a buffer
xps_buffer_t *buff = xps_buffer_create(1024, 0, NULL);

// Append buffer to the list
xps_buffer_list_append(buff_list, buff);

// Read data from the buffer list
xps_buffer_t *read_buff = xps_buffer_list_read(buff_list, buff_list->len);

// Clear data from the buffer list
xps_buffer_list_clear(buff_list, 512);

// Destroy buffer and buffer list
xps_buffer_destroy(buff);
xps_buffer_list_destroy(buff_list);
```

## Functions

### `xps_buffer_create(size, len, data)`

Creates a new buffer with the specified size, length, and initial data, allocating memory for the buffer and initializing its properties.

- `size_t size`: Total size of the buffer
- `size_t len`: Initial length of data in the buffer
- `u_char *data`: Pointer to the initial data (can be `NULL`)

If the `data` parameter is `NULL`, memory for the buffer data will also be allocated.

### `xps_buffer_destroy(buff)`

Destroys the specified buffer, releasing the memory allocated for the buffer data and the buffer structure itself.

- `xps_buffer_t *buff`: Pointer to the buffer to be destroyed

### `xps_buffer_duplicate(buff)`

Creates a duplicate of the specified buffer, allocating memory for the new buffer data and copying the data from the original buffer.

- `xps_buffer_t *buff`: Pointer to the buffer to be duplicated

### `xps_buffer_list_create()`

Creates a new buffer list by allocating memory for a new buffer list and initializes its properties, used to store multiple buffers.

### `xps_buffer_list_destroy(buff_list)`

Destroys the specified buffer list, releasing the memory allocated for the buffer list structure and calling `xps_buffer_destroy()` for each buffer in the list to release their memory.

- `xps_buffer_list_t *buff_list`: Pointer to the buffer list to be destroyed

### `xps_buffer_list_append(buff_list, buff)`

Appends the specified buffer to the buffer list, adding it to the end of the buffer list.

- `xps_buffer_list_t *buff_list`: Pointer to the buffer list
- `xps_buffer_t *buff`: Pointer to the buffer to be appended

### `xps_buffer_list_read(buff_list, len)`

Reads data from the buffer list with the specified length, returning a new buffer containing the read data.

- `xps_buffer_list_t *buff_list`: Pointer to the buffer list
- `size_t len`: Length of data to be read from the buffer list

### `xps_buffer_list_clear(buff_list, len)`

Clears data from the buffer list with the specified length, removing data from the beginning of the buffer list and adjusting the lengths of individual buffers accordingly.

- `xps_buffer_list_t *buff_list`: Pointer to the buffer list
- `size_t len`: Length of data to be cleared from the buffer list
