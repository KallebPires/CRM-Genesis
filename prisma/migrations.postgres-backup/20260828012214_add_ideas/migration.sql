-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('BACKLOG', 'RESEARCHING', 'VALIDATING', 'BUILDING', 'LAUNCHED', 'DISCARDED');

-- CreateEnum
CREATE TYPE "EffortLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "referenceName" TEXT,
    "referenceUrl" TEXT,
    "category" "ServiceType" NOT NULL DEFAULT 'SAAS',
    "status" "IdeaStatus" NOT NULL DEFAULT 'BACKLOG',
    "potential" INTEGER NOT NULL DEFAULT 3,
    "effort" "EffortLevel" NOT NULL DEFAULT 'MEDIUM',
    "targetAudience" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Idea_organizationId_status_idx" ON "Idea"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
