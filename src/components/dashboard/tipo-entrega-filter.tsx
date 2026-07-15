import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface TipoEntregaFilterProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function TipoEntregaFilter({ options, selected, onChange }: TipoEntregaFilterProps) {
  const [open, setOpen] = useState(false)

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-700">Tipo da Entrega</span>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[260px] h-9 justify-between font-normal"
            >
              {selected.length === 0 ? (
                <span className="text-muted-foreground">Todos os Tipos</span>
              ) : selected.length <= 2 ? (
                <span className="truncate text-slate-800">{selected.join(', ')}</span>
              ) : (
                <span className="truncate text-slate-800">
                  {selected.length} tipos selecionados
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[260px] p-0" align="start">
            <Command>
              <CommandList>
                <CommandEmpty>Nenhum tipo encontrado</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem key={option} value={option} onSelect={() => toggle(option)}>
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          selected.includes(option) ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {option}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {selected.length > 0 && (
          <Button variant="ghost" onClick={() => onChange([])} className="h-9 px-3 text-xs">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
