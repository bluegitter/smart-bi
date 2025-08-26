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

