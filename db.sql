CREATE TABLE "reset_codes" (
	"code"	TEXT NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"expires_at"	TEXT NOT NULL,
	PRIMARY KEY("code")
);
CREATE TABLE "tokens" (
	"token"	TEXT NOT NULL,
	"user_id"	INTEGER NOT NULL,
	"expires_at"	TEXT NOT NULL,
	PRIMARY KEY("token")
);
CREATE TABLE "users" (
	"id"	INTEGER,
	"email"	TEXT NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"type"	TEXT NOT NULL DEFAULT 'customer',
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE TABLE "tags" (
	"for_table"	TEXT NOT NULL,
	"for_id"	INTEGER NOT NULL,
	"key"	TEXT NOT NULL,
	"language"	TEXT NOT NULL DEFAULT 'en',
	"value"	TEXT NOT NULL,
	PRIMARY KEY("for_table","for_id","key","language")
);
CREATE INDEX "reset_codes-created_at" ON "reset_codes" (
	"expires_at"	DESC
);
CREATE INDEX "tokens-expires_at" ON "tokens" (
	"expires_at"	DESC
);
CREATE INDEX "users-created_at" ON "users" (
	"created_at"	DESC
);
CREATE INDEX "users-type" ON "users" (
	"type"	ASC
);
CREATE INDEX "tags-table_id_key_language" ON "tags" (
	"for_table"	ASC,
	"for_id"	DESC,
	"key"	ASC,
	"language"	ASC
);
CREATE INDEX "tags-table_id_language" ON "tags" (
	"for_table"	ASC,
	"for_id"	DESC,
	"language"	ASC
);
CREATE INDEX "tags-key_value" ON "tags" (
	"key"	ASC,
	"value"	ASC
);
CREATE TABLE "plugins" (
	"name"	TEXT NOT NULL,
	"active"	TEXT NOT NULL DEFAULT 'no',
	PRIMARY KEY("name")
);
CREATE INDEX "plugins-active" ON "plugins" (
	"active"	ASC
);
CREATE TABLE "currencies" (
	"code"	TEXT,
	"active"	TEXT DEFAULT 'no',
	PRIMARY KEY("code")
);
CREATE TABLE "prices" (
	"product_id"	INTEGER NOT NULL,
	"currency"	TEXT NOT NULL,
	"value"	REAL NOT NULL,
	PRIMARY KEY("product_id","currency")
);
CREATE TABLE "order_history" (
	"order_id"	INTEGER NOT NULL,
	"status"	TEXT NOT NULL,
	"note"	TEXT,
	"updated_at"	TEXT NOT NULL
);
CREATE INDEX "order_history-order_id_updated_at" ON "order_history" (
	"order_id"	ASC,
	"updated_at"	DESC
);
CREATE INDEX "order_history-status_updated_at" ON "order_history" (
	"status"	ASC,
	"updated_at"	DESC
);
CREATE INDEX "reset_codes-user_id" ON "reset_codes" (
	"user_id"	ASC
);
CREATE INDEX "tokens-user_id" ON "tokens" (
	"user_id"	ASC
);
CREATE INDEX "currencies-active" ON "currencies" (
	"active"	ASC
);
CREATE TABLE "tag_keys" (
	"for_table"	TEXT,
	"key"	TEXT,
	"active"	TEXT DEFAULT 'no',
	PRIMARY KEY("for_table","key")
);
CREATE INDEX "tag_keys-active" ON "tag_keys" (
	"active"	ASC
);
CREATE TABLE "products" (
	"id"	INTEGER,
	"stock"	REAL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE "order_items" (
	"order_id"	INTEGER,
	"product_id"	INTEGER,
	"quantity"	REAL NOT NULL,
	"unit_price"	REAL NOT NULL,
	PRIMARY KEY("order_id","product_id")
);
CREATE INDEX "order_items-order_id" ON "order_items" (
	"order_id"	ASC
);
CREATE INDEX "order_items-product_id" ON "order_items" (
	"product_id"	ASC
);
CREATE INDEX "order_items-quantity" ON "order_items" (
	"quantity"	ASC
);
CREATE TABLE "cart" (
	"user_id"	INTEGER,
	"product_id"	INTEGER,
	"quantity"	REAL NOT NULL DEFAULT 0,
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("user_id","product_id")
);
CREATE TABLE "order_flows" (
	"id"	INTEGER,
	"tree"	TEXT NOT NULL DEFAULT '{}',
	"active"	TEXT NOT NULL DEFAULT 'no',
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE INDEX "cart-created_at" ON "cart" (
	"created_at"	DESC
);
CREATE INDEX "order_flows-created_at" ON "order_flows" (
	"created_at"	DESC
);
CREATE TABLE "orders" (
	"id"	INTEGER,
	"flow_id"	INTEGER NOT NULL,
	"user_id"	INTEGER,
	"token"	TEXT,
	"currency"	TEXT NOT NULL,
	"status"	TEXT NOT NULL,
	"note"	TEXT,
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE INDEX "orders-currency" ON "orders" (
	"currency"	ASC
);
CREATE INDEX "orders-flow_id" ON "orders" (
	"flow_id"	ASC
);
CREATE INDEX "orders-status" ON "orders" (
	"status"	ASC
);
CREATE INDEX "orders-token" ON "orders" (
	"token"	ASC
);
CREATE INDEX "orders-user_id" ON "orders" (
	"user_id"	ASC
);
CREATE INDEX "orders-created_at" ON "orders" (
	"created_at"	DESC
);
