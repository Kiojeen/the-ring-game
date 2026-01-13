async function wait(time_ms) {
  return new Promise((resolve) => setTimeout(resolve, time_ms));
}

class HealthBar {
  #healthScore = 3;

  #healthRings = null;

  constructor() {
    this.#healthRings = document.getElementById("life-rings");
    this.#healthRings.replaceChildren();

    for (let i = 0; i < this.#healthScore; i++) {
      const imgElement = document.createElement("img");
      imgElement.src = "/assets/ring.png";
      imgElement.classList.add("life-ring");
      imgElement.alt = `Life Ring ${i}`;

      this.#healthRings.append(imgElement);
    }
  }

  getHealth() {
    return this.#healthScore;
  }

  reduce() {
    const lastRing = this.#healthRings.lastElementChild;

    if (lastRing && this.#healthScore !== 0) {
      --this.#healthScore;
      lastRing.remove();
    }
  }
}

class GameplayMessage {
  #gameMessage = null;

  constructor() {
    this.#gameMessage = document.getElementById("game-message");
    this.show(false);
  }

  show(state) {
    this.#gameMessage.style.display = state === true ? "block" : "none";
  }

  showWithColor(message, color) {
    this.#gameMessage.style.color = color;
    this.show(true);
    this.#gameMessage.innerText = message;
  }

  showPassive(message) {
    this.showWithColor(message, "var(--msg-normal)");
  }

  showDanger(message) {
    this.showWithColor(message, "var(--msg-danger)");
  }

  showGood(message) {
    this.showWithColor(message, "var(--msg-good)");
  }
}

class Hands {
  constructor() {
    this.handsOpenedImg = document.getElementById("hands-opened");
    this.handsClosedImg = document.getElementById("hands-closed");

    this.leftHandHitbox = document.getElementById("left-hand-hitbox");
    this.rightHandHitbox = document.getElementById("right-hand-hitbox");
  }

  isOpen() {
    return this.handsClosedImg.classList.contains("hidden");
  }

  open(state) {
    if (state) {
      this.handsOpenedImg.classList.remove("hidden");
      this.handsClosedImg.classList.add("hidden");
    } else {
      this.handsClosedImg.classList.remove("hidden");
      this.handsOpenedImg.classList.add("hidden");
    }
  }

  addRightHandClickedListener(callback) {
    this.rightHandHitbox.addEventListener("click", callback);
  }

  addLeftHandClickedListener(callback) {
    this.leftHandHitbox.addEventListener("click", callback);
  }

  removeRightHandClickedListener(callback) {
    this.rightHandHitbox.removeEventListener("click", callback);
  }

  removeLeftHandClickedListener(callback) {
    this.leftHandHitbox.removeEventListener("click", callback);
  }
}

class Ring {
  #sideClasses = {
    right: "ring-right",
    left: "ring-left",
    middle: "ring-middle",
  };

  constructor() {
    this.gameRing = document.getElementById("game-ring");
  }

  setRingSide(side) {
    for (const [side, className] of Object.entries(this.#sideClasses)) {
      if (this.gameRing.classList.contains(className)) {
        this.gameRing.classList.remove(className);
      }
    }

    this.gameRing.classList.add(this.#sideClasses[side]);
  }

  showRing(state) {
    if (state) {
      this.gameRing.classList.remove("hidden");
    } else {
      this.gameRing.classList.add("hidden");
    }
  }
}

class Game {
  // fields
  #gameState = "stopped";
  #ringHidden = false;
  #ringSide = "middle";
  #level = 0;
  #maxLevel = 10;

  // classes
  #hands = null;
  #ring = null;
  #gameScore = null;
  #healthBar = null;
  #gameplayMessage = null;

  // game messages
  #CLICK_TO_PLAY = "Click Start To Play";
  #GIVE_UP = "Giving up...";
  #YOU_LOST = "Opps.. Wrong guess :(";
  #YOU_WON = "Congrats!!! You won!!!";
  #GAME_OVER = "Game Over :<";
  #GOOD_JOB = "Good Job!!!";

  constructor() {
    this.#hands = new Hands();
    this.#ring = new Ring();
    this.#healthBar = new HealthBar();
    this.#gameplayMessage = new GameplayMessage();

    this.#gameplayMessage.showPassive(this.#CLICK_TO_PLAY);

    this.boundRightHandHandler = this.#handleRightHand.bind(this);
    this.boundLeftHandHandler = this.#handleLeftHand.bind(this);

    this.#gameScore = document.getElementById("game-score");
  }

  #updateScore(score) {
    this.#gameScore.innerText = `Score: ${score} / ${this.#maxLevel}`;
  }

  #handleRightHand() {
    if (this.#ringHidden === false) return;
    this.#ringHidden = false;

    if (this.#ringSide === "right") {
      this.winLevel();
    } else {
      this.loseLevel();
    }
  }

  #handleLeftHand() {
    if (this.#ringHidden === false) return;
    this.#ringHidden = false;

    if (this.#ringSide === "left") {
      this.winLevel();
    } else {
      this.loseLevel();
    }
  }

  loseLevel() {
    if (this.#healthBar.getHealth() > 1) {
      this.#healthBar.reduce();
      this.#gameplayMessage.showDanger(this.#YOU_LOST);
      void wait(1000).then(() => {
        this.hideRing();
        this.#gameplayMessage.show(false);
      });
    } else {
      this.#healthBar.reduce();
      this.#gameplayMessage.showDanger(this.#GAME_OVER);
      wait(3000).then(() => this.stop());
    }
  }

  winLevel() {
    if (this.#level === this.#maxLevel) {
      void wait(1000).then(() => {
        this.#gameplayMessage.showGood(this.#YOU_WON);
        this.#ring.showRing(true);
        this.#hands.open(true);
        void wait(3000).then(() => this.stop());
      });
    } else {
      this.#gameplayMessage.showGood(this.#GOOD_JOB);
      this.nextLevel();
      void wait(1000).then(() => this.#gameplayMessage.show(false));
    }
  }

  nextLevel() {
    this.#updateScore(this.#level);
    ++this.#level;
    this.hideRing();
  }

  hideRing() {
    this.#ring.showRing(true);
    this.#hands.open(true);
    void wait(2000).then(() => {
      this.#ringSide =
        window.crypto.getRandomValues(new Uint8Array(1))[0] % 2 === 0
          ? "right"
          : "left";
      this.#ring.showRing(false);
      this.#ring.setRingSide(this.#ringSide);
      this.#hands.open(false);
      this.#ringHidden = true;
    });
  }

  getState() {
    return this.#gameState;
  }

  giveUp() {
    this.#gameplayMessage.showDanger(this.#GIVE_UP);
    void wait(1000).then(() => this.stop());
  }

  start() {
    this.#level = 0;
    this.#gameState = "running";
    this.#gameplayMessage.show(false);
    this.#hands.addRightHandClickedListener(this.boundRightHandHandler);
    this.#hands.addLeftHandClickedListener(this.boundLeftHandHandler);
    this.nextLevel();
  }

  stop() {
    this.#gameState = "stopped";

    this.#ring.showRing(true);
    this.#hands.open(true);
    void wait(1000).then(() => {
      this.#ring.setRingSide("middle");
      this.#gameplayMessage.showPassive(this.#CLICK_TO_PLAY);
      this.#hands.removeRightHandClickedListener(this.boundRightHandHandler);
      this.#hands.removeLeftHandClickedListener(this.boundLeftHandHandler);
    });
  }
}

const game = new Game();

const startButton = document.getElementById("start-button");
startButton.addEventListener("click", () => {
  if (game.getState() === "running") {
    startButton.dataset.state = "inactive";
    startButton.innerText = "Start";
    game.giveUp();
  } else {
    startButton.dataset.state = "active";
    startButton.innerText = "Give Up";
    game.start();
  }
});
