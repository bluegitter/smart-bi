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
    // 清除可能已损坏的token
    const existingToken = getAuthToken()
    if (existingToken) {
      console.log('Clearing existing token and getting fresh one for development')
      removeAuthToken()
    }
    
    // 获取新的开发token
    fetch('/api/dev/token')
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setAuthToken(data.token)
          console.log('Development token set:', data.token.substring(0, 20) + '...')
        }
      })
      .catch(err => {
        console.warn('Failed to get development token:', err)
      })
  }
}