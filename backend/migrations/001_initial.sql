-- Draft migration: trusted API access only until owner policies are implemented.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE profiles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), auth_subject text UNIQUE NOT NULL,
 handle text UNIQUE NOT NULL, display_name text NOT NULL,
 role text NOT NULL CHECK(role IN ('user','creator')), bio text NOT NULL DEFAULT ''
);
CREATE TABLE works (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), medium text NOT NULL CHECK(medium IN ('game','movie','tv')),
 title text NOT NULL, description text, poster_url text, provenance jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE external_ids (
 provider text NOT NULL, provider_id text NOT NULL, work_id uuid NOT NULL REFERENCES works(id),
 PRIMARY KEY(provider,provider_id)
);
CREATE TABLE work_edges (
 source uuid REFERENCES works(id), target uuid REFERENCES works(id), relation text NOT NULL,
 provenance jsonb NOT NULL, PRIMARY KEY(source,target,relation)
);
CREATE TABLE logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES profiles(id),
 work_id uuid NOT NULL REFERENCES works(id), status text NOT NULL CHECK(status IN ('planned','active','completed','dropped')),
 rating numeric CHECK(rating BETWEEN 0.5 AND 5 AND mod(rating,0.5)=0), note text,
 visibility text NOT NULL DEFAULT 'private' CHECK(visibility IN ('private','friends','public')),
 occurred_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE conversations(id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE conversation_members(conversation_id uuid REFERENCES conversations(id), user_id uuid REFERENCES profiles(id), PRIMARY KEY(conversation_id,user_id));
CREATE TABLE messages(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), conversation_id uuid NOT NULL REFERENCES conversations(id), sender_id uuid NOT NULL REFERENCES profiles(id), body text NOT NULL CHECK(length(body) BETWEEN 1 AND 4000), created_at timestamptz NOT NULL DEFAULT now());
-- Fail closed for direct client access. Service API must enforce ownership/membership.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_ids ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
COMMIT;
