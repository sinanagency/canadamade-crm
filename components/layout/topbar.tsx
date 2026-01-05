'use client'

import { Search, Bell, HelpCircle, Plus } from 'lucide-react'

export function Topbar() {
  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-canadared-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center space-x-4">
        {/* Quick Add */}
        <button className="inline-flex items-center px-4 py-2 bg-canadared-500 text-white rounded-lg hover:bg-canadared-600 transition-colors">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </button>

        {/* Help */}
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <HelpCircle className="h-5 w-5" />
        </button>

        {/* Notifications */}
        <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </div>
  )
}
