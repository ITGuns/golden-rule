"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Field";
import { humanize } from "./constants";
import {
  AppointmentStatusBadge,
  CrmEmptyState,
  LeadStatusBadge,
} from "./Bits";
import type { CustomerWithCounts } from "./types";
import { ChevronDown, Loader2, Pencil, Search, Users } from "lucide-react";

export function CustomersTable({
  initialCustomers,
  focusId,
}: {
  initialCustomers: CustomerWithCounts[];
  focusId: string | null;
}) {
  const [customers, setCustomers] = useState<CustomerWithCounts[]>(initialCustomers);
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(focusId ? [focusId] : [])
  );
  const [editing, setEditing] = useState<CustomerWithCounts | null>(null);
  const focusRef = useRef<HTMLTableRowElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll the ?focus=id row into view once.
  useEffect(() => {
    if (focusId && focusRef.current) {
      focusRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [focusId]);

  // Debounced server-side search across the whole customer base.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const query = q.trim();
      if (!query) {
        setCustomers(initialCustomers);
        setSearchError(null);
        return;
      }
      setSearching(true);
      fetch(`/api/admin/customers?q=${encodeURIComponent(query)}`)
        .then(async (res) => {
          const data = (await res.json()) as {
            customers?: CustomerWithCounts[];
            error?: string;
          };
          if (!res.ok || !data.customers) throw new Error(data.error);
          setCustomers(data.customers);
          setSearchError(null);
        })
        .catch(() => setSearchError("Search failed — showing the most recent customers."))
        .finally(() => setSearching(false));
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, initialCustomers]);

  const toggle = useCallback((id: string) => {
    setExpanded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-2xl text-ink dark:text-white">Customers</h1>
          <p className="text-sm text-muted">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
            {q.trim() ? " matching your search" : " on file"}
          </p>
        </div>
      </div>

      <Card className="flex items-center gap-2 p-3">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone, city…"
            aria-label="Search customers"
            className="pl-9"
          />
        </div>
        {searching && <Loader2 className="size-4 animate-spin text-muted" aria-hidden />}
      </Card>

      {searchError && (
        <p role="status" className="text-sm font-medium text-danger">
          {searchError}
        </p>
      )}

      {customers.length === 0 ? (
        <CrmEmptyState
          icon={<Users className="size-6" />}
          title={q.trim() ? "No customers match" : "No customers yet"}
          hint={
            q.trim()
              ? "Try a different name, phone number or city."
              : "Customers are created automatically when leads come in."
          }
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs tracking-wide text-muted uppercase dark:border-night-line">
                <th className="w-10 px-2 py-3">
                  <span className="sr-only">Expand</span>
                </th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Leads</th>
                <th className="px-4 py-3 font-semibold">Visits</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="w-12 px-2 py-3">
                  <span className="sr-only">Edit</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const isOpen = expanded.has(c.id);
                const isFocus = focusId === c.id;
                return (
                  <Fragment key={c.id}>
                    <tr
                      ref={isFocus ? focusRef : undefined}
                      className={cn(
                        "border-b border-line/60 transition-colors last:border-0 hover:bg-paper dark:border-night-line/60 dark:hover:bg-white/5",
                        isFocus && "bg-gold-soft/60 dark:bg-gold/10"
                      )}
                    >
                      <td className="px-2 py-3">
                        <button
                          onClick={() => toggle(c.id)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? "Collapse" : "Expand"} ${c.firstName} ${c.lastName}`}
                          className="rounded-lg p-1.5 text-muted transition-transform hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <ChevronDown
                            className={cn("size-4 transition-transform", isOpen && "rotate-180")}
                            aria-hidden
                          />
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink dark:text-white">
                        {c.firstName} {c.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <p>{c.phone || "—"}</p>
                        <p className="text-xs">{c.email || ""}</p>
                      </td>
                      <td className="px-4 py-3">{c.city || "—"}</td>
                      <td className="px-4 py-3 text-muted">{humanize(c.type)}</td>
                      <td className="px-4 py-3">{c._count.leads}</td>
                      <td className="px-4 py-3">{c._count.appointments}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(c.createdAt)}</td>
                      <td className="px-2 py-3">
                        <button
                          onClick={() => setEditing(c)}
                          aria-label={`Edit ${c.firstName} ${c.lastName}`}
                          className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink dark:hover:bg-white/10 dark:hover:text-white"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-line/60 bg-paper/60 dark:border-night-line/60 dark:bg-white/[0.03]">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid gap-6 md:grid-cols-2">
                            <div>
                              <h3 className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
                                Recent leads
                              </h3>
                              {c.leads && c.leads.length > 0 ? (
                                <ul className="space-y-1.5">
                                  {c.leads.map((l) => (
                                    <li key={l.id} className="flex items-center gap-2">
                                      <Link
                                        href={`/admin/leads/${l.id}`}
                                        className="font-semibold text-ink underline-offset-2 hover:underline dark:text-white"
                                      >
                                        {l.service || "General inquiry"}
                                      </Link>
                                      <LeadStatusBadge status={l.status} />
                                      <span className="text-xs text-muted">
                                        {formatDate(l.createdAt)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted">No leads yet.</p>
                              )}
                            </div>
                            <div>
                              <h3 className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">
                                Recent appointments
                              </h3>
                              {c.appointments && c.appointments.length > 0 ? (
                                <ul className="space-y-1.5">
                                  {c.appointments.map((a) => (
                                    <li key={a.id} className="flex items-center gap-2">
                                      <Link
                                        href="/admin/appointments"
                                        className="font-semibold text-ink underline-offset-2 hover:underline dark:text-white"
                                      >
                                        {a.service}
                                      </Link>
                                      <AppointmentStatusBadge status={a.status} />
                                      <span className="text-xs text-muted">
                                        {formatDateTime(a.start)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-muted">No appointments yet.</p>
                              )}
                            </div>
                          </div>
                          {c.notes && (
                            <p className="mt-4 rounded-xl bg-white p-3 text-sm text-body dark:bg-white/5 dark:text-gray-300">
                              {c.notes}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      <EditCustomerDialog
        customer={editing}
        onClose={() => setEditing(null)}
        onSaved={(updated) =>
          setCustomers((cur) =>
            cur.map((c) => (c.id === updated.id ? { ...c, ...updated } : c))
          )
        }
      />
    </div>
  );
}

function EditCustomerDialog({
  customer,
  onClose,
  onSaved,
}: {
  customer: CustomerWithCounts | null;
  onClose: () => void;
  onSaved: (c: Partial<CustomerWithCounts> & { id: string }) => void;
}) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    street: "",
    city: "",
    zip: "",
    type: "RESIDENTIAL",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (customer) {
      setForm({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email ?? "",
        phone: customer.phone ?? "",
        street: customer.street ?? "",
        city: customer.city ?? "",
        zip: customer.zip ?? "",
        type: customer.type,
        notes: customer.notes ?? "",
      });
      setErr(null);
    }
  }, [customer]);

  const submit = async () => {
    if (!customer) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErr("First and last name are required.");
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customer.id,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          street: form.street.trim() || null,
          city: form.city.trim() || null,
          zip: form.zip.trim() || null,
          type: form.type,
          notes: form.notes.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        customer?: Partial<CustomerWithCounts> & { id: string };
        error?: string;
      };
      if (!res.ok || !data.customer) {
        setErr(data.error || "Could not save the customer.");
        return;
      }
      onSaved(data.customer);
      onClose();
    } catch {
      setErr("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={Boolean(customer)}
      onClose={onClose}
      title={customer ? `Edit ${customer.firstName} ${customer.lastName}` : "Edit customer"}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cu-first" required>
              First name
            </Label>
            <Input
              id="cu-first"
              value={form.firstName}
              onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="cu-last" required>
              Last name
            </Label>
            <Input
              id="cu-last"
              value={form.lastName}
              onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="cu-phone">Phone</Label>
            <Input
              id="cu-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cu-email">Email</Label>
            <Input
              id="cu-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="cu-street">Street</Label>
          <Input
            id="cu-street"
            value={form.street}
            onChange={(e) => setForm((c) => ({ ...c, street: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label htmlFor="cu-city">City</Label>
            <Input
              id="cu-city"
              value={form.city}
              onChange={(e) => setForm((c) => ({ ...c, city: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="cu-zip">ZIP</Label>
            <Input
              id="cu-zip"
              value={form.zip}
              onChange={(e) => setForm((c) => ({ ...c, zip: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="cu-type">Type</Label>
          <Select
            id="cu-type"
            value={form.type}
            onChange={(e) => setForm((c) => ({ ...c, type: e.target.value }))}
          >
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="NEW_CONSTRUCTION">New construction</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="cu-notes">Notes</Label>
          <Textarea
            id="cu-notes"
            value={form.notes}
            onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))}
            rows={3}
            className="min-h-20"
          />
        </div>
        <FieldError message={err ?? undefined} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={submitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
