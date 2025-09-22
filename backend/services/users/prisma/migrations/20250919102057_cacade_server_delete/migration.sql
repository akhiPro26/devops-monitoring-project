-- DropForeignKey
ALTER TABLE "public"."server_access" DROP CONSTRAINT "server_access_serverId_fkey";

-- AddForeignKey
ALTER TABLE "public"."server_access" ADD CONSTRAINT "server_access_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
