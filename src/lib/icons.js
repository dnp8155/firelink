import React from "react";
import {
  LayoutDashboard, ShoppingBag, ShoppingCart, Package, FileText, Boxes, Award, Flame,
  Wrench, Sparkles, FolderOpen, LifeBuoy, Store, Warehouse, ReceiptText, Truck, BarChart3,
  IndianRupee, QrCode, ClipboardCheck, Calculator, FolderKanban, Droplets, ClipboardList,
  FileBarChart, Building2, ShieldCheck, Crown, PackageCheck, AlertTriangle, ScrollText,
  KeyRound, Flag, Plug, Activity, Settings, Bell, Search, Menu, X, ChevronDown, LogOut,
  User, Check, Clock, AlertCircle, TrendingUp, IndianRupee as Rupee, MapPin, Plus, Filter,
  Eye, Download, Upload, Trash2, Edit, ArrowRight, ArrowLeft, Shield, Zap, Star, Heart,
  GitCompare, Send, CheckCircle2, XCircle, Clock4, CircleDot, Building, Users, Layers,
  CalendarClock, CalendarCheck,
} from "lucide-react";

export const ICONS = {
  LayoutDashboard, ShoppingBag, ShoppingCart, Package, FileText, Boxes, Award, Flame,
  Wrench, Sparkles, FolderOpen, LifeBuoy, Store, Warehouse, ReceiptText, Truck, BarChart3,
  IndianRupee, QrCode, ClipboardCheck, Calculator, FolderKanban, Droplets, ClipboardList,
  FileBarChart, Building2, ShieldCheck, Crown, PackageCheck, AlertTriangle, ScrollText,
  KeyRound, Flag, Plug, Activity, Settings, Bell, Search, Menu, X, ChevronDown, LogOut,
  User, Check, Clock, AlertCircle, TrendingUp, MapPin, Plus, Filter, Eye, Download, Upload,
  Trash2, Edit, ArrowRight, ArrowLeft, Shield, Zap, Star, Heart, GitCompare, Send,
  CheckCircle2, XCircle, Building, Users, Layers,
  CalendarClock, CalendarCheck,
};

export function getIcon(name) {
  return ICONS[name] || LayoutDashboard;
}