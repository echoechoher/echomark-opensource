import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'sonner'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleRegister = async () => {
    // 验证邮箱
    if (!email) {
      toast.error('请输入邮箱')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('请输入有效的邮箱地址')
      return
    }

    // 验证用户名
    if (!username) {
      toast.error('请输入用户名')
      return
    }
    if (username.length < 3) {
      toast.error('用户名至少3个字符')
      return
    }

    // 验证密码
    if (!password) {
      toast.error('请输入密码')
      return
    }
    if (password.length < 6) {
      toast.error('密码至少6位')
      return
    }
    if (password !== confirmPassword) {
      toast.error('两次密码不一致')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, username)
    setLoading(false)

    if (error) {
      toast.error(error.message || '注册失败')
      return
    }

    toast.success('注册成功，请查收邮箱确认链接')
    navigate('/login')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleRegister()
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <h1 className="text-2xl font-bold text-center mb-8">注册 EchoMark</h1>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              邮箱
            </label>
            <Input
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              用户名
            </label>
            <Input
              type="text"
              placeholder="请输入用户名（至少3个字符）"
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
              placeholder="请输入密码（至少6位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              确认密码
            </label>
            <Input
              type="password"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </Button>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          已有账号？{' '}
          <Link to="/login" className="text-primary hover:underline">
            登录
          </Link>
        </p>
      </div>
    </div>
  )
}
