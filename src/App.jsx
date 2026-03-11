import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Download,
  Github,
  Mail,
  Moon,
  Sun,
  Camera,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import Card from "./components/Card";

const photos = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=900&q=80",
];

const articles = [
  { title: "How I Direct Family Portrait Storytelling", date: "2026-02-12" },
  { title: "Lighting Setups for Indoor Elderly Sessions", date: "2026-01-08" },
  { title: "From Shoot to Delivery: My Editing Workflow", date: "2025-12-25" },
];

export default function App() {
  const [dark, setDark] = useState(false);

  const wrapperClass = useMemo(
    () =>
      [
        dark ? "dark bg-[#0E0E0F] text-white" : "bg-canvas text-slate-900",
        "min-h-screen transition-colors duration-300",
      ].join(" "),
    [dark]
  );

  return (
    <div className={wrapperClass}>
      <div className="mx-auto max-w-7xl px-5 pb-12 pt-7 md:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">
            Zou Longshun Portfolio
          </h1>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setDark((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium shadow-sm dark:border-white/20 dark:bg-[#171717]"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
            {dark ? "Light" : "Dark"}
          </motion.button>
        </div>

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-1" delay={0.03}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Profile
                </p>
                <h2 className="mt-3 text-2xl font-semibold">时光摄影</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Photographer focused on elderly wedding portraits and family
                  storytelling sessions.
                </p>
              </div>
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
                alt="Avatar"
                className="h-14 w-14 rounded-2xl object-cover"
              />
            </div>
            <span className="mt-5 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
              Available for projects
            </span>
          </Card>

          <Card
            className="overflow-hidden bg-[#FE2C55] text-white dark:bg-[#FE2C55]"
            delay={0.08}
            whileHover={{ y: -5, boxShadow: "0 26px 60px rgba(254, 44, 85, 0.35)" }}
          >
            <p className="text-xs uppercase tracking-[0.18em] text-white/80">
              Little Red Book
            </p>
            <h3 className="mt-3 text-2xl font-semibold">小红书作品主页</h3>
            <p className="mt-2 text-sm text-white/85">
              Behind-the-scenes clips, retouching snippets, and daily portfolio
              updates.
            </p>
            <motion.a
              whileTap={{ scale: 0.95 }}
              href="#"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#FE2C55]"
            >
              Follow <ExternalLink size={15} />
            </motion.a>
          </Card>

          <Card className="md:col-span-2 xl:col-span-1" delay={0.13}>
            <div className="flex items-center gap-2">
              <BookOpen size={16} />
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Writing
              </p>
            </div>
            <ul className="mt-3 space-y-3">
              {articles.map((item) => (
                <li
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-4 py-3 dark:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.date}
                    </p>
                  </div>
                  <ArrowRight size={16} />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="md:col-span-2 xl:col-span-2" delay={0.18}>
            <div className="mb-4 flex items-center gap-2">
              <Camera size={16} />
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Photography Gallery
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {photos.map((src) => (
                <motion.img
                  whileHover={{ scale: 1.03 }}
                  key={src}
                  src={src}
                  alt="Portfolio"
                  className="h-36 w-full rounded-2xl object-cover md:h-48"
                />
              ))}
            </div>
          </Card>

          <Card className="xl:col-span-1" delay={0.22}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Resume / CV
            </p>
            <h3 className="mt-3 text-xl font-semibold">8+ years experience</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Portrait direction, high-end family photography, advanced
              retouching, and social content strategy.
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-black"
            >
              <Download size={16} />
              Download PDF
            </motion.button>
          </Card>

          <Card className="xl:col-span-1" delay={0.26}>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              Social Links
            </p>
            <div className="mt-4 grid gap-2">
              {[
                { icon: <Github size={16} />, label: "GitHub", value: "github.com/you" },
                { icon: <Mail size={16} />, label: "Email", value: "you@example.com" },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2 text-sm dark:border-white/20"
                >
                  <span className="inline-flex items-center gap-2">
                    {social.icon}
                    {social.label}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">{social.value}</span>
                </a>
              ))}
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
