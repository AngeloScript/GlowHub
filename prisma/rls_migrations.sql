-- Script SQL de Configuração de Row Level Security (RLS) para Postgres no GlowHub
-- Atenção: Esse script DEVE ser rodado após a migração das tabelas via Prisma.
-- 1. Habilitar o RLS em todas as tabelas compartilhadas (onde dados multi-tenant existem)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ServiceCategory" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TenantSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tab" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TabItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Commission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerRecord" ENABLE ROW LEVEL SECURITY;
-- 2. Criar as Políticas (Policies) garantindo que os usuários
-- SÓ podem ver e alterar linhas com o `tenant_id` deles, que será injetado
-- na transação via "SET app.current_tenant_id = 'XYZ'".
-- Política para Tabela "User"
CREATE POLICY tenant_isolation_user ON "User" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "Customer"
CREATE POLICY tenant_isolation_customer ON "Customer" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "Service"
CREATE POLICY tenant_isolation_service ON "Service" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "ServiceCategory"
CREATE POLICY tenant_isolation_service_category ON "ServiceCategory" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "TenantSettings"
CREATE POLICY tenant_isolation_tenant_settings ON "TenantSettings" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "Appointment"
CREATE POLICY tenant_isolation_appointment ON "Appointment" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "Tab" (Comandas)
CREATE POLICY tenant_isolation_tab ON "Tab" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "TabItem" (Itens da Comanda)
CREATE POLICY tenant_isolation_tab_item ON "TabItem" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "Transaction" (Transações Financeiras)
CREATE POLICY tenant_isolation_transaction ON "Transaction" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "Commission" (Comissões)
CREATE POLICY tenant_isolation_commission ON "Commission" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- Política para Tabela "CustomerRecord" (Ficha Técnica)
CREATE POLICY tenant_isolation_customer_record ON "CustomerRecord" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- -------------------------------------------------------
-- MÓDULO 8 — PACOTES, ASSINATURAS E DESPESAS
-- -------------------------------------------------------
ALTER TABLE "ServicePackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PackageItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerPackage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomerPackageUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_service_package ON "ServicePackage" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
CREATE POLICY tenant_isolation_package_item ON "PackageItem" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
CREATE POLICY tenant_isolation_customer_package ON "CustomerPackage" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
CREATE POLICY tenant_isolation_customer_package_usage ON "CustomerPackageUsage" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
CREATE POLICY tenant_isolation_expense ON "Expense" FOR ALL USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
) WITH CHECK (
    tenant_id = current_setting('app.current_tenant_id')::uuid
);
-- 3. (OPCIONAL) Permitir a um usuário/role "postgres" ignorar as restrições
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
CREATE POLICY system_admin_tenant ON "Tenant" FOR ALL USING (current_user = 'postgres');