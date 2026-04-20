-- =============================================
-- BYD FESTIVAIS 2026 — Supabase Setup SQL
-- Colar no SQL Editor do Supabase
-- =============================================

-- ==================
-- 1. CRIAR TABELAS
-- ==================

CREATE TABLE IF NOT EXISTS "BD_RiR" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  "STATUS" text DEFAULT 'Por Enviar',
  "EnviadoPor" text,
  "Entidade" text,
  "Nome" text,
  "Tipo" text,
  "Email" text,
  "Dia_20jun" text DEFAULT 'Não',
  "Dia_21jun" text DEFAULT 'Não',
  "Dia_27jun" text DEFAULT 'Não',
  "Dia_28jun" text DEFAULT 'Não',
  "Observacoes" text
);

CREATE TABLE IF NOT EXISTS "DISTRIB_RiR" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  "NrBilhete" text,
  "Tipo" text,
  "Dia" text,
  "Status" text DEFAULT 'Disponível',
  "Nome" text,
  "Email" text,
  "Telefone" text,
  "AcaoParceiro" text
);

CREATE TABLE IF NOT EXISTS "BD_NosAlive" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  "STATUS" text DEFAULT 'Por Enviar',
  "EnviadoPor" text,
  "Entidade" text,
  "Nome" text,
  "Tipo" text,
  "Email" text,
  "Dia_9jul" text DEFAULT 'Não',
  "Dia_10jul" text DEFAULT 'Não',
  "Dia_11jul" text DEFAULT 'Não',
  "Observacoes" text
);

CREATE TABLE IF NOT EXISTS "DISTRIB_NosAlive" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  "NrBilhete" text,
  "Tipo" text,
  "Dia" text,
  "Status" text DEFAULT 'Disponível',
  "Nome" text,
  "Email" text,
  "Telefone" text,
  "AcaoParceiro" text
);

-- ==================
-- 2. ATIVAR RLS
-- ==================

ALTER TABLE "BD_RiR" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DISTRIB_RiR" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BD_NosAlive" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DISTRIB_NosAlive" ENABLE ROW LEVEL SECURITY;

-- ==================
-- 3. POLÍTICAS RLS
-- ==================

CREATE POLICY "auth_all" ON "BD_RiR"          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON "DISTRIB_RiR"      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON "BD_NosAlive"      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON "DISTRIB_NosAlive" FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==================
-- 4. DISTRIB_RiR — seed
-- ==================

INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699116','VIP','20jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699117','VIP','21jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699118','VIP','27jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699119','VIP','28jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699201','Relvado','20jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699202','Relvado','20jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699203','Relvado','21jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699204','Relvado','27jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699205','Relvado','28jun','Disponível');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status","AcaoParceiro") VALUES ('25691971','Rooftop','20jun','Disponível','Jornalista');
INSERT INTO "DISTRIB_RiR" ("NrBilhete","Tipo","Dia","Status","AcaoParceiro") VALUES ('25691972','Rooftop','21jun','Disponível','Jornalista');

-- ==================
-- 5. DISTRIB_NosAlive — seed
-- ==================

INSERT INTO "DISTRIB_NosAlive" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699201','Relvado','9jul','Disponível');
INSERT INTO "DISTRIB_NosAlive" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699202','Relvado','9jul','Disponível');
INSERT INTO "DISTRIB_NosAlive" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699203','Relvado','10jul','Disponível');
INSERT INTO "DISTRIB_NosAlive" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699204','Relvado','11jul','Disponível');
INSERT INTO "DISTRIB_NosAlive" ("NrBilhete","Tipo","Dia","Status") VALUES ('25699205','Relvado','11jul','Disponível');
INSERT INTO "DISTRIB_NosAlive" ("NrBilhete","Tipo","Dia","Status","AcaoParceiro") VALUES ('25691971','Rooftop','9jul','Disponível','Jornalista');
INSERT INTO "DISTRIB_NosAlive" ("NrBilhete","Tipo","Dia","Status","AcaoParceiro") VALUES ('25691972','Rooftop','10jul','Disponível','Jornalista');

-- ==================
-- 6. BD_RiR — seed
-- ==================

INSERT INTO "BD_RiR" ("Nome","Entidade","Tipo","STATUS","Dia_20jun") VALUES ('Sérgio Ribeiro','Admin/Dire.','Rooftop','Por Enviar','Sim');
INSERT INTO "BD_RiR" ("Nome","Entidade","Tipo","STATUS","Dia_20jun") VALUES ('Sérgio Ribeiro','Admin/Dire.','VIP','Enviado','Sim');
INSERT INTO "BD_RiR" ("Nome","Entidade","Tipo","STATUS","Dia_20jun") VALUES ('Sérgio Ribeiro','Admin/Dire.','Relvado','Enviado','Sim');

-- ==================
-- 7. BD_NosAlive — seed
-- ==================

INSERT INTO "BD_NosAlive" ("Nome","Entidade","Tipo","STATUS","Dia_9jul") VALUES ('Sérgio Ribeiro','Admin/Dire.','Relvado','Por Enviar','Sim');
INSERT INTO "BD_NosAlive" ("Nome","Entidade","Tipo","STATUS")            VALUES ('Ricardo Simões - RL','Admin/Dire.','Relvado','Por Enviar');
INSERT INTO "BD_NosAlive" ("Nome","Entidade","Tipo","STATUS")            VALUES ('RL','Admin/Dire.','Relvado','Verificar');
INSERT INTO "BD_NosAlive" ("Nome","Entidade","Tipo","STATUS")            VALUES ('Proteção ADM','Proteção','Relvado','Enviado');
INSERT INTO "BD_NosAlive" ("Nome","Entidade","Tipo","STATUS")            VALUES ('Proteção HPT','Proteção','Relvado','Por Enviar');
