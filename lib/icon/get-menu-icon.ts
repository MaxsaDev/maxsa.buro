import {
  Activity,
  Airplay,
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  BarChart,
  Bell,
  Blocks,
  Book,
  Bookmark,
  Box,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  CreditCard,
  Database,
  DollarSign, // Fallback
  Dot,
  Download,
  Edit,
  File,
  FileText,
  Folder,
  Globe,
  Grid,
  Heart,
  Home,
  HousePlus,
  Image,
  Info,
  LayoutDashboard,
  LifeBuoy,
  Link,
  List,
  ListChecks,
  Lock,
  Mail,
  Map,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Package,
  PenTool,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Shield,
  ShoppingCart,
  Star,
  Tag,
  Target,
  Trash,
  TrendingUp,
  Upload,
  User,
  Users,
  Video,
  Zap,
} from 'lucide-react';
import { ComponentType } from 'react';

/**
 * Мапа іконок для меню користувача
 * Використовується для отримання компонента іконки з рядкового імені
 */
export const menuIconMap: Record<string, ComponentType<{ className?: string }>> = {
  // Адміністративні іконки
  Shield,
  Users,
  ListChecks,
  Settings,
  Dot,
  Lock,
  Award,
  Target,

  // Профільні іконки
  BadgeCheck,
  CreditCard,
  Bell,
  User,
  Heart,
  Star,

  // Підтримка та зворотній зв'язок
  LifeBuoy,
  Send,
  MessageSquare,
  Mail,
  HelpCircle: Info,

  // Навігація та структура
  Dashboard: LayoutDashboard,
  Profile: User,
  Home,
  Menu,
  Grid,
  List,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  ArrowRight,

  // Контент та файли
  File,
  FileText,
  Folder,
  Image,
  Video,
  Book,
  Bookmark,
  Archive,
  Package,
  Box,
  Blocks,

  // Дії та інструменти
  Edit,
  PenTool,
  Plus,
  Trash,
  Search,
  Upload,
  Download,
  Link,
  CheckCircle,
  Info,
  AlertCircle,

  // Бізнес та аналітика
  BarChart,
  TrendingUp,
  Briefcase,
  ShoppingCart,
  Calendar,
  Clock,
  Tag,
  DollarSign,
  HousePlus,

  // Технічні
  Code,
  Database,
  Airplay,
  Zap,
  Activity,
  Globe,
  Save,

  // Інші
  MoreHorizontal,
  Camera,
  Map,
};

/**
 * Отримує іконку для меню з рядкового імені
 *
 * @param iconName - Назва іконки (наприклад: "Dashboard", "Profile", "Shield")
 * @returns React компонент іконки з Lucide React або Dot як fallback
 *
 * @example
 * const IconComponent = getMenuIcon('Dashboard');
 * <IconComponent className="size-4" />
 */
export function getMenuIcon(iconName: string): ComponentType<{ className?: string }> {
  const normalizedName = iconName.trim();
  const IconComponent = menuIconMap[normalizedName];

  // Якщо іконка не знайдена, повертаємо Dot як fallback
  return IconComponent || Dot;
}
