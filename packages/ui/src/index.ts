// packages/ui/src/index.ts
//
// Public API for the @clinic-saas/ui package. Re-exports the 13 shadcn/ui
// components listed in Roadmap v2.1 §3.10.2 so that apps/web can
// `import { Button } from '@clinic-saas/ui'`.
//
// Components (added in Task 17-b, pulling forward from Phase 6):
//   Button, Input, Label, Dialog, DropdownMenu, Sonner (Toaster),
//   Avatar, Badge, Card, Form, Table, Tabs, Tooltip
//
// Configuration:
//   - components.json: style=new-york, baseColor=slate, cssVariables=true,
//     rsc=true, tsx=true, rtl=true, iconLibrary=lucide
//   - src/lib/utils.ts: cn() helper (clsx + tailwind-merge)
//   - src/styles/globals.css: Tailwind v4 import + shadcn CSS variables
//     (slate base color, light + dark themes, RTL-aware via logical
//     properties only — no physical left/right)
//
// AGENTS.md RTL rule: components use Tailwind v4 logical properties ONLY
// (ms-, me-, ps-, pe-, start-, end-, text-start, text-end). shadcn/ui is
// configured with rtl: true (per AGENTS.md and docs/conventions/rtl.md §3).
// The components were audited for RTL compliance in Task 17-b: no physical
// left/right CSS, no ml-/mr-/pl-/pr- utilities. See the Task 17-b worklog
// entry for the audit table.
//
// React 19 compatibility: all 13 components are compatible with React 19
// (the workspace pins react: ^19.0.0). The radix-ui ^1.6.1 package (the
// new unified Radix UI distribution) supports React 19. react-hook-form
// ^7.81.0, @hookform/resolvers ^5.4.0, sonner ^2.0.7, next-themes ^0.4.6,
// and zod ^4.4.3 are all React 19-compatible.

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';

export { Badge, badgeVariants } from '@/components/ui/badge';
export { Button, buttonVariants } from '@/components/ui/button';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from '@/components/ui/form';

export { Input } from '@/components/ui/input';
export { Label } from '@/components/ui/label';
export { Toaster } from '@/components/ui/sonner';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants } from '@/components/ui/tabs';

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';
