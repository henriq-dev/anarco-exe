import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { LoadingManager } from 'three'

/** Load the optimized boss GLB only when the active runtime requests a boss model. */
export function loadBossGltf(url: string, manager?: LoadingManager): Promise<GLTF> {
  const loader = new GLTFLoader(manager)
  loader.setMeshoptDecoder(MeshoptDecoder)
  return loader.loadAsync(url)
}
