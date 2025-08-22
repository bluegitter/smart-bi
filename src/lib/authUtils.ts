// 认证工具函数
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null // SSR 环境下返回 null
  }
  
  return localStorage.getItem('token')
}

export function setAuthToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token)
  }
}

export function removeAuthToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }
}

// 开发环境自动设置token
export function initDevAuth(): void {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    const existingToken = getAuthToken()
    if (!existingToken) {
      // 在开发环境下，如果没有token，尝试获取一个
      fetch('/api/dev/token')
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            setAuthToken(data.token)
            console.log('Development token set automatically')
          }
        })
        .catch(err => {
          console.warn('Failed to get development token:', err)
        })
    }
  }
}