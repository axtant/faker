-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "steam_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "profile_url" TEXT NOT NULL,
    "real_name" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "friends_list_access" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friends" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "steam_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "profile_url" TEXT NOT NULL,
    "friend_since" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match_queue" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MatchPlayers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "users_steam_id_key" ON "users"("steam_id");

-- CreateIndex
CREATE UNIQUE INDEX "friends_user_id_steam_id_key" ON "friends"("user_id", "steam_id");

-- CreateIndex
CREATE UNIQUE INDEX "match_queue_userId_key" ON "match_queue"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_MatchPlayers_AB_unique" ON "_MatchPlayers"("A", "B");

-- CreateIndex
CREATE INDEX "_MatchPlayers_B_index" ON "_MatchPlayers"("B");

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_queue" ADD CONSTRAINT "match_queue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MatchPlayers" ADD CONSTRAINT "_MatchPlayers_A_fkey" FOREIGN KEY ("A") REFERENCES "matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MatchPlayers" ADD CONSTRAINT "_MatchPlayers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
