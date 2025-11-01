'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useConversations, useConversation, useTypingIndicator } from '../../lib/hooks/useMessaging'
import type { Conversation, Message as DBMessage, MessageOffer } from '../../lib/messaging'
import { MessagingAPI } from '../../lib/messaging'
import LoadingSpinner, { PageLoading, ButtonSpinner } from '../../components/LoadingSpinner'

/* ======================== Types ======================== */
type Role = 'homeowner' | 'pro'
type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered'
type Attachment = {
  id: string
  kind: 'image' | 'file'
  name: string
  url: string
  mime?: string
  size?: number
}
type MessageKind = 'text' | 'offer' | 'system' | 'file'
type Message = {
  id: string
  kind: MessageKind
  fromMe: boolean
  time: string
  status?: 'sent' | 'delivered' | 'seen'
  text?: string
  attachments?: Attachment[]
  offerTitle?: string
  offerPrice?: number
  offerDays?: number
  offerNotes?: string
  offerStatus?: OfferStatus
  counterPrice?: number
  counterDays?: number
  counterNotes?: string
  isDeleted?: boolean
  canDelete?: boolean
}

// Transform database message to UI message
function transformMessage(dbMessage: DBMessage, currentUserId: string): Message {
  const isFromMe = dbMessage.sender_id === currentUserId
  const isDeleted = dbMessage.metadata?.deleted || false
  const canDelete = MessagingAPI.canDeleteMessage(dbMessage, currentUserId, 24 * 60 * 60 * 1000) // 24 hours
  const attachments: Attachment[] = (dbMessage.attachments || []).map(att => ({
    id: att.id,
    kind: att.file_type.startsWith('image/') ? 'image' : 'file',
    name: att.file_name,
    url: att.file_url,
    mime: att.file_type,
    size: att.file_size
  }))

  const offer = dbMessage.offer
  return {
    id: dbMessage.id,
    kind: dbMessage.message_type as MessageKind,
    fromMe: isFromMe,
    time: new Date(dbMessage.created_at).toLocaleDateString() + ' ' + new Date(dbMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: isDeleted ? '[Message deleted]' : (dbMessage.content || undefined),
    attachments: isDeleted ? undefined : (attachments.length > 0 ? attachments : undefined),
    offerTitle: offer?.title,
    offerPrice: offer?.price,
    offerDays: offer?.delivery_days,
    offerNotes: offer?.notes,
    offerStatus: offer?.status as OfferStatus,
    counterPrice: offer?.counter_price,
    counterDays: offer?.counter_days,
    counterNotes: offer?.counter_notes,
    isDeleted,
    canDelete
  }
}

// Transform database conversation to UI thread
function transformConversation(conversation: Conversation, currentUserId: string): Thread {
  const isHomeowner = conversation.homeowner_id === currentUserId
  const counterpartName = isHomeowner ? conversation.pro_name : conversation.homeowner_name

  return {
    id: conversation.id,
    title: conversation.title,
    counterpart: counterpartName || 'Unknown User',
    role: isHomeowner ? 'homeowner' : 'pro',
    lastMessage: 'Loading...',
    lastTime: new Date(conversation.last_message_at).toLocaleDateString() + ' ' + new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: conversation.unread_count || 0,
    messages: []
  }
}
type Thread = {
  id: string
  title: string
  counterpart: string
  role: Role            // perspective of current user in this thread
  avatar?: string
  lastMessage: string
  lastTime: string
  unread: number
  tags?: string[]
  labels?: string[]
  pinned?: boolean
  hot?: boolean
  avgResponseMins?: number
  lastActive?: string
  messages: Message[]
}

/* ======================== Constants ======================== */
const LABELS = ['Quote sent', 'Scheduling', 'In progress', 'Awaiting parts', 'Closed'] as const

const QUICK_HOMEOWNER = [
  'Can you send me a quote?',
  'When can you start?',
  'What’s included?',
  'Can we do a quick call?'
]
const QUICK_PRO = [
  'I’m available tomorrow 2–4pm',
  'Can you share a photo?',
  'Here’s my quote.',
  'What’s the address?'
]
let AUTO_ID = 1000

/* ======================== Icons (inline) ======================== */
function PaperclipIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M21.44 11.05l-8.49 8.49a5.5 5.5 0 01-7.78-7.78l8.49-8.49a3.5 3.5 0 014.95 4.95l-8.49 8.49a1.5 1.5 0 11-2.12-2.12l7.07-7.07" />
    </svg>
  )
}
function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 13H8" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 17H8" />
      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10 9H8" />
    </svg>
  )
}
function RedPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14 3l7 7-3.5.5L12 16 8 12l5.5-5.5L14 3z" />
      <path d="M12 16l-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}
function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M12 7v6l4 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ======================== Constants ======================== */

/* ======================== Helpers ======================== */
function classNames(...c: Array<string | boolean | undefined>) {
  return c.filter(Boolean).join(' ')
}
function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(s => s[0]?.toUpperCase() ?? '').slice(0, 2).join('')
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold">
      {initials || 'A'}
    </div>
  )
}
function useAutogrow(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [ref, value])
}
function highlight(text: string, q: string) {
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text
  const before = text.slice(0, idx)
  const match = text.slice(idx, idx + q.length)
  const after = text.slice(idx + q.length)
  return (
    <>
      {before}
      <mark className="bg-yellow-200">{match}</mark>
      {after}
    </>
  )
}

/* ======================== Page (guarded) ======================== */
function SignInPrompt() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
        <p className="text-gray-600 mb-4">This area requires an account.</p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Sign in
        </button>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  const { user, loading, userProfile } = useAuth()

  if (loading) return <PageLoading isLoading={true} loadingText="Loading messages..." children={null} />
  if (!user) return <SignInPrompt />

  return <MessagesContent />
}

function MessagesContent() {
  const { user, userProfile } = useAuth()
  const { conversations, loading: conversationsLoading, createConversation, markConversationAsRead } = useConversations()
  const searchParams = useSearchParams()
  const [activeId, setActiveId] = useState<string>('')
  const [query, setQuery] = useState('')

  // Role-specific filter states
  type BaseFilter = 'all' | 'unread' | 'starred'
  type ExtraFilter = 'quotes' | 'hot'
  const [filter, setFilter] = useState<BaseFilter | ExtraFilter>('all')
  const [labelFilter, setLabelFilter] = useState<string>('all')

  const authRole = userProfile?.role as Role // homeowner | pro

  // Transform conversations to threads format - all hooks before early returns
  const threads = useMemo(() => {
    if (!user?.id) return []
    return conversations.map(conv => transformConversation(conv, user.id))
  }, [conversations, user?.id])

  // Set initial active conversation from URL or first conversation
  useEffect(() => {
    const conversationFromUrl = searchParams?.get('conversation')
    if (conversationFromUrl && threads.some(t => t.id === conversationFromUrl)) {
      setActiveId(conversationFromUrl)
      markConversationAsRead(conversationFromUrl)
    } else if (threads.length > 0 && !activeId) {
      setActiveId(threads[0].id)
      markConversationAsRead(threads[0].id)
    }
  }, [threads, activeId, searchParams, markConversationAsRead])

  const sorted = useMemo(() => {
    const copy = [...threads]
    copy.sort((a, b) => Number(b.pinned) - Number(a.pinned))
    return copy
  }, [threads])

  const filtered = useMemo(() => {
    let data = sorted
    const q = query.trim().toLowerCase()
    if (q) {
      data = data.filter(
        t =>
          t.title.toLowerCase().includes(q) ||
          t.counterpart.toLowerCase().includes(q) ||
          t.lastMessage.toLowerCase().includes(q) ||
          t.messages.some(m => (m.text || '').toLowerCase().includes(q))
      )
    }
    if (filter === 'unread') data = data.filter(t => t.unread > 0)
    if (filter === 'quotes') {
      data = data.filter(t => t.messages.some(m => m.kind === 'offer'))
    }
    if (filter === 'hot') {
      data = data.filter(t => t.hot)
    }
    if (labelFilter !== 'all') data = data.filter(t => t.labels?.includes(labelFilter))
    return data
  }, [sorted, query, filter, labelFilter])

  const active = useMemo(
    () => threads.find(t => t.id === activeId) ?? null,
    [threads, activeId]
  )
  const unreadCount = threads.reduce((n, t) => n + (t.unread > 0 ? 1 : 0), 0)

  // Show loading spinner while conversations are loading
  if (conversationsLoading) {
    return <PageLoading isLoading={true} loadingText="Loading conversations..." children={null} />
  }


  return (
    <div className="mx-auto flex h-[calc(100vh-5rem)] max-w-7xl gap-4 px-4 py-4">
      {/* Left: thread list */}
      <aside className="hidden w-[360px] shrink-0 flex-col rounded-2xl border bg-white md:flex">
        <div className="flex items-center justify-between gap-2 border-b p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              Messages
            </span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                {unreadCount} unread
              </span>
            )}
          </div>
          <Link href="/post-job" className="rounded-md border px-2.5 py-1 text-xs hover:bg-slate-50">
            New chat
          </Link>
        </div>

        <div className="border-b p-3">
          {/* search */}
          <div className="flex rounded-xl border bg-white px-3 py-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search messages"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          {/* filters */}
          <div className="mt-2 flex flex-wrap items-center gap-1 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={classNames('rounded-md px-2 py-1', filter === 'all' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100')}
            >All</button>
            <button
              onClick={() => setFilter('unread')}
              className={classNames('rounded-md px-2 py-1', filter === 'unread' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100')}
            >Unread</button>
            <button
              onClick={() => setFilter('starred')}
              className={classNames('rounded-md px-2 py-1', filter === 'starred' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100')}
            >Starred</button>

            {authRole === 'homeowner' && (
              <button
                onClick={() => setFilter('quotes')}
                className={classNames('rounded-md px-2 py-1', filter === 'quotes' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100')}
              >Quotes</button>
            )}
            {authRole === 'pro' && (
              <button
                onClick={() => setFilter('hot')}
                className={classNames('rounded-md px-2 py-1', filter === 'hot' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100')}
              >Hot leads</button>
            )}

            {/* nicer label filter */}
            <div className="ml-auto flex items-center gap-1">
              <span className="text-slate-500">Label</span>
              <LabelsDropdown
                value={labelFilter === 'all' ? [] : [labelFilter]}
                onChange={(vals) => setLabelFilter(vals[0] ?? 'all')}
                single
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="text-slate-400 mb-2">
                <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-slate-600 mb-1">No conversations yet</p>
              <p className="text-xs text-slate-400">Start a conversation to see it here</p>
            </div>
          ) : (
            filtered.map(t => {
              const isActive = t.id === activeId
              const q = query.trim()
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveId(t.id)
                    markConversationAsRead(t.id)
                  }}
                  className={classNames(
                    'mb-1 flex w-full items-start gap-3 rounded-xl border p-2 text-left',
                    isActive ? 'border-emerald-300 bg-emerald-50/60' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <Avatar name={t.counterpart} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-sm font-semibold text-slate-800">{highlight(t.counterpart, q)}</div>
                      <div className="shrink-0 text-[11px] text-slate-500">{t.lastTime}</div>
                    </div>
                    <div className="truncate text-[13px] text-slate-600">{t.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      {t.unread > 0 && (
                        <span className="ml-auto rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{t.unread}</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </aside>

      {/* Right: chat window */}
      <section className="relative flex min-w-0 flex-1 flex-col rounded-2xl border bg-white">
        {activeId ? (
          <ActiveConversation
            conversationId={activeId}
            authRole={authRole}
            query={query}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-slate-500">
            Select a conversation to start messaging
          </div>
        )}
      </section>
    </div>
  )
}

/* ======================== Labels ======================== */
function LabelChip({ name }: { name: string }) {
  const map: Record<string, string> = {
    'Quote sent': 'bg-violet-100 text-violet-700',
    'Scheduling': 'bg-amber-100 text-amber-800',
    'In progress': 'bg-sky-100 text-sky-800',
    'Awaiting parts': 'bg-rose-100 text-rose-800',
    'Closed': 'bg-emerald-100 text-emerald-800',
  }
  const cls = map[name] || 'bg-slate-100 text-slate-700'
  return <span className={classNames('rounded-full px-2 py-0.5 text-[10px] font-medium', cls)}>{name}</span>
}
function LabelsDropdown({
  value, onChange, single = false,
}: { value: string[]; onChange: (vals: string[]) => void; single?: boolean }) {
  const [open, setOpen] = useState(false)
  function toggle(val: string) {
    if (single) return onChange([val])
    const set = new Set(value)
    set.has(val) ? set.delete(val) : set.add(val)
    onChange(Array.from(set))
  }
  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 rounded-md border px-2.5 py-1 text-xs hover:bg-slate-50">
        Labels
        {value.length > 0 && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">{value.length}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-56 rounded-md border bg-white p-2 text-sm shadow">
          {LABELS.map(l => {
            const checked = value.includes(l)
            return (
              <label key={l} className="flex cursor-pointer items-center justify-between rounded-md px-2 py-1 hover:bg-slate-50">
                <span className="text-xs">{l}</span>
                <input type={single ? 'radio' : 'checkbox'} checked={checked} onChange={() => toggle(l)} />
              </label>
            )
          })}
          <div className="mt-2 flex items-center justify-end gap-2">
            {!single && <button className="btn btn-outline text-xs" onClick={() => onChange([])}>Clear</button>}
            <button className="btn-primary text-xs" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ======================== Chat View ======================== */
function ChatView({
  thread, query, onSend, onSendOffer, onUpdateOffer, onSystem, authRole, userType,
}: {
  thread?: Thread
  query: string
  onSend: (text: string, attachments?: Attachment[]) => void
  onSendOffer: (payload: { title: string; price: number; days: number; notes: string }) => void
  onUpdateOffer: (msgId: string, updater: (m: Message) => Message) => void
  onSystem: (text: string) => void
  authRole?: Role
  userType?: 'homeowner' | 'contractor'
}) {
  const [text, setText] = useState('')
  const [showOffer, setShowOffer] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [typingOther, setTypingOther] = useState(false)
  const [scheduled, setScheduled] = useState<{ id: number; text: string; when: number }[]>([])
  const [showScheduler, setShowScheduler] = useState(false)

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  useAutogrow(inputRef, text)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight + 1000
    setShowOffer(false)
    setText('')
    setAttachments([])
    setTypingOther(false)
    setShowScheduler(false)
  }, [thread?.id])

  function pokeTyping() { setTypingOther(true); setTimeout(() => setTypingOther(false), 1400) }
  function submitNow() {
    const trimmed = text.trim()
    if (!trimmed && attachments.length === 0) return
    onSend(trimmed, attachments)
    setText(''); setAttachments([]); pokeTyping()
  }
  function scheduleSend(mins: number) {
    const trimmed = text.trim()
    if (!trimmed) return
    const id = AUTO_ID++; const when = Date.now() + mins * 60 * 1000
    setScheduled(prev => [...prev, { id, text: trimmed, when }])
    setText(''); setShowScheduler(false)
    setTimeout(() => { onSend(trimmed); setScheduled(prev => prev.filter(x => x.id !== id)) }, mins * 60 * 1000)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (!files.length) return
    const newAtt: Attachment[] = files.map(f => ({
      id: `a${AUTO_ID++}`, kind: f.type.startsWith('image/') ? 'image' : 'file',
      name: f.name, url: URL.createObjectURL(f), mime: f.type, size: f.size,
    }))
    setAttachments(prev => [...prev, ...newAtt])
  }

  if (!thread) return <div className="flex flex-1 items-center justify-center text-slate-500">No conversation selected</div>

  const quick = authRole === 'pro' ? QUICK_PRO : QUICK_HOMEOWNER

  return (
    <>
      <div
        ref={listRef}
        className="relative flex-1 overflow-auto p-4"
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {dragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50">
            <div className="rounded-md bg-white px-4 py-2 text-sm text-emerald-700 shadow">Drop files to attach</div>
          </div>
        )}

        {thread.messages.map(msg =>
          msg.kind === 'offer' ? (
            <OfferBubble
              key={msg.id}
              msg={msg}
              isPro={thread.role === 'pro'}
              userType={userType}
              onAccept={() => { onUpdateOffer(msg.id, m => ({ ...m, offerStatus: 'accepted' })); onSystem('Offer accepted') }}
              onDecline={() => { onUpdateOffer(msg.id, m => ({ ...m, offerStatus: 'declined' })); onSystem('Offer declined') }}
              onRequestChanges={() => onUpdateOffer(msg.id, m => ({ ...m, offerStatus: 'countered' }))}
              onSubmitCounter={(price, days, notes) => {
                onUpdateOffer(msg.id, m => ({ ...m, offerStatus: 'countered', counterPrice: price, counterDays: days, counterNotes: notes }))
                onSystem('Counter-offer proposed')
              }}
              onAcceptCounter={() => { onUpdateOffer(msg.id, m => ({ ...m, offerStatus: 'accepted' })); onSystem('Counter-offer accepted') }}
              query={query}
            />
          ) : msg.kind === 'system' ? (
            <SystemBubble key={msg.id} text={msg.text || ''} />
          ) : (
            <Bubble key={msg.id} msg={msg} query={query} userType={userType} />
          )
        )}

        {typingOther && <div className="mt-2 text-[11px] text-slate-500">… typing</div>}
      </div>

      {/* Pro-only: Send Quote toolbar + composer */}
      {thread.role === 'pro' && authRole === 'pro' && (
        <>
          <div className="flex items-center justify-end gap-2 border-t bg-white/60 px-3 py-2">
            <button
              onClick={() => setShowOffer(v => !v)}
              className={classNames(
                'flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm',
                showOffer ? 'bg-emerald-600 text-white border-emerald-600' : 'hover:bg-slate-50'
              )}
            >
              <FileTextIcon className="h-4 w-4" />
              {showOffer ? 'Close Quote' : 'Send Quote'}
            </button>
          </div>
          {showOffer && (
            <div className="border-t bg-emerald-50/50 p-3">
              <OfferComposer onCancel={() => setShowOffer(false)} onSubmit={(p) => { onSendOffer(p); setShowOffer(false) }} />
            </div>
          )}
        </>
      )}

      {/* Role-specific quick replies */}
      <div className="border-t bg-white/70 px-3 py-2">
        <div className="flex flex-wrap gap-2">
          {quick.map((qr) => (
            <button
              key={qr}
              onClick={() => setText(t => (t ? `${t} ${qr}` : qr))}
              className="rounded-full border px-3 py-1 text-xs hover:bg-slate-50"
            >
              {qr}
            </button>
          ))}
        </div>
      </div>

      {/* Composer (same for both) */}
      <Composer
        text={text}
        setText={setText}
        attachments={attachments}
        setAttachments={setAttachments}
        onSubmit={submitNow}
        scheduledCount={scheduled.length}
        showScheduler={showScheduler}
        setShowScheduler={setShowScheduler}
        onSchedule={scheduleSend}
        authRole={authRole}
      />
    </>
  )
}

/* ======================== Bubbles ======================== */
function Bubble({ msg, query, userType }: { msg: Message; query: string; userType?: 'homeowner' | 'contractor' }) {
  const isMe = msg.fromMe
  const isPro = userType === 'contractor'

  // Color scheme based on user type
  const myBubbleColor = isPro
    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-600'
    : 'bg-gradient-to-br from-emerald-600 to-emerald-700 text-white border-emerald-600'

  const myAvatarColor = isPro
    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
    : 'bg-gradient-to-br from-emerald-400 to-emerald-600'

  const myTextColor = isPro ? 'text-blue-100/90' : 'text-emerald-100/90'

  const otherAvatarColor = isPro
    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'  // Homeowner (green) when contractor is viewing
    : 'bg-gradient-to-br from-blue-400 to-blue-600'         // Contractor (blue) when homeowner is viewing

  return (
    <div className={classNames('mb-4 flex items-end gap-3', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe && <div className={classNames('h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md', otherAvatarColor)}>
        {/* Avatar placeholder */}
      </div>}
      <div className={classNames('max-w-[85%] rounded-3xl px-5 py-4 text-base shadow-lg border-2 transition-all hover:shadow-xl',
        isMe ? myBubbleColor : 'bg-white text-slate-900 border-slate-200')}>
        {msg.text && <div className="whitespace-pre-wrap leading-relaxed">{highlight(msg.text, query)}</div>}
        {msg.attachments && msg.attachments.length > 0 && <AttachmentTiles attachments={msg.attachments} dark={isMe} />}
        <div className={classNames('mt-2 flex items-center gap-2 text-xs', isMe ? myTextColor : 'text-slate-500')}>
          <span>{msg.time}</span>
          {isMe && msg.status && <span>• {msg.status}</span>}
        </div>
      </div>
      {isMe && <div className={classNames('h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md', myAvatarColor)}>
        {/* User avatar */}
      </div>}
    </div>
  )
}
function SystemBubble({ text }: { text: string }) {
  return (
    <div className="my-2 flex justify-center">
      <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-600">{text}</div>
    </div>
  )
}
function OfferBubble({
  msg, isPro, userType, onAccept, onDecline, onRequestChanges, onSubmitCounter, onAcceptCounter, query,
}: {
  msg: Message; isPro: boolean; userType?: 'homeowner' | 'contractor'; onAccept: () => void; onDecline: () => void; onRequestChanges: () => void;
  onSubmitCounter: (price: number, days: number, notes: string) => void; onAcceptCounter: () => void; query: string
}) {
  const [showCounter, setShowCounter] = useState(false)
  const isMe = msg.fromMe
  const status = msg.offerStatus || 'pending'

  // Color scheme based on user type for offer bubbles
  const isContractor = userType === 'contractor'
  const myBorderColor = isContractor ? 'border-blue-300' : 'border-emerald-300'
  const headerBg = isContractor
    ? 'bg-gradient-to-r from-blue-600 to-blue-700'
    : 'bg-gradient-to-r from-emerald-600 to-emerald-700'
  const otherAvatarColor = isContractor
    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600'
    : 'bg-gradient-to-br from-blue-400 to-blue-600'

  return (
    <div className={classNames('mb-4 flex items-end gap-3', isMe ? 'justify-end' : 'justify-start')}>
      {!isMe && <div className={classNames('h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md', otherAvatarColor)} />}
      <div className={classNames('max-w-[85%] overflow-hidden rounded-3xl border-2 bg-white text-base shadow-lg transition-all hover:shadow-xl',
        isMe ? myBorderColor : 'border-slate-300')}>
        <div className={classNames('flex items-center gap-3 border-b-2 px-5 py-4 text-white', headerBg)}>
          <FileTextIcon className="h-5 w-5" />
          <div className="font-bold text-lg">Quote</div>
          <div className="ml-auto text-xs opacity-90">{msg.time}</div>
        </div>
        <div className="p-5">
          <div className="mb-3 text-base font-bold text-slate-900">
            {highlight(msg.offerTitle || 'Service Quote', query)}
          </div>
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <div className="rounded-xl bg-emerald-50 px-4 py-2 text-base font-bold text-emerald-700 border-2 border-emerald-200">
              ${msg.offerPrice?.toLocaleString()}
            </div>
            <div className="rounded-xl border-2 px-4 py-2 text-sm font-medium text-slate-700 border-slate-300">
              {msg.offerDays} {msg.offerDays === 1 ? 'day' : 'days'}
            </div>
            <StatusPill status={status} />
          </div>
          {msg.offerNotes && <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-700">{highlight(msg.offerNotes, query)}</p>}

          {status === 'countered' && (
            <div className="mt-3 rounded-md border bg-amber-50 p-2 text-[13px] text-amber-900">
              <div className="mb-1 font-semibold">Counter-offer</div>
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-amber-100 px-2 py-1 font-semibold">${msg.counterPrice?.toLocaleString()}</div>
                <div className="rounded-md border px-2 py-1">{msg.counterDays} {msg.counterDays === 1 ? 'day' : 'days'}</div>
              </div>
              {msg.counterNotes && <div className="mt-1 text-slate-700">{msg.counterNotes}</div>}
              {isPro && (
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button onClick={onAcceptCounter} className="btn-primary text-xs font-semibold">
                    Accept counter
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center justify-end gap-2">
            {status === 'pending' && !isPro && !isMe && (
              <>
                <button onClick={onDecline} className="btn btn-outline text-xs">Decline</button>
                <button onClick={() => { onRequestChanges(); setShowCounter(true) }} className="btn btn-outline text-xs">Request changes</button>
                <button onClick={onAccept} className="btn-primary text-xs font-semibold">Accept</button>
              </>
            )}
            {status === 'pending' && isPro && isMe && (
              <>
                <button className="btn btn-outline text-xs" onClick={() => alert('Edit offer (stub)')}>Edit</button>
                <button className="btn btn-outline text-xs" onClick={() => alert('Withdraw offer (stub)')}>Withdraw</button>
              </>
            )}
          </div>

          {showCounter && !isPro && !isMe && status === 'countered' && (
            <div className="mt-3 rounded-md border bg-white p-2">
              <CounterForm
                defaultPrice={msg.offerPrice || 0}
                defaultDays={msg.offerDays || 1}
                onCancel={() => setShowCounter(false)}
                onSubmit={(p, d, n) => { onSubmitCounter(p, d, n); setShowCounter(false) }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
function StatusPill({ status }: { status: OfferStatus }) {
  const map: Record<OfferStatus, string> = {
    pending: 'bg-slate-100 text-slate-700',
    accepted: 'bg-emerald-100 text-emerald-800',
    declined: 'bg-rose-100 text-rose-800',
    countered: 'bg-amber-100 text-amber-800',
  }
  return <span className={classNames('rounded-md px-2 py-0.5 text-[11px] font-semibold', map[status])}>{status}</span>
}

/* ======================== Attachments ======================== */
function AttachmentTiles({ attachments, dark }: { attachments: Attachment[]; dark: boolean }) {
  const [lightbox, setLightbox] = useState<Attachment | null>(null)
  return (
    <>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {attachments.map(att =>
          att.kind === 'image' ? (
            <button key={att.id} onClick={() => setLightbox(att)} className="overflow-hidden rounded-md border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={att.url} alt={att.name} className="h-24 w-full object-cover" />
            </button>
          ) : (
            <a key={att.id} href={att.url} target="_blank" rel="noreferrer" className={classNames(
              'flex items-center gap-2 rounded-md border px-2 py-1 text-xs',
              dark ? 'border-white/30' : 'border-slate-200'
            )}>
              <span className="truncate">{att.name}</span>
            </a>
          )
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-6" onClick={() => setLightbox(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightbox.url} alt={lightbox.name} className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl" />
        </div>
      )}
    </>
  )
}

/* ======================== Composer ======================== */
function Composer({
  text, setText, attachments, setAttachments, onSubmit,
  scheduledCount, showScheduler, setShowScheduler, onSchedule, authRole
}: {
  text: string
  setText: (v: string) => void
  attachments: Attachment[]
  setAttachments: (v: Attachment[]) => void
  onSubmit: () => void
  scheduledCount: number
  showScheduler: boolean
  setShowScheduler: (v: boolean) => void
  onSchedule: (mins: number) => void
  authRole?: Role
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="border-t p-3">
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs">
              <span className="truncate max-w-[220px]">{att.name}</span>
              <button className="text-slate-500 hover:text-slate-700" onClick={() => setAttachments(attachments.filter(a => a.id !== att.id))}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3 rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-md focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
        <input
          ref={inputRef} type="file" multiple hidden
          onChange={e => {
            const files = Array.from(e.target.files || [])
            const newAtt: Attachment[] = files.map(f => ({
              id: `a${AUTO_ID++}`, kind: f.type.startsWith('image/') ? 'image' : 'file',
              name: f.name, url: URL.createObjectURL(f), mime: f.type, size: f.size,
            }))
            setAttachments([...attachments, ...newAtt])
          }}
        />
        <button title="Attach" className="btn p-3 hover:bg-slate-100 rounded-full transition-colors" onClick={() => inputRef.current?.click()}>
          <PaperclipIcon className="h-5 w-5 text-slate-600" />
        </button>

        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write your message..."
          rows={1}
          className="min-h-[44px] max-h-[200px] w-full resize-none bg-transparent text-base outline-none placeholder:text-slate-400 py-2"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit() } }}
        />

        <div className="relative">
          <button title="Schedule" className="btn p-3 hover:bg-slate-100 rounded-full transition-colors" onClick={() => setShowScheduler(!showScheduler)}>
            <ClockIcon className="h-5 w-5 text-slate-600" />
          </button>
          {showScheduler && (
            <div className="absolute right-0 bottom-full mb-2 z-10 w-48 rounded-xl border-2 bg-white p-3 shadow-xl">
              <div className="mb-2 text-xs font-semibold text-slate-500">Send later</div>
              <div className="flex flex-wrap gap-2">
                {[5, 15, 60].map(m => (
                  <button key={m} className="btn btn-outline text-xs px-3 py-1.5 rounded-lg" onClick={() => onSchedule(m)}>
                    in {m} min
                  </button>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500">Scheduled: {scheduledCount}</div>
            </div>
          )}
        </div>

        <button onClick={onSubmit} className={classNames(
          'text-sm font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform shadow-md',
          authRole === 'pro' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'btn-primary'
        )}>
          Send
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-500 text-center">Press Enter to send • Shift+Enter for new line</div>
    </div>
  )
}

/* ======================== Offer Composer & Counter ======================== */
function OfferComposer({ onCancel, onSubmit }: { onCancel: () => void; onSubmit: (payload: { title: string; price: number; days: number; notes: string }) => void }) {
  const [title, setTitle] = useState('Diagnostic & Repair Visit')
  const [price, setPrice] = useState<string>('150')
  const [days, setDays] = useState<string>('1')
  const [notes, setNotes] = useState('Includes first hour on site. Parts/labor beyond that quoted before proceeding.')

  const priceNum = Number(price.replace(/[^\d.]/g, ''))
  const daysNum = Number(days.replace(/[^\d]/g, ''))
  const valid = title.trim().length > 0 && priceNum > 0 && daysNum > 0

  return (
    <div className="mx-auto max-w-3xl rounded-xl border bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <FileTextIcon className="h-4 w-4 text-emerald-700" />
        <div className="text-sm font-semibold">Create Quote</div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="e.g., Replace evaporator coil" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Price (USD)</label>
          <input value={price} onChange={e => setPrice(e.target.value)} inputMode="decimal" className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="0.00" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Delivery time (days)</label>
          <input value={days} onChange={e => setDays(e.target.value)} inputMode="numeric" className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="1" />
        </div>
        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-medium text-slate-600">Notes / Scope</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200" placeholder="Describe what is included…" />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2">
        <button onClick={onCancel} className="btn btn-outline text-sm">Cancel</button>
        <button
          disabled={!valid}
          onClick={() => valid && onSubmit({ title: title.trim(), price: priceNum, days: daysNum, notes: notes.trim() })}
          className="btn-primary text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Send Quote
        </button>
      </div>
    </div>
  )
}

function CounterForm({ defaultPrice, defaultDays, onCancel, onSubmit }: { defaultPrice: number; defaultDays: number; onCancel: () => void; onSubmit: (price: number, days: number, notes: string) => void }) {
  const [price, setPrice] = useState(String(defaultPrice))
  const [days, setDays] = useState(String(defaultDays))
  const [notes, setNotes] = useState('Could you do a bit better on price?')

  const priceNum = Number(price.replace(/[^\d.]/g, ''))
  const daysNum = Number(days.replace(/[^\d]/g, ''))
  const valid = priceNum > 0 && daysNum > 0

  return (
    <div className="grid gap-2 md:grid-cols-3">
      <div>
        <label className="mb-1 block text-[11px] text-slate-600">Counter price</label>
        <input value={price} onChange={e => setPrice(e.target.value)} className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-200" />
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-slate-600">Days</label>
        <input value={days} onChange={e => setDays(e.target.value)} className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-200" />
      </div>
      <div className="md:col-span-3">
        <label className="mb-1 block text-[11px] text-slate-600">Notes</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-md border px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-amber-200" rows={2} />
      </div>
      <div className="flex items-center justify-end gap-2 md:col-span-3">
        <button onClick={onCancel} className="btn btn-outline text-sm">Cancel</button>
        <button disabled={!valid} onClick={() => valid && onSubmit(priceNum, daysNum, notes.trim())} className="btn-primary text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed">
          Send counter
        </button>
      </div>
    </div>
  )
}

/* ======================== Active Conversation ======================== */
function ActiveConversation({
  conversationId,
  authRole,
  query
}: {
  conversationId: string;
  authRole?: Role;
  query: string
}) {
  const { user } = useAuth()
  const { conversation, messages, loading, sendMessage, sendOffer, setTyping } = useConversation(conversationId)
  const { handleTyping, stopTyping } = useTypingIndicator(conversationId, setTyping)

  // Transform messages for UI
  const uiMessages = useMemo(() => {
    if (!user?.id) return []
    return (messages || []).map(msg => transformMessage(msg, user.id))
  }, [messages, user?.id])

  // Create thread object for ChatView
  const thread = useMemo(() => {
    if (!conversation || !user?.id) return undefined

    const transformed = transformConversation(conversation, user.id)
    return {
      ...transformed,
      messages: uiMessages
    }
  }, [conversation, user?.id, uiMessages])

  const handleSend = async (text: string, attachments?: Attachment[]) => {
    if (!text.trim() && !attachments?.length) return

    try {
      await sendMessage(text.trim())
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const handleSendOffer = async (payload: { title: string; price: number; days: number; notes: string }) => {
    try {
      await sendOffer({
        title: payload.title,
        price: payload.price,
        delivery_days: payload.days,
        notes: payload.notes
      })
    } catch (error) {
      console.error('Failed to send offer:', error)
    }
  }

  const handleUpdateOffer = (msgId: string, updater: (m: Message) => Message) => {
    // This would typically update the offer status via API
    console.log('Update offer:', msgId, updater)
  }

  const handleSystem = async (text: string) => {
    try {
      await sendMessage(text)
    } catch (error) {
      console.error('Failed to send system message:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600 mx-auto mb-2"></div>
          <p className="text-sm text-slate-600">Loading conversation...</p>
        </div>
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-slate-500">
        <div className="text-center">
          <p className="text-lg mb-2">Conversation not found</p>
          <p className="text-sm">The conversation may have been deleted or you don&apos;t have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col h-full">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-900">{conversation.title}</h1>
            <p className="text-sm text-slate-600">
              {authRole === 'homeowner'
                ? conversation.pro_name || 'Professional'
                : conversation.homeowner_name || 'Homeowner'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat View */}
      <div className="flex-1 flex flex-col min-h-0">
        <ChatView
          thread={thread}
          query={query}
          onSend={handleSend}
          onSendOffer={handleSendOffer}
          onUpdateOffer={handleUpdateOffer}
          onSystem={handleSystem}
          authRole={authRole}
          userType={conversation.homeowner_id === user?.id ? 'homeowner' : 'contractor'}
        />
      </div>
    </div>
  )
}
