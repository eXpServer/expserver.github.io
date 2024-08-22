# Stage 4: UDP with Multi-threading

## Recap

- In the previous stage, we modified our TCP server code to handle multiple clients simultaneously using epoll

## Learning Objectives

- We will implement a UDP server with multi-threading to handle multiple clients

---

::: tip PRE-REQUISITE READING

- Read about [UDP](/guides/resources/udp.md)
- Read about [multi-threading](/guides/resources/multi-threading.md)

:::

## Introduction

In the previous stage we have created a concurrent server using epoll method. Now we will use multithreading to implement the same. We can use **multithreading** along with either TCP or UDP protocol. In this stage we will use **UDP** (User Dtagram Protocol) which is a connectionless and unreliable protocol.

We will be using the following functions to setup UDP connections:

![udp_flow.png](/assets/resources/udp_flow.png)

## Implementation
![udp_implementation.png](/assets/resources/udp_implementation.png)

### UDP server

 Create a file `udp_server.c` and place it inside `expserver/phase_0`. We would be implementing our server code here.

Let us start by adding all the headers mentioned in stage 1. In addition to these headers, add `#include <pthread.h>` , which provides the necessary functions and data types for creating and managing threads.

Now we can start with the creation of socket in the main function. 

In `socket()` function, for TCP protocol we used `SOCK_STREAM` as the type. Here, for UDP we will be using `SOCK_DGRAM`. Datagram sockets provide a connectionless, unreliable, and message-oriented form of communication.

```c
int sockfd = socket(/*todo*/ , SOCK_DGRAM, /*todo*/);
```
Now, assign an address (consisting of an IP address and a port) to the socket using the data structure struct sockaddr_in  and then bind the socket created, as done in previous stages.

::: tip IMPORTANT!

User Datagram Protocol (UDP) is a connectionless protocol that doesn't require a connection to be established between the source and destination before data is transmitted,i.e datagrams can come in any order from any source.Therefore, listen(), accept() and connect() system calls are not required in UDP. 

:::

::: tip IMPORTANT!

We will be using sendto() and recvfrom() system calls, instead of send() and recv()  as used in TCP. Since we are not creating a connection socket, we use sendto() in order to specify the destination and recvfrom() to specify from where the data was received from.

:::

Now server is ready to receive messages from the clients. We can use recvfrom() to receive data from the client. 

```C
int n = recvfrom(sockfd, buffer, BUFF_SIZE, 0,(struct sockaddr*)&client_addr, &len);
```

recvfrom() function reads incoming data from the client and stores it in the character buffer, `buffer` .Upon successful reception, `recvfrom()` returns the number of bytes received, which is stored in the variable n.

Now we have received the data from the client. To store the received data and client details we are creating a new data structure named `client_data_t` .

```C
typedef struct {
    char message[BUFF_SIZE];
    struct sockaddr_in client_addr;
    int sockfd;
    socklen_t addr_len;
} client_data_t;
```

In the main function initialize a variable of type client_data_t , which will store the received data and client details.

```C
client_data_t* data = (client_data_t*)malloc(sizeof(client_data_t));
        strcpy(data->message, buffer);
        data->client_addr = client_addr;
        data->sockfd = sockfd;
        data->addr_len = len;
```

In the next step we will be creating a thread for handling the received request. We can use pthread_create() function for creating a new thread.

```C
pthread_create(&thread_id, NULL, handle_client, (void*)data)
```

pthread_create() function takes four arguments as follows.

- **thread:** pointer to an unsigned integer value that returns the thread id of the thread created.
- **attr:** pointer to a structure that is used to define thread attributes like detached state, scheduling policy, stack address, etc. Set to NULL for default thread attributes.
- **handle_client:** pointer to a subroutine that is executed by the thread. The return type and parameter type of the subroutine must be of type void *. The function has a single attribute but if multiple values need to be passed to the function, a struct must be used.
- **data:** pointer to void that contains the arguments to the function defined in the earlier argument.

The thread created above will execute the handle_client function in which we are reversing the string and sending it back to the client. In this function we are passing an argument of type void*, which will be further typecasted to client_data_t* .

Now we can see the handle_client function.

```C
void* handle_client(void* arg) {
    client_data_t* data = (client_data_t*)arg;
    printf("[CLIENT MESSAGE] %s",data->message);

    // Reverse the string
    /* todo */
    
    // Send back the reversed string
    sendto(data->sockfd, data->message, strlen(data->message), 0,(struct sockaddr*)&(data->client_addr), data->addr_len);

    free(data); // Free the allocated memory
    pthread_exit(NULL);
}
```

Here the sendto() function sends message to the client address without establishing a connection. After sending the message we can free the memory allocated to the argument of the function. At the end of handle_client, the thread can be terminated by calling pthread_exit().

After successful termination of the thread, control will reach the main function where we will be detaching the created thread using pthread_detach() .

```C
pthread_detach(thread_id);
```
- **thread_id:** thread id of the thread that must be detached.

Our final code will look like this.
```C
#include <arpa/inet.h>
#include <netdb.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>
#include <pthread.h>

#define PORT 8080
#define BUFF_SIZE 10000

typedef struct {
    char message[BUFF_SIZE];
    struct sockaddr_in client_addr;
    int sockfd;
    socklen_t addr_len;
} client_data_t;

void strrev(char *str){
for(int start=0, end=strlen(str) - 2; start<end ; start++, end--){
char temp = str[start];
str[start] = str[end];
str[end]=temp;
}

}

void* handle_client(void* arg) {
    client_data_t* data = (client_data_t*)arg;
    printf("[CLIENT MESSAGE] %s",data->message);

    // Reverse the string
    strrev(data->message);

    // Send back the reversed string
    sendto(data->sockfd, data->message, strlen(data->message), 0,(struct sockaddr*)&(data->client_addr), data->addr_len);

    free(data); // Free the allocated memory
    pthread_exit(NULL);
}

int main() {
    int sockfd;
    char buffer[BUFF_SIZE];
    struct sockaddr_in server_addr, client_addr;
    pthread_t thread_id;

    // Create socket
    sockfd = /* TODO */
    

    // Set server address parameters
    server_addr.sin_family = /* TODO */       // IPv4
    server_addr.sin_addr.s_addr = /* TODO */ // Any incoming interface
    server_addr.sin_port = /* TODO */     // Server port

    // Bind the socket to the server address
    bind(/* TODO */);

    printf("[INFO] server listening on port %d\n",PORT);

    while (1) {
        socklen_t len = sizeof(client_addr);
        int n = recvfrom(/* TODO */);
        buffer[n] = '\0';

        // Allocate memory for client data to pass to the thread
        client_data_t* data = (client_data_t*)malloc(sizeof(client_data_t));
        strcpy(data->message, buffer);
        data->client_addr = /* TODO */
        data->sockfd = /* TODO */
        data->addr_len = /* TODO */

        // Create a new thread to handle the client
        if (pthread_create(&thread_id, NULL, handle_client, (void*)data) != 0) {
            perror("Failed to create thread");
            free(data);
        }

        // Detach the thread to allow independent execution
        pthread_detach(thread_id);
    }

    // Close the socket (unreachable in this infinite loop)
    /* TODO */
    return 0;
}
```

## Milestone 1

We have successfully created a udp server. Now lets do a small test and check how our code performs.

Compile the code with the following command:

```bash
gcc udp_server.c -o udp_server -pthread
```

start the server:

```bash
./udp_server
```

Now you can test the server using a netcat client.Open another terminal in parallel and type the following command to start a netcat UDP client:

```bash
nc -u localhost 8080
```

Try sending messages from the client.Check whether you are getting the reversed strings.

Your UDP server is ready now.

 Next lets see our UDP client code.

### UDP Client

Now lets implement the UDP client code.
Create a file `udp_client.c` and place it inside `expserver/phase_0`. We would be implementing our client code here. The header files and global variables required are same as that in the TCP client code.

Create a socket of type SOCK_DGRAM. As mentioned earlier here we wont be using connect() system call due to the connectionless property of UDP.

Here we are sending the message to server using sendto() and the reversed string is received using recvfrom().

Our final code looks like this.
```C
#include <arpa/inet.h>
#include <netdb.h>
#include <netinet/in.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <unistd.h>

#define SERVER_PORT 8080
#define BUFF_SIZE 10000

int main() {
    char buffer[BUFF_SIZE];
    char message[BUFF_SIZE];

    // Create socket
    int sockfd = socket(/* TODO */);
    
    struct sockaddr_in server_addr;

    // Set server address parameters
    server_addr.sin_family = /* TODO */
    server_addr.sin_addr.s_addr = /* TODO */
    server_addr.sin_port = /* TODO */
    
    while (1) {
        printf("Enter a string : ");
        fgets(message, BUFF_SIZE, stdin);
        

        // Send the message to the server
        sendto(sockfd, message, strlen(message), 0,(struct sockaddr*)&server_addr, sizeof(server_addr));

        // Receive the reversed string from the server
        int n = recvfrom(sockfd, buffer, BUFF_SIZE, 0, NULL, NULL);
        buffer[n] = '\0';

        printf("[SERVER MESSAGE] %s",buffer);
    }

    // Close the socket
    close(sockfd);
    return 0;
}
```
## Conclusion

Now our UDP server is capable of handling multiple client requests simultaneously. Here we have achieved concurrency using multithreading. We are creating a new thread for each of the incoming client requests.In the previous stage we have seen how to make a server concurrent using epoll mechanism in which only a single thread is being used. Most of the modern web servers use epoll mechanism for obtaining concurrency.
