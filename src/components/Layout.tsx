import { useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  TableProperties,
  FileUp,
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Relatórios', href: '/reports', icon: TableProperties },
    { name: 'Importar Dados', href: '/import', icon: FileUp },
  ]

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard Operacional'
      case '/reports':
        return 'Separação e Data Segura'
      case '/import':
        return 'Gestão de Dados'
      default:
        return 'Central de Pedidos'
    }
  }

  const NavLinks = ({ mobile = false }) => (
    <div className={cn('flex flex-col gap-2', mobile ? 'mt-6' : '')}>
      {navigation.map((item) => {
        const isActive = location.pathname === item.href
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setIsMobileMenuOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
              isActive
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-slate-600 hover:bg-slate-100 hover:text-primary',
            )}
          >
            <item.icon
              className={cn(
                'w-5 h-5 transition-transform duration-200',
                isActive
                  ? 'text-primary-foreground'
                  : 'text-slate-400 group-hover:text-primary group-hover:scale-110',
              )}
            />
            {item.name}
          </Link>
        )
      })}
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200 shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-inner">
              <TableProperties className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800 tracking-tight">GiroLógico</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Principal
          </p>
          <NavLinks />
        </div>
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-3 border border-slate-100">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-700">Sistema Online</span>
              <span className="text-[10px] text-slate-500">Última sinc: Hoje, 08:30</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="w-5 h-5 text-slate-600" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="h-16 flex items-center px-6 border-b border-slate-100">
                  <span className="font-bold text-lg text-primary">GiroLógico</span>
                </div>
                <div className="px-4">
                  <NavLinks mobile />
                </div>
              </SheetContent>
            </Sheet>

            <h1 className="text-xl font-semibold text-slate-800 animate-fade-in">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Buscar pedido..."
                className="w-64 pl-9 bg-slate-50 border-slate-200 focus-visible:ring-primary/20 h-9"
              />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="relative text-slate-600 hover:text-primary hover:bg-primary/5 rounded-full"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">
                      {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span>Forçar Sincronização</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    signOut()
                    navigate('/login')
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50/50 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full animate-slide-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
