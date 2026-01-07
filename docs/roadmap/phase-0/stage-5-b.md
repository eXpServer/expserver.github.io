# File Transfer using TCP
## Recap

- In the previous stage, We made a TCP proxy by combining the functionalities of a TCP server and client which relays the communication between a web browser and a python file server.

## Learning Objectives
- We will modify our TCP server and client code to implement a simple File Transfer System.

## Introduction

In the previous stage we made a TCP proxy for relaying the communication between web browser and a python file server. In this stage we are modifying our TCP server and client code to perform a simple file transfer system using socket programming. Here we are modifying the client code to send a text file's content to the server, the modified tcp server will receive the data from the client and store the data in a specified file. This system mimics fundamental operations of [File Transfer Protocol(FTP).](https://en.wikipedia.org/wiki/File_Transfer_Protocol)

## Implementation

![file-transfer.png](/assets/stage-4/file-transfer.png)

### TCP Server for File Transfer

Create a file `ft_server.c` and place it inside `expserver/phase_0`. We would be implementing our server code here. Here we also need to create two text files **t1.txt** from which we are reading the data and **t2.txt** to which we are writing the contents from the **t1.txt**. After creating the text file **t1.txt** copy the contents given below in to the text file.

```c
Hello!
This is a File Transfer System.
```

The **t2.txt** file leave it as an empty file.

Now let us start by implementing the `fp_server.c` for opening the text file **t2.txt** and writing the contents from the client to it. Write the TCP server code that we learned in the first stage until the `accept()` function. After accepting the client connection we will call the `write_to_file()` function with connection `sock_fd` as an argument for performing the file transfer operation.

Now we can implement the `write_to_file()` function.

```c
void write_to_file(int conn_sock_fd) {
    char buffer[BUFF_SIZE];
    ssize_t bytes_received;
    
    // Open the file to which the data from the client is being written
    FILE *fp;
    const char *filename="t2.txt";
    fp = fopen(filename, "w");
    if (fp == NULL) {
        perror("[-]Error in creating file");
        exit(EXIT_FAILURE);
    }
   ...
```

The `fopen()` function in C is used to open a file specified by *filename* for performing operations like reading, writing etc. It is defined in the `<stdio.h>` library and returns a file pointer (`FILE *`) if successful, or `NULL` if there is an error in opening the file.

1. **`filename`**: This parameter specifies the name of the file to be opened. It could be a relative or absolute file path. For example, `"file.txt"` refers to a file in the current directory, while `"/home/user/file.txt"` refers to an absolute path. In this server code our file name is `“t2.txt”`.
2. **`mode`**: This parameter specifies the file access mode, which determines how the file is opened (e.g., for reading, writing, appending, etc.). The mode is provided as a string and is crucial to determining the type of operations allowed on the file.
    
    The common modes are:
    
    - `"r"`: Open for reading. If the file doesn't exist, the function returns `NULL`.
    - `"w"`: Open for writing. If the file exists, it truncates the file to zero length; otherwise, it creates a new file.
    - `"a"`: Open for appending. Writes to the file are always appended to the end of the file, regardless of the current file pointer position. If the file doesn't exist, it is created.
    - `"r+"`: Open for both reading and writing. The file must exist.
    - `"w+"`: Open for both reading and writing. If the file exists, it is truncated; otherwise, a new file is created.
    - `"a+"`: Open for both reading and appending. If the file doesn't exist, it is created.
    
    Here we are providing `mode` as `“w”` for writing the contents from the client to the text file. If the file exists, the function returns the file pointer in which the position of the file pointer is initially at the beginning of the file.
    

we opened the file **t2.txt** for writing the contents from the client. Recieve the data from the client using the the `recv()` function call. Uppon succesful recieve of data from the client we can write the data into the text file using the `fprintf()` function.

```c
    printf("[INFO] Receiving data from client...\n");
    while ((bytes_received = recv(/* fill this  */)) > 0) {
        printf("[FILE DATA] %s", buffer); // Print received data to the console
        fprintf(fp, "%s", buffer);      // Write data to file
        memset(/* fill this */);   // Clear the buffer
    }

    if (bytes_received < 0) {
        perror("[-]Error in receiving data");
    }
```

The `fprintf()` function in C writes formatted output to a specified file stream. It is defined in the `<stdio.h>` library and works similarly to `printf()`, but instead of writing to the console, it writes to a file. After writing the data into the text file we can close the file using the `fclose()` function.

```c
    fclose(fp);
    printf("[INFO] Data written to file successfully.\n");
}
```

The `fclose()` function defined in `<stdio.h>` library is used to close an open file. It ensures that all data buffered in memory is properly written to the file and releases the resources associated with the file.

Now we completed the `write_to_file()` function. In `main()`, close the `conn_sock_fd` for disconnecting the client connection.

## Milestone 1

We have successfully created a tcp server for file transfer. Now lets do a small test and check how our code performs.

Compile the code with the following command:

```bash
gcc fp_server.c -o fp_server
```

start the server:

```bash
./fp_server
```

Now you can test the server using a netcat client.Open another terminal in parallel and type the following command to start a netcat UDP client:

```bash
nc localhost 8080
```

Try sending messages from the client and terminate the netcat client by `ctl + c` . Open the file **t2.txt** and you can see the  message sent is written into the file.

Your TCP server for file transfer is ready now.

### TCP Client for File Transfer

 Next let's see our TCP client code for File Transfer. Create a file `fp_client.c` and place it inside `expserver/phase_0`. We would be implementing our client code here. Write the TCP client code that we learned in the second stage for making the connection with the server. After making a successful connection with the server we can call the `send_file()` function with `client_sock_fd` as argument.

The `send_file()` function is used for performing operations like opening the text file, reading the contents of the file, transfering the data to the server and closing the file. Now let’s look how we can implement this function.

```c
void send_file(int sockfd) {
    // Open the file from the data is being read
    FILE *fp;
    const char *filename="t1.txt";
    fp = fopen(filename, "r");
    if (fp == NULL) {
        perror("[-]Error in opening file.");
        exit(1);
    }
```

The `fopen()` function will open the file specified in the filename (here `t1.txt` ) for performing the read operation because here we specified the mode as `“r”` . The function returns the file pointer to the fp. If the call fails it store NULL in fp. Read the contents of the file using `fgets()` and send the data in to the server using the `send()` functions. If the `send()` fails exit from the program.

```c
    char data[BUFF_SIZE] = {0};
    printf("[INFO] Sending data to server...\n");

    while (fgets(data, BUFF_SIZE, fp) != NULL) {
        if (send(/* fill this */) == -1) {
            perror("[-]Error in sending data.");
            fclose(/* fill this */); // Ensure file is closed on error
            exit(1);
        }
        printf("[FILE DATA] %s", data);
        bzero(data, BUFF_SIZE); // clear the buffer
    }

```

After sending the data to the server close the file using the `fclose()` function and exit from the function.

```c
    printf("[INFO] File data sent successfully.\n");
    fclose(/* fill this */); // Close the file after sending
}
```

Now we completed the `send_file()` function. In `main()`, close the `client_sock_fd` for disconnecting the client connection.

## Milestone 2

We have successfully created our TCP client for file transfer. Now we can compile both fp_server.c and fp_client.c codes. After successful execution of the file transfer system we can observe the contents of t1.txt file is transfered in to the file t2.txt. Open the file t2.txt and see the new contents saved into it after the compilation of the codes.

## Conclusion

This marks the end of Phase 0.

Phase 0 laid the foundation as to what is about to come next. Starting from the next phase, we start building eXpServer. Read more about Phase 1 [**here**](/roadmap/phase-1/).