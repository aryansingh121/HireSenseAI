import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function AvatarModel() {
  const headRef = useRef(null);
  const jawRef = useRef(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    // Check if browser native TTS is active
    const isSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;

    if (isSpeaking) {
      timeRef.current += delta * 15; // Speaking animation speed
      const talkingBounce = Math.abs(Math.sin(timeRef.current)) * 0.15; // Jaw bounce
      
      if (jawRef.current) {
        jawRef.current.position.y = -0.5 - talkingBounce;
      }
      if (headRef.current) {
        // Slight bobbing
        headRef.current.position.y = Math.sin(timeRef.current * 0.5) * 0.05;
      }
    } else {
      timeRef.current = 0;
      if (jawRef.current) {
        jawRef.current.position.y = -0.5;
      }
      if (headRef.current) {
        headRef.current.position.y = 0;
      }
    }
    
    // Slow idle rotation
    if (headRef.current && !isSpeaking) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
    } else if (headRef.current) {
      // Look at candidate while speaking
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, 0, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, 0, 0.1);
    }
  });

  return (
    <group ref={headRef} position={[0, 0, 0]} scale={1.5}>
      {/* Main Head */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.8} />
      </mesh>
      
      {/* Glowing Eyes */}
      <mesh position={[-0.35, 0.2, 0.76]}>
        <boxGeometry args={[0.4, 0.15, 0.1]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      <mesh position={[0.35, 0.2, 0.76]}>
        <boxGeometry args={[0.4, 0.15, 0.1]} />
        <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      
      {/* Moving Jaw */}
      <mesh ref={jawRef} position={[0, -0.5, 0.7]}>
        <boxGeometry args={[0.8, 0.15, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}
