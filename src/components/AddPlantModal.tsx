import { AlertCircle, ImagePlus, Loader2, Sparkles, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { fileToCompressedDataUrl } from '../lib/image'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: (name: string, photo: string) => Promise<void>
}

export function AddPlantModal({ open, onClose, onConfirm }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [photo, setPhoto] = useState<string>('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleFile(file: File) {
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    try {
      const dataUrl = await fileToCompressedDataUrl(file)
      setPhoto(dataUrl)
    } catch {
      setError('图片处理失败，请换一张试试')
    }
  }

  async function handleConfirm() {
    if (!photo) {
      setError('请先上传植物照片')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await onConfirm(name, photo)
      setPhoto('')
      setName('')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setBusy(false)
    }
  }

  function handleClose() {
    if (busy) return
    setPhoto('')
    setName('')
    setError(null)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>添加植物</h2>
          <button className="icon-btn" onClick={handleClose} disabled={busy} aria-label="关闭">
            <X size={20} />
          </button>
        </header>

        <div className="modal-body">
          <div
            className="dropzone"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              const file = e.dataTransfer.files[0]
              if (file) handleFile(file)
            }}
          >
            {photo ? (
              <img src={photo} alt="预览" className="dropzone-preview" />
            ) : (
              <div className="dropzone-empty">
                <ImagePlus size={40} />
                <span>点击或拖拽上传植物照片</span>
                <small>支持 JPG / PNG，自动压缩</small>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
            />
          </div>

          <label className="field">
            <span>植物名称（可选）</span>
            <input
              type="text"
              value={name}
              placeholder="比如：阳台的多肉"
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
            />
          </label>

          {error && (
            <div className="inline-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <footer className="modal-foot">
          <button className="btn-ghost" onClick={handleClose} disabled={busy}>
            取消
          </button>
          <button className="btn-primary" onClick={handleConfirm} disabled={busy || !photo}>
            {busy ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
            {busy ? 'AI 分析中…' : '上传并分析'}
          </button>
        </footer>
      </div>
    </div>
  )
}
