-- Юридичні дані клієнтів (опціональні, 1:1 до mx_data.user_data)
DROP TABLE IF EXISTS mx_data.user_data_legal CASCADE;
CREATE TABLE mx_data.user_data_legal
(
    id              uuid PRIMARY KEY     DEFAULT gen_random_uuid(),
    user_data_id    uuid        NOT NULL,
    data_address    VARCHAR(250) NULL,
    data_address_legal VARCHAR(250) NULL,
    phone           VARCHAR(20) NULL,
    email           VARCHAR(50) NULL,
    data_edrpou     VARCHAR(10) NOT NULL,
    tin             VARCHAR(12) NULL,
    data_account    VARCHAR(29) NULL,
    data_bank       VARCHAR(50) NULL,
    mfo_bank        VARCHAR(6) NULL,
    post_director   VARCHAR(255) NULL,
    data_director   VARCHAR(50) NULL,
    phone_director  VARCHAR(20) NULL,
    data_accountant VARCHAR(50) NULL,
    phone_accountant VARCHAR(20) NULL,
    data_contact    VARCHAR(50) NULL,
    phone_contact   VARCHAR(20) NULL,
    description     VARCHAR(250) NULL,

    CONSTRAINT user_data_legal_unique_user_data UNIQUE (user_data_id),
    CONSTRAINT user_data_legal_user_data_fk
      FOREIGN KEY (user_data_id)
      REFERENCES mx_data.user_data(id)
      ON DELETE CASCADE
);

COMMENT ON TABLE mx_data.user_data_legal IS
'Юридичні дані клієнтів. 1:1 до mx_data.user_data. Обов''язковий: ЄДРПОУ (data_edrpou).';
