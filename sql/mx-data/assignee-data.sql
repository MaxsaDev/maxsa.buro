CREATE SCHEMA IF NOT EXISTS mx_data;

DROP VIEW IF EXISTS mx_data.assignee_data_view;
DROP TABLE IF EXISTS mx_data.assignee_data;

CREATE TABLE mx_data.assignee_data
(
    id              uuid PRIMARY KEY      DEFAULT uuid_generate_v4(),
    user_data_id    uuid         NOT NULL,
    user_id         uuid         NULL,
    post_assignee_id         INTEGER      NOT NULL,
    description     TEXT NULL,

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT assignee_data_fk_user FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT assignee_data_fk_updated_user FOREIGN KEY (updated_user_id) REFERENCES public.users (id) ON DELETE CASCADE,
    CONSTRAINT assignee_data_fk_post_assignee FOREIGN KEY (post_assignee_id) REFERENCES mx_dic.dic_posts_assignee (id) ON DELETE CASCADE,
    CONSTRAINT assignee_data_unique_user_id UNIQUE (user_id)
);

CREATE VIEW mx_data.assignee_data_view AS
SELECT ad.id,
       ad.user_data_id,
       ad.user_id,
       ud.full_name,
       ad.post_assignee_id,
       dp.title AS post_assignee_title,
       ad.description,
       -- user
       u.name AS user_name,
       u.is_banned

FROM mx_data.assignee_data ad
         LEFT OUTER JOIN mx_data.user_data ud ON ud.id = ad.user_data_id
         LEFT OUTER JOIN mx_dic.dic_posts_assignee dp ON dp.id = ad.post_assignee_id
         LEFT OUTER JOIN public.users u ON u.id = ad.user_id
;
