CREATE TABLE "usage" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"feature" varchar(50) NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"period" varchar(7) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_cache" DROP CONSTRAINT "ai_cache_question_hash_unique";--> statement-breakpoint
ALTER TABLE "principles" DROP CONSTRAINT "principles_number_unique";--> statement-breakpoint
ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_telegram_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_telegram_id_unique";--> statement-breakpoint
ALTER TABLE "ai_insights" DROP CONSTRAINT "ai_insights_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_requests" DROP CONSTRAINT "ai_requests_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "daily_stats" DROP CONSTRAINT "daily_stats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "journal_entries" DROP CONSTRAINT "journal_entries_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "journal_entries" DROP CONSTRAINT "journal_entries_principle_id_principles_id_fk";
--> statement-breakpoint
ALTER TABLE "principle_history" DROP CONSTRAINT "principle_history_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "achievements" DROP CONSTRAINT "achievements_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_principles" DROP CONSTRAINT "user_principles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_principles" DROP CONSTRAINT "user_principles_principle_id_principles_id_fk";
--> statement-breakpoint
ALTER TABLE "user_sessions" DROP CONSTRAINT "user_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_stats" DROP CONSTRAINT "user_stats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "reminder_schedules" DROP CONSTRAINT "reminder_schedules_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "weekly_stats" DROP CONSTRAINT "weekly_stats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "push_subscriptions" DROP CONSTRAINT "push_subscriptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "ai_insights" ALTER COLUMN "created_date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "ai_insights" ALTER COLUMN "created_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_insights" ALTER COLUMN "interactions" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_cache" ALTER COLUMN "language" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_cache" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_requests" ALTER COLUMN "tokens_used" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_requests" ALTER COLUMN "tokens_used" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_requests" ALTER COLUMN "cost" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_requests" ALTER COLUMN "cost" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_requests" ALTER COLUMN "model" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ai_requests" ALTER COLUMN "model" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_requests" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "daily_stats" ALTER COLUMN "date" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "daily_stats" ALTER COLUMN "entries_count" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "daily_stats" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "is_completed" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "is_skipped" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "source" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "source" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "journal_entries" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "principles" ALTER COLUMN "reflections" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "unlocked_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "achievements" ALTER COLUMN "notified" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_principles" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_principles" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_sessions" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "streak_days" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "longest_streak" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "total_entries" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "current_cycle" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "weekly_goal" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "monthly_goal" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "average_mood" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "average_energy" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "total_reflection_time" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "principle_completions" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user_stats" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ALTER COLUMN "enabled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "weekly_stats" ALTER COLUMN "week_start" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "weekly_stats" ALTER COLUMN "week_end" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "weekly_stats" ALTER COLUMN "goal_completion" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "weekly_stats" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "current_principle" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "timezone_offset" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "notification_type" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "language" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "is_active" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "reminder_mode" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "daily_principles_count" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "timezone" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "reminders_enabled" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "has_completed_onboarding" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "subscription" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "preferred_language" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "plan" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "currency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "started_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "started_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "expires_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "principles_completed" integer;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "average_mood_score" numeric;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "average_energy_level" numeric;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "streak_day" integer;--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "goal_completion" numeric;--> statement-breakpoint
ALTER TABLE "principle_history" ADD COLUMN "action" text NOT NULL;--> statement-breakpoint
ALTER TABLE "principle_history" ADD COLUMN "created_at" timestamp;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "user_principles" ADD COLUMN "status" text;--> statement-breakpoint
ALTER TABLE "user_principles" ADD COLUMN "completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD COLUMN "session_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_stats" ADD COLUMN "current_streak" integer;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD COLUMN "principle_number" integer;--> statement-breakpoint
ALTER TABLE "reminder_schedules" ADD COLUMN "custom_message" text;--> statement-breakpoint
ALTER TABLE "weekly_stats" ADD COLUMN "entries_count" integer;--> statement-breakpoint
ALTER TABLE "weekly_stats" ADD COLUMN "principles_completed" integer;--> statement-breakpoint
ALTER TABLE "weekly_stats" ADD COLUMN "average_mood_score" numeric;--> statement-breakpoint
ALTER TABLE "weekly_stats" ADD COLUMN "average_energy_level" numeric;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_picture" text;--> statement-breakpoint
ALTER TABLE "daily_stats" DROP COLUMN "average_mood";--> statement-breakpoint
ALTER TABLE "daily_stats" DROP COLUMN "average_energy";--> statement-breakpoint
ALTER TABLE "daily_stats" DROP COLUMN "principles_worked";--> statement-breakpoint
ALTER TABLE "daily_stats" DROP COLUMN "reflection_time";--> statement-breakpoint
ALTER TABLE "principle_history" DROP COLUMN "assigned_at";--> statement-breakpoint
ALTER TABLE "principle_history" DROP COLUMN "completed";--> statement-breakpoint
ALTER TABLE "user_principles" DROP COLUMN "date";--> statement-breakpoint
ALTER TABLE "user_principles" DROP COLUMN "principle_order";--> statement-breakpoint
ALTER TABLE "user_principles" DROP COLUMN "reminder_time";--> statement-breakpoint
ALTER TABLE "user_principles" DROP COLUMN "completed";--> statement-breakpoint
ALTER TABLE "user_sessions" DROP COLUMN "telegram_id";--> statement-breakpoint
ALTER TABLE "user_sessions" DROP COLUMN "current_principle_context";--> statement-breakpoint
ALTER TABLE "weekly_stats" DROP COLUMN "total_entries";--> statement-breakpoint
ALTER TABLE "weekly_stats" DROP COLUMN "average_mood";--> statement-breakpoint
ALTER TABLE "weekly_stats" DROP COLUMN "average_energy";--> statement-breakpoint
ALTER TABLE "weekly_stats" DROP COLUMN "principles_progress";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");