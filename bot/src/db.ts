// Le bot réutilise directement le client Prisma du site web (même base, même
// instance singleton). Node résout `@prisma/client` depuis web/node_modules car
// la résolution se fait relativement au fichier importé.
export { db } from "../../web/src/lib/db";
