-- Початкове наповнення (ідемпотентне)
INSERT INTO mx_dic.menu_types (code, title, sort_order) VALUES
 ('sections', 'Меню з секціями та пунктами', 10),
 ('items',    'Меню з пунктами',              20),
 ('general',  'Загальне меню (без офісу)',    30)
ON CONFLICT (code) DO NOTHING;
