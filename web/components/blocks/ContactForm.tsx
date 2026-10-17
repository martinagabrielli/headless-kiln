import { Section } from "@/components/ui/Section";
import type { BlockProps } from "@/lib/blocks/fields";
import { getSiteSettings, getWorkshops } from "@/lib/content";
import { ContactFormClient } from "./ContactFormClient";

export async function ContactForm({ fields, anchor, headingId }: BlockProps<"acf/contact-form">) {
  const [settings, workshops] = await Promise.all([getSiteSettings(), getWorkshops()]);
  const { address, openingHours, email, phone } = settings;

  return (
    <Section id={anchor} labelledBy={headingId}>
      <div className="grid gap-14 md:grid-cols-12 md:gap-8">
        <div className="md:col-span-4">
          <h2 id={headingId} className="text-headline">
            {fields.heading ?? "Get in touch"}
          </h2>
          {fields.intro && <p className="mt-4 text-iron-soft">{fields.intro}</p>}

          <dl className="mt-10 space-y-6 text-base">
            {address && (
              <div>
                <dt className="font-medium">Address</dt>
                <dd className="mt-1 whitespace-pre-line text-iron-soft">{address}</dd>
              </div>
            )}
            {openingHours && (
              <div>
                <dt className="font-medium">Opening hours</dt>
                <dd className="mt-1 whitespace-pre-line text-iron-soft">{openingHours}</dd>
              </div>
            )}
            {(email || phone) && (
              <div>
                <dt className="font-medium">Email and phone</dt>
                <dd className="mt-1 text-iron-soft">
                  {email && (
                    <a href={`mailto:${email}`} className="block underline decoration-1 underline-offset-4 hover:text-cobalt">
                      {email}
                    </a>
                  )}
                  {phone && (
                    <a href={`tel:${phone.replace(/\s/g, "")}`} className="block hover:text-cobalt">
                      {phone}
                    </a>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="md:col-span-7 md:col-start-6">
          <ContactFormClient workshops={workshops.map((workshop) => ({ value: workshop.slug, label: workshop.title }))} />
        </div>
      </div>
    </Section>
  );
}
