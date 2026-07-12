import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Home, ListChecks, Wallet, Dumbbell, GraduationCap, ChevronLeft, ChevronRight,
  Plus, X, Check, Flame, Target, Clock, Sparkles, Moon, Sunrise, Footprints,
  Brain, TrendingUp, AlertCircle, CalendarDays, PiggyBank, Utensils, BookOpen,
  Code2, Briefcase, Github, Droplet, Wind, PersonStanding, Loader2, ChevronDown,
  ChevronUp, Trash2, Scissors
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

/* ============================================================
   STORAGE — localStorage-backed (this file runs standalone,
   outside Claude, so it uses the browser's own storage)
   ============================================================ */
const store = {
  async get(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
  async set(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error("storage set failed", key, e);
      return false;
    }
  },
};

/* ============================================================
   DATE UTILS
   ============================================================ */
const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const parseISO = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const daysBetween = (isoA, isoB) => {
  const a = parseISO(isoA), b = parseISO(isoB);
  return Math.round((b - a) / 86400000);
};
const monthPrefix = (iso) => iso.slice(0, 7);
const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const formatNice = (iso) => {
  const d = parseISO(iso);
  return `${WEEKDAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
};
const formatShort = (iso) => {
  const d = parseISO(iso);
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`;
};

/* ============================================================
   HABIT DEFINITIONS
   ============================================================ */
const HABITS = [
  { key: "wake", label: "Wake 5–5:30am", icon: Sunrise },
  { key: "sleep", label: "Asleep by 10pm", icon: Moon },
  { key: "steps", label: "10k steps", icon: Footprints },
  { key: "meditation", label: "Meditation", icon: Brain },
  { key: "workout", label: "Workout 60–90min", icon: Dumbbell },
  { key: "stretchAM", label: "Stretch — AM (heavy)", icon: Wind },
  { key: "stretchPM", label: "Stretch — PM (light)", icon: Wind },
  { key: "posture", label: "Posture check", icon: PersonStanding },
  { key: "scalpMassage", label: "Scalp massage", icon: Sparkles },
];
const HAIR_WASH = { key: "hairWash", label: "Hair wash (2x/week)", icon: Scissors };
const PERIOD = { key: "period", label: "Period day", icon: Droplet };
const ALL_TOGGLES = [...HABITS, HAIR_WASH, PERIOD];

function emptyDay() {
  const d = {};
  ALL_TOGGLES.forEach((h) => (d[h.key] = false));
  d.notes = "";
  return d;
}

function dailyPercent(day) {
  if (!day) return 0;
  const done = HABITS.filter((h) => day[h.key]).length;
  return done / HABITS.length;
}

/* ============================================================
   STUDY & EXAMS SEED DATA (from her real timeline)
   ============================================================ */
const SEED_MILESTONES = [
  { id: "internals", label: "Internal exams — 2 papers/day, 5 subjects", date: "2026-07-13", endDate: "2026-07-15", category: "Exam", done: false },
  { id: "ext-cloud", label: "External: Cloud Computing", date: "2026-07-31", category: "Exam", done: false },
  { id: "ext-devops", label: "External: DevOps", date: "2026-08-03", category: "Exam", done: false },
  { id: "ext-ai", label: "External: AI", date: "2026-08-05", category: "Exam", done: false },
  { id: "ext-design", label: "External: Design Thinking", date: "2026-08-07", category: "Exam", done: false },
  { id: "ext-cyber", label: "External: Cybersecurity", date: "2026-08-10", category: "Exam", done: false },
  { id: "ext-practicals", label: "Practicals (2)", date: "2026-08-12", endDate: "2026-08-14", category: "Exam", done: false },
  { id: "cert-pay", label: "Pay ₹1,000 for each of the 3 certifications", date: "2026-08-14", category: "Deadline", done: false },
  { id: "project-start", label: "Start research (2 papers) + major project", date: "2026-08-15", category: "Milestone", done: false },
  { id: "internship-start", label: "6-week mandatory internship begins", date: "2026-08-15", category: "Milestone", done: false },
  { id: "placement-goal", label: "Placement goal — ₹1.5L+/mo, FAANG-track", date: "2026-10-11", category: "Goal", done: false },
  { id: "cert-3-exam", label: "Certification exam #3 (8wk vs 12wk — confirm with teacher)", date: "2026-10-17", category: "Exam", done: false, flag: true },
  { id: "cert-1-exam", label: "Certification exam #1", date: "2026-10-24", category: "Exam", done: false },
  { id: "cert-2-exam", label: "Certification exam #2", date: "2026-10-25", category: "Exam", done: false },
  { id: "coursera-cert", label: "Finish 1 Coursera professional certificate", date: "2027-01-11", category: "Goal", done: false },
];

const SEED_TASKS = [
  { id: "t1", label: "Pick ONE roadmap.sh track and commit to it", category: "Coding", done: false },
  { id: "t2", label: "Learn via one YouTuber (BroCode) + freeCodeCamp + CS50 — don't switch around", category: "Coding", done: false },
  { id: "t3", label: "Build 2–3 small projects before touching AI for structure", category: "Coding", done: false },
  { id: "t4", label: "Reach 50% placement-ready in DSA within 1–1.5 months", category: "DSA & Aptitude", done: false },
  { id: "t5", label: "Daily aptitude practice block", category: "DSA & Aptitude", done: false },
  { id: "t6", label: "Prep STAR-format behavioral answers", category: "Interview Prep", done: false },
  { id: "t7", label: "Mock technical interview practice", category: "Interview Prep", done: false },
  { id: "t8", label: "Clean up the 3 public repos (LICENSE, .env, debug files)", category: "Portfolio & GitHub", done: false },
  { id: "t9", label: "Ship one bigger, portfolio-worthy project (not just commits)", category: "Portfolio & GitHub", done: false },
];

const CATEGORY_ORDER = ["Coding", "DSA & Aptitude", "Interview Prep", "Portfolio & GitHub"];

/* ============================================================
   TILT CARD — subtle 3D hover with a moving specular glare
   ============================================================ */
function TiltCard({ children, className = "", style = {}, strength = 8, glow = true }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50, active: false });

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    const ry = ((px - 50) / 50) * strength;
    const rx = -((py - 50) / 50) * strength;
    setTilt({ rx, ry, px, py, active: true });
  };
  const onLeave = () => setTilt({ rx: 0, ry: 0, px: 50, py: 50, active: false });

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) ${tilt.active ? "scale(1.015)" : "scale(1)"}`,
        ...style,
      }}
    >
      {glow && (
        <div
          className="tilt-glow"
          style={{
            opacity: tilt.active ? 1 : 0,
            background: `radial-gradient(circle at ${tilt.px}% ${tilt.py}%, rgba(255,255,255,0.14), transparent 45%)`,
          }}
        />
      )}
      <div className="tilt-content">{children}</div>
    </div>
  );
}

/* ============================================================
   RING GAUGE — today's habit completion, with per-habit tick marks
   ============================================================ */
function RingGauge({ percent, day, size = 200 }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * Math.max(0, Math.min(1, percent));

  const n = HABITS.length;
  const ticks = HABITS.map((h, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const inner = r - stroke / 2 - 3;
    const outer = r + stroke / 2 + 3;
    const x1 = cx + inner * Math.cos(angle);
    const y1 = cy + inner * Math.sin(angle);
    const x2 = cx + outer * Math.cos(angle);
    const y2 = cy + outer * Math.sin(angle);
    const done = day && day[h.key];
    return (
      <line
        key={h.key}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={done ? "url(#ringGrad)" : "rgba(255,255,255,0.14)"}
        strokeWidth={done ? 3 : 2}
        strokeLinecap="round"
      />
    );
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ring-gauge">
      <defs>
        <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E85D8A" />
          <stop offset="55%" stopColor="#A06BF0" />
          <stop offset="100%" stopColor="#34D8C7" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        transform={`rotate(-90 ${cx} ${cy})`}
        className="ring-progress"
      />
      {ticks}
      <text x={cx} y={cy - 6} textAnchor="middle" className="ring-pct">{Math.round(percent * 100)}%</text>
      <text x={cx} y={cy + 18} textAnchor="middle" className="ring-label">today</text>
    </svg>
  );
}

/* ============================================================
   SMALL UI ATOMS
   ============================================================ */
function StatChip({ icon: Icon, label, value, accent = "rose" }) {
  return (
    <TiltCard className={`stat-chip accent-${accent}`}>
      <div className="stat-chip-icon"><Icon size={18} /></div>
      <div className="stat-chip-body">
        <div className="stat-chip-value">{value}</div>
        <div className="stat-chip-label">{label}</div>
      </div>
    </TiltCard>
  );
}

function SectionTitle({ eyebrow, title, right }) {
  return (
    <div className="section-title-row">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2 className="section-title">{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Toggle({ checked, onChange, icon: Icon, label, compact = false }) {
  return (
    <button
      className={`toggle-tile ${checked ? "on" : ""} ${compact ? "compact" : ""}`}
      onClick={onChange}
      type="button"
    >
      <span className="toggle-icon"><Icon size={compact ? 15 : 18} /></span>
      <span className="toggle-label">{label}</span>
      <span className="toggle-check"><Check size={14} /></span>
    </button>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="empty-state">
      <Icon size={22} />
      <p>{text}</p>
    </div>
  );
}

/* ============================================================
   BACKGROUND — drifting starfield + aurora blobs (pure CSS/canvas)
   ============================================================ */
function Starfield() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let w, h;
    let stars = [];

    const init = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      const count = Math.floor((w * h) / 9000);
      stars = new Array(count).fill(0).map(() => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 1 + 0.2,
        r: Math.random() * 1.3 + 0.3,
        tw: Math.random() * Math.PI * 2,
      }));
    };
    init();

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const twinkle = 0.55 + 0.45 * Math.sin(t / 1200 + s.tw);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230,225,255,${0.5 * twinkle * s.z})`;
        ctx.fill();
        s.x -= 0.015 * s.z;
        if (s.x < 0) s.x = w;
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onResize = () => init();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="bg-layer">
      <canvas ref={canvasRef} className="starfield" />
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />
    </div>
  );
}

/* ============================================================
   NAV
   ============================================================ */
const NAV_ITEMS = [
  { key: "today", label: "Today", icon: Home },
  { key: "habits", label: "Habits", icon: ListChecks },
  { key: "finance", label: "Finances", icon: Wallet },
  { key: "workouts", label: "Workouts", icon: Dumbbell },
  { key: "study", label: "Study", icon: GraduationCap },
];

function NavBar({ active, onChange }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="wordmark">
          <span className="wordmark-ring" />
          LOOP
        </div>
        <nav className="nav-pills">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`nav-pill ${active === item.key ? "active" : ""}`}
              onClick={() => onChange(item.key)}
              type="button"
            >
              <item.icon size={15} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="navbar-date">{formatNice(todayISO())}</div>
      </div>
    </header>
  );
}

/* ============================================================
   CROSS-SECTION CALC HELPERS
   ============================================================ */
function totalPaid(finance) {
  return (finance.payments || []).reduce((s, p) => s + (Number(p.amountPaid) || 0), 0);
}
function debtRemaining(finance) {
  return Math.max(0, (finance.debt?.total || 0) - totalPaid(finance));
}
function monthSpending(finance, monthPfx) {
  return (finance.spending || [])
    .filter((s) => s.date && s.date.startsWith(monthPfx))
    .reduce((sum, s) => sum + (Number(s.amount) || 0) + (Number(s.deliveryFee) || 0), 0);
}
function nextMilestone(study) {
  const t = todayISO();
  const upcoming = (study.milestones || [])
    .filter((m) => !m.done && m.date >= t)
    .sort((a, b) => a.date.localeCompare(b.date));
  return upcoming[0] || null;
}
function workoutsInRange(workouts, fromISO, toISO_) {
  return (workouts.logs || []).filter((w) => w.date >= fromISO && w.date <= toISO_);
}
function last14Trend(habits) {
  const out = [];
  for (let i = 13; i >= 0; i--) {
    const iso = addDays(todayISO(), -i);
    const day = habits.days?.[iso];
    out.push({ date: formatShort(iso), pct: Math.round(dailyPercent(day) * 100) });
  }
  return out;
}

/* ============================================================
   TODAY (DASHBOARD)
   ============================================================ */
function TodaySection({ habits, finance, workouts, study, onToggleHabit, goTo }) {
  const t = todayISO();
  const day = habits.days?.[t] || emptyDay();
  const pct = dailyPercent(day);
  const trend = useMemo(() => last14Trend(habits), [habits]);

  const remaining = debtRemaining(finance);
  const spentThisMonth = monthSpending(finance, monthPrefix(t));
  const treatBudget = finance.treatBudget?.monthly || 0;
  const treatLeft = treatBudget - spentThisMonth;

  const nm = nextMilestone(study);
  const daysToNext = nm ? Math.max(0, daysBetween(t, nm.date)) : null;

  const weekAgo = addDays(t, -6);
  const weekWorkouts = workoutsInRange(workouts, weekAgo, t);
  const weekMinutes = weekWorkouts.reduce((s, w) => s + (Number(w.duration) || 0), 0);

  return (
    <div className="section">
      <SectionTitle eyebrow={formatNice(t)} title="Today, at a glance" />

      <div className="today-grid">
        <TiltCard className="ring-card" strength={5}>
          <RingGauge percent={pct} day={day} size={196} />
          <button className="ghost-btn" onClick={() => goTo("habits")} type="button">
            Log today's habits <ChevronRight size={14} />
          </button>
        </TiltCard>

        <div className="stat-grid">
          <StatChip icon={PiggyBank} label="Debt remaining" value={`₹${remaining.toLocaleString("en-IN")}`} accent="teal" />
          <StatChip
            icon={AlertCircle}
            label={nm ? nm.label : "No upcoming deadlines"}
            value={nm ? `${daysToNext}d` : "—"}
            accent="amber"
          />
          <StatChip icon={Dumbbell} label="Workout min this week" value={weekMinutes} accent="rose" />
          <StatChip
            icon={Utensils}
            label="Treat budget left"
            value={`₹${treatLeft.toLocaleString("en-IN")}`}
            accent={treatLeft < 0 ? "danger" : "violet"}
          />
        </div>
      </div>

      <TiltCard className="quick-toggles" strength={2} glow={false}>
        <div className="quick-toggles-header">Quick-mark today</div>
        <div className="toggle-grid">
          {ALL_TOGGLES.map((h) => (
            <Toggle
              key={h.key}
              icon={h.icon}
              label={h.label}
              checked={!!day[h.key]}
              onChange={() => onToggleHabit(t, h.key)}
              compact
            />
          ))}
        </div>
      </TiltCard>

      <TiltCard className="trend-card" strength={2} glow={false}>
        <div className="quick-toggles-header">Last 14 days</div>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={trend} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E85D8A" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#E85D8A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#9CA3C7", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#9CA3C7", fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
            <Tooltip
              contentStyle={{ background: "rgba(15,17,30,0.92)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: "#F5F3FF" }}
              formatter={(v) => [`${v}%`, "completion"]}
            />
            <Area type="monotone" dataKey="pct" stroke="#E85D8A" strokeWidth={2} fill="url(#trendFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </TiltCard>
    </div>
  );
}

/* ============================================================
   HABITS SECTION
   ============================================================ */
function HabitsSection({ habits, onToggleHabit, onSetNotes }) {
  const [selected, setSelected] = useState(todayISO());
  const day = habits.days?.[selected] || emptyDay();
  const isToday = selected === todayISO();

  const last14 = useMemo(() => {
    const out = [];
    for (let i = 13; i >= 0; i--) {
      const iso = addDays(todayISO(), -i);
      out.push({ iso, pct: dailyPercent(habits.days?.[iso]) });
    }
    return out;
  }, [habits, selected]);

  const monthPfx = monthPrefix(selected);
  const monthStats = useMemo(() => {
    const daysElapsed = Object.keys(habits.days || {}).filter((k) => k.startsWith(monthPfx) && k <= todayISO()).length || 1;
    const stats = {};
    ALL_TOGGLES.forEach((h) => {
      stats[h.key] = Object.entries(habits.days || {}).filter(([k, v]) => k.startsWith(monthPfx) && v[h.key]).length;
    });
    return { stats, daysElapsed };
  }, [habits, monthPfx]);

  return (
    <div className="section">
      <SectionTitle
        eyebrow="Habits"
        title={isToday ? "Today" : formatNice(selected)}
        right={
          <div className="date-nav">
            <button className="icon-btn" onClick={() => setSelected(addDays(selected, -1))} type="button"><ChevronLeft size={16} /></button>
            {!isToday && (
              <button className="ghost-btn small" onClick={() => setSelected(todayISO())} type="button">Today</button>
            )}
            <button
              className="icon-btn"
              onClick={() => setSelected(addDays(selected, 1))}
              disabled={selected >= todayISO()}
              type="button"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        }
      />

      <TiltCard className="quick-toggles" strength={3} glow={false}>
        <div className="toggle-grid">
          {ALL_TOGGLES.map((h) => (
            <Toggle
              key={h.key}
              icon={h.icon}
              label={h.label}
              checked={!!day[h.key]}
              onChange={() => onToggleHabit(selected, h.key)}
            />
          ))}
        </div>
        <textarea
          className="notes-input"
          placeholder="Notes for this day (optional)…"
          value={day.notes || ""}
          onChange={(e) => onSetNotes(selected, e.target.value)}
          rows={2}
        />
      </TiltCard>

      <TiltCard className="trend-card" strength={2} glow={false}>
        <div className="quick-toggles-header">Last 14 days</div>
        <div className="heat-strip">
          {last14.map((d) => (
            <button
              key={d.iso}
              className={`heat-cell ${d.iso === selected ? "sel" : ""}`}
              style={{ opacity: 0.18 + d.pct * 0.82 }}
              onClick={() => setSelected(d.iso)}
              title={`${formatShort(d.iso)} — ${Math.round(d.pct * 100)}%`}
              type="button"
            />
          ))}
        </div>
      </TiltCard>

      <TiltCard className="trend-card" strength={2} glow={false}>
        <div className="quick-toggles-header">This month so far</div>
        <div className="month-stats">
          {ALL_TOGGLES.map((h) => (
            <div key={h.key} className="month-stat-row">
              <span className="month-stat-icon"><h.icon size={14} /></span>
              <span className="month-stat-label">{h.label}</span>
              <span className="month-stat-value">{monthStats.stats[h.key]}/{monthStats.daysElapsed}</span>
            </div>
          ))}
        </div>
      </TiltCard>
    </div>
  );
}

/* ============================================================
   FINANCE SECTION
   ============================================================ */
const SPEND_TYPES = ["Dine-in", "Takeout", "Delivery"];
const PIE_COLORS = ["#E85D8A", "#A06BF0", "#34D8C7"];

function addMonthsISO(iso, n) {
  const d = parseISO(iso);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

function FinanceSection({ finance, onUpdateDebt, onAddPayment, onTogglePaid, onDeletePayment, onUpdateTreatBudget, onAddSpending, onDeleteSpending }) {
  const debt = finance.debt || { total: 0, monthlyPayment: 0, dueDay: 5 };
  const paid = totalPaid(finance);
  const remaining = Math.max(0, (debt.total || 0) - paid);
  const progressPct = debt.total ? Math.min(1, paid / debt.total) : 0;
  const monthsLeft = debt.monthlyPayment > 0 ? Math.ceil(remaining / debt.monthlyPayment) : null;
  const payoffDate = monthsLeft != null ? addMonthsISO(todayISO(), monthsLeft) : null;

  const t = todayISO();
  const mPfx = monthPrefix(t);
  const spentThisMonth = monthSpending(finance, mPfx);
  const budget = finance.treatBudget?.monthly || 0;
  const left = budget - spentThisMonth;

  const pieData = useMemo(() => {
    const totals = { "Dine-in": 0, Takeout: 0, Delivery: 0 };
    (finance.spending || [])
      .filter((s) => s.date && s.date.startsWith(mPfx))
      .forEach((s) => {
        totals[s.type] = (totals[s.type] || 0) + (Number(s.amount) || 0) + (Number(s.deliveryFee) || 0);
      });
    return SPEND_TYPES.map((k) => ({ name: k, value: totals[k] })).filter((d) => d.value > 0);
  }, [finance.spending, mPfx]);

  const [payAmt, setPayAmt] = useState(debt.monthlyPayment || "");
  const [payDate, setPayDate] = useState(t);

  const [sDate, setSDate] = useState(t);
  const [sPlace, setSPlace] = useState("");
  const [sType, setSType] = useState("Dine-in");
  const [sAmount, setSAmount] = useState("");
  const [sFee, setSFee] = useState("");

  const sortedPayments = [...(finance.payments || [])].sort((a, b) => b.date.localeCompare(a.date));
  const sortedSpending = [...(finance.spending || [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="section">
      <SectionTitle eyebrow="Finances" title="Debt payoff & treat budget" />

      <TiltCard className="panel" strength={3} glow={false}>
        <div className="panel-header">
          <PiggyBank size={16} /> <span>Debt snapshot</span>
        </div>
        <div className="field-row">
          <label>Total debt (₹)</label>
          <input type="number" value={debt.total || ""} onChange={(e) => onUpdateDebt({ total: Number(e.target.value) || 0 })} />
        </div>
        <div className="field-row">
          <label>Monthly payment (₹)</label>
          <input type="number" value={debt.monthlyPayment || ""} onChange={(e) => onUpdateDebt({ monthlyPayment: Number(e.target.value) || 0 })} />
        </div>
        <div className="field-row">
          <label>Due day of month</label>
          <input type="number" value={debt.dueDay || ""} onChange={(e) => onUpdateDebt({ dueDay: Number(e.target.value) || 0 })} />
        </div>

        <div className="progress-outer">
          <div className="progress-inner" style={{ width: `${progressPct * 100}%` }} />
        </div>
        <div className="progress-caption">
          <span>₹{paid.toLocaleString("en-IN")} paid</span>
          <span>₹{remaining.toLocaleString("en-IN")} left</span>
        </div>
        {payoffDate && remaining > 0 && (
          <div className="hint-text">Est. payoff around {formatNice(payoffDate)}, at this rate.</div>
        )}
        {remaining <= 0 && debt.total > 0 && <div className="hint-text success">Paid off. 🎉</div>}

        <div className="add-row">
          <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
          <input type="number" placeholder="Amount paid" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
          <button
            className="add-btn"
            type="button"
            onClick={() => {
              if (!payAmt) return;
              onAddPayment({ id: `p${Date.now()}`, date: payDate, amountPaid: Number(payAmt), month: payDate.slice(0, 7) });
              setPayAmt(debt.monthlyPayment || "");
            }}
          >
            <Plus size={14} /> Log payment
          </button>
        </div>

        {sortedPayments.length > 0 && (
          <div className="mini-list">
            {sortedPayments.slice(0, 6).map((p) => (
              <div key={p.id} className="mini-list-row">
                <span>{formatShort(p.date)}</span>
                <span>₹{Number(p.amountPaid).toLocaleString("en-IN")}</span>
                <button className="icon-btn danger" onClick={() => onDeletePayment(p.id)} type="button"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </TiltCard>

      <TiltCard className="panel" strength={3} glow={false}>
        <div className="panel-header">
          <Utensils size={16} /> <span>Treat budget — eating out & desserts</span>
        </div>
        <div className="field-row">
          <label>Monthly treat budget (₹)</label>
          <input
            type="number"
            value={finance.treatBudget?.monthly || ""}
            onChange={(e) => onUpdateTreatBudget(Number(e.target.value) || 0)}
          />
        </div>
        <div className="progress-outer">
          <div
            className="progress-inner"
            style={{ width: `${budget ? Math.min(1, spentThisMonth / budget) * 100 : 0}%`, background: left < 0 ? "linear-gradient(90deg,#F2554F,#F2A65A)" : undefined }}
          />
        </div>
        <div className="progress-caption">
          <span>₹{spentThisMonth.toLocaleString("en-IN")} spent this month</span>
          <span className={left < 0 ? "danger-text" : ""}>{left < 0 ? "Over by " : ""}₹{Math.abs(left).toLocaleString("en-IN")}{left < 0 ? "" : " left"}</span>
        </div>

        {pieData.length > 0 && (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: "rgba(15,17,30,0.92)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                formatter={(v, n) => [`₹${v.toLocaleString("en-IN")}`, n]}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        <div className="add-row wrap">
          <input type="date" value={sDate} onChange={(e) => setSDate(e.target.value)} />
          <input type="text" placeholder="Place / item" value={sPlace} onChange={(e) => setSPlace(e.target.value)} />
          <select value={sType} onChange={(e) => setSType(e.target.value)}>
            {SPEND_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
          </select>
          <input type="number" placeholder="Amount ₹" value={sAmount} onChange={(e) => setSAmount(e.target.value)} />
          <input type="number" placeholder="Delivery fee ₹" value={sFee} onChange={(e) => setSFee(e.target.value)} />
          <button
            className="add-btn"
            type="button"
            onClick={() => {
              if (!sAmount || !sPlace) return;
              onAddSpending({
                id: `s${Date.now()}`, date: sDate, place: sPlace, type: sType,
                amount: Number(sAmount), deliveryFee: Number(sFee) || 0,
              });
              setSPlace(""); setSAmount(""); setSFee("");
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>

        {sortedSpending.length === 0 ? (
          <EmptyState icon={Utensils} text="Nothing logged yet — add what you spend on eating out or delivery." />
        ) : (
          <div className="mini-list">
            {sortedSpending.slice(0, 8).map((s) => (
              <div key={s.id} className="mini-list-row">
                <span>{formatShort(s.date)}</span>
                <span className="grow">{s.place}</span>
                <span className="tag">{s.type}</span>
                <span>₹{(Number(s.amount) + Number(s.deliveryFee || 0)).toLocaleString("en-IN")}</span>
                <button className="icon-btn danger" onClick={() => onDeleteSpending(s.id)} type="button"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </TiltCard>
    </div>
  );
}

/* ============================================================
   WORKOUTS SECTION
   ============================================================ */
const INTENSITIES = ["Light", "Medium", "Heavy"];
const SORENESS = ["Fine", "A little sore", "Very sore"];

function WorkoutsSection({ workouts, onAdd, onDelete }) {
  const t = todayISO();
  const [date, setDate] = useState(t);
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [intensity, setIntensity] = useState("Light");
  const [steps, setSteps] = useState("");
  const [soreness, setSoreness] = useState("Fine");

  const weekAgo = addDays(t, -6);
  const weekLogs = workoutsInRange(workouts, weekAgo, t);
  const weekMinutes = weekLogs.reduce((s, w) => s + (Number(w.duration) || 0), 0);
  const avgSteps = useMemo(() => {
    const logs = workouts.logs || [];
    const withSteps = logs.filter((w) => w.steps);
    if (!withSteps.length) return 0;
    return Math.round(withSteps.reduce((s, w) => s + Number(w.steps), 0) / withSteps.length);
  }, [workouts.logs]);

  const sorted = [...(workouts.logs || [])].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="section">
      <SectionTitle eyebrow="Workouts" title="Session log" />

      <div className="stat-grid three">
        <StatChip icon={Dumbbell} label="Sessions this week" value={weekLogs.length} accent="rose" />
        <StatChip icon={Clock} label="Minutes this week" value={weekMinutes} accent="violet" />
        <StatChip icon={Footprints} label="Avg steps logged" value={avgSteps.toLocaleString("en-IN")} accent="teal" />
      </div>

      <TiltCard className="panel" strength={3} glow={false}>
        <div className="panel-header"><Plus size={16} /><span>Log a session</span></div>
        <div className="add-row wrap">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <input type="text" placeholder="Type (e.g. mobility, strength)" value={type} onChange={(e) => setType(e.target.value)} />
          <input type="number" placeholder="Duration (min)" value={duration} onChange={(e) => setDuration(e.target.value)} />
          <select value={intensity} onChange={(e) => setIntensity(e.target.value)}>
            {INTENSITIES.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <input type="number" placeholder="Steps that day" value={steps} onChange={(e) => setSteps(e.target.value)} />
          <select value={soreness} onChange={(e) => setSoreness(e.target.value)}>
            {SORENESS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            className="add-btn"
            type="button"
            onClick={() => {
              if (!type || !duration) return;
              onAdd({ id: `w${Date.now()}`, date, type, duration: Number(duration), intensity, steps: Number(steps) || 0, soreness });
              setType(""); setDuration(""); setSteps("");
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </TiltCard>

      {sorted.length === 0 ? (
        <EmptyState icon={Dumbbell} text="No sessions logged yet — add your first one above." />
      ) : (
        <div className="workout-list">
          {sorted.map((w) => (
            <TiltCard key={w.id} className="workout-card" strength={3}>
              <div className="workout-card-top">
                <span className="workout-date">{formatShort(w.date)}</span>
                <button className="icon-btn danger" onClick={() => onDelete(w.id)} type="button"><Trash2 size={13} /></button>
              </div>
              <div className="workout-type">{w.type}</div>
              <div className="workout-meta">
                <span>{w.duration} min</span>
                <span className={`pill pill-${w.intensity.toLowerCase()}`}>{w.intensity}</span>
                {w.steps > 0 && <span>{Number(w.steps).toLocaleString("en-IN")} steps</span>}
              </div>
              <div className="workout-soreness">{w.soreness}</div>
            </TiltCard>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   STUDY & EXAMS SECTION
   ============================================================ */
const CATEGORY_ICON = { Exam: BookOpen, Deadline: AlertCircle, Milestone: Flame, Goal: Target };

function StudySection({ study, onToggleMilestone, onAddMilestone, onDeleteMilestone, onToggleTask, onAddTask, onDeleteTask }) {
  const t = todayISO();
  const milestones = [...(study.milestones || [])].sort((a, b) => a.date.localeCompare(b.date));
  const next = milestones.find((m) => !m.done && m.date >= t);

  const [mLabel, setMLabel] = useState("");
  const [mDate, setMDate] = useState(t);
  const [mCat, setMCat] = useState("Deadline");

  const [taskCat, setTaskCat] = useState(CATEGORY_ORDER[0]);
  const [taskLabel, setTaskLabel] = useState("");

  const tasksByCat = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: (study.tasks || []).filter((tk) => tk.category === cat),
  }));

  return (
    <div className="section">
      <SectionTitle eyebrow="Study & Exams" title="Everything on the clock" />

      {next && (
        <TiltCard className="hero-countdown" strength={4}>
          <div className="hero-countdown-days">{Math.max(0, daysBetween(t, next.date))}</div>
          <div className="hero-countdown-body">
            <div className="hero-countdown-label">days until</div>
            <div className="hero-countdown-title">{next.label}</div>
            <div className="hero-countdown-date">{formatNice(next.date)}</div>
          </div>
        </TiltCard>
      )}

      <TiltCard className="panel" strength={2} glow={false}>
        <div className="panel-header"><CalendarDays size={16} /><span>Timeline</span></div>
        <div className="timeline">
          {milestones.map((m) => {
            const Icon = CATEGORY_ICON[m.category] || CalendarDays;
            const isPast = m.date < t && !m.done;
            const dLeft = daysBetween(t, m.date);
            return (
              <div key={m.id} className={`timeline-row ${m.done ? "done" : ""} ${isPast ? "overdue" : ""}`}>
                <button className={`timeline-check ${m.done ? "on" : ""}`} onClick={() => onToggleMilestone(m.id)} type="button">
                  {m.done ? <Check size={13} /> : null}
                </button>
                <div className="timeline-icon"><Icon size={14} /></div>
                <div className="timeline-body">
                  <div className="timeline-label">{m.label}</div>
                  <div className="timeline-meta">
                    <span>{formatNice(m.date)}{m.endDate ? ` – ${formatNice(m.endDate)}` : ""}</span>
                    <span className="tag">{m.category}</span>
                    {m.flag && <span className="tag warn"><AlertCircle size={11} /> confirm duration</span>}
                  </div>
                </div>
                <div className="timeline-days">{m.done ? "done" : isPast ? "overdue" : `${dLeft}d`}</div>
                <button className="icon-btn danger" onClick={() => onDeleteMilestone(m.id)} type="button"><Trash2 size={13} /></button>
              </div>
            );
          })}
        </div>

        <div className="add-row wrap">
          <input type="date" value={mDate} onChange={(e) => setMDate(e.target.value)} />
          <input type="text" placeholder="Add a deadline or milestone…" value={mLabel} onChange={(e) => setMLabel(e.target.value)} className="grow-input" />
          <select value={mCat} onChange={(e) => setMCat(e.target.value)}>
            {Object.keys(CATEGORY_ICON).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            className="add-btn"
            type="button"
            onClick={() => {
              if (!mLabel) return;
              onAddMilestone({ id: `m${Date.now()}`, label: mLabel, date: mDate, category: mCat, done: false });
              setMLabel("");
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </TiltCard>

      <TiltCard className="panel" strength={2} glow={false}>
        <div className="panel-header"><Code2 size={16} /><span>Skill-building checklist</span></div>
        {tasksByCat.map(({ cat, items }) => (
          <div key={cat} className="task-group">
            <div className="task-group-title">{cat}</div>
            {items.map((tk) => (
              <div key={tk.id} className={`task-row ${tk.done ? "done" : ""}`}>
                <button className={`timeline-check ${tk.done ? "on" : ""}`} onClick={() => onToggleTask(tk.id)} type="button">
                  {tk.done ? <Check size={13} /> : null}
                </button>
                <span className="task-label">{tk.label}</span>
                <button className="icon-btn danger" onClick={() => onDeleteTask(tk.id)} type="button"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        ))}
        <div className="add-row">
          <select value={taskCat} onChange={(e) => setTaskCat(e.target.value)}>
            {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="text" placeholder="Add a task…" value={taskLabel} onChange={(e) => setTaskLabel(e.target.value)} className="grow-input" />
          <button
            className="add-btn"
            type="button"
            onClick={() => {
              if (!taskLabel) return;
              onAddTask({ id: `t${Date.now()}`, label: taskLabel, category: taskCat, done: false });
              setTaskLabel("");
            }}
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </TiltCard>
    </div>
  );
}

/* ============================================================
   LOADING SCREEN
   ============================================================ */
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <Starfield />
      <div className="loading-box">
        <Loader2 className="spin" size={26} />
        <span>Waking up LOOP…</span>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
export default function App() {
  const [active, setActive] = useState("today");
  const [loading, setLoading] = useState(true);
  const [habits, setHabits] = useState({ days: {} });
  const [finance, setFinance] = useState({ debt: { total: 0, monthlyPayment: 0, dueDay: 5 }, payments: [], treatBudget: { monthly: 0 }, spending: [] });
  const [workouts, setWorkouts] = useState({ logs: [] });
  const [study, setStudy] = useState({ milestones: SEED_MILESTONES, tasks: SEED_TASKS });

  useEffect(() => {
    (async () => {
      const [h, f, w, s] = await Promise.all([
        store.get("loop-habits"),
        store.get("loop-finance"),
        store.get("loop-workouts"),
        store.get("loop-study"),
      ]);
      if (h) setHabits(h);
      if (f) setFinance(f);
      if (w) setWorkouts(w);
      setStudy(s && s.milestones ? s : { milestones: SEED_MILESTONES, tasks: SEED_TASKS });
      setLoading(false);
    })();
  }, []);

  const updateHabits = useCallback((updater) => {
    setHabits((prev) => {
      const next = updater(prev);
      store.set("loop-habits", next);
      return next;
    });
  }, []);
  const updateFinance = useCallback((updater) => {
    setFinance((prev) => {
      const next = updater(prev);
      store.set("loop-finance", next);
      return next;
    });
  }, []);
  const updateWorkouts = useCallback((updater) => {
    setWorkouts((prev) => {
      const next = updater(prev);
      store.set("loop-workouts", next);
      return next;
    });
  }, []);
  const updateStudy = useCallback((updater) => {
    setStudy((prev) => {
      const next = updater(prev);
      store.set("loop-study", next);
      return next;
    });
  }, []);

  const onToggleHabit = useCallback((dateISO, key) => {
    updateHabits((prev) => {
      const days = { ...(prev.days || {}) };
      const day = { ...(days[dateISO] || emptyDay()) };
      day[key] = !day[key];
      days[dateISO] = day;
      return { ...prev, days };
    });
  }, [updateHabits]);

  const onSetNotes = useCallback((dateISO, notes) => {
    updateHabits((prev) => {
      const days = { ...(prev.days || {}) };
      const day = { ...(days[dateISO] || emptyDay()) };
      day.notes = notes;
      days[dateISO] = day;
      return { ...prev, days };
    });
  }, [updateHabits]);

  const onUpdateDebt = useCallback((patch) => updateFinance((prev) => ({ ...prev, debt: { ...(prev.debt || {}), ...patch } })), [updateFinance]);
  const onAddPayment = useCallback((p) => updateFinance((prev) => ({ ...prev, payments: [...(prev.payments || []), p] })), [updateFinance]);
  const onDeletePayment = useCallback((id) => updateFinance((prev) => ({ ...prev, payments: (prev.payments || []).filter((x) => x.id !== id) })), [updateFinance]);
  const onUpdateTreatBudget = useCallback((val) => updateFinance((prev) => ({ ...prev, treatBudget: { monthly: val } })), [updateFinance]);
  const onAddSpending = useCallback((s) => updateFinance((prev) => ({ ...prev, spending: [...(prev.spending || []), s] })), [updateFinance]);
  const onDeleteSpending = useCallback((id) => updateFinance((prev) => ({ ...prev, spending: (prev.spending || []).filter((x) => x.id !== id) })), [updateFinance]);

  const onAddWorkout = useCallback((w) => updateWorkouts((prev) => ({ ...prev, logs: [...(prev.logs || []), w] })), [updateWorkouts]);
  const onDeleteWorkout = useCallback((id) => updateWorkouts((prev) => ({ ...prev, logs: (prev.logs || []).filter((x) => x.id !== id) })), [updateWorkouts]);

  const onToggleMilestone = useCallback((id) => updateStudy((prev) => ({ ...prev, milestones: (prev.milestones || []).map((m) => (m.id === id ? { ...m, done: !m.done } : m)) })), [updateStudy]);
  const onAddMilestone = useCallback((m) => updateStudy((prev) => ({ ...prev, milestones: [...(prev.milestones || []), m] })), [updateStudy]);
  const onDeleteMilestone = useCallback((id) => updateStudy((prev) => ({ ...prev, milestones: (prev.milestones || []).filter((x) => x.id !== id) })), [updateStudy]);
  const onToggleTask = useCallback((id) => updateStudy((prev) => ({ ...prev, tasks: (prev.tasks || []).map((tk) => (tk.id === id ? { ...tk, done: !tk.done } : tk)) })), [updateStudy]);
  const onAddTask = useCallback((tk) => updateStudy((prev) => ({ ...prev, tasks: [...(prev.tasks || []), tk] })), [updateStudy]);
  const onDeleteTask = useCallback((id) => updateStudy((prev) => ({ ...prev, tasks: (prev.tasks || []).filter((x) => x.id !== id) })), [updateStudy]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="app-root">
      <Starfield />
      <NavBar active={active} onChange={setActive} />
      <main className="main-content">
        {active === "today" && (
          <TodaySection habits={habits} finance={finance} workouts={workouts} study={study} onToggleHabit={onToggleHabit} goTo={setActive} />
        )}
        {active === "habits" && (
          <HabitsSection habits={habits} onToggleHabit={onToggleHabit} onSetNotes={onSetNotes} />
        )}
        {active === "finance" && (
          <FinanceSection
            finance={finance}
            onUpdateDebt={onUpdateDebt}
            onAddPayment={onAddPayment}
            onDeletePayment={onDeletePayment}
            onUpdateTreatBudget={onUpdateTreatBudget}
            onAddSpending={onAddSpending}
            onDeleteSpending={onDeleteSpending}
          />
        )}
        {active === "workouts" && (
          <WorkoutsSection workouts={workouts} onAdd={onAddWorkout} onDelete={onDeleteWorkout} />
        )}
        {active === "study" && (
          <StudySection
            study={study}
            onToggleMilestone={onToggleMilestone}
            onAddMilestone={onAddMilestone}
            onDeleteMilestone={onDeleteMilestone}
            onToggleTask={onToggleTask}
            onAddTask={onAddTask}
            onDeleteTask={onDeleteTask}
          />
        )}
      </main>
    </div>
  );
}
