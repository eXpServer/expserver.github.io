# Phase 3: Overview

## Recap of Phase 2

After the completion of phase 2, we have made eXpServer HTTP compatible - capable of parsing HTTP requests, serving static files, and handling directory browsing as a fallback when no index file is present. On progressing through each stage in phase 2, we have implemented various modules that extend the server's capabilities. Let's have a quick recap of the stages in phase 2:

- **Stage 14**: Implemented custom HTTP request parsing from scratch using a state machine (`xps_http`). This allows the server to transform raw client data into structured HTTP request objects by parsing request lines and headers.
- **Stage 15**: Added HTTP response handling via the `xps_http_res` module. This enables the server to construct, manage, and serialize standard HTTP responses (status lines, headers, and bodies) to be sent back to clients.
- **Stage 16**: Introduced a JSON-based configuration system using the Parson library. The `xps_config` module handles server setups dynamically, supporting features like reverse proxying and URL redirections through configuration lookups.
- **Stage 17**: Developed the `xps_directory` module to provide automated directory browsing. This dynamically generates an HTML file listing as a fallback when a requested directory does not contain an index file.

## What to expect in phase 3

In Phase 2, we made expServer HTTP compatible. We developed modules for parsing HTTP requests, generating standard responses, and managing server settings through a JSON configuration file. We also added support for automated directory browsing when index files are missing.

As our server grows, we need to address real-world challenges like security, performance, and scalability. In Phase 3, we will implement several key features:

- **Security & Access Control**: Learn how to block malicious IPs and manage trusted access using Access Control Lists (ACLs). We will also implement connection timeouts to prevent inactive connections from compromising server security.
- **Performance Optimization**: Implement data compression to reduce bandwidth usage and speed up file transfers.
- **Scalability**: Explore load balancing techniques to efficiently manage a large volume of concurrent clients.

By the end of this phase, eXpServer will be equipped with the essential tools required to handle more diverse and secure network traffic.
