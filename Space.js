import * as THREE from 'three';
import { initKeyboardControls, heightController, lengthController, fpsController, settings, ammoController } from './guiControls.js'; 
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FireEffect } from './fire.js'; // Fire particle


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
//scene.add(verticalGrid, gridhelper);

scene.add(controls, axesHelper, ambientLight);

let rocket, rocketGroup;
let bulletModel;
let lastShotTime = 0;

const missileSpeed = 0.25;
const missileLifetime = 5000; // 5 seconds in milliseconds
const targetDistanceThreshold = 10; // Minimum distance for missle to target asteroid

 

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
    rocket.position.y = 0.5;
  
    const sphereGeometry = new THREE.ConeGeometry(1, 2, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xFFA500 });
    const orangeSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    orangeSphere.position.set(0, 5.5, -10.25);
    orangeSphere.rotation.x = -Math.PI / 2;
    rocket.add(orangeSphere);


}, undefined, function (error) {
    console.error(error);
});

loader.load('models/rocket.glb', function (gltf) {
    bulletModel = gltf.scene;
    bulletModel.scale.set(0.05, 0.05, 0.05);
}, undefined, function (error) {
    console.error(error);
});

// Shield
const material = new THREE.PointsMaterial({
    color: 0x0050FF, // Orange color
    size: 0.1,       // Adjust point size
    transparent: false,
    opacity: 0.9
});
const shield = new THREE.Points(new THREE.IcosahedronGeometry(5, 5), material);
rocketGroup.add(shield);
shield.scale.set(0.5, 0.5, 0.75);

// Warp field (could be removed later, its just a placeholder)
const warpField = new THREE.PointsMaterial({
    color: 0x0050FF, // Orange color
    size: 0.1,       // Adjust point size
    transparent: false,
    opacity: 0.9
});
const warp = new THREE.Points(new THREE.IcosahedronGeometry(5, 8), material);
scene.add(warp);
warp.scale.set(2, 2, 25);
warp.rotateY(Math.PI / 2);

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
        asteroid.position.set(-25, 0, Math.random() * 14 - 7); // Start from the left side with random Z position
        scene.add(asteroid);
        asteroids.push(asteroid);
    }, undefined, function (error) {
        console.error(error);
    });
}

setInterval(createAsteroid, 1000);

camera.position.z = 6;

document.addEventListener('keydown', (event) => {
    const now = Date.now(); 
    if (event.code === 'Space' && settings.ammo > 0 && bulletModel && now - lastShotTime >= 500) {
        lastShotTime = now;
        ammoController.updateDisplay();
        
        const bullet = bulletModel.clone();
        bullet.position.copy(rocketGroup.position);
        bullet.position.y = rocket.position.y;
        bullet.position.x -= 1.25; 
        bullet.position.y += 1.35; 
        bullet.rotation.z = -0 ;

        // Create a small red sphere on top of the bullet
        const sphereGeometry = new THREE.SphereGeometry(2, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const redSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        redSphere.position.set(0, 0.1, 0);
        bullet.add(redSphere);

        scene.add(bullet);
        bullets.push({ mesh: bullet, spawnTime: Date.now() }); // Store the spawn time of the bullet and the mesh itself
        console.log('Pew pew');
    }
    if (event.key === 'f'){
        shield.visible = !shield.visible;
        warp.visible = !warp.visible; 
        fireEffect.visible();
    }
});

//angular velocity and acceleration of the spaceship
let angularVelocity = 0.01
let angularAcceleration = 0

let linearVelocity = [0, 0, 0]
let linearAcceleration = [0, 0, 0]



/**this function animates the spaceship. It will apply the idle/moving animations etc depending on
 * the state of the key presses
 */
function animateSpaceship(){
    if (rocket != null){  
        const DAMPING_FACTOR = 0.007
        const INERTIA = 0.001

        //if player is not pressing 'left' or 'right', display idle animation
        if (!arrowKeysState[1] && !arrowKeysState[3]){

            //physics for movement of the spaceship
            linearAcceleration[1] = -1 * INERTIA * rocket.position.y
            linearVelocity[1] += linearAcceleration[1]
            rocket.position.y += linearVelocity[1] + 0.5 * linearAcceleration[1]

            //physics for rotation of the spaceship
            angularAcceleration = -1 * INERTIA * rocket.rotation.z - DAMPING_FACTOR * angularVelocity
            angularVelocity += angularAcceleration
            rocket.rotation.z += angularVelocity + 0.5 * angularAcceleration

        }
        else{

            const HEIGHT_DIP_CAP = -0.5
            const DIP_ACCELERATION = -0.0005
            const rotationAngleCap = 0.2 * Math.PI

            linearAcceleration[1] = DIP_ACCELERATION
            linearVelocity[1] += linearAcceleration[1]
            rocket.position.y += linearVelocity[1] + 0.5 * linearAcceleration[1]
            if (rocket.position.y <= HEIGHT_DIP_CAP){
                linearVelocity[1] = 0
                rocket.position.y = HEIGHT_DIP_CAP
            }

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

const fireEffect = new FireEffect(rocketGroup); //Used for fire particle

// FPS related stuff
let previousDelta = 0
function animate(currentDelta) {

    requestAnimationFrame(animate);

    var delta = currentDelta - previousDelta
    // console.log(delta)
    const FPS = fpsController.getValue()

    if (FPS && delta < 1000 / FPS) {
        return;
    }

    animateSpaceship()
    if (rocketGroup && rocket && rocketGroup.position && rocket.position) { // It kept crashing for some reason withouth this (I'm guessing its trying to access the position before its created?)
        fireEffect.animate(rocketGroup.position.z, rocket.position.y);
    }
    //console.log(rocket.position.y)
    //console.log(rocketGroup.position)
    //console.log(rocketGroup.position.z);

    if(asteroids.length != 0){updateHomingMissiles(bullets, asteroids)}

    asteroids.forEach((asteroid, index) => {
        asteroid.position.x += 0.15; // Move asteroids from left to right
        if (asteroid.position.x > 15) { // Remove asteroid when it goes off-screen
            scene.remove(asteroid);
            asteroids.splice(index, 1);
        }
    });

    shield.rotation.z += 0.01;
    warp.rotation.z += 0.015;

    renderer.render(scene, camera);

    previousDelta = currentDelta;
}

// Added light to the scene, otherwise stuff was black
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

animate(fpsController.getValue()); //60 FPS by default, can be changed on the dat.gui
initKeyboardControls();


/**
 * Function to update homing behavior for multiple missiles
 * @param {*} missiles 
 * @param {*} asteroid 
 */
function updateHomingMissiles(missiles, targets) {
    const currentTime = Date.now();
    const initialForwardTime = 750; // 0.75 seconds to go forward before homing

    for (let i = missiles.length - 1; i >= 0; i--) {
        let missile = missiles[i];

        if (currentTime - missile.spawnTime > missileLifetime) {
            scene.remove(missile.mesh);
            missiles.splice(i, 1);
            continue;
        }

        let directionVector;

        if (currentTime - missile.spawnTime < initialForwardTime) {
            // Initial forward movement
            directionVector = new THREE.Vector3(-1, 0, 0); 
            missile.mesh.position.addScaledVector(directionVector, missileSpeed);

        } else {
            // Homing behavior
            let closestTarget = findClosestTarget(missile.mesh.position, targets);
            if (closestTarget) { // Check if a target was found
                directionVector = new THREE.Vector3().subVectors(closestTarget.position, missile.mesh.position);
                directionVector.normalize();
                missile.mesh.position.addScaledVector(directionVector, missileSpeed);
            } else {
                // What to do if no target is found after initial time? Keep going forward
                directionVector = new THREE.Vector3(0, 0, 1);
                missile.mesh.position.addScaledVector(directionVector, missileSpeed);
            }
        }


    }
}

/**
 * Finds the closest target while prioritizing those with a lower X position.
 * @param {THREE.Vector3} position - The current missile position.
 * @param {Array} targets - List of potential targets.
 * @returns The closest target considering weighted distances.
 */
function findClosestTarget(position, targets) {
    return targets.reduce((closest, target) => {
        let dx = target.position.x - position.x;
        let dy = target.position.y - position.y;
        let dz = target.position.z - position.z;

        // Adjust weighting based on X position
        let xWeight = dx > 0 ? 10 : 0.5; // More weight for negative X, less for positive X
        let weightedDx = dx * xWeight;

        let weightedDistance = Math.sqrt(weightedDx * weightedDx + dy * dy + dz * dz);

        let closestDx = closest.position.x - position.x;
        let closestDy = closest.position.y - position.y;
        let closestDz = closest.position.z - position.z;
        
        let closestXWeight = closestDx < 0 ? 1.5 : 0.7;
        let closestWeightedDx = closestDx * closestXWeight;

        let closestWeightedDistance = Math.sqrt(closestWeightedDx * closestWeightedDx + closestDy * closestDy + closestDz * closestDz);

        return weightedDistance < closestWeightedDistance ? target : closest;
    }, targets[0]);
}