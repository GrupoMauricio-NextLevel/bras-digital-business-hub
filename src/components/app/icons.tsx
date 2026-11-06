import { LayoutDashboard, Factory, Network, Store, Package, ShoppingCart, LayoutTemplate, Sparkles, CreditCard, Settings, Boxes, Users, Truck, Wallet, Image, Home, Palette, Globe, Printer, ScanLine, BarChart3, UsersRound, PackageCheck, Bell, Landmark, Plus, Lock, Clock, Inbox, Link2, Ticket, HandCoins, ShoppingBag, Megaphone, ReceiptText, Tag, LayoutGrid, LifeBuoy, GraduationCap, type LucideIcon } from "lucide-react";
import type { NavIcon } from "@/lib/nav";

/** Mapa nome → ícone. Só no lado cliente: a config de navegação carrega apenas o nome. */
export const ICONS: Record<NavIcon, LucideIcon> = { LayoutDashboard, Factory, Network, Store, Package, ShoppingCart, LayoutTemplate, Sparkles, CreditCard, Settings, Boxes, Users, Truck, Wallet, Image, Home, Palette, Globe, Printer, ScanLine, BarChart3, UsersRound, PackageCheck, Bell, Landmark, Plus, Lock, Clock, Inbox, Link2, Ticket, HandCoins, ShoppingBag, Megaphone, ReceiptText, Tag, LayoutGrid, LifeBuoy, GraduationCap };
