import { Link } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { Locale } from "@family-hub/core";

const SAMPLES: Record<Locale, {
  brushTeeth: string; makeBed: string; read15: string; putLaundry: string; eatVeg: string;
  packBag: string; tidyRoom: string; iceCream: string; screenTime: string;
  justNow: string; minAgo: string;
}> = {
  en: {
    brushTeeth: "Brush teeth", makeBed: "Make the bed", read15: "Read 15 minutes",
    putLaundry: "Put laundry away", eatVeg: "Eat the vegetables",
    packBag: "Pack school bag", tidyRoom: "Tidy room",
    iceCream: "Ice cream", screenTime: "Screen time",
    justNow: "just now", minAgo: "5 min ago",
  },
  zh: {
    brushTeeth: "刷牙", makeBed: "整理床铺", read15: "阅读 15 分钟",
    putLaundry: "收好衣服", eatVeg: "吃蔬菜",
    packBag: "整理书包", tidyRoom: "整理房间",
    iceCream: "冰淇淋", screenTime: "看屏幕时间",
    justNow: "刚刚", minAgo: "5 分钟前",
  },
  vi: {
    brushTeeth: "Đánh răng", makeBed: "Dọn giường", read15: "Đọc 15 phút",
    putLaundry: "Cất quần áo", eatVeg: "Ăn rau",
    packBag: "Chuẩn bị cặp", tidyRoom: "Dọn phòng",
    iceCream: "Kem", screenTime: "Thời gian xem màn hình",
    justNow: "vừa xong", minAgo: "5 phút trước",
  },
};

function resolveLocale(lng: string | undefined): Locale {
  if (!lng) return "en";
  if (lng.startsWith("zh")) return "zh";
  if (lng.startsWith("vi")) return "vi";
  return "en";
}

export function Landing() {
  const { t, i18n } = useTranslation();
  const loc = resolveLocale(i18n.resolvedLanguage);
  const s = SAMPLES[loc];

  return (
    <div className="landing">
      <FloatingBg />

      <header className="land-nav">
        <div className="land-logo">
          <span style={{ fontSize: 32 }}>👨‍👩‍👧‍👦</span>
          <strong>{t("common.appName")}</strong>
        </div>
        <nav className="row">
          <LanguageSwitcher compact />
          <Link to="/login" className="land-link">{t("landing.navLogin")}</Link>
          <Link to="/register"><button>{t("landing.navGetStarted")}</button></Link>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="hero-badge">{t("landing.heroBadge")}</span>
          <h1 className="hero-title">
            {t("landing.heroTitlePre")}<br />
            <span style={{ color: "var(--accent)" }}>{t("landing.heroTitleAccent")}</span>
            {t("landing.heroTitlePost")}
          </h1>
          <p className="hero-sub">{t("landing.heroSub")}</p>
          <div className="row" style={{ gap: 14, marginTop: 22 }}>
            <Link to="/register"><button className="big">{t("landing.ctaStart")}</button></Link>
            <Link to="/login"><button className="ghost big">{t("landing.ctaHaveAccount")}</button></Link>
          </div>
          <div className="muted" style={{ marginTop: 16 }}>{t("landing.finePrint")}</div>
        </div>
        <HeroMockup s={s} />
      </section>

      <section className="features">
        <h2 className="section-title">{t("landing.sectionFeatures")}</h2>
        <div className="feature-grid">
          <FeatureCard emoji="✅" color="#bae6fd"
            title={t("landing.features.routinesTitle")} text={t("landing.features.routinesText")} />
          <FeatureCard emoji="⭐" color="#fef3c7"
            title={t("landing.features.starsTitle")} text={t("landing.features.starsText")} />
          <FeatureCard emoji="🎁" color="#fecaca"
            title={t("landing.features.rewardsTitle")} text={t("landing.features.rewardsText")} />
          <FeatureCard emoji="📬" color="#ddd6fe"
            title={t("landing.features.approvalTitle")} text={t("landing.features.approvalText")} />
          <FeatureCard emoji="📅" color="#bbf7d0"
            title={t("landing.features.calendarTitle")} text={t("landing.features.calendarText")} />
          <FeatureCard emoji="👨‍👩‍👧" color="#fed7aa"
            title={t("landing.features.multiKidTitle")} text={t("landing.features.multiKidText")} />
        </div>
      </section>

      <section className="how">
        <h2 className="section-title">{t("landing.sectionHow")}</h2>
        <div className="how-grid">
          <Step n={1} emoji="🏡" title={t("landing.steps.s1Title")} text={t("landing.steps.s1Text")} />
          <Step n={2} emoji="📋" title={t("landing.steps.s2Title")} text={t("landing.steps.s2Text")} />
          <Step n={3} emoji="🎉" title={t("landing.steps.s3Title")} text={t("landing.steps.s3Text")} />
        </div>
      </section>

      <section className="showcase">
        <div className="shot">
          <div className="shot-caption">
            <h2>{t("landing.showcase.tasksH2")}</h2>
            <p><Trans i18nKey="landing.showcase.tasksText" components={{ 1: <strong /> }} /></p>
          </div>
          <TasksMockup s={s} />
        </div>
        <div className="shot reverse">
          <div className="shot-caption">
            <h2>{t("landing.showcase.requestsH2")}</h2>
            <p><Trans i18nKey="landing.showcase.requestsText" components={{ 1: <strong /> }} /></p>
          </div>
          <RequestsMockup s={s} />
        </div>
      </section>

      <section className="cta">
        <div className="cta-box">
          <div style={{ fontSize: 72 }}>🏡✨</div>
          <h2 className="section-title" style={{ margin: 0 }}>{t("landing.finalCtaTitle")}</h2>
          <p className="muted" style={{ maxWidth: 520, textAlign: "center" }}>{t("landing.finalCtaText")}</p>
          <Link to="/register"><button className="big">{t("landing.finalCtaBtn")}</button></Link>
        </div>
      </section>

      <footer className="land-foot">
        <span>👨‍👩‍👧‍👦 {t("common.appName")}</span>
        <span className="muted">{t("landing.footer", { year: new Date().getFullYear() })}</span>
      </footer>
    </div>
  );
}

type Samples = (typeof SAMPLES)[Locale];

function FeatureCard({ emoji, title, text, color }: { emoji: string; title: string; text: string; color: string }) {
  return (
    <div className="feature-card" style={{ background: `linear-gradient(135deg, #fff 60%, ${color})` }}>
      <div style={{ fontSize: 48 }}>{emoji}</div>
      <h3>{title}</h3>
      <p className="muted" style={{ fontSize: 15, lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function Step({ n, emoji, title, text }: { n: number; emoji: string; title: string; text: string }) {
  return (
    <div className="step-card">
      <div className="step-num">{n}</div>
      <div style={{ fontSize: 56, marginTop: 8 }}>{emoji}</div>
      <h3 style={{ margin: "10px 0 4px" }}>{title}</h3>
      <p className="muted" style={{ fontSize: 15 }}>{text}</p>
    </div>
  );
}

function FloatingBg() {
  const emojis = ["⭐", "🎁", "🧸", "🪥", "📚", "🚲", "🎨", "🍎", "🧩", "🎮"];
  return (
    <div className="floating-bg" aria-hidden>
      {emojis.map((e, i) => (
        <span key={i} style={{
          left: `${(i * 97 + 13) % 100}%`,
          top: `${(i * 53 + 7) % 100}%`,
          animationDelay: `${(i % 5) * 0.6}s`,
          fontSize: 20 + (i % 4) * 8,
          opacity: 0.14 + (i % 3) * 0.05,
        }}>{e}</span>
      ))}
    </div>
  );
}

function HeroMockup({ s }: { s: Samples }) {
  const { t } = useTranslation();
  return (
    <div className="hero-mock">
      <div className="phone">
        <div className="phone-inner">
          <div className="phone-head">
            <span style={{ fontSize: 24 }}>👧</span>
            <strong>Lily</strong>
            <span className="task-stars" style={{ marginLeft: "auto" }}>⭐ 23</span>
          </div>
          <div className="mini-progress"><div style={{ width: "60%" }} /></div>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            {t("dashboard.doneRatio", { done: 3, total: 5 })}
          </div>
          <div className="mini-tasks">
            <MiniTask icon="🪥" title={s.brushTeeth} stars={1} done />
            <MiniTask icon="🛏️" title={s.makeBed} stars={2} done />
            <MiniTask icon="📚" title={s.read15} stars={3} />
            <MiniTask icon="🧦" title={s.putLaundry} stars={2} done />
            <MiniTask icon="🥦" title={s.eatVeg} stars={2} />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniTask({ icon, title, stars, done }: { icon: string; title: string; stars: number; done?: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="mini-task" style={done ? { opacity: 0.5 } : {}}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 700, textDecoration: done ? "line-through" : "none" }}>{title}</span>
      <span className="task-stars" style={{ fontSize: 14 }}>⭐ {stars}</span>
      {done ? <span className="pill ok">✓</span> : <span className="pill warn">{t("tasks.doneBtn")}</span>}
    </div>
  );
}

function TasksMockup({ s }: { s: Samples }) {
  const { t } = useTranslation();
  return (
    <div className="mock-browser">
      <div className="mb-head"><span /><span /><span /></div>
      <div className="mb-body">
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{t("tasks.morning")}</div>
        <MiniTask icon="🪥" title={s.brushTeeth} stars={1} done />
        <MiniTask icon="🛏️" title={s.makeBed} stars={2} done />
        <MiniTask icon="🎒" title={s.packBag} stars={2} />
        <div style={{ fontSize: 22, fontWeight: 800, margin: "14px 0 10px" }}>{t("tasks.afternoon")}</div>
        <MiniTask icon="📚" title={s.read15} stars={3} />
        <MiniTask icon="🧹" title={s.tidyRoom} stars={2} />
      </div>
    </div>
  );
}

function RequestsMockup({ s }: { s: Samples }) {
  const { t } = useTranslation();
  return (
    <div className="mock-browser">
      <div className="mb-head"><span /><span /><span /></div>
      <div className="mb-body">
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 10 }}>{t("redemptions.title")}</div>
        <div className="mini-task">
          <span style={{ fontSize: 28 }}>🍦</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>
              👧 {t("redemptions.wants", { member: "Lily" })} <em>{s.iceCream}</em>
            </div>
            <div className="muted">⭐ 15 · {s.justNow}</div>
          </div>
          <button className="happy" style={{ padding: "8px 14px" }}>{t("redemptions.approve")}</button>
          <button className="danger" style={{ padding: "8px 14px" }}>✗</button>
        </div>
        <div className="mini-task">
          <span style={{ fontSize: 28 }}>🎮</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>
              👦 {t("redemptions.wants", { member: "Noah" })} <em>{s.screenTime}</em>
            </div>
            <div className="muted">⭐ 20 · {s.minAgo}</div>
          </div>
          <button className="happy" style={{ padding: "8px 14px" }}>✓</button>
          <button className="danger" style={{ padding: "8px 14px" }}>✗</button>
        </div>
      </div>
    </div>
  );
}
