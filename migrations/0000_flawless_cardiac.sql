-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "ai_insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"principle_id" integer NOT NULL,
	"insight_text" text NOT NULL,
	"created_date" date DEFAULT now(),
	"interactions" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "ai_cache" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_hash" text NOT NULL,
	"response" text NOT NULL,
	"language" text DEFAULT 'uk',
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "ai_cache_question_hash_unique" UNIQUE("question_hash")
);
--> statement-breakpoint
CREATE TABLE "ai_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"tokens_used" integer DEFAULT 0 NOT NULL,
	"cost" numeric(10, 4) DEFAULT '0' NOT NULL,
	"model" text DEFAULT 'gpt-4o' NOT NULL,
	"prompt" text,
	"response" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"date" date NOT NULL,
	"entries_count" integer DEFAULT 0,
	"average_mood" real,
	"average_energy" real,
	"principles_worked" jsonb,
	"reflection_time" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "journal_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"principle_id" integer NOT NULL,
	"content" text NOT NULL,
	"mood" varchar,
	"energy_level" integer,
	"is_completed" boolean DEFAULT false,
	"is_skipped" boolean DEFAULT false,
	"source" varchar(50) DEFAULT 'web',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "principles" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"url" text,
	"reflections" jsonb,
	"practical_steps" jsonb,
	CONSTRAINT "principles_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "principle_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"principle_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now(),
	"completed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"unlocked_at" timestamp DEFAULT now(),
	"notified" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_principles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"principle_id" integer NOT NULL,
	"date" text NOT NULL,
	"principle_order" integer DEFAULT 1,
	"reminder_time" text,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"telegram_id" varchar(255),
	"current_principle_context" integer,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_sessions_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"streak_days" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"total_entries" integer DEFAULT 0,
	"current_cycle" integer DEFAULT 1,
	"last_entry_date" timestamp,
	"principle_progress" jsonb,
	"weekly_goal" integer DEFAULT 7,
	"monthly_goal" integer DEFAULT 30,
	"average_mood" real,
	"average_energy" real,
	"total_reflection_time" integer DEFAULT 0,
	"principle_completions" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reminder_schedules" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"time" text NOT NULL,
	"type" text NOT NULL,
	"enabled" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "weekly_stats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"week_start" date NOT NULL,
	"week_end" date NOT NULL,
	"total_entries" integer DEFAULT 0,
	"average_mood" real,
	"average_energy" real,
	"principles_progress" jsonb,
	"goal_completion" real,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"telegram_id" varchar,
	"telegram_chat_id" varchar,
	"first_name" text NOT NULL,
	"last_name" text,
	"username" text,
	"current_principle" integer DEFAULT 1,
	"timezone_offset" integer DEFAULT 0,
	"notification_type" varchar DEFAULT 'daily',
	"custom_times" jsonb,
	"language" varchar DEFAULT 'uk',
	"is_active" boolean DEFAULT true,
	"reminder_mode" text DEFAULT 'balanced',
	"daily_principles_count" integer DEFAULT 2,
	"timezone" text DEFAULT 'Europe/Kiev',
	"reminders_enabled" boolean DEFAULT true,
	"last_reminder_sent" timestamp,
	"has_completed_onboarding" boolean DEFAULT false,
	"subscription" text DEFAULT 'none',
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"preferred_language" text DEFAULT 'uk',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"avatar_url" text,
	CONSTRAINT "users_telegram_id_unique" UNIQUE("telegram_id")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan" text DEFAULT 'trial' NOT NULL,
	"billing_period" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"payment_order_id" text,
	"amount" numeric(10, 2),
	"currency" text DEFAULT 'EUR',
	"created_at" timestamp DEFAULT now(),
	"started_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_requests" ADD CONSTRAINT "ai_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_principle_id_principles_id_fk" FOREIGN KEY ("principle_id") REFERENCES "public"."principles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "principle_history" ADD CONSTRAINT "principle_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_principles" ADD CONSTRAINT "user_principles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_principles" ADD CONSTRAINT "user_principles_principle_id_principles_id_fk" FOREIGN KEY ("principle_id") REFERENCES "public"."principles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD CONSTRAINT "reminder_schedules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_stats" ADD CONSTRAINT "weekly_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
*/