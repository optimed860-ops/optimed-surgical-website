"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";
import { ArrowRight, ChevronDown, Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NAV } from "@/content/site";
import { useBasket, useHydrated } from "@/features/quote/use-basket";

export type NavCategory = { name: string; slug: string; productCount: number };

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/products") return pathname.startsWith("/products") || pathname.startsWith("/categories");
  return pathname === href || pathname.startsWith(`${href}/`);
}

// Smooth hover: colour change plus an underline that grows from the left.
// The overrides cancel the default grey box and "transition-all" from the UI kit.
const linkClass =
  "relative inline-flex h-10 items-center rounded-none bg-transparent px-4 py-0 text-[0.9375rem] font-medium text-navy-800 transition-colors duration-150 ease-out outline-none hover:bg-transparent hover:text-cyan-700 focus:bg-transparent focus-visible:ring-0 focus-visible:text-cyan-700 data-active:bg-transparent data-open:bg-transparent data-open:text-cyan-700 data-open:hover:bg-transparent data-open:focus:bg-transparent aria-[current=page]:text-cyan-700 after:pointer-events-none after:absolute after:inset-x-4 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-cyan-500 after:transition-transform after:duration-200 after:ease-out after:content-[''] hover:after:scale-x-100 focus-visible:after:scale-x-100 data-open:after:scale-x-100 aria-[current=page]:after:scale-x-100 motion-reduce:after:transition-none";

export function DesktopNav({ categories }: { categories: NavCategory[] }) {
  return (
    <Suspense fallback={<DesktopNavView categories={categories} pathname="" />}>
      <DesktopNavWithPath categories={categories} />
    </Suspense>
  );
}

function DesktopNavWithPath({ categories }: { categories: NavCategory[] }) {
  return <DesktopNavView categories={categories} pathname={usePathname()} />;
}

function DesktopNavView({ categories, pathname }: { categories: NavCategory[]; pathname: string }) {
  return (
    <NavigationMenu className="hidden lg:flex" aria-label="Main" delayDuration={0} skipDelayDuration={300}>
      <NavigationMenuList className="gap-0">
        {NAV.map((item) =>
          item.href === "/products" && categories.length > 0 ? (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuTrigger
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={linkClass}
              >
                {item.label}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[30rem] grid-cols-2 gap-1 p-3">
                  {categories.map((category) => (
                    <li key={category.slug}>
                      <NavigationMenuLink asChild>
                        <Link href={`/categories/${category.slug}`} className="block rounded-md px-3 py-2.5 hover:bg-steel">
                          <span className="block text-sm font-semibold text-ink">{category.name}</span>
                          <span className="block text-xs text-slate-text">
                            {category.productCount} {category.productCount === 1 ? "product" : "products"}
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                  <li className="col-span-2 mt-1 flex items-center justify-between border-t border-line px-3 pt-3 pb-1 text-sm">
                    <NavigationMenuLink asChild>
                      <Link href="/products" className="font-semibold text-navy-800 hover:underline">
                        All products
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link href="/catalogue" className="text-cyan-700 hover:underline">
                        Request the full catalogue
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          ) : (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink asChild>
                <Link href={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined} className={linkClass}>
                  {item.label}
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          ),
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export function QuoteHeaderButton() {
  const items = useBasket();
  const hydrated = useHydrated();
  const count = hydrated ? items.length : 0;

  return (
    <Link
      href="/quote"
      aria-label={count ? `Request a quote, ${count} ${count === 1 ? "product" : "products"} in your list` : "Request a quote"}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-navy-800 px-5 text-[0.9375rem] font-semibold text-white shadow-[0_10px_20px_-12px_rgb(3_40_106/0.7)] transition-colors hover:bg-navy-950 sm:px-6"
    >
      <span className="hidden sm:inline">Request a Quote</span>
      <span className="sm:hidden">Quote</span>
      {count > 0 ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-cyan-500 px-1.5 text-[0.75rem] leading-none font-semibold text-white">
          {count}
        </span>
      ) : (
        <ArrowRight className="hidden size-4 sm:block" aria-hidden />
      )}
    </Link>
  );
}

export function MobileNav({ categories }: { categories: NavCategory[] }) {
  return (
    <Suspense fallback={<MobileNavView categories={categories} pathname="" />}>
      <MobileNavWithPath categories={categories} />
    </Suspense>
  );
}

function MobileNavWithPath({ categories }: { categories: NavCategory[] }) {
  return <MobileNavView categories={categories} pathname={usePathname()} />;
}

function MobileNavView({ categories, pathname }: { categories: NavCategory[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setProductsOpen(false);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-lg" className="size-11 lg:hidden" aria-label="Open menu">
          <Menu aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(22rem,100vw)] gap-0 overflow-y-auto p-0">
        <SheetHeader className="border-b border-line px-6 py-5">
          <SheetTitle className="font-wide text-base text-navy-800">Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Mobile" className="px-3 py-4">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                {item.href === "/products" && categories.length > 0 ? (
                  // Products opens a list of categories; it does not navigate by itself.
                  <button
                    type="button"
                    onClick={() => setProductsOpen((v) => !v)}
                    aria-expanded={productsOpen}
                    aria-controls="mobile-products"
                    data-active={isActive(pathname, item.href) || undefined}
                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-lg font-medium text-ink hover:bg-steel data-[active]:text-cyan-700"
                  >
                    {item.label}
                    <ChevronDown className={`size-5 text-slate-text transition-transform duration-200 ${productsOpen ? "rotate-180" : ""}`} aria-hidden />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(pathname, item.href) ? "page" : undefined}
                    className="block rounded-md px-3 py-3 text-lg font-medium text-ink hover:bg-steel aria-[current=page]:text-cyan-700"
                  >
                    {item.label}
                  </Link>
                )}
                {item.href === "/products" && categories.length > 0 && productsOpen ? (
                  <ul id="mobile-products" className="mb-2 ml-3 border-l-2 border-line pl-3">
                    <li>
                      <Link
                        href="/products"
                        onClick={() => setOpen(false)}
                        className="block rounded-md px-3 py-2 text-[0.9375rem] font-semibold text-navy-800 hover:text-cyan-700"
                      >
                        All products
                      </Link>
                    </li>
                    {categories.map((category) => (
                      <li key={category.slug}>
                        <Link
                          href={`/categories/${category.slug}`}
                          onClick={() => setOpen(false)}
                          className="block rounded-md px-3 py-2 text-[0.9375rem] text-slate-text hover:text-ink"
                        >
                          {category.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto border-t border-line p-6">
          <Button asChild size="xl" className="w-full">
            <Link href="/quote" onClick={() => setOpen(false)}>
              Request a quote
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
