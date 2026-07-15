import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TableProperties, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState('')
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await signIn(email, password)
    if (error) {
      setError('Credenciais inválidas. Verifique seu email e senha.')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetLoading(true)
    setResetError('')
    setResetSuccess(false)

    const { error } = await resetPassword(resetEmail)
    if (error) {
      setResetError('Erro ao solicitar recuperação. Verifique o email.')
    } else {
      setResetSuccess(true)
      setTimeout(() => {
        setIsResetDialogOpen(false)
        setResetSuccess(false)
        setResetEmail('')
      }, 3000)
    }
    setResetLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <TableProperties className="w-7 h-7 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Repress</CardTitle>
          <CardDescription>Central de Pedidos - Faça login para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-xs font-normal text-slate-500 hover:text-slate-900"
                    >
                      Resetar senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Recuperação de Senha</DialogTitle>
                      <DialogDescription>
                        Informe seu email para receber um link de redefinição de senha.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                      {resetError && <p className="text-sm text-destructive">{resetError}</p>}
                      {resetSuccess && (
                        <p className="text-sm text-emerald-600">
                          Email de recuperação enviado com sucesso!
                        </p>
                      )}
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline" disabled={resetLoading}>
                            Cancelar
                          </Button>
                        </DialogClose>
                        <Button type="submit" disabled={resetLoading || resetSuccess}>
                          {resetLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Enviar
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
