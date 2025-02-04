import * as THREE from 'three';
import { initKeyboardControls, heightController, lengthController, settings, ammoController } from './guiControls.js'; 
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight('white');
const controls = new OrbitControls(camera, renderer.domElement);
const axesHelper = new THREE.AxesHelper(2);
const gridhelper = new THREE.GridHelper(50, 50);

// Added verticle grid
const verticalGrid = new THREE.GridHelper(50, 50);
verticalGrid.rotation.x = Math.PI / 2; // Rotate 90 degrees to align with the YZ plane
verticalGrid.position.z = -25; // Move the grid to the back of the scene
scene.add(verticalGrid);


scene.add(controls, axesHelper, gridhelper, ambientLight);

let rocket;
let bulletModel;
let lastShotTime = 0;

const loader = new GLTFLoader();
loader.load('models/spaceship.glb', function (gltf) {
    scene.add(gltf.scene);
    rocket = gltf.scene;
    rocket.scale.set(0.2, 0.2, 0.2);
    
    window.addEventListener('keydown', event => {
        if (event.key == 'ArrowLeft') {
            rocket?.rotateZ(-0.05);
        } else if (event.key == 'ArrowRight') {
            rocket?.rotateZ(0.05);
        }
    });
}, undefined, function (error) {
    console.error(error);
});

loader.load('models/rocket.glb', function (gltf) {
    bulletModel = gltf.scene;
    bulletModel.scale.set(0.05, 0.05, 0.05);
}, undefined, function (error) {
    console.error(error);

    
});

const bullets = [];
const asteroids = [];

function createAsteroid() {
    const numAsteroidModels = 6;
    const randomlyChosenAsteroidModel = Math.floor(Math.random() * numAsteroidModels) + 1;
    
    loader.load(`models/asteroids/asteroid${randomlyChosenAsteroidModel}.glb`, function (gltf) {
        scene.add(gltf.scene);
        const asteroid = gltf.scene;
        asteroid.position.set(Math.random() * 14 - 7, 15, 0);
        scene.add(asteroid);
        asteroids.push(asteroid);
    }, undefined, function (error) {
        console.error(error);
    });
}

setInterval(createAsteroid, 2000);

camera.position.z = 6;

document.addEventListener('keydown', (event) => {
  const now = Date.now(); 
    if (event.code === 'Space' && settings.ammo > 0 && bulletModel && now - lastShotTime >= 500) {
        lastShotTime = now;
        ammoController.updateDisplay();
        
        const bullet = bulletModel.clone();
        bullet.position.copy(rocket.position);
        bullet.position.z += 1.25; 
        bullet.position.y += 1.25; 
        bullet.rotation.z = -1  ; 

        // Create a small red sphere on top of the bullet
        const sphereGeometry = new THREE.SphereGeometry(2, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const redSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        redSphere.position.set(0, 0.1, 0); // Adjust position to sit on top of the bullet
        bullet.add(redSphere);

        scene.add(bullet);
        bullets.push(bullet);
        console.log('Pew pew');
    }
});

function animate() {
    requestAnimationFrame(animate);

    bullets.forEach((bullet, index) => {
        bullet.position.y += 0.1;
        if (bullet.position.y > 15) {
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

// Added light to the scene, otherwise stuff was black
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

animate();
initKeyboardControls();
