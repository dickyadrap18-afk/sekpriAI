-- Phase: Add ai_suggested_action column to messages
-- Stores the AI-suggested next action for the user (e.g., "Reply by Friday", "Schedule a meeting")
-- Ref: specs/005-ai-agent-spec.md §4, specs/006-provider-integration-spec.md §11

alter table messages
  add column if not exists ai_suggested_action text;

comment on column messages.ai_suggested_action is
  'AI-suggested next action for the user, extracted during AI processing pipeline.';
