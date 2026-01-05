import { createClient } from '@/lib/supabase/server'
import { CRMBoardView } from '@/components/crm/board-view'
import { CRMTableView } from '@/components/crm/table-view'
import { LayoutGrid, Table as TableIcon, Plus } from 'lucide-react'

export default async function CRMPage({
  searchParams,
}: {
  searchParams: { view?: string }
}) {
  const supabase = await createClient()
  
  // Fetch contacts with their data
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .order('created_at', { ascending: false })

  const view = searchParams.view || 'board'

  return (
    <div>
      {/* Header with view toggle */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CRM & Leads</h1>
          <p className="mt-2 text-gray-600">
            Manage your contacts and track leads through the pipeline
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* View toggle */}
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <a
              href="?view=board"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'board'
                  ? 'bg-canadared-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Board
            </a>
            <a
              href="?view=table"
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'table'
                  ? 'bg-canadared-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </a>
          </div>

          {/* Add contact button */}
          <button className="inline-flex items-center px-4 py-2.5 bg-canadared-500 text-white rounded-lg hover:bg-canadared-600 transition-colors font-medium">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="monday-card p-4">
          <p className="text-sm text-gray-600">Total Contacts</p>
          <p className="text-2xl font-bold text-gray-900">{contacts?.length || 0}</p>
        </div>
        <div className="monday-card p-4">
          <p className="text-sm text-gray-600">Hot Leads</p>
          <p className="text-2xl font-bold text-canadared-600">
            {contacts?.filter(c => c.lead_score >= 7).length || 0}
          </p>
        </div>
        <div className="monday-card p-4">
          <p className="text-sm text-gray-600">New This Week</p>
          <p className="text-2xl font-bold text-green-600">
            {contacts?.filter(c => {
              const createdAt = new Date(c.created_at)
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return createdAt > weekAgo
            }).length || 0}
          </p>
        </div>
        <div className="monday-card p-4">
          <p className="text-sm text-gray-600">Qualified</p>
          <p className="text-2xl font-bold text-blue-600">
            {contacts?.filter(c => c.lead_status === 'qualified').length || 0}
          </p>
        </div>
      </div>

      {/* Main content - Board or Table view */}
      {view === 'board' ? (
        <CRMBoardView contacts={contacts || []} />
      ) : (
        <CRMTableView contacts={contacts || []} />
      )}
    </div>
  )
}
