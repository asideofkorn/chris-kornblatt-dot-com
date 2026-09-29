// Approved copy from the Career conversation, with the later voice revisions.
// Keep employer details limited to the approved public material.
export const links = {
  github: "https://github.com/asideofkorn",
  linkedin: "https://www.linkedin.com/in/chriskornblatt/",
  wayproof: "https://wayproof.dev/",
  wayproofRepo: "https://github.com/asideofkorn/wayproof",
};

export const home = {
  title:
    "I build products that turn messy real-world systems into software that scales.",
  intro: [
    "I'm a product manager and builder. I've worked in logistics, insurance, biotech, and advertising. The domains are pretty different, but the problems I gravitate toward are surprisingly similar: messy data, manual workflows, systems that don't scale, and complicated things that can probably be made simpler.",
    "I've built AI products, internal tools, APIs, data platforms, and product teams. I like getting close enough to the problem to understand how the whole system works.",
  ],
  howTitle: "I like figuring out how things work.",
  how: [
    "A lot of the problems I end up working on start out messy. People are coordinating in spreadsheets. Important information is buried in documents. A process works because a few people know all of the exceptions. Or a system worked fine at one scale and starts breaking at the next.",
    "I usually want to understand the underlying system first. What are the actual objects? Where does the data come from? What decisions are people making? What are the exceptions? What breaks when volume increases?",
    "Once I understand that, the product usually gets a lot easier to reason about.",
    "I've done this as a PM, Head of Product, operator, and increasingly as a hands-on builder using AI. I care a lot more about having an interesting problem and enough ownership to solve it than I do about the title.",
  ],
  elsewhere:
    "When I'm not building software, I'm usually learning another system the hard way: planning long days in the mountains, making teaware, riding a bike uphill, or disappearing down a research rabbit hole. Some of those experiments eventually become projects. Most don't. That's part of the point.",
};

export const workIntro = [
  "I've spent much of my career working on systems that become difficult when they reach the real world: physical operations, regulated workflows, external data, legacy processes, messy documents, and software that has to remain reliable as usage grows.",
  "The domains have changed. The underlying problem has been remarkably consistent.",
];
export const projectsIntro = [
  "Some of the things I learn most from start because I'm curious enough about a problem to build something. They don't all need to become companies. The useful part is going far enough into a domain to discover where the interesting problems actually are.",
];

export const work = [
  {
    slug: "terminal49",
    name: "Terminal49",
    title: "Making logistics documents useful to software",
    summary:
      "I work as Terminal49's sole product manager across AI document extraction, product infrastructure, monetization, and collaborative workflows. I built the evaluation framework and extraction prompts behind an AI document system spanning 55+ logistics document types, then helped turn that infrastructure into production workflows processing more than a thousand documents a day.",
    intro: [
      "Freight still runs on a surprising number of PDFs, spreadsheets, emails, and documents. A logistics operator can look at most of them and immediately understand what they mean. Software has a harder time.",
      "At Terminal49, I've been working on that problem as the sole PM.",
    ],
    sections: [
      {
        title: "55+ kinds of documents",
        paragraphs: [
          "Reading one document with an LLM is easy. Building something customers can actually depend on is harder.",
          "The system needs to figure out what kind of document it received, extract the right fields for that document, deal with variations in how those fields are represented, and give us a way to know when a change made things better or worse.",
          "I built the extraction prompts and eval framework for more than 55 logistics document types in Terminal49's AI Document Hub.",
          'One of the things I\'ve found most interesting is how much evals become part of the product itself. You have to define what "correct" means before you can systematically make the system better.',
        ],
      },
      {
        title: "AI only matters when the workflow changes",
        paragraphs: [
          "The goal isn't document extraction for its own sake. One production workflow now processes roughly 1,100 documents per day and is enabling a customer to rethink an operation that previously required a much larger manual team.",
          "That's the kind of AI product work I'm most interested in: not adding a chatbot to existing software, but changing the economics of an underlying workflow.",
        ],
      },
      {
        title: "Building the systems around the product",
        paragraphs: [
          "My work at Terminal49 also includes usage-based billing and metering, collaborative workflows, Custom Fields, product analytics, and evolving Terminal49 from a tracking tool toward a system where freight teams can coordinate work that often lives in shared spreadsheets today.",
          "As the sole PM, the boundaries between product strategy, systems design, customer discovery, analytics, and execution are intentionally blurry.",
        ],
      },
    ],
  },
  {
    slug: "lula-addify",
    name: "Lula / Addify",
    title: "Making commercial insurance behave like software",
    previewTitle: "Turning commercial insurance from a process into a product",
    summary:
      "I joined Lula as its first product hire and eventually led a five-person product team as the company grew from $1.4M to $38.4M ARR. One of the problems I cared most about was collapsing the time required for a small business to obtain commercial auto insurance from roughly five days to four minutes by turning fragmented underwriting and external data into a self-service product. Lula was subsequently acquired by Addify, where I continued as Head of Product.",
    intro: [
      "Commercial insurance is full of workflows that make sense historically but feel absurd when viewed as a software problem: repeated data entry, phone calls, documents, underwriting handoffs, and days of waiting.",
      "At Lula, I joined as the first product hire and eventually built and led a five-person product team as ARR grew from $1.4M to $38.4M.",
    ],
    sections: [
      {
        title: "Five days to four minutes",
        paragraphs: [
          "One of our central problems was getting small businesses appropriately insured without reproducing the traditional insurance process online.",
          "We built a self-service commercial auto application that combined customer input with data from more than five external sources, including car-sharing platforms such as Turo and Getaround. The result reduced a process that could take roughly five days to about four minutes.",
        ],
      },
      {
        title: "Product wasn't just the customer interface",
        paragraphs: [
          "As Lula scaled, much of the important product work happened behind the interface: APIs, internal operations tools, data infrastructure, business intelligence, and the systems used by actuarial, operations, leadership, and product teams.",
          "We ultimately supported more than 4,000 customers.",
        ],
      },
      {
        title: "Building the product organization",
        paragraphs: [
          "I joined as Lula's first product hire and ultimately grew the product organization to five product managers.",
          "After Lula was acquired by Addify, I continued as Head of Product and launched two subscription-based commercial auto products for car-sharing hosts and rental agencies, both reaching paid adoption on their first day.",
        ],
      },
    ],
  },
  {
    slug: "invitae",
    name: "Invitae",
    title: "Learning to scale operations with software",
    previewTitle: "Scaling systems before they become bottlenecks",
    summary:
      "I worked at Invitae twice: first inside laboratory operations, and later as its first Technical Product Manager. Early on, I built software and workflows that helped scale laboratory accessioning from 10 to 250 samples per day without proportional headcount growth. Years later, I returned to work on core services, acquisition integrations, and the migration architecture for more than one million patient records.",
    intro: [
      "My first product work at Invitae didn't start with a product roadmap. It started inside the laboratory.",
      "Genetic testing was growing quickly, and physical samples had to move through regulated pre-analytical workflows before the science could happen.",
    ],
    sections: [
      {
        title: "10 samples became 250",
        paragraphs: [
          "I built and managed the six-person accessioning operation while designing software and workflows that helped increase throughput from roughly 10 samples per day to 250.",
          "One of those systems replaced spreadsheet-based sample tracking and allowed the operation to scale without adding two dedicated data-entry roles.",
          "That experience shaped how I think about product today: some of the highest-leverage software starts by understanding an operation from the inside.",
        ],
      },
      {
        title: "Returning as a technical PM",
        paragraphs: [
          "Several years later, I returned to Invitae as its first Technical Product Manager. This time the scaling problems were architectural: core services, integrating systems from acquisitions, an event-driven lab-ordering service, and designing a patient-data service and migration strategy for more than one million patient records.",
          "The domain was genomics, but the pattern has followed me ever since: understand the operational system, find the abstraction, and build software that lets the organization operate at a different scale.",
        ],
      },
    ],
  },
];

export const projects = [
  {
    slug: "wayproof",
    name: "Wayproof",
    title: "Wayproof",
    subtitle:
      "An open-source knowledge system for planning complicated outdoor objectives",
    summary:
      "Route-planning information is scattered across agency websites, permit systems, trip reports, maps, social posts, PDFs, and local knowledge. I'm building Wayproof to explore how structured evidence and AI can make that information easier to reason over without pretending uncertain or outdated information is fact. The project combines structured data, evidence provenance, an MCP interface, and AI-assisted development.",
    intro: [
      "I spend a lot of time planning trips in the mountains.",
      "For a complicated trip, the useful information ends up scattered everywhere: Forest Service pages, permit systems, maps, old trip reports, Facebook groups, PDFs, weather forecasts, and random comments from someone who was there last weekend.",
      "I've also noticed that AI is pretty good at finding some of this information and pretty bad at knowing which parts it should trust.",
      "Wayproof is an open-source project I'm building to explore that problem.",
    ],
    sections: [
      {
        title: "What I'm exploring",
        paragraphs: [
          "Wayproof models things such as regions, agencies, routes, trailheads, permits, water sources, parking, campsites, objectives, and the evidence supporting claims about them.",
          "The larger question is how an AI system can answer practical planning questions while preserving provenance, uncertainty, and changes over time.",
        ],
      },
      {
        title: "Building with AI",
        paragraphs: [
          "Wayproof is also an experiment in AI-assisted software development. I'm using AI not only to write code, but to help reason about schemas, architecture, evidence ingestion, validation, and the development workflow itself.",
        ],
      },
    ],
  },
  {
    slug: "quantitea",
    name: "Quantitea",
    title: "Quantitea",
    subtitle: "An experiment in making better tea through measurement",
    summary:
      "I built a tea business around a simple question: could precision (temperature, time, ratios, and repeatability) make excellent tea easier to reproduce? The project combined physical product development, experimentation, manufacturing, and entrepreneurship. It eventually found its way into Tim Ferriss's Tools of Titans.",
    intro: [
      "Years ago I got really into tea.",
      'I also got annoyed by how imprecise most brewing instructions were. "Use hot water." "Steep for a few minutes." That\'s fine until you drink an amazing cup and want to make exactly the same thing again.',
      "That rabbit hole eventually turned into Quantitea, a small tea business built around measuring and controlling the variables involved in brewing.",
      "Somehow, it eventually ended up in Tim Ferriss's Tools of Titans.",
    ],
    sections: [],
  },
];

export const career = [
  ["2025–Present", "Terminal49", "Product Manager · Sole PM"],
  ["2021–2025", "Lula / Addify", "Head of Product · Lula acquired by Addify"],
  ["2019–2021", "Invitae", "Senior Technical Product Manager · Core Services"],
  ["2016–2019", "Marin Software", "Product Manager"],
  ["2014–2016", "Invitae", "Product Manager · Accessioning Lead"],
];
