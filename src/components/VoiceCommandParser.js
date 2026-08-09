const NUMBER_WORDS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50
}

function extractNumbers(tokens) {
  const numbers = []
  tokens.forEach((token) => {
    if (/^\d+$/.test(token)) {
      numbers.push(Number(token))
      return
    }
    if (NUMBER_WORDS[token] !== undefined) {
      numbers.push(NUMBER_WORDS[token])
    }
  })
  return numbers
}

export function parseVoiceCommand(raw) {
  const text = raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const tokens = text.split(' ')
  const numbers = extractNumbers(tokens)
  const row = numbers.length ? numbers[0] : null
  const col = numbers.length > 1 ? numbers[1] : null
  const row2 = numbers.length > 2 ? numbers[2] : null
  const col2 = numbers.length > 3 ? numbers[3] : null
  const size = numbers.length ? numbers[0] : null
  const rows = numbers.length ? numbers[0] : null
  const cols = numbers.length > 1 ? numbers[1] : null

  const hasCoords = row !== null && col !== null
  const hasMoveCoords = row !== null && col !== null && row2 !== null && col2 !== null
  const hasSize = rows !== null && cols !== null
  const hasSingleSize = size !== null

  if (text.includes('add obstacle') || text.includes('place obstacle')) {
    return { action: 'add_obstacle', row, col, hasCoords }
  }
  if (text.includes('remove obstacle') || text.includes('clear obstacle')) {
    return { action: 'remove_obstacle', row, col, hasCoords }
  }
  if (text.includes('clear all obstacles') || text.includes('remove all obstacles')) {
    return { action: 'clear_obstacles' }
  }
  if (text.includes('add target') || text.includes('place target')) {
    return { action: 'add_target', row, col, hasCoords }
  }
  if (text.includes('remove target') || text.includes('clear target')) {
    return { action: 'remove_target', row, col, hasCoords }
  }
  if (text.includes('delete target')) {
    return { action: 'remove_target', row, col, hasCoords }
  }
  if (text.includes('move target')) {
    return { action: 'move_target', row, col, row2, col2, hasMoveCoords }
  }
  if (text.includes('remove all targets') || text.includes('clear targets')) {
    return { action: 'clear_targets' }
  }
  if (text.includes('move start') || text.includes('set start')) {
    return { action: 'move_start', row, col, hasCoords }
  }
  if (text.includes('calculate route')) {
    return { action: 'calculate_route' }
  }
  if (text.includes('start animation') || text.includes('start route') || text.includes('start route animation')) {
    return { action: 'start_animation' }
  }
  if (text.includes('pause animation') || text.includes('pause route') || text === 'pause') {
    return { action: 'pause_animation' }
  }
  if (text.includes('resume animation') || text.includes('resume route')) {
    return { action: 'resume_animation' }
  }
  if (text.includes('reset route') || text.includes('reset animation')) {
    return { action: 'reset_route' }
  }
  if (text.includes('clear route') || text.includes('clear path') || text.includes('reset path')) {
    return { action: 'clear_path' }
  }
  if (text.includes('reset grid')) {
    return { action: 'reset_grid' }
  }
  if (text.includes('set grid') || text.includes('resize grid')) {
    return { action: 'set_grid', rows, cols, hasSize }
  }
  if (text.includes('increase grid') || text.includes('grow grid')) {
    return { action: 'increase_grid', size, hasSingleSize }
  }
  if (text.includes('next step')) {
    return { action: 'next_step' }
  }

  return { action: 'unknown' }
}
