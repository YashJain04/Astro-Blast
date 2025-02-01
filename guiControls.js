// guiControls.js
import dat from 'dat.gui'; 

// Define your settings object
export const settings = {
  speed: 1.0,
  rotation: 0,
  // add additional parameters if needed
};

// Initialize the GUI
export const gui = new dat.GUI();

// Add controllers for the parameters
export const speedController = gui.add(settings, 'speed', 0, 5);
export const rotationController = gui.add(settings, 'rotation', 0, Math.PI * 2);

const speedInput = speedController.domElement.querySelector('input');
speedInput.disabled = true; // disable the input field unless you use arrow key
speedController.domElement.style.pointerEvents = 'none';

const rotationInput = rotationController.domElement.querySelector('input');
rotationInput.disabled = true; // disable the input field unless you use arrow key
rotationController.domElement.style.pointerEvents = 'none';


// Optional: helper function to update the controllers
export function updateGUI() {
  speedController.updateDisplay();
  rotationController.updateDisplay();
}

export function initKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowUp':
          settings.speed = Math.min(settings.speed + 0.1, 5);
          speedController.updateDisplay();
          break;
        case 'ArrowDown':
          settings.speed = Math.max(settings.speed - 0.1, 0);
          speedController.updateDisplay();
          break;
        case 'ArrowRight':
          settings.rotation += 0.1;
          rotationController.updateDisplay();
          break;
        case 'ArrowLeft':
          settings.rotation -= 0.1;
          rotationController.updateDisplay();
          break;
        default:
          break;
      }
      // Optionally, update any three.js objects here
    });
  }