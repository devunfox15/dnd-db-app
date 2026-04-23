import { useState } from 'react'
import { EyeOff, Gift, Link2, ScrollText, Swords, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import MonsterPicker from '@/features/session-workspace/monster-picker'
import type {
  EncounterBlock,
  HookBlock,
  RewardBlock,
  SceneBlock,
  SecretBlock,
} from '@/features/session-workspace/session-types'

export const DND_SKILLS = [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival',
]

export function AddSceneForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: SceneBlock) => void
  onCancel: () => void
}) {
  const [textField, setTextField] = useState('')

  function handleSubmit() {
    if (!textField.trim()) return
    onAdd({
      kind: 'scene',
      id: crypto.randomUUID(),
      text: textField.trim(),
    })
  }

  return (
    <div className="rounded-lg border border-indigo-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <ScrollText className="size-3.5 text-indigo-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-indigo-500">
          New Scene
        </span>
      </div>
      <div className="space-y-2 p-3">
        <Textarea
          value={textField}
          onChange={(e) => setTextField(e.target.value)}
          placeholder="Describe the scene, setting, NPCs, and important details for players to know."
          rows={10}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!textField.trim()}>
          Add Scene
        </Button>
      </div>
    </div>
  )
}

export function AddEncounterForm({
  campaignId,
  onAdd,
  onCancel,
}: {
  campaignId: string
  onAdd: (item: EncounterBlock) => void
  onCancel: () => void
}) {
  const [pickedName, setPickedName] = useState('')
  const [customName, setCustomName] = useState('')
  const [showPicker, setShowPicker] = useState(false)
  const [count, setCount] = useState(1)
  const [notes, setNotes] = useState('')

  const resolvedName = pickedName || customName.trim()

  function handleSubmit() {
    if (!resolvedName) return
    onAdd({
      kind: 'encounter',
      id: crypto.randomUUID(),
      monsterName: resolvedName,
      notes: notes.trim(),
      count: Math.max(1, count),
    })
  }

  return (
    <div className="rounded-lg border border-red-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Swords className="size-3.5 text-red-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-red-500">
          New Encounter
        </span>
      </div>
      <div className="space-y-2 p-3">
        {/* Selected monster display */}
        {pickedName ? (
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
            <p className="text-sm font-medium">{pickedName}</p>
            <Button
              size="icon"
              variant="ghost"
              className="size-6 text-muted-foreground"
              onClick={() => {
                setPickedName('')
                setShowPicker(false)
              }}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ) : (
          <>
            {showPicker ? (
              <div className="rounded-md border p-2">
                <MonsterPicker
                  campaignId={campaignId}
                  onSelect={(m) => {
                    setPickedName(m.name)
                    setCustomName('')
                    setShowPicker(false)
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPicker(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Custom enemy name…"
                  autoFocus
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 gap-1.5"
                  onClick={() => setShowPicker(true)}
                >
                  <Swords className="size-3.5" />
                  Pick
                </Button>
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">
            Count
          </label>
          <Input
            type="number"
            min={1}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-20"
          />
        </div>

        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tactics, conditions, triggers… (optional)"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!resolvedName}>
          Add Encounter
        </Button>
      </div>
    </div>
  )
}

export function AddSecretForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: SecretBlock) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [dc, setDc] = useState(10)
  const [skill, setSkill] = useState('Perception')

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({
      kind: 'secret',
      id: crypto.randomUUID(),
      title: title.trim(),
      content: content.trim(),
      dc: Math.max(1, dc),
      skill,
    })
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <EyeOff className="size-3.5 text-amber-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-500">
          New Secret
        </span>
      </div>
      <div className="space-y-2 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Secret title…"
          autoFocus
        />
        <div className="flex gap-2">
          <select
            value={skill}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setSkill(e.target.value)
            }
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {DND_SKILLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              DC
            </label>
            <Input
              type="number"
              min={1}
              value={dc}
              onChange={(e) => setDc(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What players learn on a successful roll… (optional)"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add Secret
        </Button>
      </div>
    </div>
  )
}

export function AddRewardForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: RewardBlock) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [xp, setXp] = useState(0)
  const [loot, setLoot] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({
      kind: 'reward',
      id: crypto.randomUUID(),
      title: title.trim(),
      xp: Math.max(0, xp),
      loot: loot.trim(),
      notes: notes.trim(),
    })
  }

  return (
    <div className="rounded-lg border border-yellow-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Gift className="size-3.5 text-yellow-600 dark:text-yellow-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-yellow-600 dark:text-yellow-400">
          New Reward
        </span>
      </div>
      <div className="space-y-2 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Reward title, e.g. Goblin Cave Cleared"
          autoFocus
        />
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">XP</label>
          <Input
            type="number"
            min={0}
            value={xp}
            onChange={(e) => setXp(Number(e.target.value))}
            className="w-24"
          />
        </div>
        <Input
          value={loot}
          onChange={(e) => setLoot(e.target.value)}
          placeholder="Loot, e.g. 50 gp, Potion of Healing…"
        />
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes about conditions or distribution… (optional)"
          rows={2}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add Reward
        </Button>
      </div>
    </div>
  )
}

export function AddHookForm({
  onAdd,
  onCancel,
}: {
  onAdd: (item: HookBlock) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit() {
    if (!title.trim()) return
    onAdd({
      kind: 'hook',
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
    })
  }

  return (
    <div className="rounded-lg border border-green-500/40 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Link2 className="size-3.5 text-green-600 dark:text-green-400" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
          New Hook
        </span>
      </div>
      <div className="space-y-2 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Hook title, e.g. The Missing Merchant"
          autoFocus
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Story hook, rumor, or plot thread players may pursue…"
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-2 border-t px-3 py-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={!title.trim()}>
          Add Hook
        </Button>
      </div>
    </div>
  )
}
