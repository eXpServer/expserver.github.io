# Stage 16: HTTP Config Module

## Overview
A good server should be configurable. Till the previous phase, most of the features were hard-coded just for demonstration. The HTTP Module helped streamline the request interpretation and handling, and to structure the messages sent to the client. The config module helps create dynamic functionality to each listener by making use of a `.json` config file. The config file being used in this stage for testing purposes is given below:
```json
{
	"server_name": "eXpServer",
	"workers": 4,
	"servers": [
		{
			"listeners": [
				{
					"host": "0.0.0.0",
					"port": 8001
				}
			],
			"routes": [
				{
					"req_path": "/",
					"type": "file_serve",
					"dir_path": "../public",
					"index": [
						"index.html"
					],
					"gzip_enable": true,
					"gzip_level": 8
				},
				{
					"req_path": "/redirect",
					"type": "redirect",
					"http_status_code": 302,
					"redirect_url": "http://localhost:8002/"
				}
			]
		},
		{
			"listeners": [
				{
					"host": "0.0.0.0",
					"port": 8002
				}
			],
			"routes": [
				{
					"req_path": "/",
					"type": "reverse_proxy",
					"upstreams": [
						"localhost:3000"
					]
				}
			]
		},
		{
			"listeners": [
				{
					"host": "0.0.0.0",
					"port": 8003
				}
			],
			"routes": [
				{
					"req_path": "/",
					"type": "redirect",
					"http_status_code": 302,
					"redirect_url": "https://expserver.github.io"
				}
			]
		},
		{
			"listeners": [
				{
					"host": "0.0.0.0",
					"port": 8004
				}
			]
		}
	]
}
```

## Constraints to be followed
- All ports `8001`, `8002`, `8003`, `8004` listen to http requests
- The server should expect the all files to be shared from the `public/` directory
- The `public/` directory should be expected to be present within the same relative path to the executable as given within the documentation
- Adhere to the `xps_config.json` where applicable

## Tests
### Test 1: File server (1)
This tests verifies the server abides by the file serving config set by the custom xps_config file

```js
testInput: "Sends a request to the server requesting for a .jpg file"
expectedBehavior: "Server responds with a 200 status code and body containing data of mime-type image/jpg"
```

### Test 2: File server (2)
This tests verifies the server abides by the file serving config set by the custom xps_config file

```js
testInput: "Sends a request to the server requesting for a .pdf file"
expectedBehavior: "Server responds with a 200 status code and body containing data of mime-type application/pdf"
```

### Test 3: File server (3)
This tests verifies the server abides by the file serving config set by the custom xps_config file

```js
testInput: "Sends a request to the server requesting for a .txt file"
expectedBehavior: "Server responds with a 200 status code and body containing data of mime-type text/plain"
```

### Test 4: Redirect (1)
This test checks the server's redirect functionality

```js
testInput: "Client makes a request to the route http://localhost:8001/redirect"
expectedBehavior: "Client should receive a response of status 302 and redirect to http://localhost:8002/"
```

### Test 5: HTTP Proxy
This test checks the server's upstream functionality

```js
testInput: "Client makes a request to http://localhost:8002/cat.jpg"
expectedBehavior: "The response that the client receives should match what is received from http://localhost:3000/cat.jpg"
```
