// Client Prisma partagé avec le site web (même base Postgres).
// Le client est généré depuis ../web/prisma/schema.prisma (cf. npm run prisma:generate).
import { PrismaClient } from "@prisma/client";

export const db = new PrismaClient();
