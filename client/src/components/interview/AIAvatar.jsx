import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export default function AIAvatar({ isSpeaking }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-10">
      <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-slate-900 shadow-2xl">
        {/* Glow effect when speaking */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        
        {/* Outer Ring */}
        <motion.div
          className={`absolute inset-0 rounded-full border-2 ${
            isSpeaking ? "border-cyan-400" : "border-slate-700"
          }`}
          animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Inner Avatar */}
        <div className="z-10 flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-cyan-400 shadow-inner">
          <Bot size={64} className={isSpeaking ? "animate-pulse text-cyan-300" : ""} />
        </div>
      </div>
      
      <div className="text-center">
        <h3 className="text-xl font-bold text-white tracking-wide">HireSense AI</h3>
        <p className={`text-sm mt-2 transition-colors ${isSpeaking ? "text-cyan-400" : "text-slate-400"}`}>
          {isSpeaking ? "Speaking..." : "Listening..."}
        </p>
      </div>
    </div>
  );
}
