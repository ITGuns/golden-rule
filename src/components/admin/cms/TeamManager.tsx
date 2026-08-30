"use client";

import { useState, type FormEvent } from "react";
import {
  Check,
  Copy,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Label, FieldError } from "@/components/ui/Field";
import { Card, Badge } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/admin/EmptyState";
import { formatDate, initials } from "@/lib/utils";
import { apiFetch, roleLabel, ROLE_TONES, type UserDTO } from "./shared";

/** Strong random password from the browser CSPRNG (no ambiguous characters). */
function generatePassword(length = 14) {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => charset[b % charset.length]).join("");
}

/** Password field with regenerate + copy, used by invite and reset dialogs. */
function GeneratedPasswordField({
  id,
  value,
  onRegenerate,
}: {
  id: string;
  value: string;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the value stays visible for manual copying.
    }
  }
  return (
    <div>
      <Label htmlFor={id}>Temporary password</Label>
      <div className="flex gap-2">
        <Input id={id} value={value} readOnly className="font-mono text-sm" aria-describedby={`${id}-hint`} />
        <Button type="button" variant="outline" size="sm" onClick={onRegenerate} aria-label="Generate a new password">
          <RefreshCw className="size-4" aria-hidden />
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={copy} aria-label="Copy password">
          {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
        </Button>
      </div>
      <p id={`${id}-hint`} className="mt-1 text-xs text-muted dark:text-gray-400">
        Share it securely — it is shown only once and never stored in plain text.
      </p>
    </div>
  );
}

/** One-time reveal of a freshly set password after a successful save. */
function PasswordReveal({ password, note }: { password: string; note: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // value stays visible
    }
  }
  return (
    <div className="rounded-xl border border-gold/40 bg-gold-soft/40 p-4 dark:bg-gold/10">
      <p className="text-sm font-semibold text-ink dark:text-white">{note}</p>
      <div className="mt-2 flex items-center gap-2">
        <code className="flex-1 rounded-lg bg-white px-3 py-2 font-mono text-sm text-ink dark:bg-night-soft dark:text-white">
          {password}
        </code>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted dark:text-gray-400">
        This is the only time the password is shown — copy it before closing.
      </p>
    </div>
  );
}

type ConfirmState = { user: UserDTO; action: "deactivate" | "reactivate" } | null;

/**
 * Team workspace (Super Admin / Admin only): member table with inline role
 * changes, invite + reset-password dialogs (client-generated passwords shown
 * once), activate/deactivate with confirmation, and a capability legend.
 */
export function TeamManager({
  initialUsers,
  currentUserId,
  roles,
  adminRoles,
  contentRoles,
}: {
  initialUsers: UserDTO[];
  currentUserId: string;
  roles: string[];
  adminRoles: string[];
  contentRoles: string[];
}) {
  const [users, setUsers] = useState<UserDTO[]>(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserDTO | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const activeCount = users.filter((u) => u.active).length;

  function applyUpdate(updated: UserDTO) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
  }

  async function changeRole(user: UserDTO, role: string) {
    if (role === user.role) return;
    setError(null);
    setPendingId(user.id);
    try {
      const result = await apiFetch<{ user: UserDTO }>("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, role }),
      });
      applyUpdate(result.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to change the role.");
    } finally {
      setPendingId(null);
    }
  }

  async function setActive(user: UserDTO, active: boolean) {
    setError(null);
    setPendingId(user.id);
    try {
      const result = await apiFetch<{ user: UserDTO }>("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, active }),
      });
      applyUpdate(result.user);
      setConfirm(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update the account.");
      setConfirm(null);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Organization</p>
          <h1 className="display text-2xl text-ink dark:text-white">Team</h1>
          <p className="mt-1 text-sm text-muted dark:text-gray-400">
            {activeCount} active member{activeCount === 1 ? "" : "s"} of {users.length} — manage
            roles, access and passwords.
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <UserPlus className="size-4" aria-hidden />
          Add member
        </Button>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      {/* Capability legend */}
      <Card className="p-5">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
          <ShieldCheck className="size-4 text-gold-deep dark:text-gold" aria-hidden />
          What each role can do
        </p>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-ink dark:text-white">Team &amp; settings</dt>
            <dd className="mt-1 text-muted dark:text-gray-400">
              {adminRoles.map(roleLabel).join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink dark:text-white">Website content</dt>
            <dd className="mt-1 text-muted dark:text-gray-400">
              {contentRoles.map(roleLabel).join(", ")}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-ink dark:text-white">CRM workspace</dt>
            <dd className="mt-1 text-muted dark:text-gray-400">
              All active members — leads, appointments and requests.
            </dd>
          </div>
        </dl>
      </Card>

      {/* Members table */}
      {users.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No team members yet"
          hint="Add your first member to give them access to the dashboard."
          action={
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              <UserPlus className="size-4" aria-hidden />
              Add member
            </Button>
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted dark:border-night-line dark:text-gray-400">
                <th scope="col" className="px-4 py-3 font-semibold">Member</th>
                <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                <th scope="col" className="px-4 py-3 font-semibold">Title</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 font-semibold">Joined</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                const busy = pendingId === u.id;
                return (
                  <tr
                    key={u.id}
                    className="border-b border-line last:border-0 dark:border-night-line"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold-deep dark:text-gold"
                        >
                          {initials(u.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-semibold text-ink dark:text-white">
                            <span className="truncate">{u.name}</span>
                            {isSelf && <Badge tone="gold">You</Badge>}
                          </p>
                          <p className="truncate text-xs text-muted dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone={ROLE_TONES[u.role] ?? "neutral"}>{roleLabel(u.role)}</Badge>
                        <Select
                          value={u.role}
                          onChange={(e) => changeRole(u, e.target.value)}
                          disabled={isSelf || busy}
                          aria-label={`Change role for ${u.name}`}
                          title={isSelf ? "You can't change your own role" : undefined}
                          className="w-40 py-1.5 text-sm"
                        >
                          {roles.map((r) => (
                            <option key={r} value={r}>
                              {roleLabel(r)}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-body dark:text-gray-300">
                      {u.title || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.active ? "green" : "red"}>
                        {u.active ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-body dark:text-gray-300">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setResetTarget(u)}
                          disabled={busy}
                        >
                          <KeyRound className="size-3.5" aria-hidden />
                          Reset password
                        </Button>
                        {u.active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirm({ user: u, action: "deactivate" })}
                            disabled={isSelf || busy}
                            title={isSelf ? "You can't deactivate your own account" : undefined}
                            className="text-danger hover:bg-danger/10"
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirm({ user: u, action: "reactivate" })}
                            disabled={busy}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Invite dialog */}
      <InviteDialog
        open={inviteOpen}
        roles={roles}
        onClose={() => setInviteOpen(false)}
        onCreated={(user) => setUsers((prev) => [...prev, user])}
      />

      {/* Reset password dialog */}
      {resetTarget && (
        <ResetPasswordDialog
          key={resetTarget.id}
          user={resetTarget}
          onClose={() => setResetTarget(null)}
        />
      )}

      {/* Activate / deactivate confirmation */}
      <Dialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "deactivate" ? "Deactivate this account?" : "Reactivate this account?"}
      >
        {confirm && (
          <>
            <p className="text-sm text-body dark:text-gray-300">
              {confirm.action === "deactivate" ? (
                <>
                  <strong>{confirm.user.name}</strong> will no longer be able to sign in. Their
                  history and assignments stay intact, and you can reactivate them at any time.
                </>
              ) : (
                <>
                  <strong>{confirm.user.name}</strong> will be able to sign in again with their
                  existing password.
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirm(null)} disabled={pendingId !== null}>
                Cancel
              </Button>
              <Button
                variant={confirm.action === "deactivate" ? "danger" : "gold"}
                onClick={() => setActive(confirm.user, confirm.action === "reactivate")}
                loading={pendingId === confirm.user.id}
              >
                {confirm.action === "deactivate" ? "Deactivate" : "Reactivate"}
              </Button>
            </div>
          </>
        )}
      </Dialog>
    </div>
  );
}

function InviteDialog({
  open,
  roles,
  onClose,
  onCreated,
}: {
  open: boolean;
  roles: string[];
  onClose: () => void;
  onCreated: (user: UserDTO) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("TECHNICIAN");
  const [password, setPassword] = useState(() => generatePassword());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});
  const [created, setCreated] = useState<UserDTO | null>(null);

  function reset() {
    setName("");
    setEmail("");
    setTitle("");
    setRole("TECHNICIAN");
    setPassword(generatePassword());
    setError(null);
    setFieldErrors({});
    setCreated(null);
  }

  function close() {
    onClose();
    reset();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (name.trim().length < 2) errs.name = "Name must be at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = "Enter a valid email address.";
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setError(null);
    setSaving(true);
    try {
      const result = await apiFetch<{ user: UserDTO }>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          title: title.trim() || null,
        }),
      });
      onCreated(result.user);
      setCreated(result.user);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create the account.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onClose={close} title="Add a team member">
      {created ? (
        <div className="space-y-4">
          <p className="text-sm text-body dark:text-gray-300">
            <strong>{created.name}</strong> can now sign in at <code>/admin/login</code> with{" "}
            <strong>{created.email}</strong> and the password below.
          </p>
          <PasswordReveal password={password} note="Temporary password" />
          <div className="flex justify-end">
            <Button onClick={close}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}
          <div>
            <Label htmlFor="invite-name" required>
              Full name
            </Label>
            <Input
              id="invite-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              aria-invalid={fieldErrors.name ? true : undefined}
            />
            <FieldError message={fieldErrors.name} />
          </div>
          <div>
            <Label htmlFor="invite-email" required>
              Email
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
              aria-invalid={fieldErrors.email ? true : undefined}
            />
            <FieldError message={fieldErrors.email} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="invite-role" required>
                Role
              </Label>
              <Select id="invite-role" value={role} onChange={(e) => setRole(e.target.value)}>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="invite-title">Job title</Label>
              <Input
                id="invite-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Service Technician"
              />
            </div>
          </div>
          <GeneratedPasswordField
            id="invite-password"
            value={password}
            onRegenerate={() => setPassword(generatePassword())}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <UserPlus className="size-4" aria-hidden />
              Create account
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onClose }: { user: UserDTO; onClose: () => void }) {
  const [password, setPassword] = useState(() => generatePassword());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    setError(null);
    setSaving(true);
    try {
      await apiFetch<{ user: UserDTO }>("/api/admin/users", {
        method: "PATCH",
        body: JSON.stringify({ id: user.id, password }),
      });
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset the password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={`Reset password — ${user.name}`}>
      {done ? (
        <div className="space-y-4">
          <PasswordReveal
            password={password}
            note={`New password for ${user.email}`}
          />
          <div className="flex justify-end">
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger"
            >
              {error}
            </p>
          )}
          <p className="text-sm text-body dark:text-gray-300">
            This replaces the current password for <strong>{user.email}</strong> immediately.
            They&rsquo;ll use the new password on their next sign-in.
          </p>
          <GeneratedPasswordField
            id="reset-password"
            value={password}
            onRegenerate={() => setPassword(generatePassword())}
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={submit} loading={saving}>
              <KeyRound className="size-4" aria-hidden />
              Reset password
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
