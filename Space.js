import * as THREE from 'three';
import { initKeyboardControls, heightController, lengthController, fpsController, settings, ammoController } from './guiControls.js'; 
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

// Added vertical grid
const verticalGrid = new THREE.GridHelper(50, 50);
verticalGrid.rotation.x = Math.PI / 2; // Rotate 90 degrees to align with the YZ plane
verticalGrid.position.z = -25; // Move the grid to the back of the scene
scene.add(verticalGrid);

scene.add(controls, axesHelper, gridhelper, ambientLight);

let rocket, rocketGroup;
let bulletModel;
let lastShotTime = 0;


/**
 * keys state
 * 0 : up key
 * 1 : right key pressed
 * 2 : down key pressed
 * 3 : left key pressed
 */
let arrowKeysState = [false, false, false, false] 
initKeypressEventListeners()

rocketGroup = new THREE.Group()
rocketGroup.rotateY(-Math.PI/2)
scene.add(rocketGroup)

const loader = new GLTFLoader();
loader.load('models/spaceship.glb', function (gltf) {
    scene.add(gltf.scene);
    rocket = gltf.scene;
    rocketGroup.add(rocket)
    rocket.scale.set(0.2, 0.2, 0.2);
    rocket.rotation.y = -Math.PI/2;
  
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

function initKeypressEventListeners(){

    function onKeyDown(event){
        if (event.key == 'ArrowUp') {
            arrowKeysState[0] = true;
        }
        if (event.key == 'ArrowRight') {
            arrowKeysState[1] = true;
        }
        if (event.key == 'ArrowDown') {
            arrowKeysState[2] = true;
        }
        if (event.key == 'ArrowLeft') {
            arrowKeysState[3] = true;
        } 
    }

    function onKeyUp(event){
        if (event.key == 'ArrowUp') {
            arrowKeysState[0] = false;
        }
        if (event.key == 'ArrowRight') {
            arrowKeysState[1] = false;
        }
        if (event.key == 'ArrowDown') {
            arrowKeysState[2] = false;
        }
        if (event.key == 'ArrowLeft') {
            arrowKeysState[3] = false;
        } 
    }

    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);

}

function createAsteroid() {
    const numAsteroidModels = 6;
    const randomlyChosenAsteroidModel = Math.floor(Math.random() * numAsteroidModels) + 1;
    
    loader.load(`models/asteroids/asteroid${randomlyChosenAsteroidModel}.glb`, function (gltf) {
        scene.add(gltf.scene);
        const asteroid = gltf.scene;
        asteroid.position.set(-15, 0, Math.random() * 14 - 7); // Start from the left side with random Z position
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
        bullet.position.x -= 1.25; 
        bullet.position.y += 1.25; 
        bullet.rotation.z = -0 ;

        // Create a small red sphere on top of the bullet
        const sphereGeometry = new THREE.SphereGeometry(2, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const redSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        redSphere.position.set(0, 0.1, 0);
        bullet.add(redSphere);

        scene.add(bullet);
        bullets.push(bullet);
        console.log('Pew pew');
    }
});

/**this function animates the spaceship. It will apply the idle/moving animations etc depending on
 * the state of the key presses
 */
function animateSpaceship(){

    if (rocket != null){

        //if player is not pressing 'left' or 'right', display idle animation
        if (!arrowKeysState[1] && !arrowKeysState[3]){
            rocket.position.set(0, 0.2 * Math.cos(Date.now() * 0.002), 0)
            rocket.rotation.set(0, 0, 0.1 * Math.sin(Date.now() * 0.002))
        }
        else{

            const rotationAngleCap = 0.1 * Math.PI

            //player is pressing left key
            if (arrowKeysState[3]){
                rocketGroup.position.z += 0.05
                rocket.rotateZ(-0.01)
                if (rocket.rotation.z <=  -1 * rotationAngleCap){
                    rocket.rotation.z = -1 * rotationAngleCap
                }
                rocketGroup.position.z += 0.05
            }

            //player is pressing right key
            else if (arrowKeysState[1]){
                rocketGroup.position.z -= 0.05
                rocket.rotateZ(0.01)
                if (rocket.rotation.z >= rotationAngleCap){
                    rocket.rotation.z = rotationAngleCap
                }
            }
            

        }

        

        
      
        
    }

}

// FPS related stuff
let previousDelta = 0
function animate(currentDelta) {

    requestAnimationFrame(animate);

    var delta = currentDelta - previousDelta;
    const FPS = fpsController.getValue()

    if (FPS && delta < 1000 / FPS) {
        return;
    }

    animateSpaceship()

    bullets.forEach((bullet, index) => {
        bullet.position.x -= 0.1;
        if (bullet.position.x < -15) {
            scene.remove(bullet);
            bullets.splice(index, 1);
        }
    });

    asteroids.forEach((asteroid, index) => {
        asteroid.position.x += 0.15; // Move asteroids from left to right
        if (asteroid.position.x > 15) { // Remove asteroid when it goes off-screen
            scene.remove(asteroid);
            asteroids.splice(index, 1);
        }
    });
    renderer.render(scene, camera);

    previousDelta = currentDelta;

}

// Added light to the scene, otherwise stuff was black
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

animate(fpsController.getValue()); //60 FPS by default, can be changed on the dat.gui
initKeyboardControls();
