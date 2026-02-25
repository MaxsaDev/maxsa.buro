DROP SCHEMA IF EXISTS mx_dic CASCADE;

DROP TABLE IF EXISTS mx_dic.dic_posts_assignee CASCADE;
CREATE TABLE mx_dic.dic_posts_assignee
(
    id    SMALLSERIAL PRIMARY KEY,
    title VARCHAR(20)  NOT NULL
);

INSERT INTO mx_dic.dic_posts_assignee (title)
VALUES ('Кандидат'),
       ('Перекладач'),
       ('Нотаріус'),
       ('Курʼєр')
;
