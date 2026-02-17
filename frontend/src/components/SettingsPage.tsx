import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChevronLeft, Copy, Check, Smartphone, LogOut, User, Download, Key } from 'lucide-react';
import { toast } from 'sonner';
import { getApiBase, exportUserData, downloadExportData } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function SettingsPage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const { user, signOut, getUsername } = useAuth();

  const apiBase = getApiBase();
  const username = getUsername();
  const email = user?.email;

  // 获取当前的 access token
  useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setAccessToken(session.access_token);
      }
    };
    getToken();
  }, []);

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('复制失败');
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('已退出登录');
    navigate('/login');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportUserData();
      downloadExportData(data);
      toast.success(`已导出 ${data.contents.length} 个内容和 ${data.marks.length} 个标记`);
    } catch (error) {
      toast.error('导出失败');
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft style={{ width: '20px', height: '20px' }} />
        </button>
        <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>设置</h1>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 16px' }}>
        {/* User Info Section */}
        <div
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>账号信息</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                当前登录账号
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px',
                }}
              >
                用户名
              </label>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {username || '未设置'}
              </p>
            </div>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '4px',
                }}
              >
                邮箱
              </label>
              <p style={{ fontSize: '14px', fontWeight: 500, margin: 0 }}>
                {email || '未设置'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ef4444',
              backgroundColor: 'white',
              color: '#ef4444',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            退出登录
          </button>
        </div>

        {/* Data Export Section */}
        <div
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Download style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>数据备份</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                导出你的所有数据
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
            }}
          >
            <p style={{ fontSize: '13px', color: '#4b5563', margin: 0, lineHeight: '1.6' }}>
              导出将包含你的所有内容和标记数据，保存为 JSON 文件。
              建议定期备份，以防数据丢失。
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={exporting}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#10B981',
              color: 'white',
              fontSize: '14px',
              fontWeight: 500,
              cursor: exporting ? 'not-allowed' : 'pointer',
              opacity: exporting ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Download style={{ width: '16px', height: '16px' }} />
            {exporting ? '导出中...' : '导出我的数据'}
          </button>
        </div>

        {/* Siri Shortcut Section */}
        <div
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smartphone style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Siri 语音标记</h2>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0 0' }}>
                通过 Siri 快速创建标记
              </p>
            </div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}
          >
            <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 12px 0' }}>基础版：快速标记（自动暂停/续播）</h3>
            <ol
              style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '13px',
                color: '#4b5563',
                lineHeight: '1.8',
              }}
            >
              <li>在 iPhone 上打开「快捷指令」App</li>
              <li>点击右上角「+」创建新快捷指令</li>
              <li>添加「获取 URL 内容」操作 → 暂停播放</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>URL: 下方暂停 API 地址</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>方法: POST，请求头: Authorization</li>
              <li>添加「获取 URL 内容」操作 → 创建标记</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>URL: 下方标记 API 地址</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>方法: POST，请求头: Authorization</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>请求体: {`{"source": "siri"}`}</li>
              <li>保存并命名为「标记」</li>
            </ol>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
              说「嘿 Siri，标记」→ 播客暂停 → 标记完成 → 回退 30 秒自动续播
            </p>

            <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '20px 0 12px 0' }}>进阶版：标记 + 语音想法（自动暂停/续播）</h3>
            <ol
              style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '13px',
                color: '#4b5563',
                lineHeight: '1.8',
              }}
            >
              <li>创建新快捷指令</li>
              <li>添加「获取 URL 内容」操作 → 暂停播放</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>URL: 下方暂停 API 地址</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>方法: POST，请求头: Authorization</li>
              <li>添加「听写文本」操作（语音输入想法）</li>
              <li>添加「获取 URL 内容」操作 → 创建标记</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>URL: 下方标记 API 地址</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>方法: POST，请求头: Authorization</li>
              <li style={{ marginLeft: '16px', listStyleType: 'circle' }}>请求体: {`{"source": "siri", "thought": [听写文本]}`}</li>
              <li>保存并命名为「标记想法」</li>
            </ol>
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '12px' }}>
              说「嘿 Siri，标记想法」→ 播客暂停 → 说出想法 → 标记完成 → 回退 30 秒自动续播
            </p>
          </div>

          {/* 暂停 API URL */}
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '6px',
              }}
            >
              暂停 API 地址
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontSize: '12px',
                  color: '#374151',
                  wordBreak: 'break-all',
                }}
              >
                {apiBase}/api/marks/pause
              </code>
              <button
                onClick={() => handleCopy(`${apiBase}/api/marks/pause`, 'pause')}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: copied === 'pause' ? '#059669' : '#f3f4f6',
                  color: copied === 'pause' ? 'white' : '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {copied === 'pause' ? (
                  <Check style={{ width: '14px', height: '14px' }} />
                ) : (
                  <Copy style={{ width: '14px', height: '14px' }} />
                )}
              </button>
            </div>
          </div>

          {/* 标记 API URL */}
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '6px',
              }}
            >
              标记 API 地址
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontSize: '12px',
                  color: '#374151',
                  wordBreak: 'break-all',
                }}
              >
                {apiBase}/api/marks
              </code>
              <button
                onClick={() => handleCopy(`${apiBase}/api/marks`, 'api')}
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: copied === 'api' ? '#059669' : '#f3f4f6',
                  color: copied === 'api' ? 'white' : '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {copied === 'api' ? (
                  <Check style={{ width: '14px', height: '14px' }} />
                ) : (
                  <Copy style={{ width: '14px', height: '14px' }} />
                )}
              </button>
            </div>
          </div>

          {/* Token for Siri */}
          <div style={{ marginBottom: '12px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: '#6b7280',
                marginBottom: '6px',
              }}
            >
              <Key style={{ width: '12px', height: '12px' }} />
              Authorization Token（用于 Siri 快捷指令）
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
              }}
            >
              <code
                style={{
                  flex: 1,
                  fontSize: '11px',
                  color: '#374151',
                  wordBreak: 'break-all',
                  maxHeight: '60px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {accessToken ? `Bearer ${accessToken.substring(0, 50)}...` : '加载中...'}
              </code>
              <button
                onClick={() => accessToken && handleCopy(`Bearer ${accessToken}`, 'token')}
                disabled={!accessToken}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: copied === 'token' ? '#059669' : '#6366F1',
                  color: 'white',
                  cursor: accessToken ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 500,
                  opacity: accessToken ? 1 : 0.5,
                }}
              >
                {copied === 'token' ? (
                  <>
                    <Check style={{ width: '14px', height: '14px' }} />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy style={{ width: '14px', height: '14px' }} />
                    复制 Token
                  </>
                )}
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#9ca3af', margin: '6px 0 0 0' }}>
              在 Siri 快捷指令的「获取 URL 内容」中，添加请求头：<br />
              名称: <code>Authorization</code>，值: 点击上方按钮复制
            </p>
          </div>

          {/* Note about token expiration */}
          <div
            style={{
              backgroundColor: '#fef3c7',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '12px',
            }}
          >
            <p style={{ fontSize: '12px', color: '#92400e', margin: 0 }}>
              <strong>注意：</strong>Token 会在 1 小时后过期。如果 Siri 标记失败，请回到此页面重新复制 Token。
            </p>
          </div>
        </div>

        {/* Tips */}
        <div
          style={{
            backgroundColor: '#fef3c7',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
            color: '#92400e',
          }}
        >
          <strong>提示：</strong>使用 Siri 标记前，请确保你正在网页上播放播客。
          系统会自动记录当前播放位置。
        </div>
      </div>
    </div>
  );
}
