
import { useAuthStore } from './store';
import { authApi } from './api';
import { AuthUser } from './types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../core/routes/paths';
import { parseError } from '../../core/utils/errorUtils';

export const useAuth = () => {
    const { user, isAuthenticated, isLoading, initialize, logout } = useAuthStore();

    return {
        user,
        isAuthenticated,
        isLoading,
        initialize,
        logout
    };
};

export const useLogin = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { login: setStoreUser } = useAuthStore();
    const navigate = useNavigate();

    const login = async (email: string, pass: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { data, error: loginError } = await authApi.signInWithPassword(email, pass);

            if (loginError) throw loginError;

            if (data.user) {
                const { data: profile } = await authApi.getProfile(data.user.id);

                if (profile) {
                    setStoreUser(profile as AuthUser);
                    navigate(ROUTES.DASHBOARD.ROOT);
                } else {
                    throw new Error("حسابك موجود ولكن ملف التعريف غير مكتمل. يرجى التواصل مع الدعم.");
                }
            }
        } catch (err: any) {
            const parsed = parseError(err);
            setError(parsed.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { login, isLoading, error };
};

export const useRegister = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const register = async (email: string, pass: string, companyName: string, fullName: string) => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Client-side Validation
            if (!email || !pass || !companyName || !fullName) {
                throw new Error("جميع الحقول مطلوبة");
            }
            if (pass.length < 6) {
                throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            }

            // 2. Call Supabase API
            const { data, error } = await authApi.signUp(email, pass, companyName, fullName);

            if (error) {
                throw error;
            }

            if (data.user) {
                // Check if session exists (Auto login vs Email Confirmation)
                if (data.session) {
                    navigate(ROUTES.DASHBOARD.ROOT);
                } else {
                    setIsSuccess(true);
                }
            }
        } catch (err: any) {
            const parsed = parseError(err);
            setError(parsed.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { register, isLoading, error, isSuccess };
};

export const usePasswordReset = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const requestReset = async (email: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await authApi.resetPasswordForEmail(email);
            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            const parsed = parseError(err);
            setError(parsed.message);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmUpdate = async (newPassword: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await authApi.updateUserPassword(newPassword);
            if (error) throw error;
            navigate(ROUTES.AUTH.LOGIN);
        } catch (err: any) {
            const parsed = parseError(err);
            setError(parsed.message);
        } finally {
            setIsLoading(false);
        }
    };

    return { requestReset, confirmUpdate, isLoading, error, success };
};

export const usePasswordChange = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const changePassword = async (newPassword: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const { error } = await authApi.updateUserPassword(newPassword);
            if (error) throw error;
            return true;
        } catch (err: any) {
            const parsed = parseError(err);
            setError(parsed.message);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return { changePassword, isLoading, error };
};
