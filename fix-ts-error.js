// fix-ts-error.js
const fs = require("fs");
const path = require("path");

console.log("🔧 Corrigindo a arrow function para o TypeScript da Vercel...\n");

const targetPath = path.join(process.cwd(), "src/modules/availability/schedule-actions.ts");

let content = fs.readFileSync(targetPath, "utf-8");

// Substitui a declaração tradicional por arrow function aceita no modo estrito
content = content.replace(
  "function sliceShift(startStr: string, endStr: string) {",
  "const sliceShift = (startStr: string, endStr: string) => {"
);

fs.writeFileSync(targetPath, content, "utf-8");
console.log("✓ Arquivo corrigido com sucesso!");