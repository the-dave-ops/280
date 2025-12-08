-- AlterTable
-- Add frame_sku column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='prescriptions' AND column_name='frame_sku') THEN
        ALTER TABLE "prescriptions" ADD COLUMN "frame_sku" VARCHAR(100);
    END IF;
END $$;

-- Add prescription_source column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='prescriptions' AND column_name='prescription_source') THEN
        ALTER TABLE "prescriptions" ADD COLUMN "prescription_source" VARCHAR(100);
    END IF;
END $$;
