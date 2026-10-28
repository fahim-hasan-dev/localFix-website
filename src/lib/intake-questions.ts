export interface IntakeChoice {
  value: string;
  label: string;
}

export interface IntakeQuestion {
  id: string;
  prompt: string;
  options: IntakeChoice[];
}

const sharedWhen: IntakeQuestion = {
  id: "when",
  prompt: "When do you need this done?",
  options: [
    { value: "asap", label: "As soon as possible" },
    { value: "this_week", label: "This week" },
    { value: "flexible", label: "I'm flexible" },
  ],
};

export const defaultCategoryQuestions: Record<string, IntakeQuestion[]> = {
  "house-cleaning": [
    {
      id: "clean_type",
      prompt: "What kind of clean do you need?",
      options: [
        { value: "standard", label: "Standard clean" },
        { value: "deep", label: "Deep clean" },
        { value: "move", label: "Move-in / move-out" },
      ],
    },
    {
      id: "bedrooms",
      prompt: "How many bedrooms?",
      options: [
        { value: "1", label: "1 Bedroom" },
        { value: "2", label: "2 Bedrooms" },
        { value: "3", label: "3 Bedrooms" },
        { value: "4+", label: "4+ Bedrooms" },
      ],
    },
    {
      id: "bathrooms",
      prompt: "How many bathrooms?",
      options: [
        { value: "1", label: "1 Bathroom" },
        { value: "2", label: "2 Bathrooms" },
        { value: "3+", label: "3+ Bathrooms" },
      ],
    },
    {
      id: "frequency",
      prompt: "How often?",
      options: [
        { value: "once", label: "One-time" },
        { value: "weekly", label: "Weekly" },
        { value: "biweekly", label: "Every 2 weeks" },
        { value: "monthly", label: "Monthly" },
      ],
    },
    sharedWhen,
  ],
  plumbing: [
    {
      id: "issue",
      prompt: "What's the plumbing issue?",
      options: [
        { value: "leak", label: "Leak repair" },
        { value: "clog", label: "Clog / drain clearing" },
        { value: "fixture", label: "Faucet or toilet" },
        { value: "heater", label: "Water heater" },
        { value: "other", label: "Something else" },
      ],
    },
    {
      id: "where",
      prompt: "Where is the issue located?",
      options: [
        { value: "kitchen", label: "Kitchen" },
        { value: "bath", label: "Bathroom" },
        { value: "laundry", label: "Laundry room" },
        { value: "outside", label: "Outside / Yard" },
      ],
    },
    {
      id: "water",
      prompt: "Is water currently leaking or active?",
      options: [
        { value: "yes", label: "Yes, leaking now" },
        { value: "drip", label: "Slow intermittent drip" },
        { value: "no", label: "No / contained" },
      ],
    },
    sharedWhen,
  ],
  electrical: [
    {
      id: "issue",
      prompt: "What electrical work do you need?",
      options: [
        { value: "outlet", label: "Outlet or switch" },
        { value: "lights", label: "Lighting fixture" },
        { value: "breaker", label: "Breaker / panel / outage" },
        { value: "install", label: "New installation / EV" },
      ],
    },
    {
      id: "count",
      prompt: "How many fixtures or spots?",
      options: [
        { value: "1", label: "1 location" },
        { value: "2-3", label: "2–3 locations" },
        { value: "4+", label: "4 or more" },
      ],
    },
    {
      id: "power",
      prompt: "Is power on in the rest of the house?",
      options: [
        { value: "yes", label: "Yes, fully working" },
        { value: "partial", label: "Some rooms are out" },
        { value: "no", label: "Total power outage" },
      ],
    },
    sharedWhen,
  ],
  hvac: [
    {
      id: "system",
      prompt: "What HVAC system needs work?",
      options: [
        { value: "ac", label: "Air conditioning" },
        { value: "heat", label: "Heating / furnace" },
        { value: "both", label: "Both AC & heat" },
      ],
    },
    {
      id: "issue",
      prompt: "What is the primary symptom?",
      options: [
        { value: "none", label: "Not turning on" },
        { value: "weak", label: "Blows warm / weak airflow" },
        { value: "noise", label: "Loud noise or odor" },
        { value: "maintain", label: "Annual maintenance" },
      ],
    },
    {
      id: "system_type",
      prompt: "What system type is installed?",
      options: [
        { value: "central", label: "Central split system" },
        { value: "heat_pump", label: "Heat pump" },
        { value: "ductless", label: "Ductless mini-split" },
        { value: "unsure", label: "Not sure / advise" },
      ],
    },
    sharedWhen,
  ],
  painting: [
    {
      id: "area",
      prompt: "What surfaces are being painted?",
      options: [
        { value: "interior", label: "Interior walls / ceilings" },
        { value: "exterior", label: "Exterior siding / trim" },
        { value: "cabinets", label: "Cabinets or doors" },
        { value: "both", label: "Interior & exterior" },
      ],
    },
    {
      id: "size",
      prompt: "How much space or area?",
      options: [
        { value: "1", label: "1 room or touch-up" },
        { value: "2-3", label: "2–3 rooms" },
        { value: "whole", label: "Entire home" },
      ],
    },
    {
      id: "paint",
      prompt: "Do you already have paint & supplies?",
      options: [
        { value: "yes", label: "Yes, paint is on-site" },
        { value: "no", label: "Need pro to supply paint" },
        { value: "color_advice", label: "Need color advice" },
      ],
    },
    sharedWhen,
  ],
  handyman: [
    {
      id: "job",
      prompt: "What kind of handyman task is this?",
      options: [
        { value: "mount", label: "Mount TV or art" },
        { value: "repair", label: "Drywall, door or fixture repair" },
        { value: "assemble", label: "Furniture assembly" },
        { value: "other", label: "Punch-list / multiple items" },
      ],
    },
    {
      id: "size",
      prompt: "Estimated time required?",
      options: [
        { value: "small", label: "Under 2 hours" },
        { value: "half", label: "Half day (2–4 hours)" },
        { value: "full", label: "Full day (5+ hours)" },
      ],
    },
    {
      id: "materials",
      prompt: "Are hardware & parts on-site?",
      options: [
        { value: "have_all", label: "I have all items ready" },
        { value: "pro_bring", label: "Pro should supply anchors/parts" },
        { value: "unsure", label: "Not sure / pro advise" },
      ],
    },
    sharedWhen,
  ],
  landscaping: [
    {
      id: "job",
      prompt: "What outdoor service do you need?",
      options: [
        { value: "mow", label: "Lawn mowing & edging" },
        { value: "tree", label: "Tree trimming / pruning" },
        { value: "hard", label: "Mulching & flowerbeds" },
        { value: "cleanup", label: "Yard clean-up & debris" },
      ],
    },
    {
      id: "lot",
      prompt: "About how large is the property lot?",
      options: [
        { value: "small", label: "Small (under 0.25 acre)" },
        { value: "medium", label: "Medium (0.25–0.5 acre)" },
        { value: "large", label: "Large (0.5+ acre)" },
      ],
    },
    {
      id: "frequency",
      prompt: "Service frequency preference?",
      options: [
        { value: "once", label: "One-time service" },
        { value: "biweekly", label: "Every 2 weeks" },
        { value: "monthly", label: "Monthly maintenance" },
      ],
    },
    sharedWhen,
  ],
  "pest-control": [
    {
      id: "pest",
      prompt: "What pest are you dealing with?",
      options: [
        { value: "ants", label: "Ants or spiders" },
        { value: "roaches", label: "Cockroaches" },
        { value: "rodents", label: "Mice or rats" },
        { value: "termites", label: "Termites or wasps" },
      ],
    },
    {
      id: "where",
      prompt: "Where have you seen pest activity?",
      options: [
        { value: "inside", label: "Inside living areas" },
        { value: "attic", label: "Attic or crawlspace" },
        { value: "outside", label: "Outside perimeter / yard" },
        { value: "both", label: "Both inside & outside" },
      ],
    },
    {
      id: "severity",
      prompt: "How urgent is the situation?",
      options: [
        { value: "first_seen", label: "Just noticed recently" },
        { value: "active", label: "Persistent active issue" },
        { value: "prevention", label: "Routine preventative spray" },
      ],
    },
    sharedWhen,
  ],
  roofing: [
    {
      id: "job",
      prompt: "What roofing service do you need?",
      options: [
        { value: "leak", label: "Leak repair & patch" },
        { value: "inspect", label: "Inspection / storm assessment" },
        { value: "replace", label: "Full roof replacement" },
        { value: "gutter", label: "Gutter clean or repair" },
      ],
    },
    {
      id: "stories",
      prompt: "How many stories is the home?",
      options: [
        { value: "1", label: "1 Story" },
        { value: "2", label: "2 Stories" },
        { value: "3+", label: "3+ Stories" },
      ],
    },
    {
      id: "material",
      prompt: "What is your current roof material?",
      options: [
        { value: "shingle", label: "Asphalt architectural shingle" },
        { value: "metal", label: "Standing seam metal" },
        { value: "tile", label: "Tile or slate" },
        { value: "flat", label: "Flat / membrane / unsure" },
      ],
    },
    sharedWhen,
  ],
  "appliance-repair": [
    {
      id: "appliance",
      prompt: "Which appliance needs service?",
      options: [
        { value: "fridge", label: "Refrigerator / freezer" },
        { value: "washer", label: "Washing machine" },
        { value: "dryer", label: "Clothes dryer" },
        { value: "dishwasher", label: "Dishwasher" },
        { value: "oven", label: "Oven, range or cooktop" },
      ],
    },
    {
      id: "issue",
      prompt: "What is the primary problem?",
      options: [
        { value: "dead", label: "Will not turn on or run" },
        { value: "leak", label: "Water leak or drainage failure" },
        { value: "noise", label: "Unusual noise or vibration" },
        { value: "temp", label: "Not heating / not cooling" },
      ],
    },
    {
      id: "age",
      prompt: "Approximate appliance age?",
      options: [
        { value: "under_3", label: "Under 3 years" },
        { value: "3_to_7", label: "3 to 7 years" },
        { value: "over_7", label: "Over 7 years" },
        { value: "unsure", label: "Unsure" },
      ],
    },
    sharedWhen,
  ],
};

const fallback: IntakeQuestion[] = [
  {
    id: "job",
    prompt: "What do you need help with?",
    options: [
      { value: "repair", label: "Repair existing" },
      { value: "install", label: "New installation" },
      { value: "inspect", label: "Inspection / estimate" },
    ],
  },
  sharedWhen,
];

export function questionsForCategory(slug: string): IntakeQuestion[] {
  return defaultCategoryQuestions[slug] ?? fallback;
}

export function labelForAnswer(slug: string, questionId: string, value: string) {
  const question = questionsForCategory(slug).find((item) => item.id === questionId);
  return question?.options.find((option) => option.value === value)?.label ?? value;
}
