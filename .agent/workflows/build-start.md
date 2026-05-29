---
description: Build and start for production
---
Run the following commands to build the application and start the production server:

// turbo
1. Start database
```bash
docker compose up -d mariadb
```

// turbo
2. Build the application
```bash
npm run build
```

// turbo
2. Start the server
```bash
npm start
```
