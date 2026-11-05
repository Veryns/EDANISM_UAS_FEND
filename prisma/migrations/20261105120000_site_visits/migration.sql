-- CreateTable
CREATE TABLE "site_visits" (
    "id" SERIAL NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "user_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_visits_day_idx" ON "site_visits"("day");

-- CreateIndex
CREATE UNIQUE INDEX "site_visits_visitor_id_day_key" ON "site_visits"("visitor_id", "day");
