import { Tx } from '../types'

/**
 * Lightweight local category-suggestion mechanism.
 * Analyzes local transaction history to suggest a category based on the description/payee note.
 * Purely local, offline, and does not override user choices.
 */
export function findCategorySuggestion(
  note: string,
  transactions: Tx[],
  type: 'in' | 'out'
): string | null {
  if (!note || note.trim().length < 2) return null

  const cleanInput = note.trim().toLowerCase()
  const inputWords = cleanInput.split(/\s+/).filter(w => w.length > 2)

  // Frequency map of categories for matching past transactions
  const frequency: Record<string, number> = {}

  // Consider transactions of the same type
  const relevantTx = transactions.filter(t => t.type === type && t.note && t.cat)

  for (const t of relevantTx) {
    const pastNote = t.note.trim().toLowerCase()
    let score = 0

    // Exact note match has highest priority
    if (pastNote === cleanInput) {
      score += 10
    } else if (pastNote.includes(cleanInput) || cleanInput.includes(pastNote)) {
      score += 5
    } else if (inputWords.length > 0) {
      // Word overlap match
      const pastWords = pastNote.split(/\s+/).filter(w => w.length > 2)
      for (const w of inputWords) {
        if (pastWords.includes(w)) {
          score += 2
        }
      }
    }

    if (score > 0) {
      frequency[t.cat] = (frequency[t.cat] || 0) + score
    }
  }

  const entries = Object.entries(frequency)
  if (!entries.length) return null

  // Sort by highest score
  entries.sort((a, b) => b[1] - a[1])
  return entries[0][0]
}
