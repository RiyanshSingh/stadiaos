const fs = require('fs');
const path = 'src/app/fan/ProfileView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix logout
content = content.replace(
  "const { profile, ticket, incidents, accessibleRouting, toggleAccessibleRouting } = useAppStore()",
  "const { profile, ticket, incidents, accessibleRouting, toggleAccessibleRouting, logout: appLogout } = useAppStore()"
);

content = content.replace(
  /onClick=\{logout\}/g,
  "onClick={() => { appLogout(); logout(); }}"
);

// Fix Gate C hardcode
content = content.replace(
  '<p className="text-lg font-semibold tracking-tight text-white">Gate C</p>',
  '<p className="text-[13px] font-semibold tracking-tight text-white mt-1">{ticket ? "See Map" : "---"}</p>'
);

// Fix hardcoded Spill at Gate C
content = content.replace(
  "activeIncident ? `${activeIncident.type} at ${activeIncident.zone}` : 'Spill at Gate C'",
  "activeIncident ? `${activeIncident.type} at ${activeIncident.zone}` : 'No active reports'"
);
content = content.replace(
  "activeIncident ? activeIncident.description : 'Reported 12 mins ago. Maintenance team dispatched.'",
  "activeIncident ? activeIncident.description : 'You have not reported any recent incidents.'"
);
content = content.replace(
  "activeIncident ? activeIncident.status : 'In Progress'",
  "activeIncident ? activeIncident.status : '---'"
);


fs.writeFileSync(path, content);
console.log('ProfileView updated');
