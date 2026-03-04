import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function SectionPlaceholder({
  title,
  description,
}: {
  title: string
  description?: string
}) {
  return (
    <Card className="min-h-[300px]">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {description ?? 'Page scaffold is ready. Content can be added next.'}
      </CardContent>
    </Card>
  )
}
