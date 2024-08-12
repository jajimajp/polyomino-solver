import { useState } from 'react'
import * as Color from './lib/color'
import * as Model from './lib/model'

import GitHubLogo from './assets/github-mark-white.svg'

const uniqueGradId = (() => {
  let id = 0
  return () => `grad-App-${id++}`
})()
function App() {
  const [model, setModel] = useState(Model.init())
  const field = Model.field(model)
  const [onDragEndCb, setOnDragEndCb] = useState<{ fn: () => unknown } | undefined>(undefined)
  const [solving, setSolving] = useState(false)

  const handleDragStart = (pieceId: Model.piece['id'], e: React.DragEvent<HTMLDivElement>) => {
    if (onDragEndCb) {
      onDragEndCb.fn()
      setOnDragEndCb(undefined)
    }
    e.dataTransfer.setData('application/x.item', pieceId.toString())
    e.dataTransfer.effectAllowed = 'move'

    const { el, cleanup } = Model.svgAsElement(
      model.pieces[pieceId].piece,
      model.pieces[pieceId].lotation,
    )
    setOnDragEndCb({ fn: cleanup })
    e.dataTransfer.setDragImage(el, 25, 25)
  }

  const handleDrop = (row: number, col: number, e: React.DragEvent<HTMLDivElement>) => {
    const pieceId = Number.parseInt(e.dataTransfer.getData('application/x.item'))
    setModel(Model.movePiece(model, pieceId, row, col))
    e.preventDefault()
    if (onDragEndCb) {
      onDragEndCb.fn()
      setOnDragEndCb(undefined)
    }
  }

  const handleDropToUnplaced = (e: React.DragEvent<HTMLDivElement>) => {
    const pieceId = Number.parseInt(e.dataTransfer.getData('application/x.item'))
    setModel(Model.unplacePiece(model, pieceId))
    e.preventDefault()
    if (onDragEndCb) {
      onDragEndCb.fn()
      setOnDragEndCb(undefined)
    }
  }

  const handleDragEnd = () => {
    if (onDragEndCb) {
      onDragEndCb.fn()
      setOnDragEndCb(undefined)
    }
  }

  const handleSolve = () => {
    if (Model.placedPiecesCount(model) === 0) {
      alert('Place at least one piece')
      return
    }
    if (Model.placedPiecesCount(model) === 1) {
      const proceed = confirm(
        'You placed only one piece. It may take a long time to solve. Do you want to continue?',
      )
      if (!proceed) {
        return
      }
    }
    setSolving(true)
    Model.solve(model)
      .then((result) => {
        if (result.tag === 'success') {
          setModel(result.model)
        } else {
          alert(result.message)
        }
      })
      .finally(() => setSolving(false))
  }

  return (
    <div
      style={{
        background: 'blue',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: 16,
        height: '100%',
        minHeight: '100vh',
      }}
    >
      <h1
        style={{
          color: 'yellow',
          fontFamily: 'Bebas Neue',
          fontSize: 48,
          fontWeight: 400,
        }}
      >
        Polyomino Solver
      </h1>
      <a
        href="https://github.com/jajimajp/polyomino-solver"
        title="View on GitHub"
        style={{
          position: 'absolute',
          right: 5,
          top: 5,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <img src={GitHubLogo} alt="GitHub" style={{ width: 36, height: 36 }} />
      </a>
      <div style={{ display: 'flex', position: 'relative', width: 600 }}>
        <button
          type="button"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontWeight: 600,
            paddingRight: 16,
            paddingLeft: 16,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 8,
          }}
          onClick={handleSolve}
          disabled={solving}
        >
          {solving ? 'Solving...' : 'Solve'}
        </button>
        <button
          type="button"
          style={{
            marginLeft: 'auto',
            marginRight: 10,
            borderColor: 'yellow',
            background: 'transparent',
            color: 'yellow',
            fontFamily: 'Bebas Neue',
            fontSize: 24,
            borderRadius: 8,
          }}
          onClick={() => setModel(Model.init())}
        >
          X Clear
        </button>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 28,
          padding: 12,
          width: 550 + 12 * 2,
          backgroundColor: 'white',
        }}
      >
        {field.map((r, ri) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <div key={ri} style={{ display: 'flex', flexDirection: 'row', width: 550 }}>
            {r.map((c, ci) => {
              const gradId = uniqueGradId()
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                  key={ci}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(ri, ci, e)}
                  style={{
                    width: 50,
                    height: 50,
                  }}
                >
                  {c.placed ? (
                    <div
                      draggable
                      onDragStart={(e) => {
                        handleDragStart(c.piece.id, e)
                      }}
                      onDragEnd={handleDragEnd}
                      style={{
                        width: 50,
                        height: 50,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <svg
                        style={{ width: '100%', height: '100%' }}
                        viewBox="0 0 12 12"
                        role="img"
                        aria-label="piece"
                      >
                        <defs>
                          <radialGradient id={gradId} cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
                            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                            <stop
                              offset="100%"
                              style={{
                                stopColor: Color.hex(c.piece.color || Color.colors.black),
                                stopOpacity: 1,
                              }}
                            />
                          </radialGradient>
                        </defs>
                        <circle cx="6" cy="6" r="5.8" fill={`url(#${gradId})`} />
                      </svg>
                    </div>
                  ) : (
                    <svg
                      style={{ width: '100%', height: '100%' }}
                      viewBox="0 0 12 12"
                      role="img"
                      aria-label="piece"
                    >
                      <defs>
                        <radialGradient id={gradId} cx="50%" cy="50%" r="50%" fx="65%" fy="65%">
                          <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                          <stop
                            offset="100%"
                            style={{
                              stopColor: '#e5e5e5',
                              stopOpacity: 1,
                            }}
                          />
                        </radialGradient>
                      </defs>
                      <circle cx="6" cy="6" r="5.8" fill={`url(#${gradId})`} />
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 600,
          borderRadius: 8,
          padding: 8,
          background: '#eee',
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropToUnplaced}
      >
        <h2>Pieces</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: '100%',
            borderRadius: 8,
            marginTop: 8,
            alignItems: 'center',
            justifyContent: 'center',
            background: '#eee',
            gap: 8,
          }}
        >
          {Model.unplacedPiecesWithLotations(model).map((p) => {
            const { El, width, height } = Model.svg(p.piece, p.lotation)
            return (
              <div key={p.piece.id}>
                <div
                  draggable
                  onDragStart={(e) => {
                    handleDragStart(p.piece.id, e)
                  }}
                  onDragEnd={handleDragEnd}
                  style={{
                    border: '1px solid #ccc',
                    width,
                    height,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <El />
                </div>
                <button
                  type="button"
                  onClick={() => setModel(Model.rotatePiece(model, p.piece.id))}
                >
                  Rotate
                </button>
                <button type="button" onClick={() => setModel(Model.flipPiece(model, p.piece.id))}>
                  Flip
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default App
