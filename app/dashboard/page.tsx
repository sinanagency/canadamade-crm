import { createClient } from '@/lib/supabase/server'
import { Users, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'

async function getMetrics() {
  const supabase = await createClient()
  
  // Get total contacts
  const { count: totalContacts } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })

  // Get hot leads
  const { count: hotLeads } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .gte('lead_score', 7)

  // Get total orders
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  return {
    totalContacts: totalContacts || 0,
    hotLeads: hotLeads || 0,
    totalOrders: totalOrders || 0,
  }
}

export default async function DashboardPage() {
  const metrics = await getMetrics()

  const stats = [
    { name: 'Total Contacts', value: metrics.totalContacts, icon: Users, color: 'bg-blue-500' },
    { name: 'Hot Leads', value: metrics.hotLeads, icon: TrendingUp, color: 'bg-canadared-500' },
    { name: 'Total Orders', value: metrics.totalOrders, icon: ShoppingBag, color: 'bg-green-500' },
    { name: 'Revenue (AED)', value: '0', icon: DollarSign, color: 'bg-purple-500' },
  ]

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your CanadaMade CRM. Here's what's happening today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="monday-card p-6">
            <div className="flex items-center">
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent activity and charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent contacts */}
        <div className="monday-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Contacts</h2>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-canadared-100 text-canadared-600 font-semibold">
                  {String.fromCharCode(64 + i)}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">Sample Contact {i}</p>
                  <p className="text-xs text-gray-500">Added today</p>
                </div>
                <span className="status-badge bg-green-100 text-green-800">Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="monday-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-canadared-500 hover:bg-canadared-50 transition-colors text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Add Contact</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-canadared-500 hover:bg-canadared-50 transition-colors text-center">
              <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">New Order</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-canadared-500 hover:bg-canadared-50 transition-colors text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">View Reports</p>
            </button>
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-canadared-500 hover:bg-canadared-50 transition-colors text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Track Sales</p>
            </button>
          </div>
        </div>
      </div>

      {/* Gulf Expo Notice */}
      <div className="mt-6 monday-card p-6 bg-gradient-to-r from-canadared-50 to-white border-l-4 border-canadared-500">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-canadared-500 text-white text-xl">
              🍁
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Gulf Expo 2026</h3>
            <p className="mt-1 text-sm text-gray-600">
              Get ready for the Gulf Expo! Make sure your team is prepared to capture leads and engage with visitors.
            </p>
            <div className="mt-4">
              <button className="inline-flex items-center px-4 py-2 bg-canadared-500 text-white rounded-lg hover:bg-canadared-600 transition-colors">
                View Expo Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
