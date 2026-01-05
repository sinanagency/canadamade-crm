'use client'

import { getLeadStatusColor, getLeadScoreColor, formatDate } from '@/lib/utils'
import { Mail, Phone, Building2, MapPin } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  lead_status: string
  lead_score: number
  city: string | null
  created_at: string
}

interface CRMBoardViewProps {
  contacts: Contact[]
}

const columns = [
  { id: 'new', title: 'New Leads', color: 'border-blue-400' },
  { id: 'contacted', title: 'Contacted', color: 'border-purple-400' },
  { id: 'qualified', title: 'Qualified', color: 'border-orange-400' },
  { id: 'negotiation', title: 'Negotiation', color: 'border-yellow-400' },
  { id: 'won', title: 'Won', color: 'border-green-400' },
]

export function CRMBoardView({ contacts }: CRMBoardViewProps) {
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnContacts = contacts.filter(c => c.lead_status === column.id)
        
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            {/* Column header */}
            <div className={`monday-card p-4 border-t-4 ${column.color} mb-3`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">
                  {columnContacts.length}
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-3">
              {columnContacts.length === 0 ? (
                <div className="monday-card p-4 text-center text-gray-400 text-sm">
                  No contacts in this stage
                </div>
              ) : (
                columnContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="monday-card p-4 cursor-pointer hover:shadow-monday-hover transition-shadow"
                  >
                    {/* Name and score */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                        {contact.company && (
                          <p className="text-sm text-gray-600 mt-1">{contact.company}</p>
                        )}
                      </div>
                      <div
                        className={`${getLeadScoreColor(contact.lead_score)} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold`}
                      >
                        {contact.lead_score}
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.city && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          <span>{contact.city}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <span>Added {formatDate(contact.created_at)}</span>
                      <span className={`status-badge ${getLeadStatusColor(contact.lead_status)}`}>
                        {contact.lead_status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add card button */}
            <button className="w-full mt-3 p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-canadared-500 hover:text-canadared-500 transition-colors">
              + Add Contact
            </button>
          </div>
        )
      })}
    </div>
  )
}
