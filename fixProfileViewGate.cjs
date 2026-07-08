const fs = require('fs');
const path = 'src/app/fan/ProfileView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<p className="text-[13px] font-semibold tracking-tight text-white mt-1">{ticket ? "See Map" : "---"}</p>',
  '<p className="text-[13px] font-semibold tracking-tight text-white mt-1">{ticket?.gate || (ticket ? "See Map" : "---")}</p>'
);

fs.writeFileSync(path, content);
console.log('ProfileView gate fixed');
