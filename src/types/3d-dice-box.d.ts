declare module '@3d-dice/dice-box' {
  export type DiceRollNotation = string | string[]

  export interface DiceResult {
    groupId?: string
    rollId?: string
    sides?: number
    value?: number
    [key: string]: unknown
  }

  export interface DiceBoxRollOptions {
    targetValues?: number[]
  }

  export interface DiceBoxUpdateOptions {
    theme?: string
    themeColor?: string
    scale?: number
    throwForce?: number
    startingHeight?: number
    size?: number
    gravity?: number
  }

  export interface DiceBoxOptions {
    assetPath: string
    offscreen?: boolean
    theme?: string
    themeColor?: string
    scale?: number
    throwForce?: number
    startingHeight?: number
    size?: number
    gravity?: number
    restitution?: number
    friction?: number
    mass?: number
    linearDamping?: number
    angularDamping?: number
    spinForce?: number
  }

  export interface DiceWorld {
    config: Required<Pick<DiceBoxOptions, 'theme' | 'themeColor'>>
  }

  export interface DiceThemeData {
    themeColor?: string
    [key: string]: unknown
  }

  export interface DiceBoxInstance {
    init(): Promise<DiceWorld>
    roll(
      notation: DiceRollNotation,
      options?: DiceBoxRollOptions,
    ): Promise<DiceResult[]>
    add?(notation: string, groupId?: string): void
    updateConfig?(updates: DiceBoxUpdateOptions): void
    clear?(): void
    onThemeConfigLoaded?: (themeData: DiceThemeData) => void
    onRollComplete?: (results: DiceResult[]) => void
  }

  export type DiceBoxConstructor = new (
    selector: string,
    options: DiceBoxOptions,
  ) => DiceBoxInstance

  const DiceBox: DiceBoxConstructor
  export default DiceBox
}

declare module '@3d-dice/dice-ui/src/displayResults' {
  export default class DisplayResults {
    constructor(target: string)
    showResults(results: unknown): void
    clear(): void
  }
}

declare module '@3d-dice/dice-ui/src/advancedRoller' {
  export interface AdvancedRoll {
    groupId?: string
    [key: string]: unknown
  }

  export interface AdvancedRollerOptions {
    target: string
    onSubmit: (notation: string | string[]) => void
    onClear?: () => void
    onReroll?: (rolls: AdvancedRoll[]) => void
    onResults?: (results: unknown) => void
  }

  export default class AdvancedRoller {
    constructor(options: AdvancedRollerOptions)
    handleResults(results: unknown): void
  }
}

declare module '@3d-dice/dice-ui/src/boxControls' {
  export interface ControlValueRef<TValue = string> {
    setValue(value: TValue): void
  }

  export interface BoxControlsOptions {
    themes: string[]
    themeColor?: string
    onUpdate?: (updates: Record<string, unknown>) => void
  }

  export default class BoxControls {
    constructor(options: BoxControlsOptions)
    themeSelect: ControlValueRef<string>
    themeColorPicker: ControlValueRef<string>
  }
}
