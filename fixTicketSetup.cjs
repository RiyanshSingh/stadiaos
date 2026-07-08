const fs = require('fs');
const path = 'src/app/fan/TicketSetupView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /seat_number: seat,/,
  `seat_number: seat,\n        gate: selectedGate,`
);

fs.writeFileSync(path, content);
console.log('TicketSetupView fixed');
