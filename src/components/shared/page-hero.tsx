import { Breadcrumbs, type Crumb } from "./breadcrumbs";

/** Inner-page header: breadcrumb, expanded title, short lead. */
export function PageHero({
  crumbs,
  title,
  lead,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  lead?: string | null;
  children?: React.ReactNode;
}) {
  return (
    <section className="border-b border-line bg-white">
      <div className="container-page pt-8 pb-12 lg:pt-10 lg:pb-16">
        <Breadcrumbs items={crumbs} />
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="text-h1">{title}</h1>
            {lead ? <p className="measure mt-5 text-lead text-slate-text">{lead}</p> : null}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
