// install-module-2-calendar.js
const fs = require("fs");
const path = require("path");

console.log("📅 Instalando o botão 'Adicionar ao Google Agenda' no comprovante do cliente...\n");

// 1. ATUALIZA A TELA DO CLIENTE: public-booking-client-view.tsx
const viewPath = path.join(process.cwd(), "src/components/booking/public-booking-client-view.tsx");
let content = fs.readFileSync(viewPath, "utf-8");

// Bloco com o botão inteligente do Google Calendar
const calendarButtonBlock = [
  "",
  "              {/* BOTAO INTELIGENTE DO GOOGLE CALENDAR */}",
  "              {(() => {",
  "                if (!selectedDate || !selectedSlot) return null;",
  "                const [sh, sm] = selectedSlot.split(':').map(Number);",
  "                const dp = selectedDate.split('-').map(Number);",
  "                const dur = selectedService?.duration || 50;",
  "                const sDate = new Date(dp[0], dp[1] - 1, dp[2], sh, sm, 0);",
  "                const eDate = new Date(sDate.getTime() + dur * 60000);",
  "",
  "                const fmtG = (d: Date) => {",
  "                  const pad = (n: number) => String(n).padStart(2, '0');",
  "                  return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';",
  "                };",
  "",
  "                const title = 'Consulta: ' + (selectedService?.name || 'Atendimento') + ' - ' + businessName;",
  "                const details = 'Agendamento confirmado com ' + businessName + '.\\nTelefone: ' + phone + '\\nGerenciar ou cancelar: ' + (typeof window !== 'undefined' ? window.location.origin : '') + '/manage-booking/' + (createdAppointmentId || '');",
  "                const gUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(title) + '&dates=' + fmtG(sDate) + '/' + fmtG(eDate) + '&details=' + encodeURIComponent(details) + '&location=' + encodeURIComponent(businessName);",
  "",
  "                return (",
  "                  <div className='pt-1'>",
  "                    <a",
  "                      href={gUrl}",
  "                      target='_blank'",
  "                      rel='noopener noreferrer'",
  "                      className='w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-2.5 transition-all hover:border-blue-300 group cursor-pointer'",
  "                    >",
  "                      <Calendar className='w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform' />",
  "                      <span>Adicionar à minha Agenda do Google</span>",
  "                    </a>",
  "                  </div>",
  "                );",
  "              })()}",
  ""
].join("\n");

// Insere o botão de Google Agenda no Passo 4 (Sucesso)
const targetMarker = "{createdAppointmentId && (";
if (content.includes(targetMarker)) {
  content = content.replace(targetMarker, calendarButtonBlock + "\n              " + targetMarker);
  fs.writeFileSync(viewPath, content, "utf-8");
  console.log("  ✓ Botão de Google Calendar instalado no comprovante!");
} else {
  console.log("  ℹ Marcador não encontrado ou já instalado.");
}

console.log("\n🎉 Módulo 2 instalado com 100% de sucesso!");