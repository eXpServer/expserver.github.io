# eXpServer Tester Utility -- Frontend

## Prerequisites

- `node v18+`

## Directory Structure

```plaintext
eXpServer Frontend
├── public/
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── <route>/
│   │       ├── page.tsx
│   │       └── styles.module.css
│   ├── components/
│   │   └── <Component>/
│   │       ├── index.tsx
│   │       └── <component>.module.css
│   ├── fonts/
│   │   └── index.ts
│   ├── hooks/
│   ├── lib/
│   └── types.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Installation

- Clone the repo

```bash
git clone https://github.com/eXpServer/expserver-tester.git
```

- Navigate to the frontend directory:

```bash
cd frontend
```

- Install the dependencies:

```bash
npm install
```

- Create a `.env.local` file and add the following configuration to point to your backend services:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:6969
NEXT_PUBLIC_SOCKET_URL=http://localhost:6970
```

- Build and run the application:

```bash
npm run build
npm run start
```
