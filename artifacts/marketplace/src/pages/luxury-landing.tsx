/*
 * luxury-landing.tsx  (route: / and /luxury)
 * ─────────────────────────────────────────────────────────────────────────────
 * SYANO — Luxury dark editorial homepage with full scrolling section suite.
 * Hero: 3-column animated product grid (100dvh, sticky navbar).
 * Below fold: Popular Categories · Featured Deals · Trusted Stores ·
 *             Trending Products · New Arrivals · Join CTA · Footer bar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef, useMemo, memo, createContext, useContext } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { useTheme } from "next-themes";
import { LuxuryNavbar } from "@/components/LuxuryNavbar";
import {
  useListProducts,
  getListProductsQueryKey,
  useAddToCart,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSellerOnboarding } from "@/hooks/useSellerOnboarding";
import { useCourierOnboarding } from "@/hooks/useCourierOnboarding";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  Store,
  Bike,
  Star,
  Timer,
  Zap,
  ArrowLeft,
  ShoppingBag,
  ExternalLink,
  Instagram,
  Twitter,
  Facebook,
  Youtube,
} from "lucide-react";
import type { Product } from "@workspace/api-client-react";

/* ─── Font injection ─────────────────────────────────────────────────────────*/
const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap');
  .lux-root *, .lux-root { box-sizing: border-box; }
  .lux-root button { cursor: pointer; border: none; outline: none; }
  .lux-root button:focus-visible { outline: 2px solid rgba(22,163,74,0.75); outline-offset: 2px; border-radius: 9999px; }
`;

/* ─── Responsive section grid rules ─────────────────────────────────────────*/
const SECTION_CSS = `
  /* ── Category: 2-col mobile → 4-col desktop ─────────── */
  .lux-cat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  @media (min-width: 640px) { .lux-cat-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; } }

  /* ── Deals bento: hero left + side cards right ───────── */
  .lux-deals-bento { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 768px) {
    .lux-deals-bento { grid-template-columns: 1.6fr 1fr; grid-template-rows: 1fr 1fr; gap: 14px; }
    .lux-deals-hero  { grid-row: 1 / 3; }
  }

  /* ── Stores: 1 → 2 → 3 col ───────────────────────────── */
  .lux-stores-row { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 640px)  { .lux-stores-row { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .lux-stores-row { grid-template-columns: repeat(3, 1fr); gap: 20px; } }

  /* ── Arrivals asymmetric bento ────────────────────────── */
  .lux-arrivals-bento { display: grid; grid-template-columns: 1fr; gap: 14px; }
  @media (min-width: 768px) {
    .lux-arrivals-bento { grid-template-columns: 1.2fr 1fr; grid-template-rows: 1fr 1fr; min-height: 500px; }
    .lux-arrivals-main  { grid-row: 1 / 3; }
  }

  /* ── Join full-bleed split ────────────────────────────── */
  .lux-join-split { display: grid; grid-template-columns: 1fr; }
  @media (min-width: 768px) { .lux-join-split { grid-template-columns: 1fr 1fr; } }

  /* ── Section inner ────────────────────────────────────── */
  .lux-section-inner { max-width: 1400px; margin: 0 auto; padding: 0 2rem; }
  @media (min-width: 768px) { .lux-section-inner { padding: 0 3rem; } }

  .lux-footer-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem 2rem;
    padding: 4rem 0 3rem;
  }
  @media (min-width: 640px) { .lux-footer-grid { grid-template-columns: repeat(4, 1fr); } }
  @media (min-width: 1024px) { .lux-footer-grid { grid-template-columns: 1.25fr 1fr 1fr 1fr 1fr 1.25fr; } }

  .lux-footer-brand, .lux-footer-newsletter { grid-column: 1 / -1; }
  @media (min-width: 640px) {
    .lux-footer-brand { grid-column: 1 / 3; }
    .lux-footer-newsletter { grid-column: 3 / 5; }
  }
  @media (min-width: 1024px) {
    .lux-footer-brand { grid-column: 1 / 2; }
    .lux-footer-newsletter { grid-column: 6 / 7; }
  }

  .lux-footer-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    padding: 1.25rem 0 1.75rem;
    border-top: 1px solid rgba(255,255,255,0.07);
    text-align: center;
  }
  @media (min-width: 768px) {
    .lux-footer-bottom { flex-direction: row; justify-content: space-between; text-align: start; gap: 1rem; }
  }

  .lux-footer-link:hover { color: rgba(255,255,255,0.80) !important; }
  .lux-social-icon:hover { background: rgba(255,255,255,0.10) !important; border-color: rgba(255,255,255,0.18) !important; color: rgba(255,255,255,0.80) !important; }
  .lux-footer-input:focus { border-color: rgba(255,255,255,0.20) !important; }

  /* ── Light mode CSS overrides ─────────────────────────────────────────────
     Hover/focus interactive states that cannot be driven by React context.   */
  html:not(.dark) .lux-footer-bottom { border-top-color: rgba(17,24,39,0.08); }
  html:not(.dark) .lux-footer-link:hover { color: rgba(17,24,39,0.75) !important; }
  html:not(.dark) .lux-social-icon:hover { background: rgba(17,24,39,0.06) !important; border-color: rgba(17,24,39,0.14) !important; color: rgba(17,24,39,0.60) !important; }
  html:not(.dark) .lux-footer-input:focus { border-color: rgba(22,163,74,0.35) !important; }

  .lux-root { text-rendering: optimizeSpeed; }
  .lux-gpu-layer { transform: translateZ(0); backface-visibility: hidden; }
`;

/* ─── Brand tokens — DARK (default) ──────────────────────────────────────────
   Site-wide green accent: #16A34A (confirmed in LuxuryNavbar GREEN constant
   and throughout badges/icons/interactive elements site-wide).
   greenAlpha / greenGlow are alpha variants of the same hue.                */
const C = {
  bg:         "#1A1A1A",   /* hsl(0 0% 10%) — site-wide --background dark token (index.css line 225) */
  card:       "#242424",   /* hsl(0 0% 14%) — site-wide --card dark token; elevated above new bg */
  card2:      "#202020",   /* midpoint between bg and card, preserves three-level elevation */
  white:      "#FFFFFF",
  offWhite:   "#F2F2F0",
  muted:      "rgba(255,255,255,0.52)",
  dimmed:     "rgba(255,255,255,0.28)",
  border:     "rgba(255,255,255,0.08)",
  borderHov:  "rgba(255,255,255,0.16)",
  green:      "#16A34A",
  greenAlpha: "rgba(22,163,74,0.16)",
  greenGlow:  "rgba(22,163,74,0.28)",
} as const;

/* ─── Brand tokens — LIGHT ────────────────────────────────────────────────────
   Every value traceable to existing site-wide tokens in index.css :root.
   background  hsl(210 20% 98%) ≈ #F8FAFC
   card        hsl(0 0% 100%)   = #FFFFFF
   card2       hsl(220 22% 96%) ≈ #EEF0F7 (--section-alt)
   foreground  hsl(221 39% 11%) ≈ #111827 (--foreground)
   muted-fg    hsl(220 13% 32%) ≈ #3D4554 (--muted-foreground)
   border      hsl(220 13% 84%) ≈ #D1D4E0 (--border)
   green / greenAlpha / greenGlow — site-wide accent, unchanged.             */
const CL = {
  bg:         "#F8FAFC",
  card:       "#FFFFFF",
  card2:      "#EEF0F7",
  white:      "#111827",
  offWhite:   "#111827",
  muted:      "#3D4554",
  dimmed:     "rgba(17,24,39,0.50)",
  border:     "#D1D4E0",
  borderHov:  "rgba(17,24,39,0.22)",
  green:      "#16A34A",
  greenAlpha: "rgba(22,163,74,0.10)",
  greenGlow:  "rgba(22,163,74,0.14)",
} as const;

/* ─── Color token type — string-valued so both C (dark) and CL (light) fit ─*/
type ColorTokens = { [K in keyof typeof C]: string };

/* ─── Color context — consumed by all sub-components ────────────────────────
   Defaults to dark tokens; LuxuryLandingPage overrides via resolvedTheme.   */
const LuxColorCtx = createContext<ColorTokens>(C as ColorTokens);

/* ─── Fonts ───────────────────────────────────────────────────────────────────*/
const F = {
  naskh: "'Noto Naskh Arabic', serif",
  sans:  "'Noto Sans Arabic', sans-serif",
} as const;

/* ─── Interfaces ──────────────────────────────────────────────────────────────*/
interface StackItem {
  id:       string;
  label:    string;
  sublabel: string;
  badge:    string;
  imageUrl: string;
  accent:   string;
}

interface DealData {
  id:             number;
  name:           string;
  category:       string;
  price:          number;
  originalPrice:  number | null;
  discountPercent: number | null;
  img:            string;
}

interface StoreDisplayData {
  id:           number;
  name:         string;
  tagline:      string;
  categoryLabel: string;
  rating:       number;
  reviews:      number;
  productCount: number;
  coverImg:     string;
  logoColor:    string;
  logoInitial:  string;
  verified:     boolean;
  slug:         string | null;
}

interface FeaturedStoreAPI {
  sellerId:      number;
  storeName:     string;
  storeSlug:     string | null;
  storeLogo:     string | null;
  storeBanner:   string | null;
  accentColor:   string | null;
  categories:    string[];
  isVerified:    boolean;
  productsCount: number;
  averageRating: number;
  reviewsCount:  number;
}

/* ─── Hero card stacks ────────────────────────────────────────────────────────
   Accents are per-card image overlay tints. All purple-family entries
   replaced with green-family or blue tones to eliminate purple from UI.     */
const LEFT_STACK: StackItem[] = [
  { id: "l0", label: "lux.left.l0.label", sublabel: "lux.left.l0.sublabel", badge: "lux.left.l0.badge",
    imageUrl: "https://images.pexels.com/photos/2220329/pexels-photo-2220329.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#4ade80" },                    /* was #A78BFA (light purple) → light green */
  { id: "l1", label: "lux.left.l1.label", sublabel: "lux.left.l1.sublabel", badge: "lux.left.l1.badge",
    imageUrl: "https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#FBBF24" },                    /* amber — unchanged */
  { id: "l2", label: "lux.left.l2.label", sublabel: "lux.left.l2.sublabel", badge: "lux.left.l2.badge",
    imageUrl: "https://images.pexels.com/photos/755992/pexels-photo-755992.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#60a5fa" },                    /* was #818CF8 (indigo-purple) → blue-400 */
];

const RIGHT_STACK: StackItem[] = [
  { id: "r0", label: "lux.right.r0.label", sublabel: "lux.right.r0.sublabel", badge: "lux.right.r0.badge",
    imageUrl: "https://images.pexels.com/photos/4210342/pexels-photo-4210342.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#34D399" },
  { id: "r1", label: "lux.right.r1.label", sublabel: "lux.right.r1.sublabel", badge: "lux.right.r1.badge",
    imageUrl: "https://images.pexels.com/photos/2162938/pexels-photo-2162938.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#FB923C" },
  { id: "r2", label: "lux.right.r2.label", sublabel: "lux.right.r2.sublabel", badge: "lux.right.r2.badge",
    imageUrl: "https://images.pexels.com/photos/4226879/pexels-photo-4226879.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
    accent: "#38BDF8" },
];

/* ─── Cinematic center-card background images ────────────────────────────────*/
const CENTER_SLIDE_IMAGES = [
  "https://images.pexels.com/photos/3771813/pexels-photo-3771813.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
  "https://images.pexels.com/photos/5632395/pexels-photo-5632395.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
  "https://images.pexels.com/photos/3738090/pexels-photo-3738090.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
  "https://images.pexels.com/photos/4215110/pexels-photo-4215110.jpeg?auto=compress&cs=tinysrgb&w=600&h=900&fit=crop",
];

/* ─── Category definitions ────────────────────────────────────────────────────
   home_decor accent was #8b5cf6 (violet) → replaced with #22c55e (green-500). */
const CATEGORY_DEFS = [
  { nameKey: "home.categories.electronics", countKey: "home.categories.count_electronics", img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=500&h=360&fit=crop&auto=format&q=85", accent: "#3b82f6", slug: "Electronics" },
  { nameKey: "home.categories.fashion",     countKey: "home.categories.count_fashion",     img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&h=360&fit=crop&auto=format&q=85", accent: "#ec4899", slug: "Fashion" },
  { nameKey: "home.categories.beauty",      countKey: "home.categories.count_beauty",      img: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&h=360&fit=crop&auto=format&q=85", accent: "#f59e0b", slug: "Beauty & Personal Care" },
  { nameKey: "home.categories.home_decor",  countKey: "home.categories.count_home_decor",  img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&h=360&fit=crop&auto=format&q=85", accent: "#22c55e", slug: "Home & Kitchen" },
  { nameKey: "home.categories.sports",      countKey: "home.categories.count_sports",      img: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&h=360&fit=crop&auto=format&q=85", accent: "#276221", slug: "Sports & Fitness" },
  { nameKey: "home.categories.watches",     countKey: "home.categories.count_watches",     img: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500&h=360&fit=crop&auto=format&q=85", accent: "#f97316", slug: "Accessories" },
  { nameKey: "home.categories.phones",      countKey: "home.categories.count_phones",      img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&h=360&fit=crop&auto=format&q=85", accent: "#06b6d4", slug: "Electronics" },
  { nameKey: "home.categories.computers",   countKey: "home.categories.count_computers",   img: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=360&fit=crop&auto=format&q=85", accent: "#16a34a", slug: "Electronics" },
];

/* ─── Static store fallback data ─────────────────────────────────────────────
   بيت الديكور logoColor was #8b5cf6 (violet) → replaced with #16A34A.      */
const STATIC_STORES = [
  { id: 1, name: "تك ستور سوريا", taglineAr: "أحدث الإلكترونيات والأجهزة الذكية", categoryKey: "home.categories.electronics", rating: 4.9, reviews: 1840, productCount: 3240, coverImg: "https://images.unsplash.com/photo-1684395882817-030e24c0322a?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#3b82f6", logoInitial: "ت", verified: true, slug: null },
  { id: 2, name: "دار الأناقة",   taglineAr: "أزياء فاخرة وموضة معاصرة للجميع",   categoryKey: "home.categories.fashion",     rating: 4.8, reviews: 2210, productCount: 1890, coverImg: "https://images.unsplash.com/photo-1768745294179-693a07a3f054?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#ec4899", logoInitial: "د", verified: true, slug: null },
  { id: 3, name: "بيت الديكور",   taglineAr: "أثاث عصري وإكسسوارات منزلية راقية",  categoryKey: "home.categories.home_decor",  rating: 4.7, reviews: 956,  productCount: 2140, coverImg: "https://images.unsplash.com/photo-1724582586529-62622e50c0b3?w=700&h=220&fit=crop&auto=format&q=80", logoColor: "#16A34A", logoInitial: "ب", verified: true, slug: null },
];

/* ─── Motion spring ───────────────────────────────────────────────────────────*/
const SPRING: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeEase = [0.25, 0.46, 0.45, 0.94] as const;

const fromBottom = { opacity: 0, scale: 0.91, y: 54  };
const fromTop    = { opacity: 0, scale: 0.91, y: -54 };
const visible    = { opacity: 1, scale: 1,    y: 0   };
const toTop      = { opacity: 0, scale: 0.87, y: -54 };
const toBottom   = { opacity: 0, scale: 0.87, y: 54  };

/* ─── Hero banner entrance variants (staggered slide-down) ───────────────────*/
const heroContainerVariants = {
  hidden:   {},
  visible:  { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
} as const;

const bannerVariant = {
  hidden:   { y: "-100%", opacity: 0, filter: "blur(10px)" },
  visible:  { y: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 0.3, ease: "easeOut" } },
} as const;

// Exact ms when the LAST (right/3rd) banner finishes its phase-1 drop-in:
//   delayChildren(150) + 2×staggerChildren(100) + duration(300) = 650ms
const PHASE1_END_MS =
  heroContainerVariants.visible.transition.delayChildren * 1000 +
  (3 - 1) * heroContainerVariants.visible.transition.staggerChildren * 1000 +
  bannerVariant.visible.transition.duration * 1000; // = 650

/* ═══════════════════════════════════════════════════════════════════════════
   HERO COMPONENTS
═══════════════════════════════════════════════════════════════════════════*/

function ProductCard({ item }: { item: StackItem }) {
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", overflow: "hidden" }}>
      <img src={item.imageUrl} alt="" aria-hidden="true" fetchPriority="high" decoding="async"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 70% 40% at 50% 0%, ${item.accent}22 0%, transparent 65%)`, pointerEvents: "none", borderRadius: "inherit" }} />
    </div>
  );
}

const CenterCard = memo(function CenterCard({ reduced }: { reduced: boolean }) {
  const colors = useContext(LuxColorCtx);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setImgIdx(i => (i + 1) % CENTER_SLIDE_IMAGES.length), 4200);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", borderRadius: "inherit" }}>

      {/* Cinematic background image cross-fade */}
      <AnimatePresence>
        <motion.img
          key={CENTER_SLIDE_IMAGES[imgIdx]}
          src={CENTER_SLIDE_IMAGES[imgIdx]}
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center",
            willChange: "opacity", backfaceVisibility: "hidden" }}
        />
      </AnimatePresence>

    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   LUXURY SECTION HELPERS
═══════════════════════════════════════════════════════════════════════════*/

/** Reusable section header: green-bar eyebrow + bold heading + "see all" link */
function LuxSectionHeader({
  eyebrowKey, titleKey, seeAllKey, seeAllHref, extra,
}: {
  eyebrowKey: string; titleKey: string; seeAllKey: string; seeAllHref: string; extra?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const colors = useContext(LuxColorCtx);
  return (
    <div style={{ marginBottom: "3.5rem" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.5rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem" }}>
            <span style={{ display: "block", width: "2rem", height: "2px", background: colors.green, borderRadius: "9999px", flexShrink: 0 }} />
            <p style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.18em", color: colors.green, textTransform: "uppercase", margin: 0 }}>
              {t(eyebrowKey)}
            </p>
          </div>
          <h2 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "clamp(1.75rem,3.5vw,2.75rem)", letterSpacing: "-0.025em", lineHeight: 1.15, color: colors.white, margin: 0 }}>
            {t(titleKey)}
          </h2>
          {extra}
        </div>
        <Link href={seeAllHref} style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: F.sans, fontWeight: 700, fontSize: "0.78rem", letterSpacing: "0.04em", color: colors.muted, textDecoration: "none", paddingBottom: "0.2rem", borderBottom: `1px solid ${colors.border}`, flexShrink: 0, alignSelf: "flex-end" }}>
          {t(seeAllKey)} <ArrowLeft style={{ width: 13, height: 13 }} />
        </Link>
      </div>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Countdown timer for deals section */
function LuxCountdownTimer() {
  const { t } = useTranslation();
  const colors = useContext(LuxColorCtx);
  const [time, setTime] = useState({ h: 8, m: 24, s: 37 });
  useEffect(() => {
    const id = setInterval(() => {
      setTime(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.75rem" }}>
      <Timer style={{ width: 13, height: 13, color: colors.dimmed, flexShrink: 0 }} />
      <span style={{ fontFamily: F.sans, fontSize: "0.75rem", color: colors.dimmed }}>{t("home.deals.ends_in")}</span>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {[pad(time.h), pad(time.m), pad(time.s)].map((val, i) => (
          <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ fontWeight: 700, fontSize: "0.78rem", fontVariantNumeric: "tabular-nums", color: colors.white, background: colors.greenAlpha, border: `1px solid ${colors.border}`, padding: "2px 8px", borderRadius: "6px", minWidth: "2rem", textAlign: "center", letterSpacing: "0.04em" }}>
              {val}
            </span>
            {i < 2 && <span style={{ color: colors.dimmed, fontWeight: 700, fontSize: "0.8rem" }}>:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Luxury deal card (hero = full-bleed tall; default = horizontal side) ───*/
const LuxDealCard = memo(function LuxDealCard({ deal, index, hero = false }: { deal: DealData; index: number; hero?: boolean }) {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [, navigate] = useLocation();
  const { isAuthenticated, isCustomer, isSeller, isAdmin, isCourier } = useAuth();
  const { addGuestItem } = useGuestCart();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);
  const colors = useContext(LuxColorCtx);

  const addToCartMutation = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey() });
        toast({ title: t("cart.added_title", "Added to cart ✓"), description: deal.name });
      },
      onError: () => {
        toast({ title: t("common.error"), description: t("cart.add_error", "Could not add to cart"), variant: "destructive" });
      },
    },
  });

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (deal.id === 0) { navigate("/shop"); return; }
    if (isSeller || isAdmin || isCourier) return;
    setAdding(true);
    if (isAuthenticated && isCustomer) {
      addToCartMutation.mutate({ data: { productId: deal.id, quantity: 1, variantId: null } });
    } else {
      addGuestItem(deal.id, null, 1);
      toast({ title: t("cart.added_title", "Added to cart ✓"), description: deal.name });
    }
    setTimeout(() => setAdding(false), 800);
  };

  const href = deal.id > 0 ? `/products/${deal.id}` : "/products";
  const hasDiscount = !!(deal.originalPrice && deal.discountPercent && deal.discountPercent > 0);

  /* ── Hero variant: full-bleed tall image, overlay everything ── */
  if (hero) {
    return (
      <motion.div
        className="lux-deals-hero"
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: fadeEase }}
        style={{ position: "relative", borderRadius: "24px", overflow: "hidden", background: colors.card, minHeight: "420px" }}>
        <Link href={href} style={{ display: "block", position: "absolute", inset: 0 }}>
          {deal.img && <img src={deal.img} alt={deal.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.22) 45%, transparent 72%)" }} />
          {hasDiscount && (
            <div style={{ position: "absolute", top: "1.25rem", insetInlineEnd: "1.25rem" }}>
              <span style={{ fontFamily: F.sans, fontWeight: 900, fontSize: "1rem", background: colors.green, color: "#fff", padding: "6px 14px", borderRadius: "9999px" }}>-{deal.discountPercent}%</span>
            </div>
          )}
          <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, padding: "2rem" }}>
            <p style={{ fontFamily: F.sans, fontSize: "0.68rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)", margin: "0 0 0.5rem" }}>{deal.category}</p>
            <h3 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "clamp(1.25rem,2vw,1.75rem)", color: "#fff", margin: "0 0 1.25rem", lineHeight: 1.3 }}>{deal.name}</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <span style={{ fontFamily: F.sans, fontWeight: 900, fontSize: "1.75rem", letterSpacing: "-0.03em", color: "#fff" }} translate="no">{format(deal.price)}</span>
              {hasDiscount && <span style={{ fontFamily: F.sans, fontSize: "1rem", color: "rgba(255,255,255,0.38)", textDecoration: "line-through" }} translate="no">{format(deal.originalPrice!)}</span>}
              <button onClick={handleAdd} disabled={adding} style={{ marginInlineStart: "auto", display: "flex", alignItems: "center", gap: "6px", background: "#ffffff", color: "#0a0a0a", border: "none", borderRadius: "9999px", padding: "10px 22px", fontFamily: F.sans, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer", opacity: adding ? 0.7 : 1, flexShrink: 0 }}>
                {adding ? <div style={{ width: 12, height: 12, border: "1.5px solid #0a0a0a", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <ShoppingCart style={{ width: 13, height: 13 }} />}
                {t("home.deals.add")}
              </button>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  /* ── Side variant: horizontal thumbnail + info ── */
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: fadeEase }}
      style={{ background: colors.card, border: `1px solid ${colors.border}`, borderRadius: "16px", overflow: "hidden", display: "flex", flexDirection: "row" }}>
      <Link href={href} style={{ display: "flex", width: "100%", textDecoration: "none" }}>
        <div style={{ width: 130, minWidth: 130, flexShrink: 0, overflow: "hidden", background: colors.card2, position: "relative" }}>
          {deal.img && <img src={deal.img} alt={deal.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          {hasDiscount && (
            <div style={{ position: "absolute", top: "8px", insetInlineEnd: "8px" }}>
              <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "0.68rem", background: colors.green, color: "#fff", padding: "2px 7px", borderRadius: "9999px" }}>-{deal.discountPercent}%</span>
            </div>
          )}
        </div>
        <div style={{ flex: 1, padding: "1.1rem 1.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
          <div>
            <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: colors.dimmed, margin: "0 0 0.3rem" }}>{deal.category}</p>
            <h3 style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.4, color: colors.white, margin: "0 0 0.5rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{deal.name}</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <div>
              <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em", color: colors.white }} translate="no">{format(deal.price)}</div>
              {hasDiscount && <div style={{ fontFamily: F.sans, fontSize: "10px", color: colors.dimmed, textDecoration: "line-through", marginTop: "2px" }} translate="no">{format(deal.originalPrice!)}</div>}
            </div>
            <button onClick={handleAdd} disabled={adding} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", background: colors.greenAlpha, border: `1px solid rgba(22,163,74,0.3)`, color: "#4ade80", flexShrink: 0, cursor: "pointer", opacity: adding ? 0.5 : 1 }}>
              {adding ? <div style={{ width: 10, height: 10, border: `1.5px solid #4ade80`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <ShoppingCart style={{ width: 13, height: 13 }} />}
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

/* ─── Luxury store card — full-bleed cinematic overlay ──────────────────────*/
const LuxStoreCard = memo(function LuxStoreCard({ store, index }: { store: StoreDisplayData; index: number }) {
  const { t } = useTranslation();
  const colors = useContext(LuxColorCtx);
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: fadeEase }}
      style={{ position: "relative", borderRadius: "20px", overflow: "hidden", aspectRatio: "4/3", background: colors.card }}>
      <Link href={store.slug ? `/store/${store.slug}` : "/sellers/directory"} style={{ display: "block", position: "absolute", inset: 0, textDecoration: "none" }}>
        <img src={store.coverImg} alt={store.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.28) 52%, transparent 82%)" }} />
        {/* Top: verified badge + rating pill */}
        <div style={{ position: "absolute", top: "1rem", insetInlineStart: "1rem", insetInlineEnd: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {store.verified ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: F.sans, fontWeight: 600, fontSize: "9px", letterSpacing: "0.06em", background: "rgba(22,163,74,0.22)", border: "1px solid rgba(22,163,74,0.35)", color: "#4ade80", padding: "3px 9px", borderRadius: "9999px", backdropFilter: "blur(8px)" }}>
              <span style={{ width: 4, height: 4, background: "#4ade80", borderRadius: "50%", display: "inline-block" }} />
              {t("home.stores.verified")}
            </span>
          ) : <span />}
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "rgba(0,0,0,0.50)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: "9999px" }}>
            <Star style={{ width: 11, height: 11, fill: "#fbbf24", color: "#fbbf24", flexShrink: 0 }} />
            <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.78rem", color: "#fff" }}>{store.rating}</span>
          </span>
        </div>
        {/* Logo initial */}
        <div style={{ position: "absolute", bottom: "4.25rem", insetInlineStart: "1.25rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: "12px", background: `${store.logoColor}22`, border: `1.5px solid ${store.logoColor}44`, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
            <span style={{ fontFamily: F.naskh, fontWeight: 900, fontSize: "1.15rem", color: store.logoColor }}>{store.logoInitial}</span>
          </div>
        </div>
        {/* Bottom info */}
        <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, padding: "1.1rem 1.25rem" }}>
          <h3 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "1.05rem", color: "#fff", margin: "0 0 0.2rem" }}>{store.name}</h3>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
            <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.72rem", color: "rgba(255,255,255,0.52)", margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{store.tagline}</p>
            <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.72rem", color: "#4ade80", flexShrink: 0, letterSpacing: "0.04em" }}>{t("home.stores.visit")} ›</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   LUXURY SECTION COMPONENTS
═══════════════════════════════════════════════════════════════════════════*/

/** Section wrapper style helper — takes colors from caller (via context) */
const sectionStyle = (c: ColorTokens, alt = false): React.CSSProperties => ({
  background: alt ? c.card2 : c.bg,
  paddingTop: "6rem",
  paddingBottom: "6rem",
  borderTop: `1px solid ${c.border}`,
});

/* ── 1. Popular Categories — editorial numbered cards ────────────────────────*/
const LuxCategoriesSection = memo(function LuxCategoriesSection() {
  const { t, i18n } = useTranslation();
  const colors = useContext(LuxColorCtx);
  return (
    <section style={sectionStyle(colors, false)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.categories.eyebrow" titleKey="home.categories.title" seeAllKey="home.categories.see_all" seeAllHref="/shop" />
        <div className="lux-cat-grid">
          {CATEGORY_DEFS.map((cat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.48, delay: i * 0.05, ease: fadeEase }}>
              <Link href={`/shop?category=${encodeURIComponent(cat.slug)}`}
                style={{ display: "block", position: "relative", overflow: "hidden", borderRadius: "20px", aspectRatio: "2 / 3", background: colors.card }}>
                <img src={cat.img} alt={t(cat.nameKey)} loading="lazy" decoding="async"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.65s ease" }} />
                {/* Deep gradient for text readability */}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.12) 52%, transparent 100%)" }} />
                {/* Editorial number — top-right, large muted */}
                <div style={{ position: "absolute", top: "0.5rem", insetInlineEnd: "0.6rem", fontFamily: F.sans, fontWeight: 900, fontSize: "clamp(2.5rem,5vw,4rem)", lineHeight: 1, color: "rgba(255,255,255,0.10)", letterSpacing: "-0.05em", userSelect: "none", pointerEvents: "none" }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                {/* Accent dot */}
                <span style={{ position: "absolute", insetInlineStart: "1rem", bottom: "3.6rem", width: 6, height: 6, borderRadius: "50%", background: cat.accent, display: "block" }} />
                {/* Name + count */}
                <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, padding: "0.75rem 1rem 1rem" }}>
                  <h3 style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.9rem", color: "#FFFFFF", margin: "0 0 0.2rem", letterSpacing: "0.01em" }}>
                    {t(cat.nameKey)}
                  </h3>
                  <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.68rem", color: "rgba(255,255,255,0.46)", margin: 0 }}>
                    {t(cat.countKey)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

/* ── 2. Featured Deals — bento: hero left + 2 side cards right ───────────────*/
const LuxDealsSection = memo(function LuxDealsSection({ deals }: { deals: DealData[] }) {
  const { i18n } = useTranslation();
  const colors = useContext(LuxColorCtx);
  if (deals.length === 0) return null;
  return (
    <section style={sectionStyle(colors, true)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.deals.eyebrow" titleKey="home.deals.title" seeAllKey="home.deals.see_all" seeAllHref="/shop?hasDiscount=true" extra={<LuxCountdownTimer />} />
        <div className="lux-deals-bento">
          {deals[0] && <LuxDealCard deal={deals[0]} index={0} hero />}
          {deals.slice(1, 3).map((deal, i) => <LuxDealCard key={`${deal.id}-${i}`} deal={deal} index={i + 1} />)}
        </div>
      </div>
    </section>
  );
});

/* ── 3. Trusted Stores ───────────────────────────────────────────────────────*/
const LuxStoresSection = memo(function LuxStoresSection() {
  const { t, i18n } = useTranslation();
  const colors = useContext(LuxColorCtx);

  const [stores, setStores] = useState<StoreDisplayData[]>(() =>
    STATIC_STORES.map(s => ({
      id: s.id, name: s.name, tagline: s.taglineAr,
      categoryLabel: s.categoryKey,
      rating: s.rating, reviews: s.reviews, productCount: s.productCount,
      coverImg: s.coverImg, logoColor: s.logoColor, logoInitial: s.logoInitial,
      verified: s.verified, slug: s.slug,
    }))
  );

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/sellers/featured`)
      .then(r => r.ok ? r.json() : null)
      .then((data: FeaturedStoreAPI[] | null) => {
        if (!data || !Array.isArray(data) || data.length === 0) return;
        const mapped: StoreDisplayData[] = data.slice(0, 3).map((s, i) => ({
          id: s.sellerId, name: s.storeName,
          tagline: (s.categories ?? []).join(" · ") || t("home.stores.fallback_tagline"),
          categoryLabel: (s.categories ?? [])[0] || "",
          rating: Math.round((s.averageRating || 4.5) * 10) / 10,
          reviews: s.reviewsCount, productCount: s.productsCount ?? 0,
          coverImg: s.storeBanner ?? s.storeLogo ?? STATIC_STORES[i % 3].coverImg,
          logoColor: s.accentColor ?? STATIC_STORES[i % 3].logoColor,
          logoInitial: s.storeName.charAt(0), verified: s.isVerified, slug: s.storeSlug,
        }));
        setStores(mapped);
      })
      .catch(() => {});
  }, [t]);

  const displayStores = useMemo(() => stores.map(s => ({
    ...s,
    categoryLabel: STATIC_STORES.find(st => st.id === s.id)
      ? t(STATIC_STORES.find(st => st.id === s.id)!.categoryKey)
      : s.categoryLabel,
  })), [stores, t]);

  return (
    <section style={sectionStyle(colors, false)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.stores.eyebrow" titleKey="home.stores.title" seeAllKey="home.stores.see_all" seeAllHref="/sellers/directory" />
        <div className="lux-stores-row">
          {displayStores.map((store, i) => <LuxStoreCard key={store.id} store={store} index={i} />)}
        </div>
      </div>
    </section>
  );
});

/* ── 4. Trending Products — ranked editorial list ────────────────────────────*/
const LuxTrendingSection = memo(function LuxTrendingSection({ products }: { products: Product[] }) {
  const { i18n } = useTranslation();
  const { format } = useCurrency();
  const colors = useContext(LuxColorCtx);
  if (products.length === 0) return null;

  return (
    <section style={sectionStyle(colors, true)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.trending.eyebrow" titleKey="home.trending.title" seeAllKey="home.trending.see_all" seeAllHref="/shop" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          {products.slice(0, 6).map((p, i) => {
            const imgs      = (p as { imageUrls?: string[] }).imageUrls;
            const finalPrice = (p as { finalPrice?: number }).finalPrice ? Number((p as { finalPrice?: number }).finalPrice) : Number(p.price);
            const compareAt  = (p as { compareAtPrice?: number }).compareAtPrice ? Number((p as { compareAtPrice?: number }).compareAtPrice) : undefined;
            const discPct    = (p as { discountPercent?: number }).discountPercent ? Number((p as { discountPercent?: number }).discountPercent) : undefined;
            const storeName  = (p as { storeName?: string; sellerName?: string }).storeName ?? (p as { storeName?: string; sellerName?: string }).sellerName ?? "";

            return (
              <motion.div key={`${p.id}-${i}`}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.42, delay: i * 0.05, ease: fadeEase }}>
                <Link href={`/products/${p.id}`} style={{ display: "flex", alignItems: "center", gap: "1.5rem", padding: "1.25rem 0", borderBottom: `1px solid ${colors.border}`, textDecoration: "none" }}>
                  {/* Rank number */}
                  <div style={{ width: "2.5rem", flexShrink: 0, fontFamily: F.sans, fontWeight: 900, fontSize: "1.25rem", letterSpacing: "-0.04em", color: i < 3 ? colors.green : colors.dimmed, lineHeight: 1, textAlign: "center" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  {/* Thumbnail */}
                  <div style={{ width: 68, height: 68, borderRadius: "14px", overflow: "hidden", background: colors.card, flexShrink: 0, border: `1px solid ${colors.border}` }}>
                    {imgs?.[0] && <img src={imgs[0]} alt={p.name} loading="lazy" decoding="async" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {storeName && <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", color: colors.dimmed, margin: "0 0 0.25rem" }}>{storeName}</p>}
                    <h3 style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.95rem", color: colors.white, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</h3>
                  </div>
                  {/* Price + discount */}
                  <div style={{ flexShrink: 0, textAlign: "end" }}>
                    <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.02em", color: colors.white }} translate="no">{format(finalPrice)}</div>
                    {compareAt && <div style={{ fontFamily: F.sans, fontSize: "11px", color: colors.dimmed, textDecoration: "line-through", marginTop: "2px" }} translate="no">{format(compareAt)}</div>}
                    {discPct && discPct > 0 && (
                      <span style={{ display: "inline-flex", marginTop: "4px", fontFamily: F.sans, fontWeight: 700, fontSize: "9px", background: colors.greenAlpha, border: `1px solid rgba(22,163,74,0.30)`, color: "#4ade80", padding: "2px 7px", borderRadius: "9999px" }}>-{discPct}%</span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

/* ── 5. New Arrivals — asymmetric bento drop grid ────────────────────────────*/
const LuxArrivalsSection = memo(function LuxArrivalsSection({ products }: { products: Product[] }) {
  const { t, i18n } = useTranslation();
  const { format } = useCurrency();
  const colors = useContext(LuxColorCtx);
  if (products.length < 4) return null;

  const items = products.slice(0, 3).map((p, i) => {
    const imgs = (p as { imageUrls?: string[] }).imageUrls;
    return {
      id: p.id, name: p.name, category: p.category ?? "",
      price: (p as { finalPrice?: number }).finalPrice ? Number((p as { finalPrice?: number }).finalPrice) : Number(p.price),
      daysAgo: Math.floor(i / 2) + 1, img: imgs?.[0] ?? "",
    };
  });

  const main = items[0];
  const rest = items.slice(1);

  return (
    <section style={sectionStyle(colors, false)} dir={i18n.dir()}>
      <div className="lux-section-inner">
        <LuxSectionHeader eyebrowKey="home.arrivals.eyebrow" titleKey="home.arrivals.title" seeAllKey="home.arrivals.see_all" seeAllHref="/shop" />
        <div className="lux-arrivals-bento">
          {/* Main large card — spans 2 rows on desktop */}
          <motion.div className="lux-arrivals-main"
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, ease: fadeEase }}
            style={{ position: "relative", borderRadius: "24px", overflow: "hidden", background: colors.card, minHeight: "300px" }}>
            <Link href={`/products/${main.id}`} style={{ display: "block", position: "absolute", inset: 0 }}>
              {main.img && <img src={main.img} alt={main.name} loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.18) 55%, transparent 82%)" }} />
              <div style={{ position: "absolute", top: "1.25rem", insetInlineStart: "1.25rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: F.sans, fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.04em", background: colors.green, color: "#fff", padding: "5px 12px", borderRadius: "9999px" }}>
                  <Zap style={{ width: 10, height: 10 }} /> {t("home.arrivals.new_since", { count: main.daysAgo })}
                </span>
              </div>
              <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, padding: "2rem" }}>
                {main.category && <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "0.68rem", letterSpacing: "0.1em", color: "rgba(255,255,255,0.48)", textTransform: "uppercase", margin: "0 0 0.5rem" }}>{main.category}</p>}
                <h3 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "clamp(1.25rem,2.5vw,1.75rem)", lineHeight: 1.25, letterSpacing: "-0.01em", color: "#FFFFFF", margin: "0 0 0.75rem" }}>{main.name}</h3>
                <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1.5rem", letterSpacing: "-0.03em", color: "#FFFFFF" }} translate="no">{format(main.price)}</span>
              </div>
            </Link>
          </motion.div>

          {/* Side cards */}
          {rest.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1, ease: fadeEase }}
              style={{ position: "relative", borderRadius: "20px", overflow: "hidden", background: colors.card, minHeight: "180px" }}>
              <Link href={`/products/${item.id}`} style={{ display: "block", position: "absolute", inset: 0 }}>
                {item.img && <img src={item.img} alt={item.name} loading="lazy" decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, transparent 62%)" }} />
                <div style={{ position: "absolute", top: "0.75rem", insetInlineStart: "0.75rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontFamily: F.sans, fontWeight: 700, fontSize: "8px", letterSpacing: "0.04em", background: "rgba(0,0,0,0.50)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.68)", padding: "3px 8px", borderRadius: "9999px", backdropFilter: "blur(8px)" }}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                    {t("home.arrivals.ago", { count: item.daysAgo })}
                  </span>
                </div>
                <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, padding: "0.85rem 1.1rem" }}>
                  {item.category && <p style={{ fontFamily: F.sans, fontWeight: 500, fontSize: "8px", color: "rgba(255,255,255,0.44)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 0.25rem" }}>{item.category}</p>}
                  <h3 style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.3, color: "#FFFFFF", margin: "0 0 0.35rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</h3>
                  <span style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1rem", letterSpacing: "-0.02em", color: "#FFFFFF" }} translate="no">{format(item.price)}</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
});

/* ── 6. Join Section — full-bleed two-column split ───────────────────────────*/
const LuxJoinSection = memo(function LuxJoinSection() {
  const { t, i18n } = useTranslation();
  const { handleOpenYourStore } = useSellerOnboarding();
  const { handleBecomeCourier } = useCourierOnboarding();
  const colors = useContext(LuxColorCtx);

  return (
    <section style={{ borderTop: `1px solid ${colors.border}`, overflow: "hidden" }} dir={i18n.dir()}>
      <div className="lux-join-split">
        {/* ── Seller half — deep green ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: fadeEase }}
          onClick={handleOpenYourStore}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleOpenYourStore(); } }}
          role="button" tabIndex={0}
          style={{ position: "relative", padding: "5rem 3rem", background: "linear-gradient(145deg, hsl(120,52%,11%) 0%, hsl(142,60%,16%) 100%)", cursor: "pointer", overflow: "hidden", minHeight: "420px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {/* Dot texture */}
          <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />
          {/* Soft ambient glow */}
          <div style={{ position: "absolute", top: "-5rem", insetInlineEnd: "-4rem", width: "22rem", height: "22rem", borderRadius: "50%", background: "rgba(34,197,94,0.14)", filter: "blur(72px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: "16px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.75rem" }}>
              <Store style={{ width: 24, height: 24, color: "#86efac" }} />
            </div>
            <p style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(134,239,172,0.75)", margin: "0 0 0.75rem" }}>{t("home.join.badge")}</p>
            <h2 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "clamp(1.5rem,2.8vw,2.25rem)", letterSpacing: "-0.02em", lineHeight: 1.2, color: "#ffffff", margin: "0 0 1rem" }}>{t("home.join.seller_title")}</h2>
            <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.75, color: "rgba(255,255,255,0.58)", margin: "0 0 2.25rem", maxWidth: "340px" }}>{t("home.join.seller_desc")}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontFamily: F.sans, fontWeight: 700, fontSize: "0.85rem", color: "#86efac", borderBottom: "1px solid rgba(134,239,172,0.30)", paddingBottom: "2px" }}>
              {t("home.join.seller_cta")} <ArrowLeft style={{ width: 14, height: 14 }} />
            </div>
          </div>
        </motion.div>

        {/* ── Courier half — dark neutral ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15, ease: fadeEase }}
          onClick={handleBecomeCourier}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleBecomeCourier(); } }}
          role="button" tabIndex={0}
          style={{ position: "relative", padding: "5rem 3rem", background: colors.card2, cursor: "pointer", overflow: "hidden", minHeight: "420px", display: "flex", flexDirection: "column", justifyContent: "flex-end", borderTop: `1px solid ${colors.border}` }}>
          <div style={{ position: "absolute", top: "-4rem", insetInlineStart: "-3rem", width: "18rem", height: "18rem", borderRadius: "50%", background: colors.greenGlow, filter: "blur(88px)", pointerEvents: "none", opacity: 0.55 }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ width: 52, height: 52, borderRadius: "16px", background: colors.greenAlpha, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.75rem" }}>
              <Bike style={{ width: 24, height: 24, color: colors.muted }} />
            </div>
            <p style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.68rem", letterSpacing: "0.18em", textTransform: "uppercase", color: colors.green, margin: "0 0 0.75rem" }}>{t("home.join.badge")}</p>
            <h2 style={{ fontFamily: F.naskh, fontWeight: 800, fontSize: "clamp(1.5rem,2.8vw,2.25rem)", letterSpacing: "-0.02em", lineHeight: 1.2, color: colors.white, margin: "0 0 1rem" }}>{t("home.join.courier_title")}</h2>
            <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.875rem", lineHeight: 1.75, color: colors.muted, margin: "0 0 2.25rem", maxWidth: "340px" }}>{t("home.join.courier_desc")}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontFamily: F.sans, fontWeight: 700, fontSize: "0.85rem", color: colors.green, borderBottom: `1px solid ${colors.border}`, paddingBottom: "2px" }}>
              {t("home.join.courier_cta")} <ArrowLeft style={{ width: 14, height: 14 }} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

/* ── 7. Full luxury footer ───────────────────────────────────────────────────*/

const LUX_SOCIAL_LINKS = [
  { Icon: Instagram, label: "Instagram", href: "https://www.instagram.com/syano.market/" },
  { Icon: Twitter,   label: "X (Twitter)", href: "https://x.com/Syanomarket" },
  { Icon: Facebook,  label: "Facebook",   href: "https://www.facebook.com/SyanoMarket" },
  { Icon: Youtube,   label: "YouTube",    href: "#" },
];

const LUX_PAYMENT_METHODS = ["VISA", "MasterCard", "PayPal", "SyriaTel Cash"];

const LUX_FOOTER_COLS = [
  {
    titleKey: "home.footer.marketplace_title",
    links: [
      { labelKey: "home.footer.link_all_products",   href: "/shop" },
      { labelKey: "home.footer.link_deals",          href: "/shop?hasDiscount=true" },
      { labelKey: "home.footer.link_bestsellers",    href: "/shop?sortBy=best_selling" },
      { labelKey: "home.footer.link_new_products",   href: "/shop?sortBy=newest" },
      { labelKey: "home.footer.link_categories",     href: "/categories" },
      { labelKey: "home.footer.link_trusted_stores", href: "/stores" },
      { labelKey: "home.footer.link_wishlist",       href: "/wishlist" },
      { labelKey: "home.footer.link_cart",           href: "/cart" },
    ],
  },
  {
    titleKey: "home.footer.sellers_title",
    links: [
      { labelKey: "home.footer.link_open_store",       href: "/seller/apply" },
      { labelKey: "home.footer.link_seller_dashboard", href: "/seller/dashboard" },
      { labelKey: "home.footer.link_seller_center",    href: "/seller/center" },
      { labelKey: "home.footer.link_seller_how",       href: "/seller/how-to-sell" },
      { labelKey: "home.footer.link_commission",       href: "/seller/commission" },
      { labelKey: "home.footer.link_seller_faq",       href: "/seller/faq" },
      { labelKey: "home.footer.link_seller_terms",     href: "/seller/terms" },
      { labelKey: "home.footer.link_returns",          href: "/returns-policy" },
    ],
  },
  {
    titleKey: "home.footer.s_courier",
    links: [
      { labelKey: "home.footer.link_courier_apply",       href: "/courier/apply" },
      { labelKey: "home.footer.link_courier_workspace",   href: "/courier" },
      { labelKey: "home.footer.link_courier_earnings",    href: "/courier/earnings" },
      { labelKey: "home.footer.link_courier_wallet",      href: "/courier/wallet" },
      { labelKey: "home.footer.link_courier_performance", href: "/courier/performance" },
      { labelKey: "home.footer.link_courier_history",     href: "/courier/history" },
    ],
  },
  {
    titleKey: "home.footer.company_title",
    links: [
      { labelKey: "home.footer.link_about",       href: "/about" },
      { labelKey: "home.footer.link_about_story", href: "/about/story" },
      { labelKey: "home.footer.link_about_team",  href: "/about/team" },
      { labelKey: "home.footer.link_contact",     href: "/contact" },
      { labelKey: "home.footer.link_shipping",    href: "/shipping" },
      { labelKey: "home.footer.link_guarantee",   href: "/syano-guarantee" },
      { labelKey: "home.footer.link_loyalty",     href: "/loyalty" },
      { labelKey: "home.footer.link_payment",     href: "/payment-methods" },
      { labelKey: "home.footer.link_help",        href: "/help" },
      { labelKey: "home.footer.link_privacy",     href: "/privacy-policy" },
      { labelKey: "home.footer.link_terms_page",  href: "/terms-of-use" },
    ],
  },
];

const LUX_LEGAL_LINKS = [
  { labelKey: "home.footer.privacy",      href: "/privacy-policy" },
  { labelKey: "home.footer.terms",        href: "/terms-of-use" },
  { labelKey: "home.footer.cookies",      href: "/cookies" },
  { labelKey: "home.footer.link_returns", href: "/returns-policy" },
];

const LuxFooterBar = memo(function LuxFooterBar() {
  const { t, i18n } = useTranslation();
  const colors = useContext(LuxColorCtx);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const colHeadStyle: React.CSSProperties = {
    fontFamily: F.naskh,
    fontWeight: 700,
    fontSize: "0.92rem",
    color: colors.white,
    margin: "0 0 1.1rem",
    letterSpacing: "0.01em",
  };

  const linkStyle: React.CSSProperties = {
    fontFamily: F.sans,
    fontWeight: 400,
    fontSize: "0.8rem",
    color: colors.dimmed,
    textDecoration: "none",
    display: "block",
    lineHeight: 1,
    transition: "color 0.2s",
  };

  return (
    <footer style={{ background: colors.bg, borderTop: `1px solid ${colors.border}` }} dir={i18n.dir()}>
      <div className="lux-section-inner">

        {/* ── Main grid ── */}
        <div className="lux-footer-grid">

          {/* Brand block */}
          <div className="lux-footer-brand">
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.1rem" }}>
              <img
                src="/syano-logo.png"
                alt="SYANO"
                width={36}
                height={36}
                style={{ width: 36, height: 36, objectFit: "contain",
                  filter: "brightness(1.15) drop-shadow(0 1px 4px rgba(0,0,0,0.5))" }}
              />
              <div>
                <div style={{ fontFamily: F.sans, fontWeight: 800, fontSize: "1rem", letterSpacing: "0.08em", color: colors.white }}>SYANO</div>
                <div style={{ fontFamily: F.naskh, fontWeight: 400, fontSize: "0.72rem", color: colors.dimmed, letterSpacing: "0.12em" }}>سوق سوريا</div>
              </div>
            </div>
            <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.82rem", lineHeight: 1.8, color: colors.dimmed, maxWidth: "280px", margin: "0 0 1.5rem" }}>
              {t("home.footer.tagline")}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
              {LUX_SOCIAL_LINKS.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lux-social-icon"
                  style={{ width: 36, height: 36, borderRadius: "10px", background: colors.greenAlpha, border: `1px solid ${colors.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.dimmed, textDecoration: "none", transition: "background 0.2s, color 0.2s, border-color 0.2s" }}
                >
                  <Icon style={{ width: 15, height: 15 }} />
                </a>
              ))}
            </div>
          </div>

          {/* 4 link columns */}
          {LUX_FOOTER_COLS.map((col) => (
            <div key={col.titleKey}>
              <h4 style={colHeadStyle}>{t(col.titleKey)}</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                {col.links.map((link) => (
                  <li key={link.labelKey}>
                    <Link href={link.href} className="lux-footer-link" style={linkStyle}>
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div className="lux-footer-newsletter">
            <h4 style={colHeadStyle}>{t("home.footer.newsletter_title")}</h4>
            <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.8rem", lineHeight: 1.75, color: colors.dimmed, margin: "0 0 1rem" }}>
              {t("home.footer.newsletter_desc")}
            </p>

            {subscribed ? (
              <div aria-live="polite" style={{ fontFamily: F.sans, fontWeight: 600, fontSize: "0.82rem", color: "#4ade80", padding: "0.8rem 1rem", background: colors.greenAlpha, border: "1px solid rgba(22,163,74,0.20)", borderRadius: "12px" }}>
                ✓ {t("home.footer.subscribed", "تم الاشتراك!")}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) { setSubscribed(true); setEmail(""); }
                }}
                style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("home.footer.newsletter_placeholder")}
                  aria-label={t("home.footer.newsletter_placeholder")}
                  className="lux-footer-input"
                  style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.8rem", width: "100%", background: colors.greenAlpha, border: `1px solid ${colors.border}`, borderRadius: "12px", padding: "0.72rem 1rem", color: colors.white, outline: "none", transition: "border-color 0.2s" }}
                />
                <button
                  type="submit"
                  style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "0.8rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: colors.white, color: colors.bg, width: "100%", padding: "0.72rem", borderRadius: "9999px", transition: "opacity 0.2s" }}
                >
                  {t("home.footer.subscribe")} <ArrowLeft style={{ width: 13, height: 13 }} />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div className="lux-footer-bottom">
          <p style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.75rem", color: colors.dimmed, margin: 0, flexShrink: 0 }}>
            {t("home.footer.copyright")}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", justifyContent: "center" }}>
            {LUX_PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                style={{ fontFamily: F.sans, fontWeight: 700, fontSize: "10px", letterSpacing: "0.05em", padding: "3px 10px", background: colors.greenAlpha, border: `1px solid ${colors.border}`, color: colors.dimmed, borderRadius: "6px" }}
              >
                {method}
              </span>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap", justifyContent: "center" }}>
            {LUX_LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="lux-footer-link"
                style={{ fontFamily: F.sans, fontWeight: 400, fontSize: "0.75rem", color: colors.dimmed, textDecoration: "none", transition: "color 0.2s" }}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
});

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════*/
export default function LuxuryLandingPage() {
  const reduced = useReducedMotion() ?? false;

  /* ── Theme — resolvedTheme accounts for "system" setting via OS preference ── */
  const { resolvedTheme } = useTheme();
  const colors: ColorTokens = resolvedTheme === "dark" ? C : CL;

  /* Hero carousel state */
  const [leftIdx,  setLeftIdx]  = useState(0);
  const [rightIdx, setRightIdx] = useState(0);
  const rightTurn = useRef(true);

  /* Phase-2 split state — triggers (PHASE1_END_MS + 4000ms) after mount */
  const [splitTriggered, setSplitTriggered] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      if (rightTurn.current) setRightIdx(i => (i + 1) % RIGHT_STACK.length);
      else                   setLeftIdx(i  => (i + 1) % LEFT_STACK.length);
      rightTurn.current = !rightTurn.current;
    }, 2500);
    return () => clearInterval(id);
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const id = setTimeout(() => setSplitTriggered(true), PHASE1_END_MS + 4000);
    return () => clearTimeout(id);
  }, [reduced]);

  /* Product data */
  const { data: products } = useListProducts({}, {
    query: {
      staleTime: 3 * 60 * 1000,
      gcTime:    10 * 60 * 1000,
      queryKey:  getListProductsQueryKey({}),
    },
  });

  const hotDeals = useMemo<DealData[]>(() =>
    (products?.filter((p) => (p as { isBestDeal?: boolean }).isBestDeal) ?? [])
      .slice(0, 4)
      .map(p => {
        const imgs = (p as { imageUrls?: string[] }).imageUrls;
        return {
          id: p.id,
          name: p.name,
          category: p.category ?? "",
          price:          (p as { finalPrice?: number }).finalPrice ? Number((p as { finalPrice?: number }).finalPrice) : Number(p.price),
          originalPrice:  (p as { compareAtPrice?: number }).compareAtPrice  ? Number((p as { compareAtPrice?: number }).compareAtPrice)  : null,
          discountPercent:(p as { discountPercent?: number }).discountPercent ? Number((p as { discountPercent?: number }).discountPercent) : null,
          img: imgs?.[0] ?? "",
        };
      }), [products]);

  const trending    = useMemo(() => products?.slice(0, 6) ?? [], [products]);
  const newArrivals = useMemo(() => products?.slice(0, 4) ?? [], [products]);

  const leftItem      = LEFT_STACK[leftIdx];
  const rightItem     = RIGHT_STACK[rightIdx];
  const nextLeftItem  = LEFT_STACK[(leftIdx + 1) % LEFT_STACK.length];
  const nextRightItem = RIGHT_STACK[(rightIdx + 1) % RIGHT_STACK.length];

  return (
    <LuxColorCtx.Provider value={colors}>
      <style>{FONT_CSS}</style>
      <style>{SECTION_CSS}</style>
      {/* Spinner keyframe for cart button */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div
        className="lux-root"
        dir="rtl"
        lang="ar"
        style={{
          background: colors.bg,
          minHeight: "100dvh",
          fontFamily: F.sans,
          scrollbarWidth: "thin",
          scrollbarColor: `${colors.border} transparent`,
        }}
      >
        {/* ── Navbar spacer — fixed header is out of flow; this reserves 3.75rem ── */}
        <div style={{ height: "3.75rem", background: colors.bg, flexShrink: 0 }}>
          <LuxuryNavbar />
        </div>

        {/* ── Hero section — fills exactly one viewport height ───────────── */}
        <motion.section
          variants={heroContainerVariants}
          initial={reduced ? false : "hidden"}
          animate="visible"
          style={{
            position: "relative",
            zIndex: 0,
            height: "calc(100dvh - 3.75rem)",
            display: "grid",
            gridTemplateColumns: "1fr 1.48fr 1fr",
            gap: "16px",
            padding: "0 20px",
            overflow: "hidden",
            background: colors.bg,
          }}
        >
            {/* LEFT — phase 1: slides down; phase 2: real flex split into two independent cards */}
            <motion.div variants={bannerVariant} style={{ display: "flex", flexDirection: "column", gap: "16px", transform: "translateZ(0)" }}>
              {/* Top card — always present; layout prop animates real height change when sibling is added */}
              <motion.div
                layout
                transition={{ layout: { duration: 0.45, ease: "easeOut" } }}
                style={{ flex: "1 1 0", position: "relative", borderRadius: "24px", overflow: "hidden", background: colors.card, minHeight: 0 }}
              >
                {!splitTriggered ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={leftItem.id} style={{ position: "absolute", inset: 0, willChange: "transform, opacity", backfaceVisibility: "hidden" }}
                      initial={reduced ? false : fromBottom} animate={visible} exit={reduced ? {} : toTop}
                      transition={{ duration: 0.55, ease: SPRING }}>
                      <ProductCard item={leftItem} />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div style={{ position: "absolute", inset: 0 }}>
                    <ProductCard item={leftItem} />
                  </div>
                )}
              </motion.div>
              {/* Bottom new card — independent card, slides up from below into freed space */}
              <AnimatePresence>
                {splitTriggered && (
                  <motion.div
                    layout
                    initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    style={{ flex: "1 1 0", position: "relative", borderRadius: "24px", overflow: "hidden", background: colors.card, minHeight: 0 }}
                  >
                    <div style={{ position: "absolute", inset: 0 }}>
                      <ProductCard item={nextLeftItem} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* CENTER — entrance: slides down; unchanged in phase 2 */}
            <motion.div variants={bannerVariant} style={{ position: "relative", borderRadius: "24px", overflow: "hidden", background: colors.card }}>
              <CenterCard reduced={reduced} />
            </motion.div>

            {/* RIGHT — phase 1: slides down; phase 2: real flex split into two independent cards */}
            <motion.div variants={bannerVariant} style={{ display: "flex", flexDirection: "column", gap: "16px", transform: "translateZ(0)" }}>
              {/* Top new card — independent card, slides down from above into freed space */}
              <AnimatePresence>
                {splitTriggered && (
                  <motion.div
                    layout
                    initial={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    style={{ flex: "1 1 0", position: "relative", borderRadius: "24px", overflow: "hidden", background: colors.card, minHeight: 0 }}
                  >
                    <div style={{ position: "absolute", inset: 0 }}>
                      <ProductCard item={nextRightItem} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Bottom card — always present; layout prop animates real height change when sibling is added */}
              <motion.div
                layout
                transition={{ layout: { duration: 0.45, ease: "easeOut" } }}
                style={{ flex: "1 1 0", position: "relative", borderRadius: "24px", overflow: "hidden", background: colors.card, minHeight: 0 }}
              >
                {!splitTriggered ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div key={rightItem.id} style={{ position: "absolute", inset: 0, willChange: "transform, opacity", backfaceVisibility: "hidden" }}
                      initial={reduced ? false : fromTop} animate={visible} exit={reduced ? {} : toBottom}
                      transition={{ duration: 0.55, ease: SPRING }}>
                      <ProductCard item={rightItem} />
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div style={{ position: "absolute", inset: 0 }}>
                    <ProductCard item={rightItem} />
                  </div>
                )}
              </motion.div>
            </motion.div>
        </motion.section>

        {/* ── Below-fold sections ────────────────────────────────────────── */}
        <LuxCategoriesSection />
        <LuxDealsSection deals={hotDeals} />
        <LuxStoresSection />
        <LuxTrendingSection products={trending} />
        <LuxArrivalsSection products={newArrivals} />
        <LuxJoinSection />
        <LuxFooterBar />
      </div>
    </LuxColorCtx.Provider>
  );
}
