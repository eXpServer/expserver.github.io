# Coding Conventions

In order to maintain consistency while developing eXpServer, we will be following a set of [coding conventions](https://en.wikipedia.org/wiki/Coding_conventions). Even though it is possible to develop eXpServer without following these exact conventions, the roadmap has been laid out with the expectation that these conventions will be followed.

## Header Files

In Phase 0, our codebase was compact and self-contained. Functions were developed within individual files and utilized exclusively within those contexts. However, as our project will grow in size and complexity, there will be a need to share code across various files. This is where header files come in.

We will have two types of headers files in eXpServer

- `xps.h`: This acts as the global header file, containing constants, other header includes, declarations etc. that are used across all modules in the project. `xps.h` will be included in all other files in the project
- `xps_<module>.h`: Each module in the project will have its own header file, such as `xps_listener.h` and `xps_connection.h`. These module-specific header files will contain struct definitions, function prototypes etc. related to the respective modules. To make these declarations globally available, we will include the module's header file in `xps.h`.

::: tip NOTE
Almost all header files we use in building eXpServer will be given to you. This will act as a blueprint to the functions that will have to be implemented and contain the struct definitions to be used. Keep in mind that even though we provide the header files, you can freely modify them to aid in your implementation.
:::

## Modules

eXpServer is developed in the form of modules. A module will comprise of a `.h` and `.c` file, eg: `xps_listener.h` and `xps_listener.c`. The header files will contain struct definitions, [function prototypes](https://en.wikipedia.org/wiki/Function_prototype) and other declarations. The C files will contain definitions for the functions.

### **Create and Destroy Functions**

A typical pattern that we will be seeing in modules is the _create_ and _destroy_ functions. For example, the `xps_listener` module has `xps_listener_t *xps_listener_create(...)` and `void xps_listener_destory(xps_listener_t *listener)` functions. These functions are responsible for the following:

- The _create_ functions will allocate memory and initialize the struct for the respective modules, `xps_listener_t` in this example. On success it will return a pointer to the instance and on error it will return `NULL` . Hence the calling function can detect an error by checking if the returned value is `NULL` or not.
- The _destroy_ functions will accept a pointer to an instance of the module struct, `xps_listener_t` in this case, to release memory and properly de-initialize any associated values. Since the destroy functions are always expected to succeed, it will not return any errors.

### **Other Module Functions**

Apart from the create and destroy functions, there could be other functions associated with the module, that can be called from anywhere in the code. Thus they are also declared in the modules’ header file, and its definition in the C file. The function names are prefixed with `xps_`.

### Helper Functions

Additionally, helper functions can be defined and used within the modules. They will be declared at the top of the C file and not in the header file. The function name should be prefixed with the module name without `xps_`, for eg: `listener_connection_handler()`. The function name starts with the module name `xps_istener` without `xps_` as it will be used within the `xps_listener.c` file only.

## Memory Management

As a web server is a software that is expected to run for long intervals of time without shutting down, [memory leaks](https://en.wikipedia.org/wiki/Memory_leak) in the code can lead to huge consumption of system resources which can lead to the OS killing the process. Hence, if memory is allocated, it should be de-allocated after its use.

### Modules

When writing a _create_ function for a module which allocates memory, an accompanying _destroy_ function should be written which will free the memory.

### Strings

- In case of functions that accept strings (character arrays) as parameters, if the function does not modify the string it should be passed as `const char *`.
  - eg: `int count_a(const char *str)`. Here the function returns the no. of letter ‘a’ in the string `str`. Since it won’t modify the string `str` it is passed as `const char *`.
- If a function returns a string that should not be modified, then its should be returned as a `const char *`.
  - eg: `const char *find_a(const char *str)`. Here the function finds the first occurrence of letter ‘a’ in the string `str`. Since it is a pointer to a byte in the string that should not be modified, it is returned as a `const char *`.
- If a function returns `char *`, that signifies the function has internally allocated memory using `malloc()`. It is the responsibility of the calling function to free that memory.
  - eg: `char * str_dup(const char *str)`. Here the function takes in a string and duplicates it. Internally `str_dup()` will allocate memory and copy over the contents from `str` and return a `char *` pointer to the newly allocated string.

> ::: info NOTE
> Memory leaks are hard to detect. Small leaks will only make an observable impact when the program is run for a long time. Hence the use of third party tools like [Valgrind](https://valgrind.org/) will be helpful in debugging memory issues in our code.
> :::

## Error Handling

Unlike more modern languages, error handling is not a built in feature of the C programming language. Hence, there are a set of conventions followed in-order to indicate a function call has resulted in an error. Let us see what they are.

### System Calls

System calls such as `socket()` , `listen()` etc. which are part of [libc](https://en.wikipedia.org/wiki/C_standard_library) usually return `-1` on error and sets the [errno](https://en.wikipedia.org/wiki/Errno.h). We can use the `perror()` function to print the message associated with the last set _errno_. To see the exact return values of function look up their [man pages](https://man7.org/).

### Pointer Return

In eXpServer, if a function has a pointer return type it should return a valid pointer on success and `NULL` on error. eg: `xps_listener_t *xps_listener_create()`.

### Error Code Return

If a function is intended to perform a task that could fail, it should return an integer type with a valid error code. Valid error codes like `OK`, `E_FAIL`, `E_NOTFOUND`, `E_AGAIN`, etc., are defined in the `xps.h` file, seen in the first stage of Phase 1. For example, in the function signature `int xps_loop_attach(...)`, if the call is successful, it will return `OK`; otherwise, it will return `E_FAIL`.

### Pointer Return with Error Code

When a function needs to return a pointer to an instance and report an error code, it's not possible in C to return more than one value directly. In such cases, the return type of the function will be a pointer, and a reference to an integer, `int *error`, is passed to the function by the calling function. On error, NULL is returned, and the error integer is set to a valid error code.

For example: `xps_file_t xps_file_create(..., int *error)`. On successful creation of the file instance, a valid pointer will be returned, and `*error` will be set to `OK`. In case of an error, `NULL` is returned, and `*error` is set to a valid error code such as `E_NOTFOUND`.

### Validating Function Params

When writing functions, start by validating the params first. You can use the [`assert()` macro](https://www.gnu.org/software/gawk/manual/html_node/Assert-Function.html) for this. Assert will stop the code execution and print the error if the expression is false. For example

```c
// Check if str has n 'a' in it
int has_n_a(const char *str, int n) {
	assert(str != NULL);
	assert(n >= 0);

	...
}
```

### Early Return Pattern

The early return pattern for errors is a programming practice where a function exits prematurely upon encountering an error condition, rather than continuing execution. This approach enhances code readability and performance by reducing nested conditionals and maintaining a clear flow of logic. When an error is detected, the function immediately returns by freeing up any allocated memory, closing any opened FDs, destroying and created instances etc. up till that point. For example

```c
// NOTE: This is an example and not the actual function definition
xps_listener_t *xps_listner_create(...) {
	// Validate params

	int sock_fd = socket(...);
	if(sock_fd == -1)
		return NULL;

	xps_listener_t *listener = malloc(...);
	if(listener == NULL) {
		close(sock_fd);
		return NULL;
	}

	int error == bind(...);
	if(error == -1) {
		close(sock_fd);
		free(listener);
		return NULL;
	}

	...

	return listener; // Success
}
```

## Logging

To help with debugging and understanding the order of function invocations, we will be logging messages throughout the code using the provided `xps_logger` utility. There are primarily 4 levels of logging, `LOG_INFO`, `LOG_WARNING`,`LOG_ERROR` and `LOG_DEBUG` .

![Screenshot 2024-04-27 at 15.36.17.png](/assets/resources/logs.png)

Read more about and get the source code for `xps_logger` [here](https://www.notion.so/xps_logger-9c8f4eb874ff4b0db31d2783197a7708?pvs=21).

## Naming Convention

[Snake case](https://en.wikipedia.org/wiki/Snake_case) convention is used to name all identifiers, i.e. small letters with underscores in place of spaces. For example `my_server`, `xps_buffer.c` etc. File names, function names and type names that are used across multiple files are prefixed with `xps_` , eg: `xps_buffer_create()` .
