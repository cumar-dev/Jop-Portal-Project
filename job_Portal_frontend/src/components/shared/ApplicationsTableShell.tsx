import type { ReactNode } from 'react'
import { applicationsTable } from './applicationsTableStyles'

interface ApplicationsTableShellProps {
  title?: string
  meta?: string
  toolbar?: ReactNode
  footer?: ReactNode
  children: ReactNode
}

export function ApplicationsTableShell({
  title = 'Applications',
  meta,
  toolbar,
  footer,
  children,
}: ApplicationsTableShellProps) {
  return (
    <div className={applicationsTable.shell}>
      {(toolbar || title) && (
        <div className={applicationsTable.toolbar}>
          <div>
            <p className={applicationsTable.toolbarTitle}>{title}</p>
            {meta && <p className={applicationsTable.toolbarMeta}>{meta}</p>}
          </div>
          {toolbar}
        </div>
      )}
      {children}
      {footer && <div className={applicationsTable.footer}>{footer}</div>}
    </div>
  )
}
