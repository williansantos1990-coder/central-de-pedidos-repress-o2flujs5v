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

interface CascadingFilterProps {
  label: string
  placeholder: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  emptyMessage?: string
  width?: string
}

export function CascadingFilter({
  label,
  placeholder,
  options,
  selected,
  onChange,
  emptyMessage = 'Nenhuma opção disponível',
  width = 'w-[220px]',
}: CascadingFilterProps) {
  const [open, setOpen] = useState(false)
  const noOptions = options.length === 0

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
        {label}
        {noOptions && <span className="text-[10px] text-orange-500 font-normal">(vazio)</span>}
      </span>
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(width, 'h-9 justify-between font-normal')}
            >
              {selected.length === 0 ? (
                <span className="text-muted-foreground">
                  {noOptions ? 'Sem opções' : placeholder}
                </span>
              ) : selected.length <= 2 ? (
                <span className="truncate text-slate-800">{selected.join(', ')}</span>
              ) : (
                <span className="truncate text-slate-800">{selected.length} selecionados</span>
              )}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className={cn(width, 'p-0')} align="start">
            <Command>
              <CommandList>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
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
          <Button variant="ghost" onClick={() => onChange([])} className="h-9 px-2 text-xs">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
