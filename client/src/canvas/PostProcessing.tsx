import { EffectComposer, Bloom, Vignette, HueSaturation } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export function PostProcessing() {
  return (
    <EffectComposer>
      {/* Glow on emissive elements — monster eyes, the necromancer orb,
          torchlight, skill VFX. Lower threshold so they actually bloom. */}
      <Bloom
        luminanceThreshold={0.62}
        luminanceSmoothing={0.8}
        intensity={0.7}
        mipmapBlur
      />
      {/* Slight desaturation + cool push reinforces the grim mood. */}
      <HueSaturation saturation={-0.08} />
      {/* Strong vignette draws the eye to the center / player. */}
      <Vignette
        offset={0.28}
        darkness={0.5}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
