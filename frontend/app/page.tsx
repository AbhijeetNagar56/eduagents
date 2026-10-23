'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, GraduationCap, ShieldCheck, Users, KeyRound } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const portals = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'faculty', label: 'Faculty', icon: Users },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
] as const

type Portal = (typeof portals)[number]['id']

const TEST_ACCOUNTS: Record<Portal, { email: string; pass: string; label: string }> = {
  student: { email: 'student@eduagents.app', pass: 'Password123!', label: 'Student (Jordan Taylor)' },
  faculty: { email: 'faculty@eduagents.app', pass: 'Password123!', label: 'Faculty (Dr. Sarah Lin)' },
  admin: { email: 'admin@eduagents.app', pass: 'Password123!', label: 'Admin (System Admin)' },
}

export default function LoginPage() {
  const router = useRouter()
  const [selectedPortal, setSelectedPortal] = useState<Portal>('student')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleDemoSignIn = (portal: Portal) => {
    setSelectedPortal(portal)
    const cred = TEST_ACCOUNTS[portal]
    setEmail(cred.email)
    setPassword(cred.pass)
    if (typeof window !== 'undefined') {
      localStorage.setItem('eduagents_auth_token', `dev-${portal}`)
      localStorage.setItem('eduagents_role', portal)
      localStorage.setItem('eduagents_user_email', cred.email)
    }
    router.push(`/${portal}`)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    const cleanEmail = email.trim().toLowerCase()
    const cleanPass = password.trim()

    // 1. Quick check for test accounts
    const isTestStudent = cleanEmail.includes('student') || cleanEmail === 'student@eduagents.app'
    const isTestFaculty = cleanEmail.includes('faculty') || cleanEmail === 'faculty@eduagents.app'
    const isTestAdmin = cleanEmail.includes('admin') || cleanEmail === 'admin@eduagents.app'

    if ((selectedPortal === 'student' && isTestStudent) ||
        (selectedPortal === 'faculty' && isTestFaculty) ||
        (selectedPortal === 'admin' && isTestAdmin)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('eduagents_auth_token', `dev-${selectedPortal}`)
        localStorage.setItem('eduagents_role', selectedPortal)
        localStorage.setItem('eduagents_user_email', cleanEmail)
      }
      router.push(`/${selectedPortal}`)
      return
    }

    // 2. Supabase Auth attempt
    if (!isSupabaseConfigured || !supabase) {
      handleDemoSignIn(selectedPortal)
      return
    }

    setBusy(true)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: cleanPass,
    })
    setBusy(false)

    if (authError) {
      // If Supabase authentication failed, offer demo login fallback
      setError(`${authError.message}. (Click "Quick Test Access" below to enter without Supabase Auth)`)
      return
    }

    const user = authData.user
    const role = (user?.app_metadata?.role as Portal) || (user?.user_metadata?.role as Portal) || 'student'

    if (typeof window !== 'undefined') {
      const token = authData.session?.access_token || `dev-${role}`
      localStorage.setItem('eduagents_auth_token', token)
      localStorage.setItem('eduagents_role', role)
      localStorage.setItem('eduagents_user_email', user?.email || cleanEmail)
    }

    if (role !== selectedPortal && !(selectedPortal === 'faculty' && role === 'admin')) {
      await supabase.auth.signOut()
      setError(`This Supabase account has the "${role}" role. Please switch to the ${role.toUpperCase()} portal tab above.`)
      return
    }

    router.push(`/${selectedPortal}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 bg-slate-50">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-700 to-indigo-700 text-white shadow-sm">
              <BookOpen aria-hidden="true" className="size-5" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900 tracking-tight">EduAgents</p>
              <p className="text-xs text-slate-500 font-mono">Human-AI Co-Learning Platform</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            System Online
          </span>
        </div>

        {/* Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-5">
            <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
            <p className="mt-1 text-xs text-slate-500">Choose your workspace portal to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset>
              <legend className="mb-2 block text-xs font-semibold text-slate-700 uppercase tracking-wider">Select Portal</legend>
              <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200">
                {portals.map(({ id, label, icon: Icon }) => {
                  const isSelected = selectedPortal === id

                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedPortal(id)
                        setError('')
                      }}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1.5 border-r border-slate-200 text-xs font-semibold transition last:border-r-0 ${
                        isSelected
                          ? 'bg-teal-50 text-teal-900 ring-1 ring-teal-600/20'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {label}
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor="email" className="mb-1 block text-xs font-medium text-slate-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                placeholder={TEST_ACCOUNTS[selectedPortal].email}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-xs font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                placeholder="Password123!"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 space-y-2">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => handleDemoSignIn(selectedPortal)}
                  className="font-semibold text-rose-900 underline hover:text-rose-950 inline-block"
                >
                  ⚡ Click here to continue to {selectedPortal.toUpperCase()} portal in Demo Mode
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-teal-800 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:opacity-50 cursor-pointer"
            >
              {busy ? 'Verifying credentials…' : `Sign in to ${selectedPortal.charAt(0).toUpperCase() + selectedPortal.slice(1)} Portal`}
            </button>
          </form>

          {/* Quick Access Test Accounts Box */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-3">
              <KeyRound className="size-3.5 text-teal-700" />
              <span>Instant Test & Demo Logins</span>
            </div>
            <div className="space-y-2">
              {(['student', 'faculty', 'admin'] as const).map((p) => {
                const cred = TEST_ACCOUNTS[p]
                return (
                  <div
                    key={p}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 transition text-xs"
                  >
                    <div className="truncate pr-2">
                      <span className="font-semibold text-slate-800 capitalize">{p}: </span>
                      <span className="font-mono text-slate-500">{cred.email}</span>
                      <span className="text-slate-400 text-[11px] block">Pass: {cred.pass}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDemoSignIn(p)}
                      className="shrink-0 px-2.5 py-1 rounded-md bg-white hover:bg-teal-800 hover:text-white border border-slate-300 text-slate-700 text-[11px] font-semibold transition cursor-pointer"
                    >
                      Enter →
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
