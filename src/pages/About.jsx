export default function About() {
  return (
    <section className="centered">
      <h2>About Cafe Aroma</h2>
      <div className="grid" style={{alignItems:'center', maxWidth:'1100px', margin:'0 auto', gridTemplateColumns:'1.05fr 0.95fr', gap:'1.5rem'}}>
        <div className="card" style={{width:'100%', textAlign:'left'}}>
          <p style={{opacity:1, lineHeight:1.75}}>
            We are a neighborhood cafe focused on ethically sourced beans and
            exceptional hospitality. Our baristas obsess over every pour so your
            cup is memorable, every time.
          </p>
          <ul style={{marginTop:'0.75rem', opacity:1}}>
            <li>Single-origin beans roasted weekly</li>
            <li>Latte art and pour-over flight experiences</li>
            <li>House-baked pastries every morning</li>
          </ul>
        </div>
        <div className="card" style={{width:'80%'}}>
          <img src="https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=1600&auto=format&fit=crop" alt="Cafe interior" style={{width:'100%',height:'340px',objectFit:'cover',borderRadius:'0.5rem'}} />
        </div>
      </div>
    </section>
  )
}


