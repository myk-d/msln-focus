// The Axo mark on a 96×64 grid: ring (focus) + spark dot + three gill strokes per side.
// `simple` drops to two strokes per side for 32 px and below, where three merge.
const FULL = ['M25 20L9 9', 'M23 32L5 32', 'M25 44L9 55', 'M71 20L87 9', 'M73 32L91 32', 'M71 44L87 55'];
const SIMPLE = ['M24 22L10 14', 'M24 42L10 50', 'M72 22L86 14', 'M72 42L86 50'];

export function GillsMark({ ink, spark, simple = false }: { ink: string; spark: string; simple?: boolean }) {
  return (
    <>
      <circle cx="48" cy="32" r={simple ? 17 : 18} fill="none" stroke={ink} strokeWidth={simple ? 9 : 6} />
      <circle cx="48" cy="32" r={simple ? 6 : 5.5} fill={spark} />
      {(simple ? SIMPLE : FULL).map((d) => (
        <path key={d} d={d} stroke={ink} strokeWidth={simple ? 9 : 5} strokeLinecap="round" />
      ))}
    </>
  );
}
