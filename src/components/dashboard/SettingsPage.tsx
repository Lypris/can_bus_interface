import { memo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { UserMode } from '@/types/dashboard'

export type InterfaceTheme = 'sea' | 'sand' | 'forest'

interface SettingsPageProps {
  mode: UserMode
  username: string
  themeMode: 'light' | 'dark'
  interfaceTheme: InterfaceTheme
  onModeChange: (mode: UserMode) => void
  onUsernameChange: (value: string) => void
  onThemeModeToggle: () => void
  onInterfaceThemeChange: (theme: InterfaceTheme) => void
}

const modeLabels: Array<{ value: UserMode; label: string }> = [
  { value: 'normal', label: 'Normal' },
  { value: 'eco', label: 'Eco' },
  { value: 'advanced', label: 'Advanced' },
]

const themeLabels: Array<{ value: InterfaceTheme; label: string }> = [
  { value: 'sea', label: 'Sea' },
  { value: 'sand', label: 'Sand' },
  { value: 'forest', label: 'Forest' },
]

export const SettingsPage = memo(function SettingsPage({
  mode,
  username,
  themeMode,
  interfaceTheme,
  onModeChange,
  onUsernameChange,
  onThemeModeToggle,
  onInterfaceThemeChange,
}: SettingsPageProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>User profile, operating mode, and visual theme.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-base">
        <section className="rounded-2xl border border-border bg-background/50 p-4">
          <p className="text-lg text-muted-foreground">Username</p>
          <input
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            maxLength={24}
            className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-3 text-xl"
            aria-label="Username"
          />
        </section>

        <section className="rounded-2xl border border-border bg-background/50 p-4">
          <p className="mb-2 text-lg text-muted-foreground">User mode</p>
          <div className="flex gap-2">
            {modeLabels.map((entry) => (
              <Button
                key={entry.value}
                variant={mode === entry.value ? 'default' : 'outline'}
                size="lg"
                onClick={() => onModeChange(entry.value)}
              >
                {entry.label}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg text-muted-foreground">Light / dark style</p>
              <p className="text-sm text-muted-foreground">Current: {themeMode}</p>
            </div>
            <Button variant="secondary" size="lg" onClick={onThemeModeToggle}>
              Toggle {themeMode === 'dark' ? 'Light' : 'Dark'}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background/50 p-4">
          <p className="mb-2 text-lg text-muted-foreground">Interface theme</p>
          <div className="grid grid-cols-3 gap-2">
            {themeLabels.map((entry) => (
              <button
                key={entry.value}
                type="button"
                onClick={() => onInterfaceThemeChange(entry.value)}
                className={cn(
                  'h-14 rounded-xl border text-lg font-semibold transition-transform duration-100 active:scale-95',
                  interfaceTheme === entry.value
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground',
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  )
})
