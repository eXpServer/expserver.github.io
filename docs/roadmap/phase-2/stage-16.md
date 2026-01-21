# Stage 16: Config Module

## Recap

In the previous stages, we have updated our server to operate with HTTP messages. We have implemented HTTP request parsing in Stage 14 and sending the output as HTTP response messages in Stage 15.

## Learning Objectives

- Implementation of multiple cores
- Use JSON file to set-up server configuration
- Implement reverse proxy and URL redirecting

## Introduction

Till now, we have implemented a single core architecture i.e all listeners created were attached to the same core. In this stage, we are updating the server to operate with multiple cores thus enhancing the throughput. It allows the efficient processing of multiple requests concurrently. Now, all the listeners to be created are duplicated across each of the cores.

A JSON configuration file is used to configure the number of cores to be created and the listeners to be attached to those. It also specifies the `type` of each of the port for a given a `req_path`.

For example:

```json
"listeners": [{ "host": "0.0.0.0", "port": 8003 }],
"routes": [
    {
        "req_path": "/",
        "type": "redirect",
        "http_status_code": 302,
        "redirect_url": "https://expserver.github.io"
    }
]
```

- Listener configuration ensures that any client connecting to the server's IP address on port 8003 will be able to send requests.
- `routes` defines the behavior of the server when handling specific request paths. Here, when a client sends a request to the root path (**`/`**), the server responds with a **`302`** status code, redirecting the client to the URL **`https://expserver.github.io`**.

We are also introducing the redirecting server and re-introducing the reverse proxy functionality.

## File Structure

![stage-16-filestructure.png](/assets/stage-16/stage-16-filestructure.png)

## Design

A new module `xps_config` is added for reading the JSON configuration file and storing the parsed data in the structs. It also implements a lookup of the configuration to determine the appropriate server and route for an incoming request. It also matchs the listeners and hostnames.

The session module is updated to incorporate the lookup of configuration while processing the request. The appropriate functionality is executed with respsect to the request type obtained from the lookup. The redirect server and reverse proxy server are implemented here.

The `main.c` is updated to create multiple cores. Each of the listeners mentioned in the configuration file is duplicated and added to all the cores created.

## Implementation

![stage-16-design.png](/assets/stage-16/stage-16-design.png)

As the server configuration is present in the form of JSON data, a parser is required for parsing this data. It parses JSON data into C structures and manipulate or extract the data in a structured manner. Add the below given files in the specified location for ensuring the parsing of provided configuration:

### Adding the Parson Library

To include the Parson JSON library in your project, navigate to `expserver/src/lib` directory and run the following commands:

```bash
mkdir parson
cd parson

curl -O https://raw.githubusercontent.com/eXpServer/parson/master/README.md
curl -O https://raw.githubusercontent.com/eXpServer/parson/master/parson.h
curl -O https://raw.githubusercontent.com/eXpServer/parson/master/parson.c
```

This will create a parson directory inside `expserver/src/lib/` and download all the required source files.

### xps_config.json

```json
{
	"server_name": "eXpServer",
	"workers": 4,
	"servers": [
		{
			"listeners": [{ "host": "0.0.0.0", "port": 8001 }],
			"routes": [
				{
					"req_path": "/",
					"type": "file_serve",
					"dir_path": "../public/",
					"index": ["index.html"]
				},
				{
					"req_path": "/hello",
					"type": "redirect",
					"http_status_code": 302,
					"redirect_url": "http://localhost:8002/"
				}
			]
		},
		{
			"listeners": [{ "host": "0.0.0.0", "port": 8002 }],
			"routes": [
				{
					"req_path": "/",
					"type": "reverse_proxy",
					"upstreams": ["localhost:3000"]
				}
			]
		},
		{
			"listeners": [{ "host": "0.0.0.0", "port": 8003 }],
			"routes": [
				{
					"req_path": "/",
					"type": "redirect",
					"http_status_code": 302,
					"redirect_url": "https://expserver.github.io"
				}
			]
		}
	]
}
```

This JSON configuration describes the setup of the eXpServer. The `workers` denotes the number of cores to be created, 4 in this case. `servers` is an array containing configuration for individual servers. Each server includes listeners (IP and port bindings) and routes (handling of HTTP requests). The above given is an example configuration and can be modified  to add more ports or changing the route types for a port.

### xps_config

A new folder, config, is added for creating a server with the configurations mentioned in the JSON file provided. It enables accessing a JSON-based server configuration for a web server application. It relies on the Parson library to parse JSON and provides a structured approach to create, query, and destroy configurations. `xps_config_create()` creates the server with the parsed information of the provided JSON configuration file. `xps_config_lookup()` determines the appropriate server and route for an incoming request.

##### xps_config.h

The code below has the contents of the header file for `xps_config`. Have a look at it and make a copy of it in your codebase.

:::details **expserver/src/config/xps_config.h**
    
```c
#ifndef XPS_CONFIG_H
#define XPS_CONFIG_H

#include "../xps.h"

struct xps_config_s {
	const char *config_path;
	const char *server_name;
	u_int workers;
	vec_void_t servers;
	vec_void_t _all_listeners;
	JSON_Value *_config_json;
};

struct xps_config_server_s {
	vec_void_t listeners;
	vec_void_t hostnames;
	vec_void_t routes;
};

struct xps_config_listener_s {
    const char *host;
    u_int port;
};

struct xps_config_route_s {
	const char *req_path;
	const char *type;
	const char *dir_path;
	vec_void_t index;
	vec_void_t upstreams;
	u_int http_status_code;
	const char *redirect_url;
	bool keep_alive;
};

typedef enum xps_req_type_e { 
	REQ_FILE_SERVE, 
	REQ_REVERSE_PROXY, 
	REQ_REDIRECT, 
	REQ_METRICS, 
	REQ_INVALID 
} xps_req_type_t;

struct xps_config_lookup_s {
	xps_req_type_t type;

	/* file_serve */
	char *file_path; // absolute path
	char *dir_path;  // absolute path
	long file_start; // parse range header
									// https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests
	long file_end;

	/* reverse_proxy */
	const char *upstream;

	/* redirect */
	u_int http_status_code;
	const char *redirect_url;

	/* common */
	bool keep_alive;
	vec_void_t ip_whitelist;
	vec_void_t ip_blacklist;
};

xps_config_t *xps_config_create(const char *config_path);
void xps_config_destroy(xps_config_t *config);
xps_config_lookup_t *xps_config_lookup(xps_config_t *config, xps_http_req_t *http_req,
                                        xps_connection_t *client, int *error);
void xps_config_lookup_destroy(xps_config_lookup_t *config_lookup, xps_core_t *core);

#endif
```
:::
    

The names of the structs and its fields are intuitive, try to go through each and understand its use.

The struct `xps_config_s` represents the overall configuration of the server. 

The struct `xps_config_server_s` describes individual server configurations.

The struct `xps_config_lookup_s`  represents a lookup result from configuration where `xps_req_type_t type` indicates thr type of request (REQ_FILE_SERVE, REQ_REVERSE_PROXY, etc.).

Fields `file_path`, `dir_path`, `file_start` used by a file server, `upstream` used by a reverse proxy server and `http_status_code`, `redirect_url` used by a redirect.

##### xps_config.c

The functions implemented are briefly explained below(do all the error checks for NULL as and when required) :

- `xps_config_create` : Creates and initializes a configuration structure (`xps_config_t`) by parsing a JSON file at the specified `config_path`.

```c
xps_config_t *xps_config_create(const char *config_path) {
  /*assert*/
  /*allocate mem for config*/
  /*get config_json using json_parse_file*/
  /*initialize fields of config object*/
  JSON_Object *root_object = json_value_get_object(config_json);
  ...
  /*initialize server_name,workers,servers fields - hint: use json_object_get_string
  ,json_object_get_number,json_object_get_array*/
  for (size_t i = 0; i < json_array_get_count(servers); i++) {
    /*fill this*/ = json_array_get_object(servers, i);
    /*fill this*/ = malloc(sizeof(xps_config_server_t));
    }
    /*initialize and parse the server and push to servers list of config*/
  }
  /*initialize and set up the _all_listeners array*/
  return config;
}
```

- `xps_config_destroy` : Cleans up and frees the memory allocated for the configuration object. Implement it by deallocating the servers and the corresponding listeners and routes. Also de-initialize the vectors.
- `xps_config_lookup` : Performs a lookup to find the correct configuration based on an HTTP request (`xps_http_req_t`) and client details (`xps_connection_t`).

```c
xps_config_lookup_t *xps_config_lookup(xps_config_t *config, xps_http_req_t *http_req,
                                       xps_connection_t *client, int *error) {
  /*assert*/
 *error = E_FAIL;
  /*get host,keep_alive(connection),accept encoding,pathname from http_req*/
  // Step 1: Find matching server block
  int target_server_index = -1;
  for (int i = 0;/*fill this*/; i++) {
    xps_config_server_t *server = /*fill this*/
		// Check if client listener is present in server
    for (int j = 0; /*fill this*/; j++) {
      /*fill this*/
      if () {
        has_matching_listener = true;
        break;
      }
    }
		if (!has_matching_listener)
      continue;
		/* Check if host header matches any hostname*/
		// NOTE: if not hostnames provided, it is considered a match
    if (has_matching_hostname) {
      target_server_index = i;
      break;
    }
  }
  
  xps_config_server_t *server = config->servers.data[target_server_index];
  
  /*Find matching route block*/
  // Route matching uses prefix matching with longest-match-first strategy.
  // This is important because:
  // - For file serving routes (e.g., "/"), we need to match any path under it
  //   (e.g., "/index.html", "/css/style.css" should all match route "/")
  // - For specific routes (e.g., "/api"), we want them to take precedence over "/"
  // 
  // Example: If we have routes "/" and "/api"
  // - Request "/index.html" matches "/" only → serves file from "/"
  // - Request "/api/users" matches both "/" and "/api" → use "/api" (longest match)
  
  xps_config_route_t *route = NULL;
  size_t best_match_len = -1;  // Track the longest matching route path
  
  for (int i = 0; i < server->routes.length; i++) {
		xps_config_route_t *current_route = server->routes.data[i];
		size_t route_path_len = /*find current route requested path length*/
		
		// Check if this route's path is a prefix of the request path
		if (str_starts_with(pathname, current_route->req_path)) {
				// If this is a longer match than we've found so far, use it
			if (route_path_len > best_match_len) {
				/*fill the rest*/
			}	
		}
  }
  
  if (route == NULL) {
      *error = E_NOTFOUND;  // No matching route found - 404
      return NULL;
  }
  /* Init values of lookup*/
  // File serve
  if (lookup->type == REQ_FILE_SERVE) {
    char *resource_path = /*use path_join to join paths*/
    if (!is_abs_path(
            resource_path)) { 
      /* we require abosulte path so we need to see 
        if the current path is absolute or not */
      /*fill here*/
    }
    // is file
    if (is_file(resource_path)) {
      lookup->file_path = /*fill here*/;

    } else if (is_dir(resource_path)) { // is directory
      /* If request is for a directory, serve the index file (e.g. index.html)
       * instead of showing the directory listing. */
      bool index_file_found = false;
      for (int i = 0; i < /*fill here*/; i++) {
        char *index_file = path_join(/*fill here*/);
       /*fill here*/
      }
      if (!index_file_found) {
        /*no index file so free the resource_path*/
      }
    } else {
      /*no matching type so free resource_path*/
    }
    *error = OK;
    return lookup;
  }
}
```
- For supporting functions you can refer to the [`xps_utils.c`](#xps-utils-c)
- `xps_config_lookup_destroy` : Implement yourself
- `parse_server` : Parses the server_object from the JSON configuration and populates the `xps_config_server_t` structure.  Extracts and initializes server listeners, hostnames, and routes. For each listener, it calls `parse_listener`, and for each route, it calls `parse_route`. It then stores the parsed information into the server structure. Implement it.
- `parse_route` : Parses the route configuration from the route_object in the JSON and fills the `xps_config_route_t` structure. Extracts the `req_path` and type of the route (the route type could be file_serve, reverse_proxy, or redirect). Based on the route type, it extracts additional information such as `dir_path` (for file serving), upstreams (for reverse proxy), and `redirect_url` (for redirects). It also manages the index files for file serving routes. Implement it.
- `parse_listener` : Purpose: Parses listener configuration from the listener_object in the JSON and populates the `xps_config_listener_t` structure. Extracts the host and port values for the listener and validates them. Populates the listener structure with this data. Implement it.
- `parse_all_listener` : The function iterates through all the servers and their listeners in the configuration. It checks whether each listener (identified by its host and port) already exists in the  `_all_listeners` array. If the listener doesn't exist, it adds it to the _all_listeners array. This ensures that all listeners are collected in `_all_listeners`, but duplicates (based on the same host and port) are avoided. Implement it.

### Core Module - Modifications

- To `xps_core_s` struct, add `config` field. `xps_core_create()` takes config as argument.
- Remove creating listeners while starting the server as the listeners are created during the configuration set-up itself.

### Session Module - Modifications

- Add the lookup field which is used to determine the type of the incoming request.
- In the `session_process_request()` the lookup(to determine the type of request) is done and the request is processed with respect to its type.

```c
/*config_lookup called*/
/*handle lookup error with appropriate response(eg: internal_server_error,not found)*/
if (lookup->type == REQ_FILE_SERVE) {
  ...
  if (lookup->file_path) {
    ...
  /*implementation already given*/
    
} else if (lookup->type == REQ_REVERSE_PROXY) {
  ...
  sscanf(lookup->upstream, "%[^:]:%u", host, &port);
  /*create upstream connection*/
  /*handle errors*/
  /*attach pipes*/

  }

} else if (lookup->type == REQ_REDIRECT) {
  xps_http_res_t *http_res =
      xps_http_res_create(session->core, lookup->http_status_code);
  xps_http_set_header(&http_res->headers, "Location", lookup->redirect_url);
  /*serialize the reponse*/
  set_to_client_buff(session, http_res_buff);
  /* destroy the response object after use */
  return;
} else {
  logger(LOG_ERROR, "session_process_request()", "invalid lookup type");
  /*destroy session*/
  return;
}
```

### Listener Module - Modifications

- Core is not used while creating listeners as now there are multiple cores attached to the config.
- Attaching the listener to the event loop and pushing to the listeners list of core is already done during the configuration set-up.

### main.c

Instead of creating a single core, multiple cores are created as specified in the configuration. Processes the command-line arguments to retrieve the configuration file path. The configuration is created which is followed by core creation.

```c
int main(int argc, char *argv[]) {
  signal(SIGINT, sigint_handler); //for handling ctrl+c
	cliargs = xps_cliargs_create(argc, argv);//get commandline arguments
	/*create config, create cores, start cores*/
}

int cores_create(xps_config_t *config) {
  /*assert*/
  cores = malloc(sizeof(xps_core_t *) * config->workers);
  // Create cores
  for (int i = 0; /*fill this*/; i++) {
    xps_core_t *core = xps_core_create(config);
    if (core) {
      cores[n_cores] = core;
      n_cores += 1;
    }
  }
  /*Create listeners*/
  /*Duplicate (use dup(fd) to duplicate file descriptor) and add listeners to cores*/
  /*Initialize dup_listener values*/
  /*Attach dup_listener to loop*/
  /*Add listener to 'listeners' list of core*/ 
  /*Destory listeners*/
}

void cores_destroy() {
  /*fill this*/
}

void sigint_handler(int signum) {
  /*fill this*/
}
```



### Additional utilities to be added

- Cliargs : To handle and store command-line arguments related to the configuration file path.
:::details **expserver/src/utils/xps_cliargs.h**
    
  ```c
  #ifndef XPS_CLIARGS_H
  #define XPS_CLIARGS_H
  
  #include "../xps.h"
  
  struct xps_cliargs_s {
    char *config_path;
  };
  
  xps_cliargs_t *xps_cliargs_create(int argc, char *argv[]);
  void xps_cliargs_destroy(xps_cliargs_t *cilargs);
  
  #endif
  ```
:::
    
:::details **expserver/src/utils/xps_cliargs.c**
    
  ```c
  #include "../xps.h"
  
  xps_cliargs_t *xps_cliargs_create(int argc, char *argv[]) {
    if (argc < 2) {
      printf("No config file path given\nUSAGE: xps <config_file_path>\n");
      return NULL;
    }
  
    xps_cliargs_t *cliargs = malloc(sizeof(xps_cliargs_t));
    if (cliargs == NULL) {
      logger(LOG_ERROR, "xps_cliargs_create()", "malloc() failed for 'cliargs'");
      return NULL;
    }
  
    if (is_abs_path(argv[1]))
      cliargs->config_path = str_create(argv[1]);
    else
      cliargs->config_path = realpath(argv[1], NULL);
  
    return cliargs;
  }
  
  void xps_cliargs_destroy(xps_cliargs_t *cliargs) {
    assert(cliargs != NULL);
  
    free(cliargs->config_path);
    free(cliargs);
  }

  ```
:::

- Utility functions required for checking directory, file, absolute path. 
:::details **expserver/src/utils/xps_utils.c** {#xps-utils-c}
    
  ```c

  bool str_starts_with(const char *str, const char *prefix) {
    assert(str != NULL);
    assert(prefix != NULL);

    size_t prefix_len = strlen(prefix);
    size_t str_len = strlen(str);

    if (str_len < prefix_len)
      return false;

    if (strncmp(str, prefix, prefix_len) != 0)
      return false;

    // checking boundary condition eg /api2 and /api (these should not match)
    // BUT if prefix ends with '/', it's already a clear boundary
    if (prefix_len > 0 && prefix[prefix_len - 1] == '/') {
      return true; 
    }

    char next = str[prefix_len];
    return (next == '\0' || next == '/');
  }

  char *path_join(const char *path_1, const char *path_2) {
    assert(path_1 != NULL);
    assert(path_2 != NULL);

    size_t joined_path_size = strlen(path_1) + strlen(path_2) + 4;
    char *joined_path = malloc(joined_path_size);
    snprintf(joined_path, joined_path_size, "%s/%s", path_1, path_2);

    return joined_path;
  }

  char *str_create(const char *str) {
    assert(str != NULL);

    char *new_str = malloc(strlen(str) + 1);
    if (new_str == NULL) {
      logger(LOG_ERROR, "str_create()", "malloc() failed for 'new_str'");
      return NULL;
    }
    strcpy(new_str, str);

    return new_str;
  }
  
  bool is_dir(const char *path) {
    assert(path != NULL);

    struct stat path_stat;
    if (stat(path, &path_stat) != 0)
      return false;

    return S_ISDIR(path_stat.st_mode);
  }

  bool is_file(const char *path) {
    assert(path != NULL);

    struct stat path_stat;
    if (stat(path, &path_stat) != 0)
      return false;

    return S_ISREG(path_stat.st_mode);
  }

  bool is_abs_path(const char *path) {
    assert(path != NULL);
    return path[0] == '/';
  } 
  ```
:::
    

- Also update `xps_utils.h` accordingly.

- Also update `xps.h` to reflect all the changes so far added in this stage.

## Milestone #1

First we have to run the server by giving the JSON file containing the configuration information as command line argument.

![exp1-img1.png](/assets/stage-16/exp1-img1.png)

Three port would be created as given:

![exp1-img2.png](/assets/stage-16/exp1-img2.png)

- First, we would be verifying the file server functionality. An `index.html`  file as mentioned in the xps_config.json is created in the public folder. Add some standard html code in this file. The contents can be viewed on [localhost:8001](http://localhost:8001) on the browser.

Try by replacing files of different format. You have to update JSON configuration file accordingly.

- Now, run a python file server as done earlier in Phase 0.
    
  ![exp1-img3.png](/assets/stage-16/exp1-img3.png)
  
  This will create the upstream server mentioned in xps_config.json.
    

The files in the directory in which the python server is running can be viewed from the urls [`localhost:8001/hello`](http://localhost:800/hello) and [`localhost:8002`](http://localhost:8002) . In this case, the url is redirected to the second one.

- `localhost:8003`  would be redirecting to the `redirect_url` mentioned in the JSON configuration file.

Try adding more ports and redirect to different urls.

## Experiments

### Experiment #1

eXpServer uses a **Longest Prefix Match** strategy to decide which route to use when multiple routes match a request path. To see this in action, open your `xps_config.json` and add two overlapping routes for the same server: Route A with `req_path: "/"` (Type: `file_serve`) and Route B with `req_path: "/api"` (Type: `redirect` to `http://localhost:8002`). 

Now, try requesting `http://localhost:8001/api/data`. You will notice that Route B is chosen because `/api` is a longer match than `/`. If you request `/ap`, where do you think it will be routed to?

### Experiment #2

In this experiment, we will explore how the server behaves when an index file is missing. Open `xps_config.json` and change the `dir_path` for the root route of port `8001` from `../public/` to `../../` (your project root). 

Now, navigate to `http://localhost:8001/` in your browser. You will notice that the server returns a **404 Not Found** error. Take a moment to think about why this happens even though the directory clearly exists on your system.


## Conclusion

In this stage, we transitioned from a hardcoded server setup to a dynamic, configuration-driven architecture using JSON. By implementing the `config` module, eXpServer now supports multiple worker cores, reverse proxying, and URL redirects. While the server currently returns a 404 error when an index file is missing from a directory, we will resolve this in the next stage by implementing a dedicated directory module.

  