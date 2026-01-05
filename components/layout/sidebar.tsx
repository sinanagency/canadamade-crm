'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  MessageCircle,
  Megaphone,
  TrendingUp,
  ShoppingCart,
  Building2,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'CRM & Leads', href: '/dashboard/crm', icon: Users },
  { name: 'WhatsApp Hub', href: '/dashboard/whatsapp', icon: MessageCircle },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
  { name: 'Advertising', href: '/dashboard/advertising', icon: TrendingUp },
  { name: 'E-commerce', href: '/dashboard/ecommerce', icon: ShoppingCart },
  { name: 'Distributors', href: '/dashboard/distributors', icon: Building2 },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="monday-sidebar flex flex-col h-screen w-64 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
        <Image
          src="/logo.png"
          alt="CanadaMade"
          width={100}
          height={40}
          className="h-10 w-auto"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-canadared-50 text-canadared-600'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5',
                    isActive ? 'text-canadared-600' : 'text-gray-400'
                  )}
                />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Settings */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <Link
            href="/dashboard/settings"
            className={cn(
              'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
              pathname === '/dashboard/settings'
                ? 'bg-canadared-50 text-canadared-600'
                : 'text-gray-700 hover:bg-gray-50'
            )}
          >
            <Settings
              className={cn(
                'mr-3 h-5 w-5',
                pathname === '/dashboard/settings' ? 'text-canadared-600' : 'text-gray-400'
              )}
            />
            Settings
          </Link>
        </div>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-canadared-500 text-white text-xs font-bold mr-3">
            CM
          </div>
          <div className="flex-1 text-left">
            <div className="text-sm font-medium">CanadaMade</div>
            <div className="text-xs text-gray-500">Admin</div>
          </div>
          <LogOut className="h-4 w-4 text-gray-400" />
        </button>
      </div>
    </div>
  )
}
