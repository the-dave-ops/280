-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3),
    "last_name" VARCHAR(255),
    "first_name" VARCHAR(255),
    "id_number" VARCHAR(255),
    "is_passport" BOOLEAN NOT NULL DEFAULT false,
    "birth_date" TIMESTAMP(3),
    "street" VARCHAR(255),
    "house_number" VARCHAR(255),
    "entrance" VARCHAR(255),
    "apartment" INTEGER,
    "city" VARCHAR(255),
    "phone" VARCHAR(255),
    "mobile_1" VARCHAR(255),
    "mobile_2" VARCHAR(255),
    "health_fund" VARCHAR(255),
    "category" VARCHAR(255),
    "admission_date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "employee_id" INTEGER,
    "computer_id" INTEGER,
    "branch_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "id" SERIAL NOT NULL,
    "prescription_number" INTEGER,
    "customer_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "r" DOUBLE PRECISION,
    "l" DOUBLE PRECISION,
    "pd" DOUBLE PRECISION,
    "cyl_r" DOUBLE PRECISION,
    "ax_r" DOUBLE PRECISION,
    "cyl_l" DOUBLE PRECISION,
    "ax_l" DOUBLE PRECISION,
    "va_r" VARCHAR(50),
    "va_l" VARCHAR(50),
    "add" DOUBLE PRECISION,
    "index" VARCHAR(50),
    "color" VARCHAR(255),
    "color_percentage" DOUBLE PRECISION,
    "frame_name" VARCHAR(255),
    "frame_model" VARCHAR(255),
    "frame_color" VARCHAR(255),
    "frame_c" VARCHAR(50),
    "frame_width" VARCHAR(50),
    "frame_notes" TEXT,
    "health_fund" VARCHAR(255),
    "insurance_type" VARCHAR(255),
    "price" DOUBLE PRECISION DEFAULT 0,
    "discount_source" VARCHAR(255),
    "amount_to_pay" DOUBLE PRECISION DEFAULT 0,
    "paid" DOUBLE PRECISION DEFAULT 0,
    "balance" DOUBLE PRECISION DEFAULT 0,
    "receipt_number" VARCHAR(255),
    "campaign_280" BOOLEAN DEFAULT false,
    "optometrist_id" INTEGER,
    "branch_id" INTEGER,
    "source" VARCHAR(255),
    "notes" TEXT,
    "update_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "branches" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500),
    "phone" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "optometrists" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "license_number" VARCHAR(255),
    "phone" VARCHAR(255),
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "optometrists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "employee_id" VARCHAR(255),
    "phone" VARCHAR(255),
    "email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "picture" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "branch_id" INTEGER,
    "role" VARCHAR(50) NOT NULL DEFAULT 'employee',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" INTEGER,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_id_number_key" ON "customers"("id_number");

-- CreateIndex
CREATE INDEX "customers_id_number_idx" ON "customers"("id_number");

-- CreateIndex
CREATE INDEX "customers_last_name_first_name_idx" ON "customers"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_mobile_1_idx" ON "customers"("mobile_1");

-- CreateIndex
CREATE UNIQUE INDEX "prescriptions_prescription_number_key" ON "prescriptions"("prescription_number");

-- CreateIndex
CREATE INDEX "prescriptions_customer_id_idx" ON "prescriptions"("customer_id");

-- CreateIndex
CREATE INDEX "prescriptions_date_idx" ON "prescriptions"("date");

-- CreateIndex
CREATE INDEX "prescriptions_type_idx" ON "prescriptions"("type");

-- CreateIndex
CREATE INDEX "prescriptions_prescription_number_idx" ON "prescriptions"("prescription_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_id_key" ON "employees"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_branch_id_idx" ON "users"("branch_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_optometrist_id_fkey" FOREIGN KEY ("optometrist_id") REFERENCES "optometrists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_branch_id_fkey" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
