import * as THREE from 'three';
import { initKeyboardControls, heightController, lengthController} from './guiControls.js'; 


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);



function createAsteroid(radius, widthSegments = 32, heightSegments = 32, color = 0xff0000) {
  // Create sphere geometry
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  // Create a basic material with a specified color
  const material = new THREE.MeshBasicMaterial({ color });
  // Create the mesh combining geometry and material
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}
const sphere = createAsteroid(1);
scene.add(sphere);
 

//TODO: This is used to set the camera position, the higher the z, the further away the camera is?
camera.position.z = 6;
 
 
function animate() {
  requestAnimationFrame(animate);
 
  sphere.position.y = 1 * heightController.getValue();
  
  // Move sphere left/right based on rotationController
  sphere.position.x = 1 * lengthController.getValue();


  renderer.render(scene, camera);
}

animate();

initKeyboardControls(); // TODO: This gets the keyboard controls working by importing it from guiControls.js, 
// GUI values can be imported using XXXController.getValue() where XXX is the name of the controller
 