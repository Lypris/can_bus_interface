import { memo } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { UserMode } from '@/types/dashboard'

export type InterfaceTheme = 'sea' | 'sand' | 'forest'

interface SettingsPageProps {
  mode: UserMode
  themeMode: 'light' | 'dark'
  interfaceTheme: InterfaceTheme
  onModeChange: (mode: UserMode) => void
  onThemeModeToggle: () => void
  onInterfaceThemeChange: (theme: InterfaceTheme) => void
}

const modeLabels: Array<{ value: UserMode; label: string }> = [
  { value: 'standard', label: 'Standard' },
  { value: 'advanced', label: 'Avancé' },
]

const themeLabels: Array<{ value: InterfaceTheme; label: string }> = [
  { value: 'sea', label: 'Mer' },
  { value: 'sand', label: 'Sable' },
  { value: 'forest', label: 'Forêt' },
]

export const SettingsPage = memo(function SettingsPage({
  mode,
  themeMode,
  interfaceTheme,
  onModeChange,
  onThemeModeToggle,
  onInterfaceThemeChange,
}: SettingsPageProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-center text-5xl">Paramètres</CardTitle>
        <CardDescription>Profil utilisateur, mode de fonctionnement et thème visuel.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-base">
        <section className="rounded-2xl border border-border bg-background/50 p-4">
          <p className="mb-2 text-lg text-muted-foreground">Mode utilisateur</p>
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
              <p className="text-lg text-muted-foreground">Style clair / sombre</p>
              <p className="text-sm text-muted-foreground">Actuel : {themeMode === 'dark' ? 'sombre' : 'clair'}</p>
            </div>
            <Button variant="secondary" size="lg" onClick={onThemeModeToggle}>
              Basculer en {themeMode === 'dark' ? 'clair' : 'sombre'}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-background/50 p-4">
          <p className="mb-2 text-lg text-muted-foreground">Thème de l'interface</p>
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
