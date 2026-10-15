'use client'
import { useEffect } from 'react'

export default function AdminPwa() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/admin-sw.js', { scope: '/admin' }).catch(() => {})
  }, [])
  return null
}
