import InboxTable from "@/components/admin/InboxTable";
import SingletonForm from "@/components/admin/SingletonForm";
import CollectionEditor from "@/components/admin/CollectionEditor";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// ============ INBOXES ============
export const PrayerInbox = () => (
  <InboxTable title="Prayer Requests" description="Submissions from the public prayer form."
    table="prayer_requests" statusOptions={["new", "praying", "done"]}
    columns={[
      { key: "name", label: "Name", render: r => r.anonymous ? <em className="text-muted-foreground">Anonymous</em> : (r.name || "—") },
      { key: "email", label: "Email" },
      { key: "request", label: "Request", truncate: true },
    ]} />
);
export const TestimonyInbox = () => (
  <InboxTable title="Testimony Submissions" description="Stories shared by the community."
    table="testimony_submissions" statusOptions={["pending", "approved", "featured", "archived"]}
    columns={[
      { key: "name", label: "Name" },
      { key: "location", label: "Location" },
      { key: "story", label: "Story", truncate: true },
    ]} />
);
export const RegistrationInbox = () => (
  <InboxTable title="Event Registrations" description="People who registered for YEC, SSC, or NSS."
    table="event_registrations" statusOptions={["new", "confirmed", "attended", "cancelled"]}
    columns={[
      { key: "registration_code", label: "ID", render: r => <span className="font-mono font-semibold">{r.registration_code || "—"}</span> },
      { key: "photo_url", label: "Photo", render: r => r.photo_url
        ? <a href={r.photo_url} target="_blank" rel="noreferrer"><img src={r.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" /></a>
        : <span className="text-muted-foreground">—</span> },
      { key: "full_name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Phone" },
      { key: "event", label: "Event" },
      { key: "state", label: "State" },
      { key: "zone_fellowship", label: "Zone / Fellowship", truncate: true },
      { key: "age_range", label: "Age" },
      { key: "payment_status", label: "Payment", render: r => <span className={`text-xs px-2 py-0.5 rounded-full ${r.payment_status === "paid" ? "bg-secondary/20 text-secondary" : "bg-muted"}`}>{r.payment_status || "unpaid"}</span> },
    ]} />
);
export const ContactInbox = () => (
  <InboxTable title="Contact Messages" description="General enquiries from the site."
    table="contact_messages" statusOptions={["new", "replied", "archived"]}
    columns={[
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "subject", label: "Subject" },
      { key: "message", label: "Message", truncate: true },
    ]} />
);
export const NewsletterInbox = () => (
  <InboxTable title="Newsletter Subscribers" description="People who opted in for updates." hasStatus={false}
    table="newsletter_subscribers"
    columns={[{ key: "email", label: "Email" }]} />
);

// ============ CONTENT - SINGLETONS ============
export const HeroEdit = () => (
  <SingletonForm title="Home Page" table="hero_content" fields={[
    { key: "eyebrow", label: "Eyebrow / small text above headline" },
    { key: "headline", label: "Headline", type: "textarea", rows: 2 },
    { key: "subhead", label: "Subhead", type: "textarea", rows: 3 },
    { key: "cta_primary_label", label: "Primary CTA label" },
    { key: "cta_primary_link", label: "Primary CTA link (e.g. #join)" },
    { key: "cta_secondary_label", label: "Secondary CTA label" },
    { key: "cta_secondary_link", label: "Secondary CTA link" },
    { key: "image_url", label: "Home image (optional override)", type: "image" },
  ]} />
);
export const AboutEdit = () => (
  <SingletonForm title="About Section" table="about_content" fields={[
    { key: "eyebrow", label: "Eyebrow" },
    { key: "headline", label: "Headline", type: "textarea", rows: 2 },
    { key: "body", label: "Body paragraph", type: "textarea", rows: 6 },
    { key: "watchword", label: "Watchword statement" },
    { key: "scripture", label: "Scripture reference" },
  ]} />
);
export const OverseerEdit = () => (
  <SingletonForm title="General Overseer" table="general_overseer" fields={[
    { key: "name", label: "Name" },
    { key: "title", label: "Title" },
    { key: "bio", label: "Bio", type: "textarea", rows: 5 },
    { key: "quote", label: "Quote / pull-out", type: "textarea", rows: 3 },
    { key: "photo_url", label: "Photo", type: "image" },
  ]} />
);

// Site Settings — JSON-backed singleton
export const SiteSettingsEdit = () => {
  const fields = [
    ["siteName", "Site name"], ["tagline", "Tagline"], ["themeVerse", "Theme verse"],
    ["email", "Contact email"], ["phone", "Phone"],
    ["instagram", "Instagram handle"], ["facebook", "Facebook handle"],
    ["youtube", "YouTube handle"],
    ["payment_button_label", "Registration · Payment button label"],
    ["payment_instructions", "Registration · Payment instructions (shown to registrants)"],
    ["payment_yec_url", "Registration · YEC payment link"],
    ["registration_fee_yec", "Registration · YEC fee (e.g. ₦5,000)"],
    ["payment_ssc_url", "Registration · SSC payment link"],
    ["registration_fee_ssc", "Registration · SSC fee"],
    ["payment_nss_url", "Registration · NSS payment link"],
    ["registration_fee_nss", "Registration · NSS fee"],
    ["paystack_secret_key", "Paystack secret key (used to verify webhooks)"],
  ] as const;
  const secretKeys = new Set(["paystack_secret_key"]);
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: row } = await supabase.from("site_settings").select("*").eq("id", 1).maybeSingle();
      setData((row as any)?.data ?? {});
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({ id: 1, data });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  if (loading) return <Loader2 className="animate-spin" />;
  return (
    <div>
      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Site Settings</h1>
      <p className="text-muted-foreground text-sm mb-6">Global text and contact details shown across the site.</p>
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        {fields.map(([k, l]) => (
          <div key={k}>
            <label className="text-sm font-medium block mb-1.5">{l}</label>
            <input value={data[k] ?? ""} onChange={(e) => setData({ ...data, [k]: e.target.value })}
              className="w-full border border-border rounded-lg px-3 py-2 bg-background" />
          </div>
        ))}
        <div className="flex justify-end pt-2">
          <button onClick={save} disabled={saving} className="bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ CONTENT - COLLECTIONS ============
export const ProgramsEdit = () => (
  <CollectionEditor title="Programs" table="programs" fields={[
    { key: "title", label: "Title" },
    { key: "icon", label: "Icon (lucide name)" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "image_url", label: "Image", type: "image" },
  ]} />
);
export const MinistriesEdit = () => (
  <CollectionEditor title="Ministries" table="ministries" fields={[
    { key: "title", label: "Title" },
    { key: "icon", label: "Icon (lucide name)" },
    { key: "description", label: "Description", type: "textarea" },
  ]} />
);
export const EventsEdit = () => (
  <CollectionEditor title="Events" table="events" fields={[
    { key: "tag", label: "Tag (YEC / SSC / NSS)" },
    { key: "title", label: "Title" },
    { key: "badge", label: "Badge (optional, e.g. anniversary)" },
    { key: "date", label: "Date" },
    { key: "location", label: "Location" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "image_url", label: "Image", type: "image" },
  ]} />
);
export const HistoryEdit = () => (
  <CollectionEditor title="History Timeline" table="history_milestones" fields={[
    { key: "year", label: "Year" },
    { key: "theme", label: "Theme" },
    { key: "description", label: "Description", type: "textarea" },
  ]} />
);
export const LeadershipEdit = () => (
  <CollectionEditor title="Leadership" table="leadership" fields={[
    { key: "group_name", label: "Group (Council Chairman / National Executives / State Coordinators)" },
    { key: "name", label: "Name" },
    { key: "role", label: "Role" },
    { key: "bio", label: "Bio", type: "textarea" },
    { key: "photo_url", label: "Photo", type: "image" },
  ]} />
);
export const LivestreamEdit = () => (
  <CollectionEditor title="Live Stream Links" table="livestream_links" fields={[
    { key: "platform", label: "Platform" },
    { key: "handle", label: "Handle" },
    { key: "url", label: "URL" },
  ]} />
);
export const FeaturedTestimoniesEdit = () => (
  <CollectionEditor title="Featured Testimonies" table="featured_testimonies" fields={[
    { key: "name", label: "Name" },
    { key: "location", label: "Location" },
    { key: "quote", label: "Quote", type: "textarea" },
  ]} />
);

// ============ DASHBOARD ============
export const Dashboard = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    (async () => {
      const tables = ["prayer_requests", "testimony_submissions", "event_registrations", "contact_messages", "newsletter_subscribers"];
      const result: Record<string, number> = {};
      await Promise.all(tables.map(async (t) => {
        const { count } = await supabase.from(t as any).select("*", { count: "exact", head: true });
        result[t] = count ?? 0;
      }));
      setCounts(result);
    })();
  }, []);
  const cards = [
    ["Prayer Requests", "prayer_requests", "/admin/inbox/prayer"],
    ["Testimonies", "testimony_submissions", "/admin/inbox/testimonies"],
    ["Registrations", "event_registrations", "/admin/inbox/registrations"],
    ["Contact", "contact_messages", "/admin/inbox/contact"],
    ["Newsletter", "newsletter_subscribers", "/admin/inbox/newsletter"],
  ] as const;
  return (
    <div>
      <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Welcome</h1>
      <p className="text-muted-foreground text-sm mb-6">Manage submissions and edit every section of the public site.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(([label, key, href]) => (
          <a key={key} href={href} className="bg-card border border-border rounded-lg p-5 hover:shadow-medium transition-shadow">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="font-serif text-3xl font-bold mt-2">{counts[key] ?? "—"}</p>
          </a>
        ))}
      </div>
    </div>
  );
};
