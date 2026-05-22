import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Database,
  Eye,
  Flag,
  GraduationCap,
  Heart,
  Home,
  Image as ImageIcon,
  Info,
  Lock,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  User,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";

const screenIds = [
  "welcome",
  "verify_profile",
  "verification_progress",
  "verified_profile",
  "trust_indicator",
  "unverified_warning",
  "report_fake_profile",
  "report_confirmation",
] as const;

type ScreenId = (typeof screenIds)[number];
type VerificationStatus = "not_started" | "in_progress" | "completed";
type LiveVerificationStatus = "idle" | "requesting" | "active" | "checking" | "passed" | "blocked" | "unsupported";

type MockReport = {
  id: string;
  profileId: "profile_alex";
  profileName: "Alex";
  reason: string;
  details: string;
  createdAt: string;
  status: "submitted-local-only";
};

const STORAGE_PREFIX = "safematch_";
const KEYS = {
  currentScreen: "safematch_current_screen",
  verificationStatus: "safematch_verification_status",
  isVerified: "safematch_is_verified",
  selectedReportReason: "safematch_selected_report_reason",
  reportDetails: "safematch_report_details",
  reports: "safematch_reports",
  lastUpdated: "safematch_last_updated",
} as const;

const verifiedProfile = {
  id: "profile_sara",
  name: "Sara",
  age: 24,
  status: "Student",
  location: "Windhoek, Namibia",
  interests: ["Books", "Hiking", "Travel"],
  verified: true,
  trustScore: 92,
  trustLevel: "High",
  avatarType: "verified",
};

const unverifiedProfile = {
  id: "profile_alex",
  name: "Alex",
  age: 25,
  status: "Student",
  location: "Windhoek, Namibia",
  joined: "May 2024",
  verified: false,
  trustScore: 28,
  trustLevel: "Low",
  avatarType: "blurred/suspicious",
};

const verificationChecklist = [
  "ID/selfie verified",
  "Selfie match confirmed",
  "No recent reports",
  "Active for 2+ weeks",
];

const reportReasons = [
  { label: "Fake profile", Icon: User, iconClass: "bg-blue-100 text-ocean" },
  { label: "Scam or fraud", Icon: CreditCard, iconClass: "bg-emerald-100 text-aqua" },
  { label: "Inappropriate behaviour", Icon: AlertTriangle, iconClass: "bg-orange-100 text-caution" },
  { label: "Suspicious photos", Icon: ImageIcon, iconClass: "bg-violet-100 text-violet-600" },
  { label: "Other", Icon: MoreHorizontal, iconClass: "bg-slate-100 text-slate-500" },
];

const testingScreens: Array<{ id: ScreenId; label: string }> = [
  { id: "welcome", label: "Welcome" },
  { id: "verify_profile", label: "Verify" },
  { id: "verification_progress", label: "Progress" },
  { id: "verified_profile", label: "Verified" },
  { id: "trust_indicator", label: "Trust" },
  { id: "unverified_warning", label: "Warning" },
  { id: "report_fake_profile", label: "Report" },
  { id: "report_confirmation", label: "Confirmation" },
];

function isScreenId(value: string | null): value is ScreenId {
  return !!value && (screenIds as readonly string[]).includes(value);
}

function isVerificationStatus(value: string | null): value is VerificationStatus {
  return value === "not_started" || value === "in_progress" || value === "completed";
}

function loadReports(): MockReport[] {
  const raw = localStorage.getItem(KEYS.reports);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadScreen(): ScreenId {
  const stored = localStorage.getItem(KEYS.currentScreen);
  return isScreenId(stored) ? stored : "welcome";
}

function loadVerificationStatus(): VerificationStatus {
  const stored = localStorage.getItem(KEYS.verificationStatus);
  return isVerificationStatus(stored) ? stored : "not_started";
}

function loadBoolean(key: string): boolean {
  return localStorage.getItem(key) === "true";
}

function formatTime(value: string): string {
  if (!value) return "Not set";

  try {
    return new Date(value).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenId>(loadScreen);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(loadVerificationStatus);
  const [isVerified, setIsVerified] = useState<boolean>(() => loadBoolean(KEYS.isVerified));
  const [selectedReportReason, setSelectedReportReason] = useState(
    () => localStorage.getItem(KEYS.selectedReportReason) || "",
  );
  const [reportDetails, setReportDetails] = useState(() => localStorage.getItem(KEYS.reportDetails) || "");
  const [reports, setReports] = useState<MockReport[]>(loadReports);
  const [lastUpdated, setLastUpdated] = useState(() => localStorage.getItem(KEYS.lastUpdated) || "");
  const [toast, setToast] = useState("");
  const [reportValidation, setReportValidation] = useState("");
  const [liveVerificationStatus, setLiveVerificationStatus] = useState<LiveVerificationStatus>("idle");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "auto" });
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    });
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
      scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }, 80);
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2900);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    scrollToTop();
  }, [currentScreen]);

  useEffect(() => {
    scrollToTop();
  }, []);

  const touch = () => {
    const now = new Date().toISOString();
    localStorage.setItem(KEYS.lastUpdated, now);
    setLastUpdated(now);
    return now;
  };

  const showToast = (message: string) => setToast(message);

  const navigate = (screen: ScreenId) => {
    setCurrentScreen(screen);
    localStorage.setItem(KEYS.currentScreen, screen);
    touch();
    scrollToTop();
  };

  const updateVerification = (status: VerificationStatus) => {
    setVerificationStatus(status);
    localStorage.setItem(KEYS.verificationStatus, status);
    touch();
  };

  const updateVerified = (value: boolean) => {
    setIsVerified(value);
    localStorage.setItem(KEYS.isVerified, String(value));
    touch();
  };

  const startVerification = () => {
    setLiveVerificationStatus("idle");
    updateVerification("in_progress");
    navigate("verification_progress");
    showToast("Verification started. Camera media is preview-only and is not stored.");
  };

  const completeVerification = () => {
    if (liveVerificationStatus !== "passed") {
      showToast("Complete the live privacy check before finishing verification.");
      return;
    }

    updateVerification("completed");
    updateVerified(true);
    navigate("verified_profile");
    showToast("Verification completed. No selfie or video was stored.");
  };

  const cancelVerification = () => {
    setLiveVerificationStatus("idle");
    updateVerification("not_started");
    navigate("verify_profile");
    showToast("Verification reset for prototype testing.");
  };

  const selectReportReason = (reason: string) => {
    setSelectedReportReason(reason);
    setReportValidation("");
    localStorage.setItem(KEYS.selectedReportReason, reason);
    touch();
  };

  const updateReportDetails = (value: string) => {
    const safeValue = value.slice(0, 500);
    setReportDetails(safeValue);
    localStorage.setItem(KEYS.reportDetails, safeValue);
    touch();
  };

  const submitReport = () => {
    if (!selectedReportReason) {
      const message = "Please select a reason before submitting.";
      setReportValidation(message);
      showToast(message);
      return;
    }

    const report: MockReport = {
      id: `report_${Date.now()}`,
      profileId: "profile_alex",
      profileName: "Alex",
      reason: selectedReportReason,
      details: reportDetails,
      createdAt: new Date().toISOString(),
      status: "submitted-local-only",
    };

    const nextReports = [report, ...reports];
    setReports(nextReports);
    localStorage.setItem(KEYS.reports, JSON.stringify(nextReports));
    touch();
    navigate("report_confirmation");
    showToast("Mock report saved locally in this browser.");
  };

  const clearReportDraft = () => {
    setSelectedReportReason("");
    setReportDetails("");
    localStorage.setItem(KEYS.selectedReportReason, "");
    localStorage.setItem(KEYS.reportDetails, "");
    touch();
  };

  const finishReportFlow = () => {
    clearReportDraft();
    navigate("welcome");
  };

  const resetPrototype = () => {
    setCurrentScreen("welcome");
    setVerificationStatus("not_started");
    setIsVerified(false);
    setSelectedReportReason("");
    setReportDetails("");
    setReportValidation("");
    setLiveVerificationStatus("idle");
    localStorage.setItem(KEYS.currentScreen, "welcome");
    localStorage.setItem(KEYS.verificationStatus, "not_started");
    localStorage.setItem(KEYS.isVerified, "false");
    localStorage.setItem(KEYS.selectedReportReason, "");
    localStorage.setItem(KEYS.reportDetails, "");
    touch();
    scrollToTop();
    showToast("Prototype reset. Local reports were kept.");
  };

  const clearLocalData = () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));

    setCurrentScreen("welcome");
    setVerificationStatus("not_started");
    setIsVerified(false);
    setSelectedReportReason("");
    setReportDetails("");
    setReports([]);
    setLastUpdated("");
    setReportValidation("");
    setLiveVerificationStatus("idle");
    scrollToTop();
    showToast("All SafeMatch prototype data was cleared.");
  };

  const screen = useMemo(() => {
    const common = {
      navigate,
      showToast,
    };

    switch (currentScreen) {
      case "verify_profile":
        return <VerifyProfileScreen {...common} onStart={startVerification} />;
      case "verification_progress":
        return (
          <VerificationProgressScreen
            {...common}
            liveVerificationStatus={liveVerificationStatus}
            onLiveVerificationStatusChange={setLiveVerificationStatus}
            onComplete={completeVerification}
            onCancel={cancelVerification}
          />
        );
      case "verified_profile":
        return <VerifiedProfileScreen {...common} isVerified={isVerified} />;
      case "trust_indicator":
        return <TrustIndicatorScreen {...common} />;
      case "unverified_warning":
        return <UnverifiedWarningScreen {...common} />;
      case "report_fake_profile":
        return (
          <ReportFakeProfileScreen
            {...common}
            selectedReason={selectedReportReason}
            reportDetails={reportDetails}
            validationMessage={reportValidation}
            onSelectReason={selectReportReason}
            onDetailsChange={updateReportDetails}
            onSubmit={submitReport}
          />
        );
      case "report_confirmation":
        return <ReportConfirmationScreen {...common} onDone={finishReportFlow} />;
      case "welcome":
      default:
        return <WelcomeScreen {...common} />;
    }
  }, [currentScreen, isVerified, liveVerificationStatus, reportDetails, reportValidation, selectedReportReason, reports]);

  return (
    <>
      <main className="min-h-dvh overflow-x-hidden bg-slate-100 sm:grid sm:h-dvh sm:place-items-center sm:overflow-hidden sm:p-4">
        <div className="phone-frame">
          <div className="phone-camera" aria-hidden="true" />
          <div className="phone-screen relative flex flex-col overflow-hidden bg-[#fbfdff]">
            <AndroidStatusBar />
            <div ref={scrollRef} className="safe-scroll relative flex-1 overflow-y-auto overflow-x-hidden bg-[#fbfdff]">
              <AmbientDecor />
              <div className="relative z-10 px-5 pb-2 sm:px-6">{screen}</div>
              <TestingPanel
                currentScreen={currentScreen}
                verificationStatus={verificationStatus}
                isVerified={isVerified}
                reports={reports}
                selectedReportReason={selectedReportReason}
                lastUpdated={lastUpdated}
                onNavigate={navigate}
                onReset={resetPrototype}
                onClear={clearLocalData}
              />
            </div>
            <AndroidNavBar />
          </div>
        </div>
      </main>
      <Toast message={toast} />
    </>
  );
}

function AndroidStatusBar() {
  return (
    <div className="hidden h-8 shrink-0 items-center justify-between bg-white/90 px-7 text-[11px] font-bold text-ink sm:flex">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px]">5G</span>
        <span className="h-2 w-3 rounded-full bg-ocean/70" />
        <span className="h-2 w-5 rounded-[3px] border border-ink/35 bg-emerald-300" />
      </div>
    </div>
  );
}

function AndroidNavBar() {
  return (
    <div className="hidden h-9 shrink-0 items-center justify-center gap-11 bg-white/90 sm:flex">
      <span className="h-3.5 w-3.5 rounded-sm border-2 border-slate-400" />
      <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-400" />
      <span className="h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-slate-400" />
    </div>
  );
}

function AmbientDecor() {
  return null;
}

function ScreenHeader({ onBack }: { onBack?: () => void }) {
  return (
    <header className="relative flex items-center justify-center pt-6">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="absolute left-0 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-ink transition active:scale-95"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      ) : null}
      <div className="flex items-center gap-2.5">
        <SafeMatchMark className="h-10 w-10" />
        <span className="text-[24px] font-extrabold leading-none text-navy">
          Safe<span className="bg-gradient-to-r from-ocean to-aqua bg-clip-text text-transparent">Match</span>
        </span>
      </div>
    </header>
  );
}

function SafeMatchMark({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <path
        d="M36 6L57 14.5V32C57 47.1 48.5 58.4 36 65C23.5 58.4 15 47.1 15 32V14.5L36 6Z"
        fill="white"
        stroke="url(#safeMatchShield)"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M36 15L49 20V32.3C49 42.4 43.9 50.3 36 55V15Z"
        fill="url(#safeMatchBlue)"
      />
      <path
        d="M36 15L23 20V32.3C23 42.4 28.1 50.3 36 55V15Z"
        fill="url(#safeMatchMint)"
      />
      <circle cx="36" cy="25" r="4.2" fill="white" />
      <path d="M26.5 43C28.5 35.6 43.5 35.6 45.5 43C42.9 47 39.7 50 36 52.1C32.3 50 29.1 47 26.5 43Z" fill="white" />
      <defs>
        <linearGradient id="safeMatchShield" x1="15" y1="6" x2="62" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B6FF3" />
          <stop offset="1" stopColor="#14D6A3" />
        </linearGradient>
        <linearGradient id="safeMatchBlue" x1="37" y1="14" x2="53" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0B6FF3" />
          <stop offset="1" stopColor="#073EC8" />
        </linearGradient>
        <linearGradient id="safeMatchMint" x1="22" y1="15" x2="41" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16DFAE" />
          <stop offset="1" stopColor="#12A7D6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function ScreenTitle({
  title,
  subtitle,
  compact = false,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-6 text-center" : "mt-7 text-center"}>
      <h1 className="text-balance break-words text-[32px] font-extrabold leading-tight text-navy">
        {title}
      </h1>
      {subtitle ? <p className="mx-auto mt-3 max-w-[330px] text-[16px] leading-6 text-ink/70">{subtitle}</p> : null}
    </div>
  );
}

function PrimaryButton({
  children,
  onClick,
  tone = "default",
  leftIcon: LeftIcon,
  rightIcon,
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: "default" | "warning";
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon | null;
  disabled?: boolean;
  className?: string;
}) {
  const RightIcon = rightIcon === undefined ? ArrowRight : rightIcon;
  const toneClass =
    tone === "warning"
      ? "border-caution bg-caution text-white"
      : "border-ocean bg-ocean text-white";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`grid min-h-[52px] w-full grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-2 rounded-2xl border px-4 py-3 text-[16px] font-bold shadow-sm transition active:scale-[0.99] disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-300 disabled:text-white/80 disabled:shadow-none ${toneClass} ${className}`}
    >
      <span className="flex items-center justify-center">{LeftIcon ? <LeftIcon className="h-5 w-5" strokeWidth={2.2} /> : null}</span>
      <span className="min-w-0 whitespace-normal text-center leading-snug">{children}</span>
      <span className="flex items-center justify-center">{RightIcon ? <RightIcon className="h-5 w-5" strokeWidth={2.4} /> : null}</span>
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  leftIcon: LeftIcon,
  rightIcon,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon | null;
  tone?: "default" | "warning";
  className?: string;
}) {
  const RightIcon = rightIcon === undefined ? ArrowRight : rightIcon;
  const toneClass =
    tone === "warning"
      ? "border-caution text-caution"
      : "border-ocean text-ocean";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid min-h-[50px] w-full grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2 rounded-2xl border bg-white px-4 py-3 text-[16px] font-bold transition active:scale-[0.99] ${toneClass} ${className}`}
    >
      <span className="flex items-center justify-center">{LeftIcon ? <LeftIcon className={tone === "warning" ? "h-5 w-5 text-caution" : "h-5 w-5"} /> : null}</span>
      <span className="min-w-0 whitespace-normal text-center leading-snug">{children}</span>
      <span className="flex items-center justify-center">{RightIcon ? <RightIcon className={tone === "warning" ? "h-5 w-5 text-caution" : "h-5 w-5"} /> : null}</span>
    </button>
  );
}

function LinkButton({
  children,
  onClick,
  icon: Icon = ArrowRight,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mx-auto flex items-center justify-center gap-2 text-[15px] font-bold text-ocean transition active:scale-95 ${className}`}
    >
      <span>{children}</span>
      <Icon className="h-5 w-5" />
    </button>
  );
}

function InfoNote({
  children,
  tone = "blue",
  className = "",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "orange";
  className?: string;
}) {
  const toneClass = {
    blue: "border-blue-100 bg-blue-50/85 text-ink",
    green: "border-emerald-100 bg-emerald-50/85 text-ink",
    orange: "border-orange-100 bg-orange-50/85 text-ink",
  }[tone];
  const iconClass = {
    blue: "text-ocean",
    green: "text-aqua",
    orange: "text-caution",
  }[tone];

  return (
    <div className={`flex items-center gap-4 rounded-[20px] border px-5 py-4 shadow-sm ${toneClass} ${className}`}>
      <Info className={`h-8 w-8 shrink-0 ${iconClass}`} />
      <p className="text-[15px] font-semibold leading-6">{children}</p>
    </div>
  );
}

function PaginationDots({ active = 0, tone = "blue" }: { active?: number; tone?: "blue" | "orange" }) {
  const activeClass = tone === "orange" ? "bg-caution" : "bg-ocean";
  return (
    <div className="mt-5 flex items-center justify-center gap-3">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className={`h-3 w-3 rounded-full ${dot === active ? activeClass : "bg-blue-100"}`} />
      ))}
    </div>
  );
}

function IconBubble({
  Icon,
  className = "",
  iconClass = "",
}: {
  Icon: LucideIcon;
  className?: string;
  iconClass?: string;
}) {
  return (
    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${className || "bg-blue-50"}`}>
      <Icon className={`h-7 w-7 ${iconClass || "text-ocean"}`} strokeWidth={2.5} />
    </div>
  );
}

function WelcomeScreen({ navigate, showToast }: ScreenProps) {
  return (
    <section className="pb-6">
      <ScreenHeader />
      <div className="mt-7 text-center">
        <h1 className="text-[40px] font-extrabold leading-none text-navy">
          SafeMatch
        </h1>
        <p className="mt-3 text-[17px] leading-6 text-ink/70">
          Connect with real people, <span className="font-extrabold text-aqua">safely.</span>
        </p>
      </div>

      <WelcomeHero />

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-sm">
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
          <FeatureCard Icon={UserCheck} title="Verify Profiles" text="Authentic people, real connections" />
          <FeatureCard Icon={Star} title="Trust Indicators" text="See signals before you trust" />
          <FeatureCard Icon={Flag} title="Report Safely" text="Help keep the community safe" />
        </div>
      </div>

      <p className="mx-auto mt-6 max-w-[340px] text-center text-[16px] font-medium leading-6 text-ink/75">
        Verify profiles, check trust indicators, and report <span className="font-extrabold text-ocean">suspicious accounts</span> before investing time or personal information.
      </p>

      <div className="mt-6 space-y-3">
        <PrimaryButton onClick={() => navigate("verify_profile")}>Get Started</PrimaryButton>
        <SecondaryButton onClick={() => showToast("SafeMatch helps users identify verified profiles before chatting.")}>
          Learn More
        </SecondaryButton>
      </div>
      <PaginationDots active={0} />
    </section>
  );
}

function WelcomeHero() {
  return (
    <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-ocean">
        <ShieldCheck className="h-9 w-9" />
      </div>
      <h2 className="mt-4 text-[20px] font-extrabold text-ink">Check trust before chatting</h2>
      <p className="mx-auto mt-2 max-w-[280px] text-[14px] font-medium leading-6 text-ink/65">
        Verify your profile, review trust indicators, and report suspicious accounts from one simple flow.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-left">
        <div className="rounded-xl bg-emerald-50 p-3">
          <p className="text-[12px] font-bold uppercase tracking-wide text-emerald-700">Verified</p>
          <p className="mt-1 text-[18px] font-extrabold text-ink">92/100</p>
        </div>
        <div className="rounded-xl bg-orange-50 p-3">
          <p className="text-[12px] font-bold uppercase tracking-wide text-caution">Warning</p>
          <p className="mt-1 text-[18px] font-extrabold text-ink">Unverified</p>
        </div>
      </div>
    </div>
  );
}

function HeroProfileMiniCard({
  side,
  name,
  meta,
  Icon,
  tone,
}: {
  side: "left" | "right";
  name: string;
  meta: string;
  Icon: LucideIcon;
  tone: "verified" | "warning";
}) {
  const isWarning = tone === "warning";
  return (
    <div
      className={`absolute bottom-8 z-20 flex w-[158px] items-center gap-3 rounded-[24px] border bg-white/95 p-3 shadow-soft ${
        side === "left" ? "left-0" : "right-0"
      } ${isWarning ? "border-orange-100" : "border-emerald-100"}`}
    >
      <ProfileAvatar verified={!isWarning} suspicious={isWarning} size="small" />
      <div className="min-w-0">
        <p className="truncate text-[16px] font-extrabold text-ink">{name}</p>
        <p className={`mt-0.5 flex items-center gap-1 text-[12px] font-extrabold ${isWarning ? "text-caution" : "text-aqua"}`}>
          <Icon className="h-3.5 w-3.5" />
          {meta}
        </p>
      </div>
    </div>
  );
}

function FeatureCard({ Icon, title, text }: { Icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="px-2">
      <IconBubble Icon={Icon} className="mx-auto bg-emerald-50" iconClass="text-aqua" />
      <h2 className="mt-3 text-[15px] font-extrabold leading-5 text-ink">{title}</h2>
      <p className="mt-1 text-[13px] font-medium leading-5 text-ink/70">{text}</p>
    </div>
  );
}

function VerifyProfileScreen({ navigate, onStart }: ScreenProps & { onStart: () => void }) {
  return (
    <section className="pb-6">
      <ScreenHeader />
      <ScreenTitle
        title="Verify Profile"
        subtitle="Complete a quick verification to build trust and safety."
      />
      <VerifyHero />
      <div className="-mt-1 rounded-[28px] bg-white/95 px-5 py-5 shadow-soft">
        <StepRow Icon={Camera} number="1" title="Take a selfie" text="Capture a clear photo of your face." />
        <StepRow Icon={Video} number="2" title="Record a short video" text="Record a brief video to confirm you're a real person." />
        <StepRow Icon={CreditCard} number="3" title="Confirm your identity" text="Review and confirm your details for added security." last />
      </div>
      <InfoNote className="mt-6">
        Production-prototype mode: the next step can request camera access for a live preview check. No selfie, video, ID, or biometric data is saved.
      </InfoNote>
      <div className="mt-6 space-y-4">
        <PrimaryButton onClick={onStart}>Start Verification</PrimaryButton>
        <LinkButton onClick={() => navigate("welcome")} icon={ArrowLeft}>Back</LinkButton>
      </div>
      <PaginationDots active={1} />
    </section>
  );
}

function VerifyHero() {
  return (
    <div className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-ocean">
          <Camera className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-[18px] font-extrabold text-ink">Privacy-first live check</h2>
          <p className="mt-1 text-[14px] font-medium leading-5 text-ink/65">
            Preview your camera, run a local liveness-style check, then stop the stream.
          </p>
        </div>
      </div>
    </div>
  );
}

function StepRow({
  Icon,
  number,
  title,
  text,
  last = false,
}: {
  Icon: LucideIcon;
  number: string;
  title: string;
  text: string;
  last?: boolean;
}) {
  return (
    <div className={`flex gap-4 ${last ? "" : "border-b border-blue-100 pb-5 mb-5"}`}>
      <IconBubble Icon={Icon} className={number === "2" ? "bg-emerald-50" : number === "3" ? "bg-violet-50" : "bg-blue-50"} iconClass={number === "2" ? "text-aqua" : number === "3" ? "text-violet-500" : "text-ocean"} />
      <div className="flex flex-1 gap-3">
        <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white ${number === "2" ? "bg-aqua" : number === "3" ? "bg-violet-500" : "bg-ocean"}`}>
          {number}
        </span>
        <div>
          <h2 className="text-[18px] font-extrabold leading-6 text-ink">{title}</h2>
          <p className="mt-1 text-[15px] font-medium leading-6 text-ink/70">{text}</p>
        </div>
      </div>
    </div>
  );
}

function VerificationProgressScreen({
  liveVerificationStatus,
  onLiveVerificationStatusChange,
  showToast,
  onComplete,
  onCancel,
}: ScreenProps & {
  liveVerificationStatus: LiveVerificationStatus;
  onLiveVerificationStatusChange: (status: LiveVerificationStatus) => void;
  onComplete: () => void;
  onCancel: () => void;
}) {
  const canComplete = liveVerificationStatus === "passed";

  return (
    <section className="pb-6">
      <ScreenHeader />
      <ScreenTitle title="Live Verification" subtitle="Preview-only checks. Nothing is stored." compact />
      <LiveVerificationCard
        status={liveVerificationStatus}
        onStatusChange={onLiveVerificationStatusChange}
        showToast={showToast}
      />
      <div className="relative mt-9">
        <LeafSprig className="left-0 top-36 text-aqua" />
        <LeafSprig className="right-0 top-36 scale-x-[-1] text-blue-300" />
        <ProgressRing percent={75} />
      </div>
      <InfoNote className="mx-auto mt-5 max-w-[330px]">
        This prototype checks device permission and liveness flow only. It does not verify a legal identity.
      </InfoNote>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
        <StatusRow Icon={Camera} text="Camera preview or safe fallback" done={liveVerificationStatus === "active" || liveVerificationStatus === "checking" || canComplete} />
        <StatusRow Icon={Eye} text="Presence check completed" done={canComplete} loading={liveVerificationStatus === "checking"} />
        <StatusRow Icon={Lock} text="No media saved or uploaded" done={canComplete} last />
      </div>
      <div className="mt-6 space-y-3">
        {!canComplete ? (
          <p className="text-center text-[14px] font-extrabold text-ink/55">Complete the live privacy check before finishing.</p>
        ) : null}
        <PrimaryButton disabled={!canComplete} onClick={onComplete} leftIcon={ShieldCheck}>Complete Verification</PrimaryButton>
        <SecondaryButton onClick={onCancel} rightIcon={null}>Cancel</SecondaryButton>
      </div>
      <PaginationDots active={1} />
    </section>
  );
}

function LiveVerificationCard({
  status,
  onStatusChange,
  showToast,
}: {
  status: LiveVerificationStatus;
  onStatusChange: (status: LiveVerificationStatus) => void;
  showToast: (message: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [noticeText, setNoticeText] = useState("");

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => stopStream, []);

  const startLivePreview = async () => {
    setNoticeText("");

    if (!navigator.mediaDevices?.getUserMedia) {
      stopStream();
      onStatusChange("passed");
      setNoticeText("Camera preview is not available in this browser. SafeMatch used the prototype-safe fallback and stored no media.");
      showToast("Prototype fallback used. No camera media was collected.");
      return;
    }

    try {
      onStatusChange("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      onStatusChange("active");
      showToast("Live preview started. No media is being recorded.");
    } catch {
      stopStream();
      onStatusChange("passed");
      setNoticeText("Camera preview was unavailable in this browser. SafeMatch used the prototype-safe fallback and stored no media.");
      showToast("Prototype fallback used. No camera media was collected.");
    }
  };

  const runLiveCheck = () => {
    if (status !== "active") {
      showToast("Start the live preview first.");
      return;
    }

    onStatusChange("checking");
    window.setTimeout(() => {
      stopStream();
      onStatusChange("passed");
      showToast("Live check passed. Preview stopped and no media was saved.");
    }, 1800);
  };

  const usePrototypeFallback = () => {
    stopStream();
    onStatusChange("passed");
    setNoticeText("Prototype-safe fallback is ready. No camera media was collected or stored.");
    showToast("Prototype fallback approved. No camera media was collected.");
  };

  const statusCopy: Record<LiveVerificationStatus, { title: string; text: string }> = {
    idle: {
      title: "Ready for a live check",
      text: "Start a camera preview, confirm you are present, then the stream is stopped.",
    },
    requesting: {
      title: "Requesting permission",
      text: "Your browser will ask for camera access. Audio is never requested.",
    },
    active: {
      title: "Live preview active",
      text: "Look at the camera. The prototype is previewing only, not recording.",
    },
    checking: {
      title: "Checking live presence",
      text: "Hold still for a moment while the local-only prototype check completes.",
    },
    passed: {
      title: "Verification check ready",
      text: "You can complete verification. No image or video was stored.",
    },
    blocked: {
      title: "Camera unavailable",
      text: "You can allow camera permission or use the prototype fallback for testing.",
    },
    unsupported: {
      title: "Camera not supported",
      text: "This browser cannot run the live preview, so use the prototype fallback.",
    },
  };

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-44 bg-slate-50">
        {status === "active" || status === "checking" ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
            autoPlay
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${status === "passed" ? "bg-emerald-50 text-aqua" : "bg-blue-50 text-ocean"}`}>
              {status === "passed" ? <ShieldCheck className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
            </div>
            <p className="mt-3 text-[16px] font-extrabold text-ink">{statusCopy[status].title}</p>
            <p className="mt-1 text-[13px] font-semibold leading-5 text-ink/60">{statusCopy[status].text}</p>
          </div>
        )}
        {status === "checking" ? (
          <div className="absolute inset-0 grid place-items-center bg-ink/20 backdrop-blur-[2px]">
            <div className="rounded-full bg-white/95 px-5 py-3 text-[15px] font-extrabold text-ink shadow-soft">Checking...</div>
          </div>
        ) : null}
      </div>
      <div className="space-y-3 p-4">
        {noticeText ? <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-[13px] font-extrabold leading-5 text-ocean">{noticeText}</p> : null}
        {status === "passed" ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-[14px] font-extrabold text-aqua">
            <ShieldCheck className="h-5 w-5" />
            Ready to complete verification
          </div>
        ) : (
          <>
            <PrimaryButton
              className="min-h-[50px] rounded-2xl text-[15px]"
              onClick={usePrototypeFallback}
              leftIcon={ShieldCheck}
              rightIcon={Check}
            >
              Use Prototype Fallback
            </PrimaryButton>
            <div className="grid grid-cols-2 gap-3">
              <SecondaryButton
                className="min-h-[50px] rounded-[16px] text-[15px]"
                onClick={startLivePreview}
                leftIcon={Camera}
                rightIcon={null}
              >
                Start Preview
              </SecondaryButton>
              <SecondaryButton
                className="min-h-[50px] rounded-[16px] text-[15px]"
                onClick={runLiveCheck}
                leftIcon={Eye}
                rightIcon={null}
              >
                Run Check
              </SecondaryButton>
            </div>
          </>
        )}
        <p className="text-center text-[12px] font-bold leading-5 text-ink/45">
          Privacy guardrail: this screen never writes camera media to localStorage.
        </p>
      </div>
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  return (
    <div className="mx-auto w-full rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide text-ink/45">Verification progress</p>
          <p className="mt-1 text-[18px] font-extrabold text-ink">Almost there</p>
        </div>
        <p className="text-[30px] font-extrabold leading-none text-ocean">{percent}%</p>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-50">
        <div className="h-full rounded-full bg-ocean" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function StatusRow({
  Icon,
  text,
  done = false,
  loading = false,
  last = false,
}: {
  Icon: LucideIcon;
  text: string;
  done?: boolean;
  loading?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-4 ${last ? "" : "border-b border-blue-100 pb-4 mb-4"}`}>
      <IconBubble Icon={Icon} className={done ? "bg-emerald-50" : "bg-blue-50"} iconClass={done ? "text-aqua" : "text-ocean"} />
      <p className="flex-1 text-[16px] font-semibold text-ink">{text}</p>
      {done ? <CheckCircle2 className="h-8 w-8 text-aqua" /> : null}
      {loading ? <span className="loading-dots" aria-label="Loading" /> : null}
    </div>
  );
}

function VerifiedProfileScreen({ navigate, showToast, isVerified }: ScreenProps & { isVerified: boolean }) {
  return (
    <section className="pb-6">
      <ScreenHeader />
      <ScreenTitle title="Verified Profile" subtitle="Real people. Safer connections." />
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <ProfileAvatar verified />
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-extrabold leading-tight text-ink">
              {verifiedProfile.name}, <span className="font-semibold">{verifiedProfile.age}</span>
            </h2>
            <p className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-ink/65">
              <GraduationCap className="h-5 w-5" />
              {verifiedProfile.status}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[14px] font-extrabold text-emerald-700">
              <BadgeCheck className="h-5 w-5" />
              {isVerified ? "Verified" : "Verified"}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-aqua">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-[18px] font-extrabold text-emerald-700">Your profile is verified</h2>
            <p className="mt-1 text-[14px] font-semibold leading-6 text-ink/75">
              We’ve verified this profile using simulated selfie and profile matching to help keep SafeMatch safe.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-4 shadow-sm">
        <h2 className="px-1 text-[17px] font-bold text-ink">Profile Highlights</h2>
        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 text-center">
          <Highlight Icon={GraduationCap} title="Education" value={verifiedProfile.status} />
          <Highlight Icon={MapPin} title="Location" value={verifiedProfile.location} />
          <Highlight Icon={Heart} title="Interests" value={verifiedProfile.interests.join(", ")} />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        <PrimaryButton onClick={() => navigate("trust_indicator")} leftIcon={Shield}>View Trust Score</PrimaryButton>
        <SecondaryButton onClick={() => showToast("Prototype simulation: messaging is not active.")} leftIcon={MessageCircle} rightIcon={null}>
          Message
        </SecondaryButton>
      </div>
    </section>
  );
}

function Highlight({ Icon, title, value }: { Icon: LucideIcon; title: string; value: string }) {
  return (
    <div className="px-2">
      <IconBubble Icon={Icon} className="mx-auto bg-blue-50" iconClass={title === "Location" ? "text-aqua" : "text-ocean"} />
      <h3 className="mt-3 text-[14px] font-extrabold text-ink">{title}</h3>
      <p className="mt-1 text-[12px] font-medium leading-4 text-ink/65">{value}</p>
    </div>
  );
}

function TrustIndicatorScreen({ navigate, showToast }: ScreenProps) {
  return (
    <section className="pb-6">
      <ScreenHeader onBack={() => navigate("verified_profile")} />
      <ScreenTitle title="Trust Indicator" subtitle="See how trustworthy this profile is." compact />
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <ProfileAvatar verified />
          <div className="min-w-0">
            <h2 className="text-[22px] font-extrabold leading-tight text-ink">{verifiedProfile.name}, {verifiedProfile.age}</h2>
            <p className="mt-3 flex items-center gap-2 text-[15px] font-semibold text-ink/70">
              <MapPin className="h-5 w-5" />
              {verifiedProfile.location}
            </p>
            <p className="mt-2 text-[15px] font-semibold text-ink/70">{verifiedProfile.status}</p>
          </div>
          <BadgeCheck className="ml-auto h-9 w-9 shrink-0 text-ocean" />
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
        <TrustGauge score={verifiedProfile.trustScore} />
        <p className="mt-3 text-[15px] font-semibold leading-6 text-ink/75">
          This profile has a strong trust score. You can feel confident connecting.
        </p>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
        {verificationChecklist.map((item, index) => (
          <div key={item} className={`flex items-center gap-4 py-4 ${index === verificationChecklist.length - 1 ? "" : "border-b border-blue-100"}`}>
            <CheckCircle2 className="h-6 w-6 shrink-0 text-aqua" />
            <span className="flex-1 text-[15px] font-semibold text-ink">{item}</span>
            <Info className="h-5 w-5 text-slate-400" />
          </div>
        ))}
      </div>
      <LinkButton className="mt-5" onClick={() => showToast("Trust score is based on simulated verification signals for prototype testing.")} icon={ArrowRight}>
        Learn how this works
      </LinkButton>
      <div className="mt-5 space-y-3">
        <PrimaryButton onClick={() => showToast("Prototype simulation: chat is not active.")}>Continue to Chat</PrimaryButton>
        <SecondaryButton onClick={() => navigate("unverified_warning")}>View Unverified Example</SecondaryButton>
      </div>
    </section>
  );
}

function TrustGauge({ score }: { score: number }) {
  return (
    <div className="mx-auto w-full text-left">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-wide text-ink/45">Trust Score</p>
          <p className="mt-1 text-[36px] font-extrabold leading-none text-navy">
            {score}<span className="text-[18px] font-semibold text-ink/55">/100</span>
          </p>
        </div>
        <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-[15px] font-extrabold text-aqua">
          <ShieldCheck className="h-5 w-5" />
          High
        </span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-50">
        <div className="h-full rounded-full bg-ocean" style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function UnverifiedWarningScreen({ navigate, showToast }: ScreenProps) {
  return (
    <section className="pb-6">
      <ScreenHeader />
      <ScreenTitle
        title="Unverified Warning"
        subtitle={
          <>
            Proceed with <span className="font-extrabold text-caution">caution.</span>
          </>
        }
      />
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <ProfileAvatar suspicious />
          <div className="min-w-0 flex-1">
            <h2 className="text-[26px] font-extrabold leading-tight text-ink">
              {unverifiedProfile.name}, {unverifiedProfile.age}
            </h2>
            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-ink/60">
              <MapPin className="h-5 w-5" />
              {unverifiedProfile.location}
            </p>
            <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-ink/60">
              <Calendar className="h-5 w-5" />
              Joined {unverifiedProfile.joined}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <User className="h-6 w-6" />
            <span className="text-lg font-extrabold">?</span>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-5 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-caution">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-[22px] font-extrabold leading-tight text-caution">This profile is not verified.</h2>
        <p className="mt-3 text-[15px] font-semibold leading-6 text-ink/75">
          We couldn’t confirm this user’s identity. Be careful when communicating and avoid sharing personal information or investing too much time.
        </p>
      </div>
      <div className="mt-6 space-y-3">
        <PrimaryButton tone="warning" onClick={() => navigate("report_fake_profile")} leftIcon={Flag}>Report Profile</PrimaryButton>
        <SecondaryButton tone="warning" onClick={() => showToast("Prototype simulation: proceed carefully.")} leftIcon={ShieldAlert}>
          Continue Carefully
        </SecondaryButton>
        <LinkButton onClick={() => navigate("verify_profile")}>Learn About Verification</LinkButton>
      </div>
      <PaginationDots active={0} tone="orange" />
    </section>
  );
}

function ReportFakeProfileScreen({
  navigate,
  selectedReason,
  reportDetails,
  validationMessage,
  onSelectReason,
  onDetailsChange,
  onSubmit,
}: ScreenProps & {
  selectedReason: string;
  reportDetails: string;
  validationMessage: string;
  onSelectReason: (reason: string) => void;
  onDetailsChange: (value: string) => void;
  onSubmit: () => void;
}) {
  const handleDetailsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onDetailsChange(event.target.value);
  };

  return (
    <section className="pb-6">
      <ScreenHeader onBack={() => navigate("unverified_warning")} />
      <ScreenTitle title="Report Fake Profile" subtitle="Help us keep the community safe." compact />
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-4">
          <IconBubble Icon={ShieldAlert} className="bg-blue-50" iconClass="text-ocean" />
          <div>
            <h2 className="text-[18px] font-extrabold leading-6 text-ink">Why are you reporting this profile?</h2>
            <p className="mt-1 text-[14px] font-medium leading-5 text-ink/65">
              Select the option that best describes the issue.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {reportReasons.map(({ label, Icon, iconClass }) => {
            const selected = selectedReason === label;
            return (
              <label
                key={label}
                className={`flex min-h-[58px] w-full cursor-pointer items-center gap-3 rounded-2xl border px-3 text-left transition active:scale-[0.99] ${
                  selected ? "border-ocean bg-blue-50/80 shadow-sm" : "border-blue-100 bg-white"
                }`}
              >
                <input
                  id={`report-reason-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  type="radio"
                  name="report-reason"
                  value={label}
                  aria-label={label}
                  checked={selected}
                  onChange={() => onSelectReason(label)}
                  className="sr-only"
                />
                <IconBubble Icon={Icon} className={iconClass.split(" ").slice(0, 1).join(" ")} iconClass={iconClass.split(" ").slice(1).join(" ")} />
                <span className="flex-1 text-[16px] font-bold text-ink">{label}</span>
                {selected ? <span className="sr-only">Selected</span> : null}
                <span className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${selected ? "border-ocean bg-ocean text-white" : "border-slate-300"}`}>
                  {selected ? <Check className="h-5 w-5" strokeWidth={3} /> : null}
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-6">
          <label htmlFor="report-details" className="text-[16px] font-extrabold text-ink">
            Add details <span className="font-semibold text-ink/55">(optional)</span>
          </label>
          <p className="mt-1 text-[14px] font-medium leading-5 text-ink/65">
            Provide any additional information that can help us understand the issue.
          </p>
          <div className="relative mt-3">
            <textarea
              id="report-details"
              value={reportDetails}
              onChange={handleDetailsChange}
              maxLength={500}
              placeholder="Type your details here..."
              className="min-h-[118px] w-full resize-none rounded-[18px] border border-blue-200 bg-white px-4 py-4 pr-20 text-[16px] font-medium leading-6 text-ink outline-none transition placeholder:text-slate-400 focus:border-ocean focus:ring-4 focus:ring-blue-100"
            />
            <span className="absolute bottom-4 right-4 text-[15px] font-semibold text-ink/50">{reportDetails.length}/500</span>
          </div>
          {validationMessage ? <p className="mt-3 text-[15px] font-extrabold text-caution">{validationMessage}</p> : null}
        </div>
      </div>
      <InfoNote className="mt-5" tone="blue">
        Your report is saved locally in this browser for prototype testing only.
      </InfoNote>
      <div className="mt-6">
        <PrimaryButton onClick={onSubmit}>Submit Report</PrimaryButton>
      </div>
    </section>
  );
}

function ReportConfirmationScreen({ navigate, onDone }: ScreenProps & { onDone: () => void }) {
  return (
    <section className="pb-6">
      <ScreenHeader />
      <ScreenTitle title="Report Confirmation" compact />
      <div className="mx-auto mt-7 flex h-24 w-24 items-center justify-center rounded-2xl bg-emerald-50 text-aqua">
        <Check className="h-14 w-14" strokeWidth={4} />
      </div>
      <div className="text-center">
        <h2 className="mt-6 text-[34px] font-extrabold leading-none text-navy">
          Thank you!
        </h2>
        <p className="mt-4 text-[18px] font-extrabold text-ink">Your report has been submitted.</p>
        <p className="mt-2 text-[15px] font-medium leading-6 text-ink/70">We will review it and take action if needed.</p>
      </div>
      <InfoNote className="mt-6" tone="blue">
        Prototype simulation only. Report saved locally in your browser only.
      </InfoNote>
      <div className="mt-6 space-y-3">
        <PrimaryButton onClick={onDone} rightIcon={Check}>Done</PrimaryButton>
        <LinkButton onClick={() => navigate("welcome")} icon={Home}>Back to Home</LinkButton>
      </div>
    </section>
  );
}

function ProfileAvatar({
  verified = false,
  suspicious = false,
  size = "normal",
}: {
  verified?: boolean;
  suspicious?: boolean;
  size?: "small" | "normal" | "large";
}) {
  const dimensions = size === "large" ? "h-32 w-32" : size === "small" ? "h-14 w-14" : "h-24 w-24";
  const badgeSize = size === "small" ? "h-6 w-6 ring-2" : "h-11 w-11 ring-4";
  const badgeIconSize = size === "small" ? "h-4 w-4" : "h-7 w-7";
  const warningIconSize = size === "small" ? "h-3.5 w-3.5" : "h-6 w-6";
  return (
    <div className={`profile-avatar relative shrink-0 ${dimensions} ${suspicious ? "profile-avatar-suspicious" : ""}`}>
      <MiniAvatar verified={verified} suspicious={suspicious} />
      {verified ? (
        <span className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-aqua text-white shadow-md ring-white ${badgeSize}`}>
          <Check className={badgeIconSize} strokeWidth={4} />
        </span>
      ) : null}
      {suspicious ? (
        <span className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-caution text-white shadow-md ring-white ${badgeSize}`}>
          <AlertTriangle className={warningIconSize} strokeWidth={2.8} />
        </span>
      ) : null}
    </div>
  );
}

function MiniAvatar({ verified = false, suspicious = false }: { verified?: boolean; suspicious?: boolean }) {
  return (
    <div className={`mini-avatar ${verified ? "mini-avatar-sara" : "mini-avatar-alex"} ${suspicious ? "blur-sm saturate-50" : ""}`}>
      <span className="avatar-backdrop" />
      <span className="avatar-hair" />
      <span className="avatar-ear avatar-ear-left" />
      <span className="avatar-ear avatar-ear-right" />
      <span className="avatar-face">
        <span className="avatar-eye left-eye" />
        <span className="avatar-eye right-eye" />
        <span className="avatar-nose" />
        <span className="avatar-cheek avatar-cheek-left" />
        <span className="avatar-cheek avatar-cheek-right" />
        <span className="avatar-smile" />
      </span>
      <span className={verified ? "avatar-shirt avatar-shirt-mint" : "avatar-shirt avatar-shirt-blue"} />
    </div>
  );
}

function LeafSprig({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`leaf-sprig absolute ${className}`}>
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

type ScreenProps = {
  navigate: (screen: ScreenId) => void;
  showToast: (message: string) => void;
};

function TestingPanel({
  currentScreen,
  verificationStatus,
  isVerified,
  reports,
  selectedReportReason,
  lastUpdated,
  onNavigate,
  onReset,
  onClear,
}: {
  currentScreen: ScreenId;
  verificationStatus: VerificationStatus;
  isVerified: boolean;
  reports: MockReport[];
  selectedReportReason: string;
  lastUpdated: string;
  onNavigate: (screen: ScreenId) => void;
  onReset: () => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [currentScreen]);

  return (
    <>
      <div className="relative z-30 mx-4 mt-8 pb-3">
        <div className="overflow-hidden rounded-[20px] border border-blue-100 bg-white/95 shadow-soft backdrop-blur">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] font-extrabold text-ink"
          >
            <Database className="h-4 w-4 text-ocean" />
            <span className="flex-1">Prototype Data</span>
            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          {open ? (
            <div className="border-t border-blue-100 px-4 py-4">
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <DataPill label="Current screen" value={currentScreen} />
                <DataPill label="Verification" value={verificationStatus} />
                <DataPill label="Is verified" value={String(isVerified)} />
                <DataPill label="Reports" value={String(reports.length)} />
                <DataPill label="Last reason" value={selectedReportReason || "None"} />
                <DataPill label="Last updated" value={formatTime(lastUpdated)} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <PanelButton onClick={() => setReportsOpen(true)} Icon={Eye}>Reports</PanelButton>
                <PanelButton onClick={onReset} Icon={RotateCcw}>Reset</PanelButton>
                <PanelButton onClick={onClear} Icon={Trash2} danger>Clear</PanelButton>
              </div>
              <div className="mt-4">
                <p className="mb-2 text-[12px] font-extrabold uppercase text-ink/45">Testing Navigation</p>
                <div className="grid grid-cols-4 gap-2">
                  {testingScreens.map((screen) => (
                    <button
                      key={screen.id}
                      type="button"
                      onClick={() => onNavigate(screen.id)}
                      className={`rounded-xl border px-2 py-2 text-[11px] font-extrabold transition active:scale-95 ${
                        currentScreen === screen.id
                          ? "border-ocean bg-blue-50 text-ocean"
                          : "border-blue-100 bg-white text-ink/70"
                      }`}
                    >
                      {screen.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      {reportsOpen ? <ReportsModal reports={reports} onClose={() => setReportsOpen(false)} /> : null}
    </>
  );
}

function DataPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-blue-50/70 px-3 py-2">
      <p className="font-extrabold text-ink/45">{label}</p>
      <p className="mt-1 truncate font-extrabold text-ink">{value}</p>
    </div>
  );
}

function PanelButton({
  children,
  onClick,
  Icon,
  danger = false,
}: {
  children: ReactNode;
  onClick: () => void;
  Icon: LucideIcon;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-extrabold transition active:scale-95 ${
        danger ? "border-orange-200 bg-orange-50 text-caution" : "border-blue-100 bg-white text-ocean"
      }`}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function ReportsModal({ reports, onClose }: { reports: MockReport[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 px-4 backdrop-blur-sm">
      <div className="max-h-[78dvh] w-full max-w-[390px] overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-center gap-3 border-b border-blue-100 px-5 py-4">
          <Database className="h-6 w-6 text-ocean" />
          <h2 className="flex-1 text-[20px] font-extrabold text-ink">Local Reports</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close local reports"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-ink"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[58dvh] overflow-y-auto px-5 py-4">
          {reports.length === 0 ? (
            <div className="rounded-[20px] bg-blue-50/80 px-4 py-8 text-center">
              <FileReportIcon />
              <p className="mt-3 text-[16px] font-extrabold text-ink">No local reports yet.</p>
              <p className="mt-1 text-[14px] font-medium leading-6 text-ink/65">Submit a mock report to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <article key={report.id} className="rounded-[18px] border border-blue-100 bg-blue-50/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[16px] font-extrabold text-ink">{report.profileName}</h3>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-extrabold text-emerald-700">
                      {report.status}
                    </span>
                  </div>
                  <p className="mt-2 text-[14px] font-extrabold text-ocean">{report.reason}</p>
                  <p className="mt-2 text-[13px] font-medium leading-5 text-ink/65">
                    {report.details || "No extra details provided."}
                  </p>
                  <p className="mt-3 text-[11px] font-bold text-ink/45">{new Date(report.createdAt).toLocaleString()}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileReportIcon() {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-ocean shadow-sm">
      <Flag className="h-7 w-7" />
    </div>
  );
}

function Toast({ message }: { message: string }) {
  if (!message) return null;

  return (
    <div className="fixed left-1/2 top-4 z-[60] w-[min(92vw,390px)] -translate-x-1/2 rounded-[18px] border border-blue-100 bg-white/95 px-4 py-3 text-center text-[14px] font-extrabold text-ink shadow-2xl backdrop-blur">
      {message}
    </div>
  );
}
