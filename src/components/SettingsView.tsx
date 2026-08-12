import { AlertCircle, Bell, CheckCircle2, Loader2, Plug, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { testConnection } from '../api/client'
import { DEFAULT_SETTINGS } from '../constants'
import { getPermission, requestPermission } from '../lib/notifications'
import { useStore } from '../hooks/useStore'

export function SettingsView() {
  const { settings, updateSettings } = useStore()
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [permMsg, setPermMsg] = useState<string | null>(null)

  async function handleTest() {
    setTesting(true)
    setTestResult(null)
    try {
      const reply = await testConnection(settings)
      setTestResult({ ok: true, msg: `连接成功：${reply.slice(0, 40)}` })
    } catch (e) {
      setTestResult({ ok: false, msg: e instanceof Error ? e.message : '连接失败' })
    } finally {
      setTesting(false)
    }
  }

  async function handleEnableNotifications() {
    const perm = await requestPermission()
    if (perm === 'granted') {
      updateSettings({ notificationsEnabled: true })
      setPermMsg('通知权限已开启')
    } else {
      updateSettings({ notificationsEnabled: false })
      setPermMsg('通知权限被拒绝，请在浏览器设置中允许')
    }
  }

  const perm = getPermission()

  return (
    <div className="settings-view">
      <header className="view-header">
        <h1>设置</h1>
        <p>配置 AI API 与提醒方式</p>
      </header>

      <section className="panel">
        <div className="panel-head">
          <h2><Plug size={18} /> API 配置</h2>
        </div>

        <label className="field">
          <span>API Base URL</span>
          <input
            type="text"
            value={settings.apiBaseUrl}
            placeholder={DEFAULT_SETTINGS.apiBaseUrl}
            onChange={(e) => updateSettings({ apiBaseUrl: e.target.value })}
          />
        </label>

        <label className="field">
          <span>模型名称</span>
          <input
            type="text"
            value={settings.model}
            placeholder="GLM-5V-Turbo"
            onChange={(e) => updateSettings({ model: e.target.value })}
          />
          <small>需要支持图像输入的视觉模型（如 GLM-5V-Turbo）才能分析照片</small>
        </label>

        <label className="field">
          <span>API Key</span>
          <input
            type="password"
            value={settings.apiKey}
            placeholder="sk-..."
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
          />
          <small>密钥仅保存在本地浏览器 localStorage，不会上传</small>
        </label>

        <div className="settings-actions">
          <button className="btn-primary" onClick={handleTest} disabled={testing || !settings.apiKey}>
            {testing ? <Loader2 size={16} className="spin" /> : <Plug size={16} />}
            测试连接
          </button>
          {testResult && (
            <div className={`test-result ${testResult.ok ? 'ok' : 'err'}`}>
              {testResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{testResult.msg}</span>
            </div>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2><Bell size={18} /> 每日提醒</h2>
        </div>
        <p className="settings-desc">
          开启后，每天首次打开 Petalog 时通过浏览器通知提醒今日待办任务。
        </p>
        <div className="settings-actions">
          {perm === 'granted' ? (
            <button
              className={settings.notificationsEnabled ? 'btn-ghost' : 'btn-primary'}
              onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
            >
              <Bell size={16} />
              {settings.notificationsEnabled ? '已开启 · 点击关闭' : '点击开启提醒'}
            </button>
          ) : (
            <button className="btn-primary" onClick={handleEnableNotifications}>
              <Bell size={16} /> 请求通知权限
            </button>
          )}
          {permMsg && <span className="perm-msg">{permMsg}</span>}
        </div>
      </section>

      <div className="settings-note">
        <ShieldAlert size={16} />
        <span>
          纯前端应用，所有数据（植物信息、API Key、日程）均保存在浏览器本地，清除浏览器数据将导致丢失。
        </span>
      </div>
    </div>
  )
}
