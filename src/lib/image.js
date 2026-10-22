const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']

export function validateImageFile(file) {
  if (!file) return 'No file selected.'
  if (!ACCEPTED.includes(file.type)) return 'Use a JPG, PNG or WebP photo. Other file types are not supported.'
  if (file.size > 15 * 1024 * 1024) return 'This photo is larger than 15 MB. Choose a smaller one.'
  return null
}

// Shrinks a photo so it fits comfortably in browser storage.
export function downscaleToDataUrl(source, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = source instanceof Blob ? URL.createObjectURL(source) : source
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      if (source instanceof Blob) URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => reject(new Error('This file could not be read as an image.'))
    img.src = url
  })
}

export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function downloadText(text, filename, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  downloadDataUrl(url, filename)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'room'
