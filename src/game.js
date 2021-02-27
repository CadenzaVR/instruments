const MAX_ROTATION = Math.PI / 2;

AFRAME.registerSystem("game-controller", {
  init: function() {
    MIDI.loadPlugin({
      soundfontUrl: "soundfonts/",
      instrument: "marimba"
    });
    this.scene = document.querySelector("a-scene");
    this.textureLoader = new THREE.TextureLoader();
    this.textureLoader.crossOrigin = "Anonymous";

    this.staffTextures = {
      treble: this.textureLoader.load("/images/treble_clef_512x512.png"),
      bass: this.textureLoader.load("/images/bass_clef_512x512.png")
    };

    const imageInput = document.getElementById("image-input");
    imageInput.addEventListener("change", () => {
      this.importImage(URL.createObjectURL(imageInput.files[0]));
    });

    const urlInput = document.getElementById("url-input");
    const urlButton = document.getElementById("url-input-button");
    urlButton.addEventListener("click", () => {
      this.importImage(urlInput.value);
    });

    // Settings
    this.settings = {};
    
    this.registerSetting("malletBounce", true);
    document.addEventListener("trackpadup", () => {
      this.setSetting("malletBounce", !this.settings.malletBounce);
    });
    document.addEventListener("bbuttondown", () => {
      this.setSetting("malletBounce", !this.settings.malletBounce);
    });

    this.noteDuration = 0.1;

    // Objects
    this.keys = [];
    this.mallets = [];
    this.images = [];
    this.musicFlashCard = {
      noteMesh: null,
      sharpMesh: null,
      staffMesh: null,
      component: null,
      timeout: null,
      toggleButton: {
        elem: null,
        pressedState: 0,
        buttonMesh: null,
        boundingBox: null
      }
    };

    // Hand controls
    const leftHand = document.querySelector("#leftHand");
    const rightHand = document.querySelector("#rightHand");
    this.registerHand(leftHand);
    this.registerHand(rightHand);

    // Keys
    const height = 0.023;

    const widthValues = [
      2.8125,
      2.625,
      2.625,
      2.625,
      2.625,
      2.625,
      2.5,
      2.5,
      2.5,
      2.5,
      2.5,
      2.5,
      2.4375,
      2.4375,
      2.4375,
      2.4375,
      2.4375,
      2.375,
      2.25,
      2.25,
      2.25,
      2.25,
      2.25,
      2.25,
      2.125,
      2.125,
      2.125,
      2,
      2,
      2,
      1.875,
      1.875,
      1.875,
      1.875,
      1.875,
      1.875,
      1.875,
      1.875,
      1.875,
      1.875,
      1.875,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.75,
      1.625,
      1.625,
      1.625,
      1.625,
      1.625,
      1.625,
      1.625
    ].map(x => x / 39.3701);

    const depthValues = [
      21.75,
      21.1875,
      21.1875,
      20.6875,
      20.6875,
      20.125,
      19.625,
      19.625,
      19.125,
      19.125,
      18.6875,
      18.6875,
      18.1875,
      17.75,
      17.75,
      17.25,
      17.25,
      16.8125,
      16.375,
      16.375,
      15.9375,
      15.9375,
      15.4375,
      15.4375,
      15,
      14.625,
      14.5625,
      14.25,
      14.25,
      13.75,
      13.375,
      13.375,
      13,
      12.9375,
      12.625,
      12.5625,
      12.25,
      11.875,
      11.875,
      11.4375,
      11.4375,
      11.0625,
      10.75,
      10.6875,
      10.375,
      10.3125,
      10,
      10,
      9.625,
      9.25,
      9.25,
      8.9375,
      8.9375,
      8.5625,
      8.1875,
      8.1875,
      7.875,
      7.875,
      7.5,
      7.5,
      7.1875
    ].map(x => x / 39.3701);

    const startX = -1.147;

    const noteSpacing = 0.0135;

    //bottom row
    const y1 = 0.802;
    const z1 = -0.004;

    //top row
    const y2 = 0.837;
    const z2 = -0.503;

    let prevX;
    let prevWidth;
    for (let i = 0; i < 61; i++) {
      let x = startX;
      let y;
      let z;

      let width = widthValues[i];
      let depth = depthValues[i];
      let depthDiff = depthValues[0] - depth;

      switch (i % 12) {
        case 0:
        case 2:
        case 4:
        case 5:
        case 7:
        case 9:
        case 11:
          y = y1;
          z = z1 - depthDiff / 2;
          if (i != 0) {
            x = prevX + prevWidth / 2 + noteSpacing + width / 2;
          }
          prevX = x;
          prevWidth = width;
          break;
        case 1:
        case 3:
        case 6:
        case 8:
        case 10:
          depthDiff = depthValues[1] - depth;
          y = y2;
          z = z2 + depthDiff / 2;
          x = prevX + prevWidth / 2 + noteSpacing / 2;
          break;
      }

      const key = document.createElement("a-box");
      key.setAttribute("geometry", {
        height: height,
        width: width,
        depth: depth
      });

      key.setAttribute("material", {
        color: "#481f15"
      });

      key.object3D.position.set(x, y, z);

      key.dataset.note = i + 36;
      this.scene.appendChild(key);
      key.addEventListener("loaded", () => {
        this.registerKey(key);
      });
    }

    // Add a starfield to the background of a scene
    // TODO replace with skysphere
    var starsGeometry = new THREE.Geometry();
    const sunDirection = new THREE.Vector3(1, 1, -1);
    for (var i = 0; i < 500; i++) {
      var star = new THREE.Vector3();
      do {
        star.x = THREE.Math.randFloatSpread(1800);
        star.y = THREE.Math.randFloat(0, 1000);
        star.z = THREE.Math.randFloatSpread(1800);
      } while (star.length() < 300 || star.angleTo(sunDirection) < 0.2);

      const starMirror = new THREE.Vector3();
      starMirror.x = star.x;
      starMirror.z = star.z;
      starMirror.y = -1 * star.y;
      starsGeometry.vertices.push(star);
      starsGeometry.vertices.push(starMirror);
    }
    var starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });
    var starField = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.object3D.add(starField);
  },

  createMesh: function(url) {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => {
          resolve(this.createMeshFromTexture(texture));
        },
        undefined,
        err => {
          console.error("Unable to load image.");
          reject();
        }
      );
    });
  },

  createMeshFromTexture: function(texture) {
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true
    });
    const imageGeometry = new THREE.PlaneBufferGeometry(
      texture.image.width / 2000,
      texture.image.height / 2000
    );
    return new THREE.Mesh(imageGeometry, material);
  },

  importImage: function(url) {
    this.createMesh(url).then(mesh => {
      this.images.push(mesh);
      this.scene.object3D.add(mesh);
      mesh.position.y = 0.9;
      mesh.position.z = -0.75;
      mesh.position.x = 0;
      mesh.rotation.x = -80 * THREE.Math.DEG2RAD;
    });
  },

  registerHand: function(hand) {
    hand.addEventListener("controllerconnected", () => {
      setTimeout(() => {
        const mallet = this.mallets.filter(m => m.handEl == hand)[0];
        if (
          mallet.handEl.components.haptics.gamepad.hapticActuators.length > 0
        ) {
          mallet.haptics = mallet.handEl.components.haptics;
        }
      }, 1000);
    });

    // Mallet image controls
    hand.addEventListener("gripdown", () => {
      const mallet = this.mallets.filter(m => m.handEl == hand)[0];
      for (let i = 0; i < this.images.length; i++) {
        const image = this.images[i];
        const boundingBox = new THREE.Box3().setFromObject(image);
        if (boundingBox.intersectsSphere(mallet.boundingSphere)) {
          this.attach(image, mallet.handEl.object3D, this.scene.object3D);
          mallet.attachedImage = image;
          break;
        }
      }
    });

    hand.addEventListener("gripup", () => {
      const mallet = this.mallets.filter(m => m.handEl == hand)[0];
      if (mallet.attachedImage) {
        this.detach(
          mallet.attachedImage,
          mallet.handEl.object3D,
          this.scene.object3D
        );
        mallet.attachedImage = null;
      }
    });

    hand.addEventListener("axismove", e => {
      const handMallets = this.mallets.filter(m => m.handEl == hand);
      for (let mallet of handMallets) {
        if (mallet.rotationEl.object3D.parent == this.scene.object3D) {
          return;
        }
      }
      const moveAmountY = e.detail.axis[1];
      const moveAmountX =
        e.detail.axis[0] *
        Math.abs(e.detail.axis[0]) *
        handMallets[0].xAxisMultiplier;
      let rotationAmount =
        handMallets[0].rotationEl.object3D.rotation.y + moveAmountX * 0.05;
      if (moveAmountX < 0) {
        rotationAmount = Math.max(0, rotationAmount);
      } else {
        rotationAmount = Math.min(MAX_ROTATION, rotationAmount);
      }
      for (let mallet of handMallets) {
        if (mallet.attachedImage) {
          mallet.attachedImage.scale.multiplyScalar(1 - moveAmountY / 100);
        }
        //update rotation
        mallet.rotationEl.object3D.rotation.y =
          rotationAmount * mallet.rotateDirection;
      }
    });
  },

  registerKey: function(el) {
    const key = {
      boundingBox: new THREE.Box3().setFromObject(el.object3D),
      el: el,
      state: 0,
      note: el.dataset.note
    };
    this.keys.push(key);
  },

  registerMallet: function(el, rotateDirection, xAxisMultiplier) {
    const mallet = {
      handEl: el.parentElement.parentElement.parentElement.parentElement,
      baseEl: el.parentElement.parentElement.parentElement,
      rotationEl: el.parentElement.parentElement,
      rotateDirection: rotateDirection,
      xAxisMultiplier: xAxisMultiplier,
      targetPos: new THREE.Vector3(0, 0, 0),
      moveVelocity: new THREE.Vector3(0, 0, 0),
      moveState: 0,
      bit: Math.pow(2, this.mallets.length),
      object3D: el.object3D,
      radius: el.getAttribute("geometry").radius
    };

    mallet.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      mallet.radius
    );
    this.mallets.push(mallet);
  },

  registerMusicFlashcard: function(component) {
    this.musicFlashCard.component = component;
    let staffImage;
    if (component.clef === "treble") {
      staffImage = "/images/treble_clef_512x512.png";
    } else if (component.clef === "bass") {
      staffImage = "/images/bass_clef_512x512.png";
    }
    this.createMesh(staffImage).then(mesh => {
      component.el.object3D.add(mesh);
      this.musicFlashCard.staffMesh = mesh;
      mesh.position.y = -0.004;
    });

    this.createMesh("/images/whole_note.png").then(noteMesh => {
      this.musicFlashCard.noteMesh = noteMesh;
      component.el.object3D.add(noteMesh);
      noteMesh.position.x = 0.05;
      noteMesh.position.z = 0.0001;
      this.positionNote(noteMesh, component.note);
      this.createMesh("/images/sharp_sign.png").then(sharpMesh => {
        this.musicFlashCard.sharpMesh = sharpMesh;
        noteMesh.add(sharpMesh);
        sharpMesh.position.x = -0.05;
      });
    });

    const flashcardBackground = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.3, 0.3),
      new THREE.MeshBasicMaterial({ color: "#FFF"})
    );
    component.el.object3D.add(flashcardBackground);
    component.el.object3D.updateMatrixWorld();
    flashcardBackground.position.z = -0.005;

    const titleElem = document.createElement("a-entity");
    titleElem.setAttribute("text", {
      value: "Music Note Flashcards",
      height: 1,
      width: 1,
      anchor: "align"
    });
    component.el.appendChild(titleElem);
    titleElem.object3D.position.set(-0.15, 0.2, 0);

    const toggleButtonElem = document.createElement("a-entity");
    toggleButtonElem.setAttribute("text", {
      value: "Start",
      height: 1,
      width: 1,
      anchor: "align",
      xOffset: -0.05
    });
    component.el.appendChild(toggleButtonElem);
    toggleButtonElem.object3D.position.x = 0.25;

    const buttonMesh = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(0.2, 0.2),
      new THREE.MeshBasicMaterial({ color: "#009900", transparent: true })
    );
    component.el.object3D.add(buttonMesh);
    component.el.object3D.updateMatrixWorld();
    buttonMesh.position.x = 0.25;

    this.musicFlashCard.toggleButton.elem = toggleButtonElem;
    this.musicFlashCard.toggleButton.buttonMesh = buttonMesh;
    this.musicFlashCard.toggleButton.boundingBox = new THREE.Box3().setFromObject(
      buttonMesh
    );
  },

  positionNote: function(noteMesh, noteValue) {
    const sharpValues = {
      treble: [0, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1],
      bass: [0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1]
    };
    const sharpVisible = sharpValues[this.musicFlashCard.component.clef];
    const noteOffsets = {
      treble: 0,
      bass: 21
    };

    const remainderOffsets = {
      treble: [0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6],
      bass: [0, 0, 1, 2, 2, 3, 3, 4, 4, 5, 6, 6]
    };
    const offsets = remainderOffsets[this.musicFlashCard.component.clef];
    const noteHeight = 0.019;
    const baseValue = 71 - noteOffsets[this.musicFlashCard.component.clef];

    const diff = noteValue - baseValue;
    let numOctaves = Math.floor(Math.abs(diff / 12));
    if (diff < 0) {
      numOctaves *= -1;
    }
    let negativeOffset = 0;
    let remainder = diff % 12;
    if (remainder < 0) {
      remainder = (remainder + 12) % 12;
      negativeOffset = 7;
    }

    const numJumps = offsets[remainder] - negativeOffset;
    noteMesh.position.y = noteHeight * (numOctaves * 7 + numJumps);
    if (this.musicFlashCard.sharpMesh) {
      const isSharpNote = sharpVisible[remainder];
      if (isSharpNote) {
        this.musicFlashCard.sharpMesh.visible = true;
      } else {
        this.musicFlashCard.sharpMesh.visible = false;
      }
    }
  },

  playCurrentFlashcardNote: function() {
    this.musicFlashCard.staffMesh.material.map = this.staffTextures[
      this.musicFlashCard.component.clef
    ];
    const targetNote = this.musicFlashCard.component.note;
    this.positionNote(this.musicFlashCard.noteMesh, targetNote);
    MIDI.noteOn(12, targetNote, 150, 0);
    MIDI.noteOff(12, targetNote, 0.75);
  },

  tick: function(time, deltaTime) {
    const keys = this.keys;
    const flashCardButton = this.musicFlashCard.toggleButton;
    for (let mallet of this.mallets) {
      //update position
      if (mallet.moveState != 0) {
        const basePosition = mallet.baseEl.object3D.position;
        const newPosition = mallet.moveVelocity
          .clone()
          .multiplyScalar(deltaTime)
          .add(basePosition);

        if (
          mallet.targetPos.distanceTo(newPosition) >=
          mallet.targetPos.distanceTo(basePosition)
        ) {
          basePosition.copy(mallet.targetPos);
          mallet.moveVelocity.normalize().multiplyScalar(-0.0005); // return bounce slowly
          mallet.targetPos.set(0, 0, 0);
          mallet.moveState = (mallet.moveState + 1) % 3;
        } else {
          basePosition.set(newPosition.x, newPosition.y, newPosition.z);
        }
      }

      const prevPosition = mallet.boundingSphere.center.clone();
      mallet.object3D.getWorldPosition(mallet.boundingSphere.center);

      //check collision
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (key.boundingBox.intersectsSphere(mallet.boundingSphere)) {
          const movementVector = prevPosition
            .clone()
            .sub(mallet.boundingSphere.center);
          const movedAmount = movementVector.length();
          if (!(key.state & mallet.bit)) {
            key.state |= mallet.bit;
            MIDI.noteOn(12, key.note, (50000 * movedAmount) / deltaTime, 0);
            MIDI.noteOff(12, key.note, 0.75);
            // hand control vibration
            if (mallet.haptics) {
              mallet.haptics.pulse(0.4, 10);
            }
            if (this.musicFlashCard.component.isActive) {
              clearTimeout(this.musicFlashCard.timeout);
              const keyElem = key.el;
              if (this.musicFlashCard.component.note == key.note) {
                keyElem.setAttribute("material", {
                  color: "#00ff00"
                });
                this.musicFlashCard.timeout = setTimeout(() => {
                  this.musicFlashCard.component.setRandomNote();
                  this.playCurrentFlashcardNote();
                }, 600);
              } else {
                keyElem.setAttribute("material", {
                  color: "#ff0000"
                });
                this.musicFlashCard.timeout = setTimeout(() => {
                  this.playCurrentFlashcardNote();
                }, 600);
              }
              setTimeout(() => keyElem.setAttribute("material", {
                color: "#481f15"
              }), 600);
            }
          }
          //key.el.setAttribute("material", "emissiveIntensity", "1");

          if (this.settings.malletBounce && (mallet.moveState === 0 || mallet.moveState === 2)) {
            // start mallet bounce
            mallet.targetPos = movementVector;
            // only bounce if key was hit from above
            if (
              prevPosition.y > mallet.boundingSphere.center.y &&
              prevPosition.y - key.boundingBox.max.y > -0.03
            ) {
              mallet.targetPos.set(0, 1, 0);
              mallet.targetPos.applyQuaternion(
                mallet.handEl.object3D.quaternion.clone().inverse()
              );
              mallet.moveVelocity = mallet.targetPos
                .clone()
                .multiplyScalar(0.005); // 5m/s
              mallet.targetPos.multiplyScalar(0.05 + movedAmount); //bounce up at least 5cm
              mallet.moveState = 1;
            }
          }
        } else {
          key.state &= ~mallet.bit;
        }
      }
      if (flashCardButton.boundingBox) {
        if (
          flashCardButton.boundingBox.intersectsSphere(mallet.boundingSphere)
        ) {
          flashCardButton.pressedState |= mallet.bit;
          flashCardButton.buttonMesh.material.opacity = 0.5;
        } else {
          const prevState = flashCardButton.pressedState;
          flashCardButton.pressedState &= ~mallet.bit;
          if (prevState && !flashCardButton.pressedState) {
            flashCardButton.buttonMesh.material.opacity = 1;
            this.musicFlashCard.component.isActive ^= 1;
            if (this.musicFlashCard.component.isActive) {
              flashCardButton.buttonMesh.material.color.setRGB(0.8, 0, 0);
              flashCardButton.elem.setAttribute("text", "value", "Stop");
              clearTimeout(this.musicFlashCard.timeout);
              this.musicFlashCard.timeout = setTimeout(() => {
                this.musicFlashCard.component.setRandomNote();
                this.playCurrentFlashcardNote();
              }, 500);
            } else {
              flashCardButton.buttonMesh.material.color.setRGB(0, 0.8, 0);
              flashCardButton.elem.setAttribute("text", "value", "Start");
            }
          }
        }
      }
    }
  },

  detach: function(child, parent, scene) {
    child.applyMatrix(parent.matrixWorld);
    parent.remove(child);
    scene.add(child);
  },

  attach: function(child, parent, scene) {
    child.applyMatrix(new THREE.Matrix4().getInverse(parent.matrixWorld));
    scene.remove(child);
    parent.add(child);
  },

  setSetting: function(settingName, settingValue) {
    this.settings[settingName] = settingValue;
    localStorage.setItem("instrumentSettings", JSON.stringify(this.settings));
  },

  registerSetting: function(settingName, defaultValue) {
    const storedSettings = localStorage.getItem("instrumentSettings");
    if (storedSettings) {
      const storedValue = JSON.parse(storedSettings)[settingName];
      this.setSetting(settingName, storedValue);
    } else {
      this.setSetting(settingName, defaultValue);
    }
  }
});

AFRAME.registerComponent("music-flashcard", {
  init: function() {
    this.clef = "treble";
    this.isActive = 0;
    this.note = 77;
    const gameController = document.querySelector("a-scene").systems[
      "game-controller"
    ];
    gameController.registerMusicFlashcard(this);
  },

  setRandomNote: function() {
    const clefs = ["treble", "bass"];
    const noteThresholds = {
      treble: {
        min: 62,
        max: 80 + 1
      },
      bass: {
        min: 41,
        max: 59 + 1
      }
    };
    this.clef = clefs[Math.floor(Math.random() * 2)];
    const lowestNote = noteThresholds[this.clef].min;
    const highNoteThreshold = noteThresholds[this.clef].max;
    const prevNote = this.note;
    while (prevNote == this.note) {
      this.note =
        Math.floor(Math.random() * (highNoteThreshold - lowestNote)) +
        lowestNote;
    }
  }
});

AFRAME.registerComponent("key", {
  init: function() {
    const gameController = document.querySelector("a-scene").systems[
      "game-controller"
    ];
    gameController.registerKey(this.el);
  }
});

AFRAME.registerComponent("mallet", {
  schema: {
    rotateDirection: { type: "int", default: 1 },
    xAxisMultiplier: { type: "int", default: 1 }
  },
  init: function() {
    const gameController = document.querySelector("a-scene").systems[
      "game-controller"
    ];
    gameController.registerMallet(
      this.el,
      this.data.rotateDirection,
      this.data.xAxisMultiplier
    );
  }
});
