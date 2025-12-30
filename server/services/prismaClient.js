const { PrismaClient } = require('@prisma/client');
// Use pooled connection URL if available, otherwise fall back to direct connection
// Cloudflare Workers or connection poolers (like PgBouncer) provide the pool URL
const databaseUrl = process.env.DATABASE_POOL_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or DATABASE_POOL_URL environment variable is required');
}

// Configure Prisma Client with connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  // Connection pool configuration for better performance
  // Note: If using an external pooler (like PgBouncer or Cloudflare), 
  // these settings may be handled by the pooler itself
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown - disconnect from database on process exit
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Handle uncaught errors
process.on('unhandledRejection', async (error) => {
  console.error('Unhandled rejection:', error);
  await prisma.$disconnect();
  process.exit(1);
});

module.exports = prisma;
