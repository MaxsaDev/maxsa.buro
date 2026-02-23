CREATE SCHEMA IF NOT EXISTS mx_dic;

DROP TABLE IF EXISTS mx_dic.dic_posts;
CREATE TABLE mx_dic.dic_posts
(
    id    SERIAL      NOT NULL PRIMARY KEY,
    title VARCHAR(50) NOT NULL
);

INSERT INTO mx_dic.dic_posts (title)
VALUES ('Кандидат'),
       ('Менеджер'),
       ('Керівник офісу'),
       ('Бухгалтер'),
       ('Власник')
;
