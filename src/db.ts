import Dexie from 'dexie'
import type { Table } from 'dexie'

export interface Note {
  id?: number
  title: string
  content: string
  tags: string[]
  created: Date
  modified: Date
}

export interface RegistryEntry {
  id?: number
  name: string
  type: 'def' | 'section' | 'ref' | 'title'
  noteId: number
  lineContent: string
}

class KernelDB extends Dexie {
  notes!: Table<Note>
  registry!: Table<RegistryEntry>

  constructor() {
    super('kernel')
    this.version(2).stores({
      notes: '++id, title, modified',
      registry: '++id, name, type, noteId',
    })
  }
}

export const db = new KernelDB()
