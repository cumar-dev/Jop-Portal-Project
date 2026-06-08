export const applicationsTable = {
  shell:
    'overflow-hidden rounded-xl border border-border bg-card shadow-sm ring-1 ring-slate-900/[0.04] dark:ring-white/[0.06]',
  toolbar:
    'flex flex-col gap-4 border-b border-border bg-card px-5 py-4 sm:flex-row sm:items-center sm:justify-between',
  toolbarTitle: 'text-sm font-semibold text-ink',
  toolbarMeta: 'text-xs text-muted',
  scroll: 'overflow-x-auto',
  table: 'w-full min-w-[720px] border-collapse text-left text-sm',
  tableCompact: 'w-full min-w-[52rem] table-fixed border-collapse text-left text-sm',
  thead: 'border-b border-border bg-table-head',
  th: 'px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted',
  thCompact: 'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted',
  tbody: 'divide-y divide-border',
  row: 'transition-colors hover:bg-subtle/80',
  td: 'px-6 py-4 align-middle',
  tdCompact: 'max-w-0 overflow-hidden px-4 py-3.5 align-middle',
  footer: 'border-t border-border bg-subtle/80 px-6 py-3 text-xs text-muted',
  primary: 'font-semibold text-ink',
  secondary: 'mt-0.5 text-xs leading-relaxed text-muted',
  muted: 'text-muted',
} as const
