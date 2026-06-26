import { useState, useRef } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  LayoutDashboard, Users, DollarSign, Columns, Target, BarChart2,
  ChevronLeft, ChevronRight, Bell, FileText, Sun, Moon, Plus, X,
  Search, Edit2, Trash2, Clock, TrendingUp, TrendingDown, Settings,
  Briefcase, GripVertical,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

// ─── Gradient presets (CSS strings for inline style, avoids Tailwind purge issues) ──
const GRAD = {
  blue:    "linear-gradient(135deg, rgba(59,130,246,0.28) 0%, rgba(59,130,246,0.03) 100%)",
  purple:  "linear-gradient(135deg, rgba(139,92,246,0.28) 0%, rgba(139,92,246,0.03) 100%)",
  emerald: "linear-gradient(135deg, rgba(16,185,129,0.28) 0%, rgba(16,185,129,0.03) 100%)",
  amber:   "linear-gradient(135deg, rgba(245,158,11,0.28) 0%, rgba(245,158,11,0.03) 100%)",
  red:     "linear-gradient(135deg, rgba(244,63,94,0.28) 0%, rgba(244,63,94,0.03) 100%)",
  slate:   "linear-gradient(135deg, rgba(100,116,139,0.18) 0%, rgba(100,116,139,0.02) 100%)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface KanbanCard { id: string; title: string; priority: "low" | "medium" | "high" | "critical"; tag: string; assignee: string; }
interface KanbanColumn { id: string; title: string; accent: string; cards: KanbanCard[]; }
interface Colaborador { id: number; nome: string; cargo: string; departamento: string; status: "Ativo" | "Férias" | "Afastado"; salario: number; avatar: string; }
interface Transacao { id: number; data: string; descricao: string; tipo: "Entrada" | "Saída"; valor: number; categoria: string; }
type ModalState = { type: "addColab" | "editColab" | "addTransacao" | "editTransacao" | null; data?: unknown };

// ─── Static Data ──────────────────────────────────────────────────────────────
const KANBAN_INIT: KanbanColumn[] = [
  { id: "todo", title: "A Fazer", accent: "#64748b", cards: [
    { id: "k1", title: "Redesign do Portal do Cliente", priority: "high", tag: "UI/UX", assignee: "Ana S." },
    { id: "k2", title: "Migração de Base de Dados", priority: "critical", tag: "Infra", assignee: "Rafael L." },
    { id: "k3", title: "Documentação API v3", priority: "medium", tag: "Dev", assignee: "Lucas F." },
  ]},
  { id: "doing", title: "Em Andamento", accent: "#3b82f6", cards: [
    { id: "k4", title: "Implementação de CI/CD Pipeline", priority: "high", tag: "DevOps", assignee: "Carlos M." },
    { id: "k5", title: "Dashboard Analytics — Fase 2", priority: "high", tag: "Produto", assignee: "Beatriz C." },
  ]},
  { id: "done", title: "Concluído", accent: "#10b981", cards: [
    { id: "k6", title: "Auditoria de Segurança Q2", priority: "critical", tag: "TI", assignee: "João P." },
    { id: "k7", title: "Onboarding 5 novos devs", priority: "medium", tag: "RH", assignee: "Mariana S." },
    { id: "k8", title: "Deploy versão 2.4.1", priority: "high", tag: "Dev", assignee: "Lucas F." },
  ]},
];

const COLABS_INIT: Colaborador[] = [
  { id: 1, nome: "Ana Silva", cargo: "Desenvolvedora Sênior", departamento: "TI", status: "Ativo", salario: 8500, avatar: "AS" },
  { id: 2, nome: "Carlos Mendes", cargo: "Designer UX", departamento: "Produto", status: "Ativo", salario: 7200, avatar: "CM" },
  { id: 3, nome: "Beatriz Costa", cargo: "Product Manager", departamento: "Produto", status: "Ativo", salario: 9800, avatar: "BC" },
  { id: 4, nome: "Rafael Lima", cargo: "DevOps Engineer", departamento: "TI", status: "Férias", salario: 8100, avatar: "RL" },
  { id: 5, nome: "Mariana Santos", cargo: "Data Analyst", departamento: "Analytics", status: "Ativo", salario: 7600, avatar: "MS" },
  { id: 6, nome: "João Pedro", cargo: "Marketing Lead", departamento: "Marketing", status: "Ativo", salario: 6900, avatar: "JP" },
  { id: 7, nome: "Camila Rocha", cargo: "Backend Developer", departamento: "TI", status: "Afastado", salario: 7800, avatar: "CR" },
  { id: 8, nome: "Lucas Ferreira", cargo: "QA Engineer", departamento: "TI", status: "Ativo", salario: 6500, avatar: "LF" },
];

const TRANSACOES_INIT: Transacao[] = [
  { id: 1, data: "2026-06-20", descricao: "Licenças SaaS — Suite de Ferramentas", tipo: "Saída", valor: -2800, categoria: "Software" },
  { id: 2, data: "2026-06-19", descricao: "Projeto Omega — Milestone Final", tipo: "Entrada", valor: 45000, categoria: "Projetos" },
  { id: 3, data: "2026-06-18", descricao: "Folha de Pagamento Junho/2026", tipo: "Saída", valor: -89400, categoria: "RH" },
  { id: 4, data: "2026-06-15", descricao: "Contrato Novo Cliente — Delta Corp", tipo: "Entrada", valor: 28000, categoria: "Contratos" },
  { id: 5, data: "2026-06-12", descricao: "Infraestrutura Cloud AWS", tipo: "Saída", valor: -3200, categoria: "Infra" },
  { id: 6, data: "2026-06-10", descricao: "Consultoria Estratégica Q2", tipo: "Entrada", valor: 15000, categoria: "Serviços" },
];

const CASHFLOW = [
  { mes: "Jan", entradas: 45000, saidas: 32000 },
  { mes: "Fev", entradas: 52000, saidas: 38000 },
  { mes: "Mar", entradas: 48000, saidas: 41000 },
  { mes: "Abr", entradas: 61000, saidas: 35000 },
  { mes: "Mai", entradas: 55000, saidas: 44000 },
  { mes: "Jun", entradas: 70000, saidas: 38000 },
];

const PROJECT_PIE = [
  { name: "Em Andamento", value: 12, color: "#3b82f6" },
  { name: "Concluídos",   value: 8,  color: "#10b981" },
  { name: "Atrasados",    value: 3,  color: "#f43f5e" },
  { name: "Planejados",   value: 5,  color: "#8b5cf6" },
];

const ALERTS = [
  { id: 1, type: "danger"  as const, message: "Projeto Alpha atrasado em 5 dias — revisar cronograma urgente", time: "2h atrás" },
  { id: 2, type: "warning" as const, message: "Budget Q3 próximo ao limite (87% utilizado)", time: "4h atrás" },
  { id: 3, type: "success" as const, message: "Meta mensal atingida com 112% — parabéns ao time!", time: "1d atrás" },
  { id: 4, type: "warning" as const, message: "3 colaboradores com saldo de férias vencendo em breve", time: "2d atrás" },
  { id: 5, type: "info"    as const, message: "Reunião de revisão trimestral amanhã às 14h00", time: "3d atrás" },
];

const KPI_DATA = [
  { title: "Receita Total",      value: "R$ 284.750", delta: "+12,5%",       up: true,  sub: "vs. mês anterior", Icon: DollarSign, color: "#3b82f6", grad: "blue"    },
  { title: "Projetos Ativos",    value: "24",          delta: "−2",           up: false, sub: "vs. mês anterior", Icon: Briefcase,  color: "#8b5cf6", grad: "purple"  },
  { title: "Colaboradores",      value: "47",          delta: "+3 novos",     up: true,  sub: "este mês",         Icon: Users,      color: "#10b981", grad: "emerald" },
  { title: "Tarefas Pendentes",  value: "18",          delta: "−5 resolvidas",up: true,  sub: "esta semana",      Icon: Clock,      color: "#f59e0b", grad: "amber"   },
];

const NAV_ITEMS = [
  { id: "dashboard",      label: "Dashboard",          Icon: LayoutDashboard },
  { id: "colaboradores",  label: "Colaboradores",       Icon: Users           },
  { id: "financeiro",     label: "Fluxo de Caixa",      Icon: DollarSign      },
  { id: "kanban",         label: "Kanban Board",         Icon: Columns         },
  { id: "matrix",         label: "Matriz de Inovação",   Icon: Target          },
];

const MATRIX_QUADRANTS = [
  {
    id: "quickWins", label: "Quick Wins", desc: "Alto Impacto · Baixo Esforço",
    borderColor: "rgba(16,185,129,0.35)", bgGrad: GRAD.emerald,
    headerColor: "#10b981",
    items: ["Atualizar FAQ do produto", "Automatizar relatórios mensais", "Templates de e-mail padrão"],
    tagStyle: { background: "rgba(16,185,129,0.12)", color: "#059669", border: "1px solid rgba(16,185,129,0.25)" },
    tagDarkColor: "#34d399",
  },
  {
    id: "bigBets", label: "Grandes Apostas", desc: "Alto Impacto · Alto Esforço",
    borderColor: "rgba(59,130,246,0.35)", bgGrad: GRAD.blue,
    headerColor: "#3b82f6",
    items: ["Plataforma Mobile Nativa", "Integração com ERP Legado", "IA para Atendimento ao Cliente"],
    tagStyle: { background: "rgba(59,130,246,0.12)", color: "#2563eb", border: "1px solid rgba(59,130,246,0.25)" },
    tagDarkColor: "#60a5fa",
  },
  {
    id: "fillers", label: "Preenchedores", desc: "Baixo Impacto · Baixo Esforço",
    borderColor: "rgba(100,116,139,0.25)", bgGrad: GRAD.slate,
    headerColor: "#94a3b8",
    items: ["Renomear variáveis de config", "Limpeza de logs antigos", "Dark mode no painel admin"],
    tagStyle: { background: "rgba(100,116,139,0.1)", color: "#64748b", border: "1px solid rgba(100,116,139,0.2)" },
    tagDarkColor: "#94a3b8",
  },
  {
    id: "hardPasses", label: "Evitar", desc: "Baixo Impacto · Alto Esforço",
    borderColor: "rgba(244,63,94,0.3)", bgGrad: GRAD.red,
    headerColor: "#f43f5e",
    items: ["Migrar para microserviços", "Refactor do auth legado", "Redesign do banco de dados"],
    tagStyle: { background: "rgba(244,63,94,0.1)", color: "#e11d48", border: "1px solid rgba(244,63,94,0.25)" },
    tagDarkColor: "#fb7185",
  },
];

// ─── Priority / Status config ─────────────────────────────────────────────────
const PRIORITY_CFG = {
  low:      { label: "Baixa",  bg: "rgba(16,185,129,0.12)",  color: "#059669", darkColor: "#34d399", border: "rgba(16,185,129,0.25)" },
  medium:   { label: "Média",  bg: "rgba(245,158,11,0.12)",  color: "#d97706", darkColor: "#fbbf24", border: "rgba(245,158,11,0.25)" },
  high:     { label: "Alta",   bg: "rgba(59,130,246,0.12)",  color: "#2563eb", darkColor: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  critical: { label: "Crítica",bg: "rgba(244,63,94,0.12)",   color: "#e11d48", darkColor: "#fb7185", border: "rgba(244,63,94,0.25)"  },
};

const STATUS_CFG = {
  Ativo:    { bg: "rgba(16,185,129,0.1)",  color: "#059669", darkColor: "#34d399", border: "rgba(16,185,129,0.25)" },
  Férias:   { bg: "rgba(245,158,11,0.1)",  color: "#d97706", darkColor: "#fbbf24", border: "rgba(245,158,11,0.25)" },
  Afastado: { bg: "rgba(244,63,94,0.1)",   color: "#e11d48", darkColor: "#fb7185", border: "rgba(244,63,94,0.25)"  },
};

const ALERT_CFG = {
  danger:  { bg: "rgba(244,63,94,0.07)",   border: "rgba(244,63,94,0.18)",   dot: "#f43f5e" },
  warning: { bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.18)",  dot: "#f59e0b" },
  success: { bg: "rgba(16,185,129,0.07)",  border: "rgba(16,185,129,0.18)",  dot: "#10b981" },
  info:    { bg: "rgba(59,130,246,0.07)",  border: "rgba(59,130,246,0.18)",  dot: "#3b82f6" },
};

// ─── GradCard ─────────────────────────────────────────────────────────────────
function GradCard({ children, gradient, className }: {
  children: React.ReactNode;
  gradient?: string;
  className?: string;
}) {
  return (
    <div className="p-px rounded-xl" style={{ background: gradient ?? GRAD.slate }}>
      <div className={cn("rounded-xl bg-card p-5 h-full", className)}>
        {children}
      </div>
    </div>
  );
}

// ─── DashboardView ────────────────────────────────────────────────────────────
function DashboardView({ dark }: { dark: boolean }) {
  const gridColor = dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
  const tickColor = dark ? "#7a8fb0" : "#94a3b8";
  const tooltipBg = dark ? "#0d1526" : "#ffffff";
  const tooltipBorder = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DATA.map(k => (
          <GradCard key={k.title} gradient={GRAD[k.grad as keyof typeof GRAD]}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest leading-none">{k.title}</p>
              <div className="p-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: k.color + "22" }}>
                <k.Icon className="w-3.5 h-3.5" style={{ color: k.color }} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-card-foreground mb-1.5 tracking-tight">{k.value}</p>
            <div className="flex items-center gap-1.5">
              {k.up
                ? <TrendingUp className="w-3 h-3" style={{ color: "#10b981" }} />
                : <TrendingDown className="w-3 h-3" style={{ color: "#f43f5e" }} />}
              <span className="text-xs font-semibold" style={{ color: k.up ? "#10b981" : "#f43f5e" }}>{k.delta}</span>
              <span className="text-[11px] text-muted-foreground">{k.sub}</span>
            </div>
          </GradCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bar Chart */}
        <GradCard gradient={GRAD.slate} className="lg:col-span-7 p-0">
          <div className="p-5">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-sm font-semibold text-card-foreground">Fluxo de Caixa</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Entradas e saídas — últimos 6 meses</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#10b981" }} />Entradas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: "#f43f5e" }} />Saídas
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={CASHFLOW} barGap={4} barCategoryGap="32%">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: tickColor, fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: tickColor, fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} width={32} />
                <Tooltip
                  contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 10, fontSize: 12, fontFamily: "Inter", padding: "8px 12px" }}
                  labelStyle={{ color: tickColor, fontWeight: 600, marginBottom: 4 }}
                  formatter={(v: number) => [`R$ ${v.toLocaleString("pt-BR")}`, ""]}
                  cursor={{ fill: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
                />
                <Bar dataKey="entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GradCard>

        {/* Donut Chart */}
        <GradCard gradient={GRAD.purple} className="lg:col-span-5 p-0">
          <div className="p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-card-foreground">Status dos Projetos</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Distribuição por status atual</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="w-[148px] h-[148px] flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={PROJECT_PIE} cx="50%" cy="50%" innerRadius={46} outerRadius={68} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {PROJECT_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: 10, fontSize: 12, fontFamily: "Inter" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2.5 flex-1 min-w-0">
                {PROJECT_PIE.map(p => (
                  <div key={p.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-xs text-muted-foreground truncate">{p.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-card-foreground flex-shrink-0">{p.value}</span>
                  </div>
                ))}
                <div className="pt-2.5 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-card-foreground">Total</span>
                  <span className="text-sm font-bold text-card-foreground">{PROJECT_PIE.reduce((s, p) => s + p.value, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </GradCard>
      </div>

      {/* Alerts */}
      <GradCard gradient={GRAD.slate}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">Alertas do Gestor</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Notificações e avisos importantes</p>
          </div>
          <span className="text-xs text-muted-foreground px-2.5 py-1 bg-muted rounded-md">{ALERTS.length} alertas</span>
        </div>
        <div className="space-y-2">
          {ALERTS.map(a => {
            const cfg = ALERT_CFG[a.type];
            return (
              <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border" style={{ background: cfg.bg, borderColor: cfg.border }}>
                <span className="mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
                <p className="flex-1 text-xs text-card-foreground leading-relaxed">{a.message}</p>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0 pt-0.5 font-mono">{a.time}</span>
              </div>
            );
          })}
        </div>
      </GradCard>
    </div>
  );
}

// ─── ColaboradoresView ────────────────────────────────────────────────────────
function ColaboradoresView({ colaboradores, search, onSearch, onAdd, onEdit, onDelete, dark }: {
  colaboradores: Colaborador[];
  search: string;
  onSearch: (v: string) => void;
  onAdd: () => void;
  onEdit: (c: Colaborador) => void;
  onDelete: (id: number) => void;
  dark: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Gestão de Colaboradores</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{colaboradores.length} colaboradores encontrados</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" />Novo Colaborador
        </button>
      </div>

      <GradCard gradient={GRAD.slate} className="p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Buscar colaboradores..." className="w-full pl-9 pr-4 py-2 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring/50 text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Colaborador", "Cargo", "Departamento", "Status", "Salário", ""].map(h => (
                  <th key={h} className={cn("px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider", h === "Salário" ? "text-right" : h === "" ? "" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {colaboradores.map((c, i) => {
                const sCfg = STATUS_CFG[c.status];
                return (
                  <tr key={c.id} className={cn("border-b border-border/50 transition-colors hover:bg-muted/25", i === colaboradores.length - 1 && "border-0")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">{c.avatar}</div>
                        <span className="text-sm font-medium text-card-foreground">{c.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{c.cargo}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">{c.departamento}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-md font-semibold" style={{ background: sCfg.bg, color: dark ? sCfg.darkColor : sCfg.color, border: `1px solid ${sCfg.border}` }}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-card-foreground font-mono">
                      R$ {c.salario.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEdit(c)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(c.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GradCard>
    </div>
  );
}

// ─── FinanceiroView ───────────────────────────────────────────────────────────
function FinanceiroView({ transacoes, search, onSearch, onAdd, onEdit, onDelete, dark }: {
  transacoes: Transacao[];
  search: string;
  onSearch: (v: string) => void;
  onAdd: () => void;
  onEdit: (t: Transacao) => void;
  onDelete: (id: number) => void;
  dark: boolean;
}) {
  const totalEntradas = transacoes.filter(t => t.tipo === "Entrada").reduce((s, t) => s + t.valor, 0);
  const totalSaidas   = transacoes.filter(t => t.tipo === "Saída").reduce((s, t) => s + Math.abs(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Fluxo de Caixa</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{transacoes.length} transações no período</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-3.5 h-3.5" />Nova Transação
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <GradCard gradient={GRAD.emerald}>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Total Entradas</p>
          <p className="text-xl font-bold" style={{ color: "#10b981" }}>R$ {totalEntradas.toLocaleString("pt-BR")}</p>
        </GradCard>
        <GradCard gradient={GRAD.red}>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Total Saídas</p>
          <p className="text-xl font-bold" style={{ color: "#f43f5e" }}>R$ {totalSaidas.toLocaleString("pt-BR")}</p>
        </GradCard>
        <GradCard gradient={saldo >= 0 ? GRAD.blue : GRAD.red}>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mb-1.5">Saldo do Período</p>
          <p className="text-xl font-bold" style={{ color: saldo >= 0 ? "#3b82f6" : "#f43f5e" }}>R$ {saldo.toLocaleString("pt-BR")}</p>
        </GradCard>
      </div>

      <GradCard gradient={GRAD.slate} className="p-0 overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Buscar transações..." className="w-full pl-9 pr-4 py-2 text-xs bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring/50 text-foreground placeholder:text-muted-foreground" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Data", "Descrição", "Categoria", "Tipo", "Valor", ""].map(h => (
                  <th key={h} className={cn("px-4 py-3 text-[11px] font-medium text-muted-foreground uppercase tracking-wider", h === "Valor" ? "text-right" : h === "" ? "" : "text-left")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transacoes.map((t, i) => {
                const isEntrada = t.tipo === "Entrada";
                return (
                  <tr key={t.id} className={cn("border-b border-border/50 transition-colors hover:bg-muted/25", i === transacoes.length - 1 && "border-0")}>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{t.data}</td>
                    <td className="px-4 py-3 text-sm text-card-foreground">{t.descricao}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 bg-muted rounded-md text-muted-foreground">{t.categoria}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2.5 py-1 rounded-md font-semibold"
                        style={isEntrada
                          ? { background: "rgba(16,185,129,0.1)", color: dark ? "#34d399" : "#059669", border: "1px solid rgba(16,185,129,0.25)" }
                          : { background: "rgba(244,63,94,0.1)",  color: dark ? "#fb7185" : "#e11d48", border: "1px solid rgba(244,63,94,0.25)" }}>
                        {t.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold font-mono" style={{ color: isEntrada ? "#10b981" : "#f43f5e" }}>
                      {isEntrada ? "+" : "−"}R$ {Math.abs(t.valor).toLocaleString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEdit(t)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => onDelete(t.id)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GradCard>
    </div>
  );
}

// ─── KanbanView ───────────────────────────────────────────────────────────────
function KanbanView({ kanban, dragItem, onDrop, dark }: {
  kanban: KanbanColumn[];
  dragItem: { current: { cardId: string; fromCol: string } | null };
  onDrop: (toColId: string) => void;
  dark: boolean;
}) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Kanban Board</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Arraste os cards entre as colunas para atualizar o status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kanban.map(col => (
          <div
            key={col.id}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
            onDrop={() => { onDrop(col.id); setDragOver(null); }}
            className="rounded-xl transition-colors duration-150"
            style={{ background: dragOver === col.id ? (dark ? "rgba(59,130,246,0.06)" : "rgba(59,130,246,0.04)") : "transparent" }}
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-1 py-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: col.accent }} />
                <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-mono">{col.cards.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-3 min-h-[180px]">
              {col.cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-2">
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">Sem cards aqui</p>
                </div>
              ) : col.cards.map(card => {
                const pCfg = PRIORITY_CFG[card.priority];
                return (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={() => { dragItem.current = { cardId: card.id, fromCol: col.id }; }}
                    onDragEnd={() => { dragItem.current = null; }}
                    className="p-px rounded-xl cursor-grab active:cursor-grabbing active:opacity-70 transition-opacity"
                    style={{ background: GRAD.slate }}
                  >
                    <div className="rounded-xl bg-card p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: pCfg.bg, color: dark ? pCfg.darkColor : pCfg.color, border: `1px solid ${pCfg.border}` }}>
                          {pCfg.label}
                        </span>
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-card-foreground leading-snug mb-3">{card.title}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] px-2 py-0.5 bg-muted rounded-md text-muted-foreground">{card.tag}</span>
                        <span className="text-[11px] text-muted-foreground font-medium">{card.assignee}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MatrixView ───────────────────────────────────────────────────────────────
function MatrixView({ dark }: { dark: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Matriz de Inovação</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Priorização de iniciativas por Impacto vs. Esforço</p>
      </div>

      {/* Axis labels */}
      <div className="relative">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-semibold text-muted-foreground px-3">↑ Alto Impacto</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MATRIX_QUADRANTS.map(q => (
            <div key={q.id} className="rounded-xl p-5 border-2" style={{ borderColor: q.borderColor, background: dark ? `${GRAD[Object.keys(GRAD)[0] as keyof typeof GRAD]}` : q.bgGrad }}>
              <div className="mb-4">
                <h3 className="text-sm font-bold" style={{ color: q.headerColor }}>{q.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{q.desc}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {q.items.map((item, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ ...q.tagStyle, color: dark ? q.tagDarkColor : q.tagStyle.color }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs font-semibold text-muted-foreground px-3">← Baixo Esforço · Alto Esforço →</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex items-center justify-center mt-3">
          <span className="text-xs text-muted-foreground">↓ Baixo Impacto</span>
        </div>
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </div>
  );
}

function FieldInput({ label, value, onChange, type = "text", placeholder }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring/50 text-foreground placeholder:text-muted-foreground"
      />
    </div>
  );
}

function ColabModal({ data, onClose, onSave }: { data?: Colaborador; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({
    id: data?.id ?? null,
    nome: data?.nome ?? "",
    cargo: data?.cargo ?? "",
    departamento: data?.departamento ?? "",
    status: data?.status ?? "Ativo",
    salario: data?.salario ?? 0,
    avatar: data?.avatar ?? "",
  });
  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: k === "salario" ? Number(v) : v }));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-card-foreground">{data ? "Editar" : "Novo"} Colaborador</h2>
        <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <FieldInput label="Nome Completo"    value={form.nome}         onChange={set("nome")}         placeholder="Ex: João da Silva" />
        <FieldInput label="Cargo"            value={form.cargo}        onChange={set("cargo")}        placeholder="Ex: Desenvolvedor Sênior" />
        <FieldInput label="Departamento"     value={form.departamento} onChange={set("departamento")} placeholder="Ex: TI, Marketing..." />
        <FieldInput label="Salário (R$)"     value={form.salario}      onChange={set("salario")}      type="number" placeholder="8000" />
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Status</label>
          <select value={form.status} onChange={e => set("status")(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring/50 text-foreground">
            <option>Ativo</option><option>Férias</option><option>Afastado</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
        <button onClick={() => onSave(form)} className="flex-1 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity">
          {data ? "Salvar Alterações" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}

function TransacaoModal({ data, onClose, onSave }: { data?: Transacao; onClose: () => void; onSave: (d: unknown) => void }) {
  const [form, setForm] = useState({
    id: data?.id ?? null,
    data: data?.data ?? new Date().toISOString().split("T")[0],
    descricao: data?.descricao ?? "",
    tipo: data?.tipo ?? "Entrada",
    valor: data ? Math.abs(data.valor) : 0,
    categoria: data?.categoria ?? "",
  });
  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: k === "valor" ? Number(v) : v }));

  return (
    <div className="bg-card rounded-2xl border border-border shadow-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-card-foreground">{data ? "Editar" : "Nova"} Transação</h2>
        <button onClick={onClose} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <FieldInput label="Data"       value={form.data}      onChange={set("data")}      type="date" />
        <FieldInput label="Descrição"  value={form.descricao} onChange={set("descricao")} placeholder="Descrição da transação" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Tipo</label>
            <select value={form.tipo} onChange={e => set("tipo")(e.target.value)} className="w-full px-3 py-2.5 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring/50 text-foreground">
              <option>Entrada</option><option>Saída</option>
            </select>
          </div>
          <FieldInput label="Valor (R$)" value={form.valor} onChange={set("valor")} type="number" placeholder="0" />
        </div>
        <FieldInput label="Categoria" value={form.categoria} onChange={set("categoria")} placeholder="Ex: Software, RH, Contratos..." />
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">Cancelar</button>
        <button
          onClick={() => {
            const valor = form.tipo === "Saída" ? -Math.abs(form.valor) : Math.abs(form.valor);
            onSave({ ...form, valor });
          }}
          className="flex-1 px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          {data ? "Salvar Alterações" : "Adicionar"}
        </button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [colaboradores, setColaboradores] = useState<Colaborador[]>(COLABS_INIT);
  const [transacoes, setTransacoes] = useState<Transacao[]>(TRANSACOES_INIT);
  const [kanban, setKanban] = useState<KanbanColumn[]>(KANBAN_INIT);
  const [searchColab, setSearchColab] = useState("");
  const [searchTrans, setSearchTrans] = useState("");

  const dragItem = useRef<{ cardId: string; fromCol: string } | null>(null);
  const currentPage = NAV_ITEMS.find(n => n.id === activeNav);

  const handleKanbanDrop = (toColId: string) => {
    if (!dragItem.current) return;
    const { cardId, fromCol } = dragItem.current;
    if (fromCol === toColId) return;
    setKanban(prev => {
      const cols = prev.map(c => ({ ...c, cards: [...c.cards] }));
      const from = cols.find(c => c.id === fromCol)!;
      const to   = cols.find(c => c.id === toColId)!;
      const idx  = from.cards.findIndex(c => c.id === cardId);
      const [card] = from.cards.splice(idx, 1);
      to.cards.push(card);
      return cols;
    });
    dragItem.current = null;
  };

  const filteredColabs = colaboradores.filter(c =>
    [c.nome, c.cargo, c.departamento].some(v => v.toLowerCase().includes(searchColab.toLowerCase()))
  );
  const filteredTrans = transacoes.filter(t =>
    [t.descricao, t.categoria].some(v => v.toLowerCase().includes(searchTrans.toLowerCase()))
  );

  return (
    <div className={cn("flex h-screen overflow-hidden bg-background text-foreground", dark && "dark")} style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Sidebar ── */}
      <aside className={cn("flex flex-col h-full border-r transition-all duration-300 ease-in-out flex-shrink-0", collapsed ? "w-16" : "w-60")} style={{ background: "#0b1628", borderColor: "rgba(255,255,255,0.05)" }}>
        {/* Logo */}
        <div className={cn("flex h-16 px-4 items-center flex-shrink-0", collapsed ? "justify-center" : "gap-3")} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#3b82f6" }}>
            <BarChart2 className="w-4 h-4 text-white" />
          </div>
          {!collapsed && <span className="text-white font-semibold text-sm tracking-tight">AdminTech Hub</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                title={collapsed ? label : undefined}
                className={cn("w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-100 relative", collapsed && "justify-center")}
                style={{ color: active ? "#ffffff" : "#7a8fb0", background: active ? "rgba(255,255,255,0.07)" : "transparent" }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: "#3b82f6" }} />}
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: active ? "#60a5fa" : undefined }} />
                {!collapsed && <span className="font-medium">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 mb-3 px-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg,#60a5fa,#a78bfa)" }}>AD</div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">Admin User</p>
                <p className="text-[11px] truncate" style={{ color: "#4a607a" }}>admin@admintechhub.io</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-xs transition-colors"
            style={{ color: "#7a8fb0" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "#ffffff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#7a8fb0"; }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Recolher</span></>}
          </button>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background flex-shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-foreground">{currentPage?.label}</h1>
            <p className="text-[11px] text-muted-foreground">Quinta-feira, 26 de Junho de 2026</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:text-foreground hover:bg-muted/60 transition-colors">
              <FileText className="w-3.5 h-3.5" />Relatório
            </button>
            <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "#f43f5e" }} />
            </button>
            <button onClick={() => setDark(!dark)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-lg transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeNav === "dashboard"     && <DashboardView dark={dark} />}
          {activeNav === "colaboradores" && (
            <ColaboradoresView
              colaboradores={filteredColabs} search={searchColab} onSearch={setSearchColab} dark={dark}
              onAdd={() => setModal({ type: "addColab" })}
              onEdit={c => setModal({ type: "editColab", data: c })}
              onDelete={id => setColaboradores(prev => prev.filter(c => c.id !== id))}
            />
          )}
          {activeNav === "financeiro" && (
            <FinanceiroView
              transacoes={filteredTrans} search={searchTrans} onSearch={setSearchTrans} dark={dark}
              onAdd={() => setModal({ type: "addTransacao" })}
              onEdit={t => setModal({ type: "editTransacao", data: t })}
              onDelete={id => setTransacoes(prev => prev.filter(t => t.id !== id))}
            />
          )}
          {activeNav === "kanban" && <KanbanView kanban={kanban} dragItem={dragItem} onDrop={handleKanbanDrop} dark={dark} />}
          {activeNav === "matrix"  && <MatrixView dark={dark} />}
        </main>
      </div>

      {/* ── Modals ── */}
      {modal.type && (
        <ModalOverlay onClose={() => setModal({ type: null })}>
          {(modal.type === "addColab" || modal.type === "editColab") && (
            <ColabModal
              data={modal.data as Colaborador | undefined}
              onClose={() => setModal({ type: null })}
              onSave={d => {
                const data = d as typeof COLABS_INIT[0];
                if (modal.type === "addColab") {
                  const parts = data.nome.trim().split(" ");
                  const avatar = parts.map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
                  setColaboradores(prev => [...prev, { ...data, id: Date.now(), avatar }]);
                } else {
                  setColaboradores(prev => prev.map(c => c.id === data.id ? { ...c, ...data } : c));
                }
                setModal({ type: null });
              }}
            />
          )}
          {(modal.type === "addTransacao" || modal.type === "editTransacao") && (
            <TransacaoModal
              data={modal.data as Transacao | undefined}
              onClose={() => setModal({ type: null })}
              onSave={d => {
                const data = d as Transacao;
                if (modal.type === "addTransacao") {
                  setTransacoes(prev => [{ ...data, id: Date.now() }, ...prev]);
                } else {
                  setTransacoes(prev => prev.map(t => t.id === data.id ? { ...t, ...data } : t));
                }
                setModal({ type: null });
              }}
            />
          )}
        </ModalOverlay>
      )}
    </div>
  );
}
