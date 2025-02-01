import * as THREE from 'three';
import { initKeyboardControls} from './guiControls.js'; 


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


function createAsteroid(radius, colors) {
  //TODO: 
  const mesh = new THREE.Mesh(geometry, materialArray);
  return mesh;
}
  
 

//TODO: This is used to set the camera position, the higher the z, the further away the camera is?
camera.position.z = 6;
 
 
function animate() {
  requestAnimationFrame(animate);
 

  renderer.render(scene, camera);
}

animate();

initKeyboardControls(); // TODO: This gets the keyboard controls working by importing it from guiControls.js, 
// This might only update the speed, rotation and ammo values in the GUI, we might need to import the values to be able to use them 