# خطة التحسين والتطوير الشاملة - Al-Zahra Smart ERP

**تاريخ الخطة:** 26 فبراير 2026  
**الإصدار:** 3.0  
**الحالة:** قيد التنفيذ

---

## 📊 تقييم الوضع الراهن

| المعيار | التقييم الحالي | الهدف |
|--------|---------------|-------|
| TypeScript Strict | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Component Structure | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| State Management | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Error Handling | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Performance | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Security | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🎯 الأهداف الاستراتيجية

1. **إلغاء `any` بالكامل** - تحقيق TypeScript Strict بنسبة 100%
2. **معالجة أخطاء موحدة** - نظام مركزي للأخطاء
3. **أداء محسّن** - pagination + lazy loading
4. **أمان معزز** - مراجعة شاملة للصلاحيات

---

## المرحلة 1: إلغاء الـ `any` وتطبيق Strict Mode

### 1.1 إنشاء نظام أنواع مركزي

#### الملف: `src/core/types/common.ts`

```typescript
// ============================================
// Common Types - الأنواع الأساسية المشتركة
// ============================================

// قاعدة: استخدام UnknownRecord بدلاً من any
export type UnknownRecord = Record<string, unknown>;

// قاعدة: استخدام EntityId لجميع المعرفات
export type EntityId = string & { readonly __brand: unique symbol };

// قاعدة: إنشاء factory function للـ IDs
export const createEntityId = (id: string): EntityId => id as EntityId;

// قاعدة: Timestamp type
export type Timestamp = string; // ISO 8601

// قاعدة: Optional timestamp
export type OptionalTimestamp = Timestamp | null;

// قاعدة: Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// قاعدة: API Response wrapper
export interface ApiResponse<T> {
  data: T | null;
  error: AppError | null;
  success: boolean;
}

// قاعدة: AppError - بديل الـ any في الأخطاء
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: UnknownRecord
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export enum ErrorCode {
  // الأخطاء العامة
  UNKNOWN = 'UNKNOWN',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // أخطاء قاعدة البيانات
  DB_ERROR = 'DB_ERROR',
  DB_CONSTRAINT = 'DB_CONSTRAINT',
  
  // أخطاء المعاملات
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  
  // أخطاء الذكاء الاصطناعي
  AI_ERROR = 'AI_ERROR',
  AI_TIMEOUT = 'AI_TIMEOUT',
}

// قاعدة: Error factory functions
export const createError = {
  notFound: (resource: string, id?: string) => 
    new AppError(`${resource} غير موجود`, ErrorCode.NOT_FOUND, 404),
  
  unauthorized: (message = 'غير مصرح') => 
    new AppError(message, ErrorCode.UNAUTHORIZED, 401),
  
  forbidden: (message = 'وصول مرفوض') => 
    new AppError(message, ErrorCode.FORBIDDEN, 403),
  
  validation: (message: string, details?: UnknownRecord) => 
    new AppError(message, ErrorCode.VALIDATION, 400, details),
  
  dbError: (message: string, details?: UnknownRecord) => 
    new AppError(message, ErrorCode.DB_ERROR, 500, details),
};
```

### 1.2 إنشاء Error Handler مركزي

#### الملف: `src/core/hooks/useErrorHandler.ts`

```typescript
// ============================================
// useErrorHandler - Hook مركزي لمعالجة الأخطاء
// ============================================

import { useCallback } from 'react';
import { AppError, ErrorCode, UnknownRecord } from '../types/common';
import { useToastStore } from '@/features/ui/stores/toastStore';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  onError?: (error: AppError) => void;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const { showToast = true, logError = true, onError } = options;
  const { showToast: showToastNotification } = useToastStore();

  const handleError = useCallback((error: unknown, context?: string) => {
    // تحويل أي خطأ إلى AppError
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message,
        ErrorCode.UNKNOWN,
        500,
        { originalError: error.name, context }
      );
    } else {
      appError = new AppError(
        'حدث خطأ غير متوقع',
        ErrorCode.UNKNOWN,
        500,
        { context }
      );
    }

    // تسجيل الخطأ
    if (logError) {
      console.error('[Error]', context, appError);
    }

    // عرض إشعار
    if (showToast) {
      showToastNotification(appError.message, 'error');
    }

    // استدعاء callback
    onError?.(appError);

    return appError;
  }, [showToast, logError, onError, showToastNotification]);

  const handleErrorAsync = useCallback(async <T>(
    promise: Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      return await promise;
    } catch (error) {
      handleError(error, context);
      return null;
    }
  }, [handleError]);

  return { handleError, handleErrorAsync };
};

// قاعدة: استخدام UnknownRecord بدلاً من any في error boundaries
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: AppError, errorInfo: UnknownRecord) => void;
}
```

### 1.3 إنشاء Error Boundary مخصص

#### الملف: `src/core/components/ErrorBoundary.tsx`

```typescript
// ============================================
// Error Boundary - حدود الأخطاء المخصصة
// ============================================

import React, { Component, ReactNode } from 'react';
import { AppError, UnknownRecord } from '../types/common';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError, errorInfo: UnknownRecord) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(error.message, 'UNKNOWN', 500);
    
    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: UnknownRecord) {
    const appError = error instanceof AppError 
      ? error 
      : new AppError(error.message, 'UNKNOWN', 500);
    
    console.error('[ErrorBoundary]', appError, errorInfo);
    this.props.onError?.(appError, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-bold">حدث خطأ</h2>
          <p className="text-red-600">{this.state.error?.message}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
          >
            إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 1.4 تحديث ملفات hooks لإزالة `any`

#### قبل:
```typescript
onError: (error: any) => {
  showToast(error.message, 'error');
}
```

#### بعد:
```typescript
onError: (error: Error) => {
  const appError = error instanceof AppError 
    ? error 
    : new AppError(error.message, ErrorCode.UNKNOWN);
  showToast(appError.message, 'error');
}
```

### 1.5 قائمة الملفات المطلوب تحديثها (Phase 1)

| الملف | نوع الإصلاح | الأولوية |
|-------|------------|---------|
| `dashboard/service.ts` | إضافة أنواع للـ data processing | 🔴 عالية |
| `dashboardStats.ts` | أنواع للإحصائيات | 🔴 عالية |
| `dashboardInsights.ts` | أنواع للتحليلات | 🔴 عالية |
| `expenses/api.ts` | إزالة `as any` | 🔴 عالية |
| `purchases/api.ts` | إزالة `as any` | 🔴 عالية |
| `sales/api.ts` | إزالة `as any` | 🔴 عالية |

---

## المرحلة 2: تحسين معالجة الأخطاء

### 2.1 إنشاء Toast Store مركزي

#### الملف: `src/features/ui/stores/toastStore.ts`

```typescript
// ============================================
// Toast Store - نظام الإشعارات المركزي
// ============================================

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  
  addToast: (message, type, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }]
    }));
    
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id)
        }));
      }, duration);
    }
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }));
  },
  
  clearAll: () => set({ toasts: [] })
}));
```

### 2.2 إضافة Toast Component

#### الملف: `src/features/ui/components/ToastContainer.tsx`

```typescript
// ============================================
// Toast Container - حاوية الإشعارات
// ============================================

import { useToastStore, ToastType } from '../stores/toastStore';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="text-green-500" />,
  error: <AlertCircle className="text-red-500" />,
  warning: <AlertTriangle className="text-yellow-500" />,
  info: <Info className="text-blue-500" />
};

const styles: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200'
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg ${styles[toast.type]} animate-slide-in`}
        >
          {icons[toast.type]}
          <p className="text-sm font-medium">{toast.message}</p>
          <button onClick={() => removeToast(toast.id)} className="ml-2">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## المرحلة 3: تحسين الأداء

### 3.1 إضافة Server-Side Pagination Hook

#### الملف: `src/hooks/useServerPagination.ts`

```typescript
// ============================================
// useServerPagination - تدوير البيانات من السيرفر
// ============================================

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
import { PaginationParams, PaginatedResponse } from '@/core/types/common';

interface UseServerPaginationOptions<T> extends Omit<UseQueryOptions<PaginatedResponse<T>>, 'queryKey'> {
  queryKey?: unknown[];
}

export const useServerPagination = <T>(
  queryFn: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  options?: UseServerPaginationOptions<T>
) => {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const query = useQuery({
    queryKey: ['pagination', params],
    queryFn: () => queryFn(params),
    ...options
  });

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setParams((prev) => ({ ...prev, limit, page: 1 }));
  }, []);

  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams((prev) => ({ ...prev, sortBy, sortOrder }));
  }, []);

  const nextPage = useCallback(() => {
    if (query.data && params.page < query.data.totalPages) {
      setPage(params.page + 1);
    }
  }, [query.data, params.page, setPage]);

  const prevPage = useCallback(() => {
    if (params.page > 1) {
      setPage(params.page - 1);
    }
  }, [params.page, setPage]);

  const pagination = useMemo(() => ({
    page: params.page,
    limit: params.limit,
    total: query.data?.total ?? 0,
    totalPages: query.data?.totalPages ?? 0,
    hasNextPage: query.data ? params.page < query.data.totalPages : false,
    hasPrevPage: params.page > 1
  }), [params, query.data]);

  return {
    ...query,
    params,
    setPage,
    setLimit,
    setSort,
    nextPage,
    prevPage,
    pagination
  };
};
```

### 3.2 تطبيق Lazy Loading للمكونات

```typescript
// ============================================
// Lazy Loading - التحميل الكسول للمكونات
// ============================================

// بدلاً من:
import { HeavyComponent } from './HeavyComponent';

// استخدم:
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// مع Suspense:
<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

---

## المرحلة 4: تعزيز الأمان

### 4.1 إنشاء نظام صلاحيات مركزي

#### الملف: `src/core/permissions/permissions.ts`

```typescript
// ============================================
// Permissions - نظام الصلاحيات
// ============================================

import { User } from '@supabase/supabase-js';

export type Permission = 
  | 'sales:create' | 'sales:read' | 'sales:update' | 'sales:delete'
  | 'purchases:create' | 'purchases:read' | 'purchases:update' | 'purchases:delete'
  | 'accounting:create' | 'accounting:read' | 'accounting:update' | 'accounting:delete'
  | 'inventory:create' | 'inventory:read' | 'inventory:update' | 'inventory:delete'
  | 'customers:create' | 'customers:read' | 'customers:update' | 'customers:delete'
  | 'expenses:create' | 'expenses:read' | 'expenses:update' | 'expenses:delete'
  | 'reports:read' | 'reports:export'
  | 'ai:use' | 'admin:access';

export type Role = 'admin' | 'manager' | 'accountant' | 'sales' | 'viewer';

const rolePermissions: Record<Role, Permission[]> = {
  admin: '*' as any, // جميع الصلاحيات
  manager: [
    'sales:create', 'sales:read', 'sales:update',
    'purchases:create', 'purchases:read', 'purchases:update',
    'accounting:create', 'accounting:read', 'accounting:update',
    'inventory:read', 'inventory:update',
    'customers:create', 'customers:read', 'customers:update',
    'expenses:create', 'expenses:read', 'expenses:update',
    'reports:read', 'reports:export',
    'ai:use'
  ],
  accountant: [
    'sales:read', 'sales:update',
    'purchases:read',
    'accounting:create', 'accounting:read', 'accounting:update',
    'expenses:create', 'expenses:read', 'expenses:update',
    'reports:read', 'reports:export'
  ],
  sales: [
    'sales:create', 'sales:read',
    'customers:create', 'customers:read',
    'inventory:read'
  ],
  viewer: [
    'sales:read',
    'purchases:read',
    'accounting:read',
    'inventory:read',
    'customers:read',
    'reports:read'
  ]
};

export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  const permissions = rolePermissions[userRole];
  return permissions === '*' || permissions.includes(permission);
};

export const usePermissions = (userRole: Role) => {
  return {
    can: (permission: Permission) => hasPermission(userRole, permission),
    canAny: (permissions: Permission[]) => permissions.some(p => hasPermission(userRole, p)),
    canAll: (permissions: Permission[]) => permissions.every(p => hasPermission(userRole, p))
  };
};
```

---

## 📋 خطة التنفيذ التفصيلية

### الأسبوع 1: types و error handling

| اليوم | المهمة | الملفات |
|-------|--------|--------|
| 1 | إنشاء `src/core/types/common.ts` | types/common.ts |
| 2 | إنشاء `useErrorHandler.ts` | core/hooks/useErrorHandler.ts |
| 3 | إنشاء ErrorBoundary | core/components/ErrorBoundary.tsx |
| 4 | تحديث 5 ملفات hooks | accounting, sales, purchases |
| 5 | إنشاء toast system | features/ui/stores/toastStore.ts |

### الأسبوع 2: إزالة `any` من الخدمات

| اليوم | المهمة | الملفات |
|-------|--------|--------|
| 1 | تحديث dashboard service | dashboard/service.ts |
| 2 | تحديث dashboard stats | dashboard/services/dashboardStats.ts |
| 3 | تحديث expenses api | expenses/api.ts |
| 4 | تحديث purchases api | purchases/api.ts |
| 5 | تحديث sales api | sales/api.ts |

### الأسبوع 3: الأداء

| اليوم | المهمة | الملفات |
|-------|--------|--------|
| 1 | إنشاء useServerPagination | hooks/useServerPagination.ts |
| 2 | تطبيق pagination على invoices | sales/components/list |
| 3 | تطبيق pagination على customers | customers/components |
| 4 | تطبيق lazy loading | AI components |
| 5 | مراجعة وتحسين | - |

### الأسبوع 4: الأمان

| اليوم | المهمة | الملفات |
|-------|--------|--------|
| 1 | إنشاء نظام الصلاحيات | core/permissions |
| 2 | تطبيق الصلاحيات على Components | features/*/components |
| 3 | مراجعة RLS Policies | supabase |
| 4 | اختبار شامل | - |
| 5 | توثيق | - |

---

## ✅ ملخص التحسينات

| المرحلة | الهدف | الملفات المستهدفة |
|---------|-------|-----------------|
| 1 | إلغاء `any` + Strict Mode | 20+ ملف |
| 2 | معالجة أخطاء موحدة | 10+ ملف |
| 3 | أداء محسّن | 5+ ملفات |
| 4 | أمان معزز | 3+ ملفات |

---

*تم إنشاء هذه الخطة بواسطة Kilo Code*
