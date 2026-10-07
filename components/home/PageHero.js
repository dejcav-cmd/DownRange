// One hero for every page. Same CSS as the Home hero (.hh in styles/globals.css).
export default function PageHero({ img, imgSm, pos, posSm, eyebrow, title, sub, children, id = 'hh-title' }) {
  const style = {}
  if (img) style['--hh-img'] = `url(${img})`
  if (imgSm || img) style['--hh-img-sm'] = `url(${imgSm || img})`
  if (pos) style['--hh-pos'] = pos
  if (posSm) style['--hh-pos-sm'] = posSm
  return (
    <section className="hh" style={style} aria-labelledby={id}>
      <div className="container hh-in">
        {eyebrow ? <div className="hh-eyebrow">{eyebrow}</div> : null}
        <h1 className="hh-title" id={id}>{title}</h1>
        {sub ? <p className="hh-sub">{sub}</p> : null}
        {children}
      </div>
    </section>
  )
}
