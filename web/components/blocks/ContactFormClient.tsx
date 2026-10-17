"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/actions/enquiry";
import { buttonStyles } from "@/components/ui/Button";
import { ENQUIRY_LIMITS } from "@/lib/enquiry";

type Option = { value: string; label: string };

const fieldClass =
  "mt-2 block w-full rounded-md border border-iron/25 bg-white/70 px-4 py-3 text-base text-iron placeholder:text-iron-soft/70 hover:border-iron/50 focus:border-cobalt focus:outline-none focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-cobalt aria-invalid:border-[#a3361f]";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-base text-[#a3361f]">
      {message}
    </p>
  );
}

export function ContactFormClient({ workshops }: { workshops: Option[] }) {
  const [state, action, pending] = useActionState<EnquiryState, FormData>(sendEnquiry, { status: "idle" });
  const [preselected, setPreselected] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  // Links like /visit/?workshop=glazing-and-surface#enquire preselect the workshop.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("workshop");
    const match = workshops.find((option) => option.value === slug);
    // Reading the URL is only possible after hydration, so this runs once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (match) setPreselected(match.label);
  }, [workshops]);

  // Move focus to the result so keyboard and screen-reader users hear it.
  useEffect(() => {
    if (state.status !== "idle") statusRef.current?.focus();
  }, [state]);

  if (state.status === "sent" || state.status === "demo") {
    return (
      <div ref={statusRef} tabIndex={-1} role="status" className="rounded-md bg-slip p-8">
        <p className="font-display text-title">Message sent</p>
        <p className="mt-3 text-iron-soft">
          {state.status === "demo"
            ? "This is a demo site, so the message went nowhere. On a connected site it's saved in WordPress and emailed to the studio."
            : "Thanks for getting in touch. We'll reply within two working days."}
        </p>
      </div>
    );
  }

  const errors = state.errors ?? {};
  const values = state.values;

  return (
    <form action={action} noValidate className="space-y-6">
      {state.status === "error" && (
        <div ref={statusRef} tabIndex={-1} role="alert" className="rounded-md border border-[#a3361f]/40 bg-[#a3361f]/5 p-4 text-base">
          {state.message}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="enquiry-name" className="font-medium">
            Name
          </label>
          <input
            id="enquiry-name"
            name="name"
            autoComplete="name"
            required
            maxLength={ENQUIRY_LIMITS.name}
            defaultValue={values?.name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "enquiry-name-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="enquiry-name-error" message={errors.name} />
        </div>
        <div>
          <label htmlFor="enquiry-email" className="font-medium">
            Email
          </label>
          <input
            id="enquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={ENQUIRY_LIMITS.email}
            defaultValue={values?.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "enquiry-email-error" : undefined}
            className={fieldClass}
          />
          <FieldError id="enquiry-email-error" message={errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="enquiry-workshop" className="font-medium">
          Workshop <span className="font-normal text-iron-soft">(optional)</span>
        </label>
        <select
          id="enquiry-workshop"
          name="workshop"
          key={preselected}
          defaultValue={values?.workshop ?? preselected}
          className={fieldClass}
        >
          <option value="">General question</option>
          {workshops.map((option) => (
            <option key={option.value} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="enquiry-message" className="font-medium">
          Message
        </label>
        <textarea
          id="enquiry-message"
          name="message"
          rows={6}
          required
          maxLength={ENQUIRY_LIMITS.message}
          defaultValue={values?.message}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? "enquiry-message-error" : undefined}
          className={fieldClass}
        />
        <FieldError id="enquiry-message-error" message={errors.message} />
      </div>

      {/* Honeypot: hidden from people and assistive technology, tempting to bots. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="enquiry-website">Website</label>
        <input id="enquiry-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${buttonStyles.base} ${buttonStyles.primary} disabled:cursor-wait disabled:opacity-70`}
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
