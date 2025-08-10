
"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth"
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { Skeleton } from "./ui/skeleton"
import { Bell, BellRing, X } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { markNotificationsAsRead, deleteNotification } from "@/lib/queries"
import type { Notification } from "@/types"
import { Badge } from "./ui/badge"
import { formatDistanceToNow } from "date-fns"
import { useNotifications } from "@/hooks/use-notifications"
import { ScrollArea } from "./ui/scroll-area"


export function UserNav() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const { data: notifications = [] } = useNotifications(user?.id);
  const [isSheetOpen, setIsSheetOpen] = useState(false);


  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpenChange = async (open: boolean) => {
    setIsSheetOpen(open);
    if (open && unreadCount > 0) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      await markNotificationsAsRead(unreadIds);
    }
  }

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    await deleteNotification(notificationId);
  }


  if (loading) {
    return <Skeleton className="h-8 w-8 rounded-full" />
  }

  if (!user) {
    return (
      <Button onClick={() => router.push('/login')}>Login</Button>
    )
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
           <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 justify-center rounded-full p-0 text-xs">
                    {unreadCount}
                </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <SheetHeader>
            <SheetTitle>Notifications</SheetTitle>
            <SheetDescription>
              Here are your latest updates.
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="flex-grow pr-4 -mr-4">
            <div className="py-4 space-y-4">
              {notifications.length > 0 ? (
                  notifications.map(notif => (
                      <div key={notif.id} className="relative p-3 rounded-md border border-border group">
                          <Link href={notif.link || "#"} onClick={() => setIsSheetOpen(false)}>
                              <div className="flex items-start gap-3">
                                  {!notif.isRead && <BellRing className="h-4 w-4 mt-1 text-primary flex-shrink-0" />}
                                  <div className="flex-grow">
                                      <p className="text-sm pr-6">{notif.message}</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                          {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                                      </p>
                                  </div>
                              </div>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => handleDeleteNotification(e, notif.id)}
                            >
                            <X className="h-4 w-4" />
                          </Button>
                      </div>
                  ))
              ) : (
                  <div className="text-center text-muted-foreground h-full flex items-center justify-center">
                      <p>You have no new notifications.</p>
                  </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <Link href="/profile">
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
            </Link>
            <Link href="/dashboard">
              <DropdownMenuItem>
                Dashboard
              </DropdownMenuItem>
            </Link>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
