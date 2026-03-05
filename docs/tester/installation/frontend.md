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
- clone the repo 
```bash
git clone https://github.com/eXpServer/expserver-tester.git
```

- cd into frontend directory
```bash
cd frontend
```

- install the dependencies
```bash
npm install
```

- build and execute the program
```bash
npm run build
npm run start
```