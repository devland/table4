CREATE TABLE "plugins" (
	"name"	TEXT NOT NULL,
	"active"	TEXT NOT NULL DEFAULT 'false',
	PRIMARY KEY("name")
);
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

CREATE TABLE "products" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL UNIQUE,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE INDEX "plugins-active" ON "plugins" (
	"active"	ASC
);
CREATE INDEX "reset_codes-created_at" ON "reset_codes" (
	"expires_at"	DESC
);
CREATE INDEX "reset_codes-user_id" ON "reset_codes" (
	"user_id"
);
CREATE INDEX "tokens-expires_at" ON "tokens" (
	"expires_at"	DESC
);
CREATE INDEX "tokens-user_id" ON "tokens" (
	"user_id"
);
CREATE TABLE "users" (
	"id"	INTEGER NOT NULL,
	"email"	TEXT NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"type"	TEXT NOT NULL DEFAULT 'customer',
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE INDEX "users-created_at" ON "users" (
	"created_at"	DESC
);
CREATE INDEX "users-type" ON "users" (
	"type"	ASC
);
CREATE TABLE "tags" (
	"for_table"	TEXT NOT NULL,
	"for_id"	INTEGER NOT NULL,
	"key"	TEXT NOT NULL,
	"value"	TEXT NOT NULL,
	"language"	TEXT NOT NULL DEFAULT 'en',
	"one_per"	TEXT NOT NULL DEFAULT 'false',
	PRIMARY KEY("for_table","for_id","key","language")
);
CREATE INDEX "tags-one_per" ON "tags" (
	"one_per"
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
CREATE INDEX "tags-value" ON "tags" (
	"value"	ASC
);
