import React, { useState } from 'react'
import axios from 'axios'
import { Button } from '../components/ui/button'
import { MenuCard } from '../components/menu-card'
import { SearchInput } from '../components/search-input'
import { Loader2 } from 'lucide-react'

interface MenuItem {
  name: string
  price: string
  description?: string
  imageUrl?: string
}

interface ProcessStep {
  id: string
  label: string
  status: 'pending' | 'processing' | 'completed' | 'error'
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [menuData, setMenuData] = useState<MenuItem[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [steps, setSteps] = useState<ProcessStep[]>([
    { id: 'upload', label: 'Uploading menu image', status: 'pending' },
    { id: 'ocr', label: 'Extracting text from image', status: 'pending' },
    { id: 'parse', label: 'Analyzing menu items', status: 'pending' },
    { id: 'search', label: 'Finding dish images', status: 'pending' },
  ])

  const updateStepStatus = (stepId: string, status: ProcessStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
      setError(null)
      setUploadedImageUrl(null)
      setMenuData(null)
      setCurrentStep('')
      // Reset steps
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))
    }
  }

  const validateImageUrl = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' })
      const contentType = response.headers.get('content-type')
      return Boolean(response.ok && contentType?.startsWith('image/'))
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setError('Please select an image.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Upload image
      updateStepStatus('upload', 'processing')
      const formData = new FormData()
      formData.append('image', selectedFile)

      const uploadRes = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const imageUrl = uploadRes.data.url
      setUploadedImageUrl(imageUrl)
      updateStepStatus('upload', 'completed')

      // OCR
      updateStepStatus('ocr', 'processing')
      const ocrRes = await axios.post('/api/ocr', { imageUrl })
      const extractedText = ocrRes.data.text
      updateStepStatus('ocr', 'completed')

      // Parse menu
      updateStepStatus('parse', 'processing')
      const parseRes = await axios.post('/api/parseMenu', { text: extractedText })
      const menuJson = parseRes.data.menu
      updateStepStatus('parse', 'completed')

      // Search images
      updateStepStatus('search', 'processing')
      const searchPromises = menuJson.map((dish: any) =>
        axios.post('/api/searchDish', { name: dish.name })
      )

      const searchResults = await Promise.all(searchPromises)
      const enrichedMenu = await Promise.all(
        menuJson.map(async (dish: any, index: number) => {
          const imageUrl = searchResults[index].data.info
          const isValidImage = await validateImageUrl(imageUrl)
          return {
            ...dish,
            imageUrl: isValidImage ? imageUrl : null,
          }
        })
      )

      setMenuData(enrichedMenu)
      updateStepStatus('search', 'completed')
    } catch (err) {
      console.error('Error:', err)
      let errorMessage = 'An unknown error occurred.'
      
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message
      } else if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(`Error in step "${currentStep}": ${errorMessage}`)
      // Mark current step as error
      const currentStepObj = steps.find(s => s.id === currentStep)
      if (currentStepObj) {
        updateStepStatus(currentStepObj.id, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredMenu = menuData?.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight">Menu Scanner</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload a menu image to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Process Menu
        </Button>
      </form>

      {/* Progress Steps */}
      {loading && (
        <div className="space-y-3">
          {steps.map(step => (
            <div key={step.id} className="flex items-center gap-3">
              {step.status === 'processing' && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
              {step.status === 'completed' && (
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {step.status === 'error' && (
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              {step.status === 'pending' && (
                <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
              )}
              <span className={`text-sm ${
                step.status === 'processing' ? 'text-primary font-medium' :
                step.status === 'completed' ? 'text-green-600' :
                step.status === 'error' ? 'text-red-600' :
                'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-destructive">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {uploadedImageUrl && (
        <div className="space-y-4">
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-muted-foreground font-medium">
              Original Menu
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>
          <div className="flex justify-center">
            <img
              src={uploadedImageUrl}
              alt="Original menu"
              className="max-h-[300px] rounded-lg shadow-lg"
            />
          </div>
        </div>
      )}

      {menuData && menuData.length > 0 && (
        <div className="space-y-6">
          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink mx-4 text-muted-foreground font-medium">
              Menu - {menuData.length} dishes detected
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <div className="max-w-xl mx-auto">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search menu items..."
            />
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(filteredMenu || []).map((item, index) => (
              <MenuCard key={index} {...item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}