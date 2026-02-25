
export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  name?: string; // Alias for full_name for backward compatibility
  avatar_url?: string | null;

  // هذه الحقول تأتي الآن من جدول الربط (Join Table)
  // وتضاف برمجياً في الـ API Layer
  role?: string;
  company_id?: string;
  company_name?: string;
}

export interface LoginCredentials {
  email: string;
  pass: string;
}
