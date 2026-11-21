"use client";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  GraduationCap,
  LockKeyhole,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Sun,
  Trash2,
  Trophy,
  Users,
  Crown,
} from "lucide-react";
type Question = {
  id: number;
  text: string;
  options: string[];
  correctIndex?: number;
  imageUrl?: string;
};
type Detail = { answer: number; correct: boolean };
type Result = {
  id: number;
  studentName: string;
  score: number;
  total: number;
  answers: (number | Detail)[];
  createdAt: string;
};

export default function QuizApp() {
  const [page, setPage] = useState<"home" | "quiz" | "done" | "teacher">(
      "home",
    ),
    [name, setName] = useState(""),
    [questions, setQuestions] = useState<Question[]>([]),
    [answers, setAnswers] = useState<number[]>([]),
    [at, setAt] = useState(0),
    [seconds, setSeconds] = useState(25),
    [score, setScore] = useState(0),
    [total, setTotal] = useState(0),
    [pin, setPin] = useState(""),
    [results, setResults] = useState<Result[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [dark, setDark] = useState(false);
  const [type, setType] = useState<"tf" | "abcd">("tf"),
    [text, setText] = useState(""),
    [options, setOptions] = useState(["Verdadero", "Falso", "", ""]),
    [correct, setCorrect] = useState(0),
    [imageUrl, setImageUrl] = useState(""),
    [editing, setEditing] = useState<number | null>(null);
  useEffect(() => {
    load();
    const v = localStorage.getItem("quizito-theme") === "dark";
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
  }, []);
  useEffect(() => {
    if (page !== "quiz" || busy) return;
    const t = setTimeout(
      () => (seconds <= 1 ? advance() : setSeconds((s) => s - 1)),
      1000,
    );
    return () => clearTimeout(t);
  }, [page, at, seconds, busy]);
  const average = useMemo(
    () =>
      results.length
        ? Math.round(
            results.reduce((a, r) => a + (r.score / r.total) * 100, 0) /
              results.length,
          )
        : 0,
    [results],
  );
  async function load(teacherPin?: string) {
    const r = await fetch(
        "/api/questions",
        teacherPin ? { headers: { "x-teacher-pin": teacherPin } } : undefined,
      ),
      d = await r.json();
    setQuestions(d.questions || []);
    return d.questions || [];
  }
  function toggle() {
    const v = !dark;
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("quizito-theme", v ? "dark" : "light");
  }
  function begin() {
    const q = [...questions].sort(() => Math.random() - 0.5);
    setQuestions(q);
    setAnswers(Array(q.length).fill(-1));
    setAt(0);
    setSeconds(25);
    setPage("quiz");
  }
  function advance() {
    if (at < questions.length - 1) {
      setAt((x) => x + 1);
      setSeconds(25);
    } else finish();
  }
  async function finish() {
    setBusy(true);
    const r = await fetch("/api/submissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          studentName: name,
          answers,
          questionIds: questions.map((q) => q.id),
        }),
      }),
      d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    setScore(d.score);
    setTotal(d.total);
    setPage("done");
  }
  async function login() {
    setBusy(true);
    setError("");
    const [q, r] = await Promise.all([
      fetch("/api/questions", { headers: { "x-teacher-pin": pin } }),
      fetch("/api/results", { headers: { "x-teacher-pin": pin } }),
    ]);
    setBusy(false);
    if (!q.ok || !r.ok) return setError("PIN incorrecto.");
    setQuestions((await q.json()).questions);
    setResults((await r.json()).results);
    setPage("teacher");
  }
  function setKind(v: "tf" | "abcd") {
    setType(v);
    setOptions(v === "tf" ? ["Verdadero", "Falso", "", ""] : ["", "", "", ""]);
    setCorrect(0);
  }
  function clearForm() {
    setText("");
    setImageUrl("");
    setEditing(null);
    setKind(type);
  }
  async function save() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/questions", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json", "x-teacher-pin": pin },
        body: JSON.stringify({
          id: editing,
          text,
          options: options.slice(0, type === "tf" ? 2 : 4),
          correctIndex: correct,
          imageUrl,
        }),
      }),
      d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error);
    clearForm();
    await load(pin);
  }
  function edit(q: Question) {
    setEditing(q.id);
    setText(q.text);
    setImageUrl(q.imageUrl || "");
    setType(q.options.length === 2 ? "tf" : "abcd");
    setOptions([
      ...q.options,
      ...Array(Math.max(0, 4 - q.options.length)).fill(""),
    ]);
    setCorrect(q.correctIndex || 0);
    scrollTo({ top: 60, behavior: "smooth" });
  }
  async function remove(id: number) {
    if (!confirm("¿Eliminar esta pregunta?")) return;
    await fetch(`/api/questions?id=${id}`, {
      method: "DELETE",
      headers: { "x-teacher-pin": pin },
    });
    await load(pin);
  }
  async function clearResults() {
    if (!results.length || !confirm("¿Borrar todos los resultados?")) return;
    await fetch("/api/results", {
      method: "DELETE",
      headers: { "x-teacher-pin": pin },
    });
    setResults([]);
  }
  function home() {
    setPage("home");
    setName("");
    setError("");
    load();
  }
  return (
    <main className="site-shell min-h-screen bg-[#f5f7fb] text-[#172033]">
      <Header page={page} home={home} dark={dark} toggle={toggle} />
      {page === "home" && (
        <Home
          name={name}
          setName={setName}
          count={questions.length}
          begin={begin}
          pin={pin}
          setPin={setPin}
          login={login}
          busy={busy}
          error={error}
        />
      )}
      {page === "quiz" && questions[at] && (
        <Quiz
          q={questions[at]}
          at={at}
          count={questions.length}
          name={name}
          seconds={seconds}
          answer={answers[at]}
          choose={(i) => {
            const a = [...answers];
            a[at] = i;
            setAnswers(a);
          }}
          advance={advance}
          finish={finish}
          busy={busy}
        />
      )}
      {page === "done" && (
        <Done name={name} score={score} total={total} home={home} />
      )}
      {page === "teacher" && (
        <>
          <ImagePicker imageUrl={imageUrl} setImageUrl={setImageUrl} />
          <Teacher
            questions={questions}
            results={results}
            average={average}
            type={type}
            setKind={setKind}
            text={text}
            setText={setText}
            options={options}
            setOptions={setOptions}
            correct={correct}
            setCorrect={setCorrect}
            imageUrl={imageUrl}
            setImageUrl={setImageUrl}
            editing={editing}
            save={save}
            cancel={clearForm}
            edit={edit}
            remove={remove}
            refresh={login}
            clearResults={clearResults}
            busy={busy}
            error={error}
          />
        </>
      )}
      <footer className="border-t bg-white/80 p-5 text-center text-sm text-slate-500">
        Diseñado y creado por{" "}
        <strong className="text-indigo-600">Luisito</strong>
      </footer>
    </main>
  );
}

function Header(p: {
  page: string;
  home: () => void;
  dark: boolean;
  toggle: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 px-5 py-4 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl justify-between">
        <button
          onClick={p.home}
          className="flex items-center gap-3 text-xl font-bold"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white">
            <GraduationCap />
          </span>
          Quizito
        </button>
        <div className="flex gap-2">
          <a href="/panel" className="hidden items-center rounded-xl border bg-white px-3 font-bold text-slate-700 sm:flex">Mi panel</a>
          <a href="/premium" className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-3 font-black text-slate-950 shadow-lg shadow-amber-500/20"><Crown size={17}/><span className="hidden sm:inline">Premium</span></a>
          <button
            onClick={p.toggle}
            className="grid h-10 w-10 place-items-center rounded-xl border bg-slate-50"
          >
            {p.dark ? <Sun /> : <Moon />}
          </button>
          {p.page !== "home" && (
            <button
              onClick={p.home}
              className="flex items-center gap-2 px-3 font-bold text-slate-600"
            >
              <LogOut size={17} />
              Salir
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
function ImagePicker(p: {
  imageUrl: string;
  setImageUrl: (v: string) => void;
}) {
  return (
    <div className="mx-auto mt-6 max-w-6xl px-5">
      <div className="rounded-2xl border bg-white p-4">
        <b>Imagen para la pregunta (máximo 2 MB)</b>
        <div className="mt-3 flex flex-wrap gap-3">
          <label className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white">
            Subir desde la PC
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (f.size > 2 * 1024 * 1024) {
                  alert("La imagen debe pesar 2 MB o menos.");
                  e.target.value = "";
                  return;
                }
                const reader = new FileReader();
                reader.onload = () =>
                  p.setImageUrl(String(reader.result || ""));
                reader.readAsDataURL(f);
              }}
            />
          </label>
          {p.imageUrl && (
            <button
              onClick={() => p.setImageUrl("")}
              className="rounded-xl border px-4 font-bold text-rose-600"
            >
              Quitar imagen
            </button>
          )}
        </div>
        {p.imageUrl && (
          <img
            src={p.imageUrl}
            alt="Vista previa"
            className="mt-3 max-h-44 w-full rounded-xl bg-slate-100 object-contain"
          />
        )}
      </div>
    </div>
  );
}
function Home(p: {
  name: string;
  setName: (v: string) => void;
  count: number;
  begin: () => void;
  pin: string;
  setPin: (v: string) => void;
  login: () => void;
  busy: boolean;
  error: string;
}) {
  const [joinCode, setJoinCode] = useState("");
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-6xl items-center gap-10 px-5 py-12 lg:grid-cols-2">
      <div>
        <span className="rounded-full border border-indigo-200 bg-indigo-100/90 px-4 py-2 font-black text-indigo-700 shadow-sm">
          ⚡ Aprende · Compite · Supera
        </span>
        <h1 className="mt-6 text-6xl font-black leading-[.95]">
          Convierte cada clase en una <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">experiencia inolvidable</span>
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Crea, comparte y descubre quién domina el reto. Preguntas aleatorias, imágenes y resultados al instante.
        </p>
      </div>
      <div className="rounded-3xl border bg-white p-7 shadow-xl">
        <h2 className="text-2xl font-black">Entrar al quiz</h2>
        <p className="mt-5 text-sm font-bold text-slate-500">¿Tu profesor te dio un código?</p>
        <div className="mt-2 flex gap-2">
          <input value={joinCode} onChange={(e)=>setJoinCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" placeholder="Código de 6 dígitos" className="min-w-0 flex-1 rounded-xl border p-4 font-black tracking-widest"/>
          <button disabled={joinCode.length!==6} onClick={()=>location.href=`/jugar/${joinCode}`} className="rounded-xl bg-emerald-600 px-5 font-black text-white disabled:opacity-40">Entrar</button>
        </div>
        <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200"/> QUIZ DE LUISITO <span className="h-px flex-1 bg-slate-200"/></div>
        <input
          value={p.name}
          onChange={(e) => p.setName(e.target.value)}
          placeholder="Tu nombre y apellido"
          className="mt-6 w-full rounded-xl border p-4"
        />
        <button
          disabled={!p.name.trim() || !p.count}
          onClick={p.begin}
          className="mt-4 w-full rounded-xl bg-indigo-600 p-4 font-bold text-white disabled:opacity-40"
        >
          {p.count
            ? `Comenzar · ${p.count} preguntas`
            : "Sin preguntas todavía"}
        </button>
        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> PROFESOR{" "}
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="flex gap-2">
          <input
            value={p.pin}
            onChange={(e) => p.setPin(e.target.value)}
            type="password"
            placeholder="PIN del profesor"
            className="min-w-0 flex-1 rounded-xl border p-3"
          />
          <button
            onClick={p.login}
            disabled={p.busy || !p.pin}
            className="rounded-xl bg-slate-900 px-4 text-white"
          >
            <LockKeyhole />
          </button>
        </div>
        {p.error && <p className="mt-3 text-rose-600">{p.error}</p>}
      </div>
    </section>
  );
}
function Quiz(p: {
  q: Question;
  at: number;
  count: number;
  name: string;
  seconds: number;
  answer: number;
  choose: (i: number) => void;
  advance: () => void;
  finish: () => void;
  busy: boolean;
}) {
  return (
    <section className="mx-auto max-w-3xl px-5 py-10">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <b className="text-indigo-600">
            PREGUNTA {p.at + 1} DE {p.count}
          </b>
          <p className="text-slate-500">{p.name} · orden aleatorio</p>
        </div>
        <div
          className={`grid h-16 w-16 place-items-center rounded-full border-4 font-black ${p.seconds <= 5 ? "border-rose-500 text-rose-600" : "border-indigo-200 text-indigo-700"}`}
        >
          {p.seconds}s
        </div>
      </div>
      <div className="mb-8 h-2 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{ width: `${p.seconds * 4}%` }}
        />
      </div>
      <div className="rounded-3xl border bg-white p-7 shadow-lg">
        {p.q.imageUrl && (
          <img
            src={p.q.imageUrl}
            alt="Imagen de la pregunta"
            className="mb-6 max-h-72 w-full rounded-2xl bg-slate-100 object-contain"
          />
        )}
        <h2 className="text-3xl font-black">{p.q.text}</h2>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {p.q.options.map((o, i) => (
            <button
              key={i}
              onClick={() => p.choose(i)}
              className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left font-semibold ${p.answer === i ? "border-indigo-600 bg-indigo-50" : "border-slate-200"}`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${p.answer === i ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <button
          disabled={p.busy}
          onClick={p.at < p.count - 1 ? p.advance : p.finish}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white"
        >
          {p.at < p.count - 1 ? "Siguiente" : "Terminar quiz"}
        </button>
      </div>
      <p className="mt-3 text-center text-sm text-slate-500">
        Al terminar el tiempo pasa sola; sin respuesta cuenta como incorrecta.
      </p>
    </section>
  );
}
function Done(p: {
  name: string;
  score: number;
  total: number;
  home: () => void;
}) {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-xl place-items-center px-5">
      <div className="w-full rounded-3xl border bg-white p-8 text-center shadow-xl">
        <CheckCircle2 className="mx-auto text-emerald-500" size={62} />
        <h1 className="mt-4 text-3xl font-black">¡Quiz completado!</h1>
        <p className="mt-2">Buen trabajo, {p.name}.</p>
        <strong className="mt-7 block text-5xl text-indigo-700">
          {p.score}/{p.total}
        </strong>
        <button
          onClick={p.home}
          className="mt-7 rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white"
        >
          Volver al inicio
        </button>
      </div>
    </section>
  );
}

type TP = {
  questions: Question[];
  results: Result[];
  average: number;
  type: "tf" | "abcd";
  setKind: (v: "tf" | "abcd") => void;
  text: string;
  setText: (v: string) => void;
  options: string[];
  setOptions: (v: string[]) => void;
  correct: number;
  setCorrect: (v: number) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;
  editing: number | null;
  save: () => void;
  cancel: () => void;
  edit: (q: Question) => void;
  remove: (id: number) => void;
  refresh: () => void;
  clearResults: () => void;
  busy: boolean;
  error: string;
};
function Teacher(p: TP) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <p className="font-bold text-indigo-600">PANEL DEL PROFESOR</p>
      <h1 className="text-3xl font-black">
        {p.editing ? "Editar pregunta" : "Crear preguntas"}
      </h1>
      <div className="mt-7 grid gap-7 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-2xl border bg-white p-6">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => p.setKind("tf")}
              className={`rounded-xl p-3 font-bold ${p.type === "tf" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
            >
              Verdadero / falso
            </button>
            <button
              onClick={() => p.setKind("abcd")}
              className={`rounded-xl p-3 font-bold ${p.type === "abcd" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}
            >
              4 opciones
            </button>
          </div>
          <textarea
            value={p.text}
            onChange={(e) => p.setText(e.target.value)}
            placeholder="Escribe la pregunta"
            className="mt-5 min-h-24 w-full rounded-xl border p-3"
          />
          <input
            value={p.imageUrl}
            onChange={(e) => p.setImageUrl(e.target.value)}
            placeholder="URL de imagen (opcional)"
            className="mt-3 w-full rounded-xl border p-3"
          />
          {p.imageUrl && (
            <img
              src={p.imageUrl}
              alt="Vista previa"
              className="mt-3 max-h-40 w-full rounded-xl bg-slate-100 object-contain"
            />
          )}
          {p.options.slice(0, p.type === "tf" ? 2 : 4).map((o, i) => (
            <div key={i} className="mt-3 flex items-center gap-3">
              <input
                type="radio"
                checked={p.correct === i}
                onChange={() => p.setCorrect(i)}
                className="h-5 w-5"
              />
              <input
                value={o}
                disabled={p.type === "tf"}
                onChange={(e) => {
                  const a = [...p.options];
                  a[i] = e.target.value;
                  p.setOptions(a);
                }}
                placeholder={`Opción ${String.fromCharCode(65 + i)}`}
                className="min-w-0 flex-1 rounded-xl border p-3 disabled:bg-slate-100"
              />
            </div>
          ))}
          <button
            onClick={p.save}
            disabled={p.busy}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 p-3 font-bold text-white"
          >
            <Plus />
            {p.editing ? "Guardar cambios" : "Añadir pregunta"}
          </button>
          {p.editing && (
            <button
              onClick={p.cancel}
              className="mt-2 w-full rounded-xl border p-3 font-bold"
            >
              Cancelar
            </button>
          )}
          {p.error && <p className="mt-3 text-rose-600">{p.error}</p>}
        </div>
        <div className="rounded-2xl border bg-white p-6">
          <h2 className="text-xl font-black">
            Preguntas ({p.questions.length})
          </h2>
          <div className="mt-4 max-h-[650px] space-y-3 overflow-y-auto">
            {p.questions.map((q, n) => (
              <div key={q.id} className="rounded-xl border p-4">
                {q.imageUrl && (
                  <img
                    src={q.imageUrl}
                    alt=""
                    className="mb-3 h-28 w-full rounded-lg bg-slate-100 object-contain"
                  />
                )}
                <div className="flex justify-between gap-3">
                  <div>
                    <b>
                      {n + 1}. {q.text}
                    </b>
                    <p className="mt-2 text-sm text-slate-500">
                      {q.options
                        .map(
                          (o, i) =>
                            `${String.fromCharCode(65 + i)}) ${o}${q.correctIndex === i ? " ✓" : ""}`,
                        )
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => p.edit(q)}
                      className="text-indigo-600"
                    >
                      <Pencil />
                    </button>
                    <button
                      onClick={() => p.remove(q.id)}
                      className="text-rose-600"
                    >
                      <Trash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Results p={p} />
    </section>
  );
}
function Results({ p }: { p: TP }) {
  return (
    <>
      <div className="mt-10 flex flex-wrap justify-between gap-4">
        <h2 className="text-3xl font-black">Resultados de la clase</h2>
        <div className="flex gap-2">
          <button
            onClick={p.refresh}
            className="rounded-xl border bg-white px-4 py-2 font-bold"
          >
            Actualizar
          </button>
          <button
            onClick={p.clearResults}
            className="rounded-xl bg-rose-600 px-4 py-2 font-bold text-white"
          >
            Borrar resultados
          </button>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={<Users />} label="Participantes" value={p.results.length} />
        <Stat icon={<Trophy />} label="Promedio" value={`${p.average}%`} />
        <Stat
          icon={<CheckCircle2 />}
          label="Mejor nota"
          value={
            p.results.length
              ? `${Math.max(...p.results.map((r) => Math.round((r.score / r.total) * 100)))}%`
              : "—"
          }
        />
      </div>
      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full min-w-[680px]">
          <thead>
            <tr>
              <th className="p-4 text-left">Estudiante</th>
              <th>Puntuación</th>
              <th>Respuestas</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {p.results.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-4 font-bold">{r.studentName}</td>
                <td>
                  {r.score}/{r.total}
                </td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {r.answers.map((a, i) => {
                      const d = typeof a === "number" ? null : a,
                        v = typeof a === "number" ? a : a.answer;
                      return (
                        <span
                          key={i}
                          className={`grid h-8 w-8 place-items-center rounded-lg border font-black shadow-sm ${d?.correct ? "border-emerald-300 bg-emerald-100 text-emerald-800" : "border-rose-300 bg-rose-100 text-rose-800"}`}
                        >
                          {v < 0 ? "—" : String.fromCharCode(65 + v)}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td>{new Date(r.createdAt).toLocaleString("es")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
function Stat(p: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border bg-white p-5">
      <span className="text-indigo-600">{p.icon}</span>
      <div>
        <p className="text-sm text-slate-500">{p.label}</p>
        <b className="text-2xl">{p.value}</b>
      </div>
    </div>
  );
}

