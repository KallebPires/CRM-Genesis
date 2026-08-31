-- CreateEnum
CREATE TYPE "ProposalStatus" AS ENUM ('DRAFT', 'GENERATING', 'AWAITING', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BlockState" AS ENUM ('EMPTY', 'GENERATING', 'READY');

-- CreateEnum
CREATE TYPE "MessageAuthor" AS ENUM ('AGENT', 'USER');

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "dealId" TEXT,
    "companyId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ProposalStatus" NOT NULL DEFAULT 'DRAFT',
    "value" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "views" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalBlock" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "content" TEXT,
    "state" "BlockState" NOT NULL DEFAULT 'EMPTY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProposalBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposalMessage" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "author" "MessageAuthor" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProposalMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Proposal_organizationId_status_idx" ON "Proposal"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_organizationId_slug_key" ON "Proposal"("organizationId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProposalBlock_proposalId_order_key" ON "ProposalBlock"("proposalId", "order");

-- CreateIndex
CREATE INDEX "ProposalMessage_proposalId_createdAt_idx" ON "ProposalMessage"("proposalId", "createdAt");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalBlock" ADD CONSTRAINT "ProposalBlock_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposalMessage" ADD CONSTRAINT "ProposalMessage_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
