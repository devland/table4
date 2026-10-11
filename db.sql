CREATE TABLE "tokens" (
	"token"	TEXT NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"expires_at"	TEXT NOT NULL,
	PRIMARY KEY("token")
);
CREATE TABLE "prices" (
	"product_id"	INTEGER NOT NULL,
	"currency"	TEXT NOT NULL,
	"value"	REAL NOT NULL,
	PRIMARY KEY("product_id","currency")
);
CREATE TABLE "reset_codes" (
	"code"	TEXT NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"type"	TEXT NOT NULL,
	"data"	TEXT,
	"expires_at"	TEXT NOT NULL,
	PRIMARY KEY("code","type")
);
CREATE TABLE "currencies" (
	"code"	TEXT NOT NULL,
	"active"	TEXT NOT NULL DEFAULT 'no',
	PRIMARY KEY("code")
);
CREATE TABLE "order_items" (
	"order_id"	INTEGER NOT NULL,
	"product_id"	INTEGER NOT NULL,
	"parent_id"	INTEGER,
	"quantity"	REAL NOT NULL,
	"unit_price"	REAL NOT NULL,
	"action"	TEXT NOT NULL DEFAULT 'add',
	PRIMARY KEY("order_id","product_id")
);
CREATE TABLE "product_flags" (
	"id"	INTEGER NOT NULL,
	"product_id"	INTEGER NOT NULL,
	"key"	TEXT NOT NULL,
	"value"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE "products" (
	"id"	INTEGER NOT NULL,
	"stock"	REAL NOT NULL DEFAULT -1,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE "tag_keys" (
	"for_table"	TEXT NOT NULL,
	"key"	TEXT NOT NULL,
	"active"	TEXT NOT NULL DEFAULT 'no',
	PRIMARY KEY("for_table","key")
);
CREATE TABLE "tags" (
	"id"	INTEGER NOT NULL,
	"for_table"	TEXT NOT NULL,
	"for_id"	INTEGER NOT NULL,
	"key"	TEXT NOT NULL,
	"language"	TEXT NOT NULL DEFAULT 'en',
	"value"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE "cart_items" (
	"uuid"	TEXT NOT NULL,
	"product_id"	INTEGER NOT NULL,
	"parent_id"	INTEGER,
	"quantity"	REAL NOT NULL DEFAULT 0,
	"action"	TEXT NOT NULL DEFAULT 'add',
	PRIMARY KEY("uuid","product_id")
);
CREATE TABLE "carts" (
	"uuid"	TEXT NOT NULL,
	"key"	TEXT NOT NULL,
	"currency"	TEXT NOT NULL,
	"updated_at"	TEXT NOT NULL,
	PRIMARY KEY("uuid")
);
CREATE TABLE "orders" (
	"id"	INTEGER NOT NULL,
	"flow"	TEXT NOT NULL,
	"user_id"	INTEGER,
	"uuid"	TEXT UNIQUE,
	"currency"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	"notes"	TEXT,
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE INDEX "tokens-expires_at" ON "tokens" (
	"expires_at"	DESC
);
CREATE INDEX "tokens-user_id" ON "tokens" (
	"user_id"	ASC
);
CREATE INDEX "reset_codes-created_at" ON "reset_codes" (
	"expires_at"	DESC
);
CREATE INDEX "reset_codes-user_id" ON "reset_codes" (
	"user_id"	ASC
);
CREATE INDEX "currencies-active" ON "currencies" (
	"active"	ASC
);
CREATE INDEX "order_items-action" ON "order_items" (
	"action"	ASC
);
CREATE INDEX "order_items-order_id" ON "order_items" (
	"order_id"	ASC
);
CREATE INDEX "order_items-parent_id" ON "order_items" (
	"parent_id"	ASC
);
CREATE INDEX "order_items-product_id" ON "order_items" (
	"product_id"	ASC
);
CREATE INDEX "order_items-quantity" ON "order_items" (
	"quantity"	ASC
);
CREATE INDEX "product_flags-key_value" ON "product_flags" (
	"key"	ASC,
	"value"	ASC
);
CREATE INDEX "product_flags-product_id" ON "product_flags" (
	"product_id"	ASC
);
CREATE INDEX "tag_keys-active" ON "tag_keys" (
	"active"	ASC
);
CREATE INDEX "tags-key_value" ON "tags" (
	"key"	ASC,
	"value"	ASC
);
CREATE INDEX "tags-table_id_key_language" ON "tags" (
	"for_table"	ASC,
	"for_id"	ASC,
	"key"	ASC,
	"language"	ASC
);
CREATE INDEX "tags-table_id_language" ON "tags" (
	"for_table"	ASC,
	"for_id"	ASC,
	"language"	ASC
);
CREATE INDEX "carts-updated_at" ON "carts" (
	"updated_at"	DESC
);
CREATE INDEX "orders-created_at" ON "orders" (
	"created_at"	DESC
);
CREATE INDEX "orders-currency" ON "orders" (
	"currency"	ASC
);
CREATE INDEX "orders-status" ON "orders" (
	"status"	ASC
);
CREATE INDEX "orders-user_id" ON "orders" (
	"user_id"	ASC
);
CREATE INDEX "orders-flow" ON "orders" (
	"flow"	ASC
);
CREATE TABLE "users" (
	"id"	INTEGER NOT NULL,
	"email"	TEXT NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"type"	TEXT NOT NULL,
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE INDEX "users-created_at" ON "users" (
	"created_at"	DESC
);
CREATE INDEX "users-email" ON "users" (
	"email"	ASC
);
CREATE INDEX "users-type" ON "users" (
	"type"	ASC
);
CREATE TABLE "order_history" (
	"id"	INTEGER NOT NULL,
	"order_id"	INTEGER NOT NULL,
	"author_id"	INTEGER,
	"status"	TEXT NOT NULL,
	"notes"	TEXT,
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id")
);
CREATE INDEX "order_history-order_id_created_at" ON "order_history" (
	"order_id"	ASC,
	"created_at"	DESC
);
CREATE INDEX "order_history-status_created_at" ON "order_history" (
	"status"	ASC,
	"created_at"	DESC
);
CREATE INDEX "order_history-author_id" ON "order_history" (
	"author_id"	ASC
);
