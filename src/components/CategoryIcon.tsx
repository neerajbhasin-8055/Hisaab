import React from 'react'
import {
  Coffee,
  ShoppingBag,
  Home,
  Car,
  HeartPulse,
  Briefcase,
  Smartphone,
  CreditCard,
  Package,
  Users,
  Plane,
  Receipt,
  Wallet,
  Tag,
  Film,
  Zap,
  Shield,
  BookOpen,
  MoreHorizontal,
  Folder,
  LucideIcon
} from 'lucide-react'

const ICON_MAP: Record<string, LucideIcon> = {
  Coffee,
  ShoppingBag,
  Home,
  Car,
  HeartPulse,
  Briefcase,
  Smartphone,
  CreditCard,
  Package,
  Users,
  Plane,
  Receipt,
  Wallet,
  Tag,
  Film,
  Zap,
  Shield,
  BookOpen,
  MoreHorizontal
}

export function CategoryIcon({
  name,
  fallback = 'Receipt',
  size = 18,
  className = '',
  strokeWidth = 1.8
}: {
  name?: string
  fallback?: string
  size?: number | string
  className?: string
  strokeWidth?: number
}) {
  const IconComp = (name && ICON_MAP[name]) || ICON_MAP[fallback] || Folder
  return <IconComp size={size} className={className} strokeWidth={strokeWidth} />
}
