CREATE TABLE "tokens" (
	"token"	TEXT NOT NULL UNIQUE,
	"user_id"	INTEGER NOT NULL,
	"expires_at"	TEXT NOT NULL,
	PRIMARY KEY("token")
);
CREATE TABLE "users" (
	"id"	INTEGER NOT NULL UNIQUE,
	"email"	INTEGER NOT NULL UNIQUE,
	"password"	TEXT NOT NULL,
	"type"	TEXT NOT NULL DEFAULT 'client',
	"created_at"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);

CREATE INDEX "tokens_token" ON "tokens" (
	"token"
);
CREATE INDEX "tokens_user_id" ON "tokens" (
	"user_id"
);
CREATE INDEX "tokens_expires_at" ON "tokens" (
	"expires_at"	DESC
);
CREATE INDEX "users_created_at" ON "users" (
	"created_at"	DESC
);
CREATE INDEX "users_email" ON "users" (
	"email"	ASC
);
CREATE INDEX "users_type" ON "users" (
	"type"	ASC
);
