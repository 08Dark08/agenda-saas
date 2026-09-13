// fix-relative-date-badge.js
const fs = require("fs");
const path = require("path");

console.log("🏷️ Adicionando etiqueta de data inteligente (HOJE / AMANHÃ / DATA FUTURA)...\n");

const targetPath = path.join(process.cwd(), "src/components/appointments/interactive-appointments-view.tsx");
let content = fs.readFileSync(targetPath, "utf-8");

// Garante a importação de isToday e isTomorrow do date-fns
if (!content.includes("isToday")) {
  content = content.replace(
    "import { format } from 'date-fns';",
    "import { format, isToday, isTomorrow } from 'date-fns';"
  );
}

// Substitui a tag estática "Hoje" pela lógica inteligente
const oldBadge = '<span className="text-[10px] font-bold text-blue-500 uppercase mt-1">Hoje</span>';

const newBadge = `{(() => {
                    const d = new Date(appt.startTime);
                    if (isToday(d)) {
                      return <span className="text-[9px] font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded uppercase mt-1">HOJE</span>;
                    }
                    if (isTomorrow(d)) {
                      return <span className="text-[9px] font-black text-indigo-700 bg-indigo-100/80 px-1.5 py-0.5 rounded uppercase mt-1">AMANHÃ</span>;
                    }
                    return <span className="text-[9px] font-black text-blue-600 bg-blue-100/60 px-1 py-0.5 rounded uppercase mt-1">{format(d, "dd/MMM", { locale: ptBR }).toUpperCase()}</span>;
                  })()}`;

if (content.includes(oldBadge)) {
  content = content.replace(oldBadge, newBadge);
  fs.writeFileSync(targetPath, content, "utf-8");
  console.log("✓ Etiqueta inteligente aplicada com sucesso na Agenda!");
} else {
  console.log("ℹ O arquivo já estava com a lógica mais recente.");
}