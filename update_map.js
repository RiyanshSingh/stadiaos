const fs = require('fs');
const file = 'src/app/fan/MapView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<div className="flex justify-between items-center pointer-events-auto">[\s\S]*?<\/div>\s*<\/div>/,
  `<div className="flex justify-between items-start pointer-events-auto mt-2">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[22px] font-semibold tracking-tight leading-none text-white">Luzhniki Stadium</h1>
            <div className="flex items-center gap-2 text-[13px] font-medium tracking-tight text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              {ticket ? \`Section \${ticket.seat_section}\` : 'No Active Ticket'}
            </div>
          </div>
          <button className="p-2.5 rounded-full bg-white/[0.03] border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
            <Filter className="w-4 h-4 text-white/60" />
          </button>
        </div>`
);

content = content.replace(
  /<div className="flex p-1 bg-black\/60 backdrop-blur-xl rounded-full border border-white\/10 pointer-events-auto shadow-lg">[\s\S]*?<\/div>/,
  `<div className="flex p-1 bg-black/40 backdrop-blur-2xl rounded-full border border-white/10 pointer-events-auto mt-2">
          {(['explore', 'route', 'live'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={cn(
                "flex-1 py-1.5 text-[13px] font-semibold tracking-wide capitalize rounded-full transition-all relative",
                mode === m ? "text-black" : "text-white/40 hover:text-white/70"
              )}
            >
              {mode === m && (
                <motion.div layoutId="modeBg" className="absolute inset-0 bg-white/90 rounded-full z-0 shadow-sm" transition={{ type: "spring", stiffness: 500, damping: 30 }} />
              )}
              <span className="relative z-10">{m}</span>
            </button>
          ))}
        </div>`
);

content = content.replace(
  /{mode === 'explore' && \([\s\S]*?<\/motion.div>\s*\)}/,
  `{mode === 'explore' && (
              <motion.div key="explore" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2 px-1">
                {exploreChips.map((chip) => (
                  <button key={chip.id} onClick={() => { setExploreChip(chip.id); setSelectedItem(null); }} className={cn("flex items-center gap-2 px-3.5 py-1.5 bg-black/40 backdrop-blur-2xl border rounded-full transition-all whitespace-nowrap", exploreChip === chip.id ? "border-white/30 bg-white/10 text-white shadow-sm" : "border-white/5 text-white/40 hover:bg-white/5 hover:text-white/80")}>
                    <chip.icon className="w-3.5 h-3.5" />
                    <span className="text-[13px] font-semibold tracking-tight">{chip.label}</span>
                  </button>
                ))}
              </motion.div>
            )}`
);

content = content.replace(
  /{mode === 'live' && \([\s\S]*?<\/motion.div>\s*\)}/,
  `{mode === 'live' && (
              <motion.div key="live" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex gap-2.5 overflow-x-auto hide-scrollbar pb-2 px-1">
                {liveChips.map((chip) => (
                  <button key={chip.id} onClick={() => { setLiveChip(chip.id); setSelectedItem(null); }} className={cn("flex items-center gap-2 px-3.5 py-1.5 bg-black/40 backdrop-blur-2xl border rounded-full transition-all whitespace-nowrap", liveChip === chip.id ? "border-white/20 bg-white/10 text-white shadow-sm" : "border-white/5 text-white/40 hover:bg-white/5 hover:text-white/80")}>
                    <chip.icon className="w-3.5 h-3.5" />
                    <span className="text-[13px] font-semibold tracking-tight">{chip.label}</span>
                  </button>
                ))}
              </motion.div>
            )}`
);

content = content.replace(
  /{mode === 'route' && !routeGenerated && \([\s\S]*?<\/motion.div>\s*\)}/,
  `{mode === 'route' && !routeGenerated && (
              <motion.div key="route" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-3">
                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex flex-col relative">
                  
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-white/60 ml-0.5 shrink-0" />
                    <Input value={routeFrom} onChange={(e) => setRouteFrom(e.target.value)} className="h-9 bg-transparent border-0 px-0 focus-visible:ring-0 text-[15px] font-medium text-white placeholder:text-white/30" placeholder="From (Current Location)" />
                  </div>
                  
                  <div className="absolute left-[22px] top-[40px] bottom-[40px] w-[2px] bg-white/10 rounded-full" />
                  
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/5">
                    <div className="w-2 h-2 rounded-sm bg-white ml-0.5 shrink-0" />
                    <Input value={routeTo} onChange={(e) => setRouteTo(e.target.value)} className="h-9 bg-transparent border-0 px-0 focus-visible:ring-0 text-[15px] font-medium text-white placeholder:text-white/30" placeholder="Where to?" autoFocus />
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 px-1 mt-1">
                  {routeChips.map((chip, i) => (
                    <button key={i} onClick={() => handleRouteGenerate(chip.label)} className="px-3.5 py-1.5 bg-white/[0.03] border border-white/10 rounded-full text-[12px] font-semibold text-white/50 hover:bg-white/10 hover:text-white transition-all whitespace-nowrap">
                      {chip.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}`
);

content = content.replace(
  /{mode === 'live' && liveChip === 'crowd' && \([\s\S]*?<\/>\s*\)}/,
  `{mode === 'live' && liveChip === 'crowd' && (
                  <>
                    <div className="absolute top-[20%] left-[10%] w-56 h-56 bg-white/10 blur-[80px] rounded-full mix-blend-screen pointer-events-none" />
                    <div className="absolute top-[60%] right-[20%] w-72 h-72 bg-white/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
                  </>
                )}`
);

content = content.replace(
  /{mode === 'live' && liveChip === 'queue' && \([\s\S]*?<\/>\s*\)}/,
  `{mode === 'live' && liveChip === 'queue' && (
                  <>
                    <div className="absolute top-[35%] left-[70%] w-40 h-40 bg-white/10 blur-[60px] rounded-full mix-blend-screen pointer-events-none" />
                  </>
                )}`
);

content = content.replace(
  /className={cn\([\s\S]*?"absolute z-20 w-10 h-10 -ml-5 -mt-5 rounded-full flex items-center justify-center transition-all",[\s\S]*?selectedItem\?\.id === point\.id[\s\S]*?\? "bg-white text-black scale-110 shadow-\[0_0_20px_rgba\(255,255,255,0\.5\)\]"[\s\S]*?: point\.type === 'live_incident' \|\| point\.type === 'live_alert'[\s\S]*?\? "bg-red-500\/20 border-red-500\/50 text-red-500 border backdrop-blur-md"[\s\S]*?: "bg-black text-white hover:bg-white\/10 border border-white\/30 backdrop-blur-md"[\s\S]*?\)}/g,
  `className={cn(
                      "absolute z-20 w-9 h-9 -ml-4.5 -mt-4.5 rounded-full flex items-center justify-center transition-all",
                      selectedItem?.id === point.id 
                        ? "bg-white text-black scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                        : point.type === 'live_incident' || point.type === 'live_alert'
                          ? "bg-black/60 border border-white/40 text-white backdrop-blur-md shadow-sm"
                          : "bg-black/60 border border-white/20 text-white/70 hover:bg-white/10 hover:border-white/40 hover:text-white backdrop-blur-md"
                    )}`
);

fs.writeFileSync(file, content);
