# File Descriptors

When we open a file, the OS creates an entry to represent that file and store the information about that opened file.

For example if there are 100 files opened in your OS then there will be 100 entries in OS (somewhere in kernel). These entries are represented by non-negative integers like (0, 1, 2, ...100, 101, 102....). This entry number is the file descriptor.

So it is just an integer number that uniquely represents an opened file for the process.

The kernel maintains a table of all open file descriptors, which are in use. The allotment of file descriptors is generally sequential and they are allotted to the file as the next free file descriptor from the pool of free file descriptors. When we closes the file, the file descriptor gets freed and is available for further allotment.
