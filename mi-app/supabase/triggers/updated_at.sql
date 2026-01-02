-- updated_at.sql
-- Trigger genérico para actualizar updated_at

-- La función ya está definida en 001_init.sql
-- Este archivo documenta cómo aplicar el trigger a nuevas tablas

-- Ejemplo de uso para una nueva tabla:
-- CREATE TRIGGER update_[tabla]_updated_at
--     BEFORE UPDATE ON [tabla]
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- Función alternativa que también registra quién hizo el cambio
CREATE OR REPLACE FUNCTION update_updated_at_with_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para auditoría de cambios
CREATE OR REPLACE FUNCTION log_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (tabla, operacion, registro_id, datos_nuevos, usuario_id)
        VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, row_to_json(NEW), auth.uid());
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (tabla, operacion, registro_id, datos_anteriores, datos_nuevos, usuario_id)
        VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, row_to_json(OLD), row_to_json(NEW), auth.uid());
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (tabla, operacion, registro_id, datos_anteriores, usuario_id)
        VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, row_to_json(OLD), auth.uid());
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';
