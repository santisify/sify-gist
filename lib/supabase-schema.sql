-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.access_tokens (
                                      id integer NOT NULL DEFAULT nextval('access_tokens_id_seq'::regclass),
                                      name text NOT NULL,
                                      token_hash text NOT NULL UNIQUE,
                                      user_id text NOT NULL,
                                      scope_gist integer DEFAULT 0,
                                      created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                      expires_at timestamp without time zone,
                                      last_used_at timestamp without time zone,
                                      CONSTRAINT access_tokens_pkey PRIMARY KEY (id),
                                      CONSTRAINT access_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.gist_file_versions (
                                           id integer NOT NULL DEFAULT nextval('gist_file_versions_id_seq'::regclass),
                                           gist_version_id integer NOT NULL,
                                           filename text NOT NULL,
                                           content text NOT NULL,
                                           language text NOT NULL,
                                           CONSTRAINT gist_file_versions_pkey PRIMARY KEY (id),
                                           CONSTRAINT gist_file_versions_gist_version_id_fkey FOREIGN KEY (gist_version_id) REFERENCES public.gist_versions(id)
);
CREATE TABLE public.gist_files (
                                   id integer NOT NULL DEFAULT nextval('gist_files_id_seq'::regclass),
                                   gist_id text NOT NULL,
                                   filename text NOT NULL,
                                   content text NOT NULL,
                                   language text DEFAULT 'text'::text,
                                   CONSTRAINT gist_files_pkey PRIMARY KEY (id),
                                   CONSTRAINT gist_files_gist_id_fkey FOREIGN KEY (gist_id) REFERENCES public.gists(id)
);
CREATE TABLE public.gist_init_queue (
                                        id integer NOT NULL DEFAULT nextval('gist_init_queue_id_seq'::regclass),
                                        gist_id text NOT NULL,
                                        created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                        CONSTRAINT gist_init_queue_pkey PRIMARY KEY (id),
                                        CONSTRAINT gist_init_queue_gist_id_fkey FOREIGN KEY (gist_id) REFERENCES public.gists(id)
);
CREATE TABLE public.gist_languages (
                                       gist_id text NOT NULL,
                                       language text NOT NULL,
                                       CONSTRAINT gist_languages_pkey PRIMARY KEY (gist_id, language),
                                       CONSTRAINT gist_languages_gist_id_fkey FOREIGN KEY (gist_id) REFERENCES public.gists(id)
);
CREATE TABLE public.gist_topics (
                                    gist_id text NOT NULL,
                                    topic text NOT NULL,
                                    CONSTRAINT gist_topics_pkey PRIMARY KEY (gist_id, topic),
                                    CONSTRAINT gist_topics_gist_id_fkey FOREIGN KEY (gist_id) REFERENCES public.gists(id)
);
CREATE TABLE public.gist_version_diffs (
                                           id integer NOT NULL DEFAULT nextval('gist_version_diffs_id_seq'::regclass),
                                           gist_id text NOT NULL,
                                           from_version integer NOT NULL,
                                           to_version integer NOT NULL,
                                           diff_content text,
                                           created_at timestamp with time zone DEFAULT now(),
                                           CONSTRAINT gist_version_diffs_pkey PRIMARY KEY (id),
                                           CONSTRAINT gist_version_diffs_gist_id_fkey FOREIGN KEY (gist_id) REFERENCES public.gists(id)
);
CREATE TABLE public.gist_versions (
                                      id integer NOT NULL DEFAULT nextval('gist_versions_id_seq'::regclass),
                                      gist_id text NOT NULL,
                                      version_number integer NOT NULL,
                                      created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                      comment text,
                                      commit_message text,
                                      CONSTRAINT gist_versions_pkey PRIMARY KEY (id),
                                      CONSTRAINT gist_versions_gist_id_fkey FOREIGN KEY (gist_id) REFERENCES public.gists(id)
);
CREATE TABLE public.gists (
                              id text NOT NULL,
                              uuid text NOT NULL UNIQUE,
                              user_id text,
                              title text,
                              description text,
                              url text,
                              url_normalized text,
                              preview text,
                              preview_filename text,
                              preview_mime_type text,
                              visibility integer DEFAULT 0,
                              forked_id text,
                              nb_files integer DEFAULT 0,
                              nb_likes integer DEFAULT 0,
                              nb_forks integer DEFAULT 0,
                              created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                              updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                              CONSTRAINT gists_pkey PRIMARY KEY (id),
                              CONSTRAINT gists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
                              CONSTRAINT gists_forked_id_fkey FOREIGN KEY (forked_id) REFERENCES public.gists(id)
);
CREATE TABLE public.likes (
                              user_id text NOT NULL,
                              gist_id text NOT NULL,
                              created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                              CONSTRAINT likes_pkey PRIMARY KEY (user_id, gist_id),
                              CONSTRAINT likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
                              CONSTRAINT likes_gist_id_fkey FOREIGN KEY (gist_id) REFERENCES public.gists(id)
);
CREATE TABLE public.ssh_keys (
                                 id integer NOT NULL DEFAULT nextval('ssh_keys_id_seq'::regclass),
                                 title text NOT NULL,
                                 content text NOT NULL UNIQUE,
                                 sha text NOT NULL,
                                 user_id text NOT NULL,
                                 created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                 last_used_at timestamp without time zone,
                                 CONSTRAINT ssh_keys_pkey PRIMARY KEY (id),
                                 CONSTRAINT ssh_keys_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.users (
                              id text NOT NULL,
                              name text NOT NULL,
                              username_normalized text NOT NULL UNIQUE,
                              email text NOT NULL UNIQUE,
                              password_hash text,
                              avatar_url text,
                              github_id text UNIQUE,
                              gitlab_id text UNIQUE,
                              gitea_id text UNIQUE,
                              oidc_id text UNIQUE,
                              md5_hash text,
                              style_preferences jsonb,
                              is_admin boolean DEFAULT false,
                              created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                              CONSTRAINT users_pkey PRIMARY KEY (id)
);

