"use client";

import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { notFound as nextNotFound, useParams, usePathname, useSearchParams } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type RouteOptions = {
  component?: () => ReactNode;
  loader?: (context: { params: Record<string, string> }) => unknown;
  notFoundComponent?: () => ReactNode;
  [key: string]: unknown;
};

export function createFileRoute(_path: string) {
  return (options: RouteOptions) => ({
    options,
    useLoaderData() {
      const params = useParams<Record<string, string>>();
      const segments = Array.isArray(params.slug) ? params.slug : [];
      return options.loader?.({ params: { ...params, id: params.id ?? segments.at(-1) ?? "" } }) as any;
    },
    useSearch() {
      const search = useSearchParams();
      return Object.fromEntries(search.entries()) as any;
    },
  });
}

type CompatLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<NextLinkProps, "href"> & {
    to: string;
    search?: Record<string, string | number | undefined>;
    children?: ReactNode;
  };

export function Link({ to, search, ...props }: CompatLinkProps) {
  const query = search
    ? `?${new URLSearchParams(Object.entries(search).filter(([, value]) => value != null).map(([key, value]) => [key, String(value)])).toString()}`
    : "";
  return <NextLink href={`${to}${query}`} {...props} />;
}

export function useRouterState<T = { location: { pathname: string } }>(options?: {
  select?: (state: { location: { pathname: string } }) => T;
}) {
  const pathname = usePathname();
  const state = { location: { pathname } };
  return options?.select ? options.select(state) : (state as T);
}

export const notFound = nextNotFound;
