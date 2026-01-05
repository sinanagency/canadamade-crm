'use client'

import { useState } from 'react'
import { getLeadStatusColor, getLeadScoreColor, formatDate } from '@/lib/utils'
import { ArrowUpDown, Mail, Phone, MoreHorizontal } from 'lucide-react'

interface Contact {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  type: string | null
  lead_status: string
  lead_score: number
  city: string | null
  country: string | null
  created_at: string
}

interface CRMTableViewProps {
  contacts: Contact[]
}

export function CRMTableView({ contacts }: CRMTableViewProps) {
  const [sortField, setSortField] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedContacts = [...contacts].sort((a, b) => {
    const aValue = a[sortField as keyof Contact] || ''
    const bValue = b[sortField as keyof Contact] || ''
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const toggleSelect = (id: string) => {
    setSelectedContacts(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedContacts(
      selectedContacts.length === contacts.length
        ? []
        : contacts.map(c => c.id)
    )
  }

  return (
    <div className="monday-card">
      {/* Table header with filters */}
      {selectedContacts.length > 0 && (
        <div className="px-6 py-3 bg-canadared-50 border-b border-canadared-100">
          <div className="flex items-center justify-between">
            <p className="text-sm text-canadared-900">
              {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 text-sm bg-white border border-canadared-200 text-canadared-700 rounded-md hover:bg-canadared-100 transition-colors">
                Update Status
              </button>
              <button className="px-3 py-1.5 text-sm bg-white border border-canadared-200 text-canadared-700 rounded-md hover:bg-canadared-100 transition-colors">
                Assign To
              </button>
              <button className="px-3 py-1.5 text-sm bg-white border border-red-200 text-red-700 rounded-md hover:bg-red-100 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedContacts.length === contacts.length && contacts.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-canadared-500 focus:ring-canadared-500"
                />
              </th>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Contact
              </th>
              <th
                onClick={() => handleSort('company')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Company
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </th>
              <th
                onClick={() => handleSort('type')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Type
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </th>
              <th
                onClick={() => handleSort('lead_score')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Score
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </th>
              <th
                onClick={() => handleSort('lead_status')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Location
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  Added
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedContacts.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                  No contacts found. Add your first contact to get started!
                </td>
              </tr>
            ) : (
              sortedContacts.map((contact) => (
                <tr
                  key={contact.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedContacts.includes(contact.id) ? 'bg-canadared-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                      className="rounded border-gray-300 text-canadared-500 focus:ring-canadared-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-canadared-100 text-canadared-600 font-semibold text-sm mr-3">
                        {contact.name.charAt(0)}
                      </div>
                      <div className="font-medium text-gray-900">{contact.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {contact.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1.5 text-gray-400" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1.5 text-gray-400" />
                          {contact.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {contact.company || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {contact.type && (
                      <span className="status-badge bg-blue-100 text-blue-800">
                        {contact.type}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className={`${getLeadScoreColor(contact.lead_score)} h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold`}
                    >
                      {contact.lead_score}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`status-badge ${getLeadStatusColor(contact.lead_status)}`}>
                      {contact.lead_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {contact.city && contact.country
                      ? `${contact.city}, ${contact.country}`
                      : contact.city || contact.country || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(contact.created_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {contacts.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium">{sortedContacts.length}</span> contacts
          </p>
          <div className="flex space-x-2">
            <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
              Previous
            </button>
            <button className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
