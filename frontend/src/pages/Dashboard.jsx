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
  const [linkShareFile, setLinkShareFile] = useState(null)
  const [linkSharePassword, setLinkSharePassword] = useState('')
  const [linkShareExpiryHours, setLinkShareExpiryHours] = useState('')
  const [linkShareResult, setLinkShareResult] = useState(null)
  const [linkShareMessage, setLinkShareMessage] = useState('')
  const [openMenu, setOpenMenu] = useState(null) // { type: 'file'|'folder', id }
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [view, currentFolderId])

  useEffect(() => {
    const closeMenuOnOutsideClick = () => setOpenMenu(null)
    document.addEventListener('click', closeMenuOnOutsideClick)
    return () => document.removeEventListener('click', closeMenuOnOutsideClick)
  }, [])

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
    setOpenMenu(null)
    try {
      await axiosClient.delete(`/files/${fileId}`)
      await fetchData()
    } catch (err) {
      setError('Failed to delete file')
    }
  }

  const restoreFile = async (e, fileId) => {
    e.stopPropagation()
    setOpenMenu(null)
    try {
      await axiosClient.post(`/files/${fileId}/restore`)
      await fetchData()
    } catch (err) {
      setError('Failed to restore file')
    }
  }

  const restoreFolder = async (e, folderId) => {
    e.stopPropagation()
    setOpenMenu(null)
    try {
      await axiosClient.post(`/folders/${folderId}/restore`)
      await fetchData()
    } catch (err) {
      setError('Failed to restore folder')
    }
  }

  const renameFile = async (e, file) => {
    e.stopPropagation()
    setOpenMenu(null)
    const newName = prompt('New file name:', file.originalName)
    if (!newName || !newName.trim() || newName.trim() === file.originalName) return

    try {
      await axiosClient.patch(`/files/${file.id}`, { originalName: newName.trim() })
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rename file')
    }
  }

  const renameFolder = async (e, folder) => {
    e.stopPropagation()
    setOpenMenu(null)
    const newName = prompt('New folder name:', folder.name)
    if (!newName || !newName.trim() || newName.trim() === folder.name) return

    try {
      await axiosClient.patch(`/folders/${folder.id}`, { name: newName.trim() })
      await fetchData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to rename folder')
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
          className="bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700"
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
    setOpenMenu(null)
    setShareFile(file)
    setShareMessage('')
  }

  const closeShareModal = () => {
    setShareFile(null)
    setShareEmail('')
    setShareMessage('')
  }

  const openLinkShareModal = (e, file) => {
    e.stopPropagation()
    setOpenMenu(null)
    setLinkShareFile(file)
    setLinkSharePassword('')
    setLinkShareExpiryHours('')
    setLinkShareResult(null)
    setLinkShareMessage('')
  }

  const closeLinkShareModal = () => {
    setLinkShareFile(null)
    setLinkShareResult(null)
    setLinkShareMessage('')
  }

  const handleGenerateLink = async (e) => {
    e.preventDefault()
    setLinkShareMessage('')
    try {
      const body = {}
      if (linkSharePassword.trim()) body.password = linkSharePassword.trim()
      if (linkShareExpiryHours) body.expiresInHours = Number(linkShareExpiryHours)

      const res = await axiosClient.post(`/files/${linkShareFile.id}/link-share`, body)
      const fullUrl = `${axiosClient.defaults.baseURL}/public/files/${res.data.token}`
      setLinkShareResult({ ...res.data, fullUrl })
    } catch (err) {
      setLinkShareMessage(err.response?.data?.error || 'Failed to generate link')
    }
  }

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(linkShareResult.fullUrl)
    setLinkShareMessage('Link copied to clipboard!')
  }

  const toggleMenu = (e, type, id) => {
    e.stopPropagation()
    setOpenMenu((prev) => (prev && prev.type === type && prev.id === id ? null : { type, id }))
  }

  const navItemClass = (isActive) =>
    `text-left px-3 py-2 rounded-xl transition-colors ${
      isActive ? 'bg-teal-100 text-teal-700 font-medium' : 'hover:bg-teal-50 text-gray-700'
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50 flex">
      <aside className="w-56 bg-white/70 backdrop-blur-sm shadow-md p-5 flex flex-col gap-2 rounded-r-3xl">
        <h1 className="text-xl font-bold text-teal-600 mb-6">Cloud Storage</h1>
        <button onClick={() => switchView('drive')} className={navItemClass(view === 'drive')}>
          📁 My Files
        </button>
        <button onClick={() => switchView('starred')} className={navItemClass(view === 'starred')}>
          ⭐ Starred
        </button>
        <button onClick={() => switchView('shared')} className={navItemClass(view === 'shared')}>
          👥 Shared with me
        </button>
        <button onClick={() => switchView('trash')} className={navItemClass(view === 'trash')}>
          🗑️ Trash
        </button>
      </aside>

      <div className="flex-1">
        <header className="bg-white/70 backdrop-blur-sm shadow-sm px-6 py-4 flex justify-between items-center gap-4 rounded-bl-3xl">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-teal-200 bg-white rounded-xl px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
            <button type="submit" className="bg-teal-100 text-teal-700 px-3 py-2 rounded-xl hover:bg-teal-200">
              Search
            </button>
            {searchResults && (
              <button type="button" onClick={clearSearch} className="text-sm text-teal-600 hover:underline">
                Clear
              </button>
            )}
          </form>

          <div className="flex items-center gap-4">
            {view === 'drive' && (
              <>
                <button
                  onClick={handleCreateFolder}
                  className="bg-white border border-teal-200 text-teal-700 px-4 py-2 rounded-xl hover:bg-teal-50 shadow-sm"
                >
                  New Folder
                </button>
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={uploading}
                  className="bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 disabled:opacity-50 shadow-sm"
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
              className="text-sm text-red-500 hover:underline"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="p-6">
          {view === 'drive' && currentFolderId && !searchResults && (
            <button
              onClick={goBack}
              className="mb-4 text-teal-600 hover:underline text-sm"
            >
              ← Back
            </button>
          )}

          {searchResults && (
            <p className="mb-4 text-gray-600 text-sm">
              Showing {searchResults.length} result(s) for "{searchQuery}"
            </p>
          )}

          {loading && <p className="text-gray-500">Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

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
                className={`relative bg-amber-50/80 border border-amber-100 p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 ${view !== 'trash' ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="font-medium truncate">📁 {folder.name}</p>
                  <button
                    onClick={(e) => toggleMenu(e, 'folder', folder.id)}
                    className="text-gray-500 hover:text-gray-800 text-lg leading-none px-1 flex-shrink-0"
                  >
                    ⋮
                  </button>
                </div>

                {openMenu?.type === 'folder' && openMenu.id === folder.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 top-10 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 w-32"
                  >
                    {view === 'drive' && (
                      <button
                        onClick={(e) => renameFolder(e, folder)}
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-teal-50"
                      >
                        Rename
                      </button>
                    )}
                    {view === 'trash' && (
                      <button
                        onClick={(e) => restoreFolder(e, folder.id)}
                        className="block w-full text-left px-3 py-2 text-sm text-teal-600 hover:bg-teal-50"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {(searchResults ?? files).map((file) => (
              <div
                key={file.id}
                onClick={() => handleFileClick(file)}
                className={`relative bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 ${view !== 'trash' ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {view === 'drive' && (
                      <button onClick={(e) => toggleStar(e, file.id)} className="text-lg">
                        {file.starred ? '⭐' : '☆'}
                      </button>
                    )}
                    <button
                      onClick={(e) => toggleMenu(e, 'file', file.id)}
                      className="text-gray-500 hover:text-gray-800 text-lg leading-none px-1"
                    >
                      ⋮
                    </button>
                  </div>
                </div>

                {openMenu?.type === 'file' && openMenu.id === file.id && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-3 top-12 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 w-36"
                  >
                    {view === 'drive' && (
                      <>
                        <button
                          onClick={(e) => renameFile(e, file)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-teal-50"
                        >
                          Rename
                        </button>
                        <button
                          onClick={(e) => openShareModal(e, file)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-teal-50"
                        >
                          Share
                        </button>
                        <button
                          onClick={(e) => openLinkShareModal(e, file)}
                          className="block w-full text-left px-3 py-2 text-sm hover:bg-teal-50"
                        >
                          Get Link
                        </button>
                        <button
                          onClick={(e) => deleteFile(e, file.id)}
                          className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                    {view === 'trash' && (
                      <button
                        onClick={(e) => restoreFile(e, file.id)}
                        className="block w-full text-left px-3 py-2 text-sm text-teal-600 hover:bg-teal-50"
                      >
                        Restore
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>

      {shareFile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
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
                className="w-full border border-teal-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-300"
                required
              />
              <select
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
                className="w-full border border-teal-200 rounded-xl px-3 py-2 mb-3"
              >
                <option value="VIEWER">Viewer</option>
                <option value="EDITOR">Editor</option>
              </select>
              {shareMessage && (
                <p className={`text-sm mb-3 ${shareMessage.includes('success') ? 'text-green-600' : 'text-red-500'}`}>
                  {shareMessage}
                </p>
              )}
              <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-xl hover:bg-teal-700">
                Share
              </button>
            </form>
          </div>
        </div>
      )}

      {linkShareFile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium truncate pr-4">Get link for "{linkShareFile.originalName}"</h2>
              <button onClick={closeLinkShareModal} className="text-2xl leading-none text-gray-500 hover:text-gray-800 flex-shrink-0">
                &times;
              </button>
            </div>

            {!linkShareResult ? (
              <form onSubmit={handleGenerateLink}>
                <label className="block text-sm text-gray-600 mb-1">Password (optional)</label>
                <input
                  type="text"
                  placeholder="Leave blank for no password"
                  value={linkSharePassword}
                  onChange={(e) => setLinkSharePassword(e.target.value)}
                  className="w-full border border-teal-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                <label className="block text-sm text-gray-600 mb-1">Expires in (hours, optional)</label>
                <input
                  type="number"
                  placeholder="Leave blank for no expiry"
                  value={linkShareExpiryHours}
                  onChange={(e) => setLinkShareExpiryHours(e.target.value)}
                  className="w-full border border-teal-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-300"
                />
                {linkShareMessage && (
                  <p className="text-sm mb-3 text-red-500">{linkShareMessage}</p>
                )}
                <button type="submit" className="w-full bg-teal-600 text-white py-2 rounded-xl hover:bg-teal-700">
                  Generate Link
                </button>
              </form>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-2">Share this link:</p>
                <div className="bg-teal-50 rounded-xl p-2 text-xs break-all mb-3">
                  {linkShareResult.fullUrl}
                </div>
                {linkShareResult.passwordProtected && (
                  <p className="text-xs text-gray-500 mb-2">🔒 Password protected</p>
                )}
                {linkShareResult.expiresAt && (
                  <p className="text-xs text-gray-500 mb-3">
                    ⏱ Expires: {new Date(linkShareResult.expiresAt).toLocaleString()}
                  </p>
                )}
                {linkShareMessage && (
                  <p className="text-sm mb-3 text-green-600">{linkShareMessage}</p>
                )}
                <button
                  onClick={copyLinkToClipboard}
                  className="w-full bg-teal-600 text-white py-2 rounded-xl hover:bg-teal-700"
                >
                  Copy Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {previewFile && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto p-4 relative shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-medium truncate pr-4">{previewFile.originalName}</h2>
              <div className="flex items-center gap-3 flex-shrink-0">
                <button
                  onClick={downloadPreviewFile}
                  className="text-sm text-teal-600 hover:underline"
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