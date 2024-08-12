//@ts-ignore
import dlx from 'dlx'
import * as Color from './color'
import { pieces } from './constant'

/** App state */
export type model = {
  fieldWidth: number
  fieldHeight: number
  pieces: {
    [key: piece['id']]:
      | {
          tag: 'placed'
          piece: piece
          // left top corner of **not rotated** piece
          row: number
          col: number
          // 0: not rotated, 1: 90 degrees, 2: 180 degrees, 3: 270 degrees clockwise
          // -1: flipped horizontally, and based on (-1), -2: 90 degrees, -3: 180 degrees, -4: 270 degrees clockwise
          lotation: 0 | 1 | 2 | 3 | -1 | -2 | -3 | -4
        }
      | {
          tag: 'placing' // while dragging, not yet placed
          piece: piece
          // same as 'placed'
          row: number
          col: number
          lotation: 0 | 1 | 2 | 3 | -1 | -2 | -3 | -4
        }
      | {
          tag: 'dragging'
          piece: piece
          lotation: 0 | 1 | 2 | 3 | -1 | -2 | -3 | -4
        }
      | {
          tag: 'unplaced'
          piece: piece
          lotation: 0 | 1 | 2 | 3 | -1 | -2 | -3 | -4
        }
  }
}

type lotation = 0 | 1 | 2 | 3 | -1 | -2 | -3 | -4

/** Returns initial model. */
export const init = (): model => ({
  fieldWidth: 11,
  fieldHeight: 5,
  pieces: Object.fromEntries(pieces.map((p) => [p.id, { tag: 'unplaced', piece: p, lotation: 0 }])),
})

export const placedPiecesCount = (m: model) =>
  Object.entries(m.pieces).filter(([, p]) => p.tag === 'placed').length

type fieldElement =
  | {
      placed: false
    }
  | {
      placed: true
      piece: piece
    }

/** Returns 2-dimensional field based on given model.
 * Each cell is true if it is occupied by a piece. */
export const field = (m: model): fieldElement[][] => {
  const field: fieldElement[][] = Array.from({ length: m.fieldHeight }, () =>
    Array.from({ length: m.fieldWidth }, () => ({ placed: false })),
  )
  for (const p of Object.values(m.pieces)) {
    const piece = lotated(p.piece, p.lotation)
    if (p.tag === 'placed') {
      for (let r = 0; r < piece.height; r++) {
        for (let c = 0; c < piece.width; c++) {
          if (piece.pattern[r][c]) {
            field[p.row + r][p.col + c] = {
              placed: true,
              piece: p.piece,
            }
          }
        }
      }
    }
  }
  return field
}

export const unplacedPiecesWithLotations = (m: model): { piece: piece; lotation: lotation }[] =>
  Object.entries(m.pieces)
    .filter(([_, p]) => p.tag === 'unplaced')
    .map(([_, p]) => {
      if (p.tag === 'unplaced') {
        return { piece: p.piece, lotation: p.lotation }
      }
      throw new Error('unreachable')
    })

export const movePiece = (m: model, id: piece['id'], row: number, col: number): model => {
  const p = lotated(m.pieces[id].piece, m.pieces[id].lotation)
  if (!p) {
    return m
  }
  // check if the piece is placed
  if (row < 0 || row + p.height > m.fieldHeight || col < 0 || col + p.width > m.fieldWidth) {
    return m
  }
  // check if the destination is empty
  const f = field(m)
  for (let r = 0; r < p.height; r++) {
    for (let c = 0; c < p.width; c++) {
      const cell = f[row + r][col + c]
      if (p.pattern[r][c] && cell.placed) {
        if (cell.piece.id !== id) {
          return m
        }
      }
    }
  }

  const prev = m.pieces[id]
  const next: model['pieces'][0] =
    prev.tag === 'placed' ? { ...prev, row, col } : { ...prev, row, col, tag: 'placed' }
  return {
    ...m,
    pieces: {
      ...m.pieces,
      [id]: next,
    },
  }
}

export const unplacePiece = (m: model, id: piece['id']): model => {
  const p = m.pieces[id]
  if (!p || p.tag !== 'placed') {
    return m
  }
  const next: model['pieces'][0] = {
    ...p,
    tag: 'unplaced',
  }
  return {
    ...m,
    pieces: {
      ...m.pieces,
      [id]: next,
    },
  }
}

export const rotatePiece = (m: model, id: piece['id']): model => {
  const p = m.pieces[id]
  if (!p || (p.tag !== 'placed' && p.tag !== 'unplaced')) {
    return m
  }
  const nextLot: lotation = (() => {
    switch (p.lotation) {
      case 0:
        return 1
      case 1:
        return 2
      case 2:
        return 3
      case 3:
        return 0
      case -1:
        return -2
      case -2:
        return -3
      case -3:
        return -4
      case -4:
        return -1
    }
  })()
  const next: model['pieces'][0] = {
    ...p,
    lotation: nextLot,
  }
  return {
    ...m,
    pieces: {
      ...m.pieces,
      [id]: next,
    },
  }
}

export const flipPiece = (m: model, id: piece['id']): model => {
  const p = m.pieces[id]
  if (!p || (p.tag !== 'placed' && p.tag !== 'unplaced')) {
    return m
  }
  const nextLot: lotation = (() => {
    switch (p.lotation) {
      case 0:
        return -1
      case 1:
        return -2
      case 2:
        return -3
      case 3:
        return -4
      case -1:
        return 0
      case -2:
        return 1
      case -3:
        return 2
      case -4:
        return 3
    }
  })()
  const next: model['pieces'][0] = {
    ...p,
    lotation: nextLot,
  }
  return {
    ...m,
    pieces: {
      ...m.pieces,
      [id]: next,
    },
  }
}

const solveSync = (
  m: model,
): { tag: 'success'; model: model } | { tag: 'fail'; message: string } => {
  // Input to dlx
  // length: m.fieldWidth * m.fieldHeight + m.pieces.length
  // 0..(width*height-1): cells
  // width*height..(width*height+pieces.length-1): placed pieces
  const rows = []
  const rowIdx2PieceState: model['pieces'][0][] = []

  // placed pieces has exactly one option
  for (const p of Object.entries(m.pieces).filter(([, p]) => p.tag === 'placed')) {
    if (p[1].tag !== 'placed') {
      continue // unreachable: to type
    }
    const piece = lotated(p[1].piece, p[1].lotation)
    const row = Array.from(
      { length: m.fieldHeight * m.fieldWidth + Object.entries(m.pieces).length },
      () => 0,
    )
    for (let r = 0; r < piece.height; r++) {
      for (let c = 0; c < piece.width; c++) {
        if (piece.pattern[r][c]) {
          row[(r + p[1].row) * m.fieldWidth + (c + p[1].col)] = 1
        }
      }
    }
    row[m.fieldWidth * m.fieldHeight + Number.parseInt(p[0])] = 1
    rows.push(row)
    rowIdx2PieceState.push(p[1])
  }

  // rest pieces
  const occupied = field(m).map((r) => r.map((c) => c.placed))
  for (const p of Object.entries(m.pieces).filter(([, p]) => p.tag === 'unplaced')) {
    const triedPatterns: boolean[][][] = []
    for (const lot of [-4, -3, -2, -1, 0, 1, 2, 3] as lotation[]) {
      const piece = lotated(p[1].piece, lot)
      const isSamePattern = (a: boolean[][], b: boolean[][]): boolean => {
        if (a.length !== b.length) {
          return false
        }
        for (let r = 0; r < a.length; r++) {
          if (a[r].length !== b[r].length) {
            return false
          }
          for (let c = 0; c < a[r].length; c++) {
            if (a[r][c] !== b[r][c]) {
              return false
            }
          }
        }
        return true
      }
      if (triedPatterns.some((p) => isSamePattern(p, piece.pattern))) {
        continue
      }
      triedPatterns.push(piece.pattern)
      const row = Array.from(
        { length: m.fieldHeight * m.fieldWidth + Object.entries(m.pieces).length },
        () => 0,
      )
      // piece info
      row[m.fieldWidth * m.fieldHeight + Number.parseInt(p[0])] = 1

      // enumerate all possible positions
      for (let r = 0; r < m.fieldHeight - piece.height + 1; r++) {
        for (let c = 0; c < m.fieldWidth - piece.width + 1; c++) {
          const rowToAdd = [...row]
          let valid = true
          for (let pr = 0; pr < piece.height; pr++) {
            if (!valid) {
              break
            }
            for (let pc = 0; pc < piece.width; pc++) {
              if (piece.pattern[pr][pc]) {
                if (occupied[r + pr][c + pc]) {
                  valid = false
                  break
                }
                rowToAdd[(r + pr) * m.fieldWidth + (c + pc)] = 1
              }
            }
          }
          if (!valid) {
            continue
          }
          rows.push(rowToAdd)
          rowIdx2PieceState.push({
            tag: 'placed',
            piece: p[1].piece,
            row: r,
            col: c,
            lotation: lot,
          })
        }
      }
    }
  }

  const solutions: number[][] = dlx.solve(rows)

  if (solutions.length === 0) {
    return {
      tag: 'fail',
      message: 'No solutions found',
    }
  }
  const nextPieces = Object.fromEntries(
    solutions[0].map((s) => [rowIdx2PieceState[s].piece.id, rowIdx2PieceState[s]]),
  )
  const next = { ...m, pieces: { ...m.pieces, ...nextPieces } }
  return {
    tag: 'success',
    model: next,
  }
}

export const solve = (
  m: model,
): Promise<{ tag: 'success'; model: model } | { tag: 'fail'; message: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(solveSync(m))
    }, 0)
  })
}

/** Single piece */
export type piece = {
  // immutable
  id: number
  // bounding box
  // it must fit into: there must be no empty row or column at the edge
  width: number
  height: number
  pattern: boolean[][]
  color?: Color.color
}

export const lotated = (p: piece, lotation: 0 | 1 | 2 | 3 | -1 | -2 | -3 | -4): piece => {
  switch (lotation) {
    case 0:
      return p
    case 1:
      return {
        ...p,
        width: p.height,
        height: p.width,
        pattern: Array.from({ length: p.width }, (_, r) =>
          Array.from({ length: p.height }, (_, c) => p.pattern[p.height - 1 - c][r]),
        ),
      }
    case 2:
      return {
        ...p,
        pattern: p.pattern.map((r) => r.slice().reverse()).reverse(),
      }
    case 3:
      return {
        ...p,
        width: p.height,
        height: p.width,
        pattern: Array.from({ length: p.width }, (_, r) =>
          Array.from({ length: p.height }, (_, c) => p.pattern[c][p.width - 1 - r]),
        ),
      }
    default: {
      // negative lotation is flipped
      const flipped = {
        ...p,
        pattern: p.pattern.map((r) => r.slice().reverse()),
      }
      switch (lotation) {
        case -1:
          return flipped
        case -2:
          return lotated(flipped, 1)
        case -3:
          return lotated(flipped, 2)
        case -4:
          return lotated(flipped, 3)
      }
    }
  }
}

const uniqueGradId = (() => {
  let id = 0
  return () => `grad-${id++}`
})()

/** Create react svg element which represents given piece. */
export const svg = (
  p: piece,
  lotation: 0 | 1 | 2 | 3 | -1 | -2 | -3 | -4,
): { El: () => JSX.Element; width: number; height: number } => {
  const piece = lotated(p, lotation)
  const gradId = uniqueGradId()
  const El = () => (
    <svg
      style={{ width: 50 * piece.width, height: 50 * piece.height }}
      viewBox={`0 0 ${10 * piece.width} ${10 * piece.height}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="piece"
    >
      <defs>
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
          <stop
            offset="100%"
            style={{ stopColor: Color.hex(piece.color || Color.colors.black), stopOpacity: 1 }}
          />
        </radialGradient>
      </defs>
      {piece.pattern.map((r, ri) =>
        r.map(
          (c, ci) =>
            c && (
              <circle
                key={`${ri}-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  ci
                }`}
                cx={5 + 10 * ci}
                cy={5 + 10 * ri}
                r={5}
                // fill={Color.hex(piece.color || Color.colors.black)}
                fill={`url(#${gradId})`}
              />
            ),
        ),
      )}
    </svg>
  )
  return { El, width: 50 * piece.width, height: 50 * piece.height }
}

/** Create svg element which represents given piece,
 * render it in the document invisibly, and return it.
 * NOTE: To use as drag image, svg must be **actually** rendered in the document.
 * NOTE: You must call cleanup() after using the element, for example, in onDragEnd event.
 */
export const svgAsElement = (
  p: piece,
  lotation: 0 | 1 | 2 | 3 | -1 | -2 | -3 | -4,
): { el: SVGSVGElement; cleanup: () => void } => {
  const piece = lotated(p, lotation)
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  el.setAttribute('style', `height: ${50 * piece.height}px; width: ${50 * piece.width}px;`)
  el.setAttribute('viewBox', `0 0 ${10 * piece.width} ${10 * piece.height}`)
  el.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  // gradient
  const gradId = uniqueGradId()
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  const radialGrad = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient')
  radialGrad.setAttribute('id', gradId)
  radialGrad.setAttribute('cx', '50%')
  radialGrad.setAttribute('cy', '50%')
  radialGrad.setAttribute('r', '50%')
  radialGrad.setAttribute('fx', '35%')
  radialGrad.setAttribute('fy', '35%')
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
  stop1.setAttribute('offset', '0%')
  stop1.setAttribute('style', 'stop-color: #ffffff; stop-opacity: 1;')
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
  stop2.setAttribute('offset', '100%')
  stop2.setAttribute(
    'style',
    `stop-color: ${Color.hex(piece.color || Color.colors.black)}; stop-opacity: 1;`,
  )
  radialGrad.appendChild(stop1)
  radialGrad.appendChild(stop2)
  grad.appendChild(radialGrad)
  el.appendChild(grad)

  for (let r = 0; r < piece.height; r++) {
    for (let c = 0; c < piece.width; c++) {
      if (piece.pattern[r][c]) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
        g.setAttribute('transform', `translate(${c * 10} ${r * 10})`)
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        circle.setAttribute('cx', '5')
        circle.setAttribute('cy', '5')
        circle.setAttribute('r', '5')
        circle.setAttribute('fill', `url(#${gradId})`)
        g.appendChild(circle)
        el.appendChild(g)
      }
    }
  }

  // To use as drag image, svg must be **actually** rendered in the document
  const offscreen = document.createElement('div')
  offscreen.setAttribute('style', 'position: absolute; left: -9999px; top: -9999px;')
  offscreen.appendChild(el)
  document.body.appendChild(offscreen)

  // cleanup only once
  const cleanup = (() => {
    let cleaned = false
    return () => {
      if (cleaned) {
        return
      }
      cleaned = true
      offscreen.remove()
    }
  })()

  return { el, cleanup }
}
