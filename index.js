/**
 * @class DataLoader
 * @classdesc Class responsible for loading data and triggering events when the data is loaded.
 */
class DataLoader {
    #eventListener; // Private field to store the event listener
    #button = document.querySelector('main button'); // Private field to store the button element
    static instance = null; // Static field to store the singleton instance

    /**
     * Creates an instance of DataLoader.
     * @constructor
     */
    constructor() {
        if (DataLoader.instance) {
            return DataLoader.instance;
        }
        DataLoader.instance = this;
    }

    /**
     * Triggers the data loading process by dispatching a click event on the button.
     */
    load() {
        this.#button.dispatchEvent(
            new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
            })
        );
    }

    /**
     * Sets a callback function to be called when the data is loaded.
     * @param {function} callback - The callback function to be called.
     */
    setDataLoadedCallback(callback) {
        if (this.#eventListener) {
            this.#button.removeEventListener('click', this.#eventListener);
        }
        this.#eventListener = callback;
        this.#button.addEventListener('click', async () => {
            await this.#waitForDataLoad();
            this.#eventListener();
        });
    }

    /**
     * Sets a callback function to be called once when the data is loaded.
     * The callback function will be automatically removed after being called.
     * @param {function} callback - The callback function to be called.
     */
    setDataLoadedCallbackOnce(callback) {
        const eventListener = () => {
            this.#button.removeEventListener('click', eventListener);
            callback();
        };
        this.#button.addEventListener('click', async () => {
            await this.#waitForDataLoad();
            eventListener();
        });
    }

    /**
     * Waits for the data to load by observing changes in the button's disabled attribute.
     * @returns {Promise<void>} - A promise that resolves when the data is loaded.
     */
    async #waitForDataLoad() {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (
                        mutation.type === 'attributes' &&
                        mutation.attributeName === 'disabled' &&
                        !this.#button.disabled
                    ) {
                        observer.disconnect();
                        resolve();
                    }
                });
            });
            observer.observe(this.#button, {attributes: true});
        });
    }
}

/**
 * @class LinkedList
 * @classdesc Class representing a linked list with additional methods.
 */
class LinkedList {
    #nodes = []; // Private field to store the nodes
    #currentIndex = -1; // Private field to store the current index

    /**
     * Sets the nodes of the linked list.
     * @param {Array} nodes - The nodes to be set.
     */
    set nodes(nodes) {
        this.#nodes = nodes;
        if (this.#currentIndex === -1) {
            this.#currentIndex = 0;
        }
    }

    /**
     * Sets the current index of the linked list.
     * @param {number} index - The index to be set.
     */
    set currentIndex(index) {
        if (index >= 0 && index < this.#nodes.length) {
            this.#currentIndex = index;
        }
    }

    /**
     * Gets the current index of the linked list.
     * @returns {number} - The current index.
     */
    get currentIndex() {
        return this.#currentIndex;
    }

    /**
     * Gets the current node of the linked list.
     * @returns {object|null} - The current node or null if the index is out of range.
     */
    get current() {
        if (this.#currentIndex >= 0 && this.#currentIndex < this.#nodes.length) {
            return this.#nodes[this.#currentIndex];
        }
        return null;
    }

    /**
     * Gets the length of the linked list.
     * @returns {number} - The length of the linked list.
     */
    get length() {
        return this.#nodes.length;
    }

    /**
     * Moves to the next node in the linked list.
     */
    next() {
        if (this.#currentIndex < this.#nodes.length - 1) {
            this.#currentIndex++;
        }
    }

    /**
     * Moves to the previous node in the linked list.
     */
    prev() {
        if (this.#currentIndex > 0) {
            this.#currentIndex--;
        }
    }
}

/**
 * @class Player
 * @classdesc Class representing a player with playlist functionality.
 * @extends LinkedList
 */
class Player extends LinkedList {
    /**
     * Creates an instance of Player.
     * @constructor
     * @param {string} elementsSelector - The selector for the elements in the playlist.
     * @param {string} buttonSelector - The selector for the button element in each playlist item.
     */
    constructor(elementsSelector, buttonSelector) {
        super();
        this.elementsSelector = elementsSelector;
        this.buttonSelector = buttonSelector;
        this.dataLoader = new DataLoader();
        this.dataLoader.setDataLoadedCallback(() => {
            this.setCards();
        });
        this.setCards();
    }

    /**
     * Plays the item at the specified index.
     * @param {number} index - The index of the item to be played.
     */
    play(index) {
        this.currentIndex = index - 1;

        // TODO: refactor
        if (index > this.length - 1) {
            this.dataLoader.setDataLoadedCallbackOnce(() => {
                console.log('data loaded', this.length);
                this.play(index);
            });
            this.dataLoader.load();
        } else {
            this.togglePlayback();
        }
    }

    /**
     * Moves to the next item in the playlist and toggles the playback.
     */
    next() {
        super.next();
        if (this.currentIndex === this.length - 1) {
            this.dataLoader.load();
        }
        this.togglePlayback();
    }

    /**
     * Moves to the previous item in the playlist and toggles the playback.
     */
    prev() {
        super.prev();
        this.togglePlayback();
    }

    /**
     * Toggles the playback of the current item.
     */
    togglePlayback() {
        this.current?.togglePlayback();
    }

    /**
     * Sets the cards (playlist items) based on the elements and buttons in the DOM.
     */
    setCards() {
        this.nodes = Array.from(document.querySelectorAll(this.elementsSelector))
            .filter((cardElement) => cardElement.contains(cardElement.querySelector(this.buttonSelector)))
            .map((cardElement, i) => {
                const button = cardElement.querySelector(this.buttonSelector);
                button.onclick = () => {
                    this.currentIndex = i;
                };
                return new Card(button);
            });
    }
}

/**
 * @class Card
 * @classdesc Class representing a card (playlist item) with playback functionality.
 */
class Card {
    #button;

    /**
     * Creates an instance of Card.
     * @constructor
     * @param {HTMLElement} buttonElement - The button element associated with the card.
     */
    constructor(buttonElement) {
        this.#button = buttonElement;
    }

    /**
     * Toggles the playback of the card by dispatching a click event on the button.
     */
    togglePlayback() {
        this.#button.scrollIntoView({behavior: 'smooth', block: 'center'});
        this.#button.dispatchEvent(
            new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true,
            })
        );
    }
}

const player = new Player('#cards-container > div', '[role="button"]');

/**
 * Event listener for keydown events.
 * Handles key presses for controlling the player.
 * @param {KeyboardEvent} event - The keyboard event object.
 */
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') player.next();
    if (event.key === 'ArrowLeft') player.prev();
    if (event.key === 'ArrowDown') player.togglePlayback();
    if (event.key === 'ArrowUp') player.dataLoader.load();
});
