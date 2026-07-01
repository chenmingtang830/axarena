export const benchmark = {
  name: "DAEB-1",
  title: "Database AX Benchmark V1",
  category: "database",
  status: "Placeholder data",
  publishedAt: "Launch candidate",
  suitePath: "targets/suites/daeb-1.yaml",
  bundlePath: "results/publications/daeb-1/manifest.json",
  harnesses: ["Claude Code", "Codex"],
  surfaces: ["API", "SDK", "CLI", "MCP"],
  summary: {
    vendors: 8,
    tasks: 10,
    adapters: 8,
    cells: 64,
    headline: "One canonical suite. Eight vendor adapters. Live-state verification.",
    note: "Numbers below are placeholder values for design only. Replace with normalized records from the frozen DAEB-1 publication bundle."
  },
  framing: {
    mission:
      "AXArena is trying to measure something narrower and more actionable than product marketing breadth: can an agent actually complete real work against a product's published surfaces and leave the product in a verifiable state?",
    whyNow:
      "Many products now publish APIs, SDKs, CLIs, and MCP servers, but publication is not the same thing as operability. DAEB-1 treats agent usability as a benchmarkable property.",
    publicationStandard:
      "The benchmark is intended to read more like a research release than a marketing site: frozen suite, explicit adapters, public methodology, immutable artifacts, and a corrections log."
  },
  findings: [
    {
      title: "Surface breadth is not the same thing as agent reliability.",
      body:
        "Products with many surfaces can still be hard for agents if key workflows are undocumented, split across consoles, or missing stable read-back paths.",
    },
    {
      title: "Oracle quality determines whether a benchmark is credible.",
      body:
        "DAEB-1 treats read-back verification as the load-bearing layer. Scores should come from live state, not transcript fluency or judge-model impressions.",
    },
    {
      title: "N/A disclosure is part of fairness, not a loophole.",
      body:
        "A canonical suite only works across heterogeneous vendors if structural mismatches are disclosed explicitly and rendered publicly instead of being silently scored as failure or silently excluded.",
    },
  ],
  scorecard: [
    {
      label: "Canonical benchmark definition",
      text: "One suite fixes task identity, difficulty, intent, and scoring notes across all vendors.",
    },
    {
      label: "Vendor-specific adaptation layer",
      text: "Only oracle extraction, auth, base URLs, surface availability, and N/A mapping vary by vendor.",
    },
    {
      label: "Publication artifact model",
      text: "The public release should ship suite, adapters, compiled packs, snapshots, normalized records, and a manifest tying them together.",
    },
  ],
  methodology: {
    principles: [
      "Freeze the benchmark before competitive execution.",
      "Use one canonical suite and many vendor adapters, not one benchmark per vendor.",
      "Verify outcomes from product state whenever possible.",
      "Render N/A policy publicly and consistently.",
      "Treat reruns and corrections as part of the publication record.",
    ],
    limits: [
      "Results can drift as vendors change APIs, auth, docs, and MCP tools.",
      "Harness versions and sandbox setup influence execution behavior.",
      "The suite captures a meaningful slice of database agent work, not the entirety of product quality.",
      "Vendor adapters introduce judgment, so they need review and public disclosure.",
    ],
  },
  reproduce: {
    prerequisites: [
      "A clean checkout of the engine repo and the frozen DAEB-1 publication bundle.",
      "The reviewed canonical suite at targets/suites/daeb-1.yaml.",
      "Approved compiled packs for each vendor adapter.",
      "Sandbox credentials and scopes that match the pack declarations.",
    ],
    stages: [
      {
        title: "Compile from canonical source",
        body:
          "The suite is vendor-neutral. Each executable pack is compiled from the suite plus public vendor metadata and a vendor-specific oracle extraction.",
      },
      {
        title: "Execute with the same benchmark contract",
        body:
          "Every vendor receives the same task IDs, task wording, difficulty structure, and harness matrix. What changes is only the adapter layer.",
      },
      {
        title: "Verify, normalize, and publish",
        body:
          "Snapshots and normalized records become the input to the public website and the competitive report. The site should be a rendering layer over frozen artifacts, not a hand-maintained spreadsheet.",
      },
    ],
  },
  independence: {
    commitments: [
      {
        title: "No vendor-paid rankings",
        text:
          "AXArena should not accept payment in exchange for inclusion, positioning, suppression, favorable framing, or faster correction handling.",
      },
      {
        title: "Preview is factual, not editorial",
        text:
          "Vendors may flag factual errors in their adapter, docs links, or N/A mapping, but they do not get approval power over conclusions or score presentation.",
      },
      {
        title: "Corrections should be traceable",
        text:
          "If a score changes, the site should link the reason: artifact bug, oracle bug, auth mistake, benchmark bug, or product change followed by rerun.",
      },
    ],
  },
  about: {
    operator:
      "AXArena is operated by Richard Tang as an independent project focused on Agent Experience evaluation.",
    disclosure:
      "Employment or professional affiliations should be disclosed plainly, but they should not imply institutional sponsorship, review rights, or editorial involvement.",
    positioning:
      "The project is trying to become a durable public benchmark publication, not just a one-off leaderboard screenshot.",
  },
  changelog: [
    {
      date: "2026-07-01",
      title: "Launch candidate website goes live",
      text:
        "Initial public prototype for DAEB-1 publication layout, methodology framing, vendor detail pages, and placeholder leaderboard data.",
    },
    {
      date: "2026-07-01",
      title: "Placeholder scope explicitly labeled",
      text:
        "All scores, findings, and task matrices remain illustrative until frozen publication artifacts are wired into the site.",
    },
  ],
  tasks: [
    { id: "db-T01-create-table", label: "T01", title: "Create a table", difficulty: "L1", skill: "schema-ddl" },
    { id: "db-T02-insert-rows", label: "T02", title: "Bulk-insert rows", difficulty: "L1", skill: "bulk-write" },
    { id: "db-T03-query-pattern", label: "T03", title: "Pattern query with pagination", difficulty: "L2", skill: "filtered-read" },
    { id: "db-T04-rls-policy", label: "T04", title: "Row-level access control", difficulty: "L3", skill: "access-control" },
    { id: "db-T05-unique-constraint", label: "T05", title: "Unique constraint enforcement", difficulty: "L1", skill: "constraint-enforcement" },
    { id: "db-T06-foreign-key", label: "T06", title: "Relational integrity", difficulty: "L2", skill: "relational-integrity" },
    { id: "db-T07-export", label: "T07", title: "Export table contents", difficulty: "L1", skill: "data-export" },
    { id: "db-T08-schema-migration", label: "T08", title: "Schema migration", difficulty: "L3", skill: "schema-migration" },
    { id: "db-T09-runtime-integration", label: "T09", title: "Runtime integration", difficulty: "L3", skill: "runtime-integration" },
    { id: "db-T10-backup-restore", label: "T10", title: "Backup or PITR", difficulty: "L4", skill: "operational-ops" }
  ],
  vendors: [
    {
      slug: "supabase",
      name: "Supabase",
      rank: 1,
      overall: 78,
      na: 0,
      surfaces: { api: 86, sdk: 82, cli: 91, mcp: 54 },
      difficulty: { L1: 94, L2: 80, L3: 70, L4: 40 },
      posture: "Broadest surface coverage in the placeholder set; MCP trails the mature CLI path.",
      evidence: "CLI completes schema and data tasks quickly; MCP discovers tools but misses operational coverage.",
      fix: "Expose backup, migration, and policy workflows as first-class MCP tools with examples linked from docs.",
      artifacts: ["compiled-pack.yaml", "oracle-extract.yaml", "generated-eval.snapshot.json", "normalized/*.json"],
      naTasks: [],
      taskScores: [100, 100, 90, 70, 100, 80, 100, 70, 65, 40]
    },
    {
      slug: "neon",
      name: "Neon",
      rank: 2,
      overall: 73,
      na: 1,
      surfaces: { api: 79, sdk: 76, cli: 88, mcp: 49 },
      difficulty: { L1: 91, L2: 77, L3: 62, L4: 38 },
      posture: "Strong serverless Postgres ergonomics; operational tasks need clearer agent paths.",
      evidence: "CLI and API paths are discoverable; MCP and backup/PITR task discovery lag behind.",
      fix: "Publish agent-facing examples for branch, backup, and runtime integration flows.",
      artifacts: ["compiled-pack.yaml", "oracle-extract.yaml", "generated-eval.snapshot.json", "normalized/*.json"],
      naTasks: ["db-T09-runtime-integration"],
      taskScores: [100, 95, 85, 60, 100, 80, 90, 62, null, 38]
    },
    {
      slug: "planetscale",
      name: "PlanetScale",
      rank: 3,
      overall: 69,
      na: 1,
      surfaces: { api: 72, sdk: 74, cli: 86, mcp: 44 },
      difficulty: { L1: 88, L2: 74, L3: 59, L4: 35 },
      posture: "Branch-oriented workflows translate well to agents, especially through CLI.",
      evidence: "Migration tasks are understandable; access-control and MCP discovery are weaker.",
      fix: "Add canonical agent examples for deploy requests, branching, and schema-state read-back.",
      artifacts: ["compiled-pack.yaml", "oracle-extract.yaml", "generated-eval.snapshot.json", "normalized/*.json"],
      naTasks: ["db-T04-rls-policy"],
      taskScores: [95, 92, 72, null, 90, 68, 82, 78, 55, 35]
    },
    {
      slug: "turso",
      name: "Turso",
      rank: 4,
      overall: 64,
      na: 1,
      surfaces: { api: 69, sdk: 70, cli: 82, mcp: 35 },
      difficulty: { L1: 86, L2: 68, L3: 49, L4: 28 },
      posture: "Fast path for edge SQLite basics; operational discovery is the rough edge.",
      evidence: "Create/query flows are concise; PITR-style branch or backup paths are harder to find.",
      fix: "Document backup/branching workflows in an agent-followable task recipe.",
      artifacts: ["compiled-pack.yaml", "oracle-extract.yaml", "generated-eval.snapshot.json", "normalized/*.json"],
      naTasks: ["db-T04-rls-policy"],
      taskScores: [90, 88, 76, null, 84, 65, 82, 52, 48, 28]
    },
    {
      slug: "mongodb-atlas",
      name: "MongoDB Atlas",
      rank: 5,
      overall: 61,
      na: 2,
      surfaces: { api: 74, sdk: 71, cli: 63, mcp: 36 },
      difficulty: { L1: 82, L2: 56, L3: 48, L4: 42 },
      posture: "Mature API surface, but relational tasks require explicit N/A disclosure.",
      evidence: "Document-store flows pass; foreign-key and SQL DDL equivalents are structurally mismatched.",
      fix: "Publish benchmark-oriented mappings for schema validation, search indexes, and triggers.",
      artifacts: ["compiled-pack.yaml", "oracle-extract.yaml", "generated-eval.snapshot.json", "normalized/*.json"],
      naTasks: ["db-T01-create-table", "db-T06-foreign-key"],
      taskScores: [null, 90, 70, 50, 85, null, 72, 48, 45, 42]
    },
    {
      slug: "convex",
      name: "Convex",
      rank: 6,
      overall: 58,
      na: 3,
      surfaces: { api: 50, sdk: 83, cli: 58, mcp: 41 },
      difficulty: { L1: 78, L2: 54, L3: 51, L4: 0 },
      posture: "Strong when the task maps to Convex's code-first model; several SQL-shaped tasks are N/A.",
      evidence: "SDK flow is clear; SQL DDL, foreign keys, and PITR do not map directly.",
      fix: "Document DAEB-equivalent recipes for schema.ts, functions, and access rules.",
      artifacts: ["compiled-pack.yaml", "oracle-extract.yaml", "generated-eval.snapshot.json", "normalized/*.json"],
      naTasks: ["db-T01-create-table", "db-T06-foreign-key", "db-T10-backup-restore"],
      taskScores: [null, 86, 74, 58, 72, null, 65, 50, 52, null]
    },
    {
      slug: "cockroachdb",
      name: "CockroachDB",
      rank: 7,
      overall: 56,
      na: 1,
      surfaces: { api: 58, sdk: 61, cli: 76, mcp: 29 },
      difficulty: { L1: 80, L2: 60, L3: 42, L4: 52 },
      posture: "Operational story is mature; agent-facing surface breadth is uneven.",
      evidence: "CLI handles SQL tasks; MCP path is nascent and API discovery is less direct.",
      fix: "Expose agent-first examples for cluster admin, SQL schema, and backup verification.",
      artifacts: ["compiled-pack.yaml", "oracle-extract.yaml", "generated-eval.snapshot.json", "normalized/*.json"],
      naTasks: ["db-T09-runtime-integration"],
      taskScores: [85, 82, 66, 45, 78, 58, 70, 42, null, 52]
    },
    {
      slug: "insforge",
      name: "Insforge",
      rank: 8,
      overall: 53,
      na: 2,
      surfaces: { api: 55, sdk: 48, cli: 40, mcp: 69 },
      difficulty: { L1: 72, L2: 49, L3: 44, L4: 20 },
      posture: "MCP-first posture is visible; breadth and operational maturity are still early.",
      evidence: "MCP is the strongest surface in the placeholder set, but several ops paths are thin.",
      fix: "Backfill CLI/SDK docs and make export/backup workflows verifiable from public APIs.",
      artifacts: ["compiled-pack.yaml", "oracle-extract.yaml", "generated-eval.snapshot.json", "normalized/*.json"],
      naTasks: ["db-T06-foreign-key", "db-T10-backup-restore"],
      taskScores: [78, 74, 60, 42, 75, null, 58, 40, 44, null]
    }
  ]
};
