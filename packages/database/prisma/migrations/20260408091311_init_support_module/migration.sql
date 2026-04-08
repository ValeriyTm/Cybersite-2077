-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('TECHNICAL', 'ORDER', 'COOPERATION', 'COMPLAINT', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "lastName" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "category" "TicketCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_attachments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "size" INTEGER,

    CONSTRAINT "support_attachments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
