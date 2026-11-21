import { Logo } from "@/components/shared/logo";
import { getCategories } from "@/features/catalogue/queries";
import { DesktopNav, MobileNav, QuoteHeaderButton, type NavCategory } from "./header-client";
import { HeaderShell } from "./header-shell";

export async function SiteHeader() {
  const categories = await getCategories();
  const nav: NavCategory[] = categories.map(({ name, slug, productCount }) => ({ name, slug, productCount }));

  return (
    <HeaderShell>
      <div className="container-page grid h-[5rem] grid-cols-[auto_1fr_auto] items-center gap-6">
        <Logo />
        <div className="flex justify-center">
          <DesktopNav categories={nav} />
        </div>
        <div className="flex items-center gap-2">
          <QuoteHeaderButton />
          <MobileNav categories={nav} />
        </div>
      </div>
    </HeaderShell>
  );
}
