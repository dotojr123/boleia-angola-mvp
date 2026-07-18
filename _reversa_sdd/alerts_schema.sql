-- Schema para denúncias/alerts (WF3 — Fluxo de Denúncia)
-- Este script cria a tabela de denúncias que não existe ainda

-- Tabela de denúncias (WF3)
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  
  -- Tipo de denúncia
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN ('harassment', 'fraud', 'unsafe_vehicle', 'no_show', 'inappropriate_behavior', 'other')),
  
  -- Status da denúncia (WF3)
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  
  -- Detalhes
  description TEXT,
  evidence_url TEXT, -- URL para fotos, prints, etc.
  
  -- Campo admin
  admin_notes TEXT,
  resolution VARCHAR(200), -- Descrição da resolução
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT reporter_not_reported CHECK (reporter_id != reported_id)
);

-- Índices para query eficiente
CREATE INDEX IF NOT EXISTS idx_alerts_reported_id ON alerts(reported_id);
CREATE INDEX IF NOT EXISTS idx_alerts_reporter_id ON alerts(reporter_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_ride_id ON alerts(ride_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_alerts_updated_at();

-- Comentários
COMMENT ON TABLE alerts IS 'Denúncias/reportes de usuários (WF3 — Fluxo de Denúncia)';
COMMENT ON COLUMN alerts.reporter_id IS 'Usuário que fez a denúncia';
COMMENT ON COLUMN alerts.reported_id IS 'Usuário denunciado';
COMMENT ON COLUMN alerts.ride_id IS 'Viagem relacionada (opcional)';
COMMENT ON COLUMN alerts.booking_id IS 'Reserva relacionada (opcional)';
COMMENT ON COLUMN alerts.alert_type IS 'Tipo: harassment, fraud, unsafe_vehicle, no_show, inappropriate_behavior, other';
COMMENT ON COLUMN alerts.status IS 'Status: pending → reviewed → resolved/dismissed';
COMMENT ON COLUMN alerts.admin_notes IS 'Notas internas do admin';
COMMENT ON COLUMN alerts.resolution IS 'Descrição da resolução';