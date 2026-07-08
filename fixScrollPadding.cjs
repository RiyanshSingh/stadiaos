const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/{app/fan,features/fan-assistant,features/incidents}/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Replace outer `pb-32` if it's on an `overflow-hidden` container (since it's useless there)
  // Example: `min-h-screen bg-black text-white overflow-hidden pb-32 flex flex-col` -> `... overflow-hidden flex flex-col`
  if (content.includes('overflow-hidden pb-32')) {
    content = content.replace(/overflow-hidden pb-32/g, 'overflow-hidden');
    changed = true;
  }
  
  if (content.includes('pb-32 flex flex-col')) {
    content = content.replace(/pb-32 flex flex-col/g, 'flex flex-col');
    changed = true;
  }

  // 2. Add pb-32 to the inner scroll containers
  // Match `className="flex-1 overflow-y-auto px-4 py-6` -> `px-4 pt-6 pb-32`
  const regex1 = /className="flex-1 overflow-y-auto([^"]*)py-6([^"]*)"/g;
  if (regex1.test(content)) {
    content = content.replace(regex1, 'className="flex-1 overflow-y-auto$1pt-6 pb-32$2"');
    changed = true;
  }
  
  // Match py-4
  const regex2 = /className="flex-1 overflow-y-auto([^"]*)py-4([^"]*)"/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, 'className="flex-1 overflow-y-auto$1pt-4 pb-32$2"');
    changed = true;
  }

  // Match if there's no py- at all but it has flex-1 overflow-y-auto
  const regex3 = /className="flex-1 overflow-y-auto(?!.*pt-)(?!.*pb-)([^"]*)"/g;
  if (regex3.test(content)) {
    content = content.replace(regex3, 'className="flex-1 overflow-y-auto pb-32$1"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Updated padding in ${file}`);
  }
});
