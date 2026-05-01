import { ComputerIcon, Moon01Icon, Settings01Icon, Sun01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  useIsMobile,
  useTheme,
} from "@polymeer/ui"

import { LanguageSelect } from "./language-select"
import { NetworkSwitch } from "./network-switch"
import { NodeModeSwitch } from "./node-mode-switch"

export function SettingsMenu() {
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()

  const settingsTrigger = (
    <Button variant="ghost" size="sm" className="hover:bg-muted/50 h-10 w-11 rounded-full p-0 transition-all sm:w-24">
      <div className="flex items-center justify-center gap-2">
        <HugeiconsIcon icon={Settings01Icon} size={18} className="text-muted-foreground" />
        <span className="hidden text-sm font-bold sm:inline">Settings</span>
      </div>
    </Button>
  )

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger asChild>{settingsTrigger}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Configure your wallet preferences</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <div className="flex flex-col gap-6 p-6 pb-12">
              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Infrastructure</span>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Network</span>
                    <div className="flex flex-wrap gap-2">
                      <NetworkSwitch />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Node Mode</span>
                    <div className="flex flex-wrap gap-2">
                      <NodeModeSwitch />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <span className="text-muted-foreground text-xs font-bold tracking-wider uppercase">Preferences</span>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Language</span>
                    <div className="flex flex-wrap gap-2">
                      <LanguageSelect />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium">Theme</span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        size="sm"
                        className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold transition-all"
                        onClick={() => setTheme("light")}
                      >
                        <HugeiconsIcon icon={Sun01Icon} size={13} />
                        Light
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        size="sm"
                        className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold transition-all"
                        onClick={() => setTheme("dark")}
                      >
                        <HugeiconsIcon icon={Moon01Icon} size={13} />
                        Dark
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        size="sm"
                        className="h-8 gap-1.5 rounded-xl px-3 text-xs font-bold transition-all"
                        onClick={() => setTheme("system")}
                      >
                        <HugeiconsIcon icon={ComputerIcon} size={13} />
                        System
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{settingsTrigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background/95 w-56 rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
        <DropdownMenuLabel className="text-muted-foreground px-2 py-1.5 text-xs font-bold tracking-wider uppercase">
          Preferences
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rounded-xl">
            <span className="flex-1 text-sm font-medium">Network</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="bg-background/95 min-w-[140px] rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
              <NetworkSwitch />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rounded-xl">
            <span className="flex-1 text-sm font-medium">Node</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="bg-background/95 min-w-[200px] rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
              <NodeModeSwitch />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rounded-xl">
            <span className="flex-1 text-sm font-medium">Language</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="bg-background/95 min-w-[140px] rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
              <LanguageSelect />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="rounded-xl">
            <span className="flex-1 text-sm font-medium">Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="bg-background/95 min-w-[140px] rounded-2xl p-2 shadow-2xl backdrop-blur-xl">
              <DropdownMenuItem className="rounded-xl" onClick={() => setTheme("light")}>
                <HugeiconsIcon icon={Sun01Icon} size={16} className="mr-2" />
                <span className="flex-1">Light</span>
                {theme === "light" && <div className="bg-primary h-1.5 w-1.5 rounded-full" />}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl" onClick={() => setTheme("dark")}>
                <HugeiconsIcon icon={Moon01Icon} size={16} className="mr-2" />
                <span className="flex-1">Dark</span>
                {theme === "dark" && <div className="bg-primary h-1.5 w-1.5 rounded-full" />}
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl" onClick={() => setTheme("system")}>
                <HugeiconsIcon icon={ComputerIcon} size={16} className="mr-2" />
                <span className="flex-1">System</span>
                {theme === "system" && <div className="bg-primary h-1.5 w-1.5 rounded-full" />}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
