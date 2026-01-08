import { Head, router, useForm, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';

export default function Welcome({ auth }) {
    const [mode, setMode] = useState('login');

    const loginForm = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const registerForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submitLogin = (e) => {
        e.preventDefault();
        loginForm.post(route('login'), {
            onFinish: () => loginForm.reset('password'),
        });
    };

    const submitRegister = (e) => {
        e.preventDefault();
        registerForm.post(route('register'), {
            onFinish: () => registerForm.reset('password', 'password_confirmation'),
        });
    };

    // Auto-redirect if already logged in
    useEffect(() => {
        if (auth.user) {
            router.visit(route('dashboard'));
        }
    }, [auth.user]);

    return (
        <>
            <Head title="Welcome - Invoice System" />
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md">
                    {/* Logo & Title */}
                    <div className="text-center mb-8">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-lg mx-auto mb-4">
                            <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Invoice System</h1>
                        <p className="text-slate-400">Manage invoices with ease</p>
                    </div>

                    {/* Auth Card */}
                    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-xl overflow-hidden">
                        <div className="flex border-b border-slate-700/50">
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('login');
                                    loginForm.reset();
                                    registerForm.reset();
                                }}
                                className={`flex-1 px-4 py-4 text-sm font-semibold transition ${
                                    mode === 'login'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-400 hover:text-slate-300'
                                }`}
                            >
                                Log In
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setMode('register');
                                    loginForm.reset();
                                    registerForm.reset();
                                }}
                                className={`flex-1 px-4 py-4 text-sm font-semibold transition ${
                                    mode === 'register'
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-400 hover:text-slate-300'
                                }`}
                            >
                                Register
                            </button>
                        </div>

                        <div className="p-6">
                            {mode === 'login' ? (
                                <form onSubmit={submitLogin} className="space-y-5">
                                    <div>
                                        <InputLabel htmlFor="login-email" value="Email" className="text-slate-200" />
                                        <TextInput
                                            id="login-email"
                                            type="email"
                                            name="email"
                                            value={loginForm.data.email}
                                            className="mt-2 block w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="your@email.com"
                                            isFocused={true}
                                            onChange={(e) => loginForm.setData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={loginForm.errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="login-password" value="Password" className="text-slate-200" />
                                        <TextInput
                                            id="login-password"
                                            type="password"
                                            name="password"
                                            value={loginForm.data.password}
                                            className="mt-2 block w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="••••••••"
                                            onChange={(e) => loginForm.setData('password', e.target.value)}
                                            required
                                        />
                                        <InputError message={loginForm.errors.password} className="mt-2" />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            id="remember"
                                            type="checkbox"
                                            checked={loginForm.data.remember}
                                            onChange={(e) => loginForm.setData('remember', e.target.checked)}
                                            className="rounded border-slate-600 bg-slate-700 text-indigo-600"
                                        />
                                        <label htmlFor="remember" className="ml-3 text-sm text-slate-300">
                                            Remember me
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loginForm.processing}
                                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {loginForm.processing ? 'Logging in...' : 'Log In'}
                                    </button>

                                    <div className="text-end">
                                        <Link
                                            href={route('password.request')}
                                            className="text-sm text-indigo-400 hover:text-indigo-300 underline transition"
                                        >
                                            Forgot your password?
                                        </Link>
                                    </div>

                                    {loginForm.errors.general && (
                                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                                            {loginForm.errors.general}
                                        </div>
                                    )}
                                </form>
                            ) : (
                                <form onSubmit={submitRegister} className="space-y-5">
                                    <div>
                                        <InputLabel htmlFor="register-name" value="Full Name" className="text-slate-200" />
                                        <TextInput
                                            id="register-name"
                                            type="text"
                                            name="name"
                                            value={registerForm.data.name}
                                            className="mt-2 block w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="John Doe"
                                            isFocused={true}
                                            onChange={(e) => registerForm.setData('name', e.target.value)}
                                            required
                                        />
                                        <InputError message={registerForm.errors.name} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="register-email" value="Email" className="text-slate-200" />
                                        <TextInput
                                            id="register-email"
                                            type="email"
                                            name="email"
                                            value={registerForm.data.email}
                                            className="mt-2 block w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="your@email.com"
                                            onChange={(e) => registerForm.setData('email', e.target.value)}
                                            required
                                        />
                                        <InputError message={registerForm.errors.email} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="register-password" value="Password" className="text-slate-200" />
                                        <TextInput
                                            id="register-password"
                                            type="password"
                                            name="password"
                                            value={registerForm.data.password}
                                            className="mt-2 block w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="••••••••"
                                            onChange={(e) => registerForm.setData('password', e.target.value)}
                                            required
                                        />
                                        <InputError message={registerForm.errors.password} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="register-password-confirm" value="Confirm Password" className="text-slate-200" />
                                        <TextInput
                                            id="register-password-confirm"
                                            type="password"
                                            name="password_confirmation"
                                            value={registerForm.data.password_confirmation}
                                            className="mt-2 block w-full rounded-lg border-slate-600 bg-slate-700/50 text-white placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                                            placeholder="••••••••"
                                            onChange={(e) => registerForm.setData('password_confirmation', e.target.value)}
                                            required
                                        />
                                        <InputError message={registerForm.errors.password_confirmation} className="mt-2" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={registerForm.processing}
                                        className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-700 disabled:opacity-50"
                                    >
                                        {registerForm.processing ? 'Creating account...' : 'Register'}
                                    </button>

                                    {registerForm.errors.general && (
                                        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                                            {registerForm.errors.general}
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-slate-400">
                        <p>Invoice System © 2026</p>
                    </div>
                </div>
            </div>
        </>
    );
}

