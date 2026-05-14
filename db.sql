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
CREATE TABLE "users" (
	"id"	INTEGER NOT NULL,
	"email"	INTEGER NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"type"	TEXT NOT NULL DEFAULT 'customer',
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE INDEX "reset_codes_created_at" ON "reset_codes" (
	"expires_at"	DESC
);
CREATE INDEX "reset_codes_user_id" ON "reset_codes" (
	"user_id"
);
CREATE INDEX "tokens_expires_at" ON "tokens" (
	"expires_at"	DESC
);
CREATE INDEX "tokens_user_id" ON "tokens" (
	"user_id"
);
CREATE INDEX "users_created_at" ON "users" (
	"created_at"	DESC
);
CREATE INDEX "users_type" ON "users" (
	"type"	ASC
);
CREATE INDEX "plugins_active" ON "plugins" (
	"active"	ASC
);
