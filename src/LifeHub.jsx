import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Menu, Bell, Plus, Home as HomeIcon, Calendar, CheckSquare, Wallet,
  MoreHorizontal, Eye, EyeOff, Settings, Sliders, X, ChevronRight, ChevronLeft,
  TrendingUp, TrendingDown, CreditCard, Target, BookOpen, HeartPulse, Sparkles,
  BarChart3, Film, Droplet, Moon, Dumbbell, Utensils, Smile, PenLine, Star,
  Pause, Play, Check, ArrowUpRight, ArrowDownRight, Trash2, Download, Upload,
  Briefcase, Clock, Flame, BookMarked, Receipt, PiggyBank, Ban, ShoppingBag,
  LayoutGrid, GripVertical, Sun, Cloud, LogIn, LogOut, Loader2
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { loadLocalDb, saveLocalDb, pushCloudDb, hydrateFromCloud } from "./lib/cloudSync";

/* ---------------------------------------------------------
   LifeHub — Second Brain pessoal & profissional (pt-BR)
   Design tokens vindos diretamente do brief da usuária.
--------------------------------------------------------- */

const C = {
  bg: "#FAFAF7",
  ink: "#1F2937",
  inkSoft: "#6B7280",
  card: "#FFFFFF",
  lime: "#C8F560",
  dashboard: "#D1C4FF",
  financas: "#A5F387",
  agenda: "#70CFFF",
  habitos: "#FFEA5D",
  trabalho: "#FDBA74",
  metas: "#F9A8D4",
  estudos: "#C4B5FD",
  saude: "#86EFAC",
  devpessoal: "#FDA4AF",
  estatisticas: "#60A5FA",
  conteudo: "#E5D3B3",
};

const MODULES = [
  { id: "dashboard", label: "Início", icon: HomeIcon, color: C.dashboard },
  { id: "financas", label: "Finanças", icon: Wallet, color: C.financas },
  { id: "agenda", label: "Agenda", icon: Calendar, color: C.agenda },
  { id: "habitos", label: "Hábitos", icon: CheckSquare, color: C.habitos },
  { id: "trabalho", label: "Trabalho", icon: Briefcase, color: C.trabalho },
  { id: "metas", label: "Metas & OKRs", icon: Target, color: C.metas },
  { id: "estudos", label: "Estudos", icon: BookOpen, color: C.estudos },
  { id: "saude", label: "Saúde", icon: HeartPulse, color: C.saude },
  { id: "devpessoal", label: "Dev. Pessoal", icon: Sparkles, color: C.devpessoal },
  { id: "estatisticas", label: "Estatísticas", icon: BarChart3, color: C.estatisticas },
  { id: "conteudo", label: "Conteúdo", icon: Film, color: C.conteudo },
];

const MOBILE_TABS = ["dashboard", "agenda", "habitos", "financas"];

const brl = (n) =>
  (n < 0 ? "-" : "") +
  "R$ " +
  Math.abs(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const initials = (name) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];

function seedDB() {
  return {
    user: { name: "Rhayanne", handle: "", avatar: "R" },
    settings: { theme: "claro", waterGoal: 8, reduceMotion: false, style: "padrao" },
    water: { current: 0 },
    habits: [],
    agenda: [],
    finance: {
      hideBalance: false,
      accounts: [],
      cards: [],
      transactions: [],
      goals: [],
      subscriptions: [],
      limits: [],
    },
    work: { tasks: [] },
    goalsOKR: { items: [] },
    study: { subjects: [], flashcards: [] },
    health: { sleep: [], workout: [], meals: [] },
    personalDev: {
      wheel: [
        { area: "Carreira", score: 0 },
        { area: "Finanças", score: 0 },
        { area: "Saúde", score: 0 },
        { area: "Espiritualidade", score: 0 },
        { area: "Relacionamentos", score: 0 },
        { area: "Criatividade", score: 0 },
      ],
      mood: "",
      gratitude: [],
      journal: [],
      reading: [],
    },
    content: { pipeline: [] },
    widgets: [],
  };
}

function offsetISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function fmtDay(iso) {
  const d = new Date(iso + "T00:00:00");
  return { wd: WEEKDAYS[d.getDay()], dom: d.getDate(), full: d };
}

/* ---------------- Small UI atoms ---------------- */

function Ring({ pct, size = 96, stroke = 10, color = "#1F2937", track = "rgba(31,41,55,0.12)" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
      />
    </svg>
  );
}

function Bar_({ pct, color }) {
  return (
    <div className="w-full h-2 rounded-full" style={{ background: "rgba(31,41,55,0.08)" }}>
      <div
        className="h-2 rounded-full"
        style={{ width: `${Math.min(100, pct)}%`, background: color, transition: "width 0.5s ease-out" }}
      />
    </div>
  );
}

function Avatar({ name, color, size = 36 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0"
      style={{ width: size, height: size, background: color, color: "#fff", fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  );
}

function Pill({ children, color }) {
  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: color + "33", color: "#1F2937" }}>
      {children}
    </span>
  );
}

function PressBtn({ children, onClick, className = "", style }) {
  return (
    <button
      onClick={onClick}
      className={"transition-transform active:scale-[0.97] " + className}
      style={style}
    >
      {children}
    </button>
  );
}

function SectionTitle({ children, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[15px] font-semibold tracking-tight" style={{ color: C.ink }}>{children}</h2>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc, cta, onCta }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-3xl" style={{ background: "#fff" }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: C.bg }}>
        <Icon size={24} style={{ color: C.inkSoft }} />
      </div>
      <p className="font-semibold text-[15px]" style={{ color: C.ink }}>{title}</p>
      <p className="text-sm mt-1 max-w-xs" style={{ color: C.inkSoft }}>{desc}</p>
      {cta && (
        <PressBtn onClick={onCta} className="mt-4 px-4 py-2 rounded-full text-sm font-semibold" style={{ background: C.ink, color: "#fff" }}>
          {cta}
        </PressBtn>
      )}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(31,41,55,0.4)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={"bg-white rounded-t-[28px] sm:rounded-[28px] w-full sm:max-h-[85vh] overflow-y-auto animate-slideup " + (wide ? "sm:max-w-lg" : "sm:max-w-md")}
        style={{ maxHeight: "90vh" }}
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 pt-5 pb-3 rounded-t-[28px]">
          <h3 className="text-lg font-bold" style={{ color: C.ink }}>{title}</h3>
          <PressBtn onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.bg }}>
            <X size={16} />
          </PressBtn>
        </div>
        <div className="px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}

/* ---------------- Home / Dashboard ---------------- */

function Home({ db, setDb, goto, isDesktop }) {
  const [selected, setSelected] = useState(todayISO());
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);

  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => offsetISO(i - 3)), []);
  const habitsDone = db.habits.filter((h) => h.done).length;
  const habitsPct = db.habits.length ? Math.round((habitsDone / db.habits.length) * 100) : 0;
  const waterPct = Math.round((db.water.current / db.settings.waterGoal) * 100);
  const weekProgress = Math.round((habitsPct + waterPct) / 2);

  const dayAgenda = db.agenda.filter((a) => a.date === selected).sort((a, b) => a.time.localeCompare(b.time));

  const toggleWater = (delta) => {
    setDb((p) => ({ ...p, water: { current: Math.max(0, Math.min(p.settings.waterGoal, p.water.current + delta)) } }));
  };

  const addWidget = (module, type) => {
    setDb((p) => ({ ...p, widgets: [...p.widgets, { id: "wd" + Date.now(), module, type }] }));
    setAddWidgetOpen(false);
  };
  const removeWidget = (id) => setDb((p) => ({ ...p, widgets: p.widgets.filter((w) => w.id !== id) }));

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-5xl mx-auto">
      {/* Hero */}
      <div className="rounded-[28px] p-6 flex items-center justify-between mb-4" style={{ background: C.lime }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#3F5B00" }}>Semana de {selectedMonth()}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: C.ink }}>Seu progresso<br />da semana</p>
          <p className="text-sm mt-2" style={{ color: "#3F5B00" }}>{weekProgress}% concluído entre hábitos e água</p>
        </div>
        <Ring pct={weekProgress} color={C.ink} track="rgba(31,41,55,0.15)" />
      </div>

      {/* Habits + Water */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <PressBtn onClick={() => goto("habitos")} className="rounded-3xl p-4 text-left" style={{ background: "#fff" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: C.habitos }}>
            <CheckSquare size={18} style={{ color: C.ink }} />
          </div>
          <p className="text-xs" style={{ color: C.inkSoft }}>Hábitos hoje</p>
          <p className="text-xl font-bold" style={{ color: C.ink }}>{habitsPct}%</p>
          <div className="mt-2"><Bar_ pct={habitsPct} color="#E8CC00" /></div>
        </PressBtn>
        <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: C.agenda }}>
            <Droplet size={18} style={{ color: C.ink }} />
          </div>
          <p className="text-xs" style={{ color: C.inkSoft }}>Água</p>
          <p className="text-xl font-bold" style={{ color: C.ink }}>{db.water.current}/{db.settings.waterGoal} copos</p>
          <div className="flex gap-2 mt-2">
            <PressBtn onClick={() => toggleWater(-1)} className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: C.bg }}>−</PressBtn>
            <PressBtn onClick={() => toggleWater(1)} className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: C.bg }}>+</PressBtn>
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        {week.map((iso) => {
          const { wd, dom } = fmtDay(iso);
          const active = iso === selected;
          const isToday = iso === todayISO();
          return (
            <PressBtn
              key={iso}
              onClick={() => setSelected(iso)}
              className="flex flex-col items-center justify-center rounded-2xl w-12 h-16 shrink-0"
              style={{ background: active ? C.ink : "#fff", color: active ? "#fff" : C.ink }}
            >
              <span className="text-[10px] font-medium opacity-70">{wd}</span>
              <span className="text-base font-bold mt-1">{dom}</span>
              {isToday && !active && <span className="w-1 h-1 rounded-full mt-1" style={{ background: C.financas }} />}
            </PressBtn>
          );
        })}
      </div>

      {/* Agenda do dia */}
      <div className="rounded-3xl p-4 mb-6" style={{ background: "#fff" }}>
        <SectionTitle action={<PressBtn onClick={() => goto("agenda")} className="text-xs font-semibold flex items-center gap-1" style={{ color: C.inkSoft }}>Ver agenda <ChevronRight size={14} /></PressBtn>}>
          Compromissos
        </SectionTitle>
        {dayAgenda.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: C.inkSoft }}>Nada marcado para este dia. Aproveite para descansar 🤍</p>
        ) : (
          <div className="space-y-1">
            {dayAgenda.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: C.bg }}>
                <span className="text-xs font-semibold w-12 shrink-0" style={{ color: C.inkSoft }}>{a.time}</span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: agendaColor(a.type) }} />
                <span className="text-sm" style={{ color: C.ink }}>{a.title}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Widgets */}
      <SectionTitle action={
        <PressBtn onClick={() => setAddWidgetOpen(true)} className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: C.ink, color: "#fff" }}>
          <Plus size={13} /> Adicionar
        </PressBtn>
      }>
        Meus widgets
      </SectionTitle>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {db.widgets.map((w) => <WidgetCard key={w.id} widget={w} db={db} goto={goto} onRemove={() => removeWidget(w.id)} />)}
        {db.widgets.length === 0 && (
          <div className="col-span-2">
            <EmptyState icon={LayoutGrid} title="Sem widgets ainda" desc="Adicione atalhos dos módulos que você mais usa." cta="Adicionar widget" onCta={() => setAddWidgetOpen(true)} />
          </div>
        )}
      </div>

      <Modal open={addWidgetOpen} onClose={() => setAddWidgetOpen(false)} title="Adicionar widget">
        <p className="text-sm mb-3" style={{ color: C.inkSoft }}>Presets prontos:</p>
        <div className="space-y-2">
          {WIDGET_PRESETS.map((p) => (
            <PressBtn key={p.type + p.module} onClick={() => addWidget(p.module, p.type)} className="w-full flex items-center gap-3 p-3 rounded-2xl text-left" style={{ background: C.bg }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: MODULES.find(m => m.id === p.module).color }}>
                <p.icon size={16} style={{ color: C.ink }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: C.ink }}>{p.label}</p>
                <p className="text-xs" style={{ color: C.inkSoft }}>{MODULES.find(m => m.id === p.module).label}</p>
              </div>
            </PressBtn>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function selectedMonth() { return MONTHS[new Date().getMonth()]; }
function agendaColor(type) {
  return { trabalho: C.trabalho, pessoal: C.metas, estudo: C.estudos, conteudo: C.conteudo }[type] || C.agenda;
}

const WIDGET_PRESETS = [
  { module: "financas", type: "saldo", label: "Saldo total", icon: Wallet },
  { module: "estudos", type: "progresso", label: "Progresso das matérias", icon: BookOpen },
  { module: "trabalho", type: "tarefas", label: "Tarefas em andamento", icon: Briefcase },
  { module: "metas", type: "okrs", label: "Metas & OKRs", icon: Target },
  { module: "saude", type: "sono", label: "Sono da semana", icon: Moon },
  { module: "conteudo", type: "pipeline", label: "Pipeline de conteúdo", icon: Film },
];

function WidgetCard({ widget, db, goto, onRemove }) {
  const mod = MODULES.find((m) => m.id === widget.module);
  let content = null;
  if (widget.type === "saldo") {
    const total = db.finance.accounts.reduce((s, a) => s + a.balance, 0);
    content = <><p className="text-xs" style={{ color: C.inkSoft }}>Saldo total</p><p className="text-lg font-bold" style={{ color: C.ink }}>{brl(total)}</p></>;
  } else if (widget.type === "progresso") {
    const avg = db.study.subjects.length
      ? Math.round(db.study.subjects.reduce((s, x) => s + x.progress, 0) / db.study.subjects.length)
      : 0;
    content = <><p className="text-xs" style={{ color: C.inkSoft }}>Progresso médio</p><p className="text-lg font-bold" style={{ color: C.ink }}>{avg}%</p></>;
  } else if (widget.type === "tarefas") {
    const doing = db.work.tasks.filter((t) => t.status !== "done").length;
    content = <><p className="text-xs" style={{ color: C.inkSoft }}>Tarefas pendentes</p><p className="text-lg font-bold" style={{ color: C.ink }}>{doing}</p></>;
  } else if (widget.type === "okrs") {
    const avg = db.goalsOKR.items.length
      ? Math.round(db.goalsOKR.items.reduce((s, x) => s + x.progress, 0) / db.goalsOKR.items.length)
      : 0;
    content = <><p className="text-xs" style={{ color: C.inkSoft }}>Progresso médio</p><p className="text-lg font-bold" style={{ color: C.ink }}>{avg}%</p></>;
  } else if (widget.type === "sono") {
    const avg = db.health.sleep.length
      ? (db.health.sleep.reduce((s, x) => s + x, 0) / db.health.sleep.length).toFixed(1)
      : "0";
    content = <><p className="text-xs" style={{ color: C.inkSoft }}>Média de sono</p><p className="text-lg font-bold" style={{ color: C.ink }}>{avg}h</p></>;
  } else if (widget.type === "pipeline") {
    const n = db.content.pipeline.filter((c) => c.stage !== "publicado").length;
    content = <><p className="text-xs" style={{ color: C.inkSoft }}>Em produção</p><p className="text-lg font-bold" style={{ color: C.ink }}>{n} itens</p></>;
  }
  return (
    <div className="rounded-3xl p-4 relative group" style={{ background: "#fff" }}>
      <PressBtn onClick={onRemove} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: C.bg }}>
        <X size={12} />
      </PressBtn>
      <PressBtn onClick={() => goto(widget.module)} className="text-left w-full">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: mod.color }}>
          <mod.icon size={17} style={{ color: C.ink }} />
        </div>
        {content}
      </PressBtn>
    </div>
  );
}

/* ---------------- Finanças (completo) ---------------- */

const FIN_TABS = ["Resumo", "Faturas", "Extrato", "Limites", "Metas", "Should I Buy?", "Assinaturas"];
const PIE_COLORS = [C.financas, C.agenda, C.habitos, C.trabalho, C.metas, C.estudos, C.conteudo, C.devpessoal];

function Financas({ db, setDb }) {
  const [tab, setTab] = useState("Resumo");
  const fin = db.finance;
  const totalBalance = fin.accounts.reduce((s, a) => s + a.balance, 0);
  const income = fin.transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = fin.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);

  const byCategory = useMemo(() => {
    const map = {};
    fin.transactions.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [fin.transactions]);

  const toggleHide = () => setDb((p) => ({ ...p, finance: { ...p.finance, hideBalance: !p.finance.hideBalance } }));
  const hidden = fin.hideBalance;
  const mask = (s) => (hidden ? "••••••" : s);

  const payInvoice = (cardId) => {
    setDb((p) => {
      const cards = p.finance.cards.map((c) => (c.id === cardId ? { ...c, used: 0 } : c));
      return { ...p, finance: { ...p.finance, cards } };
    });
  };

  const pauseSub = (id) => {
    setDb((p) => ({ ...p, finance: { ...p.finance, subscriptions: p.finance.subscriptions.map((s) => s.id === id ? { ...s, paused: !s.paused } : s) } }));
  };

  const deposit = (goalId, amount) => {
    setDb((p) => ({ ...p, finance: { ...p.finance, goals: p.finance.goals.map((g) => g.id === goalId ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g) } }));
  };

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
        {FIN_TABS.map((t) => (
          <PressBtn key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-full text-sm font-semibold shrink-0" style={{ background: tab === t ? C.ink : "#fff", color: tab === t ? "#fff" : C.ink }}>
            {t}
          </PressBtn>
        ))}
      </div>

      {tab === "Resumo" && (
        <div className="space-y-4">
          <div className="rounded-[28px] p-6" style={{ background: C.financas }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#2C5A00" }}>Saldo total</p>
              <PressBtn onClick={toggleHide} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.5)" }}>
                {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
              </PressBtn>
            </div>
            <p className="text-3xl font-bold mt-1" style={{ color: C.ink }}>{mask(brl(totalBalance))}</p>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5"><ArrowUpRight size={15} style={{ color: "#2C5A00" }} /><span className="text-sm font-semibold">{mask(brl(income))}</span></div>
              <div className="flex items-center gap-1.5"><ArrowDownRight size={15} style={{ color: "#8A2E00" }} /><span className="text-sm font-semibold">{mask(brl(expense))}</span></div>
            </div>
          </div>

          <div>
            <SectionTitle>Contas</SectionTitle>
            <div className="space-y-2">
              {fin.accounts.map((a) => (
                <div key={a.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#fff" }}>
                  <Avatar name={a.bank} color={a.color} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: C.ink }}>{a.name}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: C.ink }}>{mask(brl(a.balance))}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
            <SectionTitle>Distribuição de gastos</SectionTitle>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
                  </Pie>
                  <Tooltip formatter={(v) => brl(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {byCategory.map((c, i) => (
                <span key={c.name} className="text-xs px-2 py-1 rounded-full flex items-center gap-1.5" style={{ background: C.bg }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />{c.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Faturas" && (
        <div className="space-y-3">
          {fin.cards.map((c) => {
            const pct = Math.round((c.used / c.limit) * 100);
            return (
              <div key={c.id} className="rounded-3xl p-4" style={{ background: "#fff" }}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={c.name} color={c.color} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: C.ink }}>{c.name}</p>
                    <p className="text-xs" style={{ color: C.inkSoft }}>Fecha dia {c.closes} · Vence dia {c.due}</p>
                  </div>
                  <p className="text-sm font-bold" style={{ color: C.ink }}>{brl(c.used)}</p>
                </div>
                <Bar_ pct={pct} color={pct > 85 ? "#EF4444" : c.color} />
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs" style={{ color: C.inkSoft }}>Limite de {brl(c.limit)}</p>
                  <PressBtn onClick={() => payInvoice(c.id)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.ink, color: "#fff" }}>
                    Pagar fatura
                  </PressBtn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "Extrato" && (
        <div className="rounded-3xl p-2 sm:p-4" style={{ background: "#fff" }}>
          {fin.transactions.slice().sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-2 py-3 border-b last:border-0" style={{ borderColor: C.bg }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: t.type === "income" ? C.financas : C.bg }}>
                {t.type === "income" ? <TrendingUp size={16} style={{ color: "#2C5A00" }} /> : <TrendingDown size={16} style={{ color: C.inkSoft }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{t.desc}</p>
                <p className="text-xs" style={{ color: C.inkSoft }}>{t.category} · {new Date(t.date + "T00:00:00").toLocaleDateString("pt-BR")}</p>
              </div>
              <p className="text-sm font-bold shrink-0" style={{ color: t.type === "income" ? "#2C5A00" : C.ink }}>
                {t.type === "income" ? "+" : ""}{brl(t.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "Limites" && (
        <div className="space-y-3">
          {fin.limits.map((l) => {
            const pct = Math.round((l.spent / l.limit) * 100);
            return (
              <div key={l.id} className="rounded-3xl p-4" style={{ background: "#fff" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: C.ink }}>{l.category}</p>
                  <p className="text-xs font-semibold" style={{ color: pct > 90 ? "#EF4444" : C.inkSoft }}>{brl(l.spent)} / {brl(l.limit)}</p>
                </div>
                <Bar_ pct={pct} color={pct > 90 ? "#EF4444" : pct > 70 ? "#F59E0B" : C.financas} />
              </div>
            );
          })}
        </div>
      )}

      {tab === "Metas" && (
        <div className="space-y-3">
          {fin.goals.map((g) => {
            const pct = Math.round((g.saved / g.target) * 100);
            return (
              <div key={g.id} className="rounded-3xl p-4" style={{ background: "#fff" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: g.color }}>
                    <PiggyBank size={18} style={{ color: C.ink }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: C.ink }}>{g.name}</p>
                    <p className="text-xs" style={{ color: C.inkSoft }}>{brl(g.saved)} de {brl(g.target)} · {pct}%</p>
                  </div>
                  <PressBtn onClick={() => deposit(g.id, 100)} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: C.ink, color: "#fff" }}>
                    + R$100
                  </PressBtn>
                </div>
                <Bar_ pct={pct} color={g.color} />
              </div>
            );
          })}
        </div>
      )}

      {tab === "Should I Buy?" && <ShouldIBuy income={income} expense={expense} />}

      {tab === "Assinaturas" && (
        <div className="space-y-2">
          {fin.subscriptions.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#fff", opacity: s.paused ? 0.55 : 1 }}>
              <Avatar name={s.name} color={s.color} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: C.ink }}>{s.name}</p>
                <p className="text-xs" style={{ color: C.inkSoft }}>{brl(s.price)} / {s.cycle}{s.paused ? " · pausada" : ""}</p>
              </div>
              <PressBtn onClick={() => pauseSub(s.id)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.bg }}>
                {s.paused ? <Play size={15} /> : <Pause size={15} />}
              </PressBtn>
            </div>
          ))}
          <p className="text-xs text-center pt-2" style={{ color: C.inkSoft }}>
            Total mensal ativo: {brl(fin.subscriptions.filter((s) => !s.paused).reduce((sum, s) => sum + s.price, 0))}
          </p>
        </div>
      )}
    </div>
  );
}

function ShouldIBuy({ income, expense }) {
  const [price, setPrice] = useState("");
  const [importance, setImportance] = useState(3);
  const p = parseFloat(price.replace(",", ".")) || 0;
  const freeMargin = income - expense;
  const pctOfMargin = freeMargin > 0 ? (p / freeMargin) * 100 : 100;

  let verdict = null;
  if (p > 0) {
    if (pctOfMargin < 10 && importance >= 3) verdict = { text: "Pode comprar — impacto baixo na sua margem livre.", color: C.financas };
    else if (pctOfMargin < 30) verdict = { text: "Dá pra comprar, mas considere esperar o próximo ciclo.", color: C.habitos };
    else verdict = { text: "Melhor esperar — compromete uma boa parte da sua margem livre.", color: "#FCA5A5" };
  }

  return (
    <div className="rounded-3xl p-5" style={{ background: "#fff" }}>
      <p className="text-sm font-semibold mb-3" style={{ color: C.ink }}>Vale a pena comprar?</p>
      <label className="text-xs font-medium" style={{ color: C.inkSoft }}>Preço do item</label>
      <input
        value={price} onChange={(e) => setPrice(e.target.value)} placeholder="R$ 0,00" inputMode="decimal"
        className="w-full mt-1 mb-4 px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: C.bg, color: C.ink }}
      />
      <label className="text-xs font-medium" style={{ color: C.inkSoft }}>Quanto você quer isso? ({importance}/5)</label>
      <input type="range" min="1" max="5" value={importance} onChange={(e) => setImportance(+e.target.value)} className="w-full mt-2 mb-4" />
      {verdict && (
        <div className="rounded-2xl p-4 mt-2" style={{ background: verdict.color + "55" }}>
          <p className="text-sm font-semibold" style={{ color: C.ink }}>{verdict.text}</p>
          <p className="text-xs mt-1" style={{ color: C.inkSoft }}>Isso representa {Math.round(pctOfMargin)}% da sua margem livre estimada este mês.</p>
        </div>
      )}
    </div>
  );
}

/* ---------------- Agenda ---------------- */

function Agenda({ db, setDb }) {
  const [selected, setSelected] = useState(todayISO());
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("09:00");
  const [type, setType] = useState("pessoal");

  const days = useMemo(() => Array.from({ length: 14 }, (_, i) => offsetISO(i - 3)), []);
  const dayItems = db.agenda.filter((a) => a.date === selected).sort((a, b) => a.time.localeCompare(b.time));

  const add = () => {
    if (!title.trim()) return;
    setDb((p) => ({ ...p, agenda: [...p.agenda, { id: "a" + Date.now(), date: selected, time, title, type }] }));
    setTitle(""); setOpen(false);
  };
  const remove = (id) => setDb((p) => ({ ...p, agenda: p.agenda.filter((a) => a.id !== id) }));

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-3xl mx-auto">
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
        {days.map((iso) => {
          const { wd, dom } = fmtDay(iso);
          const active = iso === selected;
          return (
            <PressBtn key={iso} onClick={() => setSelected(iso)} className="flex flex-col items-center justify-center rounded-2xl w-12 h-16 shrink-0" style={{ background: active ? C.agenda : "#fff", color: C.ink }}>
              <span className="text-[10px] opacity-70">{wd}</span>
              <span className="text-base font-bold mt-1">{dom}</span>
            </PressBtn>
          );
        })}
      </div>
      <SectionTitle action={<PressBtn onClick={() => setOpen(true)} className="text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: C.ink, color: "#fff" }}><Plus size={13} />Novo</PressBtn>}>
        {new Date(selected + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
      </SectionTitle>
      {dayItems.length === 0 ? (
        <EmptyState icon={Calendar} title="Nenhum compromisso" desc="Este dia está livre. Que tal aproveitar para descansar ou planejar algo?" cta="Adicionar compromisso" onCta={() => setOpen(true)} />
      ) : (
        <div className="space-y-2">
          {dayItems.map((a) => (
            <div key={a.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#fff" }}>
              <span className="text-sm font-bold w-14 shrink-0" style={{ color: C.ink }}>{a.time}</span>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: agendaColor(a.type) }} />
              <span className="text-sm flex-1" style={{ color: C.ink }}>{a.title}</span>
              <PressBtn onClick={() => remove(a.id)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.bg }}><Trash2 size={14} /></PressBtn>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Novo compromisso">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título" className="w-full mb-3 px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: C.bg }} />
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full mb-3 px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: C.bg }} />
        <div className="flex gap-2 mb-4">
          {["pessoal", "trabalho", "estudo", "conteudo"].map((t) => (
            <PressBtn key={t} onClick={() => setType(t)} className="px-3 py-1.5 rounded-full text-xs font-semibold capitalize" style={{ background: type === t ? C.ink : C.bg, color: type === t ? "#fff" : C.ink }}>{t}</PressBtn>
          ))}
        </div>
        <PressBtn onClick={add} className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background: C.ink, color: "#fff" }}>Salvar</PressBtn>
      </Modal>
    </div>
  );
}

/* ---------------- Hábitos ---------------- */

function Habitos({ db, setDb }) {
  const toggle = (id) => setDb((p) => ({ ...p, habits: p.habits.map((h) => h.id === id ? { ...h, done: !h.done, streak: !h.done ? h.streak + 1 : Math.max(0, h.streak - 1) } : h) }));
  const periods = [["manha", "Manhã", Sun], ["tarde", "Tarde", Sparkles], ["noite", "Noite", Moon]];
  const donePct = db.habits.length ? Math.round((db.habits.filter(h => h.done).length / db.habits.length) * 100) : 0;

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-3xl mx-auto">
      <div className="rounded-[28px] p-6 mb-5 flex items-center justify-between" style={{ background: C.habitos }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#7A5B00" }}>Hoje</p>
          <p className="text-2xl font-bold" style={{ color: C.ink }}>{donePct}% concluído</p>
        </div>
        <Ring pct={donePct} size={72} stroke={8} color={C.ink} track="rgba(31,41,55,0.15)" />
      </div>
      {periods.map(([key, label, Icon]) => (
        <div key={key} className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Icon size={15} style={{ color: C.inkSoft }} />
            <p className="text-sm font-semibold" style={{ color: C.inkSoft }}>{label}</p>
          </div>
          <div className="space-y-2">
            {db.habits.filter((h) => h.period === key).map((h) => (
              <PressBtn key={h.id} onClick={() => toggle(h.id)} className="w-full flex items-center gap-3 rounded-2xl p-3" style={{ background: "#fff" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: h.done ? C.financas : C.bg, border: h.done ? "none" : "2px solid #E5E7EB" }}>
                  {h.done && <Check size={14} style={{ color: "#1F4B00" }} />}
                </div>
                <span className="text-sm flex-1 text-left" style={{ color: C.ink, textDecoration: h.done ? "line-through" : "none", opacity: h.done ? 0.6 : 1 }}>{h.name}</span>
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#EA8C00" }}><Flame size={13} />{h.streak}</span>
              </PressBtn>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Trabalho (Kanban) ---------------- */

function Trabalho({ db, setDb }) {
  const [view, setView] = useState("kanban");
  const cols = [["todo", "A fazer"], ["doing", "Andando"], ["done", "Feito"]];
  const move = (id, status) => setDb((p) => ({ ...p, work: { tasks: p.work.tasks.map((t) => t.id === id ? { ...t, status } : t) } }));

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-5xl mx-auto">
      <div className="flex gap-2 mb-4">
        {["kanban", "lista"].map((v) => (
          <PressBtn key={v} onClick={() => setView(v)} className="px-4 py-2 rounded-full text-sm font-semibold capitalize" style={{ background: view === v ? C.ink : "#fff", color: view === v ? "#fff" : C.ink }}>{v}</PressBtn>
        ))}
      </div>
      {view === "kanban" ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {cols.map(([key, label]) => (
            <div key={key} className="rounded-3xl p-3" style={{ background: "#fff" }}>
              <p className="text-xs font-bold uppercase tracking-wide px-2 py-1 mb-2" style={{ color: C.inkSoft }}>{label} · {db.work.tasks.filter(t => t.status === key).length}</p>
              <div className="space-y-2">
                {db.work.tasks.filter((t) => t.status === key).map((t) => (
                  <div key={t.id} className="rounded-2xl p-3" style={{ background: C.bg }}>
                    <p className="text-sm font-medium" style={{ color: C.ink }}>{t.title}</p>
                    <div className="flex gap-1.5 mt-2">
                      {cols.filter(([k]) => k !== key).map(([k, l]) => (
                        <PressBtn key={k} onClick={() => move(t.id, k)} className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: "#fff", color: C.inkSoft }}>→ {l}</PressBtn>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {db.work.tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: "#fff" }}>
              <Pill color={C.trabalho}>{cols.find(c => c[0] === t.status)[1]}</Pill>
              <span className="text-sm flex-1" style={{ color: C.ink }}>{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Metas & OKRs ---------------- */

function MetasOKR({ db, setDb }) {
  const terms = [["curto", "Curto prazo"], ["medio", "Médio prazo"], ["longo", "Longo prazo"]];
  const bump = (id, d) => setDb((p) => ({ ...p, goalsOKR: { items: p.goalsOKR.items.map((g) => g.id === id ? { ...g, progress: Math.max(0, Math.min(100, g.progress + d)) } : g) } }));
  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-3xl mx-auto space-y-5">
      {terms.map(([key, label]) => (
        <div key={key}>
          <SectionTitle>{label}</SectionTitle>
          <div className="space-y-2">
            {db.goalsOKR.items.filter((g) => g.term === key).map((g) => (
              <div key={g.id} className="rounded-3xl p-4" style={{ background: "#fff" }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: C.ink }}>{g.title}</p>
                  <p className="text-xs font-bold" style={{ color: C.inkSoft }}>{g.progress}%</p>
                </div>
                <Bar_ pct={g.progress} color={g.color} />
                <div className="flex gap-2 mt-2 justify-end">
                  <PressBtn onClick={() => bump(g.id, -10)} className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: C.bg }}>−</PressBtn>
                  <PressBtn onClick={() => bump(g.id, 10)} className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center" style={{ background: C.bg }}>+</PressBtn>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Estudos ---------------- */

function Estudos({ db, setDb }) {
  const [pomodoro, setPomodoro] = useState(1500);
  const [running, setRunning] = useState(false);
  const [flipped, setFlipped] = useState({});
  const timerRef = useRef(null);

  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => setPomodoro((p) => (p > 0 ? p - 1 : 0)), 1000);
    } else clearInterval(timerRef.current);
    return () => clearInterval(timerRef.current);
  }, [running]);

  const mm = String(Math.floor(pomodoro / 60)).padStart(2, "0");
  const ss = String(pomodoro % 60).padStart(2, "0");

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-3xl mx-auto space-y-5">
      <div>
        <SectionTitle>Matérias</SectionTitle>
        <div className="space-y-2">
          {db.study.subjects.map((s) => (
            <div key={s.id} className="rounded-3xl p-4" style={{ background: "#fff" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold" style={{ color: C.ink }}>{s.name}</p>
                <p className="text-xs font-bold" style={{ color: C.inkSoft }}>{s.progress}%</p>
              </div>
              <Bar_ pct={s.progress} color={s.color} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] p-6 text-center" style={{ background: C.estudos }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#3F2E7A" }}>Pomodoro</p>
        <p className="text-4xl font-bold my-3 tabular-nums" style={{ color: C.ink }}>{mm}:{ss}</p>
        <div className="flex justify-center gap-2">
          <PressBtn onClick={() => setRunning((r) => !r)} className="px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: C.ink, color: "#fff" }}>{running ? "Pausar" : "Começar"}</PressBtn>
          <PressBtn onClick={() => { setRunning(false); setPomodoro(1500); }} className="px-5 py-2.5 rounded-full text-sm font-bold" style={{ background: "#fff", color: C.ink }}>Resetar</PressBtn>
        </div>
      </div>

      <div>
        <SectionTitle>Flashcards</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {db.study.flashcards.map((f) => (
            <PressBtn key={f.id} onClick={() => setFlipped((p) => ({ ...p, [f.id]: !p[f.id] }))} className="rounded-3xl p-5 text-left min-h-[110px] flex items-center" style={{ background: "#fff" }}>
              <p className="text-sm font-medium" style={{ color: C.ink }}>{flipped[f.id] ? f.a : f.q}</p>
            </PressBtn>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Saúde ---------------- */

function Saude({ db, setDb }) {
  const toggleMeal = (id) => setDb((p) => ({ ...p, health: { ...p.health, meals: p.health.meals.map((m) => m.id === id ? { ...m, done: !m.done } : m) } }));
  const toggleWorkout = (id) => setDb((p) => ({ ...p, health: { ...p.health, workout: p.health.workout.map((w) => w.id === id ? { ...w, done: !w.done } : w) } }));
  const sleepData = db.health.sleep.map((h, i) => ({ dia: WEEKDAYS[i], horas: h }));

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-3xl mx-auto space-y-5">
      <div className="rounded-[28px] p-6" style={{ background: C.saude }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#1F5B36" }}>Água hoje</p>
            <p className="text-2xl font-bold" style={{ color: C.ink }}>{db.water.current}/{db.settings.waterGoal} copos</p>
          </div>
          <Droplet size={32} style={{ color: C.ink }} />
        </div>
      </div>

      <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
        <SectionTitle>Sono da semana</SectionTitle>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sleepData}>
              <XAxis dataKey="dia" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip formatter={(v) => v + "h"} />
              <Bar dataKey="horas" radius={[8, 8, 0, 0]} fill={C.saude} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <SectionTitle>Treino de hoje</SectionTitle>
        <div className="space-y-2">
          {db.health.workout.map((w) => (
            <PressBtn key={w.id} onClick={() => toggleWorkout(w.id)} className="w-full flex items-center gap-3 rounded-2xl p-3" style={{ background: "#fff" }}>
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: w.done ? C.saude : C.bg }}>{w.done && <Check size={14} />}</div>
              <Dumbbell size={16} style={{ color: C.inkSoft }} />
              <span className="text-sm flex-1 text-left" style={{ color: C.ink, opacity: w.done ? 0.6 : 1, textDecoration: w.done ? "line-through" : "none" }}>{w.name}</span>
            </PressBtn>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Alimentação</SectionTitle>
        <div className="space-y-2">
          {db.health.meals.map((m) => (
            <PressBtn key={m.id} onClick={() => toggleMeal(m.id)} className="w-full flex items-center gap-3 rounded-2xl p-3" style={{ background: "#fff" }}>
              <Utensils size={16} style={{ color: C.inkSoft }} />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium" style={{ color: C.ink }}>{m.name}</p>
                <p className="text-xs" style={{ color: C.inkSoft }}>{m.desc}</p>
              </div>
              <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: m.done ? C.saude : C.bg }}>{m.done && <Check size={14} />}</div>
            </PressBtn>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Dev. Pessoal ---------------- */

function DevPessoal({ db, setDb }) {
  const [journalText, setJournalText] = useState("");
  const addJournal = () => {
    if (!journalText.trim()) return;
    setDb((p) => ({ ...p, personalDev: { ...p.personalDev, journal: [{ id: "j" + Date.now(), date: todayISO(), text: journalText }, ...p.personalDev.journal] } }));
    setJournalText("");
  };
  const moods = ["😞", "😕", "🙂", "😄", "🤩"];

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-3xl mx-auto space-y-5">
      <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
        <SectionTitle>Roda da vida</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {db.personalDev.wheel.map((w) => (
            <div key={w.area} className="rounded-2xl p-3" style={{ background: C.bg }}>
              <p className="text-xs font-medium" style={{ color: C.inkSoft }}>{w.area}</p>
              <p className="text-lg font-bold" style={{ color: C.ink }}>{w.score}/10</p>
              <Bar_ pct={w.score * 10} color={C.devpessoal} />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
        <SectionTitle>Como você está hoje?</SectionTitle>
        <div className="flex gap-2 justify-between">
          {moods.map((m) => (
            <PressBtn key={m} onClick={() => setDb((p) => ({ ...p, personalDev: { ...p.personalDev, mood: m } }))} className="text-2xl w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: db.personalDev.mood === m ? C.devpessoal : C.bg }}>{m}</PressBtn>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
        <SectionTitle>Gratidão</SectionTitle>
        <ul className="space-y-1.5">
          {db.personalDev.gratitude.map((g, i) => (
            <li key={i} className="text-sm flex items-center gap-2" style={{ color: C.ink }}><Star size={13} style={{ color: C.habitos }} />{g}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
        <SectionTitle>Diário</SectionTitle>
        <textarea value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder="Como foi seu dia?" className="w-full px-4 py-3 rounded-2xl text-sm outline-none resize-none" rows={3} style={{ background: C.bg }} />
        <PressBtn onClick={addJournal} className="mt-2 px-4 py-2 rounded-full text-xs font-bold" style={{ background: C.ink, color: "#fff" }}>Salvar entrada</PressBtn>
        <div className="mt-3 space-y-2">
          {db.personalDev.journal.map((j) => (
            <div key={j.id} className="text-sm p-3 rounded-2xl" style={{ background: C.bg, color: C.ink }}>
              <p className="text-xs font-semibold mb-1" style={{ color: C.inkSoft }}>{new Date(j.date + "T00:00:00").toLocaleDateString("pt-BR")}</p>
              {j.text}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
        <SectionTitle>Leituras</SectionTitle>
        <div className="space-y-2">
          {db.personalDev.reading.map((r) => (
            <div key={r.id} className="flex items-center gap-3">
              <BookMarked size={16} style={{ color: C.inkSoft }} />
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: C.ink }}>{r.title}</p>
                <Bar_ pct={r.progress} color={C.devpessoal} />
              </div>
              <span className="text-xs font-bold" style={{ color: C.inkSoft }}>{r.progress}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Estatísticas ---------------- */

function Estatisticas({ db }) {
  const finData = db.finance.transactions.slice(-7).map((t) => ({ dia: new Date(t.date + "T00:00:00").getDate(), valor: t.amount }));
  const habitData = Array.from({ length: 7 }, (_, i) => ({ dia: WEEKDAYS[i], pct: 40 + Math.round(Math.random() * 50) }));
  const studyAvg = db.study.subjects.length
    ? Math.round(db.study.subjects.reduce((s, x) => s + x.progress, 0) / db.study.subjects.length)
    : 0;

  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-4xl mx-auto space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl p-4" style={{ background: C.estatisticas }}>
          <p className="text-xs font-semibold" style={{ color: "#1E3A6B" }}>Progresso estudos</p>
          <p className="text-2xl font-bold" style={{ color: C.ink }}>{studyAvg}%</p>
        </div>
        <div className="rounded-3xl p-4" style={{ background: C.financas }}>
          <p className="text-xs font-semibold" style={{ color: "#2C5A00" }}>Saldo total</p>
          <p className="text-2xl font-bold" style={{ color: C.ink }}>{brl(db.finance.accounts.reduce((s, a) => s + a.balance, 0))}</p>
        </div>
      </div>

      <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
        <SectionTitle>Movimentações recentes</SectionTitle>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finData}>
              <XAxis dataKey="dia" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip formatter={(v) => brl(v)} />
              <Line type="monotone" dataKey="valor" stroke={C.estatisticas} strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl p-4" style={{ background: "#fff" }}>
        <SectionTitle>Hábitos — últimos 7 dias</SectionTitle>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={habitData}>
              <XAxis dataKey="dia" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis hide />
              <Tooltip formatter={(v) => v + "%"} />
              <Bar dataKey="pct" radius={[8, 8, 0, 0]} fill={C.habitos} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Conteúdo ---------------- */

function Conteudo({ db, setDb }) {
  const stages = [["ideia", "Ideia"], ["roteiro", "Roteiro"], ["gravar", "Gravar"], ["editar", "Editar"], ["publicado", "Publicado"]];
  const move = (id, stage) => setDb((p) => ({ ...p, content: { pipeline: p.content.pipeline.map((c) => c.id === id ? { ...c, stage } : c) } }));
  return (
    <div className="pb-28 sm:pb-8 px-4 sm:px-8 pt-4 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {stages.map(([key, label]) => (
          <div key={key} className="rounded-3xl p-3" style={{ background: "#fff" }}>
            <p className="text-xs font-bold uppercase tracking-wide px-2 py-1 mb-2" style={{ color: C.inkSoft }}>{label}</p>
            <div className="space-y-2">
              {db.content.pipeline.filter((c) => c.stage === key).map((c) => {
                const idx = stages.findIndex((s) => s[0] === key);
                return (
                  <div key={c.id} className="rounded-2xl p-3" style={{ background: C.bg }}>
                    <p className="text-sm font-medium" style={{ color: C.ink }}>{c.title}</p>
                    <div className="flex gap-1.5 mt-2">
                      {idx > 0 && <PressBtn onClick={() => move(c.id, stages[idx - 1][0])} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#fff" }}><ChevronLeft size={12} /></PressBtn>}
                      {idx < stages.length - 1 && <PressBtn onClick={() => move(c.id, stages[idx + 1][0])} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "#fff" }}><ChevronRight size={12} /></PressBtn>}
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

/* ---------------- Config ---------------- */

function ConfigDrawer({ open, onClose, db, setDb, session, syncStatus, onAuthChange }) {
  const fileRef = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState("");

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "lifehub-dados.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try { setDb(JSON.parse(ev.target.result)); } catch { alert("Arquivo inválido."); }
    };
    reader.readAsText(file);
  };

  const runAuth = async (mode) => {
    if (!supabase) {
      setAuthMsg("Supabase não configurado.");
      return;
    }
    if (!email.trim() || password.length < 6) {
      setAuthMsg("Use e-mail válido e senha com pelo menos 6 caracteres.");
      return;
    }
    setAuthBusy(true);
    setAuthMsg("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setAuthMsg("Conta criada. Se pedir confirmação, abra o e-mail — depois entre com a mesma senha.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        setAuthMsg("");
        setPassword("");
      }
      onAuthChange?.();
    } catch (err) {
      setAuthMsg(err?.message || "Falha na autenticação.");
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    if (!supabase) return;
    setAuthBusy(true);
    try {
      await supabase.auth.signOut();
      setAuthMsg("Saiu da conta. Os dados deste aparelho continuam salvos localmente.");
      onAuthChange?.();
    } catch (err) {
      setAuthMsg(err?.message || "Não foi possível sair.");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Configurações">
      <div className="space-y-5">
        <div className="rounded-2xl p-4 space-y-3" style={{ background: C.bg }}>
          <div className="flex items-center gap-2">
            <Cloud size={16} style={{ color: C.ink }} />
            <p className="text-sm font-bold" style={{ color: C.ink }}>Sync PC ↔ iPhone</p>
          </div>
          {!isSupabaseConfigured ? (
            <p className="text-xs" style={{ color: C.inkSoft }}>Configure as variáveis VITE_SUPABASE_* para ativar a nuvem.</p>
          ) : session?.user ? (
            <>
              <p className="text-xs" style={{ color: C.inkSoft }}>
                Conectada como <span className="font-semibold" style={{ color: C.ink }}>{session.user.email}</span>
              </p>
              <p className="text-[11px]" style={{ color: C.inkSoft }}>
                {syncStatus === "syncing" && "Sincronizando…"}
                {syncStatus === "ok" && "Dados sincronizados na nuvem."}
                {syncStatus === "error" && "Falha ao sincronizar — tente de novo em instantes."}
                {syncStatus === "idle" && "Pronto para sincronizar."}
              </p>
              <PressBtn
                onClick={signOut}
                disabled={authBusy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: "#fff", color: C.ink }}
              >
                {authBusy ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
                Sair
              </PressBtn>
            </>
          ) : (
            <>
              <p className="text-xs" style={{ color: C.inkSoft }}>
                Crie uma conta (ou entre) com o mesmo e-mail no PC e no iPhone para ter os mesmos dados.
              </p>
              <input
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: "#fff" }}
              />
              <input
                type="password"
                autoComplete="current-password"
                placeholder="senha (mín. 6)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: "#fff" }}
              />
              <div className="flex gap-2">
                <PressBtn
                  onClick={() => runAuth("login")}
                  disabled={authBusy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: C.ink, color: "#fff" }}
                >
                  {authBusy ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                  Entrar
                </PressBtn>
                <PressBtn
                  onClick={() => runAuth("signup")}
                  disabled={authBusy}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
                  style={{ background: "#fff", color: C.ink }}
                >
                  Criar conta
                </PressBtn>
              </div>
            </>
          )}
          {authMsg && <p className="text-xs" style={{ color: C.inkSoft }}>{authMsg}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Nome de exibição</label>
          <input value={db.user.name} onChange={(e) => setDb((p) => ({ ...p, user: { ...p.user, name: e.target.value } }))} className="w-full mt-1 px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: C.bg }} />
        </div>
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: C.inkSoft }}>Tema</p>
          <div className="flex gap-2">
            {["claro", "escuro"].map((t) => (
              <PressBtn key={t} onClick={() => setDb((p) => ({ ...p, settings: { ...p.settings, theme: t } }))} className="px-4 py-2 rounded-full text-xs font-semibold capitalize" style={{ background: db.settings.theme === t ? C.ink : C.bg, color: db.settings.theme === t ? "#fff" : C.ink }}>{t}</PressBtn>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: C.inkSoft }}>Estilo visual</p>
          <div className="flex gap-2">
            {["padrao", "glass", "minimal"].map((t) => (
              <PressBtn key={t} onClick={() => setDb((p) => ({ ...p, settings: { ...p.settings, style: t } }))} className="px-4 py-2 rounded-full text-xs font-semibold capitalize" style={{ background: db.settings.style === t ? C.ink : C.bg, color: db.settings.style === t ? "#fff" : C.ink }}>{t}</PressBtn>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Meta de água (copos)</label>
          <input type="number" value={db.settings.waterGoal} onChange={(e) => setDb((p) => ({ ...p, settings: { ...p.settings, waterGoal: +e.target.value } }))} className="w-full mt-1 px-4 py-3 rounded-2xl text-sm outline-none" style={{ background: C.bg }} />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: C.ink }}>Reduzir movimento</p>
          <PressBtn onClick={() => setDb((p) => ({ ...p, settings: { ...p.settings, reduceMotion: !p.settings.reduceMotion } }))} className="w-12 h-7 rounded-full p-1 flex" style={{ background: db.settings.reduceMotion ? C.ink : "#E5E7EB" }}>
            <span className="w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: db.settings.reduceMotion ? "translateX(20px)" : "translateX(0)" }} />
          </PressBtn>
        </div>
        <div className="flex gap-2 pt-2">
          <PressBtn onClick={exportJSON} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold" style={{ background: C.bg, color: C.ink }}><Download size={15} />Exportar</PressBtn>
          <PressBtn onClick={() => fileRef.current.click()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold" style={{ background: C.bg, color: C.ink }}><Upload size={15} />Importar</PressBtn>
          <input ref={fileRef} type="file" accept="application/json" onChange={importJSON} className="hidden" />
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Shell / App ---------------- */

export default function LifeHub() {
  const [db, setDb] = useState(seedDB());
  const [route, setRoute] = useState("dashboard");
  const [isDesktop, setIsDesktop] = useState(typeof window !== "undefined" && window.innerWidth >= 1024);
  const [moreOpen, setMoreOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState(null);
  const [session, setSession] = useState(null);
  const [syncStatus, setSyncStatus] = useState("idle");
  const loadedRef = useRef(false);
  const cloudReadyRef = useRef(false);
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const local = loadLocalDb();
    if (local) setDb(local);
    loadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;

    const applySession = async (next) => {
      setSession(next);
      if (!next?.user) {
        cloudReadyRef.current = false;
        setSyncStatus("idle");
        return;
      }
      setSyncStatus("syncing");
      try {
        const { db: hydrated } = await hydrateFromCloud(next.user.id, dbRef.current);
        if (!cancelled) {
          setDb(hydrated);
          cloudReadyRef.current = true;
          setSyncStatus("ok");
        }
      } catch {
        if (!cancelled) {
          cloudReadyRef.current = true;
          setSyncStatus("error");
        }
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) applySession(data.session);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      applySession(next);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    const t = setTimeout(() => {
      saveLocalDb(db);
      if (session?.user && cloudReadyRef.current) {
        setSyncStatus("syncing");
        pushCloudDb(session.user.id, db)
          .then(() => setSyncStatus("ok"))
          .catch(() => setSyncStatus("error"));
      }
    }, 600);
    return () => clearTimeout(t);
  }, [db, session]);

  const goto = (id) => { setRoute(id); setMoreOpen(false); window.scrollTo(0, 0); };
  const currentModule = MODULES.find((m) => m.id === route);

  const screens = {
    dashboard: <Home db={db} setDb={setDb} goto={goto} isDesktop={isDesktop} />,
    financas: <Financas db={db} setDb={setDb} />,
    agenda: <Agenda db={db} setDb={setDb} />,
    habitos: <Habitos db={db} setDb={setDb} />,
    trabalho: <Trabalho db={db} setDb={setDb} />,
    metas: <MetasOKR db={db} setDb={setDb} />,
    estudos: <Estudos db={db} setDb={setDb} />,
    saude: <Saude db={db} setDb={setDb} />,
    devpessoal: <DevPessoal db={db} setDb={setDb} />,
    estatisticas: <Estatisticas db={db} />,
    conteudo: <Conteudo db={db} setDb={setDb} />,
  };

  return (
    <div className="min-h-screen w-full" style={{ background: C.bg, fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideup { from { transform: translateY(24px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slideup { animation: slideup 0.28s ease-out; }
        input[type=range] { accent-color: ${C.ink}; }
      `}</style>

      <div className="flex">
        {/* Desktop sidebar */}
        {isDesktop && (
          <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col p-5 gap-1" style={{ background: "#fff" }}>
            <div className="flex items-center gap-2 mb-6 px-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold" style={{ background: C.lime, color: C.ink }}>L</div>
              <span className="font-extrabold text-lg tracking-tight">LifeHub</span>
            </div>
            {MODULES.map((m) => (
              <PressBtn key={m.id} onClick={() => goto(m.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-left" style={{ background: route === m.id ? m.color : "transparent", color: C.ink }}>
                <m.icon size={17} />{m.label}
              </PressBtn>
            ))}
            <div className="mt-auto">
              <PressBtn onClick={() => setConfigOpen(true)} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold w-full" style={{ color: C.inkSoft }}>
                <Settings size={17} />Configurações
              </PressBtn>
            </div>
          </aside>
        )}

        <main className="flex-1 min-w-0">
          {/* Header */}
          {isDesktop ? (
            <div className="px-8 pt-6">
              <div className="rounded-[28px] p-6 flex items-center justify-between" style={{ background: currentModule.color }}>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "rgba(31,41,55,0.6)" }}>{MONTHS[new Date().getMonth()]}</p>
                  <p className="text-2xl font-bold" style={{ color: C.ink }}>Olá, {db.user.name.split(" ")[0]} 👋</p>
                  <p className="text-sm" style={{ color: "rgba(31,41,55,0.7)" }}>{currentModule.label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <PressBtn className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.5)" }}><Bell size={17} /></PressBtn>
                  <PressBtn onClick={() => setConfigOpen(true)} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.5)" }}><Sliders size={17} /></PressBtn>
                  <Avatar name={db.user.name} color={C.ink} />
                </div>
              </div>
            </div>
          ) : (
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3" style={{ background: C.bg }}>
              <PressBtn onClick={() => setMoreOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#fff" }}><Menu size={18} /></PressBtn>
              <span className="text-sm font-bold">{currentModule.label}</span>
              <PressBtn className="w-9 h-9 rounded-full flex items-center justify-center relative" style={{ background: "#fff" }}>
                <Bell size={16} />
                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full" style={{ background: "#EF4444" }} />
              </PressBtn>
            </div>
          )}

          {screens[route]}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {!isDesktop && (
        <>
          <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" style={{ background: "#fff", borderTop: "1px solid #F0EFEB" }}>
            {MOBILE_TABS.map((id) => {
              const m = MODULES.find((x) => x.id === id);
              const active = route === id;
              return (
                <PressBtn key={id} onClick={() => goto(id)} className="flex flex-col items-center gap-1 px-3 py-1">
                  <div className="w-9 h-7 rounded-full flex items-center justify-center" style={{ background: active ? m.color : "transparent" }}>
                    <m.icon size={18} style={{ color: C.ink }} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: active ? C.ink : C.inkSoft }}>{m.label}</span>
                </PressBtn>
              );
            })}
            <PressBtn onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-1 px-3 py-1">
              <div className="w-9 h-7 rounded-full flex items-center justify-center"><MoreHorizontal size={18} /></div>
              <span className="text-[10px] font-semibold" style={{ color: C.inkSoft }}>Mais</span>
            </PressBtn>
          </div>

          {/* FAB */}
          <div className="fixed right-4 z-40" style={{ bottom: "88px" }}>
            {fabOpen && (
              <div className="flex flex-col items-end gap-2 mb-2">
                {[["Tarefa", Briefcase, "trabalho"], ["Compromisso", Calendar, "agenda"], ["Despesa", Receipt, "financas"]].map(([label, Icon, mod]) => (
                  <PressBtn key={label} onClick={() => { goto(mod); setFabOpen(false); }} className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full shadow-lg" style={{ background: "#fff" }}>
                    <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: C.bg }}><Icon size={14} /></span>
                    <span className="text-sm font-semibold">{label}</span>
                  </PressBtn>
                ))}
              </div>
            )}
            <PressBtn onClick={() => setFabOpen((f) => !f)} className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg" style={{ background: C.ink, transform: fabOpen ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>
              <Plus size={24} color="#fff" />
            </PressBtn>
          </div>
        </>
      )}

      {/* Mobile "Mais" drawer */}
      <Modal open={moreOpen && !isDesktop} onClose={() => setMoreOpen(false)} title="Todos os módulos">
        <div className="grid grid-cols-2 gap-3">
          {MODULES.map((m) => (
            <PressBtn key={m.id} onClick={() => goto(m.id)} className="flex flex-col items-start gap-2 rounded-2xl p-4" style={{ background: m.color }}>
              <m.icon size={20} style={{ color: C.ink }} />
              <span className="text-sm font-semibold" style={{ color: C.ink }}>{m.label}</span>
            </PressBtn>
          ))}
        </div>
        <PressBtn onClick={() => { setConfigOpen(true); setMoreOpen(false); }} className="w-full flex items-center gap-3 rounded-2xl p-4 mt-3" style={{ background: C.bg }}>
          <Settings size={18} /><span className="text-sm font-semibold">Configurações</span>
        </PressBtn>
      </Modal>

      <ConfigDrawer
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        db={db}
        setDb={setDb}
        session={session}
        syncStatus={syncStatus}
      />

      {!session && isSupabaseConfigured && (
        <div className="fixed left-4 right-4 z-50 sm:left-auto sm:right-6 sm:w-80" style={{ bottom: isDesktop ? "24px" : "100px" }}>
          <PressBtn
            onClick={() => setConfigOpen(true)}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 shadow-lg text-left"
            style={{ background: C.ink, color: "#fff" }}
          >
            <Cloud size={18} />
            <span className="text-sm font-semibold leading-snug">Entre pra sincronizar PC e iPhone</span>
          </PressBtn>
        </div>
      )}
    </div>
  );
}
