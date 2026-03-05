# Stage 12: File Module

## Recap

We have implemented a proxy server in port 8001 for connecting to an upstream python server using `xps_upstream` module. 

## Learning Objectives

We would be implementing a file server for incoming connections to port 8002. 

## Introduction

A file server stores and delivers files to clients over a network, enabling remote access. It allows users to download, upload, and modify files. In this stage, we would be implementing a rudimentary file server, which delivers files upon client request. Our server only allows files residing inside the `public` folder to be downloaded, and the files must have read access granted to `others`. When there are incoming connections to port 8002, the server serves a static file to the client through the pipe mechanism discussed earlier.At this point, the client is expected to know the filename to be downloaded from the `public` folder. In later stages, we'll be adding support for directory browsing on the `public` folder.

## Design

Two new modules `xps_file` and `xps_mime` are introduced. In `xps_file`, an `xps_file_s` struct is introduced which stores the information regarding the file including file path, file size, [MIME](https://en.wikipedia.org/wiki/MIME) type(describes the format of file), and file structure pointer. `xps_file` has functions for opening a file and creating an instance of `xps_file_s` struct for it, for destruction of file instance, for reading data from file and writing to the pipe, and for closing the file source. Earlier the source was receiving data using `recv()` and writes it to the pipe, but in a file server the source takes data from the file attached to it and writes it to the pipe. Here, the `ptr` field in `xps_source_s` struct points to an instance of `xps_file_s` struct which has to be read, instead of pointing to the connection instance as in earlier stages. `file_souce_handler()` reads data from the file and writes it to pipe.

The `xps_mime` module is used for getting the MIME type of the file. A MIME type (Multipurpose Internet Mail Extensions type) is a standard that indicates the nature and format of a file. Originally developed for email systems to specify the type of data attached in emails, MIME types are now used extensively on the internet, particularly in HTTP, to describe the content being transferred. We would be exploring more on this in later stages.

## Implementation

Modules added/modified in the given order

- `xps_mime`
- `xps_file`
- `xps_listener`

Create a new folder disk in src, this would be used for adding necessary modules required for creating a file server.The two modules included are xps_mime and xps_file.

## `xps_mime` Module

### `xps_mime.h`

The code below has the contents of the header file for `xps_mime`. Have a look at it and make a copy of it in your codebase.

:::details **expserver/src/disk/xps_mime.h**

```c
#ifndef XPS_MIME_H
#define XPS_MIME_H

#include "../xps.h"

const char *xps_get_mime(const char *file_path);

#endif
```

:::

### `xps_mime.c`

The function `xps_get_mime()` returns the MIME type of a file based on its extension. A MIME type lookup table (`mime_types`) maps file extensions (e.g., ".html", ".jpg") to their corresponding MIME types (e.g., "text/html", "image/jpeg"). This tells the browser how to display or interact with the file. For example, an HTML file is rendered as a web page, while an image is displayed as a picture. We won’t be using this functionality in the present stage but would be looking into in later stages.

:::details **expserver/src/disk/xps_mime.c**

```c
#include "../xps.h"
//here, some extension-mime types pairs are given, you can add as required
xps_keyval_t mime_types[] = {
    {".h", "text/x-c"},
    {".c", "text/x-c"},
    {".cc", "text/x-c"},
    {".cpp", "text/x-c"},
    {".dir", "application/x-director"},
    {".dxr", "application/x-director"},
    {".fgd", "application/x-director"},
    {".swa", "application/x-director"},
    {".text", "text/plain"},
    {".txt", "text/plain"},
    {".png", "image/png"},
    {".png", "image/x-png"},
    };
int n_mimes = sizeof(mime_types) / sizeof(mime_types[0]);

const char *xps_get_mime(const char *file_path) {
    const char *ext = get_file_ext(file_path);

    if (ext == NULL)
    return NULL;

    for (int i = 0; i < n_mimes; i++) {
    if (strcmp(mime_types[i].key, ext) == 0)
        return mime_types[i].val;
    }

    return NULL;
}
```

:::

:::tip NOTE
If you want to add more **MIME** types, you can refer to this [link](https://mimetype.io/all-types).
:::

As we are mapping the MIME type based on the file extension, a function for finding the file extension is added in `xps_utils.h`. Add the below given function in `xps_utils.c`

```c
const char *get_file_ext(const char *file_path) {
  // Find the last occurrence of dot
  const char *dot = strrchr(file_path, '.');

  // Check if dot is present and it is not the first character
  return dot && dot > strrchr(file_path, '/') ? dot : NULL;
}
```

Also declare the newly created function in utility.h

## `xps_file` Module

### `xps_file.h`

The code below has the contents of the header file for `xps_file.c`. Have a look at it and make a copy of it in your codebase.

:::details **expserver/src/disk/xps_file.h**

```c
#ifndef XPS_FILE_H
#define XPS_FILE_H

#include "../xps.h"

struct xps_file_s {
    xps_core_t *core;
    const char *file_path;
    xps_pipe_source_t *source;
    FILE *file_struct;
    size_t size;
    const char *mime_type;
};

xps_file_t *xps_file_create(xps_core_t *core, const char *file_path, int *error);
void xps_file_destroy(xps_file_t *file);

#endif
```

:::

A struct `xps_file_s` is introduced to store the information regarding the file. The fields in the struct are briefly described:

**`xps_core_t *core`**: pointer to the core instance

**`const char *file_path`**: used to locate the file on the local disk

**`xps_pipe_source_t *source`**: a pointer to source, which handles reading data from the file and passing it to a pipe

**`FILE *file_struct`**: a pointer representing the opened file, it is used to interact with the file, such as reading, writing, seeking (will be explained soon).

**`size_t size`**: holds the size of the file in bytes

**`const char *mime_type`**:  represents the MIME type of the file

### `xps_file.c`

Several file system-related C standard library functions are used to handle file operations such as opening, reading, seeking, and closing files. Let us look in to some common file system calls:

- `fopen()`
  ```c
  FILE *fopen(const char *filename, const char *mode);
  ```
  Opens a file specified by filename and returns a pointer to a FILE structure that represents the file stream. If mode given as “rb”, it opens the file in binary read mode. **Returns**: A pointer to a FILE structure if successful, or NULL if the file cannot be opened.
- `fclose()`
  ```c
  int fclose(FILE *stream);
  ```
  Closes the file associated with the given FILE stream and releases any resources related to the file. **Returns**: 0 on success, or EOF (End Of File) on error.
- `fseek()`
  ```c
  int fseek(FILE *stream, long offset, int whence);
  ```
  Moves the file pointer to a specific location in the file.
  - offset: The number of bytes to move the file pointer.
  - whence: Specifies how the offset is interpreted:
    - SEEK_SET: The offset is set relative to the beginning of the file.
    - SEEK_CUR: The offset is added to the current position.
    - SEEK_END: The offset is set relative to the end of the file.
  **Returns**: 0 on success, or -1 on error.
- `ftell()`
  ```c
  long ftell(FILE *stream);
  ```
  Returns the current position of the file pointer in the file, measured in bytes from the beginning of the file. **Returns**: The current position (in bytes) on success, or -1L on error.
- `fread()`
  ```c
  size_t fread(void *ptr, size_t size, size_t count, FILE *stream);
  ```
  Reads data from the file into a buffer.
  - ptr: The buffer where the data will be stored.
  - size: The size of each data element.
  - count: The number of elements to read.
  - stream: The file stream to read from.
  **Returns**: The number of elements successfully read. If an error occurs, the return value will be less than the requested number of elements.
- `ferror()`
  ```c
  int ferror(FILE *stream);
  ```
  Checks whether an error occurred while performing file I/O operations on the given file stream. **Returns**: 0 if no error has occurred, or a non-zero value if an error has occurred.
- `feof()`
  ```c
  int feof(FILE *stream);
  ```
  Checks whether the end of the file has been reached. **Returns**: A non-zero value if the end of the file has been reached, or 0 otherwise.

`errno` determines the specific error when an operation fails. In case of `fopen()`, `EACCES` indicates a permission denied error and `ENOENT` indicates the specified file or directory doesn't exist.

The [`struct stat`](https://pubs.opengroup.org/onlinepubs/007904875/basedefs/sys/stat.h.html) data structure is used to store metadata about a file, such as its permissions and size. Its definition is as follows:

```c
struct stat {
    mode_t    st_mode;    // file type and permissions
    off_t     st_size;    // total size in bytes
    ...
};
```

The two fields relevant to us are `st_mode`, which encodes the file type and access permissions, and `st_size`, which holds the size of the file in bytes. The remaining fields store other metadata such as ownership, timestamps, etc. To populate this structure with a file's metadata, we use the `stat()` function.

- `stat()`

  ```c
  int stat(const char *path, struct stat *file_stat);
  ```

  Retrieves information about the file specified by `path` and stores it in the `struct stat` object pointed to by `file_stat`. The `struct stat` structure contains several fields that describe the file's attributes. The fields relevant to us are:
  - `st_size`: The size of the file in bytes, of type `off_t`.
  - `st_mode`: The file type and permissions, of type `mode_t`. Permission bits can be checked using bitwise AND (`&`) with the following macros:
    - `S_IRUSR`: Read permission for the file owner.
    - `S_IWUSR`: Write permission for the file owner.
    - `S_IXUSR`: Execute permission for the file owner.
    - `S_IRGRP`: Read permission for the file's group.
    - `S_IWGRP`: Write permission for the file's group.
    - `S_IXGRP`: Execute permission for the file's group.
    - `S_IROTH`: Read permission for others.
    - `S_IWOTH`: Write permission for others.
    - `S_IXOTH`: Execute permission for others.

  **Returns**: 0 on success, or -1 on error (and `errno` is set to indicate the error).

The functions in `xps_file.c` are given below:

1. **`xps_file_create()`**

   Opens the file using `fopen()`, creates a `xps_file_s` struct instance and initialize it.

   ```c
   xps_file_t *xps_file_create(xps_core_t *core, const char *file_path, int *error) {
     /*assert*/

     *error = E_FAIL;
     /*check if file is inside the public directory*/
     char *resolved_path = realpath(file_path, NULL);
     char *resolved_public = /*find realpath of "../public"*/

     if (resolved_path == NULL || resolved_public == NULL) {
       logger(LOG_ERROR, "xps_file_create()", "realpath() failed");
       /*free both path*/
       /*close file object*/
       return NULL;
     }

     size_t public_len = strlen(resolved_public);
     if (strncmp(resolved_path, resolved_public, public_len) != 0) {
       logger(LOG_WARNING, "xps_file_create()", "file is not inside the public directory");
       *error = E_PERMISSION;
       /*free both path*/
       /*close file object*/
       return NULL;
     }

     /*free both path*/

     /*check if others have read permission*/
     struct stat file_stat;
     if (stat(file_path, &file_stat) != 0) {
       logger(LOG_ERROR, "xps_file_create()", "stat() failed");
       perror("Error message");
       /*close file object*/
       return NULL;
     }

     if (!(file_stat.st_mode & S_IROTH)) {
       logger(LOG_WARNING, "xps_file_create()", "others do not have read permission");
       *error = E_PERMISSION;
       /*close file object*/
       return NULL;
     }

     // Getting size of file from stat (already called above)
     long temp_size = file_stat.st_size;

     // Opening file
     FILE *file_struct = fopen(file_path, "rb");
     /*handle EACCES,ENOENT or any other error*/
     if (file_struct == NULL) {
       /*logs EACCES,ENOENT or any other error*/
       return NULL;
     }

     const char *mime_type = /*get mime type*/

     /*Alloc memory for instance of xps_file_t*/
     xps_pipe_source_t *source =
       xps_pipe_source_create((void *)file, file_source_handler, file_source_close_handler);
     /*if source is null, close file_struct and return*/

     // Init values
     source->ready = true;
     /*initialise the fields of file instance*/

   	*error = OK;

     logger(LOG_DEBUG, "xps_file_create()", "created file");

     return file;
   }
   ```

   The [`realpath()`](https://pubs.opengroup.org/onlinepubs/009696799/functions/realpath.html) function converts any path into its **absolute version**. It cleans up the path by resolving "../" (parent directory) and "./" (current directory). For example, it would transform `../public/index.html` into a complete path like `/home/user/project/public/index.html`. This ensures the server knows exactly where a file is located on the disk.

2. **`xps_file_destroy()`**

   Closes the file, destroys the associated pipe source, and frees the memory allocated for the file structure.

   ```c
   void xps_file_destroy(xps_file_t *file) {
     /*assert*/

     /*fill as mentioned above*/

     logger(LOG_DEBUG, "xps_file_destroy()", "destroyed file struct");
   }

   ```

3. **`file_source_handler()`**

   It reads from the file into the buffer and upon successful reading, writes it to pipe.

   ```c
   void file_source_handler(void *ptr) {
     /*assert*/

     xps_pipe_source_t *source = ptr;
     /*get file from source ptr*/

     /*create buffer and handle any error*/

     // Read from file
     size_t read_n = fread(buff->data, 1, buff->size, file->file_struct);
     buff->len = read_n;

     // Checking for read errors
     if (ferror(file->file_struct)) {
   	  /*deallocate buff, file_struct and return*/
     }

     // If end of file reached
     if (read_n == 0 && feof(file->file_struct)) {
       /*deallocate buff, file_struct and return*/
     }

     /*Write to pipe form buff*/
   	/*deallocate buff*/
   }
   ```

4. **`file_source_close_handler()`**

   This function is called when the file source is closed, triggering the deallocation of the file object.

   ```c
   void file_source_close_handler(void *ptr) {
     /*assert*/
   	xps_pipe_source_t *source = ptr;
     /*get file from source ptr*/
   	/*deallocate file object*/
   }
   ```

Update the xps.h by adding two newly created structs xps_file_s and

```c
struct xps_keyval_s {
  char *key;
  char *val;
};
```

The second struct is for storing the key-value pairs of mime extensions and mime types(`mime_types` lookup table). Create the type defs for the above struct. Also include the header files of both `xps_mime` and `xps_file` modules.

## `xps_listener` Module - Modifications

### `xps_listener.c`

As we have to serve file for the incoming connections on port 8002, the `listener_connection_handler` function has to be modified. The `xps_file_create` function is invoked for opening the file and creating a `xps_file_s` instance for it. The path of file to be opened is specified in the argument. Then pipe is created with the source that is attached to the file instead of that attached to connection.

```c
    if (listener->port == 8001) {
      ....
    } else if (listener->port == 8002) {// [!code ++]
      int error;// [!code ++]
      xps_file_t *file = xps_file_create(listener->core, "public/sample.txt", &error);// [!code ++]
      xps_pipe_create(listener->core, DEFAULT_PIPE_BUFF_THRESH, file->source, client->sink);// [!code ++]
    } else {
      ...
    }
```

:::info NOTE
Since

:::

## Milestone #1

Update the `build.sh` to include the newly created modules.

In the expserver folder, create a new folder public. Inside this create a file sample.txt with any content. This path is given while calling the `xps_file_create` function.

Now start the server as mentioned in previous stages. Connect a client on port 8002 using `netcat localhost 8002`. Verify that the contents in file sample.txt is received by the client in terminal. Thus we have successfully implemented a basic file server which can send files in local disk to the client.

## Conclusion

Now all the clients connected to port 8002, would be served the specified file. Thus we have implemented a simple file transfer system. The file server is implemented along with the pipe mechanism itself with the only difference being source reading the file attached to its `ptr` field and writing it to pipe.
