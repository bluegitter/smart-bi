'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { getAuthHeaders } from '@/lib/authUtils'
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Eye, 
  User,
  MoreHorizontal,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  ChevronDown,
  Filter
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User as UserType } from '@/types'

interface UserStats {
  total: number
  active: number
  inactive: number
  byRole: Record<UserType['role'], number>
  recentUsers: number
}

export function UserManagementPanel() {
  const [users, setUsers] = React.useState<UserType[]>([])
  const [userStats, setUserStats] = React.useState<UserStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [searchTerm, setSearchTerm] = React.useState('')
  const [selectedRole, setSelectedRole] = React.useState<UserType['role'] | ''>('')
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [selectedUser, setSelectedUser] = React.useState<UserType | null>(null)
  const [showEditDialog, setShowEditDialog] = React.useState(false)
  const [showRoleDropdown, setShowRoleDropdown] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // 加载用户列表
  const loadUsers = React.useCallback(async () => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          page: currentPage,
          limit: 20,
          ...(searchTerm && { search: searchTerm }),
          ...(selectedRole && { role: selectedRole })
        })
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setTotalPages(data.totalPages)
      } else {
        const errorData = await response.json()
        console.error('加载用户列表失败:', response.status, errorData)
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
    }
  }, [currentPage, searchTerm, selectedRole])

  // 加载用户统计
  const loadUserStats = React.useCallback(async () => {
    try {
      const response = await fetch('/api/users/stats', {
        method: 'POST',
        headers: getAuthHeaders()
      })
      if (response.ok) {
        const stats = await response.json()
        setUserStats(stats)
      }
    } catch (error) {
      console.error('加载用户统计失败:', error)
    }
  }, [])

  // 初始化数据
  React.useEffect(() => {
    const initData = async () => {
      setLoading(true)
      await Promise.all([loadUsers(), loadUserStats()])
      setLoading(false)
    }
    initData()
  }, [loadUsers, loadUserStats])

  const getRoleBadgeColor = (role: UserType['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'viewer':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleLabel = (role: UserType['role']) => {
    switch (role) {
      case 'admin':
        return '管理员'
      case 'user':
        return '用户'
      case 'viewer':
        return '访客'
      default:
        return role
    }
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">总用户数</p>
                  <p className="text-xl font-semibold">{userStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">活跃用户</p>
                  <p className="text-xl font-semibold">{userStats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <UserX className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">非活跃</p>
                  <p className="text-xl font-semibold">{userStats.inactive}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">管理员</p>
                  <p className="text-xl font-semibold">{userStats.byRole?.admin || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索用户姓名、邮箱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserType['role'] | '')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">全部角色</option>
                <option value="admin">管理员</option>
                <option value="user">用户</option>
                <option value="viewer">访客</option>
              </select>
              
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>用户列表</CardTitle>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新增用户
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 font-medium text-gray-600">用户</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">角色</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">状态</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">最后登录</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-600">创建时间</th>
                  <th className="text-right py-3 px-2 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        getRoleBadgeColor(user.role)
                      )}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          user.isActive ? "bg-green-500" : "bg-gray-400"
                        )} />
                        <span className="text-sm text-gray-600">
                          {user.isActive ? '活跃' : '未激活'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-gray-600">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : '从未登录'}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <span className="text-sm text-gray-600">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>
                    <td className="py-4 px-2">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  上一页
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}