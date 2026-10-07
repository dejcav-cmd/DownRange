import PressCard from './PressCard'

// Card grid that always fills its last row: a short last row stretches its cards to the full width
// (CSS reads data-r3 / data-r2, the remainder of the card count for 3 and 2 columns).
export default function PressGrid({ items, style }) {
  if (!items || !items.length) return null
  return (
    <div className="pr-grid" data-r3={items.length % 3} data-r2={items.length % 2} style={style}>
      {items.map(it => <PressCard key={it._id} item={it} />)}
    </div>
  )
}
