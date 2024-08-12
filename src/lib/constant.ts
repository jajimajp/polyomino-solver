import * as Color from './color'
import type { piece } from './model'

// polyomino pieces
export const pieces: piece[] = [
  {
    // A
    id: 0,
    width: 3,
    height: 2,
    pattern: [
      [true, true, true],
      [false, false, true],
    ],
    color: Color.colors.orange,
  },
  {
    // B
    id: 1,
    width: 3,
    height: 2,
    pattern: [
      [true, true, true],
      [true, true, false],
    ],
    color: Color.colors.red,
  },
  {
    // C
    id: 2,
    width: 4,
    height: 2,
    pattern: [
      [true, true, true, true],
      [true, false, false, false],
    ],
    color: Color.colors.blue,
  },
  {
    // D
    id: 3,
    width: 4,
    height: 2,
    pattern: [
      [true, true, true, true],
      [false, true, false, false],
    ],
    color: Color.colors.lightpink,
  },
  {
    // E
    id: 4,
    width: 4,
    height: 2,
    pattern: [
      [true, true, false, false],
      [false, true, true, true],
    ],
    color: Color.colors.green,
  },
  {
    // F
    id: 5,
    width: 2,
    height: 2,
    pattern: [
      [true, true],
      [true, false],
    ],
    color: Color.colors.black,
  },
  {
    // G
    id: 6,
    width: 3,
    height: 3,
    pattern: [
      [true, true, true],
      [true, false, false],
      [true, false, false],
    ],
    color: Color.colors.lightblue,
  },
  {
    // H
    id: 7,
    width: 3,
    height: 3,
    pattern: [
      [false, true, true],
      [true, true, false],
      [true, false, false],
    ],
    color: Color.colors.pink,
  },
  {
    // I
    id: 8,
    width: 3,
    height: 2,
    pattern: [
      [true, true, true],
      [true, false, true],
    ],
    color: Color.colors.yellow,
  },
  {
    // J
    id: 9,
    width: 4,
    height: 1,
    pattern: [[true, true, true, true]],
    color: Color.colors.purple,
  },
  {
    // K
    id: 10,
    width: 2,
    height: 2,
    pattern: [
      [true, true],
      [true, true],
    ],
    color: Color.colors.lightgreen,
  },
  {
    // L
    id: 11,
    width: 3,
    height: 3,
    pattern: [
      [false, true, false],
      [true, true, true],
      [false, true, false],
    ],
    color: Color.colors.gray,
  },
]
