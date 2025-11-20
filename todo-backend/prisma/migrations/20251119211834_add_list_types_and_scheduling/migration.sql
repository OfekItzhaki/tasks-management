-- CreateEnum
CREATE TYPE "ListType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "reminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "specificDayOfWeek" INTEGER;

-- AlterTable
ALTER TABLE "ToDoList" ADD COLUMN     "type" "ListType" NOT NULL DEFAULT 'CUSTOM';
