# GlowHub Public Booking API — Documentação Completa

> Guia completo para integração com a API pública do GlowHub.
> Entregue este documento ao Google Studio para que ele implemente a conexão.

---

## Configuração

| Item | Valor |
|---|---|
| **Base URL** | `https://SEU-DOMINIO.com` (ou `http://localhost:3000` em dev) |
| **Autenticação** | Header `x-api-key: SUA_CHAVE_AQUI` em **TODAS** as requisições |
| **Content-Type** | `application/json` (para POST/PATCH) |
| **Formato** | Todas as respostas são JSON |

### Respostas padrão

**Sucesso:**

```json
{ "success": true, "data": { ... } }
```

**Erro:**

```json
{ "error": "mensagem do erro" }
```

**Status codes usados:** `200` OK, `201` Created, `400` Bad Request, `401` Unauthorized, `404` Not Found, `422` Unprocessable Entity, `500` Server Error.

---

## Endpoints

### 1. `GET /api/public/tenant/{slug}`

Retorna informações do salão pelo slug público. Este é sempre o **primeiro endpoint** a ser chamado — ele retorna o `tenantId` necessário para todas as outras chamadas.

**Parâmetros:** `slug` na URL (ex: `meu-salao`)

**Resposta:**

```json
{
  "success": true,
  "data": {
    "tenantId": "uuid-do-tenant",
    "tenantName": "Salão Exemplo",
    "logoUrl": "https://...",
    "address": "Rua Exemplo, 123",
    "phone": "11999999999",
    "businessHours": {
      "seg": { "enabled": true, "open": "09:00", "close": "18:00" },
      "ter": { "enabled": true, "open": "09:00", "close": "18:00" },
      "qua": { "enabled": true, "open": "09:00", "close": "18:00" },
      "qui": { "enabled": true, "open": "09:00", "close": "18:00" },
      "sex": { "enabled": true, "open": "09:00", "close": "18:00" },
      "sab": { "enabled": true, "open": "09:00", "close": "13:00" },
      "dom": { "enabled": false, "open": "", "close": "" }
    },
    "bookingRules": { ... },
    "categories": [
      {
        "id": "uuid-categoria",
        "name": "Cabelo",
        "services": [
          {
            "id": "uuid-servico",
            "name": "Corte Masculino",
            "price": 50.00,
            "durationMinutes": 30
          }
        ]
      }
    ]
  }
}
```

---

### 2. `GET /api/public/services?tenantId={tenantId}`

Lista todos os serviços ativos agrupados por categoria. Alternativa ao endpoint de tenant quando já se tem o `tenantId`.

**Query params:**

| Param | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tenantId` | string (UUID) | ✅ | ID do tenant |

**Resposta:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-categoria",
      "name": "Cabelo",
      "services": [
        { "id": "uuid", "name": "Corte", "price": 50.00, "durationMinutes": 30 }
      ]
    }
  ]
}
```

---

### 3. `GET /api/public/professionals?tenantId={tenantId}`

Lista os profissionais ativos do salão.

**Query params:**

| Param | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tenantId` | string (UUID) | ✅ | ID do tenant |

**Resposta:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-profissional",
      "name": "João Silva",
      "phone": "11988887777",
      "workingHours": {
        "seg": { "enabled": true, "start": "09:00", "end": "18:00" },
        "ter": { "enabled": true, "start": "09:00", "end": "18:00" }
      }
    }
  ]
}
```

---

### 4. `GET /api/public/availability?tenantId={tenantId}&serviceId={serviceId}&date={date}`

Retorna os horários disponíveis para um serviço em uma data específica, com os profissionais livres em cada slot.

**Query params:**

| Param | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tenantId` | string (UUID) | ✅ | ID do tenant |
| `serviceId` | string (UUID) | ✅ | ID do serviço desejado |
| `date` | string | ✅ | Data no formato `YYYY-MM-DD` |

**Resposta:**

```json
{
  "success": true,
  "data": [
    { "time": "09:00", "professionals": ["uuid-prof-1", "uuid-prof-2"] },
    { "time": "09:30", "professionals": ["uuid-prof-1"] },
    { "time": "10:00", "professionals": ["uuid-prof-1", "uuid-prof-2"] }
  ]
}
```

> **Nota:** Os slots são gerados de 30 em 30 minutos. Se o horário for para o dia de hoje, slots com menos de 2 horas de antecedência são removidos automaticamente.

---

### 5. `POST /api/public/appointments`

Cria um novo agendamento. Se o cliente (por telefone) não existir no sistema, ele é criado automaticamente.

**Body (JSON):**

```json
{
  "tenantId": "uuid-do-tenant",
  "serviceId": "uuid-do-servico",
  "startTime": "2026-02-22T10:00:00",
  "professionalId": "uuid-do-profissional",
  "customerName": "Maria Silva",
  "customerPhone": "11999999999"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tenantId` | string (UUID) | ✅ | ID do tenant |
| `serviceId` | string (UUID) | ✅ | ID do serviço |
| `startTime` | string (ISO 8601) | ✅ | Data/hora de início |
| `professionalId` | string (UUID) | ❌ | Se omitido, atribui automaticamente |
| `customerName` | string | ✅ | Nome do cliente |
| `customerPhone` | string | ✅ | Telefone do cliente |

**Resposta (201 Created):**

```json
{
  "success": true,
  "data": {
    "success": true,
    "appointmentId": "uuid-do-agendamento"
  }
}
```

**Erros possíveis:**

- `422` — "Serviço inválido" ou "Nenhum profissional cadastrado"

---

### 6. `GET /api/public/appointments/{id}`

Retorna os detalhes e status de um agendamento específico.

**Parâmetros:** `id` na URL (UUID do agendamento)

**Resposta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-do-agendamento",
    "startTime": "2026-02-22T10:00:00.000Z",
    "endTime": "2026-02-22T10:30:00.000Z",
    "status": "SCHEDULED",
    "createdAt": "2026-02-21T15:00:00.000Z",
    "service": {
      "id": "uuid",
      "name": "Corte Masculino",
      "durationMinutes": 30,
      "price": 50.00
    },
    "professional": {
      "id": "uuid",
      "name": "João Silva"
    },
    "customer": {
      "id": "uuid",
      "name": "Maria Silva",
      "phone": "11999999999"
    }
  }
}
```

**Status possíveis:** `SCHEDULED` | `COMPLETED` | `CANCELED`

---

### 7. `PATCH /api/public/appointments/{id}`

Cancela um agendamento. Só funciona se o status atual for `SCHEDULED`.

**Parâmetros:** `id` na URL (UUID do agendamento)

**Body (JSON):**

```json
{
  "status": "CANCELED"
}
```

> ⚠️ O único valor aceito é `"CANCELED"`. Qualquer outro valor retorna erro `400`.

**Resposta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-do-agendamento",
    "status": "CANCELED"
  }
}
```

**Erros possíveis:**

- `400` — Status diferente de `CANCELED`
- `404` — Agendamento não encontrado
- `422` — Não é possível cancelar agendamento com status diferente de `SCHEDULED`

---

### 8. `GET /api/public/customers/lookup?tenantId={tenantId}&phone={phone}`

Busca um cliente pelo telefone e retorna os últimos 20 agendamentos. Útil para tela de "Meus Agendamentos" no sistema do cliente.

**Query params:**

| Param | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tenantId` | string (UUID) | ✅ | ID do tenant |
| `phone` | string | ✅ | Telefone do cliente |

**Resposta:**

```json
{
  "success": true,
  "data": {
    "id": "uuid-do-cliente",
    "name": "Maria Silva",
    "phone": "11999999999",
    "email": "maria@exemplo.com",
    "appointments": [
      {
        "id": "uuid",
        "startTime": "2026-02-22T10:00:00.000Z",
        "endTime": "2026-02-22T10:30:00.000Z",
        "status": "SCHEDULED",
        "service": { "id": "uuid", "name": "Corte", "price": 50.00 },
        "professional": { "id": "uuid", "name": "João Silva" }
      }
    ]
  }
}
```

---

## Fluxo Completo de Integração

O sistema do cliente deve seguir este fluxo:

```
1. Cliente entra no sistema
   └─→ GET /api/public/tenant/{slug}
       (obter tenantId, nome, categorias e serviços)

2. Cliente seleciona um serviço
   └─→ GET /api/public/professionals?tenantId=X
       (listar profissionais disponíveis)

3. Cliente escolhe data
   └─→ GET /api/public/availability?tenantId=X&serviceId=Y&date=YYYY-MM-DD
       (obter horários disponíveis com profissionais livres)

4. Cliente confirma agendamento
   └─→ POST /api/public/appointments
       (criar agendamento, receber appointmentId)

5. Cliente consulta agendamento
   └─→ GET /api/public/appointments/{appointmentId}
       (ver status e detalhes)

6. Cliente cancela agendamento
   └─→ PATCH /api/public/appointments/{appointmentId}
       body: { "status": "CANCELED" }

7. Cliente consulta histórico
   └─→ GET /api/public/customers/lookup?tenantId=X&phone=Y
       (ver todos os agendamentos anteriores)
```

---

## Exemplo de Integração (JavaScript/Fetch)

```javascript
const API_BASE = "https://seu-dominio.com";
const API_KEY = "sua-chave-aqui";

const headers = {
  "x-api-key": API_KEY,
  "Content-Type": "application/json",
};

// 1. Buscar info do salão
async function getTenantInfo(slug) {
  const res = await fetch(`${API_BASE}/api/public/tenant/${slug}`, { headers });
  return res.json();
}

// 2. Buscar horários disponíveis
async function getAvailability(tenantId, serviceId, date) {
  const res = await fetch(
    `${API_BASE}/api/public/availability?tenantId=${tenantId}&serviceId=${serviceId}&date=${date}`,
    { headers }
  );
  return res.json();
}

// 3. Criar agendamento
async function createAppointment(data) {
  const res = await fetch(`${API_BASE}/api/public/appointments`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  return res.json();
}

// 4. Cancelar agendamento
async function cancelAppointment(appointmentId) {
  const res = await fetch(`${API_BASE}/api/public/appointments/${appointmentId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ status: "CANCELED" }),
  });
  return res.json();
}

// 5. Consultar histórico do cliente
async function getCustomerHistory(tenantId, phone) {
  const res = await fetch(
    `${API_BASE}/api/public/customers/lookup?tenantId=${tenantId}&phone=${phone}`,
    { headers }
  );
  return res.json();
}
```

---

## Regras Importantes

1. **Sempre envie o header `x-api-key`** — sem ele, a API retorna `401`.
2. **Datas no formato ISO 8601** — `startTime` em POST deve ser `YYYY-MM-DDTHH:MM:SS`.
3. **Cancelamento só de SCHEDULED** — agendamentos `COMPLETED` ou `CANCELED` não podem ser cancelados.
4. **Cliente é identificado por telefone** — se o mesmo telefone fizer outro agendamento, o sistema reutiliza o mesmo cadastro.
5. **Profissional é opcional no POST** — se não informado, o sistema atribui um automaticamente.
6. **Horários de 30 em 30 min** — os slots de disponibilidade são gerados em intervalos de 30 minutos.
7. **Antecedência mínima de 2h** — para agendamentos no dia atual, horários com menos de 2h de antecedência são bloqueados.
