import { eq } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { loadEnv } from "./load-env";
import * as schema from "./schema";
import type { Sector, SpecMetric } from "@baseer-portfolio/shared";

loadEnv();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is required for db:seed.");
  process.exit(1);
}

const PLACEHOLDER =
  "[PLACEHOLDER — replace with real copy]\n\nThis section will describe the work in detail once Baseer replaces the seed content from `/admin`.";

const adminEmail = process.env.ADMIN_EMAIL ?? "baseer@baseer.co.uk";
const adminName = process.env.ADMIN_NAME ?? "Baseer";
const adminId = process.env.OWNER_ID ?? "seed-user-baseer";

type CaseSeed = {
  sector: Sector;
  title: string;
  slug: string;
  dek: string;
  metrics: SpecMetric[];
};

const cases: CaseSeed[] = [
  {
    sector: "automotive",
    title: "EV Launch — Regional Demand Spike",
    slug: "ev-launch-regional-demand",
    dek: "Integrated launch that turned dealer interest into measurable test-drive volume.",
    metrics: [
      { label: "REACH", value: "2.4M" },
      { label: "CTR", value: "+38%" },
      { label: "BUDGET", value: "£120K" },
    ],
  },
  {
    sector: "automotive",
    title: "Service Retention Campaign",
    slug: "service-retention-campaign",
    dek: "CRM-led retention programme for aftersales across a multi-site network.",
    metrics: [
      { label: "BOOKINGS", value: "+22%" },
      { label: "ROI", value: "4.1x" },
      { label: "CYCLE", value: "12 wks" },
    ],
  },
  {
    sector: "charity",
    title: "Winter Appeal — Digital Fundraising",
    slug: "winter-appeal-fundraising",
    dek: "Cross-channel appeal that grew donor acquisition without eroding brand trust.",
    metrics: [
      { label: "RAISED", value: "£410K" },
      { label: "DONORS", value: "+31%" },
      { label: "CPA", value: "−18%" },
    ],
  },
  {
    sector: "charity",
    title: "Volunteer Recruitment Sprint",
    slug: "volunteer-recruitment-sprint",
    dek: "Localised creative and landing flows that filled critical volunteer roles.",
    metrics: [
      { label: "SIGNUPS", value: "1,840" },
      { label: "SHOW-RATE", value: "67%" },
      { label: "REGIONS", value: "9" },
    ],
  },
  {
    sector: "education",
    title: "Open Day Enrolment Drive",
    slug: "open-day-enrolment-drive",
    dek: "Always-on nurture plus peak-week bursts that lifted enrolment intent.",
    metrics: [
      { label: "ENQUIRIES", value: "+44%" },
      { label: "ATTENDANCE", value: "3,200" },
      { label: "CONVERSION", value: "12%" },
    ],
  },
  {
    sector: "education",
    title: "Alumni Giving Reactivation",
    slug: "alumni-giving-reactivation",
    dek: "Segmented storytelling that reactivated dormant alumni givers.",
    metrics: [
      { label: "REACTIVATED", value: "920" },
      { label: "AVG GIFT", value: "£85" },
      { label: "OPEN RATE", value: "41%" },
    ],
  },
];

async function main() {
  const pool = new Pool({ connectionString: databaseUrl, max: 1 });
  const db = drizzle(pool, { schema });

  try {
    const existing = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.id, adminId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(schema.user).values({
        id: adminId,
        name: adminName,
        email: adminEmail,
      });
      console.log(`Created owner user ${adminEmail} (${adminId})`);
    } else {
      console.log(`Owner user already exists (${adminEmail})`);
    }

    const existingCases = await db.select().from(schema.caseStudies).limit(1);
    if (existingCases.length > 0) {
      console.log("Content already seeded — skipping case studies / related rows.");
      return;
    }

    let order = 0;
    for (const c of cases) {
      await db.insert(schema.caseStudies).values({
        ownerId: adminId,
        sector: c.sector,
        title: c.title,
        slug: c.slug,
        dek: c.dek,
        challenge: PLACEHOLDER,
        strategy: PLACEHOLDER,
        execution: PLACEHOLDER,
        results: PLACEHOLDER,
        specMetrics: c.metrics,
        published: true,
        displayOrder: order++,
      });
    }
    console.log(`Seeded ${cases.length} case studies`);

    await db.insert(schema.testimonials).values([
      {
        ownerId: adminId,
        authorName: "Alex Morgan",
        authorRole: "Marketing Director",
        company: "Northline Motors",
        quote:
          "[PLACEHOLDER — replace with real copy] Baseer brought clarity to a noisy launch window and the numbers followed.",
        displayOrder: 0,
      },
      {
        ownerId: adminId,
        authorName: "Priya Shah",
        authorRole: "Head of Fundraising",
        company: "Harbour Trust",
        quote:
          "[PLACEHOLDER — replace with real copy] The campaign felt human and still hit every performance target we set.",
        displayOrder: 1,
      },
      {
        ownerId: adminId,
        authorName: "James Okafor",
        authorRole: "Director of Admissions",
        company: "Riverside College",
        quote:
          "[PLACEHOLDER — replace with real copy] Enrolment conversations started earlier and with better-qualified prospects.",
        displayOrder: 2,
      },
    ]);

    await db.insert(schema.timelineEntries).values([
      {
        ownerId: adminId,
        yearRange: "2024–Present",
        title: "Independent Marketing Lead",
        organisation: "Baseer",
        description:
          "[PLACEHOLDER — replace with real copy] Cross-sector campaigns spanning automotive, charity, and education.",
        sector: null,
        displayOrder: 0,
      },
      {
        ownerId: adminId,
        yearRange: "2021–2024",
        title: "Brand & Performance Lead",
        organisation: "Automotive Group",
        description:
          "[PLACEHOLDER — replace with real copy] National and regional launches, dealer enablement, always-on CRM.",
        sector: "automotive",
        displayOrder: 1,
      },
      {
        ownerId: adminId,
        yearRange: "2019–2021",
        title: "Campaign Manager",
        organisation: "National Charity",
        description:
          "[PLACEHOLDER — replace with real copy] Appeals, acquisition, and volunteer recruitment programmes.",
        sector: "charity",
        displayOrder: 2,
      },
      {
        ownerId: adminId,
        yearRange: "2017–2019",
        title: "Marketing Executive",
        organisation: "Further Education Provider",
        description:
          "[PLACEHOLDER — replace with real copy] Open days, prospectus campaigns, and student journey messaging.",
        sector: "education",
        displayOrder: 3,
      },
      {
        ownerId: adminId,
        yearRange: "2015–2017",
        title: "Junior Marketer",
        organisation: "Agency",
        description:
          "[PLACEHOLDER — replace with real copy] Multi-client support across paid social, email, and content.",
        sector: null,
        displayOrder: 4,
      },
    ]);

    const skillRows: { category: string; name: string; displayOrder: number }[] = [
      { category: "Channels", name: "Paid Social", displayOrder: 0 },
      { category: "Channels", name: "Email / CRM", displayOrder: 1 },
      { category: "Channels", name: "Search", displayOrder: 2 },
      { category: "Tools", name: "GA4", displayOrder: 0 },
      { category: "Tools", name: "Meta Ads Manager", displayOrder: 1 },
      { category: "Tools", name: "HubSpot", displayOrder: 2 },
      { category: "Disciplines", name: "Brand Positioning", displayOrder: 0 },
      { category: "Disciplines", name: "Performance Creative", displayOrder: 1 },
      { category: "Disciplines", name: "Measurement Frameworks", displayOrder: 2 },
    ];
    await db.insert(schema.skills).values(
      skillRows.map((s) => ({ ...s, ownerId: adminId })),
    );

    await db.insert(schema.siteSettings).values({
      ownerId: adminId,
      introHeadline: "Marketing that moves the needle",
      introSubhead:
        "[PLACEHOLDER — replace with real copy] Campaigns and launches across automotive, charity, and education — measured like a spec sheet.",
      contactEmail: adminEmail,
      socialLinks: {
        linkedin: "https://www.linkedin.com/",
      },
    });

    console.log("Seed complete.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
