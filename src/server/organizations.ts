import { db } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { DEFAULT_LOSS_REASONS, DEFAULT_PIPELINE_STAGES } from "@/lib/defaults";

async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || "organizacao";
  let candidate = base;
  let suffix = 1;
  while (await db.organization.findUnique({ where: { slug: candidate } })) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }
  return candidate;
}

export async function createOrganizationWithOwner(params: {
  organizationName: string;
  userId: string;
}) {
  const slug = await uniqueSlug(params.organizationName);

  return db.organization.create({
    data: {
      name: params.organizationName,
      slug,
      memberships: {
        create: {
          userId: params.userId,
          role: "OWNER",
        },
      },
      pipelineStages: {
        create: DEFAULT_PIPELINE_STAGES.map((stage, index) => ({
          name: stage.name,
          type: stage.type,
          order: index,
        })),
      },
      lossReasons: {
        create: DEFAULT_LOSS_REASONS.map((label) => ({ label })),
      },
    },
  });
}
