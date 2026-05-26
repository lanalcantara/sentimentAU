'use client'

import { useState, useRef, useEffect } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Camera, Upload, Leaf, Loader2, X, Check, CheckCircle2, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import { SensoryAudio } from '@/lib/services/sensory-audio'

// Helper to center the initial crop
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

export function AvatarUpload() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [username, setUsername] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Crop modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imgSrc, setImgSrc] = useState('')
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null)
  
  const imgRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch current profile on mount
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        if (res.ok && data.user) {
          setAvatarUrl(data.user.avatar_url || null)
          setUsername(data.user.username)
        }
      } catch (err) {
        console.error('[AvatarUpload] Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  // Trigger sound feedback
  const playClick = () => {
    SensoryAudio.play('bubble')
  }

  const playSuccess = () => {
    SensoryAudio.play('chime')
  }

  // Handle file select
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      playClick()
      setCrop(undefined) // Reset crop state
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
        setIsModalOpen(true)
      })
      reader.readAsDataURL(e.target.files[0])
    }
  }

  // Handle drag over
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle drop file
  const onDropFile = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      playClick()
      setCrop(undefined)
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImgSrc(reader.result?.toString() || '')
        setIsModalOpen(true)
      })
      reader.readAsDataURL(e.dataTransfer.files[0])
    }
  }

  // Initialize crop centered on image load
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, 1)) // aspect 1:1
  }

  // Create crop blob and upload to Supabase
  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) {
      toast.error('Por favor, selecione uma área de corte.')
      return
    }

    setUploading(true)
    playClick()

    try {
      const image = imgRef.current
      const canvas = document.createElement('canvas')
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      
      canvas.width = completedCrop.width
      canvas.height = completedCrop.height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Não foi possível gerar o contexto 2D')
      }

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      )

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
      })

      if (!blob) {
        throw new Error('Falha ao processar imagem cortada')
      }

      // Upload using the new API route to bypass RLS securely
      const formData = new FormData()
      formData.append('file', blob)
      formData.append('username', username)

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Não foi possível atualizar o URL da imagem no perfil.')
      }

      const { publicUrl } = await res.json()

      setAvatarUrl(publicUrl)
      setIsModalOpen(false)
      playSuccess()
      toast.success('Sua foto de perfil foi atualizada com sucesso!')
    } catch (error: any) {
      console.error('[AvatarUpload] Upload error:', error)
      toast.error(`Falha ao carregar foto: ${error.message || 'Erro inesperado'}`)
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 bg-card border border-border/40 p-6 rounded-3xl shadow-sm max-w-sm w-full mx-auto">
      {/* Avatar Display Frame */}
      <div 
        onClick={() => {
          playClick()
          fileInputRef.current?.click()
        }}
        onDragOver={onDragOver}
        onDrop={onDropFile}
        className="relative group w-28 h-28 rounded-full border-4 border-primary/20 bg-muted flex items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 hover:border-primary/60 hover:shadow-md"
      >
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={`Avatar de ${username}`} 
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <Leaf className="w-12 h-12 text-muted-foreground opacity-50" />
        )}
        
        {/* Hover Camera Overlay */}
        <div className="absolute inset-0 bg-[#1e2a4a]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
          <Camera className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="text-center">
        <h3 className="font-bold text-foreground capitalize flex items-center justify-center gap-1.5">
          {username}
          <CheckCircle2 className="w-4 h-4 text-primary fill-primary/10" />
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Selecione ou arraste uma foto para cortar</p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onSelectFile} 
        accept="image/*" 
        className="hidden" 
      />

      <Button 
        onClick={() => {
          playClick()
          fileInputRef.current?.click()
        }}
        variant="outline"
        size="sm"
        className="rounded-xl border-primary/20 hover:border-primary/60 text-foreground cursor-pointer w-full gap-2 py-2"
      >
        <Upload className="w-4 h-4" />
        Carregar Foto
      </Button>

      {/* Image Cropping Dialog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white border-0 shadow-xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-foreground">Cortar Foto de Perfil</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ajuste o círculo de recorte abaixo para escolher o melhor enquadramento para sua foto.
            </DialogDescription>
          </DialogHeader>

          {imgSrc && (
            <div className="flex justify-center items-center overflow-auto max-h-[300px] border border-border/40 rounded-2xl bg-muted/30 p-2">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1} // perfect square aspect
                circularCrop={true} // circular guide overlays
              >
                <img
                  ref={imgRef}
                  alt="Source avatar"
                  src={imgSrc}
                  style={{ maxHeight: '280px', maxWidth: '100%', objectFit: 'contain' }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          )}

          <DialogFooter className="mt-4 flex gap-2 sm:gap-0 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                playClick()
                setIsModalOpen(false)
              }} 
              className="rounded-xl border-border hover:bg-muted text-foreground cursor-pointer"
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              className="rounded-xl bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm cursor-pointer gap-2"
              disabled={uploading || !completedCrop}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Salvando...
                </>
              ) : (
                'Cortar e Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
