# Packaging readiness (deferred)

The visual CMS is built as a **single-tenant** Baseer portfolio on Cloudflare free tier.

When packaging for other clients later, plan for:

1. **Tenancy** — `owner_id` / workspace id on all content tables; per-tenant R2 prefixes
2. **Billing** — outside free tier (Workers Paid, Neon scale, custom domains)
3. **Auth** — invite flows, role templates already sketched (`owner` / `editor` / `viewer`)
4. **Branding** — design_system tokens already per-owner
5. **Isolation** — no shared AI keys; BYOK already required

Do **not** enable multi-tenant runtime in this delivery. This checklist is documentation only.
