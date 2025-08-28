-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('pending', 'ready', 'started', 'finished', 'cancelled');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "accepted" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "declined" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "maps" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" "MatchStatus" NOT NULL DEFAULT 'pending',
ADD COLUMN     "vetoed" TEXT[] DEFAULT ARRAY[]::TEXT[];
