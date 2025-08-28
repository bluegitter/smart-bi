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

export default function UsersPage() {
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
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole && { role: selectedRole })
      })
      
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

  // 搜索防抖
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1)
      } else {
        loadUsers()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, selectedRole])

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowRoleDropdown(false)
      }
    }

    if (showRoleDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showRoleDropdown])

  const roleLabels = {
    admin: '管理员',
    user: '普通用户',
    viewer: '观察者'
  }

  const roleIcons = {
    admin: Shield,
    user: User,
    viewer: Eye
  }

  const roleColors = {
    admin: 'text-red-600 bg-red-50 border-red-200',
    user: 'text-blue-600 bg-blue-50 border-blue-200',
    viewer: 'text-green-600 bg-green-50 border-green-200'
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      if (response.ok) {
        await loadUsers()
        await loadUserStats()
      } else {
        const error = await response.json()
        alert(error.error || '删除失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      alert('删除失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* 页面标题骨架 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-36 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* 统计卡片骨架 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="ml-4 space-y-2">
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse"></div>
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 搜索区域骨架 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* 表格骨架 */}
        <Card>
          <CardHeader>
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="py-4 px-6 rounded-tl-lg">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                    <th className="py-4 px-6">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                    <th className="py-4 px-6">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                    <th className="py-4 px-6">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                    <th className="py-4 px-6 rounded-tr-lg">
                      <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="bg-white">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="ml-4 space-y-2">
                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-1">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600 mt-1">管理系统用户和权限</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          添加用户
        </Button>
      </div>

      {/* 用户统计卡片 */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">总用户数</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">活跃用户</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.active}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">管理员</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.byRole.admin}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <User className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">普通用户</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.byRole.user}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">近7天新增</p>
                  <p className="text-2xl font-bold text-gray-900">{userStats.recentUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和过滤 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索用户名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            {/* 自定义角色过滤下拉框 */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className={cn(
                  "flex items-center justify-between w-48 px-4 py-2.5 text-sm font-medium text-left",
                  "bg-white border border-gray-300 rounded-lg shadow-sm",
                  "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                  "transition-colors duration-200"
                )}
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">
                    {selectedRole ? (
                      <div className="flex items-center gap-1.5">
                        {(() => {
                          const RoleIcon = roleIcons[selectedRole]
                          return <RoleIcon className={cn("h-4 w-4", 
                            selectedRole === 'admin' ? 'text-red-500' :
                            selectedRole === 'user' ? 'text-blue-500' : 'text-green-500'
                          )} />
                        })()}
                        {roleLabels[selectedRole]}
                      </div>
                    ) : (
                      '所有角色'
                    )}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-gray-400 transition-transform duration-200",
                  showRoleDropdown && "rotate-180"
                )} />
              </button>

              {/* 下拉菜单 */}
              {showRoleDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                  {/* 所有角色选项 */}
                  <button
                    onClick={() => {
                      setSelectedRole('')
                      setShowRoleDropdown(false)
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                      "flex items-center gap-3 text-sm font-medium",
                      !selectedRole && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <Filter className="h-4 w-4 text-gray-400" />
                    所有角色
                  </button>

                  {/* 角色选项 */}
                  {(['admin', 'user', 'viewer'] as const).map((role) => {
                    const RoleIcon = roleIcons[role]
                    const isSelected = selectedRole === role
                    return (
                      <button
                        key={role}
                        onClick={() => {
                          setSelectedRole(role)
                          setShowRoleDropdown(false)
                        }}
                        className={cn(
                          "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors",
                          "flex items-center gap-3 text-sm font-medium border-t border-gray-100",
                          isSelected && "bg-blue-50 text-blue-700"
                        )}
                      >
                        <RoleIcon className={cn(
                          "h-4 w-4",
                          role === 'admin' ? 'text-red-500' :
                          role === 'user' ? 'text-blue-500' : 'text-green-500'
                        )} />
                        <span className="flex-1">{roleLabels[role]}</span>
                        {userStats && (
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            role === 'admin' ? 'bg-red-100 text-red-600' :
                            role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                          )}>
                            {userStats.byRole[role]}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无用户数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50/80">
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider rounded-tl-lg">用户</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">角色</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">状态</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">创建时间</th>
                    <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider rounded-tr-lg">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user, index) => {
                    const RoleIcon = roleIcons[user.role]
                    return (
                      <tr 
                        key={user._id} 
                        className={cn(
                          "transition-colors duration-150",
                          "hover:bg-blue-50/50",
                          index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        )}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-600 flex items-center mt-1">
                                <Mail className="h-3 w-3 mr-1.5" />
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold border shadow-sm",
                            roleColors[user.role]
                          )}>
                            <RoleIcon className="h-3.5 w-3.5" />
                            {roleLabels[user.role]}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2.5 shadow-sm animate-pulse"></div>
                            <span className="text-sm font-medium text-green-700">活跃</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 font-medium">
                            {new Date(user.createdAt).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user)
                                setShowEditDialog(true)
                              }}
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteUser(user._id)}
                              className="h-8 w-8 p-0 text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 创建用户对话框 */}
      {showCreateDialog && (
        <CreateUserDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false)
            loadUsers()
            loadUserStats()
          }}
        />
      )}

      {/* 编辑用户对话框 */}
      {showEditDialog && selectedUser && (
        <EditUserDialog
          user={selectedUser}
          onClose={() => {
            setShowEditDialog(false)
            setSelectedUser(null)
          }}
          onSuccess={() => {
            setShowEditDialog(false)
            setSelectedUser(null)
            loadUsers()
            loadUserStats()
          }}
        />
      )}
    </div>
  )
}

// 创建用户对话框组件
function CreateUserDialog({ onClose, onSuccess }: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = React.useState({
    email: '',
    name: '',
    role: 'user' as UserType['role'],
    password: ''
  })
  const [loading, setLoading] = React.useState(false)

  const roleLabels = {
    admin: '管理员',
    user: '普通用户',
    viewer: '观察者'
  }

  const roleIcons = {
    admin: Shield,
    user: User,
    viewer: Eye
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || '创建失败')
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      alert('创建失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>添加用户</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色
              </label>
              <div className="space-y-2">
                {(['user', 'admin', 'viewer'] as const).map((role) => {
                  const RoleIcon = roleIcons[role]
                  const isSelected = formData.role === role
                  return (
                    <label
                      key={role}
                      className={cn(
                        "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                        isSelected 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={isSelected}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserType['role'] })}
                        className="sr-only"
                      />
                      <RoleIcon className={cn(
                        "h-5 w-5 mr-3",
                        role === 'admin' ? 'text-red-500' :
                        role === 'user' ? 'text-blue-500' : 'text-green-500'
                      )} />
                      <div>
                        <div className={cn(
                          "font-medium text-sm",
                          isSelected ? "text-blue-900" : "text-gray-900"
                        )}>
                          {roleLabels[role]}
                        </div>
                        <div className={cn(
                          "text-xs mt-0.5",
                          isSelected ? "text-blue-600" : "text-gray-500"
                        )}>
                          {role === 'admin' ? '拥有系统管理权限' :
                           role === 'user' ? '普通业务操作权限' : '只读查看权限'}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <Input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                取消
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '创建中...' : '创建'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// 编辑用户对话框组件
function EditUserDialog({ user, onClose, onSuccess }: {
  user: UserType
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = React.useState({
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl || ''
  })
  const [loading, setLoading] = React.useState(false)

  const roleLabels = {
    admin: '管理员',
    user: '普通用户',
    viewer: '观察者'
  }

  const roleIcons = {
    admin: Shield,
    user: User,
    viewer: Eye
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/users/${user._id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const error = await response.json()
        alert(error.error || '更新失败')
      }
    } catch (error) {
      console.error('更新用户失败:', error)
      alert('更新失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>编辑用户</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                邮箱
              </label>
              <Input
                type="email"
                value={user.email}
                disabled
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                姓名
              </label>
              <Input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                角色
              </label>
              <div className="space-y-2">
                {(['user', 'admin', 'viewer'] as const).map((role) => {
                  const RoleIcon = roleIcons[role]
                  const isSelected = formData.role === role
                  return (
                    <label
                      key={role}
                      className={cn(
                        "flex items-center p-3 border rounded-lg cursor-pointer transition-colors",
                        isSelected 
                          ? "border-blue-500 bg-blue-50" 
                          : "border-gray-200 hover:bg-gray-50"
                      )}
                    >
                      <input
                        type="radio"
                        name="edit-role"
                        value={role}
                        checked={isSelected}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserType['role'] })}
                        className="sr-only"
                      />
                      <RoleIcon className={cn(
                        "h-5 w-5 mr-3",
                        role === 'admin' ? 'text-red-500' :
                        role === 'user' ? 'text-blue-500' : 'text-green-500'
                      )} />
                      <div>
                        <div className={cn(
                          "font-medium text-sm",
                          isSelected ? "text-blue-900" : "text-gray-900"
                        )}>
                          {roleLabels[role]}
                        </div>
                        <div className={cn(
                          "text-xs mt-0.5",
                          isSelected ? "text-blue-600" : "text-gray-500"
                        )}>
                          {role === 'admin' ? '拥有系统管理权限' :
                           role === 'user' ? '普通业务操作权限' : '只读查看权限'}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                头像URL
              </label>
              <Input
                type="url"
                value={formData.avatarUrl}
                onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                取消
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '更新中...' : '更新'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}