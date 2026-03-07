import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'

const RPG_GAMES = [
  {
    id: 'dnd',
    title: 'Dungeons & Dragons 5E',
    description: "The world's most popular tabletop RPG.",
    to: '/rpgs/dnd' as const,
  },
]

export function RpgLibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">RPG Library</h2>
        <p className="text-muted-foreground">
          Choose a game system to explore rules and references.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {RPG_GAMES.map((game) => (
          <Card key={game.id} className="flex flex-col overflow-hidden">
            <div className="flex h-44 items-center justify-center bg-gradient-to-br from-red-900 via-red-800 to-stone-900">
              <span className="select-none text-6xl">⚔️</span>
            </div>
            <CardContent className="flex-1 space-y-1 pt-4">
              <p className="text-lg font-semibold leading-tight">{game.title}</p>
              <p className="text-sm text-muted-foreground">{game.description}</p>
            </CardContent>
            <CardFooter className="pt-0">
              <Link to={game.to} className="w-full">
                <Button className="w-full">View</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
