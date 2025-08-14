import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Utilitaires ---
const LIKERT = [
  { value: 1, label: "Jamais" },
  { value: 2, label: "Rarement" },
  { value: 3, label: "Parfois" },
  { value: 4, label: "Souvent" },
  { value: 5, label: "Toujours" },
];

const QUESTIONS = [
  "Combien de fois par semaine dites-vous sincèrement \"merci\" ?",
  "Remarquez-vous facilement quand quelqu'un fait un effort pour vous ?",
  "Trouvez-vous facilement des choses positives dans votre journée ?",
  "Rendez-vous naturellement service quand on vous aide ?",
  "Vous souvenez-vous facilement des gestes gentils qu'on a eus envers vous ?",
];

const STORAGE_KEY = "gratitude-test-v1";

function classNames(...xs) {
  return xs.filter(Boolean).join(" ");
}

function useLocalState(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState];
}

// --- Composants UI atomiques ---
function Card({ children, className }) {
  return (
    <div className={classNames("bg-white/80 backdrop-blur rounded-2xl shadow-lg", className)}>
      {children}
    </div>
  );
}

function Button({ children, className, ...props }) {
  return (
    <button
      className={classNames(
        "px-4 py-2 rounded-xl font-semibold shadow transition active:scale-[0.99]",
        "bg-amber-500 hover:bg-amber-600 text-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function GhostButton({ children, className, ...props }) {
  return (
    <button
      className={classNames(
        "px-3 py-2 rounded-xl font-medium border border-amber-200 text-amber-700 hover:bg-amber-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function Progress({ value, max = 100 }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-amber-500 transition-[width]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Badge({ tone = "neutral", children }) {
  const tones = {
    success: "bg-emerald-100 text-emerald-800",
    warn: "bg-yellow-100 text-yellow-800",
    danger: "bg-rose-100 text-rose-800",
    neutral: "bg-slate-100 text-slate-700",
  };
  return (
    <span className={classNames("px-2.5 py-1 rounded-full text-sm", tones[tone])}>{children}</span>
  );
}

// --- Logique du test ---
function interpret(score) {
  if (score >= 20) return { label: "Reconnaissant", tone: "success", msg: "Vous pratiquez naturellement la gratitude." };
  if (score >= 15) return { label: "À développer", tone: "warn", msg: "Vous avez une base solide à renforcer." };
  return { label: "Tendance à l'ingratitude", tone: "danger", msg: "Il serait bénéfique de travailler votre reconnaissance." };
}

function tipsForGrowth() {
  return [
    {
      title: "Journal de gratitude (5 min)",
      desc: "Chaque soir, notez 3 choses pour lesquelles vous êtes reconnaissant et pourquoi elles comptent.",
    },
    {
      title: "Lettre de gratitude",
      desc: "Écrivez à quelqu'un qui vous a aidé; expliquez précisément l'impact positif de son geste.",
    },
    {
      title: "Méditation de reconnaissance",
      desc: "Respirez 5 minutes en visualisant une personne/expérience et ressentez physiquement la gratitude.",
    },
    {
      title: "Défi des remerciements",
      desc: "Chaque jour, remerciez sincèrement une personne différente et observez les effets.",
    },
  ];
}

// --- App ---
export default function App() {
  const [answers, setAnswers] = useLocalState(STORAGE_KEY, Array(QUESTIONS.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const answeredCount = useMemo(() => answers.filter((x) => typeof x === "number").length, [answers]);
  const score = useMemo(() => answers.reduce((a, b) => a + (b ?? 0), 0), [answers]);
  const canSubmit = answeredCount === QUESTIONS.length;
  const interp = interpret(score);

  const reset = () => {
    setAnswers(Array(QUESTIONS.length).fill(null));
    setShowResult(false);
  };

  const copySummary = async () => {
    const lines = [
      `Test de Gratitude — Résultats`,
      `Score: ${score} / 25`,
      `Profil: ${interp.label}`,
      "",
      ...QUESTIONS.map((q, i) => `Q${i + 1}. ${q}\n→ Réponse: ${answers[i] ?? "-"}`),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
    }
  };

  const exportJSON = () => {
    const payload = {
      score,
      profile: interp.label,
      answers,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resultat-gratitude-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-amber-50 via-amber-50 to-orange-100 text-slate-800">
      <header className="max-w-3xl mx-auto px-4 pt-10 pb-6">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-amber-800"
        >
          Test de Gratitude
        </motion.h1>
        <p className="mt-2 text-slate-600">
          Évaluez votre tendance à la reconnaissance en répondant aux 5 questions ci-dessous (1 = Jamais, 5 = Toujours).
        </p>
      </header>

      <main className="max-w-3xl mx-auto px-4 pb-16">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Progress value={answeredCount} max={QUESTIONS.length} />
            <div className="text-sm text-slate-600 whitespace-nowrap">
              {answeredCount}/{QUESTIONS.length} répondues
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {QUESTIONS.map((q, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * idx }}
                className=""
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium leading-relaxed">
                    {idx + 1}. {q}
                  </p>
                  {typeof answers[idx] === "number" && (
                    <Badge tone="neutral">{answers[idx]}</Badge>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {LIKERT.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const next = [...answers];
                        next[idx] = opt.value;
                        setAnswers(next);
                      }}
                      className={classNames(
                        "rounded-xl px-3 py-2 border text-sm sm:text-base",
                        answers[idx] === opt.value
                          ? "bg-amber-500 text-white border-amber-500 shadow"
                          : "bg-white hover:bg-amber-50 border-amber-200"
                      )}
                    >
                      <div className="font-semibold">{opt.value}</div>
                      <div className="text-xs opacity-80">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">Score actuel : <span className="font-bold">{score}</span> / 25</div>
            <div className="flex gap-3">
              <GhostButton onClick={reset}>Réinitialiser</GhostButton>
              <Button onClick={() => setShowResult(true)} disabled={!canSubmit} className={!canSubmit ? "opacity-50 cursor-not-allowed" : ""}>
                Voir le résultat
              </Button>
            </div>
          </div>
        </Card>

        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-8"
            >
              <Card className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-bold">Votre résultat</h2>
                    <p className="mt-1 text-slate-600">Score final : <span className="font-bold">{score}</span> / 25</p>
                  </div>
                  <Badge tone={interp.tone}>{interp.label}</Badge>
                </div>
                <p className="mt-4">{interp.msg}</p>

                <div className="mt-6 grid sm:grid-cols-2 gap-4">
                  {tipsForGrowth().map((t, i) => (
                    <div key={i} className="rounded-xl border border-amber-200/70 p-4 bg-amber-50">
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-sm text-slate-700 mt-1">{t.desc}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <GhostButton onClick={copySummary}>
                    {copied ? "Copié ✓" : copyError ? "Erreur lors de la copie" : "Copier le récapitulatif"}
                  </GhostButton>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-10 text-center text-xs text-slate-500">
          Données : stockées localement dans votre navigateur. Aucun envoi externe.
        </footer>
      </main>
    </div>
  );
}
