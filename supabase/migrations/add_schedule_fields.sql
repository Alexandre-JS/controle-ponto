-- Migração para adicionar novos campos à tabela work_schedule
-- Execute este SQL no editor do Supabase

-- Adicionar novos campos à tabela work_schedule
ALTER TABLE work_schedule 
ADD COLUMN IF NOT EXISTS late_tolerance INTEGER DEFAULT 15,
ADD COLUMN IF NOT EXISTS daily_hours DECIMAL(3,1) DEFAULT 8.0,
ADD COLUMN IF NOT EXISTS auto_checkout BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_location BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN work_schedule.late_tolerance IS 'Tolerância de atraso em minutos antes de considerar como atraso';
COMMENT ON COLUMN work_schedule.daily_hours IS 'Carga horária diária esperada em horas';
COMMENT ON COLUMN work_schedule.auto_checkout IS 'Se deve marcar saída automaticamente após o horário';
COMMENT ON COLUMN work_schedule.require_location IS 'Se deve verificar a localização do funcionário';

-- Atualizar registros existentes com valores padrão se necessário
UPDATE work_schedule 
SET 
  late_tolerance = 15,
  daily_hours = 8.0,
  auto_checkout = false,
  require_location = false
WHERE 
  late_tolerance IS NULL 
  OR daily_hours IS NULL 
  OR auto_checkout IS NULL 
  OR require_location IS NULL;
