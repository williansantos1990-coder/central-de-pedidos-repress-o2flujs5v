import { Card } from '@/components/ui/card'
import { FileText, Package, Truck, ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'

export interface ReportDefinition {
  id: string
  name: string
  summary: string
}

const REPORT_ICONS: Record<string, ReactNode> = {
  separacao: <FileText className="w-6 h-6 text-primary" />,
  pedidos: <Package className="w-6 h-6 text-primary" />,
  transportadoras: <Truck className="w-6 h-6 text-primary" />,
}

interface ReportListProps {
  reports: ReportDefinition[]
  onSelect: (id: string) => void
}

export function ReportList({ reports, onSelect }: ReportListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {reports.map((report) => (
        <Card
          key={report.id}
          onClick={() => onSelect(report.id)}
          className="p-6 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group animate-fade-in-up"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              {REPORT_ICONS[report.id] ?? <FileText className="w-6 h-6 text-primary" />}
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all duration-200" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">{report.name}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{report.summary}</p>
        </Card>
      ))}
    </div>
  )
}
