import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, BookOpen, Loader2, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

const TOPICS = [
  "Phishing emails — how to spot them",
  "Strong passwords & MFA",
  "Smishing & vishing scams",
  "Public Wi-Fi safety",
  "Crypto wallet drainers",
  "Social engineering basics",
  "Mobile app permissions",
  "Ransomware survival guide",
];

export default function Learn() {
  const [topic, setTopic] = useState<string | null>(null);
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("learning_progress").select("lesson_id").eq("user_id", user.id);
      setCompleted(new Set((data || []).map(d => d.lesson_id)));
    })();
  }, []);

  const start = async (t: string) => {
    setTopic(t); setLesson(null); setAnswers({}); setSubmitted(false); setLoading(true);
    const { data, error } = await supabase.functions.invoke("learn-content", { body: { mode: "lesson", topic: t, level } });
    setLoading(false);
    if (error) { toast({ title: "Failed to load", variant: "destructive" }); return; }
    setLesson(data);
  };

  const submit = async () => {
    if (!lesson || !topic) return;
    setSubmitted(true);
    const score = lesson.quiz.reduce((s: number, q: any, i: number) => s + (answers[i] === q.correct_index ? 1 : 0), 0);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const lid = `${level}:${topic}`;
    await supabase.from("learning_progress").upsert({ user_id: user.id, lesson_id: lid, score });
    setCompleted(new Set([...completed, lid]));
    toast({ title: `Quiz: ${score}/${lesson.quiz.length}` });
  };

  if (lesson) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setLesson(null); setTopic(null); }} className="text-xs text-muted-foreground">← Back to topics</button>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
          <div className="text-[10px] font-mono text-primary">{level.toUpperCase()} LESSON</div>
          <h2 className="text-xl font-bold mt-1">{lesson.title}</h2>
          <p className="text-sm text-muted-foreground mt-2">{lesson.summary}</p>
        </motion.div>

        {lesson.sections?.map((s: any, i: number) => (
          <div key={i} className="glass rounded-2xl p-4">
            <div className="font-bold text-sm mb-1 text-accent">{s.heading}</div>
            <div className="text-sm leading-relaxed">{s.body}</div>
          </div>
        ))}

        <div className="glass rounded-2xl p-4">
          <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1"><Trophy className="h-3 w-3" /> KEY TAKEAWAYS</div>
          <ul className="text-sm space-y-1 list-disc list-inside">
            {lesson.key_takeaways?.map((k: string, i: number) => <li key={i}>{k}</li>)}
          </ul>
        </div>

        <div className="glass rounded-2xl p-4 space-y-4">
          <div className="font-bold text-sm">Quick Quiz</div>
          {lesson.quiz?.map((q: any, qi: number) => (
            <div key={qi}>
              <div className="text-sm font-medium mb-2">{qi + 1}. {q.question}</div>
              <div className="space-y-1.5">
                {q.options.map((o: string, oi: number) => {
                  const sel = answers[qi] === oi;
                  const correct = submitted && oi === q.correct_index;
                  const wrong = submitted && sel && oi !== q.correct_index;
                  return (
                    <button key={oi} disabled={submitted} onClick={() => setAnswers({ ...answers, [qi]: oi })}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-colors ${
                        correct ? "border-success bg-success/10" :
                        wrong ? "border-destructive bg-destructive/10" :
                        sel ? "border-primary bg-primary/10" : "border-border bg-background/30"
                      }`}>
                      <div className="flex items-center gap-2">
                        {submitted && correct && <CheckCircle2 className="h-4 w-4 text-success" />}
                        {submitted && wrong && <XCircle className="h-4 w-4 text-destructive" />}
                        {o}
                      </div>
                    </button>
                  );
                })}
              </div>
              {submitted && <div className="text-xs text-muted-foreground mt-2">{q.explanation}</div>}
            </div>
          ))}
          {!submitted && (
            <button onClick={submit} className="w-full py-2 rounded-xl gradient-cyber text-background font-semibold text-sm">Submit</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full gradient-cyber opacity-20 blur-3xl" />
        <div className="flex items-center gap-2 mb-1"><GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">Learn Cybersecurity</h2></div>
        <p className="text-xs text-muted-foreground">AI-generated lessons. Earn XP, master phishing defense.</p>
        <div className="flex gap-1 mt-3">
          {(["beginner", "intermediate", "advanced"] as const).map(l => (
            <button key={l} onClick={() => setLevel(l)}
              className={`flex-1 py-1.5 text-xs rounded-lg ${level === l ? "gradient-cyber text-background font-bold" : "bg-background/40 text-muted-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className="text-center py-6"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>}

      <div className="grid gap-2">
        {TOPICS.map(t => {
          const lid = `${level}:${t}`;
          const done = completed.has(lid);
          return (
            <button key={t} onClick={() => start(t)} disabled={loading}
              className="glass rounded-xl p-3 flex items-center gap-3 text-left hover:ring-1 hover:ring-primary/50 disabled:opacity-50">
              <div className="h-9 w-9 rounded-lg gradient-cyber grid place-items-center shrink-0">
                <BookOpen className="h-4 w-4 text-background" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t}</div>
              </div>
              {done && <CheckCircle2 className="h-4 w-4 text-success shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
