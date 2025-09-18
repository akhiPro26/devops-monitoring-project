/*
  Warnings:

  - The values [ACTIVE,INACTIVE] on the enum `ServerStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."MetricType" AS ENUM ('CPU_USAGE', 'MEMORY_USAGE', 'DISK_USAGE', 'NETWORK_IN', 'NETWORK_OUT', 'LOAD_AVERAGE', 'UPTIME');

-- CreateEnum
CREATE TYPE "public"."AlertType" AS ENUM ('HIGH_CPU', 'HIGH_MEMORY', 'HIGH_DISK', 'SERVER_DOWN', 'HIGH_LOAD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "public"."AlertStatus" AS ENUM ('ACTIVE', 'RESOLVED', 'ACKNOWLEDGED');

-- CreateEnum
CREATE TYPE "public"."HealthStatus" AS ENUM ('HEALTHY', 'UNHEALTHY', 'TIMEOUT', 'ERROR');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ServerStatus_new" AS ENUM ('ONLINE', 'OFFLINE', 'UNKNOWN', 'MAINTENANCE');
ALTER TABLE "public"."servers" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."servers" ALTER COLUMN "status" TYPE "public"."ServerStatus_new" USING ("status"::text::"public"."ServerStatus_new");
ALTER TYPE "public"."ServerStatus" RENAME TO "ServerStatus_old";
ALTER TYPE "public"."ServerStatus_new" RENAME TO "ServerStatus";
DROP TYPE "public"."ServerStatus_old";
ALTER TABLE "public"."servers" ALTER COLUMN "status" SET DEFAULT 'ONLINE';
COMMIT;

-- AlterTable
ALTER TABLE "public"."servers" ALTER COLUMN "status" SET DEFAULT 'ONLINE';

-- CreateTable
CREATE TABLE "public"."alert_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metricType" "public"."MetricType" NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "severity" "public"."AlertSeverity" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_rules_pkey" PRIMARY KEY ("id")
);
