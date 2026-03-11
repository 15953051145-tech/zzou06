import { motion } from "framer-motion";

export default function Card({
  className = "",
  children,
  delay = 0,
  whileHover = { y: -5, boxShadow: "0 24px 56px rgba(15, 23, 42, 0.15)" },
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      whileHover={whileHover}
      className={[
        "rounded-[28px] border border-black/5 bg-white p-6 shadow-soft transition-colors dark:border-white/10 dark:bg-[#111111]",
        className,
      ].join(" ")}
    >
      {children}
    </motion.article>
  );
}
