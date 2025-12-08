-- AlterTable
ALTER TABLE "prescriptions" 
  -- Add new PRISM fields
  ADD COLUMN "prism_r" DOUBLE PRECISION,
  ADD COLUMN "prism_l" DOUBLE PRECISION,
  
  -- Add IN/OUT direction fields
  ADD COLUMN "in_out_r" VARCHAR(10),
  ADD COLUMN "in_out_l" VARCHAR(10),
  
  -- Add UP/DOWN direction fields
  ADD COLUMN "up_down_r" VARCHAR(10),
  ADD COLUMN "up_down_l" VARCHAR(10),
  
  -- Add separate PD fields (rename existing pd to pd_total temporarily)
  ADD COLUMN "pd_r" DOUBLE PRECISION,
  ADD COLUMN "pd_l" DOUBLE PRECISION,
  ADD COLUMN "pd_total" DOUBLE PRECISION,
  
  -- Add height fields
  ADD COLUMN "height_r" DOUBLE PRECISION,
  ADD COLUMN "height_l" DOUBLE PRECISION,
  
  -- Add frame bridge field
  ADD COLUMN "frame_bridge" VARCHAR(50),
  
  -- Drop the old frameC column (duplicate of frameColor)
  DROP COLUMN IF EXISTS "frame_c";

-- Migrate existing pd values to pd_total
UPDATE "prescriptions" SET "pd_total" = "pd" WHERE "pd" IS NOT NULL;

-- Drop the old pd column
ALTER TABLE "prescriptions" DROP COLUMN IF EXISTS "pd";

-- Update index column to have default value
ALTER TABLE "prescriptions" ALTER COLUMN "index" SET DEFAULT '1.56';
