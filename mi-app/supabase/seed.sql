-- seed.sql
-- Datos de prueba para desarrollo

-- Nota: Este archivo está pensado para ejecutarse después de crear un usuario de prueba
-- El usuario debe estar autenticado para que las políticas RLS permitan insertar

-- Si necesitas datos de prueba sin autenticación, ejecuta:
-- SET LOCAL role postgres;

-- Ejemplo de gastos de prueba (reemplaza el UUID con el ID de un usuario real)
-- INSERT INTO gastos (descripcion, monto, fecha, categoria, usuario_id) VALUES
--     ('Supermercado', 850.00, '2026-01-01', 'alimentacion', 'USER_UUID_HERE'),
--     ('Gasolina', 500.00, '2026-01-01', 'transporte', 'USER_UUID_HERE'),
--     ('Netflix', 199.00, '2026-01-01', 'entretenimiento', 'USER_UUID_HERE'),
--     ('Medicinas', 350.00, '2025-12-30', 'salud', 'USER_UUID_HERE'),
--     ('Libros', 450.00, '2025-12-28', 'educacion', 'USER_UUID_HERE'),
--     ('Electricidad', 680.00, '2025-12-27', 'hogar', 'USER_UUID_HERE');

-- Storage bucket para avatares (ejecutar en Supabase Dashboard o mediante API)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('avatars', 'avatars', true);

-- Política de storage para avatares
-- CREATE POLICY "Avatar images are publicly accessible"
--     ON storage.objects FOR SELECT
--     USING (bucket_id = 'avatars');

-- CREATE POLICY "Users can upload their own avatar"
--     ON storage.objects FOR INSERT
--     WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
