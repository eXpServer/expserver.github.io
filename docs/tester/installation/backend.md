# eXpServer Tester Utility -- Backend

## Overview
The backend to the eXpServer Tester Utility consists of a dual interface `publisher-subscriber` architecture.
The interfaces include
- REST API to handle CRUD operations
- Websockets to handle real-time information passing throughout the life-cycle of a test that is being run.
The architecture focuses on an `availability-over-durability` model, where even if the server was to run into abrupt disconnections or errors, the server focuses on restoring the connection rather than avoiding such disconnections entirely

## Publisher Subscriber model

### What is the publisher subscriber model?
- A publisher-subsciber model consists of 2 components:-
    - `Publisher`: send messsages to a common channel of receivers
    - `Subscribers`: can choose to listen to a certain channel

- The publishers and subscribers operate independently and the subscriber can choose which channel they listen to.
- The publishers can send data to this common channel without blocking for the receivers to process them 

### Why was it chosen over other alternatives?
The server provides a certain level of state management which assumes a certain browsser client as a single user. This permits the user to run multiple tabs, each running different stages simultaneously, but also maintain a primitive level of persistent result storage. Each `StageRunner` that runs the tests for a stage acts as a publisher, while each client that is currently viewing the details about that stage acts as a subscriber. 

This allows multiple tabs opening the same stage test window to get streamed data of the same tests being run, and allows the browser client to freely choose which StageRunner to listen to.


## Availability over Durability model

### What is availabilty-over-durability model?
This design paradigm that has been chosen as a basis for the server, focuses not on how to ensure the server remains up as long as it can, but on what to do in case of an unexpected crash.

### Why was such a model chosen for this project?
In a server that involves running multiple containers and dealing with heavy loads, it is reasonable to assume that due to a variety of reasons including `network disruptions`, `resource overload`, etc that the server can crash. 

In such a volatile environment, focusing on how to create a server architecture that doesn't crash is not viable in the long run.

Instead, our architecture ensures that even if the server does crash, it will attempt to re-establish the broken connection and regain the state. Although, this might lead to any on-going requests to be lost.


## Directory structure
```plaintext
eXpServer Backend/
├── Dockerfile
├── package.json
├── prisma/
│   └── schema.prisma               ## Database schema
├── public/                         ## Statically served files
│   ├── description
│   └── large-files
├── src/
│   ├── api/
│   │   └── <api router>/
│   │       ├── controllers.ts      ## Handlers for each route      
│   │       └── routes.ts           ## Routes for the given api router
│   ├── constants.ts                ## Common constants
│   ├── core/
│   │   ├── ContainerManager.ts
│   │   ├── Core.ts
│   │   ├── ResrouceMonitor.ts
│   │   ├── StageRunner.ts
│   │   ├── StageWatcher.ts
│   │   ├── TerminalStream.ts
│   │   └── Timer.ts
│   ├── generate-description.ts
│   ├── index.ts                    ## Entry point
│   ├── middleware/
│   ├── tests/
│   │   ├── index.ts
│   │   └── stages/
│   │       ├── index.ts
│   │       ├── stage<num>.ts
│   ├── types.ts
│   ├── utils/
│   └── Dockerfile
├── README.md
├── release.md
├── tsconfig.json
├── uploads/
├── Dockerfile.prod
├── Dockerfile.dev
├── docker-compose.dev.yaml
└── docker-compose.prod.yaml
```


## Installation
- clone the repo 
```bash
git clone https://github.com/eXpServer/expserver-tester.git
```

- cd into frontend directory
```bash
cd frontend
```

- install the dependencies
    - [Docker installation](https://docs.docker.com/engine/install/)
    - [nvm installation](https://github.com/nvm-sh/nvm)

## Usage
- set environment variables as per `.env.example`
```bash
POSTGRES_USER=<username>
POSTGRES_PASSWORD=<password>
POSTGRES_DB=<database>
POSTGRES_HOST=postgresdb

DATABASE_URL=postgresql://<username>:<password>@postgresdb:5432/<database>

DEBUG=(true|false)
```

- build the container required to execute test cases
```bash
npm run docker-build
```

- build and execute the program
```bash
docker compose -f docker-compose.prod.yaml up -d --build # the --build can be omitted in subsequent runs
```

- (Alternative) compile and run executable
```bash
npm run compile # requires node v18
./compile/build-<linux / macos/ win.exe>
```

- (Run in development mode)
```bash
docker compose -f docker-compose.dev.yaml up -d --build # the --build can be omitted in subsequent runs
```

## Note for contributors
- The test description of each stage is auto-generated at build time when running the production build
- To re-generate description, if required, in a dev environement run the following
```bash
docker compose -f docker-compose.dev.yaml exec backend npm run generate-desc
```
