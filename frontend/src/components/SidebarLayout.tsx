import Head from 'next/head';
import React from 'react';

interface SidebarLayoutProps {
  title: string;
  /** Contents of the left <aside> (header, nav, profile/logout). */
  sidebar: React.ReactNode;
  /** Contents of the top <header> bar (laid out as a flex row). */
  topbar: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared application shell for the authenticated backoffice and instructor
 * portals. Consolidates the previously duplicated sidebar/topbar scaffolding
 * (see REFACTOR_PLAN).
 */
export default function SidebarLayout({ title, sidebar, topbar, children }: SidebarLayoutProps) {
  return (
    <div className="min-h-screen flex bg-surface font-sans">
      <Head>
        <title>{title}</title>
      </Head>

      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 shrink-0">
        {sidebar}
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white px-8 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          {topbar}
        </header>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
