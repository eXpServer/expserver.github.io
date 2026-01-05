# Guides

<script setup>
const isProd = import.meta.env.PROD
</script>

The guides feature supplementary documentation intended for your reference as you progress through the roadmap. You'll be directed to the relevant pages as necessary. These documents are broadly classified into two categories:

- **Resources:** These articles include information designed to help us understand concepts. They may include links to third-party websites for deeper understanding of specific topics.
- **References:** These articles provides descriptions and code snippets related to functions and libraries that you'll utilize during implementation. They serve a similar purpose to a `README.md` file found in projects.

## Resources

<span v-if="!isProd">✅ Reviewed </span>
<span v-if="!isProd">🟡 To be reviewed </span>
<span v-if="!isProd">⚪ Partially reviewed </span>

- <span v-if="!isProd">✅</span> [Architecture](/guides/resources/architecture)
- <span v-if="!isProd">✅</span> [Coding Conventions](/guides/resources/coding-conventions)
- <span v-if="!isProd">✅</span> [GDB](/guides/resources/gdb)
- <span v-if="!isProd">✅</span> [TCP/IP Model](/guides/resources/tcp-ip-model)
- <span v-if="!isProd">✅</span> [TCP Socket Programming](/guides/resources/tcp-socket-programming)
- <span v-if="!isProd">✅</span> [UDP Socket Programming](/guides/resources/udp-socket-programming)
- <span v-if="!isProd">✅</span> [Process and Threads](/guides/resources/process-and-threads)
- <span v-if="!isProd">✅</span> [System Calls](/guides/resources/system-calls)
- <span v-if="!isProd">🟡</span> [Introduction to Linux epoll](/guides/resources/introduction-to-linux-epoll)
- <span v-if="!isProd">🟡</span> [Linux epoll](/guides/resources/linux-epoll)
- <span v-if="!isProd">🟡</span> [Blocking & Non-Blocking Sockets](/guides/resources/blocking-and-non-blocking-sockets)
- <span v-if="!isProd">🟡</span> [HTTP](/guides/resources/http)


## References

- <span v-if="!isProd">✅</span> [vec](/guides/references/vec)
- <span v-if="!isProd">✅</span> [xps_logger](/guides/references/xps_logger)
- <span v-if="!isProd">🟡</span> [xps_buffer](/guides/references/xps_buffer)
- <span v-if="!isProd">🟡</span> [xps_utils](/guides/references/xps_utils)
