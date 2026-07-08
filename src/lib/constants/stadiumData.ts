export const GLOBAL_FOOTBALL_STADIUMS = [
  "Wembley Stadium",
  "Camp Nou",
  "Santiago Bernabéu",
  "Old Trafford",
  "Anfield",
  "Etihad Stadium",
  "Emirates Stadium",
  "Stamford Bridge",
  "Tottenham Hotspur Stadium",
  "Allianz Arena",
  "Signal Iduna Park",
  "San Siro",
  "Stadio Olimpico",
  "Parc des Princes",
  "Johan Cruyff Arena",
  "Luzhniki Stadium",
  "Maracanã Stadium",
  "Estadio Azteca",
  "Celtic Park",
  "Ibrox Stadium",
  "Allianz Stadium",
  "Metropolitano Stadium",
  "Estádio da Luz",
  "Estádio do Dragão",
  "King Fahd International Stadium",
  "Lusail Stadium",
  "Education City Stadium",
  "Al Bayt Stadium",
  "Khalifa International Stadium",
  "Rose Bowl",
  "SoFi Stadium",
  "Hard Rock Stadium",
  "AT&T Stadium",
  "Nissan Stadium",
  "Soldier Field",
  "Mercedes-Benz Stadium",
  "Levi's Stadium",
  "Olympiastadion Berlin",
  "Puskás Aréna",
  "Friends Arena"
];

export const DEFAULT_STADIUM_TEMPLATE = {
  sections: {
    north: {
      lower: ["N101", "N102", "N103", "N104"],
      middle: ["N201", "N202", "N203", "N204"],
      upper: ["N301", "N302", "N303", "N304"],
    },
    east: {
      lower: ["E101", "E102", "E103", "E104"],
      middle: ["E201", "E202", "E203", "E204"],
      upper: ["E301", "E302", "E303", "E304"],
    },
    south: {
      lower: ["S101", "S102", "S103", "S104"],
      middle: ["S201", "S202", "S203", "S204"],
      upper: ["S301", "S302", "S303", "S304"],
    },
    west: {
      lower: ["W101", "W102", "W103", "W104"],
      middle: ["W201", "W202", "W203", "W204"],
      upper: ["W301", "W302", "W303", "W304"],
    },
  },

  rowsByTier: {
    lower: ["A","B","C","D","E","F","G","H","J","K","L","M","N","P","Q","R","S","T","U","V"],
    middle: ["A","B","C","D","E","F","G","H","J","K","L","M","N","P","Q"],
    upper: ["A","B","C","D","E","F","G","H","J","K","L","M"],
  },

  seatRules: {
    lower: [
      { rows: ["A","B","C","D","E","F","G","H"], seatCount: 24 },
      { rows: ["J","K","L","M","N"], seatCount: 28 },
      { rows: ["P","Q","R","S","T","U","V"], seatCount: 32 },
    ],
    middle: [
      { rows: ["A","B","C","D","E"], seatCount: 20 },
      { rows: ["F","G","H","J","K"], seatCount: 24 },
      { rows: ["L","M","N","P","Q"], seatCount: 28 },
    ],
    upper: [
      { rows: ["A","B","C","D"], seatCount: 18 },
      { rows: ["E","F","G","H"], seatCount: 22 },
      { rows: ["J","K","L","M"], seatCount: 26 },
    ],
  },
};

export const DEFAULT_GATES = [
  { code: "Gate A", side: "North", type: "general" },
  { code: "Gate B", side: "North-East", type: "general" },
  { code: "Gate C", side: "East", type: "general" },
  { code: "Gate D", side: "South-East", type: "general" },
  { code: "Gate E", side: "South", type: "general" },
  { code: "Gate F", side: "South-West", type: "general" },
  { code: "Gate G", side: "West", type: "general" },
  { code: "Gate H", side: "North-West", type: "vip_accessible" },
];

export const DEFAULT_WASHROOMS = [
  { id: "wash_n_1", name: "Washroom North 1", side: "North", nearSection: "N101", type: "washroom" },
  { id: "wash_n_2", name: "Washroom North 2", side: "North", nearSection: "N104", type: "washroom" },
  { id: "wash_n_3", name: "Washroom North 3", side: "North", nearSection: "N201", type: "washroom" },
  { id: "wash_n_4", name: "Washroom North 4", side: "North", nearSection: "N204", type: "washroom" },

  { id: "wash_e_1", name: "Washroom East 1", side: "East", nearSection: "E101", type: "washroom" },
  { id: "wash_e_2", name: "Washroom East 2", side: "East", nearSection: "E104", type: "washroom" },
  { id: "wash_e_3", name: "Washroom East 3", side: "East", nearSection: "E201", type: "washroom" },
  { id: "wash_e_4", name: "Washroom East 4", side: "East", nearSection: "E204", type: "washroom" },

  { id: "wash_s_1", name: "Washroom South 1", side: "South", nearSection: "S101", type: "washroom" },
  { id: "wash_s_2", name: "Washroom South 2", side: "South", nearSection: "S104", type: "washroom" },
  { id: "wash_s_3", name: "Washroom South 3", side: "South", nearSection: "S201", type: "washroom" },
  { id: "wash_s_4", name: "Washroom South 4", side: "South", nearSection: "S204", type: "washroom" },

  { id: "wash_w_1", name: "Washroom West 1", side: "West", nearSection: "W101", type: "washroom" },
  { id: "wash_w_2", name: "Washroom West 2", side: "West", nearSection: "W104", type: "washroom" },
  { id: "wash_w_3", name: "Washroom West 3", side: "West", nearSection: "W201", type: "washroom" },
  { id: "wash_w_4", name: "Washroom West 4", side: "West", nearSection: "W204", type: "washroom" },
];

export const DEFAULT_CAFETERIAS = [
  { id: "food_n_1", name: "North Food Court 1", side: "North", nearSection: "N102", type: "food" },
  { id: "food_n_2", name: "North Food Court 2", side: "North", nearSection: "N202", type: "food" },
  { id: "food_n_3", name: "North Food Court 3", side: "North", nearSection: "N302", type: "food" },

  { id: "food_e_1", name: "East Food Court 1", side: "East", nearSection: "E102", type: "food" },
  { id: "food_e_2", name: "East Food Court 2", side: "East", nearSection: "E202", type: "food" },
  { id: "food_e_3", name: "East Food Court 3", side: "East", nearSection: "E302", type: "food" },

  { id: "food_s_1", name: "South Food Court 1", side: "South", nearSection: "S102", type: "food" },
  { id: "food_s_2", name: "South Food Court 2", side: "South", nearSection: "S202", type: "food" },
  { id: "food_s_3", name: "South Food Court 3", side: "South", nearSection: "S302", type: "food" },

  { id: "food_w_1", name: "West Food Court 1", side: "West", nearSection: "W102", type: "food" },
  { id: "food_w_2", name: "West Food Court 2", side: "West", nearSection: "W202", type: "food" },
  { id: "food_w_3", name: "West Food Court 3", side: "West", nearSection: "W302", type: "food" },
];

export const DEFAULT_MEDICAL_POINTS = [
  { id: "med_n", name: "Medical Bay North", side: "North", nearSection: "N201", type: "medical" },
  { id: "med_e", name: "Medical Bay East", side: "East", nearSection: "E201", type: "medical" },
  { id: "med_s", name: "Medical Bay South", side: "South", nearSection: "S201", type: "medical" },
  { id: "med_w", name: "Medical Bay West", side: "West", nearSection: "W201", type: "medical" },
];

export const SECTION_GATE_MAP: Record<string, string> = {
  N101: "Gate A", N102: "Gate A", N103: "Gate B", N104: "Gate B",
  N201: "Gate A", N202: "Gate A", N203: "Gate B", N204: "Gate B",
  N301: "Gate A", N302: "Gate A", N303: "Gate B", N304: "Gate B",

  E101: "Gate C", E102: "Gate C", E103: "Gate D", E104: "Gate D",
  E201: "Gate C", E202: "Gate C", E203: "Gate D", E204: "Gate D",
  E301: "Gate C", E302: "Gate C", E303: "Gate D", E304: "Gate D",

  S101: "Gate E", S102: "Gate E", S103: "Gate F", S104: "Gate F",
  S201: "Gate E", S202: "Gate E", S203: "Gate F", S204: "Gate F",
  S301: "Gate E", S302: "Gate E", S303: "Gate F", S304: "Gate F",

  W101: "Gate G", W102: "Gate G", W103: "Gate H", W104: "Gate H",
  W201: "Gate G", W202: "Gate G", W203: "Gate H", W204: "Gate H",
  W301: "Gate G", W302: "Gate G", W303: "Gate H", W304: "Gate H",
};

export const MAP_GATES = [
  { id: "gate_a", label: "Gate A", x: 260, y: 90, type: "gate" },
  { id: "gate_b", label: "Gate B", x: 740, y: 90, type: "gate" },
  { id: "gate_c", label: "Gate C", x: 910, y: 300, type: "gate" },
  { id: "gate_d", label: "Gate D", x: 910, y: 700, type: "gate" },
  { id: "gate_e", label: "Gate E", x: 740, y: 910, type: "gate" },
  { id: "gate_f", label: "Gate F", x: 260, y: 910, type: "gate" },
  { id: "gate_g", label: "Gate G", x: 90, y: 700, type: "gate" },
  { id: "gate_h", label: "Gate H", x: 90, y: 300, type: "gate" },
];

export const MAP_WASHROOMS = [
  { id: "wash_n_1", x: 320, y: 180, nearSection: "N101", type: "washroom" },
  { id: "wash_n_2", x: 680, y: 180, nearSection: "N104", type: "washroom" },
  { id: "wash_n_3", x: 320, y: 310, nearSection: "N201", type: "washroom" },
  { id: "wash_n_4", x: 680, y: 310, nearSection: "N204", type: "washroom" },

  { id: "wash_e_1", x: 820, y: 300, nearSection: "E101", type: "washroom" },
  { id: "wash_e_2", x: 820, y: 670, nearSection: "E104", type: "washroom" },
  { id: "wash_e_3", x: 700, y: 300, nearSection: "E201", type: "washroom" },
  { id: "wash_e_4", x: 700, y: 670, nearSection: "E204", type: "washroom" },

  { id: "wash_s_1", x: 320, y: 820, nearSection: "S101", type: "washroom" },
  { id: "wash_s_2", x: 680, y: 820, nearSection: "S104", type: "washroom" },
  { id: "wash_s_3", x: 320, y: 690, nearSection: "S201", type: "washroom" },
  { id: "wash_s_4", x: 680, y: 690, nearSection: "S204", type: "washroom" },

  { id: "wash_w_1", x: 180, y: 300, nearSection: "W101", type: "washroom" },
  { id: "wash_w_2", x: 180, y: 670, nearSection: "W104", type: "washroom" },
  { id: "wash_w_3", x: 300, y: 300, nearSection: "W201", type: "washroom" },
  { id: "wash_w_4", x: 300, y: 670, nearSection: "W204", type: "washroom" },
];

export const MAP_CAFETERIAS = [
  { id: "food_n_1", x: 400, y: 170, nearSection: "N102", type: "food" },
  { id: "food_n_2", x: 520, y: 260, nearSection: "N202", type: "food" },
  { id: "food_n_3", x: 520, y: 340, nearSection: "N302", type: "food" },

  { id: "food_e_1", x: 830, y: 390, nearSection: "E102", type: "food" },
  { id: "food_e_2", x: 730, y: 480, nearSection: "E202", type: "food" },
  { id: "food_e_3", x: 670, y: 560, nearSection: "E302", type: "food" },

  { id: "food_s_1", x: 400, y: 830, nearSection: "S102", type: "food" },
  { id: "food_s_2", x: 520, y: 740, nearSection: "S202", type: "food" },
  { id: "food_s_3", x: 520, y: 660, nearSection: "S302", type: "food" },

  { id: "food_w_1", x: 170, y: 390, nearSection: "W102", type: "food" },
  { id: "food_w_2", x: 270, y: 480, nearSection: "W202", type: "food" },
  { id: "food_w_3", x: 330, y: 560, nearSection: "W302", type: "food" },
];

export const MAP_SECTIONS = [
  // North
  { id: "section_N101", x: 250, y: 220, type: "seat", label: "N101" },
  { id: "section_N102", x: 400, y: 220, type: "seat", label: "N102" },
  { id: "section_N103", x: 600, y: 220, type: "seat", label: "N103" },
  { id: "section_N104", x: 750, y: 220, type: "seat", label: "N104" },
  { id: "section_N201", x: 250, y: 280, type: "seat", label: "N201" },
  { id: "section_N202", x: 400, y: 280, type: "seat", label: "N202" },
  { id: "section_N203", x: 600, y: 280, type: "seat", label: "N203" },
  { id: "section_N204", x: 750, y: 280, type: "seat", label: "N204" },
  { id: "section_N301", x: 250, y: 340, type: "seat", label: "N301" },
  { id: "section_N302", x: 400, y: 340, type: "seat", label: "N302" },
  { id: "section_N303", x: 600, y: 340, type: "seat", label: "N303" },
  { id: "section_N304", x: 750, y: 340, type: "seat", label: "N304" },

  // East
  { id: "section_E101", x: 780, y: 250, type: "seat", label: "E101" },
  { id: "section_E102", x: 780, y: 390, type: "seat", label: "E102" },
  { id: "section_E103", x: 780, y: 560, type: "seat", label: "E103" },
  { id: "section_E104", x: 780, y: 720, type: "seat", label: "E104" },
  { id: "section_E201", x: 720, y: 250, type: "seat", label: "E201" },
  { id: "section_E202", x: 720, y: 390, type: "seat", label: "E202" },
  { id: "section_E203", x: 720, y: 560, type: "seat", label: "E203" },
  { id: "section_E204", x: 720, y: 720, type: "seat", label: "E204" },
  { id: "section_E301", x: 660, y: 250, type: "seat", label: "E301" },
  { id: "section_E302", x: 660, y: 390, type: "seat", label: "E302" },
  { id: "section_E303", x: 660, y: 560, type: "seat", label: "E303" },
  { id: "section_E304", x: 660, y: 720, type: "seat", label: "E304" },

  // South
  { id: "section_S101", x: 250, y: 780, type: "seat", label: "S101" },
  { id: "section_S102", x: 400, y: 780, type: "seat", label: "S102" },
  { id: "section_S103", x: 600, y: 780, type: "seat", label: "S103" },
  { id: "section_S104", x: 750, y: 780, type: "seat", label: "S104" },
  { id: "section_S201", x: 250, y: 720, type: "seat", label: "S201" },
  { id: "section_S202", x: 400, y: 720, type: "seat", label: "S202" },
  { id: "section_S203", x: 600, y: 720, type: "seat", label: "S203" },
  { id: "section_S204", x: 750, y: 720, type: "seat", label: "S204" },
  { id: "section_S301", x: 250, y: 660, type: "seat", label: "S301" },
  { id: "section_S302", x: 400, y: 660, type: "seat", label: "S302" },
  { id: "section_S303", x: 600, y: 660, type: "seat", label: "S303" },
  { id: "section_S304", x: 750, y: 660, type: "seat", label: "S304" },

  // West
  { id: "section_W101", x: 220, y: 250, type: "seat", label: "W101" },
  { id: "section_W102", x: 220, y: 390, type: "seat", label: "W102" },
  { id: "section_W103", x: 220, y: 560, type: "seat", label: "W103" },
  { id: "section_W104", x: 220, y: 720, type: "seat", label: "W104" },
  { id: "section_W201", x: 280, y: 250, type: "seat", label: "W201" },
  { id: "section_W202", x: 280, y: 390, type: "seat", label: "W202" },
  { id: "section_W203", x: 280, y: 560, type: "seat", label: "W203" },
  { id: "section_W204", x: 280, y: 720, type: "seat", label: "W204" },
  { id: "section_W301", x: 340, y: 250, type: "seat", label: "W301" },
  { id: "section_W302", x: 340, y: 390, type: "seat", label: "W302" },
  { id: "section_W303", x: 340, y: 560, type: "seat", label: "W303" },
  { id: "section_W304", x: 340, y: 720, type: "seat", label: "W304" },
];
