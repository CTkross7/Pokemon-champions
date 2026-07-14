import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth, updateProfile, USERNAME_RE, type Provider } from '@/lib/auth'
import Icon from '@/components/Icon'

const PROVIDER_LABEL: Record<Provider, string> = {
  google: 'Google',
  email: 'ChampsNote',
}

/** Resizes an image file to a square 128px JPEG data URI (small enough for D1). */
function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const size = 128
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('no ctx'))
      const s = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => reject(new Error('bad image'))
    img.src = URL.createObjectURL(file)
  })
}

export default function Profile() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user, ready, init, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void init()
  }, [init])

  const startEdit = () => {
    if (!user) return
    setName(user.displayName)
    setUsername(user.username)
    setAvatar(user.avatarUrl)
    setMsg('')
    setEditing(true)
  }

  const onPick = async (file?: File) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setMsg(t('auth.avatarTooBig'))
      return
    }
    try {
      setAvatar(await resizeAvatar(file))
    } catch {
      setMsg(t('auth.err_error'))
    }
  }

  const save = async () => {
    if (!user) return
    setBusy(true)
    setMsg('')
    const nextUsername = username.trim().toLowerCase()
    if (nextUsername !== user.username && !USERNAME_RE.test(nextUsername)) {
      setBusy(false)
      setMsg(t('auth.usernameInvalid'))
      return
    }
    const patch: { displayName?: string; username?: string; avatarUrl?: string } = {}
    if (name.trim() && name.trim() !== user.displayName) patch.displayName = name.trim()
    if (nextUsername && nextUsername !== user.username) patch.username = nextUsername
    if (avatar !== user.avatarUrl) patch.avatarUrl = avatar ?? ''
    const r = await updateProfile(patch)
    setBusy(false)
    if (r.ok) {
      setMsg(t('auth.saved'))
      setEditing(false)
    } else if (r.error === 'rename_cooldown') {
      const days = Math.ceil((r.availableInMs ?? 0) / (24 * 60 * 60 * 1000))
      setMsg(t('auth.nicknameCooldown', { days }))
    } else if (r.error === 'username_cooldown') {
      const days = Math.ceil((r.availableInMs ?? 0) / (24 * 60 * 60 * 1000))
      setMsg(t('auth.usernameCooldown', { days }))
    } else if (r.error === 'username_taken') {
      setMsg(t('auth.usernameTaken'))
    } else if (r.error === 'invalid_username') {
      setMsg(t('auth.usernameInvalid'))
    } else {
      setMsg(t('auth.err_error'))
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md">
        <div className="card grid place-items-center gap-3 p-8 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/6">
            <Icon name="user" size={26} />
          </span>
          <p className="text-sm font-bold">{t('auth.notLoggedIn')}</p>
          <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{t('auth.loginPrompt')}</p>
          <Link
            to="/login"
            className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-volt-400 px-5 py-2.5 text-sm font-bold text-black transition-colors hover:bg-volt-300"
          >
            {t('auth.loginCta')}
          </Link>
          {!ready && <span className="text-[11px] text-zinc-400 dark:text-zinc-600">{t('auth.checking')}</span>}
        </div>
      </div>
    )
  }

  const joined = new Date(user.createdAt).toLocaleDateString(i18n.language === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const cooldownDays = Math.ceil((user.renameAvailableInMs ?? 0) / (24 * 60 * 60 * 1000))
  const usernameCooldownDays = Math.ceil((user.usernameRenameAvailableInMs ?? 0) / (24 * 60 * 60 * 1000))

  const avatarNode = (url: string | null) =>
    url ? <img src={url} alt="" className="size-full object-cover" /> : <Icon name="user" size={30} />

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold tracking-tight">{t('auth.profileTitle')}</h1>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="rounded-full border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 transition-colors hover:border-volt-500 dark:border-white/10 dark:text-zinc-300"
          >
            {t('auth.editTitle')}
          </button>
        )}
      </div>

      <section className="card p-5">
        {editing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-volt-400/15 text-volt-600 dark:text-volt-300"
              >
                {avatarNode(avatar)}
                <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-[8px] font-bold text-white">{t('auth.changeAvatar')}</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0])} />
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={() => fileRef.current?.click()} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-bold text-zinc-600 dark:border-white/10 dark:text-zinc-300">
                  {t('auth.changeAvatar')}
                </button>
                {avatar && (
                  <button type="button" onClick={() => setAvatar(null)} className="text-[11px] font-bold text-red-500">
                    {t('auth.removeAvatar')}
                  </button>
                )}
              </div>
            </div>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{t('auth.nickname')}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                disabled={cooldownDays > 0}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-volt-500 disabled:opacity-50 dark:border-white/10 dark:bg-white/5"
              />
              {cooldownDays > 0 && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {t('auth.nicknameCooldown', { days: cooldownDays })}
                </span>
              )}
            </label>

            <label className="block space-y-1">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">{t('auth.usernameLabel')}</span>
              <div className="flex items-center rounded-lg border border-zinc-200 bg-white px-3 focus-within:border-volt-500 dark:border-white/10 dark:bg-white/5">
                <span className="text-sm font-bold text-zinc-400">@</span>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  maxLength={20}
                  disabled={usernameCooldownDays > 0}
                  placeholder="username"
                  className="w-full bg-transparent py-2.5 pl-1 text-sm outline-none disabled:opacity-50"
                />
              </div>
              {usernameCooldownDays > 0 ? (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                  {t('auth.usernameCooldown', { days: usernameCooldownDays })}
                </span>
              ) : (
                <span className="text-[11px] text-zinc-400 dark:text-zinc-500">{t('auth.usernameHint')}</span>
              )}
            </label>

            {msg && <p className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400">{msg}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={save}
                className="flex-1 rounded-xl bg-volt-400 py-2.5 text-sm font-bold text-black transition-colors enabled:hover:bg-volt-300 disabled:opacity-50"
              >
                {busy ? '…' : t('auth.saveProfile')}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold text-zinc-500 dark:border-white/10"
              >
                {t('report.close')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-volt-400/15 text-volt-600 dark:text-volt-300">
                {avatarNode(user.avatarUrl)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-extrabold">{user.displayName}</p>
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">@{user.username}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <Row label={t('auth.provider')} value={PROVIDER_LABEL[user.provider]} />
              {user.email && <Row label={t('auth.email')} value={user.email} />}
              <Row label={t('auth.memberSince')} value={joined} />
            </dl>
            {msg && <p className="mt-3 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">{msg}</p>}
          </>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Link
          to="/teams"
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-zinc-600 transition-colors hover:border-volt-500 dark:border-white/10 dark:text-zinc-300"
        >
          <Icon name="users" size={16} />
          {t('nav.teams')}
        </Link>
        <button
          type="button"
          onClick={async () => {
            await logout()
            navigate('/login', { replace: true })
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:border-red-400 dark:border-white/10"
        >
          <Icon name="logout" size={16} />
          {t('auth.logout')}
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-3 last:border-0 last:pb-0 dark:border-white/6">
      <dt className="font-bold text-zinc-400 dark:text-zinc-500">{label}</dt>
      <dd className="truncate text-right font-semibold">{value}</dd>
    </div>
  )
}
