# Stage 18: IP Whitelist/Blacklist

## Recap

In Phase 2, we have made `expServer` HTTP compatible and dynamically configurable using JSON file. We have also implemented directory browsing as a fallback when no index file is present.

## Learning Objectives

- We will implement IP whitelist/blacklist functionality

<!-- :::tip PRE-REQUISITE READING

Read about IP whitelist/blacklist functionality from [here](https://instasafe.com/blog/whitelisting-vs-blacklisting-whats-the-difference/)

::: -->

## Introduction

IP whitelisting and blacklisting are security features that allow you to control access to your web server based on IP addresses. IP whitelisting allows only specified IP addresses to access your server, while IP blacklisting blocks specified IP addresses from accessing your server.

## Implementation
