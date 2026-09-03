import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'

function Dashboard() {
  const [view, setView] = useState('drive') // 'drive' | 'starred' | 'trash' | 'shared'
  const [files, setFiles] = useState([])
  const [folders, setFolders] = useState([])
  const [currentFolderId, setCurrentFolderId] = useState(null)
  const [folderStack, setFolderStack] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [shareFile, setShareFile] = useState(null)
  const [shareEmail, setShareEmail] = useState('')
  const [sharePermission, setSharePermission] = useState('VIEWER')
  const [shareMessage, setShareMessage] = useState('')
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [view, currentFolderId])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      if (view === 'starred') {
        const res = await axiosClient.get('/files/starred')
        setFiles(res.data)
        setFolders([])
      } else if (view === 'shared') {
        const res = await axiosClient.get('/shared-with-me')
        const sharedFiles = res.data.map((share) => ({
          id: share.fileId,
          originalName: share.fileName,
          size: 0,
          contentType: '',
          starred: false,
        }))
        setFiles(sharedFiles)
        setFolders([])
      } else if (view === 'trash') {
        const [filesRes, foldersRes] = await Promise.all([
          axiosClient.get('/files/trash'),
          axiosClient.get('/folders/trash'),
        ])
        setFiles(filesRes.data)
        setFolders(foldersRes.data)
      } else {
        const params = currentFolderId ? { folderId: currentFolderId } : {}
        const [filesRes, foldersRes] = await Promise.all([
          axiosClient.get('/files', { params }),
          axiosClient.get('/folders', { params }),
        ])
        setFiles(filesRes.data)
        setFolders(foldersRes.data)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const switchView = (newView) => {
    setView(newView)
    setCurrentFolderId(null)
    setFolderStack([])
    setSearchResults(null)
    setSearchQuery('')
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
    if (view === 'trash') return
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

  const toggleStar = async (e, fileId) => {
    e.stopPropagation()
    try {
      await axiosClient.post(`/files/${fileId}/star`)
      await fetchData()
    } catch (err) {
      setError('Failed to update star')
    }
  }

  const deleteFile = async (e, fileId) => {
    e.stopPropagation()
    try {
      await axiosClient.delete(`/files/${fileId}`)
      await fetchData()
    } catch (err) {
      setError('Failed to delete file')
    }
  }

  const restoreFile = async (e, fileId) => {
    e.stopPropagation()
    try {
      await axiosClient.post(`/files/${fileId}/restore`)
      await fetchData()
    } catch (err) {
      setError('Failed to restore file')
    }
  }

  const restoreFolder = async (e, folderId) => {
    e.stopPropagation()
    try {
      await axiosClient.post(`/folders/${folderId}/restore`)
      await fetchData()
    } catch (err) {
      setError('Failed to restore folder')
    }
  }

  const openFolder = (folder) => {
    if (view === 'trash') return
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

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    try {
      const res = await axiosClient.get('/files/search', { params: { query: searchQuery.trim() } })
      setSearchResults(res.data)
    } catch (err) {
      setError('Search failed')
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
  }

  const handleShare = async (e) => {
    e.preventDefault()
    setShareMessage('')
    try {
      await axiosClient.post(`/files/${shareFile.id}/share`, {
        sharedWithEmail: shareEmail,
        permission: sharePermission,
      })
      setShareMessage('Shared successfully!')
      setShareEmail('')
    } catch (err) {
      setShareMessage(err.response?.data?.error || 'Failed to share')
    }
  }

  const openShareModal = (e, file) => {
    e.stopPropagation()
    setShareFile(file)
    setShareMessage('')
  }

  const closeShareModal = () => {
    setShareFile(null)
    setShareEmail('')
    setShareMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-48 bg-white shadow-md p-4 flex flex-col gap-2">
        <h1 className="text-lg font-bold text-blue-600 mb-4">My Drive</h1>
        <button
          onClick={() => switchView('drive')}
          className={`text-left px-3 py-2 rounded ${view === 'drive' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
        >
          📁 My Files
        </button>
        <button
          onClick={() => switchView('starred')}
          className={`text-left px-3 py-2 rounded ${view === 'starred' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
        >
          ⭐ Starred
        </button>
        <button
          onClick={() => switchView('shared')}
          className={`text-left px-3 py-2 rounded ${view === 'shared' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
        >
          👥 Shared with me
        </button>
        <button
          onClick={() => switchView('trash')}
          className={`text-left px-3 py-2 rounded ${view === 'trash' ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100'}`}
        >
          🗑️ Trash
        </button>
      </aside>

      <div className="flex-1">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center gap-4">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-64"
            />
            <button type="submit" className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300">
              Search
            </button>
            {searchResults && (
              <button type="button" onClick={clearSearch} className="text-sm text-blue-600 hover:underline">
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-4">
            {view === 'drive' && (
              <>
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
              </>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-6">
          {view === 'drive' && currentFolderId && !searchResults && (
            <button
              onClick={goBack}
              className="mb-4 text-blue-600 hover:underline text-sm"
            >
              ← Back
            </button>
          )}

          {searchResults && (
            <p className="mb-4 text-gray-600 text-sm">
              Showing {searchResults.length} result(s) for "{searchQuery}"
            </p>
          )}

          {loading && <p>Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && !searchResults && folders.length === 0 && files.length === 0 && (
            <p className="text-gray-500">
              {view === 'trash'
                ? 'Trash is empty.'
                : view === 'starred'
                ? 'No starred files.'
                : view === 'shared'
                ? 'Nothing shared with you yet.'
                : 'This folder is empty.'}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {!searchResults && folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => openFolder(folder)}
                className={`bg-yellow-50 border border-yellow-200 p-4 rounded-lg shadow hover:shadow-md transition ${view !== 'trash' ? 'cursor-pointer' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-medium truncate">📁 {folder.name}</p>
                  {view === 'trash' && (
                    <button
                      onClick={(e) => restoreFolder(e, folder.id)}
                      className="text-xs text-blue-600 hover:underline flex-shrink-0 ml-2"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}

            {(searchResults ?? files).map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition ${view !== 'trash' ? 'cursor-pointer' : ''}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{file.originalName}</p>
                    {view !== 'shared' && (
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {view === 'drive' && (
                      <button onClick={(e) => toggleStar(e, file.id)} className="text-lg">
                        {file.starred ? '⭐' : '☆'}
                      </button>
                    )}
                    {view === 'drive' && (
                      <button
                        onClick={(e) => openShareModal(e, file)}
                        className="text-xs text-gray-600 hover:underline"
                      >
                        Share
                      </button>
                    )}
                    {view === 'trash' && (
                      <button
                        onClick={(e) => restoreFile(e, file.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Restore
                      </button>
                    )}
                    {view === 'drive' && (
                      <button
                        onClick={(e) => deleteFile(e, file.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {shareFile && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium">Share "{shareFile.originalName}"</h2>
              <button onClick={closeShareModal} className="text-2xl leading-none text-gray-500 hover:text-gray-800">
                &times;
              </button>
            </div>
            <form onSubmit={handleShare}>
              <input
                type="email"
                placeholder="User's email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
                required
              />
              <select
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 mb-3"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              {shareMessage && (
                <p className={`text-sm mb-3 ${shareMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                  {shareMessage}
                </p>
              )}
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                Share
              </button>
            </form>
          </div>
        </div>
      )}

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