// guiControls.js
import dat from 'dat.gui'; 

// Define your settings object
export const settings = {
  height: 1.0,
  length: 1.0,
  ammo: 100,
  FPS: 60,
  showHitbox: true
};

// Initialize the GUI
export const gui = new dat.GUI();

// Add controllers for the parameters
export const heightController = gui.add(settings, 'height', -3, 3);
export const lengthController = gui.add(settings, 'length', -7, 7);
export const fpsController = gui.add(settings, 'FPS', 1, 165);
export const showHitboxController = gui.add(settings, 'showHitbox');

const heightInput = heightController.domElement.querySelector('input');
heightInput.disabled = true;
heightController.domElement.style.pointerEvents = 'none';

const lengthInput = lengthController.domElement.querySelector('input');
lengthInput.disabled = true;
lengthController.domElement.style.pointerEvents = 'none';

// AMMO Section
export const ammoController = gui.add(settings, 'ammo', 0, 100).listen();
let lastShotTime = 0;
function handleSpacebar(event) {
    if (event.code === 'Space') {
      const currentTime = Date.now();
      if (currentTime - lastShotTime >= 500) {
        if (settings.ammo > 1) {
          settings.ammo -= 1;
          ammoController.updateDisplay();
        }
        lastShotTime = currentTime;
      }
    }
}
const ammoInput = ammoController.domElement.querySelector('input');
ammoInput.disabled = true;
ammoController.domElement.style.pointerEvents = 'none';

// Optional: helper function to update the controllers
export function updateGUI() {
  heightController.updateDisplay();
  lengthController.updateDisplay();
  fpsController.updateDisplay()
  showHitboxController.updateDisplay()
}

export function initKeyboardControls() {
    document.addEventListener('keydown', (event) => {
      switch (event.key) {
        case 'ArrowUp':
          settings.height = Math.min(3, settings.height + 0.1);
          heightController.updateDisplay();
          break;
        case 'ArrowDown':
          settings.height = Math.max(-3, settings.height - 0.1);
          heightController.updateDisplay();
          break;
        case 'ArrowRight':
          settings.length = Math.min(7, settings.length + 0.1);
          lengthController.updateDisplay();
          break;
        case 'ArrowLeft':
          settings.length = Math.max(-7, settings.length - 0.1);
          lengthController.updateDisplay();
          break;
        default:
          break;
      }
      handleSpacebar(event);
    });
}
