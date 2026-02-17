-- Тригер для оновлення updated_at на словнику
DROP TRIGGER IF EXISTS trg_dic_contact_type_bu_set_updated_at ON mx_dic.dic_contact_type;
CREATE TRIGGER trg_dic_contact_type_bu_set_updated_at
BEFORE UPDATE ON mx_dic.dic_contact_type
FOR EACH ROW
EXECUTE FUNCTION mx_global.set_updated_at();  -- передбачається, що ця функція існує у вашому проекті
