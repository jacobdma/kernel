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

class KernelDB extends Dexie {
  notes!: Table<Note>

  constructor() {
    super('kernel')
    this.version(1).stores({
      notes: '++id, title, modified'
    })
  }
}

export const db = new KernelDB()
