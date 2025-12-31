import React, { createContext, useContext } from 'react';
import { User, AuditLog } from '../types';
import { DEFAULT_USERS } from '../constants';
import { useStickyState } from '../hooks/useStickyState';

interface AuthContextType {
    user: User | null;
    users: User[];
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    addUser: (user: User) => Promise<void>;
    updateUserStatus: (id: string, status: 'Active' | 'Inactive') => void;
    // We expose logAction helper here as Auth often needs to log things, 
    // or we can just keep basic logs. 
    // Ideally AuditLogs should be in Ops or a separate LoggerContext, 
    // but for now let's keep it simple.
}

// We'll need a way to log actions from Auth. 
// For this refactor, we might need to accept a 'logAction' callback prop 
// or simpler: AuthContext handles its own state, and we rely on the main LabContext 
// to aggregate logs if needed. 
// OR: We move AuditLogs to a separate context first?
// Let's stick to the plan: AuthContext handles ITS OWN data.

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useStickyState<User | null>(null, 'lims_current_user');
    const [users, setUsers] = useStickyState<User[]>(DEFAULT_USERS, 'lims_users');

    // Helper for SHA-256
    const hashPassword = async (password: string): Promise<string> => {
        const msgBuffer = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const login = async (email: string, pass: string) => {
        const inputHash = await hashPassword(pass);
        const found = users.find(u =>
            u.email.toLowerCase() === email.toLowerCase() &&
            u.passwordHash === inputHash &&
            u.status === 'Active'
        );
        if (found) {
            setUser(found);
            return true;
        }
        return false;
    };

    const logout = () => {
        setUser(null);
    };

    const addUser = async (u: User) => {
        const passHash = u.passwordHash ? u.passwordHash : await hashPassword('admin123');
        const newUser = {
            ...u,
            id: `USR-${Date.now()}`,
            passwordHash: passHash,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: user?.name || 'Admin'
        };
        setUsers(prev => [...prev, newUser]);
    };

    const updateUserStatus = (id: string, status: 'Active' | 'Inactive') => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    };

    return (
        <AuthContext.Provider value={{
            user, users, login, logout, addUser, updateUserStatus
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};
