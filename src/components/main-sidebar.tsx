
"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Logo from "@/components/logo"
import { useAuth } from "@/lib/auth"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Users, UserCheck, LogOut, ShieldCheck, LifeBuoy, User } from "lucide-react"

const menuItems = {
  learner: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/mentors", label: "Find Mentors", icon: Users },
    { href: "/profile", label: "My Profile", icon: User },
  ],
  mentor: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "My Profile", icon: UserCheck },
  ],
  admin: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin", label: "Admin Panel", icon: ShieldCheck },
    { href: "/mentors", label: "All Mentors", icon: Users },
  ],
}

export function MainSidebar() {
  const { role, logout } = useAuth()
  const pathname = usePathname()

  const isActive = (href: string) => {
    // Make dashboard active for the root dashboard route only
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href) && href !== "/"
  }
  
  const navItems = role ? menuItems[role] : [];

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => {
            // Hide admin panel link for non-admins
            if (item.href === "/admin" && role !== 'admin') {
              return null;
            }
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    icon={<item.icon />}
                    tooltip={item.label}
                  >
                    {item.label}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
            <SidebarMenuItem>
                <a href="mailto:support@skillverse.com">
                  <SidebarMenuButton icon={<LifeBuoy />} tooltip="Support">
                      Support
                  </SidebarMenuButton>
                </a>
            </SidebarMenuItem>
            <SidebarMenuItem>
               <SidebarMenuButton onClick={logout} icon={<LogOut />} tooltip="Logout">
                  Logout
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
