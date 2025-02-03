import * as THREE from 'three';
import { initKeyboardControls, heightController, lengthController, settings, ammoController} from './guiControls.js'; 
import { OrbitControls } from 'three/examples/jsm/Addons.js'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
const axesHelper = new THREE.AxesHelper(2);
const gridhelper = new THREE.GridHelper(50, 50);

scene.add(controls, axesHelper, gridhelper) // adding controls and grid axes to help debug 

function createShip(radius, widthSegments = 32, heightSegments = 32, color = 0xff0000) {
  // Create sphere geometry
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  // Create a basic material with a specified color
  const material = new THREE.MeshBasicMaterial({ color });
  // Create the mesh combining geometry and material
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

function createAsteroidSphere(radius, widthSegments = 32, heightSegments = 32, color = 0x808080){
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  // Create a basic material with a specified color
  const material = new THREE.MeshBasicMaterial({ color });
  // Create the mesh combining geometry and material
  const sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

const sphere = createShip(1);
scene.add(sphere);

function createAsteroid() {
  const asteroid = createAsteroidSphere(0.5);
  asteroid.position.set(Math.random() * 14 - 7, 5, 0);
  scene.add(asteroid);
  asteroids.push(asteroid);
}
 
setInterval(createAsteroid, 2000);

//TODO: This is used to set the camera position, the higher the z, the further away the camera is?
camera.position.z = 6;
 
const bullets = [];
const asteroids = [];


function createBullet() {
  const geometry = new THREE.SphereGeometry(0.2, 8, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const bullet = new THREE.Mesh(geometry, material);
  bullet.position.set(sphere.position.x, sphere.position.y, sphere.position.z);
  scene.add(bullet);
  bullets.push(bullet);
}

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space' && settings.ammo > 0) {
    //settings.ammo -= 1;
    ammoController.updateDisplay();
    createBullet();
  }
});

asteroids.forEach((asteroid, index) => {
  asteroid.position.y -= 0.05;
  if (asteroid.position.y < -3.5) {
    scene.remove(asteroid);
    asteroids.splice(index, 1);
  }
});


function animate() {
  requestAnimationFrame(animate);
 
  sphere.position.y = 1 * heightController.getValue();
  
  // Move sphere left/right based on rotationController
  sphere.position.x = 1 * lengthController.getValue();

  bullets.forEach((bullet, index) => {
    bullet.position.y += 0.1;
    if (bullet.position.y > 5) {
      scene.remove(bullet);
      bullets.splice(index, 1);
    }
  });


  asteroids.forEach((asteroid, index) => {
    asteroid.position.y -= 0.05;
    if (asteroid.position.y < -3.5) {
      scene.remove(asteroid);
      asteroids.splice(index, 1);
    }
  });


  renderer.render(scene, camera);
}

animate();

initKeyboardControls(); // TODO: This gets the keyboard controls working by importing it from guiControls.js, 
// GUI values can be imported using XXXController.getValue() where XXX is the name of the controller
 