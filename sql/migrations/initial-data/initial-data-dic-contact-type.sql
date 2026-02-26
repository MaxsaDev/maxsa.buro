INSERT INTO mx_dic.dic_contact_type (code, title, title_en, url_prefix, sort_order) VALUES
 ('phone',     'Телефон',              'Phone',     'tel:',                   10),
 ('email',     'Електронна пошта',     'Email',     'mailto:',                20),
 ('telegram',  'Telegram',             'Telegram',  'https://t.me/',          30),
 ('viber',     'Viber',                'Viber',     'viber://add?number=',    40),
 ('whatsapp',  'WhatsApp',             'WhatsApp',  'https://wa.me/',         50),
 ('facebook',  'Facebook',             'Facebook',  'https://facebook.com/',  60),
 ('messenger', 'Messenger',            'Messenger', 'https://m.me/',          65),
 ('instagram', 'Instagram',            'Instagram', 'https://instagram.com/', 70)
ON CONFLICT (code) DO NOTHING;
