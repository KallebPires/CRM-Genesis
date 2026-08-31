import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// MongoDB não usa histórico de migrações: o schema é aplicado com
// `npm run db:push`. Por isso não há bloco `migrations` aqui.
export default defineConfig({
  schema: "prisma/schema.prisma",
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
