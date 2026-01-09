// loaders.js

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

/**
 * Charge un modèle GLTF/GLB
 * @param {string} url - chemin du fichier modèle
 * @returns {Promise<{model:THREE.Object3D, animations:Array}>}
 */
export function loadModel(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        model.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });

        resolve({
          model,
          animations: gltf.animations,
        });
      },
      undefined,
      reject
    );
  });
}

/**
 * Charge une texture
 * @param {string} url
 * @returns {THREE.Texture}
 */
export function loadTexture(url) {
  return textureLoader.load(url);
}
