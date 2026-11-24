import { useState } from 'react';
import { Ruler } from 'lucide-react';
import { getSizeType, recommendClothes, recommendShoe } from '../utils/sizing';

export default function FitFinder({ product, onPick }) {
  const type = getSizeType(product);
  const [gender, setGender] = useState(/^men|^Men/.test(product.id + product.category) ? 'men' : 'women');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [foot, setFoot] = useState('');
  const [fit, setFit] = useState('true');
  const [result, setResult] = useState('');

  const submit = e => {
    e.preventDefault();
    setResult(
      type === 'shoes'
        ? recommendShoe(Number(foot))
        : recommendClothes({ gender, height: Number(height), weight: Number(weight), fit })
    );
  };

  return (
    <details className="fit-finder">
      <summary><Ruler size={15} /> Find my size</summary>
      <form onSubmit={submit}>
        {type === 'clothes' && (
          <>
            <div className="seg" role="group" aria-label="Sizing for">
              {['women', 'men'].map(g => (
                <button type="button" key={g} className={gender === g ? 'on' : ''} onClick={() => setGender(g)}>
                  {g === 'women' ? 'Women' : 'Men'}
                </button>
              ))}
            </div>
            <div className="fit-row">
              <label>Height (cm)<input type="number" min="130" max="220" required value={height} onChange={e => setHeight(e.target.value)} /></label>
              <label>Weight (kg)<input type="number" min="35" max="200" required value={weight} onChange={e => setWeight(e.target.value)} /></label>
            </div>
            <div className="seg" role="group" aria-label="Preferred fit">
              {[['snug', 'Fitted'], ['true', 'Regular'], ['loose', 'Relaxed']].map(([v, l]) => (
                <button type="button" key={v} className={fit === v ? 'on' : ''} onClick={() => setFit(v)}>{l}</button>
              ))}
            </div>
          </>
        )}
        {type === 'shoes' && (
          <label>Foot length (cm) — heel to longest toe
            <input type="number" step="0.1" min="20" max="33" required value={foot} onChange={e => setFoot(e.target.value)} />
          </label>
        )}
        <button className="btn btn-outline full-btn" type="submit">Recommend a size</button>
        {result && (
          <p className="fit-result" role="status">
            We suggest <b>{result}</b>. Between sizes? Take the larger one.
            <button type="button" className="text-btn" onClick={() => onPick(result)}>Select {result}</button>
          </p>
        )}
        <p className="fit-note">A guide based on typical measurements — fit varies slightly by piece.</p>
      </form>
    </details>
  );
}
