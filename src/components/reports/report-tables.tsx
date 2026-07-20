import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { Pedve012Record } from '@/services/pedve012'
import type { Pedve005Record } from '@/services/pedve005'
import type { TransportadoraRecord } from '@/services/transportadoras'
import {
  parsePBDate,
  formatDate,
  formatDateTime,
  calcularDataSeparacao,
  calcularDataSegura,
  getStatusBadgeClass,
} from '@/lib/order-utils'
import { calcularDiasAtrasos } from '@/lib/dias-atrasos'

interface Pedve012TableProps {
  items: Pedve012Record[]
  pedve005: Pedve005Record[]
  transportadoras: TransportadoraRecord[]
}

export function Pedve012Table({ items, pedve005, transportadoras }: Pedve012TableProps) {
  const p005Map = useMemo(() => {
    const m = new Map<string, Pedve005Record>()
    pedve005.forEach((r) => {
      if (r.pedido) m.set(r.pedido, r)
    })
    return m
  }, [pedve005])

  const transpByDestino = useMemo(() => {
    const m = new Map<string, TransportadoraRecord>()
    transportadoras.forEach((t) => {
      if (t.destino) m.set(t.destino.toUpperCase().trim(), t)
    })
    return m
  }, [transportadoras])

  const transpByPadrao = useMemo(() => {
    const m = new Map<string, TransportadoraRecord>()
    transportadoras.forEach((t) => {
      if (t.padrao_do_exceda) m.set(t.padrao_do_exceda.toUpperCase().trim(), t)
    })
    return m
  }, [transportadoras])

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50 hover:bg-slate-50">
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Pedido
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Situação
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Cliente
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Grupo
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Cidade
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Tipo de Entrega
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Transportadora
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap text-right">
            Prazo (dias)
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Emissão
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Envio/Liberação
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Prev. Entr.
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap text-right">
            Dias Atrasos
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Data Sep.
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Data Segura
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap text-right">
            Nr Itens
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={15} className="text-center text-slate-400 py-8">
              Nenhum registro encontrado.
            </TableCell>
          </TableRow>
        )}
        {items.map((r) => {
          const p005 = p005Map.get(r.pedido)
          const cidadeKey = (p005?.cidade || r.cidade || '').toUpperCase().trim()
          const transp = transpByDestino.get(cidadeKey) || transpByPadrao.get(cidadeKey)
          const prevEntrParsed = parsePBDate(r.prev_entr)
          const envioLibParsed = parsePBDate(r.envio_liberacao)
          const prazo = transp?.prazo_de_entrega
          const dataSep =
            prevEntrParsed && prazo ? calcularDataSeparacao(prevEntrParsed, prazo) : null
          const dataSegura = dataSep ? calcularDataSegura(dataSep) : null
          const diasAtrasos = calcularDiasAtrasos(dataSep, envioLibParsed)

          return (
            <TableRow key={r.id} className="hover:bg-slate-50/70 transition-colors">
              <TableCell className="text-sm font-medium text-slate-800 whitespace-nowrap">
                {r.pedido}
              </TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {r.situacao && (
                  <Badge className={getStatusBadgeClass(r.situacao)} variant="secondary">
                    {r.situacao}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm text-slate-700 whitespace-nowrap">
                {r.cliente}
              </TableCell>
              <TableCell className="text-sm text-slate-700 whitespace-nowrap">{r.grupo}</TableCell>
              <TableCell className="text-sm text-slate-700 whitespace-nowrap">
                {p005?.cidade || r.cidade}
              </TableCell>
              <TableCell className="text-sm text-slate-700 whitespace-nowrap">
                {r.tipo_entrega}
              </TableCell>
              <TableCell className="text-sm text-slate-700 whitespace-nowrap">
                {transp?.transportadora}
              </TableCell>
              <TableCell className="text-sm text-slate-700 whitespace-nowrap text-right">
                {prazo ?? ''}
              </TableCell>
              <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                {formatDate(parsePBDate(r.emissao))}
              </TableCell>
              <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                {formatDateTime(envioLibParsed)}
              </TableCell>
              <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                {formatDate(prevEntrParsed)}
              </TableCell>
              <TableCell className="text-sm text-slate-700 whitespace-nowrap text-right font-medium">
                {diasAtrasos !== null ? diasAtrasos : ''}
              </TableCell>
              <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                {formatDate(dataSep)}
              </TableCell>
              <TableCell className="text-sm text-slate-600 whitespace-nowrap">
                {formatDate(dataSegura)}
              </TableCell>
              <TableCell className="text-sm text-slate-700 whitespace-nowrap text-right">
                {r.nr_itens ?? ''}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

interface Pedve005TableProps {
  items: Pedve005Record[]
}

export function Pedve005Table({ items }: Pedve005TableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-slate-50 hover:bg-slate-50">
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Pedido
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Cliente
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Status
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Cidade
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Bairro
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Tipo de Entrega
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Emissão
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Prev. Entr.
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap text-right">
            Valor (R$)
          </TableHead>
          <TableHead className="text-xs font-semibold text-slate-600 whitespace-nowrap text-right">
            Qtd. Itens
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={10} className="text-center text-slate-400 py-8">
              Nenhum registro encontrado.
            </TableCell>
          </TableRow>
        )}
        {items.map((r) => (
          <TableRow key={r.id} className="hover:bg-slate-50/70 transition-colors">
            <TableCell className="text-sm font-medium text-slate-800 whitespace-nowrap">
              {r.pedido}
            </TableCell>
            <TableCell className="text-sm text-slate-700 whitespace-nowrap">{r.cliente}</TableCell>
            <TableCell className="text-sm whitespace-nowrap">
              {r.status && (
                <Badge className={getStatusBadgeClass(r.status)} variant="secondary">
                  {r.status}
                </Badge>
              )}
            </TableCell>
            <TableCell className="text-sm text-slate-700 whitespace-nowrap">{r.cidade}</TableCell>
            <TableCell className="text-sm text-slate-700 whitespace-nowrap">{r.bairro}</TableCell>
            <TableCell className="text-sm text-slate-700 whitespace-nowrap">
              {r.tp_entrega}
            </TableCell>
            <TableCell className="text-sm text-slate-600 whitespace-nowrap">
              {formatDate(parsePBDate(r.emissao))}
            </TableCell>
            <TableCell className="text-sm text-slate-600 whitespace-nowrap">
              {formatDate(parsePBDate(r.prev_entr))}
            </TableCell>
            <TableCell className="text-sm text-slate-700 whitespace-nowrap text-right">
              {r.vl_ped_rs != null
                ? r.vl_ped_rs.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : ''}
            </TableCell>
            <TableCell className="text-sm text-slate-700 whitespace-nowrap text-right">
              {r.qtd_itens ?? ''}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
