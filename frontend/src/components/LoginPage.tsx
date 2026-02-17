import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'sonner'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!username) {
      toast.error('请输入用户名')
      return
    }

    if (!password) {
      toast.error('请输入密码')
      return
    }

    setLoading(true)
    const { error } = await signIn(username, password)
    setLoading(false)

    if (error) {
      const message = error instanceof Error ? error.message : '登录失败'
      toast.error(message)
      return
    }

    toast.success('登录成功')
    navigate('/')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleLogin()
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-8">登录 EchoMark</h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              用户名
            </label>
            <Input
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              密码
            </label>
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          还没有账号？{' '}
          <Link to="/register" className="text-primary hover:underline">
            注册
          </Link>
        </p>
      </div>
    </div>
  )
}
