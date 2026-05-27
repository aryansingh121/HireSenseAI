import { useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import useInterviewStore, { INTERVIEW_STATES } from "../../store/useInterviewStore.js";

export default function AvatarModel() {
  const status = useInterviewStore((state) => state.status);
  
  const headRef = useRef(null);
  const jawRef = useRef(null);
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  
  const timeRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const nextBlinkTimeRef = useRef(3);

  useFrame((state, delta) => {
    // Check if browser native TTS is active
    const isSpeaking = window.speechSynthesis && window.speechSynthesis.speaking;
    const time = state.clock.elapsedTime;

    // --- 1. Breathing Animation (Subtle Y-axis translation) ---
    const breathingOffset = Math.sin(time * 1.5) * 0.02;

    // --- 2. Blinking Animation ---
    blinkTimerRef.current += delta;
    let eyeScaleY = 1;
    
    if (blinkTimerRef.current > nextBlinkTimeRef.current) {
      // Blink lasts for ~0.15 seconds
      if (blinkTimerRef.current < nextBlinkTimeRef.current + 0.15) {
        // Fast sine wave to close and open
        const blinkProgress = (blinkTimerRef.current - nextBlinkTimeRef.current) / 0.15;
        eyeScaleY = Math.abs(Math.cos(blinkProgress * Math.PI));
      } else {
        // Reset blink
        blinkTimerRef.current = 0;
        nextBlinkTimeRef.current = 2 + Math.random() * 4; // Next blink in 2 to 6 seconds
      }
    }

    if (leftEyeRef.current) leftEyeRef.current.scale.y = eyeScaleY;
    if (rightEyeRef.current) rightEyeRef.current.scale.y = eyeScaleY;

    // --- 3. Speaking Jaw Animation ---
    if (isSpeaking || status === INTERVIEW_STATES.SPEAKING) {
      timeRef.current += delta * 15; // Speaking animation speed
      const talkingBounce = Math.abs(Math.sin(timeRef.current)) * 0.15; // Jaw bounce
      
      if (jawRef.current) {
        jawRef.current.position.y = -0.5 - talkingBounce;
      }
      if (headRef.current) {
        headRef.current.position.y = breathingOffset + Math.sin(timeRef.current * 0.5) * 0.03;
      }
    } else {
      timeRef.current = 0;
      if (jawRef.current) {
        jawRef.current.position.y = THREE.MathUtils.lerp(jawRef.current.position.y, -0.5, 0.2);
      }
      if (headRef.current) {
        headRef.current.position.y = THREE.MathUtils.lerp(headRef.current.position.y, breathingOffset, 0.1);
      }
    }
    
    // --- 4. State-Driven Head Movement ---
    if (headRef.current) {
      let targetRotX = 0;
      let targetRotY = 0;

      if (status === INTERVIEW_STATES.PROCESSING) {
        // Look up and to the right while processing
        targetRotX = -0.2 + Math.sin(time * 0.5) * 0.05;
        targetRotY = 0.3 + Math.sin(time * 0.3) * 0.1;
      } 
      else if (status === INTERVIEW_STATES.ERROR) {
        // Surprise recoil backwards and lock eyes
        targetRotX = -0.1;
        targetRotY = 0;
        if (headRef.current) headRef.current.position.z = -0.2; 
      }
      else if (status === INTERVIEW_STATES.LISTENING) {
        // Subtle tilt forward and lock eye contact
        targetRotX = 0.1 + Math.sin(time * 1.2) * 0.02;
        targetRotY = Math.sin(time * 0.2) * 0.05;
        if (headRef.current) headRef.current.position.z = THREE.MathUtils.lerp(headRef.current.position.z, 0, 0.1);
      }
      else if (!isSpeaking) {
        // Idle wandering
        targetRotY = Math.sin(time * 0.5) * 0.1;
        targetRotX = Math.sin(time * 0.3) * 0.05;
        if (headRef.current) headRef.current.position.z = THREE.MathUtils.lerp(headRef.current.position.z, 0, 0.1);
      }

      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, targetRotY, 0.1);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, targetRotX, 0.1);
    }
  });

  return (
    <group ref={headRef} position={[0, 0, 0]} scale={1.5}>
      {/* Main Head */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.2} metalness={0.5} />
      </mesh>
      
      {/* Glowing Eyes */}
      <mesh ref={leftEyeRef} position={[-0.35, 0.2, 0.76]}>
        <boxGeometry args={[0.4, 0.15, 0.1]} />
        <meshStandardMaterial color={status === INTERVIEW_STATES.ERROR ? "#ef4444" : "#06b6d4"} emissive={status === INTERVIEW_STATES.ERROR ? "#ef4444" : "#06b6d4"} emissiveIntensity={(status === INTERVIEW_STATES.PROCESSING || status === INTERVIEW_STATES.ERROR) ? 4 : 2} toneMapped={false} />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.35, 0.2, 0.76]}>
        <boxGeometry args={[0.4, 0.15, 0.1]} />
        <meshStandardMaterial color={status === INTERVIEW_STATES.ERROR ? "#ef4444" : "#06b6d4"} emissive={status === INTERVIEW_STATES.ERROR ? "#ef4444" : "#06b6d4"} emissiveIntensity={(status === INTERVIEW_STATES.PROCESSING || status === INTERVIEW_STATES.ERROR) ? 4 : 2} toneMapped={false} />
      </mesh>
      
      {/* Moving Jaw */}
      <mesh ref={jawRef} position={[0, -0.5, 0.7]}>
        <boxGeometry args={[0.8, 0.15, 0.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  );
}
