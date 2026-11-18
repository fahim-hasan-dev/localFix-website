"use client";

import { useLayoutEffect, useState } from "react";
import { ArrowLeft, ChevronRight, LifeBuoy, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, NativeSelect, TextArea, TextField } from "@/components/ui/field";
import { errorMessage } from "@/lib/booking-view";
import { cn } from "@/lib/cn";
import {
  useCreateSupportTicketMutation,
  useGetSupportTicketQuery,
  useGetSupportTicketsQuery,
  useReplySupportTicketMutation,
} from "@/services/client/engagement-api";
import { useAppSelector } from "@/redux/hooks";
import { toBackendRole } from "@/utils/authToken";

type ApiRecord = Record<string, unknown>;

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : null;
}

function str(value: unknown): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

/** The list endpoint may return an array, or wrap it in `{ tickets }` / `{ data }` / `{ results }`. */
function extractList(data: unknown): ApiRecord[] {
  if (Array.isArray(data)) return data.filter((item): item is ApiRecord => !!asRecord(item));
  const record = asRecord(data);
  if (!record) return [];
  for (const key of ["tickets", "data", "results", "items"]) {
    if (Array.isArray(record[key])) return extractList(record[key]);
  }
  return [];
}

/** The detail endpoint may return the ticket directly or wrapped in `{ ticket }`. */
function extractTicket(data: unknown): ApiRecord | null {
  const record = asRecord(data);
  if (!record) return null;
  return asRecord(record.ticket) ?? record;
}

function ticketId(ticket: ApiRecord) {
  return str(ticket._id || ticket.id);
}

function formatDateTime(value: unknown) {
  const raw = str(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function label(value: string) {
  const text = value.replace(/[_-]+/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
}

function StatusPill({ value }: { value: string }) {
  const norm = value.toLowerCase();
  const tone =
    norm === "resolved" || norm === "closed"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : norm === "in_progress" || norm === "in-progress" || norm === "pending"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-primary/20 bg-primary/5 text-primary";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", tone)}>
      {label(value) || "Open"}
    </span>
  );
}

function replyEntries(ticket: ApiRecord): ApiRecord[] {
  for (const key of ["discussion", "replies", "messages", "responses", "conversation"]) {
    if (Array.isArray(ticket[key])) return (ticket[key] as unknown[]).filter((item): item is ApiRecord => !!asRecord(item));
  }
  return [];
}

function replyAuthor(reply: ApiRecord) {
  const sender = asRecord(reply.sender) ?? asRecord(reply.author) ?? asRecord(reply.user);
  const role = str(reply.role || reply.senderRole || sender?.role).toLowerCase();
  const name = str(reply.name || reply.senderName || sender?.name);
  const isStaff = role === "admin" || role === "super_admin" || role === "support" || role === "staff" || reply.isAdmin === true;
  return { isStaff, name: name || (isStaff ? "Support team" : "You") };
}

function TicketDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { data, isLoading, isError } = useGetSupportTicketQuery(id);
  const [replyTicket, { isLoading: replying }] = useReplySupportTicketMutation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const ticket = extractTicket(data?.data);

  async function submitReply() {
    const text = message.trim();
    if (!text) return;
    setError("");
    try {
      await replyTicket({ id, message: text }).unwrap();
      setMessage("");
    } catch (err) {
      setError(errorMessage(err, "Could not send your reply."));
    }
  }

  const replies = ticket ? replyEntries(ticket) : [];
  const status = ticket ? str(ticket.status).toLowerCase() : "";
  const finished = status === "resolved" || status === "closed";

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        All tickets
      </button>

      {isLoading ? <p className="text-sm text-muted">Loading ticket...</p> : null}
      {!isLoading && (isError || !ticket) ? <p className="text-sm text-error">This ticket could not be loaded.</p> : null}

      {ticket ? (
        <Card className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold text-title">{str(ticket.subject) || "Support ticket"}</h2>
              <p className="mt-0.5 text-xs text-muted">
                {[str(ticket.ticketId), str(ticket.priority) ? `${label(str(ticket.priority))} priority` : "", formatDateTime(ticket.createdAt)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <StatusPill value={status || "open"} />
          </div>

          {str(ticket.description) ? (
            <p className="mt-4 whitespace-pre-line border-t border-line/60 pt-4 text-sm leading-relaxed text-copy">
              {str(ticket.description)}
            </p>
          ) : null}

          <div className="mt-5 border-t border-line/60 pt-4">
            <p className="font-display text-sm font-bold text-title">Conversation</p>
            {replies.length === 0 ? (
              <p className="mt-2 text-xs text-muted">No replies yet. Our team will respond here.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {replies.map((reply, index) => {
                  const author = replyAuthor(reply);
                  return (
                    <li
                      key={str(reply._id || reply.id) || index}
                      className={cn(
                        "rounded-xl border px-3.5 py-2.5 text-sm",
                        author.isStaff ? "border-primary/20 bg-primary/5" : "border-line bg-smoke/50",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
                        <span className="font-semibold text-title">{author.name}</span>
                        <span>{formatDateTime(reply.createdAt)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-line leading-relaxed text-copy">
                        {str(reply.message || reply.text || reply.body)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {finished ? (
            <p className="mt-5 border-t border-line/60 pt-4 text-xs text-muted">
              This ticket is resolved. Replies are closed.
            </p>
          ) : (
            <div className="mt-5 space-y-2 border-t border-line/60 pt-4">
              <TextArea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="Write a reply…"
              />
              <div className="flex items-center gap-3">
                <Button type="button" size="sm" disabled={replying || !message.trim()} onClick={() => void submitReply()}>
                  {replying ? "Sending…" : "Send reply"}
                </Button>
                {error ? <p className="text-xs text-error">{error}</p> : null}
              </div>
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

export function SupportCenter({ role }: { role: "homeowner" | "pro" }) {
  const user = useAppSelector((state) => state.auth.user);
  const { data, isLoading, isError } = useGetSupportTicketsQuery();
  const [createTicket, { isLoading: creating }] = useCreateSupportTicketMutation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useLayoutEffect(() => {
    const read = () => setSelectedId(new URLSearchParams(window.location.search).get("ticket"));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  function openTicket(id: string) {
    setSelectedId(id);
    const url = new URL(window.location.href);
    url.searchParams.set("ticket", id);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function closeTicket() {
    setSelectedId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("ticket");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const tickets = extractList(data?.data);
  const canSubmit = subject.trim().length >= 3 && description.trim().length >= 10;

  async function submit() {
    if (!canSubmit) return;
    setError("");
    setNotice("");
    try {
      await createTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
        requesterName: user?.name,
        requesterEmail: user?.email,
        requesterRole: toBackendRole(user?.role ?? role),
      }).unwrap();
      setSubject("");
      setDescription("");
      setPriority("medium");
      setShowForm(false);
      setNotice("Ticket submitted. We'll reply here as soon as possible.");
    } catch (err) {
      setError(errorMessage(err, "Could not create the ticket."));
    }
  }

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 border-b border-line/70 pb-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-[22px] sm:text-[26px] font-bold tracking-tight text-title">Support</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-muted">
            {role === "pro"
              ? "Questions about leads, billing or your storefront? Open a ticket."
              : "Questions about a request or booking? Open a ticket and we'll help."}
          </p>
        </div>
        {!selectedId ? (
          <Button type="button" size="sm" onClick={() => setShowForm((value) => !value)} className="self-start sm:self-auto">
            {showForm ? "Cancel" : "New ticket"}
          </Button>
        ) : null}
      </div>

      {selectedId ? (
        <TicketDetail id={selectedId} onBack={closeTicket} />
      ) : (
        <>
          {notice ? <p className="text-xs font-medium text-emerald-700">{notice}</p> : null}

          {showForm ? (
            <Card className="rounded-2xl border border-line/80 bg-white p-5 sm:p-6 shadow-xs hover:shadow-xs">
              <p className="font-display text-sm font-bold text-title">Create a ticket</p>
              <div className="mt-4 space-y-4">
                <Field label="Subject">
                  <TextField
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Short summary of the issue"
                    maxLength={120}
                  />
                </Field>
                <Field label="Description" hint="Include any booking or request details that help us investigate.">
                  <TextArea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={5}
                    placeholder="Tell us what happened…"
                  />
                </Field>
                <Field label="Priority">
                  <NativeSelect value={priority} onChange={(event) => setPriority(event.target.value)}>
                    {PRIORITIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
                <div className="flex items-center gap-3">
                  <Button type="button" size="sm" disabled={creating || !canSubmit} onClick={() => void submit()}>
                    {creating ? "Submitting…" : "Submit ticket"}
                  </Button>
                  {error ? <p className="text-xs text-error">{error}</p> : null}
                </div>
              </div>
            </Card>
          ) : null}

          {isLoading ? <p className="text-sm text-muted">Loading tickets...</p> : null}
          {isError ? <p className="text-sm text-error">Tickets could not be loaded.</p> : null}
          {!isLoading && !isError && tickets.length === 0 ? (
            <EmptyState title="No support tickets" description="When you contact support, your tickets and our replies will show up here." />
          ) : null}

          {tickets.length > 0 ? (
            <ul className="overflow-hidden rounded-[14px] border border-line bg-white">
              {tickets.map((ticket, index) => {
                const id = ticketId(ticket);
                const replyCount = replyEntries(ticket).length;
                return (
                  <li key={id || index} className={cn(index > 0 && "border-t border-line")}>
                    <button
                      type="button"
                      disabled={!id}
                      onClick={() => openTicket(id)}
                      className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-primary/[0.04] focus-visible:bg-primary/[0.06] focus-visible:outline-none"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                        <LifeBuoy className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-display text-sm font-semibold text-title group-hover:text-primary">
                          {str(ticket.subject) || "Support ticket"}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          {[str(ticket.ticketId), str(ticket.priority) ? `${label(str(ticket.priority))} priority` : "", formatDateTime(ticket.createdAt)]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </span>
                      {replyCount > 0 ? (
                        <span className="hidden items-center gap-1 text-xs text-muted sm:inline-flex">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {replyCount}
                        </span>
                      ) : null}
                      <StatusPill value={str(ticket.status) || "open"} />
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}
