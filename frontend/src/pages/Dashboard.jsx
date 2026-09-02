import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

function Dashboard() {
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [folderStack, setFolderStack] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [currentFolderId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = currentFolderId ? { folderId: currentFolderId } : {}
      const [filesRes, foldersRes] = await Promise.all([
        axiosClient.get('/files', { params }),
        axiosClient.get('/folders', { params }),
      ])
      setFiles(filesRes.data)
      setFolders(foldersRes.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    if (currentFolderId) {
      formData.append('folderId', currentFolderId)
    }

    try {
      await axiosClient.post('/files/upload', formData)
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleCreateFolder = async () => {
    const name = prompt('Folder name:')
    if (!name || !name.trim()) return

    try {
      await axiosClient.post('/folders', {
        name: name.trim(),
        parentFolderId: currentFolderId,
      })
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create folder')
    }
  }

  const handleFileClick = async (file) => {
    try {
      const response = await axiosClient.get(`/files/${file.id}/download`, {
        responseType: 'blob',
      })
      const blob = new Blob([response.data], { type: file.contentType })
      const url = window.URL.createObjectURL(blob)
      setPreviewFile(file)
      setPreviewUrl(url)
    } catch (err) {
      setError('Failed to open file')
    }
  }

  const closePreview = () => {
    if (previewUrl) window.URL.revokeObjectURL(previewUrl)
    setPreviewFile(null)
    setPreviewUrl(null)
  }

  const downloadPreviewFile = () => {
    const link = document.createElement('a')
    link.href = previewUrl
    link.setAttribute('download', previewFile.originalName)
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const openFolder = (folder) => {
    setFolderStack([...folderStack, currentFolderId])
    setCurrentFolderId(folder.id)
  }

  const goBack = () => {
    const newStack = [...folderStack]
    const previous = newStack.pop()
    setFolderStack(newStack)
    setCurrentFolderId(previous ?? null)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }

  const renderPreviewContent = () => {
    const type = previewFile.contentType || ''
    if (type.startsWith('image/')) {
      return <img src={previewUrl} alt={previewFile.originalName} className="max-h-[75vh] mx-auto" />
    }
    if (type === 'application/pdf') {
      return <iframe src={previewUrl} title={previewFile.originalName} className="w-full h-[75vh]" />
    }
    if (type.startsWith('video/')) {
      return <video src={previewUrl} controls className="max-h-[75vh] mx-auto w-full" />
    }
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No preview available for this file type.</p>
        <button
          onClick={downloadPreviewFile}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Download Instead
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-600">My Drive</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCreateFolder}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            New Folder
          </button>
          <button
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        {currentFolderId && (
          <button
            onClick={goBack}
            className="mb-4 text-blue-600 hover:underline text-sm"
          >
            ← Back
          </button>
        )}

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && folders.length === 0 && files.length === 0 && (
          <p className="text-gray-500">This folder is empty.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              onClick={() => openFolder(folder)}
              className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
            >
              <p className="font-medium truncate">📁 {folder.name}</p>
            </div>
          ))}

          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => handleFileClick(file)}
              className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer"
            >
              <p className="font-medium truncate">{file.originalName}</p>
              <p className="text-xs text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ))}
        </div>
      </main>

      {previewFile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto p-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium truncate pr-4">{previewFile.originalName}</h2>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={downloadPreviewFile}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Download
                </button>
                <button
                  onClick={closePreview}
                  className="text-2xl leading-none text-gray-500 hover:text-gray-800"
                >
                  &times;
                </button>
              </div>
            </div>
            {renderPreviewContent()}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard