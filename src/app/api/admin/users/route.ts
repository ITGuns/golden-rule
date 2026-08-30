import type { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireSession, audit, ADMIN_ROLES, ROLES } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Team management (SUPER_ADMIN / ADMIN only).
 * GET   — every user (passwordHash never leaves the server).
 * POST  — create a user with a bcrypt-hashed password.
 * PATCH — edit role / active / title / name / password with safety rails:
 *         you can't demote or deactivate yourself, and the last active
 *         Super Admin can't be demoted or deactivated.
 */

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  title: true,
  active: true,
  createdAt: true,
} as const;

function firstIssue(error: z.ZodError) {
  const issue = error.issues[0];
  return issue ? `${issue.path.join(".") || "body"}: ${issue.message}` : "Invalid request.";
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    await requireSession(ADMIN_ROLES);
    const items = await db.user.findMany({ select: userSelect, orderBy: { createdAt: "asc" } });
    return Response.json({ items });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to load the team." }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  password: z.string().min(10, "Password must be at least 10 characters.").max(200),
  role: z.enum(ROLES),
  title: z.string().max(120).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const actor = await requireSession(ADMIN_ROLES);

    const parsed = createSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const d = parsed.data;
    const email = d.email.toLowerCase().trim();

    const clash = await db.user.findUnique({ where: { email } });
    if (clash) {
      return Response.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(d.password, 10);
    const created = await db.user.create({
      data: {
        name: d.name.trim(),
        email,
        passwordHash,
        role: d.role,
        title: d.title?.trim() || null,
      },
      select: userSelect,
    });

    // Never log password values.
    await audit(actor.id, "create", "User", created.id, undefined, {
      name: created.name,
      email: created.email,
      role: created.role,
      title: created.title,
      password: "set",
    });

    return Response.json({ user: created }, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to create the user." }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  role: z.enum(ROLES).optional(),
  active: z.boolean().optional(),
  title: z.string().max(120).nullable().optional(),
  name: z.string().min(2).max(120).optional(),
  password: z.string().min(10, "Password must be at least 10 characters.").max(200).optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const actor = await requireSession(ADMIN_ROLES);

    const parsed = patchSchema.safeParse(await readJson(req));
    if (!parsed.success) {
      return Response.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { id, ...d } = parsed.data;
    if (Object.keys(d).length === 0) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }

    const target = await db.user.findUnique({ where: { id } });
    if (!target) return Response.json({ error: "User not found." }, { status: 404 });

    // Safety rails: no self-demotion or self-deactivation.
    if (target.id === actor.id) {
      if (d.active === false) {
        return Response.json(
          { error: "You can't deactivate your own account — ask another admin." },
          { status: 400 }
        );
      }
      if (d.role !== undefined && d.role !== target.role) {
        return Response.json(
          { error: "You can't change your own role — ask another admin." },
          { status: 400 }
        );
      }
    }

    // Keep at least one active Super Admin.
    const demotesSuperAdmin =
      target.role === "SUPER_ADMIN" &&
      target.active &&
      ((d.role !== undefined && d.role !== "SUPER_ADMIN") || d.active === false);
    if (demotesSuperAdmin) {
      const others = await db.user.count({
        where: { role: "SUPER_ADMIN", active: true, id: { not: target.id } },
      });
      if (others === 0) {
        return Response.json(
          { error: "At least one active Super Admin is required — promote someone else first." },
          { status: 400 }
        );
      }
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        ...(d.role !== undefined ? { role: d.role } : {}),
        ...(d.active !== undefined ? { active: d.active } : {}),
        ...(d.title !== undefined ? { title: d.title?.trim() || null } : {}),
        ...(d.name !== undefined ? { name: d.name.trim() } : {}),
        ...(d.password !== undefined
          ? { passwordHash: await bcrypt.hash(d.password, 10) }
          : {}),
      },
      select: userSelect,
    });

    // Audit trail — never log password values.
    const oldValue: Record<string, unknown> = {};
    const newValue: Record<string, unknown> = {};
    if (d.role !== undefined) [oldValue.role, newValue.role] = [target.role, updated.role];
    if (d.active !== undefined) [oldValue.active, newValue.active] = [target.active, updated.active];
    if (d.title !== undefined) [oldValue.title, newValue.title] = [target.title, updated.title];
    if (d.name !== undefined) [oldValue.name, newValue.name] = [target.name, updated.name];
    if (d.password !== undefined) newValue.password = "changed";
    await audit(actor.id, "update", "User", updated.id, oldValue, newValue);

    return Response.json({ user: updated });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to update the user." }, { status: 500 });
  }
}
