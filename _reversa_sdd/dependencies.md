# Dependências do Projeto — Boleia Angola

## Frontend (package.json)

### Dependências Principais
```json
{
  "axios": "^1.x",            // HTTP client
  "dotenv": "^16.x",          // Environment variables
  "framer-motion": "^11.x",   // Animations
  "lucide-react": "^0.x",     // Icons
  "react": "^18.x",           // React core
  "react-dom": "^18.x",       // React DOM
  "react-router-dom": "^6.x"  // Routing
}
```

### Dev Dependencies
```json
{
  "@playwright/test": "^1.x",       // E2E testing
  "@tailwindcss/postcss": "^4.x",   // Tailwind PostCSS plugin
  "@testing-library/jest-dom": "^6.x", // Testing utilities
  "@testing-library/react": "^14.x",   // React testing
  "@types/node": "^20.x",           // TypeScript Node types
  "@types/react": "^18.x",          // TypeScript React types
  "@types/react-dom": "^18.x",      // TypeScript React-DOM types
  "@vitejs/plugin-react": "^4.x",   // Vite React plugin
  "autoprefixer": "^10.x",          // CSS autoprefixer
  "jsdom": "^24.x",                 // JSDOM for tests
  "playwright": "^1.x",             // E2E browser automation
  "postcss": "^8.x",                // CSS processor
  "tailwindcss": "^3.x",            // CSS framework
  "typescript": "^5.x",             // TypeScript
  "vite": "^6.x",                   // Build tool
  "vitest": "^2.x"                  // Unit testing
}
```

## Backend (server/package.json)

### Dependências Principais
```json
{
  "bcryptjs": "^2.x",              // Password hashing
  "cors": "^2.x",                  // CORS handling
  "dotenv": "^16.x",               // Environment variables
  "express": "^4.x",               // Web framework
  "express-rate-limit": "^7.x",    // Rate limiting
  "helmet": "^7.x",                // Security headers
  "jsonwebtoken": "^9.x",          // JWT authentication
  "morgan": "^1.x",                // HTTP logging
  "multer": "^1.x",                // File uploads
  "pg": "^8.x"                     // PostgreSQL client
}
```

### Dev Dependencies
```json
{
  "jest": "^29.x",         // Testing framework
  "nodemon": "^3.x",       // Auto-reload dev
  "supertest": "^6.x"      // HTTP assertion
}
```

## Infraestrutura

### Serviços Externos
- **PostgreSQL** — Banco de dados (local ou cloud)
- **Nginx** — Reverse proxy e SSL
- **PM2** — Process manager para Node.js

### Não identificado
- APIs de pagamento
- Serviços de email externos
- CDN de arquivos
- Serviços de SMS

## Versões Críticas

- **Node.js:** 18.x+ (recomendado)
- **PostgreSQL:** 14.x+ (recomendado)
- **npm:** 9.x+

## Observações

-Todas as dependências estão nas versões mais recentes (`^x.x`)
- Não há dependências de terceiros críticas além dos frameworks principais
- Testes cobrem unitário (Vitest/Jest) e E2E (Playwright)