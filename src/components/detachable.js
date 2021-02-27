AFRAME.registerComponent("detachable", {
  schema: {
    parent: { type: "string" },
    detached: { default: false }
  },

  init: function() {
    if (this.data.parent) {
      this.parentObject = document.querySelector(this.data.parent).object3D;
    } else {
      this.parentObject = this.el.object3D.parent;
    }

    this.scene = this.el.sceneEl.object3D;
    this.child = this.el.object3D.children[0];
    this.gameController = this.el.sceneEl.systems["game-controller"];
    let hand = this.parentObject.el.parentElement;

    hand.addEventListener("triggerdown", () => {
      this.el.object3D.rotation.y = 0;
      this.el.object3D.updateMatrixWorld();
      this.detach(this.el.object3D, this.parentObject, this.scene);
    });

    hand.addEventListener("triggerup", () => {
      this.attach(this.el.object3D, this.parentObject, this.scene);
      this.detach(this.child, this.el.object3D, this.scene);
      this.el.object3D.position.set(0, 0, 0);
      this.el.object3D.updateMatrixWorld();
      this.attach(this.child, this.el.object3D, this.scene);
    });
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
  }
});
