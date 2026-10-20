'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, GraduationCap, ShieldCheck, Users } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const portals = [
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'faculty', label: 'Faculty', icon: Users },
  { id: 'admin', label: 'Admin', icon: ShieldCheck },
] as const

type Portal = (typeof portals)[number]['id']

export default function LoginPage() {
  const router = useRouter()
  const [selectedPortal, setSelectedPortal] = useState<Portal>('student')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!isSupabaseConfigured || !supabase) {
      setError('Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable sign-in.')
      return
    }
    setBusy(true)
    const form = new FormData(event.currentTarget)
    const { error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) })
    setBusy(false)
    if (authError) { setError(authError.message); return }
    const { data: { user } } = await supabase.auth.getUser()
    const role = user?.app_metadata?.role || 'student'
    if (role !== selectedPortal && !(selectedPortal === 'faculty' && role === 'admin')) {
      await supabase.auth.signOut()
      setError(`This account has the ${role} role. Select the matching portal.`)
      return
    }
    router.push(`/${selectedPortal}`)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-teal-800 text-white">
            <BookOpen aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">EduAgents</p>
            <p className="text-xs text-slate-500">Learning workspace</p>
          </div>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
            <p className="mt-1 text-sm text-slate-500">Choose a portal to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-slate-700">Portal</legend>
              <div className="grid grid-cols-3 overflow-hidden rounded-md border border-slate-200">
                {portals.map(({ id, label, icon: Icon }) => {
                  const isSelected = selectedPortal === id

                  return (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedPortal(id)}
                      className={`flex min-h-16 flex-col items-center justify-center gap-1.5 border-r border-slate-200 text-xs font-medium transition last:border-r-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-700 ${
                        isSelected
                          ? 'bg-teal-50 text-teal-800'
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
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                placeholder="you@university.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                placeholder="Enter your password"
              />
            </div>

            {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800"
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-400">Use your EduAgents Supabase account.</p>
        </section>
      </div>
    </main>
  )
}
