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
    
    // 清除浏览器cookie
    // 设置过期时间为过去的时间来删除cookie
    document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'
    
    // 如果是生产环境，也设置secure标志
    if (window.location.protocol === 'https:') {
      document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax; Secure'
    }
  }
}

export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken()
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  }
}

