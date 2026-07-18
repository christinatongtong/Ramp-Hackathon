"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type PlayerProps = {
  onMove?: (position: THREE.Vector3) => void;
};

export function Player({ onMove }: PlayerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const keysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      keysRef.current[event.code] = true;
    };
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current[event.code] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const speed = 4.5;
    const direction = new THREE.Vector3();

    if (keysRef.current.KeyW || keysRef.current.ArrowUp) direction.z -= 1;
    if (keysRef.current.KeyS || keysRef.current.ArrowDown) direction.z += 1;
    if (keysRef.current.KeyA || keysRef.current.ArrowLeft) direction.x -= 1;
    if (keysRef.current.KeyD || keysRef.current.ArrowRight) direction.x += 1;

    if (direction.lengthSq() > 0) {
      direction.normalize().multiplyScalar(speed * delta);
      groupRef.current.position.add(direction);
      groupRef.current.rotation.y = Math.atan2(direction.x, direction.z);
    }

    onMove?.(groupRef.current.position);
  });

  return (
    <group ref={groupRef} position={[0, 0, 5]}>
      <mesh castShadow position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.35, 0.8, 8, 16]} />
        <meshStandardMaterial color="#6ea8ff" />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color="#ffd6a5" />
      </mesh>
      <mesh position={[0.18, 1.58, 0.22]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
    </group>
  );
}

export function ThirdPersonCamera({
  target,
}: {
  target: React.MutableRefObject<THREE.Vector3 | null>;
}) {
  const { camera } = useThree();
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());

  useFrame(() => {
    const player = target.current;
    if (!player) return;

    desired.current.set(player.x, player.y + 2.2, player.z + 5.5);
    camera.position.lerp(desired.current, 0.08);
    lookAt.current.set(player.x, player.y + 1, player.z);
    camera.lookAt(lookAt.current);
  });

  return null;
}
