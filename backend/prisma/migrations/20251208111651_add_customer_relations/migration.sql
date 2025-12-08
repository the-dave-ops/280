-- CreateTable: Customer Relations (Many-to-Many Self-Relation)
CREATE TABLE "_CustomerRelations" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_CustomerRelations_AB_unique" ON "_CustomerRelations"("A", "B");

-- CreateIndex
CREATE INDEX "_CustomerRelations_B_index" ON "_CustomerRelations"("B");

-- AddForeignKey
ALTER TABLE "_CustomerRelations" ADD CONSTRAINT "_CustomerRelations_A_fkey" FOREIGN KEY ("A") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomerRelations" ADD CONSTRAINT "_CustomerRelations_B_fkey" FOREIGN KEY ("B") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
