/*
  Warnings:

  - The values [ACTIVE,INACTIVE] on the enum `ServerStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ServerStatus_new" AS ENUM ('ONLINE', 'OFFLINE', 'UNKNOWN', 'MAINTENANCE');
ALTER TABLE "public"."servers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."servers" ALTER COLUMN "status" TYPE "public"."ServerStatus_new" USING ("status"::text::"public"."ServerStatus_new");
ALTER TYPE "public"."ServerStatus" RENAME TO "ServerStatus_old";
ALTER TYPE "public"."ServerStatus_new" RENAME TO "ServerStatus";
DROP TYPE "public"."ServerStatus_old";
ALTER TABLE "public"."servers" ALTER COLUMN "status" SET DEFAULT 'UNKNOWN';
COMMIT;

-- AlterTable
ALTER TABLE "public"."servers" ADD COLUMN     "lastSeen" TIMESTAMP(3),
ADD COLUMN     "port" INTEGER NOT NULL DEFAULT 22,
ALTER COLUMN "status" SET DEFAULT 'UNKNOWN';

-- CreateTable
CREATE TABLE "public"."metrics" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "type" "public"."MetricType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."alerts" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "type" "public"."AlertType" NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "currentValue" DOUBLE PRECISION,
    "status" "public"."AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."health_checks" (
    "id" TEXT NOT NULL,
    "serverId" TEXT NOT NULL,
    "status" "public"."HealthStatus" NOT NULL,
    "response" JSONB,
    "latency" INTEGER,
    "error" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "metrics_serverId_type_timestamp_idx" ON "public"."metrics"("serverId", "type", "timestamp");

-- CreateIndex
CREATE INDEX "health_checks_serverId_timestamp_idx" ON "public"."health_checks"("serverId", "timestamp");

-- AddForeignKey
ALTER TABLE "public"."metrics" ADD CONSTRAINT "metrics_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."alerts" ADD CONSTRAINT "alerts_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."health_checks" ADD CONSTRAINT "health_checks_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "public"."servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
