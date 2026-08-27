import { getDb } from "../api/queries/connection";
import { eq, and, isNull } from "drizzle-orm";
import {
  profiles,
  projects,
  certificates,
  experiences,
  awards,
  writings,
  skills,
  siteSettings,
} from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed profile
  const existingProfile = await db.select().from(profiles).limit(1);
  if (existingProfile.length === 0) {
    await db.insert(profiles).values({
      name: "Nazmus Sakib",
      title: "AI Engineer · RAG & LLM Systems · Intelligent Automation",
      bio: "I'm Nazmus Sakib, a 24-year-old Computer Science & Engineering student in my final semester at Northern University of Business & Technology, Khulna. From running a gaming subscription business during COVID to building ML systems and business automation platforms \u2014 I thrive at the intersection of software engineering and intelligent automation. Currently interning as a Machine Learning Engineer at Flyrank AI (Chicago) and on the MERN stack at Appstic.",
      email: "nazmus.sakib@example.com",
      githubUrl: "https://github.com/Nazmussakib247",
      linkedinUrl: "https://www.linkedin.com/in/nazmussakib247/",
      mediumUrl: "https://medium.com/@nazmussakib.cse.nubt",
      location: "Khulna, Bangladesh",
      age: 24,
      university: "Northern University of Business & Technology",
      department: "Computer Science & Engineering",
      semester: "8th Semester (Final)",
    });
    console.log("Profile seeded");
  }

  // Seed projects
  const existingProjects = await db.select().from(projects).limit(1);
  if (existingProjects.length === 0) {
    await db.insert(projects).values([
      {
        title: "Business Automation OS",
        description:
          "An intelligent business operating system with security intelligence for workflow automation, analytics, and process management. Currently in active development.",
        techStack: ["React", "Node.js", "Python", "TensorFlow"],
        githubUrl: "https://github.com/nazmussakib/business-automation-os",
        orderIndex: 0,
        isFeatured: true,
      },
      {
        title: "Spam Mail Detection System",
        description:
          "ML-powered email classification system using NLP techniques to detect and filter spam messages with high accuracy. Implements multiple classification algorithms.",
        techStack: ["Python", "scikit-learn", "NLTK", "Flask"],
        githubUrl: "https://github.com/nazmussakib/spam-detection",
        orderIndex: 1,
        isFeatured: true,
      },
      {
        title: "Sentiment Analysis System",
        description:
          "Real-time sentiment analysis platform for social media and customer feedback using deep learning models. Supports multiple languages and emotion detection.",
        techStack: ["Python", "TensorFlow", "FastAPI", "React"],
        githubUrl: "https://github.com/nazmussakib/sentiment-analysis",
        orderIndex: 2,
        isFeatured: true,
      },
      {
        title: "Hospital Management System",
        description:
          "Full-stack healthcare management platform with patient records, appointments, billing, and pharmacy modules. Designed for small to medium clinics.",
        techStack: ["MERN Stack", "Redux", "JWT", "Bootstrap"],
        githubUrl: "https://github.com/nazmussakib/hospital-management",
        liveUrl: "https://hospital-ms.demo.com",
        orderIndex: 3,
        isFeatured: true,
      },
      {
        title: "Blood Donation Management",
        description:
          "Connects donors with recipients, featuring real-time availability tracking and emergency request system. GPS-enabled donor locator.",
        techStack: ["React", "Node.js", "MongoDB", "Socket.io"],
        githubUrl: "https://github.com/nazmussakib/blood-donation",
        orderIndex: 4,
        isFeatured: true,
      },
      {
        title: "Automated HR Recruiting",
        description:
          "AI-driven recruitment platform with resume parsing, candidate ranking, and interview scheduling automation. Reduces hiring time by 60%.",
        techStack: ["Python", "spaCy", "React", "Django"],
        githubUrl: "https://github.com/nazmussakib/hr-recruiting",
        orderIndex: 5,
        isFeatured: true,
      },
      {
        title: "Local Service Marketplace",
        description:
          "Community marketplace connecting local service providers with customers, featuring booking and review systems. Supports multiple service categories.",
        techStack: ["Next.js", "PostgreSQL", "Stripe", "Tailwind"],
        githubUrl: "https://github.com/nazmussakib/local-marketplace",
        orderIndex: 6,
        isFeatured: true,
      },
      {
        title: "Arduino-Based Military Radar System",
        description:
          "Computer Architecture university assignment using Arduino and ultrasonic sensing to detect objects, measure distance, and visualize scan angles in a radar-style interface.",
        techStack: ["Arduino", "C++", "Ultrasonic Sensor", "Computer Architecture"],
        githubUrl: "https://github.com/Nazmussakib247/Computer-Architecture",
        liveUrl: "https://www.linkedin.com/posts/nazmussakib247_aurdino-based-military-radar-system-computer-activity-7289634889333714945-TQHH",
        orderIndex: 7,
        isFeatured: true,
      },
    ]);
    console.log("Projects seeded");
  }

  // Preserve repository-backed projects for fresh or restored databases without overwriting Admin-edited records.
  const repositoryProjects = [
    {
      title: "Car Parts Inventory Ledger",
      description: "Operations workspace for auto-parts shops spanning POS, inventory, purchasing, ledgers, daily closing, reporting, and print-ready invoices.",
      techStack: ["React 19", "TypeScript", "Vite", "Tailwind CSS 4", "shadcn/ui", "Recharts", "Express 4", "tRPC 11", "Drizzle ORM", "MySQL/TiDB", "Vitest", "Docker"],
      githubUrl: "https://github.com/Nazmussakib247/car-parts-inventory-ledger",
      orderIndex: 8,
      isFeatured: true,
    },
    {
      title: "StudioCraft Architecture",
      description: "Full-stack architecture and interior design portfolio platform with image-led public pages, editable PostgreSQL content, protected admin CRUD, and inquiry management.",
      techStack: ["React 18", "TypeScript", "Vite", "Tailwind CSS", "Radix UI", "Lucide React", "React Router", "Express", "PostgreSQL", "pg", "Node.js crypto", "Docker Compose", "Vitest"],
      githubUrl: "https://github.com/Nazmussakib247/studiocraft-architecture",
      orderIndex: 9,
      isFeatured: true,
    },
    {
      title: "Nexus Ecommerce",
      description: "Full-stack ecommerce storefront with product discovery, cart and wishlist flows, checkout, orders, reviews, coupons, and protected admin operations.",
      techStack: ["React 18", "TypeScript", "Vite", "Tailwind CSS", "Radix UI", "Express", "PostgreSQL", "pg", "React Query", "React Router", "bcryptjs", "JWT", "Docker Compose", "Vitest"],
      githubUrl: "https://github.com/Nazmussakib247/nexus-ecommerce",
      orderIndex: 10,
      isFeatured: true,
    },
  ] as const;
  for (const project of repositoryProjects) {
    const existing = await db.select({ id: projects.id }).from(projects).where(eq(projects.title, project.title)).limit(1);
    if (existing.length === 0) {
      await db.insert(projects).values({ ...project, techStack: [...project.techStack] });
    }
  }

  // Seed flagship case studies only when the project has not been configured yet.
  // Values are limited to facts supported by the existing project records and brief; no metrics are invented.
  const hirelayCaseStudy = {
    slug: "hirelay-ai-recruitment-platform",
    caseStudyEnabled: true,
    caseStudySummary: "A practical AI recruitment platform for moving from resumes and job posts to candidate matching, scheduling, and recruitment workflow support.",
    problemStatement: "Recruitment teams need a way to turn unstructured CVs and job requirements into an understandable shortlist without losing the surrounding workflow.",
    roleDescription: "During industrial training at Appstick, Nazmus contributed to the end-to-end Hirelay field-work project across the React interface, Python/FastAPI services, NLP and AI-matching workflow, automation, security, and Docker-oriented delivery described in the portfolio record.",
    architectureSummary: "Resume and job inputs → parsing and NLP features → AI matching and ranking → candidate workspace and scheduling workflow → recruitment analytics.",
    outcomeSummary: "A documented end-to-end recruiting platform concept covering CV parsing, candidate matching, interview scheduling, job posting, analytics, validation, rate limiting, and security-aware workflow design.",
    lessonsLearned: "Recruitment AI is most useful when model output is connected to reviewable workflow steps, clear validation, and an interface that helps people inspect the result.",
    caseStudyOrder: 0,
    caseStudyArchitecture: [
      { id: "input", label: "CVs + job posts", detail: "Recruitment inputs", orderIndex: 0 },
      { id: "processing", label: "Parsing + NLP", detail: "Structured candidate signals", orderIndex: 1 },
      { id: "matching", label: "AI matching", detail: "Candidate ranking", orderIndex: 2 },
      { id: "workflow", label: "Recruitment workflow", detail: "Scheduling and review", orderIndex: 3 },
      { id: "value", label: "Recruitment insight", detail: "Analytics and decisions", orderIndex: 4 },
    ],
    caseStudyDecisions: [
      { title: "Workflow-first AI", decision: "Connect matching to candidate review and scheduling rather than presenting an isolated score.", tradeoff: "More product surface to design, but the output is easier to act on and inspect.", orderIndex: 0 },
      { title: "API-backed processing", decision: "Use Python/FastAPI services for the AI and workflow backend.", tradeoff: "Requires a service boundary, but keeps model and application concerns easier to evolve.", orderIndex: 1 },
      { title: "Security-aware delivery", decision: "Include authentication, roles, validation, rate limiting, and Docker in the delivery context where supported by the project record.", tradeoff: "Adds implementation discipline instead of optimizing only for a demo path.", orderIndex: 2 },
    ],
    caseStudyMetrics: [],
    caseStudyMedia: [
      { url: "/images/projects/github/hirelay/login.png", altText: "Hirelay login screen", caption: "Authentication entry point for the recruiting workflow.", kind: "workflow", orderIndex: 0 },
      { url: "/images/projects/github/hirelay/ai-match.png", altText: "Hirelay AI matching screen", caption: "Candidate matching workflow evidence from the existing project gallery.", kind: "workflow", orderIndex: 1 },
      { url: "/images/projects/github/hirelay/candidates-list.png", altText: "Hirelay candidates list", caption: "Candidate workspace view from the existing project gallery.", kind: "workflow", orderIndex: 2 },
      { url: "/images/projects/github/hirelay/candidate-detail.png", altText: "Hirelay candidate detail", caption: "Candidate detail view for review and decision support.", kind: "workflow", orderIndex: 3 },
    ],
    caseStudyLinks: [{ label: "Repository", url: "https://github.com/Nazmussakib247/hirelay", kind: "repository", orderIndex: 0 }],
    caseStudyStack: ["React", "Python", "FastAPI", "NLP", "AI Matching", "Automation", "Docker"],
  };
  const sentimentScopeCaseStudy = {
    slug: "sentimentscope-bilingual-ai-analysis",
    caseStudyEnabled: true,
    caseStudySummary: "A browser-first English and Bangla sentiment analysis experience that combines explainable analysis, in-browser ML behavior, live visualizations, and optional LLM assistance.",
    problemStatement: "People need sentiment analysis that works across English and Bangla while making the reasoning visible instead of returning an opaque label alone.",
    roleDescription: "Nazmus designed and implemented the browser-first product experience, bilingual text flow, explainable rules and model interaction, live visualization surface, and optional LLM chat path represented by the existing portfolio record.",
    architectureSummary: "English/Bangla text → local preprocessing and inference → sentiment + explanation → live visualization → optional LLM-assisted conversation.",
    outcomeSummary: "A browser-first analysis product concept that demonstrates bilingual handling, explainability, local ML behavior, visualization, and an optional remote assistance path without claiming an unverified accuracy figure.",
    lessonsLearned: "Local inference can improve privacy and responsiveness, while optional remote assistance should remain clearly separated so users understand when text leaves the browser.",
    caseStudyOrder: 1,
    caseStudyArchitecture: [
      { id: "text", label: "English + Bangla text", detail: "User-provided input", orderIndex: 0 },
      { id: "local", label: "Browser analysis", detail: "Rules and ML behavior", orderIndex: 1 },
      { id: "explain", label: "Prediction + explanation", detail: "Readable sentiment output", orderIndex: 2 },
      { id: "visual", label: "Live visualization", detail: "Interactive analysis view", orderIndex: 3 },
      { id: "assist", label: "Optional LLM chat", detail: "Remote assistance when chosen", orderIndex: 4 },
    ],
    caseStudyDecisions: [
      { title: "Browser-first inference", decision: "Keep the primary analysis path in the browser.", tradeoff: "Constrains model/runtime choices, but improves privacy and reduces round-trip latency for the core experience.", orderIndex: 0 },
      { title: "Explainability by default", decision: "Show rules or reasoning signals alongside sentiment output.", tradeoff: "Adds interface complexity, but gives users a way to understand the result.", orderIndex: 1 },
      { title: "Optional remote assistance", decision: "Treat LLM chat as an opt-in support layer rather than the only inference path.", tradeoff: "Creates a second path to communicate, but keeps local analysis useful when remote access is unavailable.", orderIndex: 2 },
    ],
    caseStudyMetrics: [],
    caseStudyMedia: [],
    caseStudyLinks: [{ label: "Repository", url: "https://github.com/nazmussakib/sentiment-analysis", kind: "repository", orderIndex: 0 }],
    caseStudyStack: ["React", "TypeScript", "Machine Learning", "LLM", "Browser Inference", "Visualization"],
  };
  const swadeshiCaseStudy = {
  "slug": "swadeshi-digital-craft-storefront",
  "caseStudyEnabled": true,
  "caseStudySummary": "An evidence-led digital craft storefront for Bangladeshi textiles that connects product discovery with provenance, cultural context, saved collections, and a secure order workflow.",
  "problemStatement": "Generic storefronts often ask visitors to trust vague authenticity claims while hiding the material, technique, region, and cultural context behind a craft. Swadeshi addresses that gap by making evidence and provenance part of the discovery experience before purchase-oriented actions.",
  "roleDescription": "I designed and implemented the full-stack product experience, connecting the editorial React interface to an Express REST API and SQLite data layer. My work covered catalog and provenance presentation, authentication, saved collections, cart and order flows, responsive UI, validation, error handling, and backend hardening including rate limits, CORS controls, body-size limits, and sanitized responses.",
  "architectureSummary": "Editorial React/Vite frontend → Express REST API with authentication and validation middleware → SQLite persistence for crafts, users, collections, and orders → resilient catalog, account, cart, and order experiences. The client communicates with the backend over HTTP and never touches the database directly.",
  "outcomeSummary": "Delivered a complete, evidence-led storefront concept with database-backed catalog records, source-linked craft context, accounts, saved collections, cart and order persistence, responsive interaction design, and a hardened API. The project demonstrates product thinking beyond a static catalog while remaining explicit that payments are not processed.",
  "lessonsLearned": "For trust-sensitive products, context is part of the feature: provenance, source links, image credits, and clear record status can matter as much as the catalog itself. I also learned to keep the purchase workflow honest by separating a working order record from payment processing that the project does not claim to implement.",
  "caseStudyOrder": 0,
  "caseStudyArchitecture": [
    {
      "id": "craft-records-sources",
      "label": "Craft records + sources",
      "detail": "Provenance, region, material, technique, and labelled imagery",
      "orderIndex": 0
    },
    {
      "id": "react-storefront",
      "label": "React storefront",
      "detail": "Editorial discovery, filtering, detail pages, and responsive interaction",
      "orderIndex": 1
    },
    {
      "id": "express-rest-api",
      "label": "Express REST API",
      "detail": "Catalog, authentication, collections, and order endpoints",
      "orderIndex": 2
    },
    {
      "id": "sqlite-database",
      "label": "SQLite database",
      "detail": "Persistent craft records, accounts, saved collections, and orders",
      "orderIndex": 3
    },
    {
      "id": "order-workflow",
      "label": "Order workflow",
      "detail": "Server-recomputed totals with a clear no-payment boundary",
      "orderIndex": 4
    }
  ],
  "caseStudyDecisions": [],
  "caseStudyMetrics": [],
  "caseStudyMedia": [
    {
      "url": "/images/projects/github/swadeshi/home-hero.png",
      "kind": "overview",
      "altText": "Editorial homepage that introduces provenance before purchase-oriented actions",
      "caption": "Evidence-led craft storefront entry point",
      "orderIndex": 0
    },
    {
      "url": "/images/projects/github/swadeshi/product-detail.png",
      "kind": "analysis",
      "altText": "Region, material, technique, source link, and image credit in one record view",
      "caption": "Craft record detail",
      "orderIndex": 1
    },
    {
      "url": "/images/projects/github/swadeshi/cart-drawer.png",
      "kind": "workflow",
      "altText": "Persisted cart interaction supporting the order journey",
      "caption": "Cart workflow",
      "orderIndex": 2
    },
    {
      "url": "/images/projects/github/swadeshi/artisan-profile.png",
      "kind": "workflow",
      "altText": "Artisan and craft-community context within the product experience",
      "caption": "Maker context",
      "orderIndex": 3
    }
  ],
  "caseStudyLinks": [
    {
      "url": "https://github.com/Nazmussakib247/swadeshi",
      "kind": "repository",
      "label": "Repository",
      "orderIndex": 0
    }
  ],
  "caseStudyStack": [
    "React",
    "TypeScript",
    "Vite",
    "Tailwind CSS",
    "Express",
    "SQLite",
    "REST API",
    "JWT",
    "bcrypt",
    "Zod",
    "Docker"
  ]
};
  const enterpriseNexusCaseStudy = {
  "slug": "enterprise-nexus-multi-agent-ai-os",
  "caseStudyEnabled": true,
  "caseStudySummary": "A multi-agent business automation OS that brings HR, finance, support, analytics, and executive decision support into one role-based workspace with retrieval, orchestration, and security intelligence.",
  "problemStatement": "Growing organizations often manage HR, finance, support, and operational signals in disconnected tools. That fragmentation makes cross-domain decisions slow and makes it difficult to retrieve trusted internal context, surface anomalies, and give leaders a coherent view without exposing uncontrolled AI output.",
  "roleDescription": "As Team Leader and AI Integration Lead, I owned system architecture, Gemini integration, LangChain and multi-agent coordination, n8n workflow automation, the HR and Finance agent work, and the Security Intelligence module. I also led documentation, deployment coordination, and the engineering decisions that connected specialist agents to a unified dashboard. Frontend, backend, and other agent surfaces were delivered collaboratively by the team, so this case study separates my ownership from shared project output.",
  "architectureSummary": "Role-based dashboard → Express API and agent service boundary → Executive orchestrator delegates to HR, Finance, Support, and Analytics specialists → Gemini native JSON responses validated by schemas → Supabase pgvector retrieves domain context through match_documents → persisted results, realtime updates, and executive briefings. Security intelligence, RBAC, rate limiting, and graceful AI degradation sit across the workflow.",
  "outcomeSummary": "Delivered a documented end-to-end AI platform concept that connects specialist agents, retrieval, workflow automation, realtime dashboard updates, and security intelligence. The implementation demonstrates how AI output can be structured, validated, persisted, and degraded safely when a model is unavailable rather than fabricating a response.",
  "lessonsLearned": "Multi-agent systems are an orchestration problem as much as a prompting problem. Clear agent boundaries, schema-validated JSON, scoped retrieval, retries, timeouts, and explicit degraded states make a system easier to reason about and safer to present to users. Team leadership also means documenting ownership boundaries so collaboration is visible rather than overstated.",
  "caseStudyOrder": 0,
  "caseStudyArchitecture": [
    {
      "id": "business-inputs",
      "label": "Business inputs",
      "detail": "HR, finance, support, and operational records",
      "orderIndex": 0
    },
    {
      "id": "domain-agents",
      "label": "Domain agents",
      "detail": "HR, Finance, Support, and Analytics specialists",
      "orderIndex": 1
    },
    {
      "id": "executive-orchestrator",
      "label": "Executive orchestrator",
      "detail": "Delegates work and synthesizes cross-domain briefings",
      "orderIndex": 2
    },
    {
      "id": "rag-context",
      "label": "RAG context",
      "detail": "Gemini embeddings plus Supabase pgvector retrieval through match_documents",
      "orderIndex": 3
    },
    {
      "id": "validated-output",
      "label": "Validated output",
      "detail": "Native JSON schemas, backend persistence, realtime dashboard updates, and graceful degradation",
      "orderIndex": 4
    }
  ],
  "caseStudyDecisions": [
    {
      "title": "Scoped agent responsibilities",
      "decision": "Keep HR, Finance, Support, and Analytics agents domain-focused, with Executive coordinating rather than duplicating them",
      "tradeoff": "Requires orchestration design, but makes behavior easier to reason about",
      "orderIndex": 0
    },
    {
      "title": "Schema-first AI output",
      "decision": "Use Gemini native JSON mode and validate results before persistence or display",
      "tradeoff": "Adds validation work, but reduces malformed and ambiguous downstream states",
      "orderIndex": 1
    },
    {
      "title": "Grounded retrieval",
      "decision": "Store embeddings in Supabase pgvector and retrieve relevant context through match_documents",
      "tradeoff": "Requires an embedding and retrieval path, but improves domain grounding",
      "orderIndex": 2
    },
    {
      "title": "Graceful degradation",
      "decision": "Use timeouts, retries, explicit ai_status values, and retryable failures when AI is unavailable",
      "tradeoff": "Adds operational states, but avoids fabricating output and preserves user trust",
      "orderIndex": 3
    }
  ],
  "caseStudyMetrics": [],
  "caseStudyMedia": [
    {
      "url": "/images/projects/github/enterprise-nexus/dashboard-overview.png",
      "kind": "overview",
      "altText": "Cross-domain workspace for business operations and agent activity",
      "caption": "Unified role-based dashboard",
      "orderIndex": 0
    },
    {
      "url": "/images/projects/github/enterprise-nexus/hr-candidate-detail.png",
      "kind": "workflow",
      "altText": "Candidate detail and HR decision-support surface",
      "caption": "HR agent workflow",
      "orderIndex": 1
    },
    {
      "url": "/images/projects/github/enterprise-nexus/finance-analytics.png",
      "kind": "analysis",
      "altText": "Finance-agent analytics and anomaly-oriented insight surface",
      "caption": "Finance analytics",
      "orderIndex": 2
    },
    {
      "url": "/images/projects/github/enterprise-nexus/executive-briefing.png",
      "kind": "architecture",
      "altText": "Cross-domain synthesis for leadership review",
      "caption": "Executive briefing",
      "orderIndex": 3
    }
  ],
  "caseStudyLinks": [
    {
      "url": "https://github.com/Nazmussakib247/CSE4204-8B-T04-Enterprise-Nexus-Multi-Agent-AI-Business-Automation-OS-with-Security-Intelligence",
      "kind": "repository",
      "label": "Repository",
      "orderIndex": 0
    }
  ],
  "caseStudyStack": [
    "React",
    "Next.js",
    "Node.js",
    "Express",
    "Google Gemini",
    "LangChain.js",
    "CrewAI",
    "Supabase",
    "pgvector",
    "n8n",
    "PostgreSQL",
    "Docker",
    "JWT",
    "bcrypt"
  ]
};
  const neighbourCaseStudy = {
  "slug": "neighbour-local-services-marketplace",
  "caseStudyEnabled": true,
  "caseStudySummary": "A full-stack local-services marketplace that helps clients discover trusted professionals, compare service information, book appointments, communicate, and manage the service lifecycle in one workflow.",
  "problemStatement": "Finding a reliable local professional is often fragmented across informal recommendations, incomplete service information, and untracked conversations. The product needed a clearer trust and coordination layer from discovery through booking, messaging, reviews, and service management.",
  "roleDescription": "I designed and implemented the full-stack marketplace flow, connecting the responsive TypeScript frontend to the backend APIs and persistence layer. My work covered service discovery, professional profiles, booking state, client and provider workflows, messaging, reviews, authentication boundaries, and the operational states needed to keep the experience understandable.",
  "architectureSummary": "Client discovery UI → service and professional profiles → booking state machine → provider workflow for availability and status → authenticated messaging and reviews → persisted marketplace records and notifications. The design keeps client and provider responsibilities explicit while allowing the service lifecycle to be tracked end to end.",
  "outcomeSummary": "Delivered a complete marketplace concept with distinct client and provider journeys, persisted booking states, professional profiles, messaging, reviews, and service-management workflows. The project demonstrates product-level thinking across trust, coordination, and lifecycle state rather than stopping at a listing page.",
  "lessonsLearned": "Marketplace UX depends on explicit states and trust signals: who can act, what is pending, what has been accepted, and how both sides recover from ambiguity. Designing the client and provider journeys together also exposed edge cases that a single-user listing flow would hide.",
  "caseStudyOrder": 0,
  "caseStudyArchitecture": [
    {
      "id": "client-discovery",
      "label": "Client discovery",
      "detail": "Browse services and trusted professional profiles",
      "orderIndex": 0
    },
    {
      "id": "booking-workflow",
      "label": "Booking workflow",
      "detail": "Availability, request, acceptance, status, and double-booking-safe transaction state",
      "orderIndex": 1
    },
    {
      "id": "provider-workspace",
      "label": "Provider workspace",
      "detail": "Manage services, availability, client requests, and lifecycle status",
      "orderIndex": 2
    },
    {
      "id": "communication-layer",
      "label": "Communication layer",
      "detail": "Authenticated messaging, notifications, and reviews",
      "orderIndex": 3
    },
    {
      "id": "persistence-and-analytics",
      "label": "Persistence and analytics",
      "detail": "MySQL records, operational history, and CSV reporting",
      "orderIndex": 4
    }
  ],
  "caseStudyDecisions": [],
  "caseStudyMetrics": [],
  "caseStudyMedia": [],
  "caseStudyLinks": [],
  "caseStudyStack": [
    "React 19",
    "TypeScript",
    "Vite",
    "Tailwind CSS",
    "PHP 8.2",
    "REST API",
    "MySQL 8",
    "Docker",
    "PDO",
    "RBAC",
    "Bookings",
    "Notifications"
  ]
};
  const spamGuardCaseStudy = {
  "slug": "spamguard-ai-spam-detection-dashboard",
  "caseStudyEnabled": true,
  "caseStudySummary": "A browser-first spam-detection dashboard that makes text classification inspectable through transparent heuristics, suspicious-word highlighting, English and Bangla support, batch analysis, local history, trend views, and an optional FastAPI/scikit-learn backend.",
  "problemStatement": "Many spam filters hide the reason behind a label, making borderline messages difficult to review and tune. The project needed a fast, browser-first workflow that surfaces suspicious terms, supports English and Bangla text, handles batches, and remains useful offline while being honest that heuristic detection is not a production-trained classifier.",
  "roleDescription": "I designed and implemented the browser-first analysis workflow, including the transparent heuristic engine, suspicious-word highlighting, English and Bangla handling, batch input, local history, trends, CSV import/export, and the optional FastAPI/scikit-learn boundary. I kept the UI useful offline and documented the difference between an inspectable heuristic tool and a production-trained classifier.",
  "architectureSummary": "Text input → transparent heuristic rules and suspicious-word highlighting → English/Bangla classification view → local history and trend summaries → CSV batch import/export. Optional FastAPI and scikit-learn backend extends the workflow for model-backed experiments, while the browser path remains usable offline.",
  "outcomeSummary": "Delivered a practical, explainable classification dashboard with bilingual support, suspicious-term highlighting, batch analysis, local history, trends, and CSV workflow support. The project is intentionally transparent about its boundary: it is a browser-first heuristic tool and not evidence of a production-trained model accuracy claim.",
  "lessonsLearned": "Explainability is a product feature when users must review borderline text. Highlighting the evidence behind a label makes heuristics easier to inspect, while the explicit limitation statement prevents a prototype from being mistaken for a validated production classifier. Future improvements should begin with a labelled evaluation set, authentication, and shared persistence.",
  "caseStudyOrder": 0,
  "caseStudyArchitecture": [],
  "caseStudyDecisions": [],
  "caseStudyMetrics": [],
  "caseStudyMedia": [],
  "caseStudyLinks": [],
  "caseStudyStack": [
    "React",
    "TypeScript",
    "Vite",
    "Tailwind CSS",
    "FastAPI",
    "Python",
    "scikit-learn",
    "Pandas",
    "CSV",
    "Local Storage",
    "Offline-first"
  ]
};
  const arduinoRadarCaseStudy = {
  "slug": "arduino-based-military-radar-system",
  "caseStudyEnabled": true,
  "caseStudySummary": "An embedded sensing and visualization project that turns an Arduino, ultrasonic sensor, and servo sweep into a radar-style monitoring interface. It demonstrates practical computer-architecture work across physical input, serial communication, angle-distance mapping, and a live Processing visualization.",
  "problemStatement": "Raw ultrasonic readings alone are difficult to interpret when the sensor is moving through different angles. The project needed a low-cost way to coordinate servo position, distance measurement, serial output, and a visual sweep so detected objects could be understood in relation to both angle and distance.",
  "roleDescription": "I assembled the sensing workflow around the Arduino, ultrasonic sensor, and servo motor, then connected the angle-distance readings to a serial visualization pipeline. My contribution covered the embedded C++ logic, sweep coordination, detection mapping, and Processing-side radar-style rendering used to make the physical behavior inspectable.",
  "architectureSummary": "Ultrasonic sensor → Arduino distance sampling → servo-controlled 180-degree sweep → angle-distance serial stream → Processing visualization. The system maps measured distance to the current sweep angle, renders a green scan field, and marks detected objects for real-time inspection.",
  "outcomeSummary": "Delivered a working radar-style prototype that connects physical sensing to an interpretable visual interface. The project demonstrates end-to-end embedded reasoning from sensor input and servo control through serial data handling and real-time object visualization, while remaining appropriately scoped as an academic hardware prototype.",
  "lessonsLearned": "Embedded projects make timing and calibration first-class design concerns. A clear serial contract between the Arduino and visualization layer simplifies debugging, while separating sensor behavior from rendering makes the prototype easier to reason about and extend.",
  "caseStudyOrder": 0,
  "caseStudyArchitecture": [],
  "caseStudyDecisions": [],
  "caseStudyMetrics": [],
  "caseStudyMedia": [],
  "caseStudyLinks": [],
  "caseStudyStack": [
    "Arduino",
    "C++",
    "Ultrasonic Sensor",
    "Servo Motor",
    "Serial Communication",
    "Processing",
    "Computer Architecture"
  ]
};
  for (const [title, data] of [
    ["Hirelay — AI Recruitment Platform", hirelayCaseStudy],
    ["SentimentScope — Bilingual AI Analysis", sentimentScopeCaseStudy],
    ["Swadeshi — Digital Craft Storefront", swadeshiCaseStudy],
    ["Enterprise Nexus — Multi-Agent AI OS", enterpriseNexusCaseStudy],
    ["Neighbour — Local Services Marketplace", neighbourCaseStudy],
    ["SpamGuard AI — Spam Detection Dashboard", spamGuardCaseStudy],
    ["Arduino-Based Military Radar System", arduinoRadarCaseStudy],
  ] as const) {
    await db.update(projects).set(data as unknown as typeof projects.$inferInsert).where(and(eq(projects.title, title), isNull(projects.slug)));
  }

  // Seed verified LinkedIn certifications
  const existingCerts = await db.select().from(certificates).limit(1);
  if (existingCerts.length === 0) {
    const linkedinCertUrl = "https://www.linkedin.com/in/nazmussakib247/details/certifications/";
    await db.insert(certificates).values([
      { title: "React 1-Month Industrial Training Program", issuer: "Appstick", category: "Frontend & Software Development", orderIndex: 0, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-05.png", skillsGained: ["React.js", "JavaScript", "Frontend Development"], description: "One-month React industrial training program completed at Appstick.", issueDate: "2026-03-01" },
      { title: "AI for Brainstorming and Planning", issuer: "Google", category: "Artificial Intelligence", orderIndex: 1, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-07.png", skillsGained: ["Artificial Intelligence", "AI-assisted Planning"], description: "Google credential in AI-assisted brainstorming and planning.", issueDate: "2026-06-01" },
      { title: "AI Fundamentals", issuer: "Google", category: "Artificial Intelligence", orderIndex: 2, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-01.png", skillsGained: ["Artificial Intelligence"], description: "Google fundamentals credential covering core AI concepts.", issueDate: "2026-06-01" },
      { title: "Vibe Coding Fundamentals", issuer: "University of Colorado", category: "Frontend & Software Development", orderIndex: 3, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-09.png", skillsGained: ["AI-assisted Development", "Software Development"], description: "Foundational credential in AI-assisted software development.", issueDate: "2026-05-01" },
      { title: "Version Control with Git", issuer: "Atlassian", category: "Developer Tools", orderIndex: 4, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-10.png", skillsGained: ["Git", "Version Control"], description: "Atlassian credential in Git-based version control workflows.", issueDate: "2026-05-01" },
      { title: "Version Control", issuer: "Meta", category: "Developer Tools", orderIndex: 5, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-02.png", skillsGained: ["Version Control", "Collaboration"], description: "Meta credential in version control and collaborative development.", issueDate: "2026-05-01" },
      { title: "Claude 101", issuer: "Anthropic", category: "Generative AI", orderIndex: 6, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-08.png", skillsGained: ["Generative AI", "Prompting"], description: "Anthropic introductory credential for Claude and generative AI workflows.", issueDate: "2026-05-01" },
      { title: "Foundations of Data Science", issuer: "Google", category: "Data Science", orderIndex: 7, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-03.png", skillsGained: ["Data Science", "Analytics"], description: "Google foundation credential in data science concepts and practice.", issueDate: "2026-05-01" },
      { title: "Think Again I: How to Understand Arguments", issuer: "Duke University", category: "Critical Thinking", orderIndex: 8, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-04.png", skillsGained: ["Critical Thinking", "Reasoning"], description: "Duke University credential focused on understanding and evaluating arguments.", issueDate: "2026-05-01" },
      { title: "Introduction to Networking", issuer: "NVIDIA", category: "Networking", orderIndex: 9, credentialUrl: linkedinCertUrl, thumbnailUrl: "/images/certificates/linkedin-cert-06.png", skillsGained: ["Networking Fundamentals", "TCP/IP"], description: "NVIDIA credential covering networking fundamentals and TCP/IP concepts.", issueDate: "2026-05-01" },
    ]);
    console.log("Certificates seeded");
  }

  // Seed verified LinkedIn experience timeline
  const existingExp = await db.select().from(experiences).limit(1);
  if (existingExp.length === 0) {
    await db.insert(experiences).values([
      {
        type: "internship",
        title: "ML Engineering Internship",
        organization: "FlyRank AI",
        location: "Chicago, Illinois, United States · Remote",
        startDate: "Jul 2026",
        endDate: "Present",
        description: "Currently interning at FlyRank AI as an AI intern, focusing on Machine Learning.",
        orderIndex: 0,
      },
      {
        type: "work",
        title: "Founder & Web Developer",
        organization: "NS Universe",
        location: "Khulna, Bangladesh",
        startDate: "Jan 2022",
        endDate: "Present",
        description: "Founded a small web services initiative building WordPress websites and custom tools for local clients. Handled requirements through deployment and shipped software for real users.",
        orderIndex: 1,
      },
      {
        type: "education",
        title: "Bachelor of Science in Computer Science & Engineering",
        organization: "Northern University of Business & Technology Khulna",
        location: "Khulna, Bangladesh",
        startDate: "2022",
        endDate: "Present",
        description: "Final-year CSE student building a practical foundation across software engineering, machine learning, databases, computer architecture, and applied AI.",
        orderIndex: 2,
      },
      {
        type: "internship",
        title: "CSE 4100 Field Work / Industrial Training",
        organization: "Appstick",
        location: "Khulna, Bangladesh",
        startDate: "Industrial Training",
        endDate: "",
        description: "Completed the CSE 4100 field-work project Hirelay during industrial training at Appstick, applying React, Python/FastAPI, PostgreSQL, NLP, AI matching, workflow automation, security, and Docker in an end-to-end recruiting platform.",
        orderIndex: 3,
      },
      {
        type: "work",
        title: "Alor Dishari",
        organization: "Alor Dishari",
        location: "Bangladesh",
        startDate: "Featured segment",
        endDate: "",
        description: "A featured journey segment preserved from Nazmus Sakib’s portfolio context. The original source details can be expanded when the corresponding post or organization link is provided.",
        orderIndex: 4,
      },
      {
        type: "work",
        title: "Reporter",
        organization: "The Daily Janakantha (Official)",
        location: "Dumuria Upazila, Khulna, Bangladesh · Remote",
        startDate: "Jan 2019",
        endDate: "Jan 2020",
        description: "Worked as an upazila correspondent covering local news including environmental issues and COVID-19. Several reports gained national attention.",
        orderIndex: 5,
      },
    ]);
    console.log("Experiences seeded");
  }

  // Seed verified recognition records
  const existingAwards = await db.select().from(awards).limit(1);
  if (existingAwards.length === 0) {
    await db.insert(awards).values([
      {
        title: "SOLVIO AI Hackathon 2025 — Phase 2 Qualifier",
        description: "Selected with Team Day_Dreamers for Phase 2: Prototyping Challenge of the SOLVIO AI Hackathon 2025, advancing among innovative teams from more than 60 universities.",
        eyebrow: "Phase 2 · Prototyping Challenge",
        image: "/images/awards/solvio-certificate.png",
        imageAlt: "SOLVIO AI Hackathon 2025 certificate of participation for Round 2 qualifier",
        sourceUrl: "https://www.linkedin.com/posts/nazmussakib247_solvioaihackathon2025-ai-innovation-activity-7392017895578398720-ogTt",
        sourceLabel: "View Solvio LinkedIn post",
        iconName: "trophy",
        orderIndex: 0,
      },
      {
        title: "Jully Ummesh Lipi Competition — First Prize",
        description: "Received the first-prize crest and prize money for the July Ummesh Lipi competition from the Pro-Vice Chancellor of Northern University of Business & Technology Khulna.",
        eyebrow: "First Prize · Crest and prize money",
        image: "/images/awards/jully-ummesh-lipi.jpg",
        imageAlt: "First-prize crest from the Jully Ummesh Lipi competition",
        sourceUrl: "https://www.linkedin.com/posts/nazmussakib247_honored-to-receive-a-crest-and-prize-money-activity-7362156380293681152-mA_6",
        sourceLabel: "View recognition post",
        iconName: "star",
        orderIndex: 1,
      },
      {
        title: "2nd Media Olympiad 2025 — 4th Place",
        description: "Placed 4th at the 2nd Media Olympiad 2025, organized by the Department of Journalism & Mass Communication at NUBTK, gaining interdisciplinary experience in media, communication, and critical thinking.",
        eyebrow: "4th Place · NUBTK",
        image: "/images/awards/media-olympiad.jpg",
        imageAlt: "Recognition photo from the 2nd Media Olympiad 2025",
        sourceUrl: "https://www.linkedin.com/posts/nazmussakib247_achievement-mediaolympiad-interdisciplinarylearning-activity-7412406336262615040-PvX3",
        sourceLabel: "View Media Olympiad post",
        iconName: "medal",
        orderIndex: 2,
      },
    ]);
    console.log("Awards seeded");
  } else {
    const awardBackfill = [
      {
        title: "SOLVIO AI Hackathon 2025 — Phase 2 Qualifier",
        eyebrow: "Phase 2 · Prototyping Challenge",
        image: "/images/awards/solvio-certificate.png",
        imageAlt: "SOLVIO AI Hackathon 2025 certificate of participation for Round 2 qualifier",
        sourceUrl: "https://www.linkedin.com/posts/nazmussakib247_solvioaihackathon2025-ai-innovation-activity-7392017895578398720-ogTt",
        sourceLabel: "View Solvio LinkedIn post",
      },
      {
        title: "Jully Ummesh Lipi Competition — First Prize",
        eyebrow: "First Prize · Crest and prize money",
        image: "/images/awards/jully-ummesh-lipi.jpg",
        imageAlt: "First-prize crest from the Jully Ummesh Lipi competition",
        sourceUrl: "https://www.linkedin.com/posts/nazmussakib247_honored-to-receive-a-crest-and-prize-money-activity-7362156380293681152-mA_6",
        sourceLabel: "View recognition post",
      },
      {
        title: "2nd Media Olympiad 2025 — 4th Place",
        eyebrow: "4th Place · NUBTK",
        image: "/images/awards/media-olympiad.jpg",
        imageAlt: "Recognition photo from the 2nd Media Olympiad 2025",
        sourceUrl: "https://www.linkedin.com/posts/nazmussakib247_achievement-mediaolympiad-interdisciplinarylearning-activity-7412406336262615040-PvX3",
        sourceLabel: "View Media Olympiad post",
      },
    ];
    for (const award of awardBackfill) {
      await db.update(awards).set(award).where(eq(awards.title, award.title));
    }
    console.log("Awards metadata backfilled");
  }

  // Seed and backfill verified Medium writings. Existing records are updated
  // by title or canonical URL so rerunning the seed remains idempotent.
  const mediumWritings = [
    {
      title: "I Built Hirelay — an Automated Recruitment System that turns a CV flood into the right hire",
      excerpt: "How I automated the entire hiring pipeline with AI CV parsing, transparent matching, one-click interviews, and honestly-measured accuracy.",
      category: "AI Products",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/i-built-hirelay-an-automated-recruitment-system-that-turns-a-cv-flood-into-the-right-hire-ad94b22f3cd3",
      platform: "medium" as const,
      isPublished: true,
    },
    {
      title: "Building Swadeshi: A Full-Stack Craft Storefront with React, Express and SQLite",
      excerpt: "How I designed and built an editorial storefront for handwoven Bangladeshi textiles—from the React frontend to a hardened API and local-first data layer.",
      category: "Full Stack",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/building-swadeshi-a-full-stack-craft-storefront-with-react-express-and-sqlite-9bde728f1205",
      platform: "medium" as const,
      isPublished: true,
    },
    {
      title: "I Built SentimentScope: A Bilingual (English + Bangla) Sentiment Analysis Platform That Runs in the Browser",
      excerpt: "A full sentiment-analysis dashboard with a rule-based engine, real in-browser ML training, visualizations, and optional LLM chat.",
      category: "Machine Learning",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/i-built-sentimentscope-a-bilingual-english-bangla-sentiment-analysis-platform-that-runs-a93fb9996a68",
      platform: "medium" as const,
      isPublished: true,
    },
    {
      title: "Week 2 Deep Dive: Strategic Model Selection — The Architecture of Decision Making",
      excerpt: "Why the right AI model is an engineering decision shaped by cost, latency, and performance—not a universal leaderboard winner.",
      category: "AI Engineering",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/week-2-deep-dive-strategic-model-selection-the-architecture-of-decision-making-72fe4117327d",
      platform: "medium" as const,
      isPublished: true,
    },
    {
      title: "Week 1: Mastering the Mechanics of Inference — Why Prompting is Only 10% of the Job",
      excerpt: "A practical look at why AI engineering is more than clever prompts: inference mechanics, latency, reliability, and production behavior matter.",
      category: "AI Engineering",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/week-1-mastering-the-mechanics-of-inference-why-prompting-is-only-10-of-the-job-4c164c288b7d",
      platform: "medium" as const,
      isPublished: true,
    },
    {
      title: "Beyond the Hype: Building a Production-Grade AI Engineering Stack (90-Day Sprint)",
      excerpt: "A public 90-day sprint focused on dismantling the AI black box and understanding the systems behind reliable intelligent products.",
      category: "Building in Public",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/beyond-the-hype-building-a-production-grade-ai-engineering-stack-90-day-sprint-8ccbb2a335b2",
      platform: "medium" as const,
      isPublished: true,
    },
    {
      title: "Week 0: What Even Is an AI Engineer? — My roadmap.sh Journey Begins",
      excerpt: "A roadmap.sh learning reflection covering LLM APIs, prompt engineering, RAG pipelines, evaluation, agent orchestration, and a RAG-based study-assistant goal.",
      category: "AI Engineering",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/week-0-what-even-is-an-ai-engineer-my-roadmap-sh-journey-begins-24d34a9524e8",
      platform: "medium" as const,
      isPublished: true,
    },
    {
      title: "My Field Work Journey Toward Industry-Level Software Development",
      excerpt: "Day 01 of a field-work series: rebuilding a demo portfolio with HTML only, focusing on semantic structure, content hierarchy, and clean markup.",
      category: "Field Work",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/my-field-work-journey-toward-industry-level-software-development-4f6ffb0459b8",
      platform: "medium" as const,
      isPublished: true,
    },
    {
      title: "The Art of Talking to AI: A Quick Dive into Prompt Engineering",
      excerpt: "An introduction to prompt engineering and how intentional instructions shape the capabilities and usefulness of AI systems.",
      category: "AI Engineering",
      externalUrl: "https://medium.com/@nazmussakib.cse.nubt/the-art-of-talking-to-ai-a-quick-dive-into-prompt-engineering-4b0374d45ffa",
      platform: "medium" as const,
      isPublished: true,
    },
  ];

  const existingWritingRows = await db.select().from(writings);
  for (const [index, post] of mediumWritings.entries()) {
    const existing = existingWritingRows.find(
      (row) => row.externalUrl === post.externalUrl ||
        row.title === post.title ||
        (post.title.startsWith("I Built Hirelay") && row.title.startsWith("I Built Hirelay")) ||
        (post.title.startsWith("Building Swadeshi") && row.title.startsWith("Building Swadeshi")) ||
        (post.title.startsWith("I Built SentimentScope") && row.title.startsWith("I Built SentimentScope")) ||
        (post.title.startsWith("Week 2 Deep Dive") && row.title === "Strategic Model Selection")
    );
    if (existing) {
      const { isPublished, ...managedPost } = post;
      void isPublished;
      await db.update(writings).set({ ...managedPost, orderIndex: existing.orderIndex ?? index, updatedAt: new Date() }).where(eq(writings.id, existing.id));
    } else {
      await db.insert(writings).values({ ...post, orderIndex: index });
    }
  }
  console.log("Writings seeded/backfilled");


  // Seed skills
  const existingSkills = await db.select().from(skills).limit(1);
  if (existingSkills.length === 0) {
    await db.insert(skills).values([
      { category: "Machine Learning", iconName: "brain", iconUrl: "/images/skills/python-original.svg", name: "Python", level: 92, orderIndex: 0 },
      { category: "Machine Learning", iconName: "brain", iconUrl: "/images/skills/tensorflow.svg", name: "TensorFlow / scikit-learn", level: 84, orderIndex: 1 },
      { category: "Machine Learning", iconName: "brain", iconUrl: "/images/skills/scikitlearn-original.svg", name: "NLP / spaCy", level: 82, orderIndex: 2 },
      { category: "Frontend", iconName: "code2", iconUrl: "/images/skills/react.svg", name: "React / Next.js", level: 90, orderIndex: 3 },
      { category: "Frontend", iconName: "code2", iconUrl: "/images/skills/typescript.svg", name: "TypeScript", level: 86, orderIndex: 4 },
      { category: "Frontend", iconName: "code2", iconUrl: "/images/skills/tailwindcss.svg", name: "Tailwind CSS", level: 90, orderIndex: 5 },
      { category: "Backend", iconName: "server", iconUrl: "/images/skills/nodedotjs.svg", name: "Node.js / Express", level: 87, orderIndex: 6 },
      { category: "Backend", iconName: "server", iconUrl: "/images/skills/mongodb.svg", name: "MongoDB / PostgreSQL", level: 80, orderIndex: 7 },
      { category: "Automation", iconName: "workflow", iconUrl: "/images/skills/n8n-original.svg", name: "n8n / Zapier / Make", level: 88, orderIndex: 8 },
      { category: "Tools & DevOps", iconName: "wrench", iconUrl: "/images/skills/git-original.svg", name: "Git / Docker / Linux", level: 83, orderIndex: 9 },
      { category: "Embedded Systems", iconName: "cpu", iconUrl: "/images/skills/arduino.svg", name: "Arduino / C++ / IoT", level: 75, orderIndex: 10 },
    ]);
    console.log("Skills seeded");
  }

  const skillLogoBackfill = [
    { match: "python", iconUrl: "/images/skills/python-original.svg" },
    { match: "tensorflow", iconUrl: "/images/skills/tensorflow.svg" },
    { match: "scikit", iconUrl: "/images/skills/scikitlearn-original.svg" },
    { match: "nlp", iconUrl: "/images/skills/scikitlearn-original.svg" },
    { match: "react", iconUrl: "/images/skills/react.svg" },
    { match: "next.js", iconUrl: "/images/skills/react.svg" },
    { match: "typescript", iconUrl: "/images/skills/typescript.svg" },
    { match: "tailwind", iconUrl: "/images/skills/tailwindcss.svg" },
    { match: "node.js", iconUrl: "/images/skills/nodedotjs.svg" },
    { match: "express", iconUrl: "/images/skills/nodedotjs.svg" },
    { match: "mongodb", iconUrl: "/images/skills/mongodb.svg" },
    { match: "postgresql", iconUrl: "/images/skills/mongodb.svg" },
    { match: "n8n", iconUrl: "/images/skills/n8n-original.svg" },
    { match: "git", iconUrl: "/images/skills/git-original.svg" },
    { match: "docker", iconUrl: "/images/skills/docker-original.svg" },
    { match: "linux", iconUrl: "/images/skills/linux.svg" },
    { match: "arduino", iconUrl: "/images/skills/arduino.svg" },
    { match: "c++", iconUrl: "/images/skills/cplusplus-original.svg" },
  ];
  const allSkills = await db.select().from(skills);
  for (const skill of allSkills) {
    if (skill.iconUrl) continue;
    const match = skillLogoBackfill.find((item) => skill.name.toLowerCase().includes(item.match));
    if (match) await db.update(skills).set({ iconUrl: match.iconUrl, updatedAt: new Date() }).where(eq(skills.id, skill.id));
  }
  console.log("Skill logo URLs seeded/backfilled");

  // Seed public bottom activity bar settings without overwriting admin edits.
  const defaultSiteSettings = {
    bottomBarEnabled: "true",
    bottomBarStatusText: "now automating",
    bottomBarMessage: "Bilingual AI engineering · Available for selected freelance and remote engagements · Open to thoughtful collaborations",
    bottomBarHireLabel: "Hire Me",
    bottomBarHireTarget: "contact",
    assistantAvatarUrl: "/images/assistant/xervis-avatar.webp",
    assistantGreetingAudioUrl: "/audio/xervis-greeting.mp3",
    heroPrimaryCta: "View Projects",
    heroPrimaryTarget: "projects",
    heroSecondaryCta: "Get In Touch",
    heroSecondaryTarget: "contact",
    heroCvCta: "View CV",
    heroScrollLabel: "Scroll",
    heroScrollTarget: "about",
    navigationItems: '[{"label":"About","id":"about","section":"about"},{"label":"Projects","id":"projects","section":"projects"},{"label":"Experience","id":"experience","section":"experience"},{"label":"Skills","id":"skills","section":"skills"},{"label":"Awards","id":"awards","section":"awards"},{"label":"Blog","id":"blog","section":"blog"},{"label":"CV","id":"cv"},{"label":"Activity","id":"activity"},{"label":"Contact","id":"contact","section":"contact"}]',
    searchSuggestions: '[{"label":"Explore AI projects","hint":"ML products and systems","id":"projects","icon":"projects"},{"label":"Hirelay recruitment platform","hint":"AI matching and automation","id":"projects","icon":"experience"},{"label":"SentimentScope analysis","hint":"Bilingual sentiment intelligence","id":"projects","icon":"ai"},{"label":"Core AI & ML skills","hint":"Tools and capabilities","id":"skills","icon":"skills"},{"label":"Professional experience","hint":"Journey and current work","id":"experience","icon":"experience"},{"label":"Certifications","hint":"Verified learning milestones","id":"certificates","icon":"certificates"},{"label":"Start a conversation","hint":"Contact Nazmus","id":"contact","icon":"contact"}]',
    sectionCopy: `{"about":{"kicker":"/about","title":"About Me","blurb":"The person behind the code — background, education, and what drives me.","availableLabel":"Available","statProjects":"Projects Built","statCertificates":"Certifications","statExperience":"Work Experiences","statAwards":"Awards Won"},"projects":{"kicker":"/projects","title":"Featured Projects","blurb":"A selection of work spanning machine learning, full-stack development, embedded systems, and automation.","empty":"Projects will appear here once published from the CMS.","details":"View Details","all":"All"},"experience":{"kicker":"/experience","title":"Journey So Far","blurb":"From Northern University to industrial training, AI engineering, entrepreneurship, and interdisciplinary work.","linkedinCta":"View verified experience on LinkedIn","workLabel":"Work","educationLabel":"Education","internshipLabel":"Internship","presentLabel":"Present"},"skills":{"kicker":"/skills","title":"Technical Arsenal","blurb":"Tools and technologies I use to turn ideas into working systems."},"awards":{"kicker":"/recognition","title":"Milestones beyond the code","blurb":"Verified achievements spanning AI innovation, interdisciplinary learning, and academic recognition."},"certificates":{"kicker":"/certificates","title":"Certifications","blurb":"Continuous learning, formally recognized.","empty":"Certificates will appear here once published from the CMS.","verify":"Verify Credential","collection":"Explore the collection"},"blog":{"kicker":"/blog","title":"Writings & Articles","blurb":"Thoughts on machine learning, automation, and building software.","bloggerCta":"Read more on Blogger","bloggerBlurb":"Long-form notes and personal writing from Nazmus Sakib","loading":"Loading published articles…","empty":"No published articles have been added yet.","articleLabel":"Article","readLabel":"Read Article","all":"All"},"cv":{"kicker":"/cv","title":"Curriculum Vitae","blurb":"Preview my CV here first. Download it only when you are ready.","profileLabel":"Professional profile","profileFallback":"Profile","profileBlurb":"ML Engineer and AI product builder working across NLP, LLMs, full-stack systems, and automation. Open the preview to review selected projects, experience, education, and ways to connect.","viewLabel":"View CV","noLink":"CV link will appear here when published","previewBadge":"Preview first · Download inside","focusLabel":"Focus","focusText":"Practical AI products, NLP, LLM workflows, and intelligent automation.","selectedLabel":"Selected work","selectedFallback":"Selected projects will appear here once published.","connectLabel":"Connect","githubLabel":"GitHub","linkedinLabel":"LinkedIn","mediumLabel":"Medium","previewKicker":"In-page preview","previewTitleSuffix":"CV preview","closeLabel":"Close CV preview","noPreview":"CV preview is not published yet.","reviewNote":"Review the CV here, then download a copy if needed.","downloadFileName":"Nazmus-Sakib-CV.pdf","downloadLabel":"Download PDF"},"activity":{"kicker":"/activity","title":"Across The Web","blurb":"Recent public signals from GitHub and Medium, with direct links to connect professionally.","githubLabel":"GitHub","mediumLabel":"Medium","linkedinLabel":"LinkedIn","liveStatus":"Live","profileStatus":"Profile","feedStatus":"Feed","loadingGithub":"Loading activity…","emptyGithub":"No recent public events available. Explore the repositories directly.","openGithub":"Open GitHub","loadingMedium":"Loading writing…","emptyMedium":"Read the latest writing and notes on the Medium profile.","openMedium":"Open Medium","linkedinBlurb":"Connect for professional updates, collaboration, and opportunities in AI engineering, full-stack systems, and automation.","viewProfile":"View profile","footer":"Explore the latest work, writing, and professional updates across Nazmus Sakib’s public platforms.","recentLabel":"recently","minuteSuffix":"m ago","hourSuffix":"h ago","daySuffix":"d ago"},"contact":{"kicker":"/contact","title":"Let's Build Something Together","blurb":"Open to opportunities in machine learning engineering, full-stack development, and automation architecture. Drop a message — I usually reply within a day.","submitLabel":"Send Message","sendingLabel":"Sending…","sentTitle":"Message Sent!","sentBlurb":"Thanks for reaching out — I'll get back to you soon.","anotherLabel":"Send another message","namePlaceholder":"Your name *","emailPlaceholder":"Your email *","subjectPlaceholder":"Subject","messagePlaceholder":"Your message *","channelCta":"Connect with me"}}`,
    xervisIntro: "Hi, I’m Xervis — Nazmus Sakib’s AI Assistant. Ask me about his projects, skills, or experience.",
    xervisStarter: "I can help you explore Nazmus Sakib’s ML projects, AI engineering work, skills, and public writing.",
    xervisSuggestions: '["Tell me about your AI projects","What are your core skills?","Which project uses RAG?","What awards has Nazmus received?","Tell me about the Appstick training","What is SentimentScope?","How did Nazmus build Hirelay?","What kind of AI products does he build?","Show me his certifications","How can I contact Nazmus?"]',
    xervisPlaceholder: "Ask Xervis about a project or skill…",
  };
  const existingSiteSettings = await db.select().from(siteSettings);
  const existingTickerMessage = existingSiteSettings.find((row) => row.key === "bottomBarMessage");
  const legacyTickerMessage = "languages spoken: EN · BN · currently open for freelance & remote work";
  if (existingTickerMessage?.value === legacyTickerMessage) {
    await db.update(siteSettings).set({ value: defaultSiteSettings.bottomBarMessage, updatedAt: new Date() }).where(eq(siteSettings.id, existingTickerMessage.id));
  }
  const existingSectionCopy = existingSiteSettings.find((row) => row.key === "sectionCopy");
  if (existingSectionCopy) {
    let currentSectionCopy: Record<string, Record<string, string>> = {};
    try {
      currentSectionCopy = JSON.parse(existingSectionCopy.value || "{}");
    } catch {
      currentSectionCopy = {};
    }
    const defaultSectionCopy = JSON.parse(defaultSiteSettings.sectionCopy) as Record<string, Record<string, string>>;
    const mergedSectionCopy = Object.fromEntries(
      Object.entries(defaultSectionCopy).map(([section, values]) => [section, { ...values, ...(currentSectionCopy[section] || {}) }])
    );
    const mergedSectionCopyValue = JSON.stringify(mergedSectionCopy);
    if (mergedSectionCopyValue !== existingSectionCopy.value) {
      await db.update(siteSettings).set({ value: mergedSectionCopyValue, updatedAt: new Date() }).where(eq(siteSettings.id, existingSectionCopy.id));
    }
  }
  for (const [key, value] of Object.entries(defaultSiteSettings)) {
    if (!existingSiteSettings.some((row) => row.key === key)) {
      await db.insert(siteSettings).values({ key, value });
    }
  }
  console.log("Bottom activity bar settings seeded");

  console.log("Seed complete!");
}

seed().catch(console.error);
